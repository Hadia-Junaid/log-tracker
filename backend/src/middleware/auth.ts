import { Request, Response, NextFunction } from 'express';
import jwtService from '../services/jwtService';
import User from '../models/User';
import logger from '../utils/logger';
import { checkUserAdminStatus } from '../utils/checkAdminStatus';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.jwt;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication token is missing',
      });
      return;
    }

    const decoded = jwtService.verifyToken(token);

    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Check current admin status from database instead of relying on token
    const isAdmin = await checkUserAdminStatus(user.email);

    req.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      settings: user.settings,
      pinned_applications: user.pinned_applications,
      is_admin: isAdmin,
    };

    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};
