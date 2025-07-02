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
import { remove } from 'winston';

const router = Router();

router.post('/', createUserGroup);
router.get('/', getUserGroups);
router.patch('/:id', updateUserGroup);
router.delete('/:id', deleteUserGroup);
router.get('/:id', getUserGroupById);
//API endpoint for assigning application to user group (PATCH)
router.patch('/:id/assign-application', assignApplicationToUserGroup);
//API endpoint for unassigning application from user group (DELETE)
router.delete('/:id/unassign-application', removeApplicationFromUserGroup);

export default router;
