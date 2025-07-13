import { Router } from 'express';
import { getLogs, exportLogs, userdata, getLogActivityData } from '../controllers/logs.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /apilogs/:userId
// router.get('/apilogs/:userId', authenticate, getLogs);
router.get('/', authenticate, getLogs);

// GET /api/logs/activity - Get aggregated log activity data for charts
router.get('/activity', authenticate, getLogActivityData);

// GET /apilogs/:userId/export
// router.get('/apilogs/:userId/export', authenticate, exportLogs);
router.get('/:userId/export', exportLogs);
router.get('/export', authenticate, exportLogs);
router.get('/userdata', authenticate, userdata);

export default router; 