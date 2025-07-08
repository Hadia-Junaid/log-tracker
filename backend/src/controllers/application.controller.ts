// Controller functions for managing applications
import { Request, Response } from "express";
import Application from "../models/Application";
import mongoose from "mongoose";
import logger from "../utils/logger";
import UserGroup from "../models/UserGroup";

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

  const filter = search ? { name: { $regex: search, $options: "i" } } : {};

  const [total, apps] = await Promise.all([
    Application.countDocuments(filter),
    Application.find(filter)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
  ]);

  logger.info(
    `Fetched ${apps.length} apps (page ${page}) with search "${search}"`
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

  logger.info(`Application deleted: ${deleted.name} (${deleted._id})`);
  res.send({ message: "Application deleted successfully." });
};

// Gets groups assigned to a specific application by ID
// Expects req.params.id to be the application ID
// Returns a list of groups with their ids, names and admin status
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
    UserGroup.find({}, "id name is_admin").lean(),
    UserGroup.find({ assigned_applications: appId }, "_id").lean(),
  ]);

  const assignedGroupIds = assignedGroups.map((g) => g._id.toString());

  res.status(200).send({
    allGroups,
    assignedGroupIds,
  });
};

// Updates the assigned groups for a specific application by ID
// Expects req.params.id to be the application ID and req.body to contain an array of group IDs
// Returns the updated application or an error if not found
export const updateAssignedGroups = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = req.params.id.trim();

  if (!mongoose.isValidObjectId(id)) {
    logger.warn(
      `Invalid request for updating assigned groups with malformed ID: ${id}`
    );
    res.status(400).send({ error: "Invalid ID" });
    return;
  }

  const { groupIds } = req.body;

  if (!Array.isArray(groupIds) || groupIds.length === 0) {
    logger.warn(`Update assigned groups failed: Invalid group IDs format`);
    res.status(400).send({ error: "Group IDs must be an array" });
    return;
  }

  const adminGroup = await UserGroup.findOne({ is_admin: true }).lean();
  if (!adminGroup) {
    logger.warn(`Update assigned groups failed: Admin group not found`);
    res.status(500).send({ error: "Admin group not found" });
    return;
  }

  const adminGroupId = adminGroup._id.toString();
  if (!groupIds.includes(adminGroupId)) {
    groupIds.push(adminGroupId);
  }

  // Step 1: Remove appId from all groups
  await UserGroup.updateMany(
    { assigned_applications: id },
    { $pull: { assigned_applications: id } }
  );

  // Step 2: Add appId to the selected groups (including admin group)
  await UserGroup.updateMany(
    { _id: { $in: groupIds } },
    { $addToSet: { assigned_applications: id } }
  );

  res.status(200).send({ success: true });
};
