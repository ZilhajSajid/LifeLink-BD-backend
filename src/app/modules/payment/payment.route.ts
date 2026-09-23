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

export const PaymentRoutes = router;
