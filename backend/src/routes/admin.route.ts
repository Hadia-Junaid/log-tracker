import { Router } from 'express';
import { searchUsers } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/users/search', authenticate, searchUsers);

export default router;
