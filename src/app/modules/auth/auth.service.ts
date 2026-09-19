import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
  IGoogleLoginPayload,
  ILoginUserPayload,
  IRegisterUserToDbPayload,
  IVerifyEmailPayload,
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
import crypto from "crypto";
import { redisClient } from "../../lib/redis";
import path from "path";
import { transporter } from "../../lib/nodemailer";
import ejs from "ejs";

const registerUserToDb = async (payload: IRegisterUserToDbPayload) => {
  const { name, password, requester: requesterData } = payload;
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

  const expirationSeconds = 5 * 60;

  const otpKey = `requester-registration-otp:${email}`;
  const otpValue = crypto.randomInt(100000, 1000000).toString();

  await redisClient.set(otpKey, otpValue, {
    expiration: { type: "EX", value: expirationSeconds },
  });

  const requesterRegistrationKey = `requester-registration-data:${email}`;

  const redisUserDataPayload = {
    name,
    email,
    password: hashedPassword,
    requester: requesterData,
  };
  await redisClient.set(
    requesterRegistrationKey,
    JSON.stringify(redisUserDataPayload),
    {
      expiration: { type: "EX", value: expirationSeconds },
    },
  );

  const templatePath = path.join(
    process.cwd(),
    "src/app/templates/register-user-otp.ejs",
  );

  const templateData = {
    name,
    email,
    otp: otpValue,
    expirationMinutes: expirationSeconds / 60,
  };

  const html = await ejs.renderFile(templatePath, templateData);

  await transporter.sendMail({
    from: config.email_sender,
    to: email,
    subject: "LifeLink BD - Email Verification",
    html,
  });
};

const verifyRequesterEmail = async (payload: IVerifyEmailPayload) => {
  const otp = payload.otp;
  const email = payload.email.trim().toLowerCase();

  const isUserExist = await prisma.user.findUnique({
    where: { email },
  });

  if (isUserExist?.emailVerified) {
    throw new AppError(
      httpStatus.CONFLICT,
      "User with this email already verified",
    );
  }
  if (isUserExist?.status === "BLOCKED") {
    throw new AppError(httpStatus.FORBIDDEN, "This user is blocked");
  }

  if (isUserExist?.status === "DELETED" || isUserExist?.deletedAt) {
    throw new AppError(httpStatus.FORBIDDEN, "This user is deleted");
  }

  const otpKey = `requester-registration-otp:${email}`;
  const redisOtp = await redisClient.get(otpKey);

  if (!redisOtp) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }
  if (redisOtp !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP didn't match");
  }
  await redisClient.del(otpKey);

  const requesterRegistrationKey = `requester-registration-data:${email}`;

  const redisRequesterData = await redisClient.get(requesterRegistrationKey);
  if (!redisRequesterData) {
    throw new AppError(httpStatus.NOT_FOUND, "User doesn't exist");
  }

  const requesterPayload: IRegisterUserToDbPayload =
    JSON.parse(redisRequesterData);

  const createdUser = await prisma.user.create({
    data: {
      name: requesterPayload.name,
      email: requesterPayload.email,
      password: requesterPayload.password,
      role: Role.REQUESTER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      requester: {
        create: {
          type: RequesterType.PATIENT,
          contactNumber: requesterPayload?.requester?.contactNumber || "",
        },
      },
    },
    omit: { password: true },
    include: { requester: true },
  });

  await redisClient.del(requesterRegistrationKey);

  const templatePath = path.join(
    process.cwd(),
    "src/app/templates/requester-welcome-email.ejs",
  );

  const templateData = {
    name: createdUser.name,
  };

  const html = await ejs.renderFile(templatePath, templateData);

  await transporter.sendMail({
    from: config.email_sender,
    to: email,
    subject: "Welcome to LifeLink Emergency Healthcare System",
    html,
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

  if (user.password === null && user.googleId !== null) {
    throw new AppError(
      httpStatus.CONFLICT,
      "User already has an account registered with google",
    );
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
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          "User Email is not verified",
        );
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

    const templatePath = path.join(
      process.cwd(),
      "src/app/templates/requester-welcome-email.ejs",
    );

    const templateData = {
      name: user.name,
    };

    const html = await ejs.renderFile(templatePath, templateData);

    await transporter.sendMail({
      from: config.email_sender,
      to: user.email,
      subject: "Welcome to LifeLink Emergency Healthcare System",
      html,
    });
  }
  console.log("email sent");
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
  verifyRequesterEmail,
  loginUserToDb,
  googleLoginToDb,
  refreshToken,
};
