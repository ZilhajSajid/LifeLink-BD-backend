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

export const DonationAssignmentController = { createDonation };
