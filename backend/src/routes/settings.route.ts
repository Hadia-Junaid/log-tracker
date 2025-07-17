import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getUserSettings,
  updateUserSettings,
  resetUserSettings,
} from '../controllers/settings.controller';

import {validateBody, validateParams} from '../middleware/validate';
import { updateSettingsSchema } from '../validators/settingsSchema';
import { mongoDbIdSchema } from '../validators/mongoId';

const router = express.Router();

// Routes - accessible to all authenticated users
//But for now we did'nt add the authentication
router.get('/:id',authenticate, validateParams(mongoDbIdSchema), getUserSettings);
router.patch('/:id', authenticate, validateParams(mongoDbIdSchema), validateBody(updateSettingsSchema), updateUserSettings);
router.delete('/:id',authenticate, validateParams(mongoDbIdSchema), resetUserSettings);

export default router;
