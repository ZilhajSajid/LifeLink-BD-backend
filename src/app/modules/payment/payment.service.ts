import { Role } from "../../../generated/prisma/enums";
import { PaymentWhereInput } from "../../../generated/prisma/models";
import { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { RequestUser } from "../../middlewares/checkAuth";
import { AppError } from "../../utils/AppError";
import httpStatus from "http-status";

const getMyPayments = async (query: IQuery, user: RequestUser) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;

  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const requester = await prisma.requesterProfile.findUnique({
    where: {
      userId: user.userId,
    },
  });

  if (!requester) {
    throw new AppError(httpStatus.NOT_FOUND, "Requester profile not found");
  }

  const andConditions: PaymentWhereInput[] = [
    {
      request: {
        requesterId: requester.id,
      },
    },
  ];

  const payments = await prisma.payment.findMany({
    where: {
      AND: andConditions,
    },
    take: limit,
    skip,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      request: {
        select: {
          id: true,
          bloodGroup: true,
          unitsRequired: true,
          unitsFulfilled: true,
          urgency: true,
          hospitalName: true,
          city: true,
          requiredDate: true,
          status: true,
        },
      },
    },
  });

  const totalPayments = await prisma.payment.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: payments,
    meta: {
      page,
      limit,
      total: totalPayments,
      totalPages: Math.ceil(totalPayments / limit),
    },
  };
};
const getAllPayments = async (query: IQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;

  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const andConditions: PaymentWhereInput[] = [];

  const payments = await prisma.payment.findMany({
    where: {
      AND: andConditions,
    },
    take: limit,
    skip,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      request: {
        select: {
          id: true,
          bloodGroup: true,
          unitsRequired: true,
          unitsFulfilled: true,
          urgency: true,
          hospitalName: true,
          hospitalAddress: true,
          city: true,
          requiredDate: true,
          status: true,
          requester: {
            select: {
              id: true,
              type: true,
              organizationName: true,
              city: true,
              contactNumber: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const totalPayments = await prisma.payment.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: payments,
    meta: {
      page,
      limit,
      total: totalPayments,
      totalPages: Math.ceil(totalPayments / limit),
    },
  };
};

const getSinglePayment = async (paymentId: string, user: RequestUser) => {
  const payment = await prisma.payment.findUnique({
    where: {
      id: paymentId,
    },
    include: {
      request: {
        select: {
          id: true,
          bloodGroup: true,
          unitsRequired: true,
          unitsFulfilled: true,
          urgency: true,
          hospitalName: true,
          hospitalAddress: true,
          city: true,
          requiredDate: true,
          reason: true,
          status: true,
          requester: {
            select: {
              id: true,
              type: true,
              organizationName: true,
              address: true,
              city: true,
              contactNumber: true,
              userId: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
  }

  if (user.role === Role.REQUESTER) {
    if (payment.request.requester.userId !== user.userId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You are not authorized to view this payment",
      );
    }
  }

  return payment;
};

export const PaymentService = {
  getMyPayments,
  getAllPayments,
  getSinglePayment,
};
