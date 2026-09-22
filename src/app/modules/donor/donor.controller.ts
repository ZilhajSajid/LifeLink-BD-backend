import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { DonorService } from "./donor.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { ApplyAsDonorZodSchema } from "./donor.validation";
import { AppError } from "../../utils/AppError";

const applyAsDonor = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as { [fieldName: string]: Express.Multer.File[] };
  const certificate = files?.["certificate"] ? files?.["certificate"][0] : null;
  const additionalFiles = files?.["additionalFiles"] || [];
  const zodValidationResult = ApplyAsDonorZodSchema.safeParse(
    JSON.parse(req.body.data),
  );
  if (!zodValidationResult.success) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      zodValidationResult.error.issues[0].message,
    );
  }
  const payload = zodValidationResult.data;
  const result = await DonorService.applyAsDonor(
    payload,
    certificate,
    additionalFiles,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Donor application done successfully. Please verify email",
    data: result,
  });
});
const verifyDonorEmail = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const result = await DonorService.verifyDonorEmail(payload);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Donor Email verified successfully!",
    data: result,
  });
});
const approveDonor = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const user = req.user!;

  const result = await DonorService.approveDonor(payload, user);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Donor approved!",
    data: result,
  });
});
const getAllDonors = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await DonorService.getAllDonors(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All Donors retrieved successfully",
    data: data,
    meta: meta,
  });
});

export const DonorController = {
  applyAsDonor,
  verifyDonorEmail,
  approveDonor,
  getAllDonors,
};
