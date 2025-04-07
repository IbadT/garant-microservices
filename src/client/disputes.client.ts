import { Injectable, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { BaseGrpcClient } from './base.client';
import { DisputeStatus } from '@prisma/client';

export interface IDisputesService {
  openDispute(data: OpenDisputeRequest): Promise<DisputeResponse>;
  resolveDispute(data: ResolveDisputeRequest): Promise<DisputeResponse>;
  getDisputeById(data: GetDisputeByIdRequest): Promise<GetDisputeByIdResponse>;
  getDisputesByDealId(data: GetDisputesByDealIdRequest): Promise<GetDisputesByDealIdResponse>;
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

export interface GetDisputeByIdRequest {
  disputeId: string;
}

export interface GetDisputesByDealIdRequest {
  dealId: string;
}

export interface DisputeResponse {
  id: string;
  status: DisputeStatus;
  message: string;
}

export interface GetDisputeByIdResponse {
  dispute: {
    id: string;
    deal_id: string;
    opened_by: string;
    opened_by_role: string;
    reason: string;
    status: DisputeStatus;
    resolved_at?: Date;
    resolution?: string;
    created_at: Date;
    updated_at: Date;
  };
}

export interface GetDisputesByDealIdResponse {
  disputes: Array<{
    id: string;
    deal_id: string;
    opened_by: string;
    opened_by_role: string;
    reason: string;
    status: DisputeStatus;
    resolved_at?: Date;
    resolution?: string;
    created_at: Date;
    updated_at: Date;
  }>;
}

@Injectable()
export class DisputesClient extends BaseGrpcClient {
  private disputesService: IDisputesService;

  constructor(@Inject('DISPUTES_PACKAGE') client: ClientGrpc) {
    super(client, 'DisputesService');
  }

  onModuleInit() {
    this.disputesService = this.getService<IDisputesService>('DisputesService');
  }

  async openDispute(data: OpenDisputeRequest): Promise<DisputeResponse> {
    return this.callGrpcMethod<DisputeResponse>(
      this.disputesService.openDispute.bind(this.disputesService),
      data
    );
  }

  async resolveDispute(data: ResolveDisputeRequest): Promise<DisputeResponse> {
    return this.callGrpcMethod<DisputeResponse>(
      this.disputesService.resolveDispute.bind(this.disputesService),
      data
    );
  }

  async getDisputeById(data: GetDisputeByIdRequest): Promise<GetDisputeByIdResponse> {
    return this.callGrpcMethod<GetDisputeByIdResponse>(
      this.disputesService.getDisputeById.bind(this.disputesService),
      data
    );
  }

  async getDisputesByDealId(data: GetDisputesByDealIdRequest): Promise<GetDisputesByDealIdResponse> {
    return this.callGrpcMethod<GetDisputesByDealIdResponse>(
      this.disputesService.getDisputesByDealId.bind(this.disputesService),
      data
    );
  }
} 