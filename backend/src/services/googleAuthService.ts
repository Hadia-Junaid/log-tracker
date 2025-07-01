import { OAuth2Client } from 'google-auth-library';
import config from 'config';
import logger from '../utils/logger';

interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
}

class GoogleAuthService {
  private oauth2Client: OAuth2Client;

  constructor() {
    const clientId = config.get<string>('auth.google.clientId');
    const clientSecret = config.get<string>('auth.google.clientSecret');
    const redirectUri = config.get<string>('auth.google.redirectUri');

    this.oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);
  }

  /**
   * Generate Google OAuth URL for user authorization
   */
  generateAuthUrl(): string {
    const scopes = [
      'openid',
      'email',
      'profile'
    ];

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      include_granted_scopes: true,
      prompt: 'select_account', // Force account selection every time
    });

    return authUrl;
  }

  /**
   * Exchange authorization code for tokens and get user info
   */
  async authenticateUser(code: string): Promise<GoogleUserInfo> {
    try {
      // Exchange authorization code for access token
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      // Verify the ID token and extract user information
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: config.get<string>('auth.google.clientId'),
      });

      const payload = ticket.getPayload();
      
      if (!payload) {
        throw new Error('Invalid token payload');
      }

      if (!payload.email_verified) {
        throw new Error('Email not verified');
      }

      const userInfo: GoogleUserInfo = {
        email: payload.email!,
        name: payload.name!,
        picture: payload.picture,
        email_verified: payload.email_verified!,
      };

      logger.info(`User authenticated: ${userInfo.email}`);
      return userInfo;

    } catch (error) {
      logger.error('Google authentication error:', error);
      throw new Error('Failed to authenticate with Google');
    }
  }

  /**
   * Revoke tokens (for logout)
   * Note: This method has limitations in the current architecture since we don't store
   * Google refresh tokens server-side. It will only work if tokens are currently set
   * on the oauth2Client instance, which is unlikely in a stateless server environment.
   */
  async revokeTokens(): Promise<void> {
    try {
      // Check if there are any credentials to revoke
      const credentials = this.oauth2Client.credentials;
      
      if (!credentials || (!credentials.access_token && !credentials.refresh_token)) {
        logger.warn('No Google credentials available to revoke - this is expected in stateless architecture');
        return; // Don't throw an error, just log a warning
      }

      await this.oauth2Client.revokeCredentials();
      logger.info('Google tokens revoked successfully');
    } catch (error) {
      logger.error('Error revoking Google tokens:', error);
      // Don't throw error - log it but allow logout to continue
      throw new Error('Failed to revoke Google tokens');
    }
  }

  /**
   * Revoke specific tokens (for more robust logout implementation)
   * This method can be used when refresh tokens are stored server-side
   */
  async revokeSpecificTokens(refreshToken: string): Promise<void> {
    try {
      // Create a temporary OAuth2Client instance with the specific refresh token
      const tempClient = new OAuth2Client(
        config.get<string>('auth.google.clientId'),
        config.get<string>('auth.google.clientSecret'),
        config.get<string>('auth.google.redirectUri')
      );
      
      tempClient.setCredentials({ refresh_token: refreshToken });
      await tempClient.revokeCredentials();
      
      logger.info('Specific Google tokens revoked successfully');
    } catch (error) {
      logger.error('Error revoking specific Google tokens:', error);
      throw new Error('Failed to revoke specific Google tokens');
    }
  }
}

export default new GoogleAuthService(); 