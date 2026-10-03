import { Body, Controller, Get, Headers, HttpCode, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AnalyticsService } from './analytics.service';
import { TrackEventDto } from './analytics.dto';
import { AdminGuard } from '../../common/guards/admin.guard';
import { verifyAccessToken } from '../auth/token.util';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  /** Public: the apps report one of five anonymous events. Signed-in phones attach their account. */
  @Post('events')
  @HttpCode(204)
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  async track(@Body() dto: TrackEventDto, @Headers('authorization') auth?: string) {
    let userId: string | undefined;
    if (auth?.startsWith('Bearer ')) {
      try {
        userId = verifyAccessToken(auth.slice(7));
      } catch {
        userId = undefined;
      }
    }
    await this.analytics.track(dto, userId);
  }

  /** Admin: the three success numbers. curl -H "x-admin-key: …" /api/analytics/metrics?days=30 */
  @Get('metrics')
  @UseGuards(AdminGuard)
  metrics(@Query('days') days?: string) {
    return this.analytics.metrics(Math.min(Math.max(Number(days) || 30, 1), 365));
  }
}
