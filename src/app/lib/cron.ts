import cron from "node-cron";
import { prisma } from "./prisma";
import { DonorVerificationStatus, Role } from "../../generated/prisma/enums";

export const deleteUnverifiedDonors = async () => {
  cron.schedule("*/20 * * * *", async () => {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const deleteDonors = await prisma.user.deleteMany({
        where: {
          role: Role.DONOR,
          emailVerified: false,
          createdAt: { lt: oneHourAgo },
          donor: { verificationStatus: DonorVerificationStatus.PENDING },
        },
      });
      if (deleteDonors.count > 0) {
        console.log(
          `Cron deleted ${deleteDonors.count} unverified email donor applications older than 1 hour`,
        );
      }
    } catch (error) {
      console.log("Cron failed to delete unverified donors application", error);
    }
    console.log("Unverified Donor delete cron schedule (every 10 minutes)");
  });
};
