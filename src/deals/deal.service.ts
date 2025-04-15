import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { KafkaService } from '../kafka/kafka.service';
import { NotificationService } from 'src/notifications/notification.service';
// import { CreateDealRequest } from '../proto/generated/src/proto/garant.pb';
import { CreateDealRequest } from '../proto/generated/garant.pb';
import { DealStatus, DealInitiator, DisputeStatus } from '@prisma/client';
import { CommissionService } from '../commission/commission.service';

// Define UserRole enum since it's not exported from Prisma
enum UserRole {
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR'
}

/**
 * Сервис для работы со сделками
 * Предоставляет методы для управления сделками в системе
 */
@Injectable()
export class DealService implements OnModuleInit {
  private readonly DEAL_AUTO_ACCEPT_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private readonly DEAL_AUTO_CANCEL_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

  /**
   * Создает экземпляр DealService
   * @param prisma - Сервис для работы с базой данных
   * @param kafka - Сервис для работы с Kafka
   * @param notification - Сервис для отправки уведомлений
   * @param commissionService - Сервис для работы с комиссиями
   */
  constructor(
    private prisma: PrismaService,
    private kafka: KafkaService,
    private notification: NotificationService,
    private commissionService: CommissionService,
  ) {}

  /**
   * Инициализирует сервис при запуске модуля
   */
  async onModuleInit() {
    // Сначала подключаемся к Kafka
    await this.kafka.connect();
    // Затем подписываемся на обновления
    await this.kafka.subscribeToDealUpdates(this.handleDealUpdate.bind(this));
    // Start checking for auto-accept deals
    this.startAutoAcceptCheck();
    this.startAutoCancelCheck();
  }

  private async handleDealUpdate(message: any) {
    // Обработка событий из Kafka
    console.log('Received Kafka message:', message);
  }

  private async startAutoAcceptCheck() {
    setInterval(async () => {
      try {
        const pendingDeals = await this.prisma.deal.findMany({
          where: {
            status: DealStatus.PENDING,
            initiator: DealInitiator.VENDOR,
            created_at: {
              lt: new Date(Date.now() - this.DEAL_AUTO_ACCEPT_TIMEOUT)
            }
          }
        });

        for (const deal of pendingDeals) {
          await this.acceptDeal(deal.id, deal.customer_id);
        }
      } catch (error) {
        console.error('Error in auto-accept check:', error);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  private async startAutoCancelCheck() {
    setInterval(async () => {
      try {
        const pendingDeals = await this.prisma.deal.findMany({
          where: {
            status: DealStatus.PENDING,
            created_at: {
              lt: new Date(Date.now() - this.DEAL_AUTO_CANCEL_TIMEOUT)
            }
          }
        });

        for (const deal of pendingDeals) {
          await this.cancelDeal(deal.id, 'SYSTEM');
        }
      } catch (error) {
        console.error('Error in auto-cancel check:', error);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  async createDeal(data: CreateDealRequest) {
    return this.prisma.$transaction(async (tx) => {
      if (data.isCustomerInitiator) {
        const commission = await this.commissionService.calculateCommission(data.amount);
        const totalAmount = data.amount + commission;
        
        // Проверка баланса и резервирование средств включая комиссию
        await this.validateAndReserveFunds(data.initiatorId, totalAmount, tx);
        
        const deal = await tx.deal.create({
          data: {
            customer_id: data.initiatorId,
            vendor_id: data.targetId,
            amount: data.amount,
            description: data.description,
            status: DealStatus.PENDING,
            initiator: DealInitiator.CUSTOMER,
            funds_reserved: true,
            commission_amount: commission,
            commission_paid: true,
            created_at: new Date(),
          }
        });

        // Добавляем комиссию на баланс системы
        await this.commissionService.addToCommissionBalance(commission);

        await this.kafka.sendDealEvent({
          type: 'DEAL_CREATED',
          payload: deal,
        });

        await this.notification.notifyUser(data.targetId, {
          type: 'NEW_DEAL',
          dealId: deal.id,
        });

        return deal;
      }

      // Если инициатор - продавец
      const deal = await tx.deal.create({
        data: {
          customer_id: data.targetId,
          vendor_id: data.initiatorId,
          amount: data.amount,
          description: data.description,
          status: DealStatus.PENDING,
          initiator: DealInitiator.VENDOR,
          funds_reserved: false,
          created_at: new Date(),
        }
      });

      await this.kafka.sendDealEvent({
        type: 'DEAL_CREATED',
        payload: deal,
      });

      await this.notification.notifyUser(data.targetId, {
        type: 'NEW_DEAL',
        dealId: deal.id,
      });

      return deal;
    });
  }

  private async validateAndReserveFunds(userId: string, amount: number, prismaTx?: any) {
    const tx = prismaTx || this.prisma;
    
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { balance: true, reserved_balance: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.balance < amount) {
      throw new BadRequestException('Insufficient funds');
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        balance: user.balance - amount,
        reserved_balance: user.reserved_balance + amount,
      },
    });
  }

  /**
   * Валидирует действие пользователя по сделке
   * @param deal - Сделка
   * @param userId - Идентификатор пользователя
   * @param action - Действие
   * @returns {{isCustomer: boolean, isVendor: boolean}} Результат валидации
   * @throws {BadRequestException} Если пользователь не имеет прав на действие
   */
  private validateDealAction(deal: any, userId: string, action: string) {
    if (!deal) {
      throw new BadRequestException('Deal not found');
    }

    if (deal.status !== DealStatus.PENDING && action !== 'dispute') {
      throw new BadRequestException(`Cannot ${action} a deal that is not in PENDING status`);
    }

    const isCustomer = deal.customer_id === userId;
    const isVendor = deal.vendor_id === userId;

    if (!isCustomer && !isVendor) {
      throw new BadRequestException('You are not authorized to perform this action on this deal');
    }

    return { isCustomer, isVendor };
  }

  async acceptDeal(dealId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const deal = await tx.deal.findUnique({
        where: { id: dealId },
      });

      if (!deal) {
        throw new BadRequestException('Deal not found');
      }

      const { isCustomer, isVendor } = this.validateDealAction(deal, userId, 'accept');

      if (deal.initiator === DealInitiator.CUSTOMER && isVendor) {
        throw new BadRequestException('Only the vendor can accept this deal');
      }

      if (deal.initiator === DealInitiator.VENDOR && isCustomer) {
        const commission = await this.commissionService.calculateCommission(deal.amount);
        const totalAmount = deal.amount + commission;
        
        // Резервируем средства покупателя включая комиссию
        await this.validateAndReserveFunds(deal.customer_id, totalAmount, tx);
        
        const updatedDeal = await tx.deal.update({
          where: { id: dealId },
          data: {
            status: DealStatus.ACTIVE,
            accepted_at: new Date(),
            funds_reserved: true,
            commission_amount: commission,
            commission_paid: true
          }
        });

        // Добавляем комиссию на баланс системы
        await this.commissionService.addToCommissionBalance(commission);

        await this.kafka.sendDealEvent({
          type: 'DEAL_ACCEPTED',
          payload: updatedDeal,
        });

        await this.notification.notifyUser(deal.vendor_id, {
          type: 'DEAL_ACCEPTED',
          dealId: deal.id,
        });

        return updatedDeal;
      }

      // Если инициатор - покупатель, а принимает - продавец
      const updatedDeal = await tx.deal.update({
        where: { id: dealId },
        data: {
          status: DealStatus.ACTIVE,
          accepted_at: new Date(),
        }
      });

      await this.kafka.sendDealEvent({
        type: 'DEAL_ACCEPTED',
        payload: updatedDeal,
      });

      await this.notification.notifyUser(deal.customer_id, {
        type: 'DEAL_ACCEPTED',
        dealId: deal.id,
      });

      return updatedDeal;
    });
  }

  async declineDeal(dealId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const deal = await tx.deal.findUnique({
        where: { id: dealId },
      });

      if (!deal) {
        throw new BadRequestException('Deal not found');
      }

      const { isCustomer, isVendor } = this.validateDealAction(deal, userId, 'decline');

      // Определяем, кто отклоняет сделку
      const declinedBy = isCustomer ? 'CUSTOMER' : 'VENDOR';

      // Если комиссия была уплачена, возвращаем её
      if (deal.commission_paid) {
        await this.commissionService.refundCommission(dealId);
      }

      // Если инициатор - покупатель, а отклоняет - продавец, то возвращаем средства
      if (deal.initiator === DealInitiator.CUSTOMER && isVendor && deal.funds_reserved) {
        await this.releaseFunds(deal.customer_id, deal.amount, tx);
      }

      const updatedDeal = await tx.deal.update({
        where: { id: dealId },
        data: {
          status: DealStatus.DECLINED,
          declined_at: new Date(),
          declined_by: declinedBy,
        }
      });

      await this.kafka.sendDealEvent({
        type: 'DEAL_DECLINED',
        payload: updatedDeal,
      });

      await this.notification.notifyUser(
        isCustomer ? deal.vendor_id : deal.customer_id,
        {
          type: 'DEAL_DECLINED',
          dealId: deal.id,
        }
      );

      return updatedDeal;
    });
  }

  async cancelDeal(dealId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const deal = await tx.deal.findUnique({
        where: { id: dealId },
      });

      if (!deal) {
        throw new BadRequestException('Deal not found');
      }

      const { isCustomer, isVendor } = this.validateDealAction(deal, userId, 'cancel');

      // Определяем, кто отменяет сделку
      const cancelledBy = isCustomer ? 'CUSTOMER' : 'VENDOR';

      // Если комиссия была уплачена, возвращаем её
      if (deal.commission_paid) {
        await this.commissionService.refundCommission(dealId);
      }

      // Если средства были зарезервированы, возвращаем их
      if (deal.funds_reserved) {
        await this.releaseFunds(deal.customer_id, deal.amount, tx);
      }

      const updatedDeal = await tx.deal.update({
        where: { id: dealId },
        data: {
          status: DealStatus.CANCELLED,
          cancelled_at: new Date(),
          cancelled_by: cancelledBy,
        }
      });

      await this.kafka.sendDealEvent({
        type: 'DEAL_CANCELLED',
        payload: updatedDeal,
      });

      await this.notification.notifyUser(
        isCustomer ? deal.vendor_id : deal.customer_id,
        {
          type: 'DEAL_CANCELLED',
          dealId: deal.id,
        }
      );

      return updatedDeal;
    });
  }

  async confirmCompletion(dealId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const deal = await tx.deal.findUnique({
        where: { id: dealId },
      });

      if (!deal) {
        throw new BadRequestException('Deal not found');
      }

      if (deal.status !== DealStatus.ACTIVE) {
        throw new BadRequestException('Can only confirm completion of an active deal');
      }

      const { isCustomer, isVendor } = this.validateDealAction(deal, userId, 'confirm completion');

      // Только покупатель может подтвердить завершение сделки
      if (!isCustomer) {
        throw new BadRequestException('Only the customer can confirm deal completion');
      }

      // Переводим средства продавцу
      await this.transferFundsToVendor(deal, tx);

      const updatedDeal = await tx.deal.update({
        where: { id: dealId },
        data: {
          status: DealStatus.COMPLETED,
          completed_at: new Date(),
        },
      });

      await this.kafka.sendDealEvent({
        type: 'DEAL_COMPLETED',
        payload: updatedDeal,
      });

      await this.notification.notifyUser(deal.vendor_id, {
        type: 'DEAL_COMPLETED',
        dealId: deal.id,
      });

      return updatedDeal;
    });
  }

  /**
   * Освобождает зарезервированные средства
   * @param userId - Идентификатор пользователя
   * @param amount - Сумма
   * @param tx - Транзакция
   * @returns {Promise<void>}
   */
  private async releaseFunds(userId: string, amount: number, prismaTx?: any) {
    const tx = prismaTx || this.prisma;
    
    await tx.user.update({
      where: { id: userId },
      data: {
        balance: {
          increment: amount,
        },
        reserved_balance: {
          decrement: amount,
        },
      },
    });
  }

  /**
   * Переводит средства продавцу
   * @param deal - Сделка
   * @param tx - Транзакция
   * @returns {Promise<void>}
   */
  private async transferFundsToVendor(deal: any, prismaTx?: any) {
    const tx = prismaTx || this.prisma;
    
    // Снимаем средства с зарезервированного баланса покупателя
    await tx.user.update({
      where: { id: deal.customer_id },
      data: {
        reserved_balance: {
          decrement: deal.amount,
        },
      },
    });

    // Добавляем средства на баланс продавца
    await tx.user.update({
      where: { id: deal.vendor_id },
      data: {
        balance: {
          increment: deal.amount,
        },
      },
    });
  }

  /**
   * Открывает спор по сделке
   * @param dealId - Идентификатор сделки
   * @param userId - Идентификатор пользователя
   * @param reason - Причина открытия спора
   * @returns {Promise<{deal: any, dispute: any}>} Результат открытия спора
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

      const { isCustomer, isVendor } = this.validateDealAction(deal, userId, 'dispute');

      // Check if there's already an active dispute
      const activeDispute = deal.disputes.find(d => d.status === DisputeStatus.PENDING);
      if (activeDispute) {
        throw new BadRequestException('There is already an active dispute for this deal');
      }

      // Create new dispute
      const dispute = await tx.dispute.create({
        data: {
          deal_id: dealId,
          opened_by: userId,
          opened_by_role: isCustomer ? UserRole.CUSTOMER : UserRole.VENDOR,
          reason: reason,
          status: DisputeStatus.PENDING,
          created_at: new Date(),
        },
      });

      // Update deal status
      const updatedDeal = await tx.deal.update({
        where: { id: dealId },
        data: {
          status: DealStatus.DISPUTED,
        },
      });

      await this.kafka.sendDealEvent({
        type: 'DISPUTE_OPENED',
        payload: { deal: updatedDeal, dispute },
      });

      // Notify the other party
      const notifyUserId = isCustomer ? deal.vendor_id : deal.customer_id;
      await this.notification.notifyUser(notifyUserId, {
        type: 'DISPUTE_OPENED',
        dealId: deal.id,
        disputeId: dispute.id,
      });

      return { deal: updatedDeal, dispute };
    });
  }

  /**
   * Разрешает спор по сделке
   * @param dealId - Идентификатор сделки
   * @param disputeId - Идентификатор спора
   * @param resolution - Решение по спору
   * @param moderatorId - Идентификатор модератора
   * @returns {Promise<{deal: any, dispute: any}>} Результат разрешения спора
   * @throws {BadRequestException} Если спор не найден, уже разрешен или пользователь не является модератором
   */
  async resolveDispute(dealId: string, disputeId: string, resolution: string, moderatorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const deal = await tx.deal.findUnique({
        where: { id: dealId },
        include: { disputes: true },
      });

      if (!deal) {
        throw new BadRequestException('Deal not found');
      }

      const dispute = deal.disputes.find(d => d.id === disputeId);
      if (!dispute) {
        throw new BadRequestException('Dispute not found');
      }

      if (dispute.status !== DisputeStatus.PENDING) {
        throw new BadRequestException('Dispute is not active');
      }

      // Update dispute status
      await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: DisputeStatus.RESOLVED,
          resolution: resolution,
          resolved_at: new Date(),
        },
      });

      // Handle funds based on resolution
      if (resolution === 'VENDOR_WIN') {
        await this.transferFundsToVendor(deal, tx);
      } else if (resolution === 'CUSTOMER_WIN' && deal.funds_reserved) {
        await this.releaseFunds(deal.customer_id, deal.amount, tx);
      }

      // Update deal status
      const updatedDeal = await tx.deal.update({
        where: { id: dealId },
        data: {
          status: DealStatus.COMPLETED,
          completed_at: new Date(),
        },
      });

      await this.kafka.sendDealEvent({
        type: 'DISPUTE_RESOLVED',
        payload: { deal: updatedDeal, dispute },
      });

      // Notify both parties
      await this.notification.notifyUser(deal.customer_id, {
        type: 'DISPUTE_RESOLVED',
        dealId: deal.id,
        disputeId: dispute.id,
        resolution,
      });

      await this.notification.notifyUser(deal.vendor_id, {
        type: 'DISPUTE_RESOLVED',
        dealId: deal.id,
        disputeId: dispute.id,
        resolution,
      });

      return { deal: updatedDeal, dispute };
    });
  }

  async getActiveDeals(userId: string) {
    // Получаем все сделки, кроме тех, что имеют статус CANCELLED / DECLINED / FINISHED
    // или получили этот статус более 24 часов назад
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    return this.prisma.deal.findMany({
      where: {
        OR: [
          {
            customer_id: userId,
          },
          {
            vendor_id: userId,
          },
        ],
        AND: [
          {
            OR: [
              {
                status: {
                  in: [DealStatus.PENDING, DealStatus.ACTIVE, DealStatus.DISPUTED],
                },
              },
              {
                AND: [
                  {
                    status: {
                      in: [DealStatus.CANCELLED, DealStatus.DECLINED, DealStatus.COMPLETED],
                    },
                  },
                  {
                    OR: [
                      {
                        cancelled_at: {
                          gt: twentyFourHoursAgo,
                        },
                      },
                      {
                        declined_at: {
                          gt: twentyFourHoursAgo,
                        },
                      },
                      {
                        completed_at: {
                          gt: twentyFourHoursAgo,
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      include: {
        disputes: {
          orderBy: {
            created_at: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  /**
   * Получает сделку по идентификатору
   * @param dealId - Идентификатор сделки
   * @returns {Promise<any>} Найденная сделка
   */
  async getDealById(dealId: string) {
    return this.prisma.deal.findUnique({
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
  }
}