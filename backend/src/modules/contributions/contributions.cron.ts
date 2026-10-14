import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ContributionsCronService {
  private readonly logger = new Logger(ContributionsCronService.name);

  constructor(private prisma: PrismaService) {}

  /** Auto-publishes any contribution whose 24h review window has elapsed without an admin decision. */
  @Cron('0 */15 * * * *')
  async autoPublishDueContributions() {
    const due = await this.prisma.productContribution.findMany({
      where: { status: 'pending', autoPublishAt: { lte: new Date() } },
      select: { id: true },
    });

    for (const { id } of due) {
      await this.prisma.$transaction([
        this.prisma.productIngredient.updateMany({
          where: { contributionId: id, moderationStatus: 'pending' },
          data: { moderationStatus: 'approved' },
        }),
        this.prisma.productContribution.update({
          where: { id },
          data: { status: 'approved', reviewedAt: new Date() },
        }),
      ]);
    }

    if (due.length > 0) {
      this.logger.log(`Auto-published ${due.length} contribution(s) past their 24h review window`);
    }
  }
}
