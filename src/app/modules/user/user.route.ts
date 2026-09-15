import { Router } from "express";
import { auth } from "../../middlewares/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { UserController } from "./user.controller";

const router = Router();

router.get(
  "/me",
  auth(Role.ADMIN, Role.DONOR, Role.REQUESTER),
  UserController.getMe,
);

export const UserRoutes = router;
