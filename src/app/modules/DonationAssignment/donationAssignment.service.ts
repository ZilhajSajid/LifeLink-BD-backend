import { isAfter, isBefore, isValid, parseISO } from "date-fns";
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
  const scheduledDate = parseISO(scheduledAt);
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

export const DonationAssignmentService = { createDonation };
