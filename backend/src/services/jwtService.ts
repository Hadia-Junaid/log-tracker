import jwt from 'jsonwebtoken';
import config from 'config';
import { IUser } from '../models/User';

interface JWTPayload {
  userId: string;
  email: string;
  name: string;
}

class JWTService {
  private secret: string;
  private expiresIn: string;

  constructor() {
    this.secret = config.get<string>('auth.jwt.secret');
    this.expiresIn = config.get<string>('auth.jwt.expiresIn');
  }

  /**
   * Generate JWT token for authenticated user
   */
  generateToken(user: IUser): string {
    const payload: JWTPayload = {
      userId: (user._id as any).toString(),
      email: user.email,
      name: user.name,
    };

    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
      issuer: 'log-tracker-api',
      audience: 'log-tracker-client',
    } as any);
  }

  /**
   * Verify JWT token and return payload
   */
  verifyToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: 'log-tracker-api',
        audience: 'log-tracker-client',
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch (error) {
      return null;
    }
  }
}

export default new JWTService(); 