import { Router } from 'express';
import {
  createUserGroup,
  updateUserGroup,
  deleteUserGroup,
  getUserGroups,
  getUserGroupById
} from '../controllers/userGroup.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

// GET routes - accessible to all authenticated users
router.get('/', authenticate, getUserGroups);
router.get('/:id', authenticate, getUserGroupById);

// Admin-only routes - require both authentication and admin privileges
router.post('/', authenticate, requireAdmin, createUserGroup);
router.patch('/:id', authenticate, requireAdmin, updateUserGroup);
router.delete('/:id', authenticate, requireAdmin, deleteUserGroup);

export default router;
