import { Request, Response } from 'express';
import googleAuthService from '../services/googleAuthService';
import jwtService from '../services/jwtService';
import User from '../models/User';
import logger from '../utils/logger';
import config from 'config';


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
        // Redirect to frontend login page with error message
        res.redirect(`${config.get<string>('frontend.baseUrl')}/#login?error=missing_code&message=Authorization code is required. Please try again.`);
        return;
      }

      // Authenticate with Google and get user info
      const googleUserInfo = await googleAuthService.authenticateUser(code);
      logger.info(`Google user info: ${JSON.stringify(googleUserInfo)}`);
      
 
      // Check if user exists in MongoDB
      const existingUser = await User.findOne({ email: googleUserInfo.email });
      

      if (!existingUser) {
        logger.warn(`Access denied for user: ${googleUserInfo.email} - User not found in database`);
        // Redirect to frontend login page with error message
        res.redirect(`${config.get<string>('frontend.baseUrl')}/#login?error=access_denied&message=Access denied. Please contact your administrator.`);
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

      // Redirect to frontend dashboard with token
      res.redirect(`${config.get<string>('frontend.baseUrl')}/#dashboard?token=${token}`);

    } catch (error) {
      logger.error('Google OAuth callback error:', error);
      // Redirect to frontend login page with error message
      res.redirect(`${config.get<string>('frontend.baseUrl')}/#login?error=auth_failed&message=Authentication failed. Please try again.`);
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
      // Get user info from the authenticated request (set by auth middleware)
      const user = req.user;
      const userEmail = user?.email || 'Unknown';
      const userId = user?.id;

      logger.info(`Logout initiated for user: ${userEmail} (ID: ${userId})`);

      // Attempt to revoke Google tokens
      // Note: This may not work in all cases since we don't store refresh tokens server-side
      // But it's a best-effort attempt to revoke any cached credentials
      try {
        await googleAuthService.revokeTokens();
        logger.info(`Google tokens revoked successfully for user: ${userEmail}`);
      } catch (revokeError) {
        // Log the error but don't fail the logout process
        logger.warn(`Failed to revoke Google tokens for user ${userEmail}:`, revokeError);
      }

      logger.info(`User logged out successfully: ${userEmail}`);
      
      res.json({
        success: true,
        message: 'Logged out successfully',
        user: {
          email: userEmail
        }
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