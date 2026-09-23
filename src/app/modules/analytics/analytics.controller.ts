import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { AnalyticsService } from "./anal,ytics.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const getAdminAnalytics = catchAsync(async (req: Request, res: Response) => {
  const result = await AnalyticsService.getAdminAnalytics();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin analytics retrieved successfully",
    data: result,
  });
});

const getDonorAnalytics = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const result = await AnalyticsService.getDonorAnalytics(user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Donor analytics retrieved successfully",
    data: result,
  });
});

export const AnalyticsController = { getAdminAnalytics, getDonorAnalytics };
