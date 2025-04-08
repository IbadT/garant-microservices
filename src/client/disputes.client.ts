import { Injectable, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { IDisputesClient } from './interfaces/client.interface';
import { DisputeResponse, GetDisputeByIdResponse, GetDisputesByDealIdResponse, OpenDisputeRequest, ResolveDisputeRequest, GetDisputeByIdRequest, GetDisputesByDealIdRequest } from '../disputes/interfaces/dispute.interface';
import { BaseGrpcClient } from './base.client';
import { DisputeStatus } from '@prisma/client';

@Injectable()
export class DisputesClient extends BaseGrpcClient implements IDisputesClient {
  private readonly disputesService: any;

  constructor(@Inject('DISPUTES_PACKAGE') client: ClientGrpc) {
    super(client, 'DisputesService');
    this.disputesService = this.client.getService('DisputesService');
  }

  async openDispute(data: OpenDisputeRequest): Promise<DisputeResponse> {
    return firstValueFrom(this.disputesService.openDispute(data));
  }

  async resolveDispute(data: ResolveDisputeRequest): Promise<DisputeResponse> {
    return firstValueFrom(this.disputesService.resolveDispute(data));
  }

  async getDisputeById(data: GetDisputeByIdRequest): Promise<GetDisputeByIdResponse> {
    return firstValueFrom(this.disputesService.getDisputeById(data));
  }

  async getDisputesByDealId(data: GetDisputesByDealIdRequest): Promise<GetDisputesByDealIdResponse> {
    return firstValueFrom(this.disputesService.getDisputesByDealId(data));
  }
} 