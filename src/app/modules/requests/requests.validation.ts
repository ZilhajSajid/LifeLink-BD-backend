import { z } from "zod";
import {
  BloodGroupType,
  BloodRequestsStatus,
  Urgency,
} from "../../../generated/prisma/enums";

export const createRequestsSchema = z.object({
  bloodGroup: z.enum(BloodGroupType),

  unitsRequired: z.coerce
    .number()
    .int("Units required must be a whole number")
    .positive("Units required must be greater than 0"),

  urgency: z.enum(Urgency),

  requiredDate: z.coerce
    .date()
    .refine((date) => date > new Date(), "Required date must be in the future"),

  hospitalName: z
    .string()
    .trim()
    .min(2, "Hospital name must be at least 2 characters long")
    .max(200, "Hospital name cannot exceed 200 characters")
    .optional(),

  hospitalAddress: z
    .string()
    .trim()
    .min(5, "Hospital address must be at least 5 characters long")
    .max(500, "Hospital address cannot exceed 500 characters")
    .optional(),

  city: z
    .string()
    .trim()
    .min(2, "City must be at least 2 characters long")
    .max(100, "City cannot exceed 100 characters")
    .optional(),

  reason: z
    .string()
    .trim()
    .min(5, "Reason must be at least 5 characters long")
    .max(1000, "Reason cannot exceed 1000 characters")
    .optional(),
});
export const getAllRequestsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(["createdAt", "requiredDate", "urgency"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  status: z.enum(BloodRequestsStatus).optional(),
});
export type GetAllRequestsQuery = z.infer<typeof getAllRequestsQuerySchema>;
