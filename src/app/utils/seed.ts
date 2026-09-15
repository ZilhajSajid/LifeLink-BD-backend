import config from "../config";
import { prisma } from "../lib/prisma";
import { AppError } from "./AppError";
import httpStatus from "http-status";
import bcrypt from "bcrypt";
import { Role } from "../../generated/prisma/enums";

export const seedSuperAdmin = async () => {
  try {
    const isSuperAdmin = await prisma.user.findUnique({
      where: { email: config.super_admin_email },
    });

    if (isSuperAdmin) {
      console.log("Super Admin Exists");
      return;
    }
    const name = config.super_admin_name;
    const email = config.super_admin_email;
    const password = config.super_admin_password;

    if (!name || !email || !password) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Super admin name,email or password is missing in env!!",
      );
    }

    const hashedPassword = await bcrypt.hash(
      password,
      Number(config.bcrypt_salt_rounds),
    );

    const superAdmin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.ADMIN,
        needPasswordChange: false,
        emailVerified: true,
      },
    });
    console.log("Super admin created: ", superAdmin);
  } catch (error) {
    console.log("Error seeding super admin : ", error);
    await prisma.user.delete({
      where: { email: config.super_admin_email },
    });
  }
};

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
        "Tester admin name,email or password is missing in env!!",
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

export const seedTesterDonor = async () => {
  try {
    const isTesterDonor = await prisma.user.findUnique({
      where: { email: config.tester_donor_email },
    });
    if (isTesterDonor) {
      console.log("Tester Donor Exists");
      return;
    }

    const name = config.tester_donor_name;
    const email = config.tester_donor_email;
    const password = config.tester_donor_password;

    if (!name || !email || !password) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Tester donor name,email or password is missing in env!!",
      );
    }

    const hashedPassword = await bcrypt.hash(
      password,
      Number(config.bcrypt_salt_rounds),
    );

    const testerDonor = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.DONOR,
        emailVerified: true,
        needPasswordChange: false,
      },
    });
    console.log("Tester Donor Created: ", testerDonor);
  } catch (error) {
    console.log("Error seeding tester donor : ", error);
    await prisma.user.delete({
      where: { email: config.tester_donor_email },
    });
  }
};
