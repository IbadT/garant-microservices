import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DealsClient } from './deals.client';
import { DisputesClient } from './disputes.client';
import { Inject } from '@nestjs/common';
import {
  ApiCreateDeal,
  ApiAcceptDeal,
  ApiDeclineDeal,
  ApiCancelDeal,
  ApiConfirmCompletion,
  ApiGetActiveDeals,
  ApiGetDealById,
  ApiOpenDispute,
  ApiResolveDispute,
  ApiGetDisputeById,
  ApiGetDisputesByDealId,
  ApiSendHello,
} from '../decorators/swagger.decorators';
import {
  CreateDealRequest,
  AcceptDealRequest,
  DeclineDealRequest,
  CancelDealRequest,
  ConfirmCompletionRequest,
  GetActiveDealsRequest,
  GetDealByIdRequest,
  SendHelloRequest,
  OpenDisputeRequest,
  ResolveDisputeRequest,
} from '../deals/interfaces/deal.interface';
import {
  OpenDisputeRequest as DisputeOpenDisputeRequest,
  ResolveDisputeRequest as DisputeResolveDisputeRequest,
  GetDisputeByIdRequest,
  GetDisputesByDealIdRequest,
} from '../disputes/interfaces/dispute.interface';
import { KafkaService } from '../kafka/kafka.service';

@ApiTags('Deals')
@Controller('deals')
export class DealsController {
  constructor(
    private readonly dealsClient: DealsClient,
    private readonly kafkaService: KafkaService
  ) {}

  @Post('create')
  @ApiCreateDeal()
  async createDeal(@Body() data: CreateDealRequest) {
    return this.dealsClient.createDeal(data);
  }

  @Post('accept')
  @ApiAcceptDeal()
  async acceptDeal(@Body() data: AcceptDealRequest) {
    return this.dealsClient.acceptDeal(data);
  }

  @Post('decline')
  @ApiDeclineDeal()
  async declineDeal(@Body() data: DeclineDealRequest) {
    return this.dealsClient.declineDeal(data);
  }

  @Post('cancel')
  @ApiCancelDeal()
  async cancelDeal(@Body() data: CancelDealRequest) {
    return this.dealsClient.cancelDeal(data);
  }

  @Post('confirm-completion')
  @ApiConfirmCompletion()
  async confirmCompletion(@Body() data: ConfirmCompletionRequest) {
    return this.dealsClient.confirmCompletion(data);
  }

  @Post('open-dispute')
  @ApiOpenDispute()
  async openDispute(@Body() data: OpenDisputeRequest) {
    return this.dealsClient.openDispute(data);
  }

  @Post('resolve-dispute')
  @ApiResolveDispute()
  async resolveDispute(@Body() data: ResolveDisputeRequest) {
    return this.dealsClient.resolveDispute(data);
  }

  @Post('active')
  @ApiGetActiveDeals()
  async getActiveDeals(@Body() data: GetActiveDealsRequest) {
    return this.dealsClient.getActiveDeals(data);
  }

  @Post('by-id')
  @ApiGetDealById()
  async getDealById(@Body() data: GetDealByIdRequest) {
    return this.dealsClient.getDealById(data);
  }

  @Post('test-kafka')
  async testKafka() {
    await this.kafkaService.sendDealEvent({
      type: 'TEST',
      payload: { message: 'This is a test message', timestamp: new Date().toISOString() }
    });
    return { success: true, message: 'Test message sent to Kafka' };
  }
}

@ApiTags('Disputes')
@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputesClient: DisputesClient) {}

  @Post('open')
  @ApiOpenDispute()
  async openDispute(@Body() data: DisputeOpenDisputeRequest) {
    return this.disputesClient.openDispute(data);
  }

  @Post('resolve')
  @ApiResolveDispute()
  async resolveDispute(@Body() data: DisputeResolveDisputeRequest) {
    return this.disputesClient.resolveDispute(data);
  }

  @Post('by-id')
  @ApiGetDisputeById()
  async getDisputeById(@Body() data: GetDisputeByIdRequest) {
    return this.disputesClient.getDisputeById(data);
  }

  @Post('by-deal-id')
  @ApiGetDisputesByDealId()
  async getDisputesByDealId(@Body() data: GetDisputesByDealIdRequest) {
    return this.disputesClient.getDisputesByDealId(data);
  }
} 