import { ChatUser } from "../services/ClaudeMcpService";
import logger from "./logger";

export const checkFindLogAccess = (
  user: ChatUser,
  toolArgs: Record<string, unknown>
): boolean => {
  if (!user.assigned_applications) {
    return false; // user has no assigned applications
  }

  //check if user.assigned_applications array has the app object with this id
  const allowedApplicationIds = user.assigned_applications.map(
    (app: any) => app.id
  );

  if (!allowedApplicationIds.includes(toolArgs.applicationId)) {
    logger.warn("User does not have access to this application.");
    return false; // user is trying to access an app they don’t have access to
  }

  return true;
};

export const checkAggregateLogAccess = (
  user: ChatUser,
  toolArgs: Record<string, unknown>
): boolean => {
  if (!user.assigned_applications) {
    return false;
  }

  //now get these applications
  const allowedApps = user.assigned_applications;

  const allowedAppNames = allowedApps.map((app) => app.name);

  const pipeline = Array.isArray(toolArgs.pipeline) ? toolArgs.pipeline : [];
  for (const stage of pipeline) {
    if (stage.$match && stage.$match["application.name"]) {
      const requestedApp = stage.$match["application.name"];
      if (!allowedAppNames.includes(requestedApp)) {
        return false; // user is trying to access an app they don’t have access to
      }
    }
  }

  return true;
};
