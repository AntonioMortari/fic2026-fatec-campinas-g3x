import type { Request, Response } from 'express';
import type { z } from 'zod';
import { getProfile, loginUser, registerUser } from '../services/auth.service';
import { issueRefreshToken, refreshSession, revokeRefreshToken } from '../services/session.service';
import { ApiError } from '../utils/api-error';
import { clearRefreshCookie, readRefreshCookie, setRefreshCookie } from '../utils/refresh-cookie';
import type { loginBody, registerBody } from '../validators/auth.validator';

export async function register(req: Request, res: Response): Promise<void> {
  const result = await registerUser(req.body as z.output<typeof registerBody>);
  setRefreshCookie(res, await issueRefreshToken(result.user.id));
  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await loginUser(req.body as z.output<typeof loginBody>);
  setRefreshCookie(res, await issueRefreshToken(result.user.id));
  res.json(result);
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = readRefreshCookie(req);
  if (!token) throw new ApiError(401, 'session_expired', 'Sua sessão terminou. Entre de novo para continuar.');

  try {
    const { refreshToken, ...result } = await refreshSession(token);
    setRefreshCookie(res, refreshToken);
    res.json(result);
  } catch (error) {
    clearRefreshCookie(res);
    throw error;
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  const token = readRefreshCookie(req);
  if (token) await revokeRefreshToken(token);
  clearRefreshCookie(res);
  res.status(204).end();
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, 'unauthenticated', 'Entre na sua conta para continuar.');
  res.json({ user: await getProfile(req.user.id) });
}
