import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import {
  SendOtpDto,
  VerifyOtpDto,
  SendEmailOtpDto,
  VerifyEmailOtpDto,
  RefreshTokenDto,
  LogoutDto,
  UpsertOAuthUserDto,
  CompleteOnboardingDto,
} from './dto/auth.dto';
import { signAccessToken, generateOpaqueToken, hashToken, REFRESH_TOKEN_TTL_MS } from './token.util';

// Lazy-load Twilio so the module still boots without TWILIO_* env vars set
// (the endpoints just return 503 with a clear message in that case).
function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Twilio = require('twilio');
  return new Twilio(sid, token) as import('twilio').Twilio;
}

// Same optional-config pattern as Twilio above, for the mobile email OTP flow. Calls Resend's
// HTTP API directly with fetch rather than pulling in their SDK — it's one POST request.
function getResendConfig(): { apiKey: string; from: string } | null {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return null;
  return { apiKey, from };
}

async function sendOtpEmail(to: string, code: string, apiKey: string, from: string): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Your SkinLens code: ${code}`,
      html: `<p>Your SkinLens verification code is <strong>${code}</strong>.</p><p>It expires in ${OTP_TTL_MINUTES} minutes. If you didn't request this, you can ignore this email.</p>`,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend API responded ${res.status}: ${await res.text()}`);
  }
}

const OTP_TTL_MINUTES = 10;
const BCRYPT_ROUNDS = 10;

// Two independent defenses against OTP abuse (see backend security review — neither existed before):
// 1. Sending: caps how many codes can be requested for one phone/email in a rolling window, so an
//    attacker can't spam a stranger's inbox/phone with codes (cost + harassment) regardless of how
//    many different IPs they send the requests from — the global ThrottlerGuard (app.module.ts) is
//    IP-based and doesn't stop this on its own.
// 2. Verifying: caps how many wrong guesses a single issued code tolerates before it's invalidated,
//    closing the brute-force window (a 6-digit code is only ~1M possibilities).
const MAX_OTP_SENDS_PER_WINDOW = 3;
const SEND_WINDOW_MINUTES = 15;
const MAX_OTP_ATTEMPTS = 5;

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function slugify(base: string): string {
  return (
    base
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 14) +
    '_' +
    Math.random().toString(36).slice(2, 7)
  );
}

function tooManyRequests(message: string): never {
  throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── WhatsApp OTP ────────────────────────────────────────────────────────

  async sendOtp(dto: SendOtpDto): Promise<{ sent: boolean }> {
    const windowStart = new Date(Date.now() - SEND_WINDOW_MINUTES * 60 * 1000);
    const recentSends = await this.prisma.phoneOtp.count({
      where: { phone: dto.phone, createdAt: { gt: windowStart } },
    });
    if (recentSends >= MAX_OTP_SENDS_PER_WINDOW) {
      tooManyRequests(`Too many codes requested for this number. Try again in ${SEND_WINDOW_MINUTES} minutes.`);
    }

    const twilio = getTwilioClient();
    const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM; // e.g. whatsapp:+14155238886

    if (!twilio || !whatsappFrom) {
      this.logger.warn('Twilio not configured — returning mock OTP flow');
      // In dev without Twilio creds: still create the OTP row so verify works
    }

    const code = generateOtp();
    const hash = await bcrypt.hash(code, BCRYPT_ROUNDS);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    // Invalidate any previous unused code for this phone — marked used, not deleted, so it stops
    // being guessable immediately but the row survives for the rate-limit count above to see on
    // the next send. (A prior version of this deleted the row instead, which quietly defeated the
    // rate limit: each send would erase the evidence of the one before it, so the count check
    // above could never see more than one prior send no matter how many actually happened.)
    await this.prisma.phoneOtp.updateMany({ where: { phone: dto.phone, used: false }, data: { used: true } });

    await this.prisma.phoneOtp.create({
      data: { phone: dto.phone, codeHash: hash, expiresAt },
    });

    if (twilio && whatsappFrom) {
      try {
        await twilio.messages.create({
          from: whatsappFrom,
          to: `whatsapp:${dto.phone}`,
          body: `Your Ouma verification code is *${code}*. Valid for ${OTP_TTL_MINUTES} minutes. Do not share it.`,
        });
      } catch (err) {
        this.logger.error('Twilio send failed', err);
        throw new BadRequestException('Failed to send WhatsApp OTP. Please try again.');
      }
    } else {
      // Dev fallback: log the code so you can test without Twilio
      this.logger.warn(`[DEV] OTP for ${dto.phone}: ${code}`);
    }

    return { sent: true };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{ userId: string; isNew: boolean }> {
    const now = new Date();

    const otpRow = await this.prisma.phoneOtp.findFirst({
      where: { phone: dto.phone, used: false, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRow) {
      throw new UnauthorizedException('OTP expired or not found. Request a new code.');
    }

    const valid = await bcrypt.compare(dto.code, otpRow.codeHash);
    if (!valid) {
      const attempts = otpRow.attempts + 1;
      if (attempts >= MAX_OTP_ATTEMPTS) {
        // Invalidate rather than just count — a guessed-out code must not still be guessable.
        await this.prisma.phoneOtp.update({ where: { id: otpRow.id }, data: { used: true, attempts } });
        throw new UnauthorizedException('Too many incorrect attempts. Request a new code.');
      }
      await this.prisma.phoneOtp.update({ where: { id: otpRow.id }, data: { attempts } });
      throw new UnauthorizedException('Incorrect OTP code.');
    }

    // Mark used
    await this.prisma.phoneOtp.update({ where: { id: otpRow.id }, data: { used: true } });

    // Upsert user
    let user = await this.prisma.user.findFirst({ where: { phone: dto.phone } });
    let isNew = false;

    if (!user) {
      isNew = true;
      user = await this.prisma.user.create({
        data: {
          phone: dto.phone,
          username: slugify('user'),
          locale: 'IN',
        },
      });
    }

    return { userId: user.id, isNew };
  }

  // ─── Email OTP (mobile login) ────────────────────────────────────────────
  // Mirrors sendOtp/verifyOtp above, but for mobile: email costs nothing to send at scale (unlike
  // WhatsApp/SMS) and doesn't bake in a country assumption the way the phone flow's +91-only regex
  // does. Sends via Resend when RESEND_API_KEY/RESEND_FROM_EMAIL are set; same dev-log fallback as
  // sendOtp() uses when Twilio isn't configured, otherwise.

  async sendEmailOtp(dto: SendEmailOtpDto): Promise<{ sent: boolean }> {
    const email = dto.email.trim().toLowerCase();

    const windowStart = new Date(Date.now() - SEND_WINDOW_MINUTES * 60 * 1000);
    const recentSends = await this.prisma.emailOtp.count({
      where: { email, createdAt: { gt: windowStart } },
    });
    if (recentSends >= MAX_OTP_SENDS_PER_WINDOW) {
      tooManyRequests(`Too many codes requested for this email. Try again in ${SEND_WINDOW_MINUTES} minutes.`);
    }

    const code = generateOtp();
    const hash = await bcrypt.hash(code, BCRYPT_ROUNDS);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    // See sendOtp()'s comment above — invalidate (not delete) so the rate-limit count on the next
    // send can still see this one happened.
    await this.prisma.emailOtp.updateMany({ where: { email, used: false }, data: { used: true } });
    await this.prisma.emailOtp.create({ data: { email, codeHash: hash, expiresAt } });

    const resend = getResendConfig();
    if (resend) {
      try {
        await sendOtpEmail(email, code, resend.apiKey, resend.from);
      } catch (err) {
        this.logger.error('Resend send failed', err);
        throw new BadRequestException('Failed to send email code. Please try again.');
      }
    } else {
      this.logger.warn(`[DEV] Email OTP for ${email}: ${code}`);
    }

    return { sent: true };
  }

  async verifyEmailOtp(dto: VerifyEmailOtpDto): Promise<{ userId: string; isNew: boolean; accessToken: string; refreshToken: string }> {
    const email = dto.email.trim().toLowerCase();
    const now = new Date();

    const otpRow = await this.prisma.emailOtp.findFirst({
      where: { email, used: false, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRow) {
      throw new UnauthorizedException('OTP expired or not found. Request a new code.');
    }

    const valid = await bcrypt.compare(dto.code, otpRow.codeHash);
    if (!valid) {
      const attempts = otpRow.attempts + 1;
      if (attempts >= MAX_OTP_ATTEMPTS) {
        await this.prisma.emailOtp.update({ where: { id: otpRow.id }, data: { used: true, attempts } });
        throw new UnauthorizedException('Too many incorrect attempts. Request a new code.');
      }
      await this.prisma.emailOtp.update({ where: { id: otpRow.id }, data: { attempts } });
      throw new UnauthorizedException('Incorrect OTP code.');
    }

    await this.prisma.emailOtp.update({ where: { id: otpRow.id }, data: { used: true } });

    let user = await this.prisma.user.findFirst({ where: { email } });
    let isNew = false;

    if (!user) {
      isNew = true;
      user = await this.prisma.user.create({
        data: { email, username: slugify(email.split('@')[0]) },
      });
    }

    const refreshToken = await this.issueRefreshToken(user.id);
    return { userId: user.id, isNew, accessToken: signAccessToken(user.id), refreshToken };
  }

  // ─── Sessions (revocable refresh tokens) ──────────────────────────────────

  private async issueRefreshToken(userId: string): Promise<string> {
    const raw = generateOpaqueToken();
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS) },
    });
    return raw;
  }

  async refreshSession(dto: RefreshTokenDto): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHash = hashToken(dto.refreshToken);
    const row = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!row || row.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    if (row.revokedAt) {
      // This exact token was already rotated away (or explicitly logged out) and is being
      // presented again — either a client bug replaying a stale value, or the token was stolen
      // and both the thief and the real owner are now racing to use it. Can't tell which, so the
      // safe response is to kill every session for this user and force a fresh sign-in.
      await this.prisma.refreshToken.updateMany({
        where: { userId: row.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('This session was revoked. Please sign in again.');
    }

    // Rotate: this token is single-use. Revoke it and issue a new one in the same breath.
    await this.prisma.refreshToken.update({ where: { id: row.id }, data: { revokedAt: new Date() } });
    const refreshToken = await this.issueRefreshToken(row.userId);
    return { accessToken: signAccessToken(row.userId), refreshToken };
  }

  async logout(dto: LogoutDto): Promise<{ ok: true }> {
    const tokenHash = hashToken(dto.refreshToken);
    // Same response whether or not the token existed — don't give a caller a way to probe for
    // valid-looking tokens.
    await this.prisma.refreshToken.updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: new Date() } });
    return { ok: true };
  }

  // ─── OAuth upsert (Google / Apple) ───────────────────────────────────────

  async upsertOAuthUser(dto: UpsertOAuthUserDto): Promise<{ userId: string; isNew: boolean }> {
    const providerIdField = dto.provider === 'google' ? 'googleId' : 'appleId';

    // Find by provider ID first
    let user = await this.prisma.user.findFirst({
      where: { [providerIdField]: dto.providerId },
    });

    let isNew = false;

    if (!user) {
      // Try to match existing user by email (merge accounts)
      if (dto.email) {
        user = await this.prisma.user.findFirst({ where: { email: dto.email } });
      }

      if (user) {
        // Attach provider ID to existing account
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            [providerIdField]: dto.providerId,
            name: user.name ?? dto.name ?? null,
            avatarUrl: user.avatarUrl ?? dto.avatarUrl ?? null,
          },
        });
      } else {
        // Brand new user
        isNew = true;
        const base = dto.name ?? dto.email?.split('@')[0] ?? 'user';
        user = await this.prisma.user.create({
          data: {
            [providerIdField]: dto.providerId,
            email: dto.email ?? null,
            name: dto.name ?? null,
            avatarUrl: dto.avatarUrl ?? null,
            username: slugify(base),
            locale: 'IN',
          },
        });
      }
    }

    return { userId: user.id, isNew };
  }

  // ─── Lookup by ID (used by NextAuth JWT callback) ─────────────────────────

  async findUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        onboardingDone: true,
        locale: true,
        skinType: { select: { code: true, label: true } },
        skinConcerns: { select: { skinConcern: { select: { code: true, label: true } } } },
      },
    });
    if (!user) return null;
    // User.locale holds the ISO country code (default "IN"); the apps call it country.
    const { skinConcerns, locale, ...rest } = user;
    return { ...rest, country: locale, concerns: skinConcerns.map((c) => c.skinConcern) };
  }

  // ─── Onboarding ────────────────────────────────────────────────────────

  async completeOnboarding(userId: string, dto: CompleteOnboardingDto) {
    const skinType = await this.prisma.skinType.findUnique({ where: { code: dto.skinType } });
    if (!skinType) {
      throw new BadRequestException(`Unknown skin type "${dto.skinType}"`);
    }
    const concerns = await this.prisma.skinConcern.findMany({ where: { code: { in: dto.concerns } } });
    if (concerns.length !== dto.concerns.length) {
      throw new BadRequestException('One or more concern codes were not recognized');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { skinTypeId: skinType.id, onboardingDone: true, ...(dto.country ? { locale: dto.country } : {}) },
      }),
      this.prisma.userSkinConcern.deleteMany({ where: { userId } }),
      this.prisma.userSkinConcern.createMany({
        data: concerns.map((c) => ({ userId, skinConcernId: c.id })),
      }),
    ]);

    return { onboardingDone: true };
  }

  async updateCountry(userId: string, country: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { locale: country } });
    return { country };
  }
}
