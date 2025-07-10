import { Router } from 'express';
import {
  createUserGroup,
  updateUserGroup,
  deleteUserGroup,
  getUserGroups,
  getUserGroupById,
  assignApplicationToUserGroup,
  removeApplicationFromUserGroup
} from '../controllers/userGroup.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

// GET routes - accessible to all authenticated users
router.get('/', getUserGroups);
router.get('/:id', authenticate, getUserGroupById);

// Admin-only routes - require both authentication and admin privilege
router.post('/', authenticate, requireAdmin, createUserGroup);
router.patch('/:id', authenticate, requireAdmin, updateUserGroup);
router.delete('/:id', authenticate, requireAdmin, deleteUserGroup);

//API endpoint for assigning application to user group (PATCH)
router.patch('/:id/assign-application', authenticate, requireAdmin,assignApplicationToUserGroup);
//API endpoint for unassigning application from user group (DELETE)
router.delete('/:id/unassign-application', authenticate, requireAdmin, removeApplicationFromUserGroup);

export default router;
