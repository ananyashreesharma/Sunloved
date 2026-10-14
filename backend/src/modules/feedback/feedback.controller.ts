import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle, seconds } from '@nestjs/throttler';
import { PrismaService } from '../../prisma/prisma.service';
import { SendFeedbackDto } from './feedback.dto';

@Controller('feedback')
export class FeedbackController {
  constructor(private prisma: PrismaService) {}

  /** POST /api/feedback: ideas, requests, problems and reviews, read by the founder (prisma/read-feedback.ts). */
  @Post()
  @HttpCode(202)
  @Throttle({ default: { limit: 5, ttl: seconds(60) } })
  async send(@Body() dto: SendFeedbackDto) {
    await this.prisma.feedbackMessage.create({
      data: { message: dto.message.trim(), replyTo: dto.replyTo?.trim() || null, country: dto.country ?? null, platform: dto.platform ?? null },
    });
    return { received: true };
  }
}
