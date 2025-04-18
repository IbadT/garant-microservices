import { BadRequestException, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { KafkaService } from '../kafka/kafka.service';
import { NotificationService } from '../notifications/notification.service';
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
export class DealService implements OnModuleInit, OnModuleDestroy {
  private readonly DEAL_AUTO_ACCEPT_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private readonly DEAL_AUTO_CANCEL_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
  private autoAcceptInterval: NodeJS.Timeout;
  private autoCancelInterval: NodeJS.Timeout;

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
   * Подключается к Kafka, подписывается на обновления сделок и запускает проверки автоматического принятия и отмены сделок
   */
  async onModuleInit() {
    try {
      // Сначала подключаемся к Kafka
      await this.kafka.connect();
      // Затем подписываемся на обновления
      await this.kafka.subscribeToDealUpdates(this.handleDealUpdate.bind(this));
      // Start checking for auto-accept deals
      this.startAutoAcceptCheck();
      this.startAutoCancelCheck();
      console.log('DealService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize DealService:', error);
      throw error;
    }
  }

  /**
   * Очищает ресурсы при завершении работы модуля
   */
  async onModuleDestroy() {
    try {
      // Очищаем интервалы
      if (this.autoAcceptInterval) {
        clearInterval(this.autoAcceptInterval);
      }
      if (this.autoCancelInterval) {
        clearInterval(this.autoCancelInterval);
      }
      // Отключаемся от Kafka
      await this.kafka.disconnect();
      console.log('DealService destroyed successfully');
    } catch (error) {
      console.error('Error during DealService destruction:', error);
    }
  }

  /**
   * Обрабатывает сообщения об обновлениях сделок, полученные из Kafka
   * @param message - Сообщение из Kafka
   */
  private async handleDealUpdate(message: any) {
    try {
      // Обработка событий из Kafka
      console.log('Received Kafka message:', message);
    } catch (error) {
      console.error('Error handling Kafka message:', error);
    }
  }

  /**
   * Запускает периодическую проверку сделок для автоматического принятия
   * Проверяет сделки, инициированные продавцом, которые находятся в статусе PENDING более 24 часов
   * и автоматически принимает их от имени покупателя
   */
  private startAutoAcceptCheck() {
    try {
      // Очищаем предыдущий интервал, если он существует
      if (this.autoAcceptInterval) {
        clearInterval(this.autoAcceptInterval);
      }

      this.autoAcceptInterval = setInterval(async () => {
        try {
          console.log('Running auto-accept check...');
          const pendingDeals = await this.prisma.deal.findMany({
            where: {
              status: DealStatus.PENDING,
              initiator: DealInitiator.VENDOR,
              created_at: {
                lt: new Date(Date.now() - this.DEAL_AUTO_ACCEPT_TIMEOUT)
              }
            }
          });

          console.log(`Found ${pendingDeals.length} deals for auto-accept`);
          for (const deal of pendingDeals) {
            try {
              await this.acceptDeal(deal.id, deal.customer_id);
              console.log(`Auto-accepted deal ${deal.id}`);
            } catch (error) {
              console.error(`Error auto-accepting deal ${deal.id}:`, error);
            }
          }
        } catch (error) {
          console.error('Error in auto-accept check:', error);
        }
      }, 5 * 60 * 1000); // Check every 5 minutes

      console.log('Auto-accept check started');
    } catch (error) {
      console.error('Failed to start auto-accept check:', error);
    }
  }

  /**
   * Запускает периодическую проверку сделок для автоматической отмены
   * Проверяет сделки в статусе PENDING, которые не были приняты более 30 минут,
   * и автоматически отменяет их
   */
  private startAutoCancelCheck() {
    try {
      // Очищаем предыдущий интервал, если он существует
      if (this.autoCancelInterval) {
        clearInterval(this.autoCancelInterval);
      }

      this.autoCancelInterval = setInterval(async () => {
        try {
          console.log('Running auto-cancel check...');
          const pendingDeals = await this.prisma.deal.findMany({
            where: {
              status: DealStatus.PENDING,
              created_at: {
                lt: new Date(Date.now() - this.DEAL_AUTO_CANCEL_TIMEOUT)
              }
            }
          });

          console.log(`Found ${pendingDeals.length} deals for auto-cancel`);
          for (const deal of pendingDeals) {
            try {
              await this.cancelDeal(deal.id, 'SYSTEM');
              console.log(`Auto-cancelled deal ${deal.id}`);
            } catch (error) {
              console.error(`Error auto-cancelling deal ${deal.id}:`, error);
            }
          }
        } catch (error) {
          console.error('Error in auto-cancel check:', error);
        }
      }, 5 * 60 * 1000); // Check every 5 minutes

      console.log('Auto-cancel check started');
    } catch (error) {
      console.error('Failed to start auto-cancel check:', error);
    }
  }

  /**
   * Создает новую сделку в системе
   * Если инициатор - покупатель, резервирует средства и комиссию
   * Если инициатор - продавец, создает сделку без резервирования средств
   * @param data - Данные для создания сделки
   * @returns Созданная сделка
   */
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
            commission_paid: false,
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

  /**
   * Проверяет достаточность средств у пользователя и резервирует их
   * @param userId - Идентификатор пользователя
   * @param amount - Сумма для резервирования
   * @param prismaTx - Транзакция Prisma (опционально)
   * @throws {BadRequestException} Если пользователь не найден или недостаточно средств
   */
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

  /**
   * Принимает сделку
   * Если инициатор - продавец, то покупатель должен принять сделку
   * Если инициатор - покупатель, то продавец должен принять сделку
   * @param dealId - Идентификатор сделки
   * @param userId - Идентификатор пользователя, принимающего сделку
   * @returns Обновленная сделка
   * @throws {BadRequestException} Если сделка не найдена или пользователь не имеет прав
   */
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
        const updatedDeal = await tx.deal.update({
          where: { id: dealId },
          data: {
            status: DealStatus.ACTIVE,
            accepted_at: new Date(),
            commission_paid: true,
          }
        });

        await this.commissionService.addToCommissionBalance(deal.commission_amount);

        await this.kafka.sendDealEvent({
          type: 'DEAL_ACCEPTED',
          payload: updatedDeal,
        });

        await this.notification.notifyUser(deal.customer_id, {
          type: 'DEAL_ACCEPTED',
          dealId: deal.id,
        });

        return updatedDeal;
      }

      if (deal.initiator === DealInitiator.VENDOR && isCustomer) {
        const commission = await this.commissionService.calculateCommission(deal.amount);
        const totalAmount = deal.amount + commission;
        
        await this.validateAndReserveFunds(deal.customer_id, totalAmount, tx);
        
        const updatedDeal = await tx.deal.update({
          where: { id: dealId },
          data: {
            status: DealStatus.ACTIVE,
            accepted_at: new Date(),
            funds_reserved: true,
            commission_amount: commission,
            commission_paid: true,
          }
        });

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

  /**
   * Отклоняет сделку
   * @param dealId - Идентификатор сделки
   * @param userId - Идентификатор пользователя, отклоняющего сделку
   * @returns Обновленная сделка
   * @throws {BadRequestException} Если сделка не найдена или пользователь не имеет прав
   */
  async declineDeal(dealId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const deal = await tx.deal.findUnique({
        where: { id: dealId },
      });

      if (!deal) {
        throw new BadRequestException('Deal not found');
      }

      this.validateDealAction(deal, userId, 'decline');

      // Если средства были зарезервированы, возвращаем их
      if (deal.funds_reserved) {
        await this.releaseFunds(deal.customer_id, deal.amount + (deal.commission_amount || 0), tx);
      }

      const updatedDeal = await tx.deal.update({
        where: { id: dealId },
        data: {
          status: DealStatus.DECLINED,
          declined_at: new Date(),
        }
      });

      await this.kafka.sendDealEvent({
        type: 'DEAL_DECLINED',
        payload: updatedDeal,
      });

      // Уведомляем другую сторону
      const notifyUserId = deal.customer_id === userId ? deal.vendor_id : deal.customer_id;
      await this.notification.notifyUser(notifyUserId, {
        type: 'DEAL_DECLINED',
        dealId: deal.id,
      });

      return updatedDeal;
    });
  }

  /**
   * Отменяет сделку
   * @param dealId - Идентификатор сделки
   * @param userId - Идентификатор пользователя, отменяющего сделку
   * @returns Обновленная сделка
   * @throws {BadRequestException} Если сделка не найдена или пользователь не имеет прав
   */
  async cancelDeal(dealId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const deal = await tx.deal.findUnique({
        where: { id: dealId },
      });

      if (!deal) {
        throw new BadRequestException('Deal not found');
      }

      // Если отмена системой, пропускаем проверку
      if (userId !== 'SYSTEM') {
        this.validateDealAction(deal, userId, 'cancel');
      }

      // Если средства были зарезервированы, возвращаем их
      if (deal.funds_reserved) {
        await this.releaseFunds(deal.customer_id, deal.amount + (deal.commission_amount || 0), tx);
      }

      const updatedDeal = await tx.deal.update({
        where: { id: dealId },
        data: {
          status: DealStatus.CANCELLED,
          cancelled_at: new Date(),
        }
      });

      await this.kafka.sendDealEvent({
        type: 'DEAL_CANCELLED',
        payload: updatedDeal,
      });

      // Уведомляем обе стороны
      await this.notification.notifyUser(deal.customer_id, {
        type: 'DEAL_CANCELLED',
        dealId: deal.id,
      });

      await this.notification.notifyUser(deal.vendor_id, {
        type: 'DEAL_CANCELLED',
        dealId: deal.id,
      });

      return updatedDeal;
    });
  }

  /**
   * Подтверждает завершение сделки
   * @param dealId - Идентификатор сделки
   * @param userId - Идентификатор пользователя, подтверждающего завершение
   * @returns Обновленная сделка
   * @throws {BadRequestException} Если сделка не найдена или пользователь не имеет прав
   */
  async confirmCompletion(dealId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const deal = await tx.deal.findUnique({
        where: { id: dealId },
      });

      if (!deal) {
        throw new BadRequestException('Deal not found');
      }

      const { isCustomer } = this.validateDealAction(deal, userId, 'confirm');

      if (!isCustomer) {
        throw new BadRequestException('Only the customer can confirm completion');
      }

      if (deal.status !== DealStatus.ACTIVE) {
        throw new BadRequestException('Can only confirm completion of an active deal');
      }

      const updatedDeal = await tx.deal.update({
        where: { id: dealId },
        data: {
          status: DealStatus.COMPLETED,
          completed_at: new Date(),
        }
      });

      // Переводим средства продавцу
      await this.transferFundsToVendor(updatedDeal, tx);

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
   * Освобождает зарезервированные средства пользователя
   * @param userId - Идентификатор пользователя
   * @param amount - Сумма для освобождения
   * @param prismaTx - Транзакция Prisma (опционально)
   */
  private async releaseFunds(userId: string, amount: number, prismaTx?: any) {
    const tx = prismaTx || this.prisma;
    
    await tx.user.update({
      where: { id: userId },
      data: {
        balance: {
          increment: amount
        },
        reserved_balance: {
          decrement: amount
        }
      }
    });
  }

  /**
   * Переводит средства от покупателя к продавцу
   * @param deal - Сделка
   * @param prismaTx - Транзакция Prisma (опционально)
   */
  private async transferFundsToVendor(deal: any, prismaTx?: any) {
    const tx = prismaTx || this.prisma;
    
    // Переводим средства продавцу
    await tx.user.update({
      where: { id: deal.vendor_id },
      data: {
        balance: {
          increment: deal.amount
        }
      }
    });

    // Освобождаем зарезервированные средства покупателя
    await tx.user.update({
      where: { id: deal.customer_id },
      data: {
        reserved_balance: {
          decrement: deal.amount + (deal.commission_amount || 0)
        }
      }
    });
  }

  /**
   * Открывает спор по сделке
   * @param dealId - Идентификатор сделки
   * @param userId - Идентификатор пользователя, открывающего спор
   * @param reason - Причина спора
   * @returns Созданный спор
   * @throws {BadRequestException} Если сделка не найдена или пользователь не имеет прав
   */
  async openDispute(dealId: string, userId: string, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      const deal = await tx.deal.findUnique({
        where: { id: dealId },
      });

      if (!deal) {
        throw new BadRequestException('Deal not found');
      }

      const { isCustomer } = this.validateDealAction(deal, userId, 'dispute');

      // Проверяем, нет ли уже открытого спора
      const existingDispute = await tx.dispute.findFirst({
        where: {
          deal_id: dealId,
          status: DisputeStatus.PENDING
        }
      });

      if (existingDispute) {
        throw new BadRequestException('Dispute already exists for this deal');
      }

      // Создаем спор
      const dispute = await tx.dispute.create({
        data: {
          deal_id: dealId,
          opened_by: userId,
          opened_by_role: isCustomer ? UserRole.CUSTOMER : UserRole.VENDOR,
          reason: reason,
          status: DisputeStatus.PENDING,
          created_at: new Date(),
        }
      });

      // Обновляем статус сделки
      await tx.deal.update({
        where: { id: dealId },
        data: {
          status: DealStatus.DISPUTED,
        }
      });

      await this.kafka.sendDealEvent({
        type: 'DISPUTE_OPENED',
        payload: { deal, dispute },
      });

      // Уведомляем другую сторону
      const notifyUserId = deal.customer_id === userId ? deal.vendor_id : deal.customer_id;
      await this.notification.notifyUser(notifyUserId, {
        type: 'DISPUTE_OPENED',
        dealId: deal.id,
        disputeId: dispute.id,
      });

      return dispute;
    });
  }

  /**
   * Разрешает спор по сделке
   * @param dealId - Идентификатор сделки
   * @param disputeId - Идентификатор спора
   * @param resolution - Решение по спору (REFUND, RELEASE, PARTIAL_REFUND)
   * @param moderatorId - Идентификатор модератора, разрешающего спор
   * @returns Обновленный спор
   * @throws {BadRequestException} Если сделка или спор не найдены
   */
  async resolveDispute(dealId: string, disputeId: string, resolution: string, moderatorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const deal = await tx.deal.findUnique({
        where: { id: dealId },
      });

      if (!deal) {
        throw new BadRequestException('Deal not found');
      }

      const dispute = await tx.dispute.findUnique({
        where: { id: disputeId },
      });

      if (!dispute) {
        throw new BadRequestException('Dispute not found');
      }

      if (dispute.deal_id !== dealId) {
        throw new BadRequestException('Dispute does not belong to this deal');
      }

      if (dispute.status !== DisputeStatus.PENDING) {
        throw new BadRequestException('Dispute is not open');
      }

      // Обрабатываем решение в зависимости от типа
      if (resolution === 'REFUND') {
        // Возвращаем средства покупателю
        await this.releaseFunds(deal.customer_id, deal.amount + (deal.commission_amount || 0), tx);
        
        // Возвращаем комиссию
        if (deal.commission_amount) {
          await this.commissionService.refundCommission(deal.commission_amount.toString());
        }
      } else if (resolution === 'RELEASE') {
        // Переводим средства продавцу
        await this.transferFundsToVendor(deal, tx);
      } else if (resolution === 'PARTIAL_REFUND') {
        // Частичный возврат (например, 50% суммы)
        const refundAmount = deal.amount / 2;
        const commissionRefund = deal.commission_amount ? deal.commission_amount / 2 : 0;
        
        await this.releaseFunds(deal.customer_id, refundAmount + commissionRefund, tx);
        
        // Переводим оставшуюся часть продавцу
        await tx.user.update({
          where: { id: deal.vendor_id },
          data: {
            balance: {
              increment: deal.amount - refundAmount
            }
          }
        });
        
        // Освобождаем зарезервированные средства покупателя
        await tx.user.update({
          where: { id: deal.customer_id },
          data: {
            reserved_balance: {
              decrement: deal.amount + (deal.commission_amount || 0)
            }
          }
        });
        
        // Возвращаем часть комиссии
        if (commissionRefund > 0) {
          await this.commissionService.refundCommission(commissionRefund.toString());
        }
      }

      // Обновляем статус спора
      const updatedDispute = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: DisputeStatus.RESOLVED,
          resolution: resolution,
          resolved_at: new Date(),
        }
      });

      // Обновляем статус сделки
      const updatedDeal = await tx.deal.update({
        where: { id: dealId },
        data: {
          status: DealStatus.COMPLETED,
          completed_at: new Date(),
        }
      });

      await this.kafka.sendDealEvent({
        type: 'DISPUTE_RESOLVED',
        payload: { deal: updatedDeal, dispute: updatedDispute },
      });

      // Уведомляем обе стороны
      await this.notification.notifyUser(deal.customer_id, {
        type: 'DISPUTE_RESOLVED',
        dealId: deal.id,
        disputeId: dispute.id,
        resolution: resolution,
      });

      await this.notification.notifyUser(deal.vendor_id, {
        type: 'DISPUTE_RESOLVED',
        dealId: deal.id,
        disputeId: dispute.id,
        resolution: resolution,
      });

      return updatedDispute;
    });
  }

  /**
   * Получает активные сделки пользователя
   * @param userId - Идентификатор пользователя
   * @returns Массив активных сделок пользователя
   */
  async getActiveDeals(userId: string) {
    return this.prisma.deal.findMany({
      where: {
        OR: [
          { customer_id: userId },
          { vendor_id: userId }
        ],
        status: {
          in: [DealStatus.ACTIVE, DealStatus.PENDING]
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
          }
        },
        vendor: {
          select: {
            id: true,
            email: true,
          }
        },
        disputes: {
          where: {
            status: DisputeStatus.PENDING
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
  }

  /**
   * Получает сделку по идентификатору
   * @param dealId - Идентификатор сделки
   * @returns Сделка с включенными данными о покупателе, продавце и спорах
   * @throws {BadRequestException} Если сделка не найдена
   */
  async getDealById(dealId: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
          }
        },
        vendor: {
          select: {
            id: true,
            email: true,
          }
        },
        disputes: true
      }
    });

    if (!deal) {
      throw new BadRequestException('Deal not found');
    }

    return deal;
  }
}