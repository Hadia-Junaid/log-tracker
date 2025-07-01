import { Router } from 'express';
import { searchUsers } from '../controllers/admin.controller';

const router = Router();

// Helper function to wrap async route handlers
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// GET /api/admin/users/search?searchString=...
router.get('/users/search', asyncHandler(searchUsers));


export default router;