import type { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { AppError } from "../../utils/AppError";
import httpStatus from "http-status";
import { UserServices } from "./user.service";
import { sendResponse } from "../../utils/sendResponse";

const getMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "user information is missing in the request",
      );
    }
    const result = await UserServices.getMeFromDb(user);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User profile fetched successfully",
      data: result,
    });
  },
);
const forgetPassword = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  await UserServices.forgetPassword(payload);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: `otp sent to ${payload.email}`,
    data: null,
  });
});
const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    await UserServices.resetPassword(payload);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Password changed successfully",
      data: null,
    });
  },
);
const uploadProfileImage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      throw new AppError(httpStatus.NOT_FOUND, "No files found");
    }

    const userId = req.user?.userId;

    const result = await UserServices.uploadProfileImage(
      req.file?.buffer,
      userId!,
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Profile picture updated successfully",
      data: result,
    });
  },
);

export const UserController = {
  getMe,
  forgetPassword,
  resetPassword,
  uploadProfileImage,
};
