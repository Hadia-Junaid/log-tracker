import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import UserGroup from "../../models/UserGroup";
import Application from "../../models/Application";

export function loadSchemaDescriptions(is_admin: boolean): string {
  const modelsDir = path.join(process.cwd(), "src", "models");
  const files = fs.readdirSync(modelsDir);

  let schemaSummary = "Database Collections and Schemas:\n";

  for (const file of files) {
    // if not admin, only include applications and logs schemas
    if (!is_admin && !file.includes("Application") && !file.includes("Log")) {
      continue;
    }

    const content = fs.readFileSync(path.join(modelsDir, file), "utf-8");
    schemaSummary += `\n### ${file}\n${content}\n`;
  }

  return schemaSummary;
}

export function cleanSchema(schema: any): any {
  if (typeof schema !== "object" || schema === null) return schema;
  if (Array.isArray(schema)) return schema.map(cleanSchema);

  const newSchema: any = {};
  for (const key in schema) {
    if (key === "$schema" || key === "additionalProperties" || key === "const") continue;
    newSchema[key] = cleanSchema(schema[key]);
  }
  return newSchema;
}

export const getAssignedApplicationsForUser = async (userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error("Invalid userId");

  let userGroups = await UserGroup.find({ members: userId }).lean();
  userGroups = userGroups.filter((g) => g.is_active === true);

  if (!userGroups.length) return [];

  const groupAppIds = userGroups.flatMap((g) =>
    g.assigned_applications.map((id) => id.toString())
  );

  const apps = await Application.find({
    _id: { $in: groupAppIds.map((id) => new ObjectId(id)) },
  }).lean();

  return apps.map((a) => ({ id: a._id.toString(), name: a.name }));
};
