export interface PinnedApp {
  _id: string;
  appName: string;
  logCounts: {
    INFO: number;
    WARN: number;
    ERROR: number;
    DEBUG: number;
  };
}

export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG" | string;
