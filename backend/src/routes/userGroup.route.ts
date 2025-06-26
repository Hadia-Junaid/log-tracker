import { Router } from 'express';
import {
  createUserGroup,
  updateUserGroup,
  deleteUserGroup,
  getUserGroups,
  getUserGroupById
} from '../controllers/userGroup.controller';

const router = Router();

router.post('/', createUserGroup);
router.patch('/:id', updateUserGroup);
router.delete('/:id', deleteUserGroup);
router.get('/', getUserGroups);
router.get('/:id', getUserGroupById);

export default router;
