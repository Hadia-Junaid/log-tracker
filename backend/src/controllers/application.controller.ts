// Controller functions for managing applications
import { Request, Response } from 'express';
import Application from '../models/Application';
import mongoose from 'mongoose';
import logger from '../utils/logger';
import UserGroup from '../models/UserGroup';

// Creates a new application
// Expects req.body to contain application data
// Returns the created application with a 201 status code
export const createApplication = async (req: Request, res: Response): Promise<void> => {
  const existingApp = await Application.findOne({ name: req.body.name }).lean();
  if( existingApp ) {
    logger.warn(`Create request failed: Application already exists with name ${req.body.name}`);
    res.status(409).send({ error: 'Application with this name already exists.' });
    return;
  }
  const app = await Application.create(req.body);

  logger.info(`Application created: ${app.name} (${app._id})`);

  res.status(201).send(app);
};


// Retrieves a list of applications with optional search and pagination
// Expects query parameters: search (string), page (number), limit (number)
// Returns a paginated list of applications matching the search criteria
// If no search is provided, returns all applications
export const getApplications = async (req: Request, res: Response): Promise<void> => {
   const apps = await Application.find().lean();  
    const total = apps.length;

    logger.info(`Fetched ${total} applications (no filtering)`);

    res.send({ data: apps, total });
};

// Updates an existing application by ID
// Expects req.params.id to be the application ID and req.body to contain updated data
// Returns the updated application or an error if not found
export const updateApplication = async (req: Request, res: Response): Promise<void> => {
  const id  = req.params.id.trim();

  if (!mongoose.isValidObjectId(id)) {
    logger.warn(`Invalid update request with malformed ID: ${id}`);
    res.status(400).send({ error: 'Invalid ID' });
    return; 
  }
  const updated = await Application.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true
  });

  if (!updated) {
    logger.warn(`Update failed: Application not found (ID: ${id})`);
    res.status(404).send({ error: 'Application not found' });
    return;
  }

  logger.info(`Application updated (PATCH): ${updated.name} (${updated._id})`);
  res.send(updated);
};

// Deletes an application by ID
// Expects req.params.id to be the application ID
// Returns a success message or an error if not found
export const deleteApplication = async (req: Request, res: Response): Promise<void> => {
  const id  = req.params.id.trim();

  if (!mongoose.isValidObjectId(id)) {
    logger.warn(`Invalid delete request with malformed ID: ${id}`);
    res.status(400).send({ error: 'Invalid ID' });
    return;
  } 

  const deleted = await Application.findByIdAndDelete(id);

  if (!deleted) {
    logger.warn(`Delete failed: Application not found (ID: ${id})`);
    res.status(404).send({ error: 'Application not found' });
    return;
  }

  logger.info(`Application deleted: ${deleted.name} (${deleted._id})`);
  res.send({ message: 'Application deleted successfully.' });
};


// Gets groups assigned to a specific application by ID
// Expects req.params.id to be the application ID
// Returns a list of groups with their ids, names and admin status
export const getAssignedGroups = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id.trim();

  if (!mongoose.isValidObjectId(id)) {
    logger.warn(`Invalid request for assigned groups with malformed ID: ${id}`);
    res.status(400).send({ error: 'Invalid ID' });
    return;

  }

  const groups = await UserGroup.find({ applications: id })
    .select('name is_admin _id')
    .lean();

  res.send(groups);


  if (!groups) {
    logger.warn(`Error fetching assigned groups.`);
    res.status(404).send({ error: 'Application not found' });
    return;
  }
}


// Updates the assigned groups for a specific application by ID
// Expects req.params.id to be the application ID and req.body to contain an array of group IDs
// Returns the updated application or an error if not found
export const updateAssignedGroups = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id.trim();

  if (!mongoose.isValidObjectId(id)) {
    logger.warn(`Invalid request for updating assigned groups with malformed ID: ${id}`);
    res.status(400).send({ error: 'Invalid ID' });
    return;
  }

  const { groupIds } = req.body;

  if (!Array.isArray(groupIds) || groupIds.length === 0) {
    logger.warn(`Update assigned groups failed: Invalid group IDs format`);
    res.status(400).send({ error: 'Group IDs must be an array' });
    return;
  }
  
  const adminGroup = await UserGroup.findOne({ is_admin: true }).lean();
  if (!adminGroup) {
    logger.warn(`Update assigned groups failed: Admin group not found`);
    res.status(500).send({ error: 'Admin group not found' });
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

  res.status(200).send({success:true});
}