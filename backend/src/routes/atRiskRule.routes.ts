import express from 'express';
import {
  getAllAtRiskRules,
  getAtRiskRuleById,
  createAtRiskRule,
  updateAtRiskRule,
  deleteAtRiskRule
} from '../controllers/settings.controller';

import validate from '../middleware/validate';
import { atRiskRuleSchema } from '../validators/settingsSchema';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();

// Routes - accessible to all authenticated users and require admin privileges
//But for now we did'nt add the authentication
router.get('/',authenticate, requireAdmin, getAllAtRiskRules);
router.get('/:id',authenticate, requireAdmin, getAtRiskRuleById);
router.post('/',authenticate, requireAdmin, validate(atRiskRuleSchema), createAtRiskRule);
router.patch('/:id',authenticate, requireAdmin, validate(atRiskRuleSchema), updateAtRiskRule);
router.delete('/:id',authenticate, requireAdmin, deleteAtRiskRule);

export default router;
