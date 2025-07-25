import { Request, Response } from "express";
import UserGroup from "../models/UserGroup";
import User, { IUser } from "../models/User";
import Application from "../models/Application";
import logger from "../utils/logger";
import mongoose from "mongoose";
import { fetchUserFromDirectory } from "../utils/fetchUserFromDirectory";
import { getSuperAdminEmails } from "../utils/getSuperAdminEmails";
import {
  createUserGroupSchema,
  updateUserGroupSchema,
} from "../validators/userGroup.validator";
import { escapeRegex } from "../utils/escapeRegex";

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


  // Get all existing users
  //Get array of emails from members
  const memberEmails = members.map((m: { email: string }) => m.email);
  const existingUsers = await User.find({ email: { $in: memberEmails } });
  // If any members NOT in existingUsers, add them to Users
  // new Members
  const newMembers = members.filter(
    (member: { email: string }) =>
      !existingUsers.some((user) => user.email === member.email)
  );
  logger.debug("New members to be added:" + JSON.stringify(newMembers));

  // Add newMembers to the User db

  // Build new user documents
  const newUserDocs = newMembers.map((member: { name: string; email: string }) => ({
    email: member.email,
    name: member.name,
    is_active: true,
    pinned_applications: [],
    
  }));

  // Insert all new users
  let insertedUsers: any[] = [];
  if (newUserDocs.length > 0) {
      insertedUsers = await User.insertMany(newUserDocs, { ordered: false });
    
  }
  // Combine existing and inserted users
  const allUsers = [...existingUsers, ...insertedUsers];

  // Add their ObjectIds to verifiedMemberIds
  allUsers.forEach((user) => {
    if (user._id) {
      verifiedMemberIds.push(user._id as mongoose.Types.ObjectId);
    }
  });

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
  const {
    name,
    is_admin,
    is_active,
    assigned_applications = [],
    members = [],
  } = req.body;

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
    : await Application.find({ _id: { $in: assigned_applications } }).distinct(
        "_id"
      );

  const superAdminEmails = getSuperAdminEmails();
  const verifiedMemberIds: mongoose.Types.ObjectId[] = [];
  logger.debug("Members array" + JSON.stringify(members));

  // Get all existing users
  //Get array of emails from members
  const memberEmails = members.map((m: { email: string }) => m.email);
  const existingUsers = await User.find({ email: { $in: memberEmails } });
  // If any members NOT in existingUsers, add them to Users
  // new Members
  const newMembers = members.filter(
    (member: { email: string }) =>
      !existingUsers.some((user) => user.email === member.email)
  );

  // Add newMembers to the User db

  // Build new user documents
  const newUserDocs = newMembers.map((member: { name: string; email: string }) => ({
    email: member.email,
    name: member.name,
    is_active: true,
    is_super_admin: superAdminEmails.includes(member.email),
    pinned_applications: [],
   
  }));

  // Insert all new users
  let insertedUsers: any[] = [];
  if (newUserDocs.length > 0) {
      insertedUsers = await User.insertMany(newUserDocs, { ordered: false });
    
  }
  // Combine existing and inserted users
  const allUsers = [...existingUsers, ...insertedUsers];

  // Add their ObjectIds to verifiedMemberIds
  allUsers.forEach((user) => {
    if (user._id) {
      verifiedMemberIds.push(user._id as mongoose.Types.ObjectId);
    }
  });

  //   verifiedMemberIds.push(user._id as mongoose.Types.ObjectId);
  // }

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
      is_active: typeof is_active === "boolean" ? is_active : group.is_active,
    },
    { new: true }
  );

  logger.info(`✅ User group '${id}' updated successfully.`);

  res.status(200).json({ message: "User group updated successfully", group });
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
  const allPages = req.query.allPages === "true" ? true : false;

  logger.debug(`Fetching user groups (allPages: ${allPages})`);

  const filter: any = {};

  if (search) {
    const escapedSearch = escapeRegex(search);
    logger.info(`Escaped search term: ${escapedSearch}`);
    logger.debug(`Search regex: /${escapedSearch}/i`);
    filter.name = { $regex: escapedSearch, $options: "i" };
  }
  if (is_admin !== undefined) filter.is_admin = is_admin === "true";
  if (is_active !== undefined) filter.is_active = is_active === "true";

  const [total, groups] = await Promise.all([
    UserGroup.countDocuments(filter),
    UserGroup.find(filter)
      .select(
        "name is_admin is_active assigned_applications members createdAt updatedAt"
      )
      .populate("assigned_applications")
      .populate("members")
      .skip(allPages ? 0 : (page - 1) * pageSize)
      .limit(allPages ? 0 : pageSize)
      .lean(),
  ]);

  logger.info(
    `Fetched ${groups.length} groups (page ${page}) with search "${search}"`
  );

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
    .populate("members")
    .populate("is_active");

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
