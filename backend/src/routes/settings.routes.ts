import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getUserSettings,
  updateUserSettings,
  resetUserSettings,
} from '../controllers/settings.controller';

import validate from '../middleware/validate';
import { updateSettingsSchema } from '../validators/settingsSchema';

const router = express.Router();

// Routes - accessible to all authenticated users
//But for now we did'nt add the authentication
router.get('/:id',authenticate, getUserSettings);
router.patch('/:id', authenticate, validate(updateSettingsSchema), updateUserSettings);
router.delete('/:id',authenticate, resetUserSettings);

export default router;
