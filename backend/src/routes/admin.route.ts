import { Router } from 'express';
import { searchUsers } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';
import validate from '../middleware/validate';
import { searchUsersSchema } from '../validators/admin';

const router = Router();

router.get('/users/search', authenticate,requireAdmin, validate(searchUsersSchema), searchUsers);

export default router;
