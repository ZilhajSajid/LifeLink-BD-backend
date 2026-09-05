import config from "../config";
import { prisma } from "../lib/prisma";
import { AppError } from "./AppError";
import httpStatus from "http-status";
import bcrypt from "bcrypt";
import { Role } from "../../generated/prisma/enums";

export const seedTesterAdmin = async () => {
  try {
    const isTesterAdmin = await prisma.user.findUnique({
      where: {
        email: config.tester_admin_email,
      },
    });
    if (isTesterAdmin) {
      console.log("Tester admin already exists");
      return;
    }
    const name = config.tester_admin_name;
    const email = config.tester_admin_email;
    const password = config.tester_admin_password;
    if (!name || !email || !password) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Tester admin name,email or password missing in env!!",
      );
    }
    const hashedPassword = await bcrypt.hash(
      password,
      Number(config.bcrypt_salt_rounds),
    );
    const testerAdmin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.ADMIN,
        needPasswordChange: false,
        emailVerified: true,
      },
    });
    console.log("Tester admin created: ", testerAdmin);
  } catch (error) {
    console.log("Error seeding tester admin : ", error);
    await prisma.user.delete({
      where: { email: config.tester_admin_email },
    });
  }
};
