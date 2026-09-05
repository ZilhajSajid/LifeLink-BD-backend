import express from "express";
import httpStatus from "http-status";
const app = express();
// basic route
app.get("/", async (req, res) => {
    res
        .status(httpStatus.OK)
        .json({ success: true, message: "Welcome to LifeLink BD system backend" });
});
export default app;
