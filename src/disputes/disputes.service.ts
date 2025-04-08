import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeDto } from './dto/update-dispute.dto';
import { PrismaService } from '../prisma.service';
import { DisputeStatus, UserRole } from '@prisma/client';

@Injectable()
export class DisputesService {
  constructor(private readonly prisma: PrismaService) {}

  async deleteDispute(id: string) {
    return this.prisma.$transaction(async (tx) => {
      return tx.dispute.delete({
        where: { id },
      });
    });
  }

  async openDispute(dealId: string, userId: string, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      const deal = await tx.deal.findUnique({
        where: { id: dealId },
        include: { disputes: true },
      });
      
      if (!deal) {
        throw new BadRequestException('Deal not found');
      }
      
      // Проверка прав
      const isCustomer = deal.customer_id === userId;
      const isVendor = deal.vendor_id === userId;
      
      if (!isCustomer && !isVendor) {
        throw new BadRequestException('Only deal participants can open disputes');
      }
      
      // Проверка статуса
      if (deal.status !== 'ACTIVE') {
        throw new BadRequestException('Can only open disputes for active deals');
      }
      
      // Проверка на существующие споры
      const hasOpenDispute = deal.disputes.some(d => d.status === DisputeStatus.PENDING);
      if (hasOpenDispute) {
        throw new BadRequestException('Deal already has an open dispute');
      }
      
      // Обновляем статус сделки
      await tx.deal.update({
        where: { id: dealId },
        data: { status: 'DISPUTED' },
      });
      
      // Создаем спор
      const dispute = await tx.dispute.create({
        data: {
          deal_id: dealId,
          opened_by: userId,
          opened_by_role: isCustomer ? 'CUSTOMER' : 'VENDOR',
          reason,
          status: DisputeStatus.PENDING,
        },
      });

      return {
        id: dispute.id,
        status: dispute.status,
        message: 'Dispute opened successfully',
      };
    });
  }

  async resolveDispute(dealId: string, disputeId: string, resolution: string, moderatorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const [dispute, moderator] = await Promise.all([
        tx.dispute.findUnique({
          where: { id: disputeId },
        }),
        tx.user.findUnique({
          where: { id: moderatorId },
        }),
      ]);

      if (!dispute) {
        throw new BadRequestException('Dispute not found');
      }

      if (!moderator || moderator.role !== UserRole.MODERATOR) {
        throw new BadRequestException('Only moderators can resolve disputes');
      }

      if (dispute.status === DisputeStatus.RESOLVED) {
        throw new BadRequestException('Dispute is already resolved');
      }

      const updatedDispute = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: DisputeStatus.RESOLVED,
          resolution,
          resolved_at: new Date(),
        },
      });

      return {
        id: updatedDispute.id,
        status: updatedDispute.status,
        message: 'Dispute resolved successfully',
      };
    });
  }

  async getDisputeById(disputeId: string) {
    return this.prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.findUnique({
        where: { id: disputeId },
      });

      if (!dispute) {
        throw new BadRequestException('Dispute not found');
      }

      return { dispute };
    });
  }

  async getDisputesByDealId(dealId: string) {
    return this.prisma.$transaction(async (tx) => {
      const disputes = await tx.dispute.findMany({
        where: { deal_id: dealId },
        orderBy: { created_at: 'desc' },
      });

      return { disputes };
    });
  }
}
