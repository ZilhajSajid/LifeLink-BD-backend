import { Router } from "express";
import { AuthControllers } from "./auth.controller";
import { auth } from "../../middlewares/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post("/register", AuthControllers.registerUser);
router.post("/login", AuthControllers.loginUser);
router.post("/google", AuthControllers.googleLogin);

router.get(
  "/me",
  auth(Role.ADMIN, Role.DONOR, Role.REQUESTER),
  AuthControllers.getMe,
);

router.post("/refresh-token", AuthControllers.refreshToken);

export const AuthRoutes = router;
