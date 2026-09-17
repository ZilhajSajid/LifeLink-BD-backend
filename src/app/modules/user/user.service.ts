import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
  IForgetPasswordPayload,
  IRequestUser,
  IResetPasswordPayload,
} from "./user.interface";
import httpStatus from "http-status";
import crypto from "crypto";
import { redisClient } from "../../lib/redis";
import bcrypt from "bcrypt";
import config from "../../config";
import { transporter } from "../../lib/nodemailer";
import ejs from "ejs";
import path from "path";

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

const forgetPassword = async (payload: IForgetPasswordPayload) => {
  const { email } = payload;

  const isUserExist = await prisma.user.findUnique({
    where: { email },
  });

  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User not Found with this email");
  }
  if (isUserExist.status === "BLOCKED") {
    throw new AppError(httpStatus.FORBIDDEN, "This user is blocked");
  }
  if (!isUserExist.emailVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "User email is not verified");
  }
  if (isUserExist.status === "DELETED" || isUserExist.deletedAt) {
    throw new AppError(httpStatus.FORBIDDEN, "This user is deleted");
  }
  if (isUserExist.authProvider === "GOOGLE" && isUserExist.googleId) {
    throw new AppError(httpStatus.BAD_REQUEST, "This user has google Id");
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  const key = `forget-password-otp:${isUserExist.email}`;

  const expirationSeconds = 5 * 60;

  await redisClient.set(key, otp, {
    expiration: { type: "EX", value: expirationSeconds },
  });

  const templatePath = path.join(
    process.cwd(),
    "src/app/templates/forget-password.ejs",
  );

  const templateData = {
    otp,
    name: isUserExist.name,
    expirationMinutes: expirationSeconds / 60,
  };

  const html = await ejs.renderFile(templatePath, templateData);

  await transporter.sendMail({
    from: config.email_sender,
    to: isUserExist.email,
    subject: "LifeLink BD - Password Reset OTP",
    html,
  });
};

const resetPassword = async (payload: IResetPasswordPayload) => {
  const { email, otp, newPassword } = payload;

  const isUserExist = await prisma.user.findUnique({
    where: { email },
  });

  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User not Found with this email");
  }
  if (isUserExist.status === "BLOCKED") {
    throw new AppError(httpStatus.FORBIDDEN, "This user is blocked");
  }
  if (!isUserExist.emailVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "User email is not verified");
  }
  if (isUserExist.status === "DELETED" || isUserExist.deletedAt) {
    throw new AppError(httpStatus.FORBIDDEN, "This user is deleted");
  }
  if (isUserExist.authProvider === "GOOGLE" && isUserExist.googleId) {
    throw new AppError(httpStatus.BAD_REQUEST, "This user has google Id");
  }

  const key = `forget-password-otp:${isUserExist.email}`;
  const redisOtp = await redisClient.get(key);

  if (!redisOtp) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }
  if (redisOtp !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP didn't match");
  }
  const hashedNewPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds),
  );

  await prisma.user.update({
    where: { email: isUserExist.email },
    data: { password: hashedNewPassword },
  });
  await redisClient.del([key]);

  const templatePath = path.join(
    process.cwd(),
    "src/app/templates/reset-password-success.ejs",
  );

  const templateData = {
    name: isUserExist.name,
  };

  const html = await ejs.renderFile(templatePath, templateData);

  await transporter.sendMail({
    from: config.email_sender,
    to: isUserExist.email,
    subject: "LifeLink BD - Password Changed Successfully",
    html,
  });
};

export const UserServices = { getMeFromDb, forgetPassword, resetPassword };
