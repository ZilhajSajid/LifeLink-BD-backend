import { Router } from "express";
import { AuthControllers } from "./auth.controller";
import { AuthValidation } from "./auth.validation";
import { validateRequest } from "../../middlewares/validateRequest";

const router = Router();

router.post(
  "/register",
  validateRequest(AuthValidation.RegistrationSchema),
  AuthControllers.registerUser,
);
router.post(
  "/verify-email",
  validateRequest(AuthValidation.EmailVerificationSchema),
  AuthControllers.verifyRequesterEmail,
);
router.post(
  "/login",
  validateRequest(AuthValidation.LoginSchema),
  AuthControllers.loginUser,
);
router.post("/google", AuthControllers.googleLogin);

router.post("/refresh-token", AuthControllers.refreshToken);

router.post("/logout", AuthControllers.logout);

export const AuthRoutes = router;
