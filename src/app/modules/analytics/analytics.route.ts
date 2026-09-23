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

export const AnalyticsRoutes = router;
