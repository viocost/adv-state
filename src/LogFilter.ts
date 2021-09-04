import { LogLevel, LogProcessor, SMLogger } from "./types";

export class LogFilter implements LogProcessor {
  info = (...args: any) => {};
  debug = (...args: any) => {};
  warn = (...args: any) => {};
  error = (...args: any) => {};

  constructor(
    private logger: SMLogger = console,
    level: LogLevel = LogLevel.INFO
  ) {
    const logFunctions = ["error", "warn", "info", "debug"];

    for (let i = 0; i < level; i++) {
      this[logFunctions[i]] = this.getLoggerFunction(logFunctions[i]);
    }
  }

  private getLoggerFunction(level: string) {
    const levelMap = {
      warn: "warn",
      error: "error",
      info: "log",
      debug: "log",
    };
    return ((message: string, ...args: any) => {
      this.logger[levelMap[level]](
        `${level.toUpperCase()}: ${message}`,
        ...args
      );
    }).bind(this);
  }
}
