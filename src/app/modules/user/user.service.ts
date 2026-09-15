import { prisma } from "../../lib/prisma";
import type { IRequestUser } from "./user.interface";

const getMeFromDb = async (user: IRequestUser) => {
  const isUserExists = await prisma.user.findUnique({
    where: {
      id: user.userId,
    },
    include: {
      requester: true,
    },
    omit: {
      password: true,
    },
  });

  if (!isUserExists) {
    throw new Error("User not found");
  }

  return isUserExists;
};

export const UserServices = { getMeFromDb };
