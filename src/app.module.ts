import { Module } from '@nestjs/common';
import { SentryModule } from "@sentry/nestjs/setup";
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DisputesModule } from './disputes/disputes.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    DisputesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
