import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Admin Guard
 * 
 * Protects admin endpoints by checking for a valid `x-admin-key` header.
 * 
 * Usage:
 * @UseGuards(AdminGuard)
 * 
 * Set ADMIN_API_KEY in .env file
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const adminKey = request.headers['x-admin-key'] as string | undefined;

    // Check if key exists and matches environment variable
    if (!adminKey) {
      throw new UnauthorizedException('Missing x-admin-key header');
    }

    if (adminKey !== process.env.ADMIN_API_KEY) {
      throw new UnauthorizedException('Invalid admin key');
    }

    return true;
  }
}

