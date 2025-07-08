export interface PinnedApp {
  userId: string;
  appName: string;
  logCounts: {
    INFO: number;
    WARN: number;
    ERROR: number;
  };
}

export type LogLevel = "INFO" | "WARN" | "ERROR" | string;
