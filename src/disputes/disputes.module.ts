import { Module } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { DisputesController } from './disputes.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [DisputesController],
  providers: [DisputesService, PrismaService],
})
export class DisputesModule {}
