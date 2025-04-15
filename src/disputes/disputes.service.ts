import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeDto } from './dto/update-dispute.dto';
import { PrismaService } from '../prisma.service';
import { DisputeStatus, UserRole } from '@prisma/client';

/**
 * Сервис для работы со спорами
 * Предоставляет методы для управления спорами в системе
 */
@Injectable()
export class DisputesService {
  /**
   * Создает экземпляр DisputesService
   * @param prisma - Сервис для работы с базой данных
   */
  constructor(private readonly prisma: PrismaService) {}

  async deleteDispute(id: string) {
    return this.prisma.$transaction(async (tx) => {
      return tx.dispute.delete({
        where: { id },
      });
    });
  }

  /**
   * Открывает новый спор
   * @param dealId - Идентификатор сделки
   * @param userId - Идентификатор пользователя
   * @param reason - Причина открытия спора
   * @returns {Promise<{id: string, status: DisputeStatus, message: string}>} Результат открытия спора
   * @throws {BadRequestException} Если сделка не найдена или уже есть активный спор
   */
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

  /**
   * Разрешает существующий спор
   * @param dealId - Идентификатор сделки
   * @param disputeId - Идентификатор спора
   * @param resolution - Решение по спору
   * @param moderatorId - Идентификатор модератора
   * @returns {Promise<{id: string, status: DisputeStatus, message: string}>} Результат разрешения спора
   * @throws {BadRequestException} Если спор не найден, уже разрешен или пользователь не является модератором
   */
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

  /**
   * Получает спор по идентификатору
   * @param disputeId - Идентификатор спора
   * @returns {Promise<{dispute: {id: string, deal_id: string, opened_by: string, opened_by_role: string, reason: string, status: DisputeStatus, resolved_at: Date, resolution: string, created_at: Date, updated_at: Date}}>} Найденный спор
   * @throws {BadRequestException} Если спор не найден
   */
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

  /**
   * Получает список споров по идентификатору сделки
   * @param dealId - Идентификатор сделки
   * @returns {Promise<{disputes: Array<{id: string, deal_id: string, opened_by: string, opened_by_role: string, reason: string, status: DisputeStatus, resolved_at: Date, resolution: string, created_at: Date, updated_at: Date}>}>} Список споров
   */
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
