// Controller functions for managing applications
import { Request, Response } from "express";
import Application from "../models/Application";
import mongoose from "mongoose";
import logger from "../utils/logger";
import UserGroup from "../models/UserGroup";
import { escapeRegex } from "../utils/escapeRegex";

// Creates a new application
// Expects req.body to contain application data
// Returns the created application with a 201 status code
export const createApplication = async (
  req: Request,
  res: Response
): Promise<void> => {
  const existingApp = await Application.findOne({ name: req.body.name }).lean();
  if (existingApp) {
    logger.warn(
      `Create request failed: Application already exists with name ${req.body.name}`
    );
    res
      .status(409)
      .send({ error: "Application with this name already exists." });
    return;
  }

  // Validate userGroups if provided to ensure they are valid ObjectIds
  if (req.body.userGroups && Array.isArray(req.body.userGroups)) {
    const invalidIds = req.body.userGroups.filter(
      (id: string) => !mongoose.Types.ObjectId.isValid(id)
    );

    if (invalidIds.length > 0) {
      logger.warn(`Invalid user group IDs: ${invalidIds.join(", ")}`);
      res.status(400).send({ error: "Invalid user group ID(s) provided." });
      return;
    }
  }

  const newApp = {
    name: req.body.name,
    hostname: req.body.hostname,
    environment: req.body.environment,
    isActive: req.body.isActive,
    description: req.body.description || "",
  };

  const app = await Application.create(newApp);

  const userGroupIds = req.body.userGroups || [];

  await UserGroup.updateMany(
    {
      $or: [{ _id: { $in: userGroupIds } }, { is_admin: true }],
    },
    {
      $addToSet: { assigned_applications: app._id },
    }
  );

  logger.info(`Application created: ${app.name} (${app._id})`);

  res.status(201).send(app);
};

// Retrieves a list of applications with optional search and pagination
// Expects query parameters: search (string), page (number), limit (number)
// Returns a paginated list of applications matching the search criteria
// If no search is provided, returns all applications
export const getApplications = async (
  req: Request,
  res: Response
): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.max(1, parseInt(req.query.pageSize as string) || 8);
  const search = (req.query.search as string)?.trim() || "";
  const status = req.query.status as string;
  const environment = (req.query.environment as string[]) || [];
  const sort = req.query.sort as string;
  const allPages = req.query.allPages === "true" ? true : false;

  // Build filter object
  const filter: Record<string, any> = {};

  if (search) {
    const escapedSearch = escapeRegex(search);
    logger.info(`Escaped search term: ${escapedSearch}`);
    logger.debug(`Search regex: /${escapedSearch}/i`);
    filter.name = { $regex: escapedSearch, $options: "i" };
  }

  if (status && status !== "all") {
    filter.isActive = status === "active" ? true : false;
  }

  logger.debug("Environment filter before processing:" + environment);

  // environment is now an array of strings already
  if (environment && environment.length > 0) {
    // Convert to array if it's a single string
    const envArray = Array.isArray(environment) ? environment : [environment];
    filter.environment = { $in: envArray };
  }

  // Sort mapping
  const sortMapping: Record<string, any> = {
    name: { name: 1 },
    nameDesc: { name: -1 },
    createdAt: { createdAt: 1 },
    createdAtDesc: { createdAt: -1 },
    updatedAt: { updatedAt: 1 },
    updatedAtDesc: { updatedAt: -1 },
  };

  const sortOption = sortMapping[sort] || { name: 1 };

  // Run count and fetch in parallel
  const [total, apps] = await Promise.all([
    Application.countDocuments(filter),
    Application.find(filter)
      .collation({ locale: "en", strength: 2 })
      .sort(sortOption)
      .skip(allPages ? 0 : (page - 1) * pageSize)
      .limit(allPages ? 0 : pageSize)
      .lean(),
  ]);

  logger.info(
    `Fetched ${apps.length} apps (page ${page}) with filters [search="${search}", status="${status}", env="${environment}"], sorted by "${sort}"`
  );

  res.json({ data: apps, total });
};

// Updates an existing application by ID
// Expects req.params.id to be the application ID and req.body to contain updated data
// Returns the updated application or an error if not found
export const updateApplication = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = req.params.id.trim();

  if (!mongoose.isValidObjectId(id)) {
    logger.warn(`Invalid update request with malformed ID: ${id}`);
    res.status(400).send({ error: "Invalid ID" });
    return;
  }

  // Validate userGroups if provided to ensure they are valid ObjectIds
  if (req.body.userGroups && Array.isArray(req.body.userGroups)) {
    const invalidIds = req.body.userGroups.filter(
      (id: string) => !mongoose.Types.ObjectId.isValid(id)
    );

    if (invalidIds.length > 0) {
      logger.warn(`Invalid user group IDs: ${invalidIds.join(", ")}`);
      res.status(400).send({ error: "Invalid user group ID(s) provided." });
      return;
    }
  }

  const newApp = {
    name: req.body.name,
    hostname: req.body.hostname,
    environment: req.body.environment,
    isActive: req.body.isActive,
    description: req.body.description || "",
  };

  const updated = await Application.findByIdAndUpdate(id, newApp, {
    new: true,
    runValidators: true,
  });

  if (!updated) {
    logger.warn(`Update failed: Application not found (ID: ${id})`);
    res.status(404).send({ error: "Application not found" });
    return;
  }

  // continue with user group updates...

  if (req.body.userGroups && Array.isArray(req.body.userGroups)) {
    const incomingGroupIds = req.body.userGroups;

    // Get currently assigned groups
    const currentlyAssignedGroups = await UserGroup.find(
      { assigned_applications: updated._id },
      "_id"
    ).lean();

    const currentGroupIds = currentlyAssignedGroups.map((g) =>
      g._id.toString()
    );

    // Compute differences in user groups
    const toAdd = incomingGroupIds.filter(
      (id: string) => !currentGroupIds.includes(id)
    );
    const toRemove = currentGroupIds.filter(
      (id: string) => !incomingGroupIds.includes(id)
    );

    const updates = [];

    if (toAdd.length > 0) {
      updates.push(
        UserGroup.updateMany(
          {
            $or: [{ _id: { $in: toAdd } }, { is_admin: true }],
          },
          {
            $addToSet: { assigned_applications: updated._id },
          }
        )
      );
    }

    if (toRemove.length > 0) {
      updates.push(
        UserGroup.updateMany(
          {
            _id: { $in: toRemove },
            is_admin: false,
            is_active: true,
          },
          {
            $pull: { assigned_applications: updated._id },
          }
        )
      );
    }

    await Promise.all(updates);
  }

  logger.info(`Application updated (PATCH): ${updated.name} (${updated._id})`);
  res.send(updated);
};

// Deletes an application by ID
// Expects req.params.id to be the application ID
// Returns a success message or an error if not found
export const deleteApplication = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = req.params.id.trim();

  if (!mongoose.isValidObjectId(id)) {
    logger.warn(`Invalid delete request with malformed ID: ${id}`);
    res.status(400).send({ error: "Invalid ID" });
    return;
  }

  const deleted = await Application.findByIdAndDelete(id);

  if (!deleted) {
    logger.warn(`Delete failed: Application not found (ID: ${id})`);
    res.status(404).send({ error: "Application not found" });
    return;
  }

  //Remove deleted application from associated user groups
  await UserGroup.updateMany(
    { assigned_applications: id },
    { $pull: { assigned_applications: id } }
  );

  logger.info(`Application deleted: ${deleted.name} (${deleted._id})`);
  res.send({ message: "Application deleted successfully." });
};

// Gets groups assigned to a specific application by ID and also the list of all active groups
// Expects req.params.id to be the application ID
// Returns a JSON object with all groups as objects and the IDs of those assigned to the application as strings
export const getAssignedGroups = async (
  req: Request,
  res: Response
): Promise<void> => {
  const appId = req.params.id.trim();

  if (!mongoose.isValidObjectId(appId)) {
    logger.warn(
      `Invalid request for assigned groups with malformed ID: ${appId}`
    );
    res.status(400).send({ error: "Invalid ID" });
    return;
  }

  const [allGroups, assignedGroups] = await Promise.all([
    UserGroup.find({ is_active: true }, "id name is_admin").lean(),
    UserGroup.find(
      { assigned_applications: appId, is_active: true },
      "_id"
    ).lean(),
  ]);

  const assignedGroupIds = assignedGroups.map((g) => g._id.toString());

  res.status(200).send({
    allGroups,
    assignedGroupIds,
  });
};

