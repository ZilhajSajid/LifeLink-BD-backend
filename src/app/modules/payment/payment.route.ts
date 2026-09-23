import { Router } from "express";
import { auth } from "../../middlewares/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { PaymentController } from "./payment.controller";

const router = Router();
router.get(
  "/my-payments",
  auth(Role.REQUESTER),
  PaymentController.getMyPayments,
);
router.get(
  "/all-payments",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  PaymentController.getAllPayments,
);

export const PaymentRoutes = router;
