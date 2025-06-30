import { Router } from 'express';
import authController from '../controllers/authController';

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
router.post('/logout', authController.logout);

/**
 * @route   GET /auth/security/stats
 * @desc    Get OAuth security statistics
 * @access  Private (Admin only - should add admin middleware later)
 */
export default router; 