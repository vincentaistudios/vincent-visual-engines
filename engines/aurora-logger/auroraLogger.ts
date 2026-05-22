import winston from "winston";

/**
 * Aurora Technical Logger
 * Biblioteca de logs técnicos de alto desempenho para microsserviços.
 *
 * @author Vincent AI Studios
 * @license MIT
 */

const auroraFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
});

export const auroraLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    auroraFormat
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "aurora-engine.log" })
  ]
});

// Helpers para uso rápido
export const log = {
  info: (msg: string) => auroraLogger.info(msg),
  warn: (msg: string) => auroraLogger.warn(msg),
  error: (msg: string) => auroraLogger.error(msg),
  debug: (msg: string) => auroraLogger.debug(msg),
};
