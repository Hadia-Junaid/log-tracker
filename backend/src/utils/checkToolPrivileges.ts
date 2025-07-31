import logger from "./logger";
import { checkAggregateLogAccess, checkFindLogAccess } from "./checkLogAccess";
import { ChatUser } from "../services/ClaudeMcpService";

interface CheckAccessResponse {
  authorized: boolean;
  message?: string;
}

export const checkToolPrivileges = (
  user: ChatUser,
  toolName: string,
  toolArgs: Record<string, unknown>
): CheckAccessResponse => {
  if (
    (toolArgs.toolName == "find" || toolArgs.toolName == "aggregate") &&
    (toolArgs.toolCollection === "applications" ||
      toolArgs.collection === "users" ||
      toolArgs.collection === "usergroups")
  ) {
    logger.debug("User does not have access to applications or usergroups.");
    return {
      authorized: false,
      message:
        "You do not have access to this application or it does not exist.",
    };
  }

  if (toolName === "find" && toolArgs.collection === "logs") {
    logger.debug("Checking for logs access.");
    const authorized = checkFindLogAccess(user, toolArgs);
    if (!authorized) {
      console.log("User does not have access to this application's logs.");
      return {
        authorized: false,
        message:
          "You do not have permission to access this application's logs or it does not exist.",
      };
    }
  }

  if (toolName === "aggregate" && toolArgs.collection === "logs") {
    logger.debug("Checking for logs access in aggregate.");
    const authorized = checkAggregateLogAccess(user, toolArgs);
    if (!authorized) {
      console.log("User does not have access to this application.");
      return {
        authorized: false,
        message:
          "You do not have permission to access this application's logs via aggregate.",
      };
    }
  }

  return { authorized: true };
};
