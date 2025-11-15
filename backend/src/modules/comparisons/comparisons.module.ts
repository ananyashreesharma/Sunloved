import { Module, forwardRef } from '@nestjs/common';
import { ComparisonsService } from './comparisons.service';
import { ComparisonsController } from './comparisons.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ComparisonsService],
  controllers: [ComparisonsController],
  exports: [ComparisonsService],
})
export class ComparisonsModule {}
