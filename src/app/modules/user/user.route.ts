import { Router } from "express";
import { auth } from "../../middlewares/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { UserController } from "./user.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { UserValidations } from "./user.validation";

const router = Router();

router.get(
  "/me",
  auth(Role.ADMIN, Role.DONOR, Role.REQUESTER),
  UserController.getMe,
);

router.post(
  "/forget-password",
  validateRequest(UserValidations.ForgetPasswordSchema),
  UserController.forgetPassword,
);
router.post(
  "/reset-password",
  validateRequest(UserValidations.ResetPasswordSchema),
  UserController.resetPassword,
);
export const UserRoutes = router;
