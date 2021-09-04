import { LogFilter } from "../LogFilter";
import { LogLevel } from "../types";

const l = new LogFilter(undefined, LogLevel.INFO);
l.debug("Should skip");
l.info("Should info");
l.warn("Should warn");
l.error("Should error");
