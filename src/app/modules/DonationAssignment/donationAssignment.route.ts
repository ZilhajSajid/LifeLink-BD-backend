import { Router } from "express";

import { auth } from "../../middlewares/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { DonationAssignmentController } from "./donationAssignment.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { createDonationZodSchema } from "./donationAssignment.validation";

const router = Router();

router.post(
  "/create-donation",
  auth(Role.DONOR),
  validateRequest(createDonationZodSchema),
  DonationAssignmentController.createDonation,
);

router.get(
  "/my-donations",
  auth(Role.DONOR),
  DonationAssignmentController.getMyDonation,
);
router.get(
  "/:assignmentId",
  auth(Role.DONOR, Role.ADMIN, Role.SUPER_ADMIN),
  DonationAssignmentController.getDonationById,
);
router.patch(
  "/:assignmentId/complete",
  auth(Role.DONOR),
  DonationAssignmentController.completeDonation,
);
router.delete(
  "/:assignmentId/delete",
  auth(Role.DONOR),
  DonationAssignmentController.deleteDonation,
);

export const DonationRoutes = router;
