import z from "zod";

const ForgetPasswordSchema = z.object({
  email: z.email("Not a valid email"),
});
const ResetPasswordSchema = z.object({
  email: z.email("Not a valid email"),
  newPassword: z
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
  otp: z.string().length(6),
});

export const UserValidations = { ForgetPasswordSchema, ResetPasswordSchema };
