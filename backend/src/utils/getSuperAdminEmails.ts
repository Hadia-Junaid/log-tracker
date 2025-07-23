import dotenv from 'dotenv';
dotenv.config();
import config from 'config';

export const getSuperAdminEmails = (): string[] => {
  const raw = config.get<string>('adminEmails');
  return raw.split(',').map(email => email.trim());
};
