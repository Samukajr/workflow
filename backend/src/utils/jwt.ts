import jwt from 'jsonwebtoken';
import { env } from '../config/environment';
import { UserToken } from '../types';

interface TwoFactorChallengePayload {
  id: string;
  email: string;
  name: string;
  department: UserToken['department'];
  purpose: '2fa_challenge';
}

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

export function generateTwoFactorChallengeToken(user: UserToken): string {
  const secretKey: jwt.Secret = env.JWT_SECRET;
  const payload: TwoFactorChallengePayload = {
    ...user,
    purpose: '2fa_challenge',
  };

  return jwt.sign(payload, secretKey, {
    expiresIn: '10m',
  } as jwt.SignOptions);
}

export function verifyTwoFactorChallengeToken(token: string): UserToken | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TwoFactorChallengePayload;

    if (decoded.purpose !== '2fa_challenge') {
      return null;
    }

    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      department: decoded.department,
    };
  } catch {
    return null;
  }
}
