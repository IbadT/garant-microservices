import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  private logger = new Logger('AppController');
  constructor(private readonly appService: AppService) {}

  @Get("/debug-sentry")
  getError() {
    throw new Error("My first Sentry error!");
  }

  @ApiOperation({ summary: 'Get hello message', description: 'Returns a hello message from the application' })
  @ApiResponse({ status: 200, description: 'Returns hello message' })
  @Get()
  getHello(): string {
    this.logger.log("Запущена функция getHello без параметров")
    return this.appService.getHello(1);
  }
}
