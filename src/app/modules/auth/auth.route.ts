import { Router } from "express";
import { AuthControllers } from "./auth.controller";
import { UserValidation } from "./auth.validation";
import { validateRequest } from "../../middlewares/validateRequest";

const router = Router();

router.post(
  "/register",
  validateRequest(UserValidation.RegistrationSchema),
  AuthControllers.registerUser,
);
router.post(
  "/login",
  validateRequest(UserValidation.LoginSchema),
  AuthControllers.loginUser,
);
router.post("/google", AuthControllers.googleLogin);

router.post("/refresh-token", AuthControllers.refreshToken);

router.post("/logout", AuthControllers.logout);

export const AuthRoutes = router;
