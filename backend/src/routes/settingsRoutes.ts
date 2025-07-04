import express from 'express';
import { getUserSettings, updateUserSettings, resetUserSettings } from '../controllers/settingsController';
import validate from '../middleware/validate';
import { updateSettingsSchema } from '../validators/settingsSchema';

const router = express.Router();

//authentication is not applied here for simplicity, but you should apply it in production
// GET /api/settings/id
router.get('/:id', getUserSettings);

// PATCH /api/settings/id
router.patch('/:id', validate(updateSettingsSchema), updateUserSettings);

router.delete('/:id', resetUserSettings); // Reset settings to default

export default router;
