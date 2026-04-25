import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const exactLevel = (level) =>
    winston.format((info) => (info.level === level ? info : false))();

const createRotatingTransport = (level) =>
    new DailyRotateFile({
        dirname: "logs/%DATE%",
        filename: `${level}.log`,
        datePattern: "YYYY-MM-DD",
        zippedArchive: true,
        maxSize: "20m",
        maxFiles: "30d",
        format: winston.format.combine(
            exactLevel(level),
            winston.format.json(),
        ),
    });

const logger = winston.createLogger({
    levels: { error: 0, info: 1, debug: 2 },
    level: "debug",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
    ),
    transports: [
        new winston.transports.Console(),
        createRotatingTransport("error"),
        createRotatingTransport("info"),
        createRotatingTransport("debug"),
    ],
});

export default logger;
