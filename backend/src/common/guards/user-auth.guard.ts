import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyAccessToken } from '../../modules/auth/token.util';

/**
 * User Auth Guard
 *
 * Two trusted callers, two mechanisms:
 * 1. The frontend (Next.js) resolves the logged-in user server-side via NextAuth's session, then
 *    forwards the request here with a shared internal key plus the resolved user id. The browser
 *    never sees either header directly — client components always call Next.js route handlers,
 *    never this backend, for guarded routes. Mirrors the existing `AdminGuard` pattern rather than
 *    decoding NextAuth's JWE session token here.
 * 2. The mobile app has no server of its own to do that resolution, and can't hold
 *    INTERNAL_API_KEY either (a server-to-server secret has no safe way to live inside a public
 *    client binary). It authenticates directly with a signed JWT bearer token instead — issued by
 *    POST /auth/email-otp/verify, refreshed via POST /auth/refresh — verified here by signature.
 *
 * Usage:
 * @UseGuards(UserAuthGuard)
 * Then read `request.userId` in the controller/service.
 *
 * Set INTERNAL_API_KEY in .env file (same value on both frontend and backend).
 */
@Injectable()
export class UserAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers['authorization'] as string | undefined;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined;
    if (bearerToken) {
      try {
        request.userId = verifyAccessToken(bearerToken);
        return true;
      } catch {
        throw new UnauthorizedException('Invalid or expired access token');
      }
    }

    const internalKey = request.headers['x-internal-api-key'] as string | undefined;
    const userId = request.headers['x-user-id'] as string | undefined;

    if (!internalKey || internalKey !== process.env.INTERNAL_API_KEY) {
      throw new UnauthorizedException('Missing or invalid x-internal-api-key header');
    }

    if (!userId) {
      throw new UnauthorizedException('Missing x-user-id header');
    }

    request.userId = userId;
    return true;
  }
}
