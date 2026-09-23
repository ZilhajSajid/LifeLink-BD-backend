import { Router } from "express";
import { auth } from "../../middlewares/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { RequestsController } from "./requests.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { createRequestsSchema } from "./requests.validation";

const router = Router();

router.post(
  "/create-requests",
  auth(Role.REQUESTER),
  validateRequest(createRequestsSchema),
  RequestsController.createRequests,
);
router.post(
  "/pay-requests",
  auth(Role.REQUESTER),
  RequestsController.payExistingRequests,
);
router.post(
  "/cancel-requests",
  auth(Role.REQUESTER, Role.ADMIN, Role.SUPER_ADMIN),
  RequestsController.cancelRequests,
);

router.get(
  "/my-requests",
  auth(Role.REQUESTER),
  RequestsController.getMyRequests,
);

// create requests callback url
router.get(
  "/create-requests/payment/callback",
  RequestsController.createRequestsCallback,
);

export const RequestsRoutes = router;
