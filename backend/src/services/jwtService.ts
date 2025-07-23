import jwt from 'jsonwebtoken';
import config from 'config';
import { IUser } from '../models/User';

interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  is_admin: boolean;
}

class JWTService {
  private secret: string;
  private expiresIn: string;

  constructor() {
    this.secret = config.get<string>('auth.jwt.secret');
    this.expiresIn = config.get<string>('auth.jwt.expiresIn');
  }

  generateToken(user: IUser, isAdmin: boolean = false): string {
    const payload: JWTPayload = {
      userId: (user._id as any).toString(),
      email: user.email,
      name: user.name,
      is_admin: isAdmin,
    };

    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
      issuer: 'log-tracker-api',
      audience: 'log-tracker-client',
    } as any);
  }

  verifyToken(token: string): JWTPayload {
      const decoded = jwt.verify(token, this.secret, {
        issuer: 'log-tracker-api',
        audience: 'log-tracker-client',
      }) as JWTPayload;

      return decoded;
    
  }

  decodeToken(token: string): JWTPayload | null {
      return jwt.decode(token) as JWTPayload;
    
  }
}

export default new JWTService(); 