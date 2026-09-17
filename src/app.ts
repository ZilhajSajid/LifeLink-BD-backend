import express, {
  type NextFunction,
  type Application,
  type Request,
  type Response,
} from "express";
import httpStatus from "http-status";
import cors from "cors";
import config from "./app/config";
import cookieParser from "cookie-parser";
import { notFound } from "./app/middlewares/notFound";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import { AuthRoutes } from "./app/modules/auth/auth.route";
import { UserRoutes } from "./app/modules/user/user.route";
import crypto from "crypto";

const app: Application = express();

app.use(cors({ origin: config.frontend_url, credentials: true }));

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/users", UserRoutes);

app.get("/test", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body;

    const otp = crypto.randomInt(100000, 1000000);

    res.status(httpStatus.OK).json({
      success: true,
      message: "Welcome to LifeLink BD system backend",
      data: otp,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

// basic route
app.get("/", async (req: Request, res: Response) => {
  res
    .status(httpStatus.OK)
    .json({ success: true, message: "Welcome to LifeLink BD system backend" });
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
