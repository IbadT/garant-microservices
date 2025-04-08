import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { DealsClient } from './deals.client';
import { DisputesClient } from './disputes.client';
import { DealsController } from './client.controller';
import { DisputesController } from './client.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaService } from '../kafka/kafka.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'DEALS_PACKAGE',
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'garant',
            protoPath: join(process.cwd(), 'src/proto/garant.proto'),
            url: configService.get<string>('DEALS_SERVICE_URL') || 'localhost:50051',
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'DISPUTES_PACKAGE',
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'garant',
            protoPath: join(process.cwd(), 'src/proto/garant.proto'),
            url: configService.get<string>('DISPUTES_SERVICE_URL') || 'localhost:50051',
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [DealsController, DisputesController],
  providers: [DealsClient, DisputesClient, KafkaService],
  exports: [DealsClient, DisputesClient],
})
export class ClientModule {} 