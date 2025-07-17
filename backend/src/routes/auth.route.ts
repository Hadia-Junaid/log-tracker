import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import {validateBody, validateQuery} from '../middleware/validate';
import { exchangeAuthCodeSchema, callbackCodeSchema } from '../validators/auth';

const router = Router();


router.get('/google', authController.googleLogin);

router.get('/google/callback', validateQuery(callbackCodeSchema), authController.googleCallback);

router.post('/exchange', validateBody(exchangeAuthCodeSchema), authController.exchangeAuthCode);

router.get('/verify', authController.verifyToken);

router.post('/logout', authenticate, authController.logout);

router.get("/status", authController.getAuthStatus);


export default router; 