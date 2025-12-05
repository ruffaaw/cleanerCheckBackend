require("dotenv").config({ path: `${process.cwd()}/.env` });
require("./cron/checkRooms");
require("./cron/cleanupOldSessions");
require("./cron/cleanupOldNotifications");
const express = require("express");
const cors = require("cors");

const authRouter = require("./route/authRoute");
const workersRouter = require("./route/workersRoute");
const roomRouter = require("./route/roomRoute");
const cleaningSessions = require("./route/cleaningSessionRoute");
const dashboardRouter = require("./route/dashboardRoute");
const notificationRouter = require("./route/notificationRoute");
const catchAsync = require("./utils/catchAsync");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controller/errorController");

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.use(express.json());

//all routes

app.use("/api/v1/auth", authRouter);

app.use("/api/v1/workers", workersRouter);

app.use("/api/v1/rooms", roomRouter);

app.use("/api/v1/cleaningSessions", cleaningSessions);

app.use("/api/v1/dashboard", dashboardRouter);

app.use("/api/v1/notifications", notificationRouter);

app.use(
  catchAsync(async (req, res, next) => {
    throw new AppError(`Can't find ${req.originalUrl} on this server`, 404);
  })
);

app.use(globalErrorHandler);

const PORT = process.env.APP_PORT || 3000;

app.listen(PORT, () => {
  console.log("Server is running", PORT);
});
