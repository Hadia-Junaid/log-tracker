import { Router } from 'express';
import { getLogs, exportLogs } from '../controllers/logs.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /apilogs/:userId
// router.get('/apilogs/:userId', authenticate, getLogs);
router.get('/', authenticate, getLogs);

// GET /apilogs/:userId/export
// router.get('/apilogs/:userId/export', authenticate, exportLogs);
router.get('/:userId/export', exportLogs);

export default router; 