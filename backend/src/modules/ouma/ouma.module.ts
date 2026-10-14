import { Module } from '@nestjs/common';
import { OumaController } from './ouma.controller';
import { OumaService } from './ouma.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OumaController],
  providers: [OumaService],
})
export class OumaModule {}
