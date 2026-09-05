import express, { Application, Request, Response } from "express";
import httpStatus from "http-status";
import cors from "cors";
import config from "./app/config";
import cookieParser from "cookie-parser";
import { notFound } from "./app/middlewares/notFound";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";

const app: Application = express();

app.use(cors({ origin: config.frontend_url, credentials: true }));

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());

// basic route
app.get("/", async (req: Request, res: Response) => {
  res
    .status(httpStatus.OK)
    .json({ success: true, message: "Welcome to LifeLink BD system backend" });
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
