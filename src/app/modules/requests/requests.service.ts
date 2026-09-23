import {
  BloodRequestsStatus,
  PaymentStatus,
} from "../../../generated/prisma/enums";
import config from "../../config";
import { getBkashIdToken } from "../../lib/bkash";
import { prisma } from "../../lib/prisma";
import { RequestUser } from "../../middlewares/checkAuth";
import { AppError } from "../../utils/AppError";
import httpStatus from "http-status";
import {
  ICancelRequestPayload,
  ICreateRequestsPayload,
} from "./requests.interface";

const createRequests = async (
  payload: ICreateRequestsPayload,
  user: RequestUser,
) => {
  const requester = await prisma.requesterProfile.findUnique({
    where: { userId: user.userId },
  });

  if (!requester) {
    throw new AppError(httpStatus.NOT_FOUND, "Requester profile not found");
  }
  const transactionResult = await prisma.$transaction(async (tx) => {
    // business logic
    const bloodRequest = await tx.bloodRequest.create({
      data: {
        bloodGroup: payload.bloodGroup,
        unitsRequired: payload.unitsRequired,
        urgency: payload.urgency,
        requiredDate: new Date(payload.requiredDate),

        hospitalName: payload.hospitalName,
        hospitalAddress: payload.hospitalAddress,
        city: payload.city,
        reason: payload.reason,

        requesterId: requester.id,

        status: BloodRequestsStatus.PENDING,
      },
    });

    const bkashIdToken = await getBkashIdToken();
    if (!bkashIdToken) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "No Bkash id token found",
      );
    }
    const bkashCreatePaymentResponse = await fetch(
      `${config.bkash_base_url}/tokenized/checkout/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: bkashIdToken,
          "X-App-Key": config.bkash_app_key,
        },
        body: JSON.stringify({
          mode: "0011",
          payerReference: user.email,
          callbackURL: `${config.bkash_callback_url}/requests/create-requests/payment/callback`,
          merchantAssociationInfo: "MI05MID54RF09123456One",
          amount: "500",
          currency: "BDT",
          intent: "sale",
          merchantInvoiceNumber: bloodRequest.id,
        }),
      },
    );

    const bkashCreatePaymentResult = await bkashCreatePaymentResponse.json();

    // payment model create
    await tx.payment.create({
      data: {
        merchantInvoiceNumber: bkashCreatePaymentResult.merchantInvoiceNumber,
        requestId: bloodRequest.id,
        amount: "500",
        gatewayResponse: bkashCreatePaymentResult,
        bkashPaymentId: bkashCreatePaymentResult.paymentID,
        payerReference: user.email,
      },
    });

    return { paymentUrl: bkashCreatePaymentResult.bkashURL };
  });
  return transactionResult;
};

const payExistingRequests = async (user: RequestUser, payload: any) => {
  const requestId = payload.requestId;
  const existingRequest = await prisma.bloodRequest.findUnique({
    where: { id: requestId },
  });
  if (!existingRequest) {
    throw new AppError(httpStatus.NOT_FOUND, "Blood Requests does not exist");
  }
  if (existingRequest.status !== BloodRequestsStatus.PENDING) {
    throw new AppError(httpStatus.CONFLICT, "Blood Request is not pending");
  }
  const bkashIdToken = await getBkashIdToken();
  if (!bkashIdToken) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "No Bkash id token found",
    );
  }
  const bkashCreatePaymentResponse = await fetch(
    `${config.bkash_base_url}/tokenized/checkout/create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: bkashIdToken,
        "X-App-Key": config.bkash_app_key,
      },
      body: JSON.stringify({
        mode: "0011",
        payerReference: user.email,
        callbackURL: `${config.bkash_callback_url}/requests/create-requests/payment/callback`,
        merchantAssociationInfo: "MI05MID54RF09123456One",
        amount: "500",
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: existingRequest.id,
      }),
    },
  );

  const bkashCreatePaymentResult = await bkashCreatePaymentResponse.json();

  await prisma.payment.update({
    where: { requestId: existingRequest.id },
    data: {
      merchantInvoiceNumber: bkashCreatePaymentResult.merchantInvoiceNumber,
      gatewayResponse: bkashCreatePaymentResult,
      bkashPaymentId: bkashCreatePaymentResult.paymentID,
    },
  });

  return {
    paymentUrl: bkashCreatePaymentResult.bkashURL,
  };
};

const createRequestsCallback = async (query: Record<string, any>) => {
  const transactionResult = await prisma.$transaction(async (tx) => {
    const paymentId = query.paymentID;
    if (!paymentId) {
      throw new AppError(httpStatus.BAD_REQUEST, "payment id missing");
    }
    const status = query.status;
    if (!status) {
      throw new AppError(httpStatus.BAD_REQUEST, "Payment status is missing");
    }

    const bkashIdToken = await getBkashIdToken();
    if (!bkashIdToken) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "No Bkash id token found",
      );
    }

    const executedPaymentResponse = await fetch(
      `${config.bkash_base_url}/tokenized/checkout/execute`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: bkashIdToken,
          "X-App-Key": config.bkash_app_key,
        },
        body: JSON.stringify({
          paymentID: paymentId,
        }),
      },
    );

    const executedPaymentResult = await executedPaymentResponse.json();

    if (status === "success") {
      await tx.bloodRequest.update({
        where: { id: executedPaymentResult.merchantInvoiceNumber },
        data: {
          status: BloodRequestsStatus.CONFIRMED,
        },
      });
      await tx.payment.update({
        where: {
          requestId: executedPaymentResult.merchantInvoiceNumber,
          bkashPaymentId: paymentId,
        },
        data: {
          status: PaymentStatus.PAID,
          bkashTrxID: executedPaymentResult.trxID,
          paidAt: executedPaymentResult.paymentExecuteTime,
          gatewayResponse: executedPaymentResult,
        },
      });
      return {
        executedPaymentResult,
        redirectUrl: `${config.frontend_url}/dashboard/my-requests?status=success`,
      };
    } else if (status === "failure") {
      await tx.payment.update({
        where: {
          bkashPaymentId: paymentId,
        },
        data: {
          status: PaymentStatus.FAILED,
          gatewayResponse: executedPaymentResult,
        },
      });
      return {
        redirectUrl: `${config.frontend_url}/dashboard/my-requests?status=failure`,
      };
    } else if (status === "cancel") {
      await tx.payment.update({
        where: {
          bkashPaymentId: paymentId,
        },
        data: {
          status: PaymentStatus.CANCELLED,
          gatewayResponse: executedPaymentResult,
        },
      });
      return {
        executedPaymentResult,
        redirectUrl: `${config.frontend_url}/dashboard/my-requests?status=cancel`,
      };
    } else {
      return {
        executedPaymentResult,
        redirectUrl: `${config.frontend_url}/dashboard/my-requests?error=payment-failed`,
      };
    }
  });
  return transactionResult;
};

const cancelRequests = async (payload: ICancelRequestPayload) => {
  const transactionResult = await prisma.$transaction(async (tx) => {
    const requestId = payload.requestId;
    const existingRequest = await tx.bloodRequest.findUnique({
      where: { id: requestId },
      include: { payment: true },
    });
    if (!existingRequest) {
      throw new AppError(httpStatus.NOT_FOUND, "Blood Requests does not exist");
    }

    if (
      existingRequest.status === BloodRequestsStatus.MATCHING ||
      existingRequest.status === BloodRequestsStatus.FULFILLED
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Blood Requests Matching or Fulfilled",
      );
    }

    if (existingRequest.status === BloodRequestsStatus.CANCELLED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Blood Requests already canceled",
      );
    }

    const updatedRequest = await tx.bloodRequest.update({
      where: { id: existingRequest.id },
      data: {
        status: BloodRequestsStatus.CANCELLED,
      },
    });

    const bkashIdToken = await getBkashIdToken();
    if (!bkashIdToken) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "No Bkash id token found",
      );
    }
    const bkashRefundPaymentResponse = await fetch(
      `${config.bkash_base_url}/tokenized/checkout/payment/refund`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: bkashIdToken,
          "X-App-Key": config.bkash_app_key,
        },
        body: JSON.stringify({
          paymentID: existingRequest.payment?.bkashPaymentId,
          trxID: existingRequest.payment?.bkashTrxID,
          amount: existingRequest.payment?.amount.toString(),
          sku: "Blood Request Cancellation",
          reason: "Requester cancelled blood request",
        }),
      },
    );

    const bkashRefundPaymentResult = await bkashRefundPaymentResponse.json();
    console.log({ bkashRefundPaymentResult });
    const updatedPayment = await tx.payment.update({
      where: { requestId: existingRequest.id },
      data: {
        refundTrxId: bkashRefundPaymentResult.refundTrxID,
        refundAt: bkashRefundPaymentResult.completedTime,
        refundAmount: bkashRefundPaymentResult.amount,
        refundReason: "Requester cancelled blood request",
        status: PaymentStatus.REFUNDED,
        gatewayResponse: bkashRefundPaymentResult,
      },
    });

    return {
      request: updatedRequest,
      payment: updatedPayment,
    };
  });

  return transactionResult;
};

export const RequestsService = {
  createRequests,
  payExistingRequests,
  cancelRequests,
  createRequestsCallback,
};
