import { ClientGrpc } from '@nestjs/microservices';
import { Injectable, Inject } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { IDealsClient } from './interfaces/client.interface';
import { 
  DealResponse, 
  GetActiveDealsResponse, 
  GetDealByIdResponse,
  SendHelloRequest,
  CreateDealRequest,
  AcceptDealRequest,
  DeclineDealRequest,
  CancelDealRequest,
  ConfirmCompletionRequest,
  OpenDisputeRequest,
  ResolveDisputeRequest,
  GetActiveDealsRequest,
  GetDealByIdRequest
} from '../deals/interfaces/deal.interface';
import { BaseGrpcClient } from './base.client';

@Injectable()
export class DealsClient extends BaseGrpcClient implements IDealsClient {
  private readonly dealsService: any;

  constructor(@Inject('DEALS_PACKAGE') client: ClientGrpc) {
    super(client, 'DealService');
    this.dealsService = this.client.getService('DealService');
  }

  async createDeal(data: CreateDealRequest): Promise<DealResponse> {
    return firstValueFrom(this.dealsService.createDeal(data));
  }

  async acceptDeal(data: AcceptDealRequest): Promise<DealResponse> {
    return firstValueFrom(this.dealsService.acceptDeal(data));
  }

  async declineDeal(data: DeclineDealRequest): Promise<DealResponse> {
    return firstValueFrom(this.dealsService.declineDeal(data));
  }

  async cancelDeal(data: CancelDealRequest): Promise<DealResponse> {
    return firstValueFrom(this.dealsService.cancelDeal(data));
  }

  async confirmCompletion(data: ConfirmCompletionRequest): Promise<DealResponse> {
    return firstValueFrom(this.dealsService.confirmCompletion(data));
  }

  async openDispute(data: OpenDisputeRequest): Promise<DealResponse> {
    return firstValueFrom(this.dealsService.openDispute(data));
  }

  async resolveDispute(data: ResolveDisputeRequest): Promise<DealResponse> {
    return firstValueFrom(this.dealsService.resolveDispute(data));
  }

  async getActiveDeals(data: GetActiveDealsRequest): Promise<GetActiveDealsResponse> {
    return firstValueFrom(this.dealsService.getActiveDeals(data));
  }

  async getDealById(data: GetDealByIdRequest): Promise<GetDealByIdResponse> {
    return firstValueFrom(this.dealsService.getDealById(data));
  }
} 

export { ConfirmCompletionRequest, CancelDealRequest };
