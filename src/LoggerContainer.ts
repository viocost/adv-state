import { LogProcessor } from "./types";

export class LoggerContainer implements LogProcessor {
  private loggers: Array<LogProcessor> = [];

  constructor(...loggers: Array<LogProcessor>) {
    this.loggers = loggers;
  }

  addLogger(logger: LogProcessor) {
    this.loggers.push(logger);
  }

  debug(message: string, ...rest: any) {
    for (const logger of this.loggers) {
      logger.debug(message, ...rest);
    }
  }

  info(message: string, ...rest: any) {
    for (const logger of this.loggers) {
      logger.info(message, ...rest);
    }
  }

  warn(message: string, ...rest: any) {
    for (const logger of this.loggers) {
      logger.warn(message, ...rest);
    }
  }

  error(message: string, ...rest: any) {
    for (const logger of this.loggers) {
      logger.error(message, ...rest);
    }
  }
}
