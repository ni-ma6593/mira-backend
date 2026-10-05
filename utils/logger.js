import winston from "winston";
import "winston-daily-rotate-file";
import path from "path";

const logDir = path.join(process.cwd(), "logs");

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(),
);

const transports = [
  new winston.transports.DailyRotateFile({
    filename: path.join(logDir, "error-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    level: "error",
    maxFiles: "14d",
  }),
  new winston.transports.DailyRotateFile({
    filename: path.join(logDir, "combined-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    maxFiles: "14d",
  }),
];

if (process.env.NODE_ENV !== "production") {
  transports.push(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  );
}

const logger = winston.createLogger({
  level: "info",
  format: logFormat,
  transports,
});

export default logger;
