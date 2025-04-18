import { Module } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { DisputesController } from './disputes.controller';
import { PrismaService } from '../prisma.service';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.register([
      {
        name: 'DISPUTES_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'garant',
          protoPath: join(process.cwd(), 'src/proto/garant.proto'),
          url: process.env.DISPUTES_SERVICE_URL || 'localhost:50051',
        },
      },
    ]),
  ],
  controllers: [
    DisputesController
  ],
  providers: [DisputesService, PrismaService],
  exports: [DisputesService],
})
export class DisputesModule {}
