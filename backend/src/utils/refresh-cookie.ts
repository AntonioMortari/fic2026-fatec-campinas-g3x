import type { CookieOptions, Request, Response } from 'express';
import { env } from '../config/env';

export const REFRESH_COOKIE = 'af_refresh';

const DAY_MS = 24 * 60 * 60 * 1000;

function options(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production' || env.COOKIE_SAMESITE === 'none',
    sameSite: env.COOKIE_SAMESITE,
    // Sent only to the auth routes: the rest of the API never sees it.
    path: '/api/auth',
  };
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, { ...options(), maxAge: env.REFRESH_TOKEN_DAYS * DAY_MS });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, options());
}

export function readRefreshCookie(req: Request): string | null {
  for (const part of req.headers.cookie?.split(';') ?? []) {
    const separator = part.indexOf('=');
    if (separator > 0 && part.slice(0, separator).trim() === REFRESH_COOKIE) {
      return decodeURIComponent(part.slice(separator + 1).trim()) || null;
    }
  }
  return null;
}
