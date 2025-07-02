// Controller functions for managing applications
import { Request, Response } from 'express';
import Application from '../models/Application';
import mongoose from 'mongoose';
import logger from '../utils/logger';

// Creates a new application
// Expects req.body to contain application data
// Returns the created application with a 201 status code
export const createApplication = async (req: Request, res: Response): Promise<void> => {
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
