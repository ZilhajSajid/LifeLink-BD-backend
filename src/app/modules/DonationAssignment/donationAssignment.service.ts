import { isAfter, isBefore, isValid } from "date-fns";
import {
  BloodRequestsStatus,
  DonationAssignmentStatus,
  DonationStatus,
  DonorVerificationStatus,
} from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { RequestUser } from "../../middlewares/checkAuth";
import { AppError } from "../../utils/AppError";
import { ICreateDonationPayload } from "./donationAssignment.interface";
import httpStatus from "http-status";
import { getCompatibleDonorGroups } from "../../utils/getCompatibleDonorGroups";
import { IQuery } from "../../interfaces";
import { DonationWhereInput } from "../../../generated/prisma/models";

const createDonation = async (
  payload: ICreateDonationPayload,
  user: RequestUser,
) => {
  const { bloodRequestId, scheduledAt, units } = payload;
  const donorExist = await prisma.donor.findUnique({
    where: { userId: user.userId },
  });
  if (!donorExist) {
    throw new AppError(httpStatus.NOT_FOUND, "Donor Profile not found");
  }
  if (donorExist.verificationStatus !== DonorVerificationStatus.APPROVED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Only approved donors can donate blood",
    );
  }
  if (!donorExist.isAvailable) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Donor is currently unavailable",
    );
  }

  const bloodRequest = await prisma.bloodRequest.findUnique({
    where: { id: bloodRequestId },
  });
  if (!bloodRequest) {
    throw new AppError(httpStatus.NOT_FOUND, "Blood request not found");
  }

  const remainingUnits =
    bloodRequest.unitsRequired - bloodRequest.unitsFulfilled;

  if (units > remainingUnits) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Only ${remainingUnits} units of blood is required`,
    );
  }
  if (units <= 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Donation units must be greater than zero",
    );
  }
  if (!Number.isInteger(units)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Donation units must be a whole number",
    );
  }
  const unavailableStatuses: BloodRequestsStatus[] = [
    BloodRequestsStatus.CANCELLED,
    BloodRequestsStatus.EXPIRED,
    BloodRequestsStatus.FULFILLED,
    BloodRequestsStatus.REJECTED,
  ];

  if (unavailableStatuses.includes(bloodRequest.status)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This blood request is no longer available",
    );
  }
  const now = new Date();

  if (isBefore(bloodRequest.requiredDate, now)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "The required date for this blood request has already passed",
    );
  }
  const scheduledDate = scheduledAt;
  if (!isValid(scheduledDate)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid scheduled date");
  }
  if (isBefore(scheduledDate, now)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Scheduled donation time cannot be in the past",
    );
  }
  if (isAfter(scheduledDate, bloodRequest.requiredDate)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Donation cannot be scheduled after the blood request required date",
    );
  }
  const compatibleDonorGroups = getCompatibleDonorGroups(
    bloodRequest.bloodGroup,
  );

  if (!compatibleDonorGroups.includes(donorExist.bloodGroup)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Your blood group ${donorExist.bloodGroup} is not compatible with this blood request`,
    );
  }
  const existingAssignment = await prisma.donationAssignment.findUnique({
    where: {
      bloodRequestId_donorId: {
        bloodRequestId,
        donorId: donorExist.id,
      },
    },
  });

  if (existingAssignment) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You have already accepted this blood request",
    );
  }
  const transactionResult = await prisma.$transaction(async (tx) => {
    const assignment = await tx.donationAssignment.create({
      data: {
        bloodRequestId,
        donorId: donorExist.id,
        status: DonationAssignmentStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
    });
    const donation = await tx.donation.create({
      data: {
        units,
        scheduledAt: scheduledDate,
        status: DonationStatus.SCHEDULED,
        assignmentId: assignment.id,
      },

      include: {
        assignment: {
          include: {
            donor: {
              include: {
                user: {
                  omit: {
                    password: true,
                  },
                },
              },
            },
            bloodRequest: true,
          },
        },
      },
    });

    return donation;
  });
  return transactionResult;
};

const getMyDonations = async (query: IQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const andConditions: DonationWhereInput[] = [];

  if (query.status) {
    andConditions.push({
      status: query.status,
    });
  }

  if (query.searchTerm) {
    andConditions.push({
      assignment: {
        bloodRequest: {
          OR: [
            {
              hospitalName: {
                contains: query.searchTerm,
                mode: "insensitive",
              },
            },
            {
              hospitalAddress: {
                contains: query.searchTerm,
                mode: "insensitive",
              },
            },
            {
              city: {
                contains: query.searchTerm,
                mode: "insensitive",
              },
            },
          ],
        },
      },
    });
  }

  const donations = await prisma.donation.findMany({
    where: {
      AND: andConditions,
    },

    take: limit,

    skip,

    orderBy: {
      [sortBy]: sortOrder,
    },

    include: {
      assignment: {
        select: {
          id: true,
          status: true,
          acceptedAt: true,
          completedAt: true,

          bloodRequest: {
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
            },
          },
        },
      },
    },
  });

  const totalDonations = await prisma.donation.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: donations,

    meta: {
      page,
      limit,
      total: totalDonations,
      totalPages: Math.ceil(totalDonations / limit),
    },
  };
};

const getDonationById = async (assignmentId: string) => {
  const donation = await prisma.donation.findUnique({
    where: {
      id: assignmentId,
    },
    include: {
      assignment: {
        include: {
          bloodRequest: {
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
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!donation) {
    throw new AppError(httpStatus.NOT_FOUND, "Donation not found");
  }

  return donation;
};

const completeDonation = async (donationId: string, userId: string) => {
  const donor = await prisma.donor.findUnique({
    where: {
      userId,
    },
  });

  if (!donor) {
    throw new AppError(httpStatus.NOT_FOUND, "Donor profile not found");
  }

  const donation = await prisma.donation.findFirst({
    where: {
      id: donationId,
      assignment: {
        donorId: donor.id,
      },
    },
    include: {
      assignment: {
        include: {
          bloodRequest: true,
        },
      },
    },
  });

  if (!donation) {
    throw new AppError(httpStatus.NOT_FOUND, "Donation not found");
  }

  if (donation.status === DonationStatus.COMPLETED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Donation has already been completed",
    );
  }

  if (donation.status === DonationStatus.CANCELLED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cancelled donation cannot be completed",
    );
  }

  if (donation.assignment.status !== DonationAssignmentStatus.ACCEPTED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Donation assignment is not accepted",
    );
  }

  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const completedDonation = await tx.donation.update({
      where: {
        id: donation.id,
      },
      data: {
        status: DonationStatus.COMPLETED,
        donatedAt: now,
      },
    });

    await tx.donationAssignment.update({
      where: {
        id: donation.assignmentId,
      },
      data: {
        status: DonationAssignmentStatus.COMPLETED,
        completedAt: now,
      },
    });

    await tx.donor.update({
      where: {
        id: donor.id,
      },
      data: {
        lastDonationDate: now,
        totalDonations: {
          increment: 1,
        },
        isAvailable: false,
      },
    });

    const bloodRequest = donation.assignment.bloodRequest;

    const newUnitsFulfilled = bloodRequest.unitsFulfilled + donation.units;

    const newStatus =
      newUnitsFulfilled >= bloodRequest.unitsRequired
        ? BloodRequestsStatus.FULFILLED
        : BloodRequestsStatus.PARTIALLY_FULFILLED;

    await tx.bloodRequest.update({
      where: {
        id: bloodRequest.id,
      },
      data: {
        unitsFulfilled: newUnitsFulfilled,
        status: newStatus,
      },
    });

    return completedDonation;
  });

  return result;
};

const deleteDonation = async (donationId: string, userId: string) => {
  const donor = await prisma.donor.findUnique({
    where: {
      userId,
    },
  });

  if (!donor) {
    throw new AppError(httpStatus.NOT_FOUND, "Donor profile not found");
  }

  const donation = await prisma.donation.findFirst({
    where: {
      id: donationId,
      assignment: {
        donorId: donor.id,
      },
    },
    include: {
      assignment: {
        include: {
          bloodRequest: true,
        },
      },
    },
  });

  if (!donation) {
    throw new AppError(httpStatus.NOT_FOUND, "Donation not found");
  }

  if (donation.status === DonationStatus.COMPLETED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Completed donation cannot be cancelled",
    );
  }

  if (donation.status === DonationStatus.CANCELLED) {
    throw new AppError(httpStatus.BAD_REQUEST, "Donation is already cancelled");
  }

  if (donation.assignment.status !== DonationAssignmentStatus.ACCEPTED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Only an accepted donation can be cancelled",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const cancelledDonation = await tx.donation.update({
      where: {
        id: donation.id,
      },
      data: {
        status: DonationStatus.CANCELLED,
      },
    });

    await tx.donationAssignment.update({
      where: {
        id: donation.assignmentId,
      },
      data: {
        status: DonationAssignmentStatus.CANCELLED,
      },
    });

    return cancelledDonation;
  });

  return result;
};

export const DonationAssignmentService = {
  createDonation,
  getMyDonations,
  getDonationById,
  completeDonation,
  deleteDonation,
};
