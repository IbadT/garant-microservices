import { Injectable } from '@nestjs/common';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeDto } from './dto/update-dispute.dto';
import { PrismaService } from 'src/prisma.service';
import { DisputeStatus, UserRole } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class DisputesService {


  constructor(private prisma: PrismaService) {} // Добавлен PrismaService

  async deleteDispute(id: string) {
    return this.prisma.$transaction(async (tx) => {
      return tx.dispute.delete({
        where: { id },
      });
    });
  }

  // пример метода для открытого спора
  async openDispute(dealId: string, userId: string, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      const deal = await tx.deal.findUnique({ 
        where: { id: dealId },
        include: {
          disputes: {
            orderBy: {
              created_at: 'desc',
            },
            take: 1,
          },
        },
      });
      
      if (!deal) {
        throw new BadRequestException('Deal not found');
      }
      
      // Проверка прав
      if (deal.customer_id !== userId && deal.vendor_id !== userId) {
        throw new BadRequestException('Not a participant');
      }
  
      // Определяем роль пользователя
      const userRole = deal.customer_id === userId ? UserRole.CUSTOMER : UserRole.VENDOR;

      // Проверяем, не открыт ли уже спор
      const lastDispute = deal.disputes[0];
      if (lastDispute && lastDispute.status === DisputeStatus.PENDING) {
        throw new BadRequestException('A dispute is already open for this deal');
      }
  
      // Обновление статуса сделки
      await tx.deal.update({
        where: { id: dealId },
        data: { status: 'DISPUTED' },
      });
  
      // Создание спора
      const dispute = await tx.dispute.create({
        data: {
          deal_id: dealId,
          opened_by: userId,
          opened_by_role: userRole,
          reason,
          status: DisputeStatus.PENDING,
        },
      });

      return {
        id: dispute.id,
        status: dispute.status,
        message: 'Dispute opened successfully'
      };
    });
  }

  async resolveDispute(dealId: string, disputeId: string, resolution: string, moderatorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.findUnique({
        where: { id: disputeId },
        include: {
          deal: true,
        },
      });

      if (!dispute) {
        throw new BadRequestException('Dispute not found');
      }

      if (dispute.deal_id !== dealId) {
        throw new BadRequestException('Dispute does not belong to this deal');
      }

      if (dispute.status === DisputeStatus.RESOLVED) {
        throw new BadRequestException('Dispute is already resolved');
      }

      // Проверяем, что пользователь является модератором
      const moderator = await tx.user.findUnique({
        where: { id: moderatorId },
        select: { role: true },
      });

      if (!moderator || (moderator.role !== UserRole.ADMIN && moderator.role !== UserRole.MODERATOR)) {
        throw new BadRequestException('Only moderators can resolve disputes');
      }

      // Обновляем статус спора
      const updatedDispute = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: DisputeStatus.RESOLVED,
          resolved_at: new Date(),
          resolution,
        },
      });

      return {
        id: updatedDispute.id,
        status: updatedDispute.status,
        message: 'Dispute resolved successfully'
      };
    });
  }

  async getDisputeById(disputeId: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new BadRequestException('Dispute not found');
    }

    return { dispute };
  }

  async getDisputesByDealId(dealId: string) {
    const disputes = await this.prisma.dispute.findMany({
      where: { deal_id: dealId },
      orderBy: { created_at: 'desc' },
    });

    return { disputes };
  }
}
