import { Router } from "express";
import { DonorController } from "./donor.controller";
import { upload } from "../../lib/multer";
import { auth } from "../../middlewares/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post(
  "/apply-as-donor",
  upload.fields([
    { name: "certificate", maxCount: 1 },
    { name: "additionalFiles", maxCount: 3 },
  ]),
  DonorController.applyAsDonor,
);

router.post("/apply-as-donor/verify-email", DonorController.verifyDonorEmail);
router.post(
  "/approve-donor",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  DonorController.approveDonor,
);
router.get(
  "/all-donors",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  DonorController.getAllDonors,
);

export const DonorRoutes = router;
