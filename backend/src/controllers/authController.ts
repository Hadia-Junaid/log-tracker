import { Request, Response } from 'express';
import googleAuthService from '../services/googleAuthService';
import jwtService from '../services/jwtService';
import User from '../models/User';
import logger from '../utils/logger';
import config from 'config';
import crypto from 'crypto';

interface TempCodeData {
  userId: string;
  email: string;
  name: string;
  expiresAt: number;
}

const tempCodes = new Map<string, TempCodeData>();

setInterval(() => {
  const now = Date.now();
  for (const [code, data] of tempCodes.entries()) {
    if (data.expiresAt < now) {
      tempCodes.delete(code);
    }
  }
}, 5 * 60 * 1000);

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
        res.redirect(`${config.get<string>('frontend.baseUrl')}/#login?error=missing_code&message=Authorization code is required. Please try again.`);
        return;
      }

      const googleUserInfo = await googleAuthService.authenticateUser(code);
      logger.info(`Google user info: ${JSON.stringify(googleUserInfo)}`);
      
 
      // Check if user exists in MongoDB
      const existingUser = await User.findOne({ email: googleUserInfo.email });
      

      if (!existingUser) {
        logger.warn(`Access denied for user: ${googleUserInfo.email} - User not found in database`);
        res.redirect(`${config.get<string>('frontend.baseUrl')}/#login?error=access_denied&message=Access denied. Please contact your administrator.`);
        return;
      }


      if (existingUser.name !== googleUserInfo.name) {
        existingUser.name = googleUserInfo.name;
        await existingUser.save();
      }

      const tempCode = crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes expiry

      tempCodes.set(tempCode, {
        userId: (existingUser._id as any).toString(),
        email: existingUser.email,
        name: existingUser.name,
        expiresAt
      });

      logger.info(`User successfully authenticated: ${existingUser.email}, temporary code generated`);

      res.redirect(`${config.get<string>('frontend.baseUrl')}/#login?auth_code=${tempCode}`);

    } catch (error) {
      logger.error('Google OAuth callback error:', error);
      res.redirect(`${config.get<string>('frontend.baseUrl')}/#login?error=auth_failed&message=Authentication failed. Please try again.`);
    }
  }


  async exchangeAuthCode(req: Request, res: Response): Promise<void> {
    try {
      const { auth_code } = req.body;

      if (!auth_code || typeof auth_code !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Authorization code is required'
        });
        return;
      }

      const tempCodeData = tempCodes.get(auth_code);
      
      if (!tempCodeData) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired authorization code'
        });
        return;
      }

      if (tempCodeData.expiresAt < Date.now()) {
        tempCodes.delete(auth_code);
        res.status(400).json({
          success: false,
          message: 'Authorization code has expired'
        });
        return;
      }

      // Get fresh user data from database
      const user = await User.findById(tempCodeData.userId);
      
      if (!user) {
        tempCodes.delete(auth_code);
        res.status(400).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const token = jwtService.generateToken(user);
      tempCodes.delete(auth_code);
      logger.info(`JWT token generated for user: ${user.email}`);

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          settings: user.settings,
          pinned_applications: user.pinned_applications
        }
      });

    } catch (error) {
      logger.error('Auth code exchange error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to exchange authorization code'
      });
    }
  }


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

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      const userEmail = user?.email || 'Unknown';
      const userId = user?.id;

      logger.info(`Logout initiated for user: ${userEmail} (ID: ${userId})`);

      try {
        await googleAuthService.revokeTokens();
        logger.info(`Google tokens revoked successfully for user: ${userEmail}`);
      } catch (revokeError) {
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