import { Request, Response } from "express";
import UserGroup from "../models/UserGroup";
import User from "../models/User";
import Application from "../models/Application";
import logger from "../utils/logger";
import mongoose from "mongoose";
import { fetchUserFromDirectory } from "../utils/fetchUserFromDirectory";
import { getSuperAdminEmails } from "../utils/getSuperAdminEmails";
import { createUserGroupSchema, updateUserGroupSchema } from "../validators/userGroup.validator";

export const createUserGroup = async (
  req: Request,
  res: Response
): Promise<void> => {
  // Trim the name before validation
  if (req.body.name) {
    req.body.name = req.body.name.trim();
  }

  // Validate input using Joi schema
  const { error, value } = createUserGroupSchema.validate(req.body);
  if (error) {
    res.status(400).json({ error: error.details[0].message });
    return;
  }

  const {
    name,
    is_admin = false,
    is_active = true,
    members = [],
    assigned_applications = [],
  } = value;

  // Check if the group name already exists (after trim and validation)
  const existingGroup = await UserGroup.findOne({ name });
  if (existingGroup) {
    res.status(400).json({ error: "A group with this name already exists." });
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
    is_active,
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
  const { name, is_admin, is_active, assigned_applications = [], members = [] } = req.body;

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

  // Validate input for non-admin groups
  if (!finalIsAdmin) {
    const { error } = updateUserGroupSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }
  }

  // For admin groups, override applications with all available apps
  const validAppIds = finalIsAdmin
    ? await Application.find().distinct("_id")
    : await Application.find({ _id: { $in: assigned_applications } }).distinct("_id");

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

  //change the response to include members emails and application names in the members and assigned_applications fields
  const populatedGroup = await UserGroup.findById(id)
    .populate('assigned_applications', 'name')
    .populate('members', 'email');
  
  if (!populatedGroup) {
    res.status(404).json({ error: 'User group not found after update' });
    return;
  }

  logger.info(`✅ User group '${id}' updated successfully.`);

  res.status(200).json(populatedGroup);
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
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.max(1, parseInt(req.query.pageSize as string) || 8);
  const search = (req.query.search as string)?.trim() || "";
  const { is_admin, is_active } = req.query;
  
  const filter: any = {};

  if (search) filter.name = { $regex: search, $options: "i" };
  if (is_admin !== undefined) filter.is_admin = is_admin === "true";
  if (is_active !== undefined) filter.is_active = is_active === "true";

  const [total, groups] = await Promise.all([
    UserGroup.countDocuments(filter),
    UserGroup.find(filter)
      .select('name is_admin is_active assigned_applications members createdAt updatedAt')
      .populate("assigned_applications")
      .populate("members")
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
  ]);

  logger.info(
    `Fetched ${groups.length} groups (page ${page}) with search "${search}"`
  );
  //print all groups
  groups.forEach(group => {
    logger.info(`Group: ${group.name}, Admin: ${group.is_admin}, Active: ${group.is_active}`);
  });
  res.json({ data: groups, total });
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
