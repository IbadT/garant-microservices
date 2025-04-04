import { Module } from '@nestjs/common';
import { SentryModule } from "@sentry/nestjs/setup";
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DisputesModule } from './disputes/disputes.module';
import { DealModule } from './deals/deal.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SentryModule.forRoot(),
    DisputesModule,
    DealModule
  ],
  controllers: [AppController],
  providers: [
    AppService
  ],
})
export class AppModule {}
