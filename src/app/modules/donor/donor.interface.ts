import {
  BloodGroupType,
  DonorVerificationStatus,
  Gender,
} from "../../../generated/prisma/enums";

export interface IApplyAsDonor {
  user: {
    name: string;
    email: string;
  };
  donor: {
    bloodGroup: BloodGroupType;
    dateOfBirth?: string;
    gender: Gender;
    address?: string;
    city?: string;
  };
}

export interface IVerifyDonorEmailPayload {
  email: string;
  otp: string;
}

export interface IApproveDonorPayload {
  donorId: string;
  verificationStatus: DonorVerificationStatus;
  rejectionReason: string;
}
