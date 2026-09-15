import type { Role } from "../../../generated/prisma/enums";

export interface IRequestUser {
  userId: string;
  email: string;
  name: string;
  role: Role;
}