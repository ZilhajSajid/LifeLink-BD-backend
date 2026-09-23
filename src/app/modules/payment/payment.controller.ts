import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import httpStatus from "http-status";
import { PaymentService } from "./payment.service";
import { sendResponse } from "../../utils/sendResponse";

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const user = req.user!;
  const { data, meta } = await PaymentService.getMyPayments(query, user);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payments retrieved successfully",
    data: data,
    meta: meta,
  });
});
const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;

  const { data, meta } = await PaymentService.getAllPayments(query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All Payments retrieved successfully",
    data: data,
    meta: meta,
  });
});
const getSinglePayment = catchAsync(async (req: Request, res: Response) => {
  const params = req.params.paymentId as string;
  const user = req.user!;

  const result = await PaymentService.getSinglePayment(params, user);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Single Payment retrieved successfully",
    data: result,
  });
});

export const PaymentController = {
  getMyPayments,
  getAllPayments,
  getSinglePayment,
};
