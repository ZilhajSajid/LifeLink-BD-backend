import { BloodRequestsStatus, DonationStatus, DonorVerificationStatus, PaymentStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";


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

  // =========================
  // Requester Analytics
  // =========================

  const totalRequesters = await prisma.requesterProfile.count();

  // =========================
  // Blood Request Analytics
  // =========================

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

  // =========================
  // Donation Analytics
  // =========================

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

  // =========================
  // Payment Analytics
  // =========================

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

  // =========================
  // Total Revenue
  // =========================

  const totalRevenueResult = await prisma.payment.aggregate({
    where: {
      status: PaymentStatus.PAID,
    },
    _sum: {
      amount: true,
    },
  });

  const totalRevenue =
    totalRevenueResult._sum.amount?.toNumber() || 0;

  // =========================
  // Return Analytics
  // =========================

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

export const AnalyticsService = { getAdminAnalytics };
