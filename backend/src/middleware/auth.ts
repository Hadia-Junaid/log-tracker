import { Request, Response, NextFunction } from 'express';
import jwtService from '../services/jwtService';
import User from '../models/User';
import logger from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const decoded = jwtService.verifyToken(token);

    const user = await User.findById(decoded.userId);
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    req.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      settings: user.settings,
      pinned_applications: user.pinned_applications,
      is_admin: decoded.is_admin
    };

    next();

  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};
