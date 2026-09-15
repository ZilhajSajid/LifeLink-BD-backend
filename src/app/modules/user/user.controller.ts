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

export const UserController = { getMe };
