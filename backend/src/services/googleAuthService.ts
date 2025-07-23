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

 
  async authenticateUser(code: string): Promise<GoogleUserInfo> {
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

    
  }

  async revokeTokens(): Promise<void> {
      // Check if there are any credentials to revoke
      const credentials = this.oauth2Client.credentials;
      
      if (!credentials || (!credentials.access_token && !credentials.refresh_token)) {
        logger.warn('No Google credentials available to revoke - this is expected in stateless architecture');
        return; 
      }

      await this.oauth2Client.revokeCredentials();
      logger.info('Google tokens revoked successfully');
    
  }
}

export default new GoogleAuthService(); 