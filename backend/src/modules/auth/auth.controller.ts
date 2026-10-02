import { Body, Controller, Get, Patch, Post, Req, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { Throttle, seconds } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  SendOtpDto,
  VerifyOtpDto,
  SendEmailOtpDto,
  VerifyEmailOtpDto,
  RefreshTokenDto,
  LogoutDto,
  UpsertOAuthUserDto,
  CompleteOnboardingDto, UpdateCountryDto,
} from './dto/auth.dto';
import { UserAuthGuard } from '../../common/guards/user-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Called by the NextAuth JWT callback to read fields (like onboardingDone) not worth duplicating into the token forever. */
  @Get('me')
  @UseGuards(UserAuthGuard)
  me(@Req() req: { userId: string }) {
    return this.authService.findUserById(req.userId);
  }

  /** One-shot submit at the end of the onboarding wizard. */
  @Patch('onboarding')
  @UseGuards(UserAuthGuard)
  completeOnboarding(@Req() req: { userId: string }, @Body() dto: CompleteOnboardingDto) {
    return this.authService.completeOnboarding(req.userId, dto);
  }

  /** Change where the user lives (Me → Country). */
  @Patch('country')
  @UseGuards(UserAuthGuard)
  updateCountry(@Req() req: { userId: string }, @Body() dto: UpdateCountryDto) {
    return this.authService.updateCountry(req.userId, dto.country);
  }

  /**
   * Send a 6-digit OTP via WhatsApp to an Indian number.
   * IP-throttled tighter than the app-wide default (app.module.ts) since this triggers a paid
   * WhatsApp send; AuthService additionally caps sends per-phone regardless of IP.
   */
  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: seconds(60) } })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  /** Verify the OTP and return a userId (create user if new). AuthService caps wrong guesses per code. */
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: seconds(60) } })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  /** Send a 6-digit OTP by email — mobile's login path (see AuthService for why not WhatsApp). */
  @Post('email-otp/send')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: seconds(60) } })
  sendEmailOtp(@Body() dto: SendEmailOtpDto) {
    return this.authService.sendEmailOtp(dto);
  }

  /** Verify the email OTP and return a JWT bearer token pair (create user if new). */
  @Post('email-otp/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: seconds(60) } })
  verifyEmailOtp(@Body() dto: VerifyEmailOtpDto) {
    return this.authService.verifyEmailOtp(dto);
  }

  /** Exchange a refresh token for a new access token (rotates the refresh token too — see AuthService). */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshSession(dto);
  }

  /** Revoke a refresh token (sign-out). Safe to call even if the token is already invalid/expired. */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto);
  }

  /**
   * Called by NextAuth after Google/Apple sign-in to upsert the user row.
   * Returns { userId, isNew } so NextAuth can embed userId in the JWT.
   */
  @Post('oauth/upsert')
  @HttpCode(HttpStatus.OK)
  upsertOAuth(@Body() dto: UpsertOAuthUserDto) {
    return this.authService.upsertOAuthUser(dto);
  }
}
