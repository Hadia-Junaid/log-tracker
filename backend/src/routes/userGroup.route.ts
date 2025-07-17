import { Router } from 'express';
import {
  createUserGroup,
  updateUserGroup,
  deleteUserGroup,
  getUserGroups,
  getUserGroupById,
} from '../controllers/userGroup.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';
import validate from '../middleware/validate';
import { updateUserGroupSchema, createUserGroupSchema } from '../validators/userGroup.validator';

const router = Router();

// GET routes - accessible to all authenticated users
router.get('/', authenticate, requireAdmin, getUserGroups);
router.get('/:id', authenticate,requireAdmin, getUserGroupById);

// Admin-only routes - require both authentication and admin privilege
router.post('/', authenticate, requireAdmin, validate(createUserGroupSchema), createUserGroup);
router.patch('/:id', authenticate, requireAdmin, validate(updateUserGroupSchema), updateUserGroup);
router.delete('/:id', authenticate, requireAdmin, deleteUserGroup);


export default router;
