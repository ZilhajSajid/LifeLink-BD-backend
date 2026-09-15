import { Role } from "../../../generated/prisma/enums";

export interface IRegisterUserToDbPayload {
  name: string;
  email: string;
  password: string;
}

export interface IGoogleLoginPayload {
  idToken: string;
}

export interface ILoginUserPayload {
  email: string;
  password: string;
}
