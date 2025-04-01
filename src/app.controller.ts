import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  private logger = new Logger('AppController');
  constructor(private readonly appService: AppService) {}



  @Get()
  getHello(): string {
    this.logger.log("Запущена функция getHello без параметров")
    return this.appService.getHello(1);
  }
}
