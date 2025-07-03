// Defines the routes for managing applications
import express from 'express';
import { createApplication, getApplications, updateApplication, deleteApplication,getAssignedGroups, updateAssignedGroups } from '../controllers/application.controller';
import validate from './../middleware/validate';
import { applicationSchema } from '../validators/application';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();

// GET routes - accessible to all authenticated users
router.get('/', authenticate, getApplications);

// Admin-only routes - require both authentication and admin privileges
router.post('/', authenticate, requireAdmin, validate(applicationSchema), createApplication);
router.patch('/:id', authenticate, requireAdmin, validate(applicationSchema), updateApplication);
router.delete('/:id', authenticate, requireAdmin, deleteApplication);

// GET /api/applications/:id/assigned-groups - Get groups assigned to an application
router.get('/:id/assigned-groups', authenticate, requireAdmin, getAssignedGroups);     

// PATCH /api/applications/:id/assigned-groups - Update groups assigned to an application
router.patch('/:id/assigned-groups', authenticate, requireAdmin, updateAssignedGroups);

export default router;
