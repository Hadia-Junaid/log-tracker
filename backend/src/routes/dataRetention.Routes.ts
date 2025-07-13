// src/routes/dataRetention.ts

import express from 'express'
import {
  getDataRetention,
  updateDataRetention
} from '../controllers/settings.Controller'
import validate from '../middleware/validate'
import { updateRetentionSchema } from '../validators/settingsSchema'
// import { authenticate } from '../middleware/auth' // Uncomment when needed

const router = express.Router()

router.get('/', /* authenticate, */ getDataRetention)
router.patch('/', /* authenticate, */ validate(updateRetentionSchema), updateDataRetention)

export default router
