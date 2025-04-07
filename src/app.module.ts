import { Module } from '@nestjs/common';
import { SentryModule } from "@sentry/nestjs/setup";
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DisputesModule } from './disputes/disputes.module';
import { DealModule } from './deals/deal.module';
import { ConfigModule } from '@nestjs/config';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';
import { APP_FILTER } from '@nestjs/core';
import { PrismaService } from './prisma.service';
import { ClientModule } from './client/client.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SentryModule.forRoot(),
    DisputesModule,
    DealModule,
    ClientModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    PrismaService,
  ],
})
export class AppModule {}
