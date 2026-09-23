import {
  BloodRequestsStatus,
  DonationAssignmentStatus,
  DonationStatus,
  DonorVerificationStatus,
  PaymentStatus,
} from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { RequestUser } from "../../middlewares/checkAuth";
import { AppError } from "../../utils/AppError";
import httpStatus from "http-status";

const getAdminAnalytics = async () => {
  const totalDonors = await prisma.donor.count({
    where: {
      isDeleted: false,
    },
  });

  const totalPendingDonors = await prisma.donor.count({
    where: {
      isDeleted: false,
      verificationStatus: DonorVerificationStatus.PENDING,
    },
  });

  const totalApprovedDonors = await prisma.donor.count({
    where: {
      isDeleted: false,
      verificationStatus: DonorVerificationStatus.APPROVED,
    },
  });

  const totalRejectedDonors = await prisma.donor.count({
    where: {
      isDeleted: false,
      verificationStatus: DonorVerificationStatus.REJECTED,
    },
  });

  const totalAvailableDonors = await prisma.donor.count({
    where: {
      isDeleted: false,
      verificationStatus: DonorVerificationStatus.APPROVED,
      isAvailable: true,
    },
  });

  const totalRequesters = await prisma.requesterProfile.count();

  const totalBloodRequests = await prisma.bloodRequest.count();

  const totalPendingRequests = await prisma.bloodRequest.count({
    where: {
      status: BloodRequestsStatus.PENDING,
    },
  });

  const totalConfirmedRequests = await prisma.bloodRequest.count({
    where: {
      status: BloodRequestsStatus.CONFIRMED,
    },
  });

  const totalMatchingRequests = await prisma.bloodRequest.count({
    where: {
      status: BloodRequestsStatus.MATCHING,
    },
  });

  const totalPartiallyFulfilledRequests = await prisma.bloodRequest.count({
    where: {
      status: BloodRequestsStatus.PARTIALLY_FULFILLED,
    },
  });

  const totalFulfilledRequests = await prisma.bloodRequest.count({
    where: {
      status: BloodRequestsStatus.FULFILLED,
    },
  });

  const totalCancelledRequests = await prisma.bloodRequest.count({
    where: {
      status: BloodRequestsStatus.CANCELLED,
    },
  });

  const totalRejectedRequests = await prisma.bloodRequest.count({
    where: {
      status: BloodRequestsStatus.REJECTED,
    },
  });

  const totalExpiredRequests = await prisma.bloodRequest.count({
    where: {
      status: BloodRequestsStatus.EXPIRED,
    },
  });

  const totalDonations = await prisma.donation.count();

  const totalScheduledDonations = await prisma.donation.count({
    where: {
      status: DonationStatus.SCHEDULED,
    },
  });

  const totalCompletedDonations = await prisma.donation.count({
    where: {
      status: DonationStatus.COMPLETED,
    },
  });

  const totalCancelledDonations = await prisma.donation.count({
    where: {
      status: DonationStatus.CANCELLED,
    },
  });

  const totalPayments = await prisma.payment.count();

  const totalPaidPayments = await prisma.payment.count({
    where: {
      status: PaymentStatus.PAID,
    },
  });

  const totalUnpaidPayments = await prisma.payment.count({
    where: {
      status: PaymentStatus.UNPAID,
    },
  });

  const totalFailedPayments = await prisma.payment.count({
    where: {
      status: PaymentStatus.FAILED,
    },
  });

  const totalRevenueResult = await prisma.payment.aggregate({
    where: {
      status: PaymentStatus.PAID,
    },
    _sum: {
      amount: true,
    },
  });

  const totalRevenue = totalRevenueResult._sum.amount?.toNumber() || 0;

  return {
    totalDonors,
    totalPendingDonors,
    totalApprovedDonors,
    totalRejectedDonors,
    totalAvailableDonors,

    totalRequesters,

    totalBloodRequests,
    totalPendingRequests,
    totalConfirmedRequests,
    totalMatchingRequests,
    totalPartiallyFulfilledRequests,
    totalFulfilledRequests,
    totalCancelledRequests,
    totalRejectedRequests,
    totalExpiredRequests,

    totalDonations,
    totalScheduledDonations,
    totalCompletedDonations,
    totalCancelledDonations,

    totalPayments,
    totalPaidPayments,
    totalUnpaidPayments,
    totalFailedPayments,

    totalRevenue,
  };
};
const getDonorAnalytics = async (user: RequestUser) => {
  const donor = await prisma.donor.findUnique({
    where: {
      userId: user.userId,
    },
  });

  if (!donor) {
    throw new AppError(httpStatus.NOT_FOUND, "Donor profile not found");
  }

  // Total donation assignments
  const totalDonationAssignments = await prisma.donationAssignment.count({
    where: {
      donorId: donor.id,
    },
  });

  // Pending donation assignments
  const pendingDonationAssignments = await prisma.donationAssignment.count({
    where: {
      donorId: donor.id,
      status: DonationAssignmentStatus.PENDING,
    },
  });

  const acceptedDonationAssignments = await prisma.donationAssignment.count({
    where: {
      donorId: donor.id,
      status: DonationAssignmentStatus.ACCEPTED,
    },
  });

  const completedDonationAssignments = await prisma.donationAssignment.count({
    where: {
      donorId: donor.id,
      status: DonationAssignmentStatus.COMPLETED,
    },
  });

  const cancelledDonationAssignments = await prisma.donationAssignment.count({
    where: {
      donorId: donor.id,
      status: DonationAssignmentStatus.CANCELLED,
    },
  });

  const totalDonations = await prisma.donation.count({
    where: {
      assignment: {
        donorId: donor.id,
      },
    },
  });

  const scheduledDonations = await prisma.donation.count({
    where: {
      assignment: {
        donorId: donor.id,
      },
      status: DonationStatus.SCHEDULED,
    },
  });

  const completedDonations = await prisma.donation.count({
    where: {
      assignment: {
        donorId: donor.id,
      },
      status: DonationStatus.COMPLETED,
    },
  });

  const cancelledDonations = await prisma.donation.count({
    where: {
      assignment: {
        donorId: donor.id,
      },
      status: DonationStatus.CANCELLED,
    },
  });

  const totalDonatedUnitsResult = await prisma.donation.aggregate({
    where: {
      assignment: {
        donorId: donor.id,
      },
      status: DonationStatus.COMPLETED,
    },
    _sum: {
      units: true,
    },
  });

  const totalDonatedUnits = totalDonatedUnitsResult._sum.units || 0;

  return {
    totalDonationAssignments,
    pendingDonationAssignments,
    acceptedDonationAssignments,
    completedDonationAssignments,
    cancelledDonationAssignments,

    totalDonations,
    scheduledDonations,
    completedDonations,
    cancelledDonations,

    totalDonatedUnits,

    totalLifetimeDonations: donor.totalDonations || 0,
    lastDonationDate: donor.lastDonationDate,
    isAvailable: donor.isAvailable,
  };
};
const getRequesterAnalytics = async (user: RequestUser) => {
  const requester = await prisma.requesterProfile.findUnique({
    where: {
      userId: user.userId,
    },
  });

  if (!requester) {
    throw new AppError(httpStatus.NOT_FOUND, "Requester profile not found");
  }

  const totalBloodRequests = await prisma.bloodRequest.count({
    where: {
      requesterId: requester.id,
    },
  });

  const pendingRequests = await prisma.bloodRequest.count({
    where: {
      requesterId: requester.id,
      status: BloodRequestsStatus.PENDING,
    },
  });

  const confirmedRequests = await prisma.bloodRequest.count({
    where: {
      requesterId: requester.id,
      status: BloodRequestsStatus.CONFIRMED,
    },
  });

  const matchingRequests = await prisma.bloodRequest.count({
    where: {
      requesterId: requester.id,
      status: BloodRequestsStatus.MATCHING,
    },
  });

  // Partially fulfilled requests
  const partiallyFulfilledRequests = await prisma.bloodRequest.count({
    where: {
      requesterId: requester.id,
      status: BloodRequestsStatus.PARTIALLY_FULFILLED,
    },
  });

  // Fulfilled requests
  const fulfilledRequests = await prisma.bloodRequest.count({
    where: {
      requesterId: requester.id,
      status: BloodRequestsStatus.FULFILLED,
    },
  });

  // Cancelled requests
  const cancelledRequests = await prisma.bloodRequest.count({
    where: {
      requesterId: requester.id,
      status: BloodRequestsStatus.CANCELLED,
    },
  });

  // Rejected requests
  const rejectedRequests = await prisma.bloodRequest.count({
    where: {
      requesterId: requester.id,
      status: BloodRequestsStatus.REJECTED,
    },
  });

  // Expired requests
  const expiredRequests = await prisma.bloodRequest.count({
    where: {
      requesterId: requester.id,
      status: BloodRequestsStatus.EXPIRED,
    },
  });

  // Total payments
  const totalPayments = await prisma.payment.count({
    where: {
      request: {
        requesterId: requester.id,
      },
    },
  });

  // Paid payments
  const paidPayments = await prisma.payment.count({
    where: {
      request: {
        requesterId: requester.id,
      },
      status: PaymentStatus.PAID,
    },
  });

  // Unpaid payments
  const unpaidPayments = await prisma.payment.count({
    where: {
      request: {
        requesterId: requester.id,
      },
      status: PaymentStatus.UNPAID,
    },
  });

  // Failed payments
  const failedPayments = await prisma.payment.count({
    where: {
      request: {
        requesterId: requester.id,
      },
      status: PaymentStatus.FAILED,
    },
  });

  // Total amount paid
  const totalAmountPaidResult = await prisma.payment.aggregate({
    where: {
      request: {
        requesterId: requester.id,
      },
      status: PaymentStatus.PAID,
    },
    _sum: {
      amount: true,
    },
  });

  const totalAmountPaid = totalAmountPaidResult._sum.amount?.toNumber() || 0;

  // Total required blood units
  const totalRequiredUnitsResult = await prisma.bloodRequest.aggregate({
    where: {
      requesterId: requester.id,
    },
    _sum: {
      unitsRequired: true,
    },
  });

  const totalRequiredUnits = totalRequiredUnitsResult._sum.unitsRequired || 0;

  // Total fulfilled blood units
  const totalFulfilledUnitsResult = await prisma.bloodRequest.aggregate({
    where: {
      requesterId: requester.id,
    },
    _sum: {
      unitsFulfilled: true,
    },
  });

  const totalFulfilledUnits =
    totalFulfilledUnitsResult._sum.unitsFulfilled || 0;

  return {
    totalBloodRequests,

    pendingRequests,
    confirmedRequests,
    matchingRequests,
    partiallyFulfilledRequests,
    fulfilledRequests,
    cancelledRequests,
    rejectedRequests,
    expiredRequests,

    totalRequiredUnits,
    totalFulfilledUnits,

    totalPayments,
    paidPayments,
    unpaidPayments,
    failedPayments,

    totalAmountPaid,
  };
};

export const AnalyticsService = {
  getAdminAnalytics,
  getDonorAnalytics,
  getRequesterAnalytics,
};
