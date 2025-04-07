import { Injectable, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { BaseGrpcClient } from './base.client';
import { DealStatus, DealInitiator } from '@prisma/client';

export interface IDealsService {
  createDeal(data: CreateDealRequest): Promise<DealResponse>;
  acceptDeal(data: AcceptDealRequest): Promise<DealResponse>;
  declineDeal(data: DeclineDealRequest): Promise<DealResponse>;
  cancelDeal(data: CancelDealRequest): Promise<DealResponse>;
  confirmCompletion(data: ConfirmCompletionRequest): Promise<DealResponse>;
  openDispute(data: OpenDisputeRequest): Promise<DealResponse>;
  resolveDispute(data: ResolveDisputeRequest): Promise<DealResponse>;
  getActiveDeals(data: GetActiveDealsRequest): Promise<GetActiveDealsResponse>;
  getDealById(data: GetDealByIdRequest): Promise<GetDealByIdResponse>;
  sendHello(data: SendHelloRequest): Promise<SendHelloResponse>;
}

export interface SendHelloRequest {
  message: string;
}

export interface SendHelloResponse {
  message: string;
}

export interface CreateDealRequest {
  initiatorId: string;
  targetId: string;
  amount: number;
  description: string;
  isCustomerInitiator: boolean;
}

export interface AcceptDealRequest {
  dealId: string;
  userId: string;
}

export interface DeclineDealRequest {
  dealId: string;
  userId: string;
}

export interface CancelDealRequest {
  dealId: string;
  userId: string;
}

export interface ConfirmCompletionRequest {
  dealId: string;
  userId: string;
}

export interface OpenDisputeRequest {
  dealId: string;
  userId: string;
  reason: string;
}

export interface ResolveDisputeRequest {
  dealId: string;
  disputeId: string;
  resolution: 'CUSTOMER_WON' | 'VENDOR_WON';
  moderatorId: string;
}

export interface GetActiveDealsRequest {
  userId: string;
}

export interface GetDealByIdRequest {
  dealId: string;
}

export interface DealResponse {
  id: string;
  status: DealStatus;
  message: string;
}

export interface GetActiveDealsResponse {
  deals: Array<{
    id: string;
    status: DealStatus;
    customer_id: string;
    vendor_id: string;
    amount: number;
    description: string;
    initiator: DealInitiator;
    funds_reserved: boolean;
    created_at: Date;
    accepted_at?: Date;
    completed_at?: Date;
    cancelled_at?: Date;
    cancelled_by?: string;
    declined_at?: Date;
    declined_by?: string;
  }>;
}

export interface GetDealByIdResponse {
  deal: {
    id: string;
    status: DealStatus;
    customer_id: string;
    vendor_id: string;
    amount: number;
    description: string;
    initiator: DealInitiator;
    funds_reserved: boolean;
    created_at: Date;
    accepted_at?: Date;
    completed_at?: Date;
    cancelled_at?: Date;
    cancelled_by?: string;
    declined_at?: Date;
    declined_by?: string;
  };
}

@Injectable()
export class DealsClient extends BaseGrpcClient {
  private dealsService: IDealsService;

  constructor(@Inject('DEALS_PACKAGE') client: ClientGrpc) {
    super(client, 'DealService');
  }

  onModuleInit() {
    this.dealsService = this.getService<IDealsService>('DealService');
  }

  async sendHello(data: SendHelloRequest): Promise<SendHelloResponse> {
    return this.callGrpcMethod(this.dealsService.sendHello, data);
  }

  async createDeal(data: CreateDealRequest): Promise<DealResponse> {
    return this.callGrpcMethod(this.dealsService.createDeal, data);
  }

  async acceptDeal(data: AcceptDealRequest): Promise<DealResponse> {
    return this.callGrpcMethod(this.dealsService.acceptDeal, data);
  }

  async declineDeal(data: DeclineDealRequest): Promise<DealResponse> {
    return this.callGrpcMethod(this.dealsService.declineDeal, data);
  }

  async cancelDeal(data: CancelDealRequest): Promise<DealResponse> {
    return this.callGrpcMethod(this.dealsService.cancelDeal, data);
  }

  async confirmCompletion(data: ConfirmCompletionRequest): Promise<DealResponse> {
    return this.callGrpcMethod(this.dealsService.confirmCompletion, data);
  }

  async openDispute(data: OpenDisputeRequest): Promise<DealResponse> {
    return this.callGrpcMethod(this.dealsService.openDispute, data);
  }

  async resolveDispute(data: ResolveDisputeRequest): Promise<DealResponse> {
    return this.callGrpcMethod(this.dealsService.resolveDispute, data);
  }

  async getActiveDeals(data: GetActiveDealsRequest): Promise<GetActiveDealsResponse> {
    return this.callGrpcMethod(this.dealsService.getActiveDeals, data);
  }

  async getDealById(data: GetDealByIdRequest): Promise<GetDealByIdResponse> {
    return this.callGrpcMethod(this.dealsService.getDealById, data);
  }
} 