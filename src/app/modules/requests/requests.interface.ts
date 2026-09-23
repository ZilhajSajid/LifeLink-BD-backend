import { BloodGroupType, Urgency } from "../../../generated/prisma/enums";

export interface ICreateRequestsPayload {
  bloodGroup: BloodGroupType;
  unitsRequired: number;
  urgency: Urgency;
  requiredDate: Date;
  hospitalName?: string;
  hospitalAddress?: string;
  city?: string;
  reason?: string;
}

export interface ICancelRequestPayload {
  requestId: string;
}
