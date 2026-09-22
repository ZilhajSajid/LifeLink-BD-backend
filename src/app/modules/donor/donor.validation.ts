import { z } from "zod";
import { BloodGroupType, Gender } from "../../../generated/prisma/enums";

export const ApplyAsDonorZodSchema = z.object({
  user: z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters long")
      .max(100, "Name cannot exceed 100 characters"),

    email: z.email("Please provide a valid email address"),
  }),

  donor: z.object({
    bloodGroup: z.enum(BloodGroupType),

    dateOfBirth: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Date of birth must be in YYYY-MM-DD format",
      )
      .refine(
        (value) => !Number.isNaN(new Date(value).getTime()),
        "Please provide a valid date of birth",
      )
      .optional(),

    gender: z.enum(Gender),

    address: z
      .string()
      .max(255, "Address cannot exceed 255 characters")
      .optional(),

    city: z.string().max(100, "City cannot exceed 100 characters").optional(),
  }),
});
