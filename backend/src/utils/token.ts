import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
  sub: string;
}

const ALGORITHM = 'HS256';

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    algorithm: ALGORITHM,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): TokenPayload {
  const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: [ALGORITHM] });
  if (typeof payload === 'string' || typeof payload.sub !== 'string') {
    throw new Error('token without subject');
  }
  return { sub: payload.sub };
}
