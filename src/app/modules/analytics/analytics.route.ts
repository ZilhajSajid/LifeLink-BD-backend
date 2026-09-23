import { Router } from "express";
import { auth } from "../../middlewares/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { AnalyticsController } from "./analytics.controller";

const router = Router();

router.get(
  "/admin-analytics",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  AnalyticsController.getAdminAnalytics,
);
router.get(
  "/donor-analytics",
  auth(Role.DONOR),
  AnalyticsController.getDonorAnalytics,
);
router.get(
  "/requester-analytics",
  auth(Role.REQUESTER),
  AnalyticsController.getRequesterAnalytics,
);

export const AnalyticsRoutes = router;
