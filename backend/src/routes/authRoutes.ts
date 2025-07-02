import { Router } from 'express';
import authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /auth/google
 * @desc    Initiate Google OAuth login
 * @access  Public
 */
router.get('/google', authController.googleLogin);

/**
 * @route   GET /auth/google/callback
 * @desc    Handle Google OAuth callback
 * @access  Public
 */
router.get('/google/callback', authController.googleCallback);

/**
 * @route   POST /auth/exchange
 * @desc    Exchange temporary authorization code for JWT token
 * @access  Public
 */
router.post('/exchange', authController.exchangeAuthCode);

/**
 * @route   GET /auth/verify
 * @desc    Verify JWT token and return user info
 * @access  Private
 */
router.get('/verify', authController.verifyToken);

/**
 * @route   POST /auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   GET /auth/security/stats
 * @desc    Get OAuth security statistics
 * @access  Private (Admin only - should add admin middleware later)
 */
export default router; 