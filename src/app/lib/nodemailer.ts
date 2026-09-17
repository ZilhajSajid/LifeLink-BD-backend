import nodemailer from "nodemailer";
import config from "../config";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: config.smtp_username, pass: config.smtp_password },
});
