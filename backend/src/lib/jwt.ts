/** Выпуск и проверка JWT (access + refresh). */
import jwt, { SignOptions } from 'jsonwebtoken';
import { UserRole } from '@obi/shared';
import { env } from '../config/env';

export interface AccessTokenPayload {
  sub: string; // userId
  role: UserRole;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
}

export function signAccessToken(userId: string, role: UserRole): string {
  const payload: AccessTokenPayload = { sub: userId, role, type: 'access' };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL,
  } as SignOptions);
}

export function signRefreshToken(userId: string): string {
  const payload: RefreshTokenPayload = { sub: userId, type: 'refresh' };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  if (decoded.type !== 'access') throw new Error('Неверный тип токена');
  return decoded;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  if (decoded.type !== 'refresh') throw new Error('Неверный тип токена');
  return decoded;
}
