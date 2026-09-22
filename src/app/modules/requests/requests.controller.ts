import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { RequestsService } from "./requests.service";

const createRequests = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const user = req.user!;

  const result = await RequestsService.createRequests(payload, user);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blood Request created successfully",
    data: result,
  });
});
const payExistingRequests = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const user = req.user!;

  const result = await RequestsService.payExistingRequests(user, payload);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blood request payment initiated",
    data: result,
  });
});
const cancelRequests = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const result = await RequestsService.cancelRequests(payload);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blood request cancelled and refunded",
    data: result,
  });
});

const createRequestsCallback = catchAsync(
  async (req: Request, res: Response) => {
    const { redirectUrl } = await RequestsService.createRequestsCallback(
      req.query,
    );

    res.redirect(redirectUrl);
  },
);

export const RequestsController = {
  createRequests,
  payExistingRequests,
  cancelRequests,
  createRequestsCallback,
};
