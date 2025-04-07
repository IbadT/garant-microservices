import { Controller } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { GrpcMethod } from '@nestjs/microservices';
import { DisputeStatus } from '@prisma/client';

@Controller()
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @GrpcMethod('DisputesService', 'OpenDispute')
  async openDispute(data: { dealId: string; userId: string; reason: string }) {
    const result = await this.disputesService.openDispute(
      data.dealId,
      data.userId,
      data.reason,
    );
    return {
      id: result.id,
      status: result.status,
      message: result.message,
    };
  }

  @GrpcMethod('DisputesService', 'ResolveDispute')
  async resolveDispute(data: {
    dealId: string;
    disputeId: string;
    resolution: string;
    moderatorId: string;
  }) {
    const result = await this.disputesService.resolveDispute(
      data.dealId,
      data.disputeId,
      data.resolution,
      data.moderatorId,
    );
    return {
      id: result.id,
      status: result.status,
      message: result.message,
    };
  }

  @GrpcMethod('DisputesService', 'GetDisputeById')
  async getDisputeById(data: { disputeId: string }) {
    const result = await this.disputesService.getDisputeById(data.disputeId);
    return {
      dispute: {
        id: result.dispute.id,
        deal_id: result.dispute.deal_id,
        opened_by: result.dispute.opened_by,
        opened_by_role: result.dispute.opened_by_role,
        reason: result.dispute.reason,
        status: result.dispute.status,
        resolved_at: result.dispute.resolved_at?.toISOString(),
        resolution: result.dispute.resolution,
        created_at: result.dispute.created_at.toISOString(),
        updated_at: result.dispute.updated_at.toISOString(),
      },
    };
  }

  @GrpcMethod('DisputesService', 'GetDisputesByDealId')
  async getDisputesByDealId(data: { dealId: string }) {
    const result = await this.disputesService.getDisputesByDealId(data.dealId);
    return {
      disputes: result.disputes.map((dispute) => ({
        id: dispute.id,
        deal_id: dispute.deal_id,
        opened_by: dispute.opened_by,
        opened_by_role: dispute.opened_by_role,
        reason: dispute.reason,
        status: dispute.status,
        resolved_at: dispute.resolved_at?.toISOString(),
        resolution: dispute.resolution,
        created_at: dispute.created_at.toISOString(),
        updated_at: dispute.updated_at.toISOString(),
      })),
    };
  }
}