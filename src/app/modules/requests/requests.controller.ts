import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { RequestsService } from "./requests.service";

const createRequests = catchAsync(async (req: Request, res: Response) => {
  console.log(req.body);
  const result = await RequestsService.createRequests();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "OK",
    data: result,
  });
});
const createRequestsCallback = catchAsync(
  async (req: Request, res: Response) => {
    const { executedPaymentResult, redirectUrl } =
      await RequestsService.createRequestsCallback(req.query);
    console.log({ executedPaymentResult }, "callback controller");
    res.redirect(redirectUrl);
  },
);

export const RequestsController = { createRequests, createRequestsCallback };
