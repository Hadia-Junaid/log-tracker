// Defines the routes for managing applications
import express from 'express';
import { createApplication, getApplications, updateApplication, deleteApplication,getAssignedGroups } from '../controllers/application.controller';
import { applicationSchema, getApplicationsQuerySchema } from '../validators/application';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';
import { validateParams, validateBody, validateQuery } from '../middleware/validate';
import { mongoDbIdSchema } from '../validators/mongoId';

const router = express.Router();

// GET routes - accessible to all authenticated users
router.get('/', authenticate, validateQuery(getApplicationsQuerySchema), getApplications);

// Admin-only routes - require both authentication and admin privileges
router.post('/', authenticate, requireAdmin ,validateBody(applicationSchema), createApplication);
router.patch('/:id', authenticate, requireAdmin, validateParams(mongoDbIdSchema), validateBody(applicationSchema), updateApplication);
router.delete('/:id', authenticate, requireAdmin, validateParams(mongoDbIdSchema), deleteApplication);

// GET /api/applications/:id/assigned-groups - Get groups assigned to an application
router.get('/:id/assigned-groups', authenticate, requireAdmin, validateParams(mongoDbIdSchema), getAssignedGroups);


export default router;
