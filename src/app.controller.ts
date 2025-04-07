import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('garant')
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Get("/debug-sentry")
  getError() {
    throw new Error("My first Sentry error!");
  }

  @ApiOperation({ 
    summary: 'Get hello message', 
    description: 'Returns a hello message with a number from the application' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns hello message with number',
    schema: {
      type: 'string',
      example: 'Hello World! Number: 1'
    }
  })
  @Get('hello')
  getHello(): string {
    this.logger.log("Запущена функция getHello без параметров")
    return this.appService.getHello(1);
  }
}
