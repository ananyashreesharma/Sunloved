import * as jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'crypto';

// Mobile can't hold the INTERNAL_API_KEY (see UserAuthGuard) — that's a server-to-server secret,
// never safe to embed in a public client. It gets a JWT bearer token it holds itself instead,
// verified here by signature rather than trusted because it arrived from a known caller.

const ACCESS_TOKEN_TTL = '15m';
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function requireSecret(): string {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error('JWT_SECRET is not set');
  return value;
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, requireSecret(), { expiresIn: ACCESS_TOKEN_TTL });
}

export function verifyAccessToken(token: string): string {
  const payload = jwt.verify(token, requireSecret()) as jwt.JwtPayload;
  if (typeof payload.sub !== 'string') throw new Error('Malformed token payload');
  return payload.sub;
}

// Refresh tokens are NOT JWTs — a bare signed JWT can't be revoked short of rotating the signing
// secret for everyone at once. This is a high-entropy opaque string backed by a RefreshToken row
// (see schema.prisma) keyed on its hash, so a single token can be individually revoked, and reuse
// of an already-rotated one is detectable (see AuthService.refreshSession).
export function generateOpaqueToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
