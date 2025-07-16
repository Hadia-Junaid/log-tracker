import { LogLevel } from "../types";

export const getLogLevelBadgeClass = (log_level: LogLevel): string => {
  switch (log_level) {
    case "INFO":
      return "oj-badge oj-badge-success";
    case "WARN":
      return "oj-badge oj-badge-warning";
    case "ERROR":
      return "oj-badge oj-badge-danger";
    case "DEBUG":
      return "oj-badge oj-badge-warning oj-badge-subtle"; // Assuming you have a specific class for
    default:
      return "oj-badge oj-badge-neutral";
  }
};
