import { Router } from 'express';
import { searchUsers } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

// Helper function to wrap async route handlers
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Admin-only routes - require both authentication and admin privileges
router.get('/users/search', authenticate, asyncHandler(searchUsers));

export default router;