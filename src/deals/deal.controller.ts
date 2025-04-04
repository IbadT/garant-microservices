import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { DealService } from './deal.service';
import { CreateDealRequest } from './dto/deal.dto';

@Controller()
export class DealController {
  constructor(private readonly dealService: DealService) {}

  @GrpcMethod('DealService', 'CreateDeal')
  async createDeal(data: CreateDealRequest) {
    return this.dealService.createDeal(data);
  }
}