import type { Role } from "../../../generated/prisma/enums";

export interface IRequestUser {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

export interface IForgetPasswordPayload {
  email: string;
}
export interface IResetPasswordPayload {
  email: string;
  newPassword: string;
  otp: string;
}
