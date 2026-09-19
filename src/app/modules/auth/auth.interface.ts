export interface IRegisterUserToDbPayload {
  name: string;
  email: string;
  password: string;
  requester: {
    contactNumber?: string;
  };
}
export interface IVerifyEmailPayload {
  email: string;
  otp: string;
}

export interface IGoogleLoginPayload {
  idToken: string;
}

export interface ILoginUserPayload {
  email: string;
  password: string;
}
