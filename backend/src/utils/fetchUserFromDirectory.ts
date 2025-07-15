import { getAdminDirectoryService } from "./googleAdminSDK";
import config from "config";

export const fetchUserFromDirectory = async (
  email: string
): Promise<{ name: string; email: string } | null> => {
  if (!email) return null;

  const admin = await getAdminDirectoryService();
  if (!admin) {
    throw new Error("Admin SDK service not initialized.");
  }

  const domain = config.get<string>("google.admin.domain");

    const res = await admin.users.get({ userKey: email });
    const user = res.data;

    if (!user?.primaryEmail) return null;

    if (domain && !user.primaryEmail.endsWith(`@${domain}`)) {
      return null;
    }

    return {
      name: user.name?.fullName || "",
      email: user.primaryEmail,
    };
};
