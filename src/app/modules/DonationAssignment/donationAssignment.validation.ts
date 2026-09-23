import z from "zod";

export const createDonationZodSchema = z.object({
  bloodRequestId: z.string("Invalid blood request ID"),

  units: z
    .number()
    .int("Units must be a whole number")
    .positive("Units must be greater than 0"),

  scheduledAt: z.coerce
    .date()
    .refine(
      (date) => date > new Date(),
      "Scheduled date must be in the future",
    ),
});
