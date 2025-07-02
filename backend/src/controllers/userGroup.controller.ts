import { Request, Response } from 'express';
import UserGroup from '../models/UserGroup';
import User from '../models/User';
import Application from '../models/Application';
import logger from '../utils/logger';
import mongoose from 'mongoose';
import { fetchUserFromDirectory } from '../utils/fetchUserFromDirectory';

export const createUserGroup = async (req: Request, res: Response): Promise<void> => {
  //check if the group name is already in the database
  const existingGroup = await UserGroup.findOne({ name: req.body.name });
  if (existingGroup) {
    res.status(409).json({ error: 'Group name already exists.' });
    return;
  }

  const { name, is_admin = false, members = [], assigned_applications = [] } = req.body;

  if (!name) {
    res.status(400).json({ error: 'Group name is required.' });
    return;
  }

  if (!Array.isArray(members)) {
    res.status(400).json({ error: 'Members must be an array.' });
    return;
  }

  const validApps = await Application.find({ _id: { $in: assigned_applications } }).select('_id');
  const validAppIds = validApps.map(app => app._id);

  const verifiedMemberIds: mongoose.Types.ObjectId[] = [];

  // Only process members if the array is not empty
  if (members.length > 0) {
    for (const email of members) {
      let user = await User.findOne({ email });

      if (!user) {
        const userData = await fetchUserFromDirectory(email);
        if (!userData) {
          res.status(404).json({ error: `User ${email} not found in directory API.` });
          return;
        }

        user = new User({
          email: userData.email,
          name: userData.name,
          pinned_applications: [],
          settings: {
            autoRefresh: false,
            autoRefreshTime: 30,
            logsPerPage: 50
          }
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
    members: verifiedMemberIds
  });

  await userGroup.save();
  logger.info(`✅ User group '${name}' created with ${verifiedMemberIds.length} members.`);
  res.status(201).json(userGroup);
};

export const updateUserGroup = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, is_admin, assigned_applications = [], members = [] } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: 'Invalid group ID.' });
    return;
  }

  const validApps = await Application.find({ _id: { $in: assigned_applications } }).select('_id');
  const validAppIds = validApps.map(app => app._id);

  const verifiedMemberIds: mongoose.Types.ObjectId[] = [];

  for (const email of members) {
    let user = await User.findOne({ email });

    if (!user) {
      const userData = await fetchUserFromDirectory(email);
      if (!userData) {
        res.status(404).json({ error: `User ${email} not found in directory API.` });
        return;
      }

      user = new User({
        email: userData.email,
        name: userData.name,
        pinned_applications: [],
        settings: {
          autoRefresh: false,
          autoRefreshTime: 30,
          logsPerPage: 50
        }
      });

      await user.save();
      logger.info(` Created user ${email} during group update.`);
    }

    verifiedMemberIds.push(user._id as mongoose.Types.ObjectId);
  }

  const updatedGroup = await UserGroup.findByIdAndUpdate(
    id,
    {
      name,
      is_admin,
      assigned_applications: validAppIds,
      members: verifiedMemberIds
    },
    { new: true }
  );

  if (!updatedGroup) {
    res.status(404).json({ error: 'User group not found' });
    return;
  }

  logger.info(`✅ User group '${id}' updated successfully.`);
  res.status(200).json(updatedGroup);
};

export const deleteUserGroup = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: 'Invalid group ID' });
    return;
  }

  const deletedGroup = await UserGroup.findByIdAndDelete(id);
  if (!deletedGroup) {
    res.status(404).json({ error: 'User group not found' });
    return;
  }

  logger.info(`✅ User group '${id}' deleted.`);
  res.status(200).json({ message: 'Group deleted successfully' });
};

export const getUserGroups = async (req: Request, res: Response): Promise<void> => {
  const { name, is_admin } = req.query;
  const filter: any = {};

  if (name) filter.name = { $regex: name as string, $options: 'i' };
  if (is_admin !== undefined) filter.is_admin = is_admin === 'true';

  const groups = await UserGroup.find(filter)
    .populate('assigned_applications')
    .populate('members');

  logger.info(`ℹ️ Retrieved ${groups.length} user groups.`);
  res.status(200).json(groups);
};

export const getUserGroupById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: 'Invalid group ID' });
    return;
  }

  const group = await UserGroup.findById(id)
    .populate('assigned_applications')
    .populate('members');

  if (!group) {
    res.status(404).json({ error: 'User group not found' });
    return;
  }

  logger.info(`ℹ️ Retrieved user group: ${group.name}`);
  res.status(200).json(group);
};
