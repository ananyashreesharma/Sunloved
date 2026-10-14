import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';

/**
 * Server-to-server only: requires the `x-internal-api-key` header to match INTERNAL_API_KEY.
 * For endpoints whose caller has already verified the user itself (e.g. NextAuth after Google or
 * Apple sign-in), so the request body can be trusted. Refuses everything when the key isn't set.
 */
@Injectable()
export class InternalKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.INTERNAL_API_KEY;
    const given = context.switchToHttp().getRequest().headers['x-internal-api-key'];
    if (!expected || typeof given !== 'string' || !safeEqual(given, expected)) {
      throw new UnauthorizedException('Missing or invalid x-internal-api-key header');
    }
    return true;
  }
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
