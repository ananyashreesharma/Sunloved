import { Module } from '@nestjs/common';
import { ContributionsController } from './contributions.controller';
import { ContributionsService } from './contributions.service';
import { ContributionsCronService } from './contributions.cron';
import { PrismaModule } from '../../prisma/prisma.module';
import { IngredientsModule } from '../ingredients/ingredients.module';
import { EnrichmentModule } from '../enrichment/enrichment.module';

@Module({
  imports: [PrismaModule, IngredientsModule, EnrichmentModule],
  controllers: [ContributionsController],
  providers: [ContributionsService, ContributionsCronService],
})
export class ContributionsModule {}
