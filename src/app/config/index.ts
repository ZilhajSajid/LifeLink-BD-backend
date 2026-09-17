import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  node_env: process.env.NODE_ENV,
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,
  frontend_url: process.env.FRONTEND_URL,

  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,

  jwt_access_secret: process.env.JWT_ACCESS_SECRET!,
  jwt_access_secret_expiresIn: process.env.JWT_ACCESS_SECRET_EXPIRES_IN!,

  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET!,
  jwt_refresh_secret_expiresIn: process.env.JWT_REFRESH_EXPIRES_IN!,

  google_client_id: process.env.GOOGLE_CLIENT_ID!,

  super_admin_name: process.env.SUPER_ADMIN_NAME!,
  super_admin_email: process.env.SUPER_ADMIN_EMAIL!,
  super_admin_password: process.env.SUPER_ADMIN_PASSWORD!,

  tester_admin_name: process.env.TESTER_ADMIN_NAME!,
  tester_admin_email: process.env.TESTER_ADMIN_EMAIL!,
  tester_admin_password: process.env.TESTER_ADMIN_PASSWORD!,

  tester_donor_name: process.env.TESTER_DONOR_NAME!,
  tester_donor_email: process.env.TESTER_DONOR_EMAIL!,
  tester_donor_password: process.env.TESTER_DONOR_PASSWORD!,

  redis_username: process.env.REDIS_USERNAME!,
  redis_password: process.env.REDIS_PASSWORD!,
  redis_host: process.env.REDIS_HOST!,
  redis_port: process.env.REDIS_PORT!,

  smtp_username: process.env.SMTP_USER!,
  email_sender: process.env.EMAIL_SENDER!,
  smtp_password: process.env.SMTP_PASSWORD!,
};
