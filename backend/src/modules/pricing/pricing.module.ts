import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PricingService],
})
export class PricingModule {}
