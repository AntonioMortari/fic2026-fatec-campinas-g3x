import { createHash, randomBytes } from 'node:crypto';
import { Op } from 'sequelize';
import { env } from '../config/env';
import { RefreshToken, User } from '../models';
import { ApiError } from '../utils/api-error';
import { signToken } from '../utils/token';
import { toPublicUser, type AuthResult } from './auth.service';

const DAY_MS = 24 * 60 * 60 * 1000;
// Two tabs opened together send the same cookie; the second one arrives after the first rotated it.
const REUSE_GRACE_MS = 10_000;

const sessionEnded = () => new ApiError(401, 'session_expired', 'Sua sessão terminou. Entre de novo para continuar.');

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function issueRefreshToken(userId: string, now: Date = new Date()): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  await RefreshToken.destroy({ where: { userId, expiresAt: { [Op.lt]: now } } });
  await RefreshToken.create({
    userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(now.getTime() + env.REFRESH_TOKEN_DAYS * DAY_MS),
  });
  return token;
}

export async function refreshSession(token: string, now: Date = new Date()): Promise<AuthResult & { refreshToken: string }> {
  const row = await RefreshToken.findOne({ where: { tokenHash: hashToken(token) } });
  if (!row || row.expiresAt <= now) throw sessionEnded();

  if (row.revokedAt && now.getTime() - row.revokedAt.getTime() > REUSE_GRACE_MS) {
    // A token that was already rotated, used again after the grace: assume it leaked and end every session.
    // Deleted, not marked revoked: a revoked token still passes during the grace.
    await RefreshToken.destroy({ where: { userId: row.userId } });
    throw sessionEnded();
  }

  const user = await User.findByPk(row.userId, { attributes: { exclude: ['passwordHash'] } });
  if (!user) throw sessionEnded();

  if (!row.revokedAt) await row.update({ revokedAt: now });
  const refreshToken = await issueRefreshToken(user.id, now);
  return { token: signToken({ sub: user.id }), user: toPublicUser(user), refreshToken };
}

// Deleted rather than marked revoked: a revoked token still passes for a few seconds (see REUSE_GRACE_MS).
export async function revokeRefreshToken(token: string): Promise<void> {
  await RefreshToken.destroy({ where: { tokenHash: hashToken(token) } });
}
