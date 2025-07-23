// src/routes/dataRetention.ts

import express from 'express'
import {
  getDataRetention,
  updateDataRetention
} from '../controllers/settings.controller'
import {validateBody} from '../middleware/validate'
import { updateRetentionSchema } from '../validators/settingsSchema'
import { authenticate } from '../middleware/auth' // Uncomment when needed
import { requireAdmin } from '../middleware/adminAuth' // Uncomment when needed

const router = express.Router()

router.get('/',  authenticate, getDataRetention)
router.patch('/', authenticate, requireAdmin, validateBody(updateRetentionSchema), updateDataRetention)

export default router
