import z from "zod";

const RegistrationSchema = z.object({
  name: z
    .string("Not a string!")
    .min(5, "name must be 5 or more characters long")
    .max(25),
  email: z.email("Not a valid email"),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter",
    })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^A-Za-z0-9]/, {
      message: "Password must contain at least one special character",
    }),
  requester: z
    .object({
      contactNumber: z.string().optional(),
    })
    .optional(),
});
const EmailVerificationSchema = z.object({
  email: z.email("Not a valid email"),
  otp: z.string().length(6),
});
const LoginSchema = z.object({
  email: z.email("Not a valid email"),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter",
    })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^A-Za-z0-9]/, {
      message: "Password must contain at least one special character",
    }),
});

export const AuthValidation = {
  RegistrationSchema,
  EmailVerificationSchema,
  LoginSchema,
};
