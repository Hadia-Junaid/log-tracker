// Defines the routes for managing applications
import express from 'express';
import { createApplication, getApplications, updateApplication, deleteApplication } from '../controllers/application.controller';
import validate from './../middleware/validate';
import { addApplicationSchema, updateApplicationSchema } from '../validators/application';

const router = express.Router();

// GET /api/applications - Get all applications with optional search and pagination
router.get('/', getApplications);

// POST /api/applications - Create a new application
router.post('/', validate(addApplicationSchema), createApplication);

// PATCH /api/applications/:id - Update an existing application by ID
router.patch('/:id', validate(updateApplicationSchema), updateApplication);

// DELETE /api/applications/:id - Delete an application by ID
router.delete('/:id', deleteApplication);

export default router;
