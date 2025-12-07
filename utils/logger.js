const winston = require("winston");
const { DateTime } = require("luxon");
require("winston-daily-rotate-file");

const transport = new winston.transports.DailyRotateFile({
  filename: "logs/app-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxFiles: "30d", // logi trzymane przez 30 dni
  zippedArchive: true,
});

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: () => DateTime.now().setZone("Europe/Warsaw").toISO(), // timestamp w Warszawie
    }),
    winston.format.json()
  ),
  transports: [transport],
});

module.exports = logger;
