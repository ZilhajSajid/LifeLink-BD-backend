import { Router } from "express";

import { auth } from "../../middlewares/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { DonationAssignmentController } from "./donationAssignment.controller";

const router = Router();

router.post(
  "/create-donation",
  auth(Role.DONOR),
  DonationAssignmentController.createDonation,
);

export const DonationRoutes = router;
