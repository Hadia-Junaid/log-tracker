import UserGroup from "../models/UserGroup";
import Application from "../models/Application";

export const checkApplicationAccess = async (user: any, toolArgs: any) => {
  //Check user groups for this user
  const allowedApplications = await UserGroup.find({
    members: user.id,
  }).distinct("assigned_applications");

  // Check if the user has access to the requested application
  if (!allowedApplications.includes(toolArgs.applicationId)) {
    return false;
  }

  return true;
};

export const checkAggregateAccess = async (
  user: any,
  toolArgs: any
): Promise<boolean> => {
  const allowedApplicationIds = await UserGroup.find({
    members: user.id,
  }).distinct("assigned_applications");

  console.log("Allowed application IDs:", allowedApplicationIds);

  //now get these applications
  const allowedApps = await Application.find({
    _id: { $in: allowedApplicationIds },
  }).select("name");

  console.log("Allowed applications:", allowedApps);

  const allowedAppNames = allowedApps.map((app) => app.name);

  const pipeline = toolArgs.pipeline || [];
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
