import { Controller } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { GrpcMethod } from '@nestjs/microservices';
import { DisputeStatus } from '@prisma/client';

/**
 * Контроллер для работы со спорами через gRPC
 * Предоставляет методы для управления спорами в системе
 */
@Controller()
export class DisputesController {
  /**
   * Создает экземпляр DisputesController
   * @param disputesService - Сервис для работы со спорами
   */
  constructor(private readonly disputesService: DisputesService) {}

  /**
   * Открывает новый спор
   * @param data - Данные для открытия спора
   * @returns {Promise<{id: string, status: DisputeStatus, message: string}>} Результат открытия спора
   */
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

  /**
   * Разрешает существующий спор
   * @param data - Данные для разрешения спора
   * @returns {Promise<{id: string, status: DisputeStatus, message: string}>} Результат разрешения спора
   */
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

  /**
   * Получает спор по идентификатору
   * @param data - Данные для поиска спора
   * @returns {Promise<{dispute: {id: string, deal_id: string, opened_by: string, opened_by_role: string, reason: string, status: DisputeStatus, resolved_at: string, resolution: string, created_at: string, updated_at: string}}>} Найденный спор
   */
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

  /**
   * Получает список споров по идентификатору сделки
   * @param data - Данные для поиска споров
   * @returns {Promise<{disputes: Array<{id: string, deal_id: string, opened_by: string, opened_by_role: string, reason: string, status: DisputeStatus, resolved_at: string, resolution: string, created_at: string, updated_at: string}>}>} Список споров
   */
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