import { Router } from 'express';
import { getLogs, exportLogs, userdata, getLogActivityData } from '../controllers/logs.controller';
import { authenticate } from '../middleware/auth';
import { validateParams, validateQuery } from '../middleware/validate';
import { mongoDbIdSchema } from '../validators/mongoId';
import { getLogsQuerySchema, exportLogsQuerySchema, getLogActivityQuerySchema } from '../validators/logs';

const router = Router();

// GET /apilogs/:userId
// router.get('/apilogs/:userId', authenticate, getLogs);
router.get('/', authenticate, validateQuery(getLogsQuerySchema), getLogs);

// GET /api/logs/activity - Get aggregated log activity data for charts
router.get('/activity', authenticate, validateQuery(getLogActivityQuerySchema), getLogActivityData);

// GET /apilogs/:userId/export
// router.get('/apilogs/:userId/export', authenticate, exportLogs);
router.get('/:userId/export', authenticate, validateParams(mongoDbIdSchema), exportLogs);
router.get('/export', authenticate, validateQuery(exportLogsQuerySchema), exportLogs);
router.get('/userdata', authenticate, userdata);

export default router; 