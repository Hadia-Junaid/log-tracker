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
import {validateBody, validateParams, validateQuery} from '../middleware/validate';
import { updateUserGroupSchema, createUserGroupSchema, getUserGroupsQuerySchema} from '../validators/userGroup.validator';
import { mongoDbIdSchema } from '../validators/mongoId';

const router = Router();

// GET routes - accessible to all authenticated users
router.get('/', authenticate, requireAdmin, validateQuery(getUserGroupsQuerySchema), getUserGroups);
router.get('/:id', authenticate,requireAdmin, validateParams(mongoDbIdSchema), getUserGroupById);

// Admin-only routes - require both authentication and admin privilege
router.post('/', authenticate, requireAdmin, validateBody(createUserGroupSchema), createUserGroup);
router.patch('/:id', authenticate, requireAdmin, validateParams(mongoDbIdSchema), validateBody(updateUserGroupSchema), updateUserGroup);
router.delete('/:id', authenticate, requireAdmin, validateParams(mongoDbIdSchema), deleteUserGroup);


export default router;
