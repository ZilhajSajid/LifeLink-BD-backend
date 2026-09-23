import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { DonationAssignmentService } from "./donationAssignment.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const createDonation = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const user = req.user!;
  const result = await DonationAssignmentService.createDonation(payload, user);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Donation assignment created successfully",
    data: result,
  });
});
const getMyDonation = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;

  const result = await DonationAssignmentService.getMyDonations(query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Donations retrieved successfully",
    data: result,
  });
});
const getDonationById = catchAsync(async (req: Request, res: Response) => {
  const params = req.params.assignmentId as string;

  const result = await DonationAssignmentService.getDonationById(params);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Single Donation retrieved successfully",
    data: result,
  });
});
const completeDonation = catchAsync(async (req: Request, res: Response) => {
  const params = req.params.donationId as string;
  const user = req.user?.userId as string;
  const result = await DonationAssignmentService.completeDonation(params, user);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Donation marked as completed successfully",
    data: result,
  });
});
const deleteDonation = catchAsync(async (req: Request, res: Response) => {
  const params = req.params.donationId as string;
  const user = req.user?.userId as string;
  const result = await DonationAssignmentService.deleteDonation(params,user);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Donation marked as deleted successfully",
    data: result,
  });
});

export const DonationAssignmentController = {
  createDonation,
  getMyDonation,
  getDonationById,
  completeDonation,
  deleteDonation,
};
