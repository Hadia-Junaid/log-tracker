import { Request, Response } from "express";
import UserGroup from "../models/UserGroup";
import User from "../models/User";
import Application from "../models/Application";
import logger from "../utils/logger";
import mongoose from "mongoose";
import { fetchUserFromDirectory } from "../utils/fetchUserFromDirectory";
import { getSuperAdminEmails } from "../utils/getSuperAdminEmails";

export const createUserGroup = async (
  req: Request,
  res: Response
): Promise<void> => {
  //check if the group name is already in the database
  const existingGroup = await UserGroup.findOne({ name: req.body.name });
  if (existingGroup) {
    res.status(409).json({ error: "Group name already exists." });
    return;
  }

  const {
    name,
    is_admin = false,
    members = [],
    assigned_applications = [],
  } = req.body;

  if (!name) {
    res.status(400).json({ error: "Group name is required." });
    return;
  }

  if (!Array.isArray(members)) {
    res.status(400).json({ error: "Members must be an array." });
    return;
  }

  const validApps = await Application.find({
    _id: { $in: assigned_applications },
  }).select("_id");
  const validAppIds = validApps.map((app) => app._id);

  const verifiedMemberIds: mongoose.Types.ObjectId[] = [];

  // Only process members if the array is not empty
  if (members.length > 0) {
    for (const email of members) {
      let user = await User.findOne({ email });

      if (!user) {
        const userData = await fetchUserFromDirectory(email);
        if (!userData) {
          res
            .status(404)
            .json({ error: `User ${email} not found in directory API.` });
          return;
        }

        user = new User({
          email: userData.email,
          name: userData.name,
          pinned_applications: [],
          settings: {
            autoRefresh: false,
            autoRefreshTime: 30,
            logsPerPage: 50,
          },
        });

        await user.save();
        logger.info(` Created new user from directory API: ${email}`);
      }

      verifiedMemberIds.push(user._id as mongoose.Types.ObjectId);
    }
  }

  const userGroup = new UserGroup({
    name,
    is_admin,
    assigned_applications: validAppIds,
    members: verifiedMemberIds,
  });

  await userGroup.save();
  logger.info(
    `✅ User group '${name}' created with ${verifiedMemberIds.length} members.`
  );
  res.status(201).json(userGroup);
};

export const updateUserGroup = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { name, is_admin, applications = [], members = [] } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: "Invalid group ID." });
    return;
  }

  const group = await UserGroup.findById(id);
  if (!group) {
    res.status(404).json({ error: "User group not found" });
    return;
  }

  // Determine if this is an admin group (existing or being updated to one)
  const finalIsAdmin =
    typeof is_admin === "boolean" ? is_admin : group.is_admin;

  // For admin groups, override applications with all available apps
  const validAppIds = finalIsAdmin
    ? await Application.find().distinct("_id")
    : await Application.find({ _id: { $in: applications } }).distinct("_id");

  const superAdminEmails = getSuperAdminEmails();
  const verifiedMemberIds: mongoose.Types.ObjectId[] = [];

  for (const email of members) {
    let user = await User.findOne({ email }).select("_id");

    if (!user) {
      const userData = await fetchUserFromDirectory(email);
      if (!userData) {
        res
          .status(404)
          .json({ error: `User ${email} not found in directory API.` });
        return;
      }

      user = await User.create({
        email: userData.email,
        name: userData.name,
        pinned_applications: [],
        settings: {
          autoRefresh: false,
          autoRefreshTime: 30,
          logsPerPage: 50,
        },
      });

      logger.info(`Created user ${email} during group update.`);
    }

    verifiedMemberIds.push(user._id as mongoose.Types.ObjectId);
  }

  // Prevent removal of super admins from admin group
  if (finalIsAdmin) {
    const allSuperAdminUsers = (await User.find({
      email: { $in: superAdminEmails },
    }).select("_id")) as { _id: mongoose.Types.ObjectId }[];

    const currentMemberIds = verifiedMemberIds.map((id) => id.toString());

    allSuperAdminUsers.forEach(({ _id }) => {
      const idStr = _id.toString();
      if (!currentMemberIds.includes(idStr)) {
        verifiedMemberIds.push(_id); // _id is already a valid ObjectId
      }
    });
  }

  const updatedGroup = await UserGroup.findByIdAndUpdate(
    id,
    {
      ...(name && { name }),
      ...(typeof is_admin === "boolean" && { is_admin }),
      assigned_applications: validAppIds,
      members: verifiedMemberIds,
    },
    { new: true }
  );

  logger.info(`✅ User group '${id}' updated successfully.`);
  res.status(200).json(updatedGroup);
};

export const deleteUserGroup = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: "Invalid group ID" });
    return;
  }

  //fetch group and check if is_admin
  const deletedGroup = await UserGroup.findOneAndDelete({
    _id: id,
    is_admin: false,
  });

  if (!deletedGroup) {
    res
      .status(404)
      .json({ error: "User group not found or is an admin group" });
    return;
  }

  logger.info(`✅ User group '${id}' deleted.`);
  res.status(200).json({ message: "Group deleted successfully" });
};

export const getUserGroups = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { name, is_admin } = req.query;
  const filter: any = {};

  if (name) filter.name = { $regex: name as string, $options: "i" };
  if (is_admin !== undefined) filter.is_admin = is_admin === "true";

  const groups = await UserGroup.find(filter)
    .populate("assigned_applications")
    .populate("members");

  logger.info(`ℹ️ Retrieved ${groups.length} user groups.`);
  res.status(200).json(groups);
};

export const getUserGroupById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: "Invalid group ID" });
    return;
  }

  const group = await UserGroup.findById(id)
    .populate("assigned_applications")
    .populate("members");

  if (!group) {
    res.status(404).json({ error: "User group not found" });
    return;
  }

  // Prepare response object and add super admin emails if it is an admin group
  let responseGroup: any = group.toObject();

  if (group.is_admin) {
    const superAdminEmails = getSuperAdminEmails();
    responseGroup.super_admin_emails = superAdminEmails;
  }

  logger.info(`ℹ️ Retrieved user group: ${group.name}`);
  res.status(200).json(responseGroup);
};

//API endpoint for assigning application to user group (PATCH)

export const assignApplicationToUserGroup = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { applicationId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: "Invalid group ID" });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(applicationId)) {
    res.status(400).json({ error: "Invalid application ID" });
    return;
  }

  const userGroup = await UserGroup.findById(id);
  if (!userGroup) {
    res.status(404).json({ error: "User group not found" });
    return;
  }

  if (userGroup.assigned_applications.includes(applicationId)) {
    res
      .status(400)
      .json({ error: "Application already assigned to this group" });
    return;
  }

  userGroup.assigned_applications.push(applicationId);
  await userGroup.save();

  logger.info(
    `✅ Application '${applicationId}' assigned to user group '${id}'.`
  );
  res.status(200).json(userGroup);
};

export const removeApplicationFromUserGroup = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { applicationId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: "Invalid group ID" });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(applicationId)) {
    res.status(400).json({ error: "Invalid application ID" });
    return;
  }

  const userGroup = await UserGroup.findById(id);
  if (!userGroup) {
    res.status(404).json({ error: "User group not found" });
    return;
  }

  const index = userGroup.assigned_applications.indexOf(applicationId);
  if (index === -1) {
    res.status(400).json({ error: "Application not assigned to this group" });
    return;
  }

  userGroup.assigned_applications.splice(index, 1);
  await userGroup.save();

  logger.info(
    `✅ Application '${applicationId}' removed from user group '${id}'.`
  );
  res.status(200).json(userGroup);
};
