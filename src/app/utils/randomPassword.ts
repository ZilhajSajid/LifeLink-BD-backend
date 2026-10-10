import { AppError } from "./AppError";
import httpStatus from "http-status";
import crypto from "crypto";

export const generateRandomPassword = (length = 10) => {
  if (length < 8) {
    throw new AppError(httpStatus.BAD_REQUEST, "Length must be at least 4");
  }

  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const special = "!@#$%^&*_-+=?";
  const digits = "0123456789";
  const all = lower + upper + digits + special;
  const pick = (chars: string) => chars[crypto.randomInt(chars.length)];

  const chars = [pick(lower), pick(upper), pick(digits), pick(special)];
  for (let i = chars.length; i < length; i++) {
    chars.push(pick(all));
  }

  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
};
