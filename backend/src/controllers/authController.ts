import { Request, Response } from 'express';
import googleAuthService from '../services/googleAuthService';
import jwtService from '../services/jwtService';
import User from '../models/User';
import logger from '../utils/logger';

class AuthController {
 
  async googleLogin(req: Request, res: Response): Promise<void> {
    try {
      const authUrl = googleAuthService.generateAuthUrl();
      res.json({
        success: true,
        authUrl,
        message: 'Redirect to Google OAuth'
      });
    } catch (error) {
      logger.error('Error initiating Google login:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate Google login'
      });
    }
  }

  
  async googleCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.query;

      if (!code || typeof code !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Authorization code is required'
        });
        return;
      }

      // Authenticate with Google and get user info
      const googleUserInfo = await googleAuthService.authenticateUser(code);
      logger.info(`Google user info: ${JSON.stringify(googleUserInfo)}`);
      
 
      // Check if user exists in MongoDB
      const existingUser = await User.findOne({ email: googleUserInfo.email });
      
      // 🐛 DEBUG: Try multiple searches
      const allUsers = await User.find({});
      
      const caseInsensitiveUser = await User.findOne({ 
        email: { $regex: new RegExp(`^${googleUserInfo.email}$`, 'i') } 
      });

      if (!existingUser) {
        logger.warn(`Access denied for user: ${googleUserInfo.email} - User not found in database`);
        res.status(403).json({
          success: false,
          message: 'Access denied. Please contact your administrator.'
        });
        return;
      }

      // Update user info if needed (name might have changed)
      if (existingUser.name !== googleUserInfo.name) {
        existingUser.name = googleUserInfo.name;
        await existingUser.save();
      }

      // Generate JWT token
      const token = jwtService.generateToken(existingUser);

      logger.info(`User successfully authenticated: ${existingUser.email}`);

      res.json({
        success: true,
        message: 'Authentication successful',
        user: {
          id: existingUser._id,
          email: existingUser.email,
          name: existingUser.name,
          settings: existingUser.settings,
          pinned_applications: existingUser.pinned_applications
        },
        token
      });

    } catch (error) {
      logger.error('Google OAuth callback error:', error);
      res.status(500).json({
        success: false,
        message: 'Authentication failed'
      });
    }
  }

  /**
   * Verify JWT token and return user info
   */
  async verifyToken(req: Request, res: Response): Promise<void> {
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

      // Get fresh user data from database
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          settings: user.settings,
          pinned_applications: user.pinned_applications
        }
      });

    } catch (error) {
      logger.error('Token verification error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  }

  /**
   * Logout user (revoke tokens)
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      // In a more sophisticated setup, you might want to:
      // 1. Revoke Google tokens
      // 2. Add JWT to a blacklist
      // For now, we'll just return a success message
      // as JWTs are stateless and will expire naturally

      res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }
}

export default new AuthController(); 