import { Router } from 'express';
import { searchUsers } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

router.get('/users/search', authenticate,requireAdmin, searchUsers);

export default router;
