import type { UploadApiResponse } from "cloudinary";
import bcrypt from "bcrypt";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { cloudinary } from "../../lib/cloudinary";
import config from "../../config";
import {
  BloodGroupType,
  DonorVerificationStatus,
  Gender,
  Role,
} from "../../../generated/prisma/enums";
import type {
  IApplyAsDonor,
  IApproveDonorPayload,
  IVerifyDonorEmailPayload,
} from "./donor.interface";
import crypto from "crypto";
import { redisClient } from "../../lib/redis";
import ejs from "ejs";
import path from "path";
import { transporter } from "../../lib/nodemailer";
import { RequestUser } from "../../middlewares/checkAuth";
import { IQuery } from "../../interfaces";
import { DonorWhereInput } from "../../../generated/prisma/models";

const applyAsDonor = async (
  payload: IApplyAsDonor,
  certificate: Express.Multer.File | null,
  additionalFiles: Express.Multer.File[],
) => {
  const isUserExist = await prisma.user.findUnique({
    where: { email: payload.user.email },
  });
  if (isUserExist) {
    throw new AppError(
      httpStatus.CONFLICT,
      "User with this email already exists",
    );
  }
  const certificateUploadResult = await new Promise<UploadApiResponse>(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "auto",
          },
          async (error, result) => {
            if (error) {
              return reject(error);
            }
            if (!result) {
              return reject(
                new AppError(
                  httpStatus.INTERNAL_SERVER_ERROR,
                  "No result returned from cloudinary",
                ),
              );
            }
            resolve(result);
          },
        )
        .end(certificate?.buffer);
    },
  );

  const additionalFilesUploadResult = await Promise.all(
    additionalFiles.map((file) => {
      return new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: "auto",
            },
            async (error, result) => {
              if (error) {
                return reject(error);
              }
              if (!result) {
                return reject(
                  new AppError(
                    httpStatus.INTERNAL_SERVER_ERROR,
                    "No result returned from cloudinary",
                  ),
                );
              }
              resolve(result);
            },
          )
          .end(file.buffer);
      });
    }),
  );

  const randomDonorPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(
    randomDonorPassword,
    Number(config.bcrypt_salt_rounds),
  );

  const donorApplication = await prisma.user.create({
    data: {
      ...payload.user,
      password: hashedPassword,
      role: Role.DONOR,
      needPasswordChange: true,
      donor: {
        create: {
          ...payload.donor,
          dateOfBirth: payload.donor.dateOfBirth
            ? new Date(payload.donor.dateOfBirth)
            : undefined,
          certificate: certificateUploadResult.secure_url,
          certificatePublicId: certificateUploadResult.public_id,
          additionalFiles: additionalFilesUploadResult.map((file) => ({
            url: file.secure_url,
            publicId: file.public_id,
          })),
        },
      },
    },
    include: { donor: true },
    omit: { password: true },
  });

  const expirationSeconds = 60 * 60;

  const otpKey = `donor-application-otp:${payload.user.email}`;
  const otpValue = crypto.randomInt(100000, 1000000).toString();
  await redisClient.set(otpKey, otpValue, {
    expiration: { type: "EX", value: expirationSeconds },
  });
  const templatePath = path.join(
    process.cwd(),
    "src/app/templates/register-user-otp.ejs",
  );

  const templateData = {
    name: payload.user.name,
    email: payload.user.email,
    otp: otpValue,
    expirationMinutes: expirationSeconds / 60,
  };

  const html = await ejs.renderFile(templatePath, templateData);

  await transporter.sendMail({
    from: config.email_sender,
    to: payload.user.email,
    subject: "Donor Application - Email Verification",
    html,
  });

  return donorApplication;
};
const verifyDonorEmail = async (payload: IVerifyDonorEmailPayload) => {
  const otp = payload.otp;
  const email = payload.email;

  const isUserExist = await prisma.user.findUnique({
    where: { email, role: Role.DONOR },
  });

  if (!isUserExist) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Doctor Application not found! Please apply again",
    );
  }
  if (isUserExist.emailVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "Email already verified");
  }

  const otpKey = `donor-application-otp:${email}`;

  const redisOtp = await redisClient.get(otpKey);

  if (!redisOtp) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Otp expired,Your application window has closed, Please apply again",
    );
  }

  if (redisOtp !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, "Otp does not matched");
  }
  await redisClient.del(otpKey);

  const verifiedUser = await prisma.user.update({
    where: { id: isUserExist.id },
    data: { emailVerified: true },
    omit: { password: true },
    include: { donor: true },
  });

  return verifiedUser;
};

const approveDonor = async (
  payload: IApproveDonorPayload,
  reviewer: RequestUser,
) => {
  const { donorId, verificationStatus, rejectionReason } = payload;

  const existingDonor = await prisma.donor.findUnique({
    where: { id: donorId },
    include: { user: true },
  });

  if (!existingDonor) {
    throw new AppError(httpStatus.NOT_FOUND, "Donor application not found");
  }
  if (existingDonor.isDeleted) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Donor application has been deleted",
    );
  }
  if (!existingDonor.user.emailVerified) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Donor email is not verified. Application cannot be reviewed",
    );
  }
  if (existingDonor.verificationStatus !== DonorVerificationStatus.PENDING) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Donor application has already been ${existingDonor.verificationStatus.toLowerCase()}`,
    );
  }
  if (
    verificationStatus === DonorVerificationStatus.REJECTED &&
    !rejectionReason
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Rejection reason is required while rejecting a donor",
    );
  }
  const updatedDonor = await prisma.donor.update({
    where: { id: donorId },
    data: {
      verificationStatus,
      rejectionReason:
        verificationStatus === DonorVerificationStatus.REJECTED
          ? rejectionReason
          : null,
      reviewedBy: reviewer.userId,
      reviewedAt: new Date(),
    },
    include: { user: true },
  });
  const isApproved = verificationStatus === DonorVerificationStatus.APPROVED;
  const templatePath = path.join(
    process.cwd(),
    `src/app/templates/${isApproved ? "donor-approve.ejs" : "donor-reject.ejs"}`,
  );

  const templateData = {
    name: updatedDonor.user.name,
    email: updatedDonor.user.email,
  };

  const html = await ejs.renderFile(templatePath, templateData);

  await transporter.sendMail({
    from: config.email_sender,
    to: updatedDonor.user.email,
    subject: isApproved
      ? "Your Donor application has been approved"
      : "Your Donor application has been rejected",
    html,
  });
  return updatedDonor;
};

const getAllDonors = async (query: IQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const andConditions: DonorWhereInput[] = [];
  if (query.searchTerm) {
    andConditions.push({
      OR: [
        { address: { contains: query.searchTerm, mode: "insensitive" } },
        { city: { contains: query.searchTerm, mode: "insensitive" } },
      ],
    });
  }

  if (query.email) {
    andConditions.push({
      user: {
        email: {
          equals: query.email,
          mode: "insensitive",
        },
      },
    });
  }
  if (query.bloodGroup) {
    andConditions.push({
      bloodGroup: query.bloodGroup as BloodGroupType,
    });
  }

  if (query.gender) {
    andConditions.push({
      gender: query.gender as Gender,
    });
  }

  if (query.verificationStatus) {
    andConditions.push({
      verificationStatus: query.verificationStatus as DonorVerificationStatus,
    });
  }

  if (query.isAvailable !== undefined) {
    andConditions.push({
      isAvailable: query.isAvailable === "true",
    });
  }

  if (query.totalDonations) {
    andConditions.push({
      totalDonations: Number(query.totalDonations),
    });
  }
  andConditions.push({ isDeleted: false });

  const allDonors = await prisma.donor.findMany({
    where: { AND: andConditions.length > 0 ? andConditions : undefined },
    take: limit,
    skip: skip,
    orderBy: { [sortBy]: sortOrder },
    include: { user: { omit: { password: true } } },
  });
  const totalDonorsCount = await prisma.donor.count({
    where: { AND: andConditions },
  });
  return {
    data: allDonors,
    meta: {
      page: page,
      limit: limit,
      total: totalDonorsCount,
      totalPages: Math.ceil(totalDonorsCount / limit),
    },
  };
};

export const DonorService = {
  applyAsDonor,
  verifyDonorEmail,
  approveDonor,
  getAllDonors,
};
