// Defines the routes for managing applications
import express from 'express';
import { createApplication, getApplications, updateApplication, deleteApplication,getAssignedGroups, updateAssignedGroups } from '../controllers/application.controller';
import validate from './../middleware/validate';
import { applicationSchema } from '../validators/application';

const router = express.Router();

// GET /api/applications - Get all applications with optional search and pagination
router.get('/', getApplications);

// POST /api/applications - Create a new application
router.post('/', validate(applicationSchema), createApplication);

// PATCH /api/applications/:id - Update an existing application by ID
router.patch('/:id', validate(applicationSchema), updateApplication);

// DELETE /api/applications/:id - Delete an application by ID
router.delete('/:id', deleteApplication);

// GET /api/applications/:id/assigned-groups - Get groups assigned to an application
router.get('/:id/assigned-groups', getAssignedGroups);     

// PATCH /api/applications/:id/assigned-groups - Update groups assigned to an application
router.patch('/:id/assigned-groups', updateAssignedGroups); // 

export default router;
