import jwt from 'jsonwebtoken';
import { env } from '../config/environment';
import { UserToken } from '../types';

export function generateToken(user: UserToken): string {
  const secretKey: jwt.Secret = env.JWT_SECRET;
  return jwt.sign(user, secretKey, {
    expiresIn: env.JWT_EXPIRATION,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): UserToken | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as UserToken;
    return decoded;
  } catch {
    return null;
  }
}

export function decodeToken(token: string): UserToken | null {
  try {
    const decoded = jwt.decode(token) as UserToken;
    return decoded;
  } catch {
    return null;
  }
}
