import { Module, forwardRef } from '@nestjs/common';
import { ComparisonsService } from './comparisons.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ComparisonsService],
  exports: [ComparisonsService],
})
export class ComparisonsModule {}
