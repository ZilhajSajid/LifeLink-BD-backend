import app from "./app";
import config from "./app/config";
import { deleteUnverifiedDonors } from "./app/lib/cron";
import { transporter } from "./app/lib/nodemailer";
import { prisma } from "./app/lib/prisma";
import { redisClient } from "./app/lib/redis";
import {
  seedSuperAdmin,
  seedTesterAdmin,
  seedTesterDonor,
} from "./app/utils/seed";

const Port = config.port;

const main = async () => {
  try {
    await prisma.$connect();
    console.log("Connected to the database successfully");
    await redisClient.connect();
    console.log("Redis connected successfully");
    await transporter.verify();
    console.log("Nodemailer connected successfully");
    await seedSuperAdmin();
    await seedTesterAdmin();
    await seedTesterDonor();
    await deleteUnverifiedDonors();
    app.listen(Port, () => {
      console.log(`LifeLink server is running on ${Port}`);
    });
  } catch (error) {
    console.error("Error Starting the server", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

main();
