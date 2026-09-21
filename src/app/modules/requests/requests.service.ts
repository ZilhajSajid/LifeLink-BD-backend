import config from "../../config";
import { getBkashIdToken } from "../../lib/bkash";
import { AppError } from "../../utils/AppError";
import httpStatus from "http-status";

const createRequests = async () => {
  // business logic

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
        agreementID: "123456",
        mode: "0011",
        payerReference: "01723888888",
        callbackURL: `${config.bkash_callback_url}/requests/create-requests/payment/callback`,
        merchantAssociationInfo: "MI05MID54RF09123456One",
        amount: "500",
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: "Inv1", //request id
      }),
    },
  );

  const bkashCreatePaymentResult = await bkashCreatePaymentResponse.json();

  console.log(bkashCreatePaymentResult);

  return bkashCreatePaymentResult;
};
const createRequestsCallback = async (query: Record<string, any>) => {
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
    return {
      executedPaymentResult,
      redirectUrl: `${config.frontend_url}/dashboard/my-requests?status=success`,
    };
  }
  if (status === "failure") {
    return {
      executedPaymentResult,
      redirectUrl: `${config.frontend_url}/dashboard/my-requests?status=failure`,
    };
  }
  if (status === "cancel") {
    return {
      executedPaymentResult,
      redirectUrl: `${config.frontend_url}/dashboard/my-requests?status=cancel`,
    };
  }

  return {
    executedPaymentResult,
    redirectUrl: `${config.frontend_url}/dashboard/my-requests`,
  };
};

export const RequestsService = { createRequests, createRequestsCallback };
