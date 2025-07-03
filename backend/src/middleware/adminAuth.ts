import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Middleware to check if the authenticated user has admin privileges
 * This middleware should be used after the authenticate middleware
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Check if user is authenticated (should be set by authenticate middleware)
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Check if user has admin privileges
    if (!req.user.is_admin) {
      logger.warn(`Access denied for non-admin user: ${req.user.email}`);
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
      return;
    }

    logger.info(`Admin access granted for user: ${req.user.email}`);
    next();

  } catch (error) {
    logger.error('Admin authorization middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authorization'
    });
  }
}; 