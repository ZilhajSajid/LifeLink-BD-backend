import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
  IGoogleLoginPayload,
  ILoginUserPayload,
  IRegisterUserToDbPayload,
  IRequestUser,
} from "./auth.interface";
import httpStatus from "http-status";
import bcrypt from "bcrypt";
import config from "../../config";
import {
  AuthProvider,
  RequesterType,
  Role,
  UserStatus,
} from "../../../generated/prisma/enums";
import { jwtUtils } from "../../utils/jwt";
import type { JwtPayload, SignOptions } from "jsonwebtoken";
import { googleClient } from "../../lib/googleAuth";
import type { TokenPayload } from "google-auth-library";

const registerUserToDb = async (payload: IRegisterUserToDbPayload) => {
  const { name, password } = payload;
  const email = payload.email.trim().toLowerCase();

  const isUserExist = await prisma.user.findUnique({
    where: { email },
  });

  if (isUserExist) {
    throw new AppError(
      httpStatus.CONFLICT,
      "User with this email already exists",
    );
  }

  const hashedPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt_rounds),
  );

  const createdUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: Role.REQUESTER,
      status: UserStatus.ACTIVE,
      emailVerified: false,
      requester: { create: { type: RequesterType.PATIENT } },
    },
    omit: { password: true },
    include: { requester: true },
  });

  const { requester, ...user } = createdUser;

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_secret_expiresIn as SignOptions,
  );
  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_secret_expiresIn as SignOptions,
  );

  return {
    user,
    requester,
    accessToken,
    refreshToken,
  };
};

const loginUserToDb = async (payload: ILoginUserPayload) => {
  const { password } = payload;
  const email = payload.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
  }

  if (user.deletedAt || user.status === UserStatus.DELETED) {
    throw new AppError(httpStatus.FORBIDDEN, "User is deleted");
  }

  const isPasswordMatched = await bcrypt.compare(
    password,
    user.password as string,
  );

  if (!isPasswordMatched) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid credentials");
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_secret_expiresIn as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_secret_expiresIn as SignOptions,
  );

  return {
    accessToken,
    refreshToken,
  };
};

const getMeFromDb = async (user: IRequestUser) => {
  const isUserExists = await prisma.user.findUnique({
    where: {
      id: user.userId,
    },
    include: {
      requester: true,
    },
    omit: {
      password: true,
    },
  });

  if (!isUserExists) {
    throw new Error("User not found");
  }

  return isUserExists;
};

const googleLoginToDb = async (payload: IGoogleLoginPayload) => {
  let googleIdTokenPayload: TokenPayload | null | undefined = null;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: payload.idToken,
      audience: config.google_client_id,
    });
    googleIdTokenPayload = ticket.getPayload();
  } catch (error) {
    console.log("Google id token verification failed", error);
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Invalid or expired google Id token",
    );
  }
  if (!googleIdTokenPayload) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Invalid or Expired google Id token",
    );
  }
  if (!googleIdTokenPayload.email) {
    throw new AppError(httpStatus.BAD_REQUEST, "Google Id not found");
  }
  if (!googleIdTokenPayload.name) {
    throw new AppError(httpStatus.BAD_REQUEST, "Username  not found");
  }

  const isRequesterExistWithGoogleAuth = await prisma.user.findUnique({
    where: {
      email: googleIdTokenPayload.email,
      role: Role.REQUESTER,
      googleId: googleIdTokenPayload.sub,
    },
  });

  let user = isRequesterExistWithGoogleAuth;

  if (!isRequesterExistWithGoogleAuth) {
    const isRequesterExistWithCredentials = await prisma.user.findUnique({
      where: {
        email: googleIdTokenPayload.email,
        role: Role.REQUESTER,
        authProvider: AuthProvider.CREDENTIAL,
      },
    });

    if (isRequesterExistWithCredentials) {
      if (!isRequesterExistWithCredentials.emailVerified) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Email not verified");
      }
      if (isRequesterExistWithCredentials.status === UserStatus.BLOCKED) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          "Your account has been blocked. Please contact support",
        );
      }
      if (
        isRequesterExistWithCredentials.deletedAt ||
        isRequesterExistWithCredentials.status === UserStatus.DELETED
      ) {
        throw new AppError(httpStatus.UNAUTHORIZED, "User is Deleted");
      }
      user = await prisma.user.update({
        where: { id: isRequesterExistWithCredentials.id },
        data: { googleId: googleIdTokenPayload.sub },
      });
    } else {
      user = await prisma.user.create({
        data: {
          name: googleIdTokenPayload.name,
          email: googleIdTokenPayload.email,
          role: Role.REQUESTER,
          googleId: googleIdTokenPayload.sub,
          authProvider: AuthProvider.GOOGLE,
          emailVerified: true,
          requester: { create: { type: RequesterType.PATIENT } },
        },
      });
    }

    user = await prisma.user.create({
      data: {
        name: googleIdTokenPayload.name,
        email: googleIdTokenPayload.email,
        role: Role.REQUESTER,
        googleId: googleIdTokenPayload.sub,
        authProvider: AuthProvider.GOOGLE,
        emailVerified: true,
        requester: { create: { type: RequesterType.PATIENT } },
      },
    });
  }
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Your account has been blocked. Please contact support",
    );
  }
  if (user.deletedAt || user.status === UserStatus.DELETED) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User is Deleted");
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_secret_expiresIn as SignOptions,
  );
  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_secret_expiresIn as SignOptions,
  );

  return {
    accessToken,
    refreshToken,
  };
};

const refreshToken = async (token: string) => {
  const verifiedRefreshToken = jwtUtils.verifyToken(
    token,
    config.jwt_refresh_secret,
  );

  if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
    throw new Error(
      config.node_env === "development"
        ? verifiedRefreshToken.error
        : "Invalid refresh token",
    );
  }

  const data = verifiedRefreshToken.data as JwtPayload;

  const user = await prisma.user.findUnique({
    where: { id: data.userId },
  });

  if (!user || user.deletedAt || user.status !== UserStatus.ACTIVE) {
    throw new Error("User is inactive or not found");
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_secret_expiresIn as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_secret_expiresIn as SignOptions,
  );

  return {
    accessToken,
    refreshToken,
  };
};

export const AuthServices = {
  registerUserToDb,
  loginUserToDb,
  getMeFromDb,
  googleLoginToDb,
  refreshToken,
};
