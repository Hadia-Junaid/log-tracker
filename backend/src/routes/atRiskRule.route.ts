import express from 'express';
import {
  getAllAtRiskRules,
  getAtRiskRuleById,
  createAtRiskRule,
  updateAtRiskRule,
  deleteAtRiskRule
} from '../controllers/settings.controller';

import {validateBody, validateParams} from '../middleware/validate';
import { atRiskRuleSchema } from '../validators/settingsSchema';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';
import { mongoDbIdSchema } from '../validators/mongoId';

const router = express.Router();

// Routes - accessible to all authenticated users and require admin privileges
//But for now we did'nt add the authentication
router.get('/',authenticate, requireAdmin, getAllAtRiskRules);
router.get('/:id',authenticate, requireAdmin, validateParams(mongoDbIdSchema), getAtRiskRuleById);
router.post('/',authenticate, requireAdmin, validateBody(atRiskRuleSchema), createAtRiskRule);
router.patch('/:id',authenticate, requireAdmin, validateBody(atRiskRuleSchema), updateAtRiskRule);
router.delete('/:id',authenticate, requireAdmin, validateParams(mongoDbIdSchema), deleteAtRiskRule);

export default router;
