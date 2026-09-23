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

export const PaymentController = { getMyPayments };
