import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { DealsClient } from './deals.client';
import { DisputesClient } from './disputes.client';
import { DealsController } from './client.controller';
import { DisputesController } from './client.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';


@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'DEALS_PACKAGE',
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'deal',
            protoPath: join(process.cwd(), 'dist/proto/deal.proto'),
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
            package: 'disputes',
            protoPath: join(process.cwd(), 'dist/proto/dispute.proto'),
            url: configService.get<string>('DISPUTES_SERVICE_URL') || 'localhost:50051',
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [DealsController, DisputesController],
  providers: [DealsClient, DisputesClient],
  exports: [DealsClient, DisputesClient],
})
export class ClientModule {} 