import { Router } from "express";
import { auth } from "../../middlewares/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { RequestsController } from "./requests.controller";

const router = Router();

router.post(
  "/create-requests",
  //   auth(Role.REQUESTER),
  RequestsController.createRequests,
);

// create requests callback url
router.get(
  "/create-requests/payment/callback",
  RequestsController.createRequestsCallback,
);

export const RequestsRoutes = router;
