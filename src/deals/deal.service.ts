import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { KafkaService } from '../kafka/kafka.service';
import { NotificationService } from 'src/notifications/notification.service';
import { CreateDealRequest } from '../proto/generated/src/proto/deal.pb';
import { DealStatus, DealInitiator, DisputeStatus } from '@prisma/client';

// Define UserRole enum since it's not exported from Prisma
enum UserRole {
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR'
}

@Injectable()
export class DealService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private kafka: KafkaService,
    private notification: NotificationService,
  ) {}

  async onModuleInit() {
    // Сначала подключаемся к Kafka
    await this.kafka.connect();
    // Затем подписываемся на обновления
    await this.kafka.subscribeToDealUpdates(this.handleDealUpdate.bind(this));
  }

  private async handleDealUpdate(message: any) {
    // Обработка событий из Kafka
    console.log('Received Kafka message:', message);
  }

  async createDeal(data: CreateDealRequest) {
    return this.prisma.$transaction(async (tx) => {
      // Проверка баланса инициатора
      // Проверка баланса и резервирование средств
      if (data.isCustomerInitiator) {
        await this.validateAndReserveFunds(data.initiatorId, data.amount, tx);
      }

      const deal = await tx.deal.create({
        data: {
          customer_id: data.isCustomerInitiator ? data.initiatorId : data.targetId,
          vendor_id: data.isCustomerInitiator ? data.targetId : data.initiatorId,
          amount: data.amount,
          description: data.description,
          status: DealStatus.PENDING,
          initiator: data.isCustomerInitiator ? DealInitiator.CUSTOMER : DealInitiator.VENDOR,
          funds_reserved: data.isCustomerInitiator,
        },
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
        // Если инициатор - продавец, а принимает - покупатель, то резервируем средства
        await this.validateAndReserveFunds(deal.customer_id, deal.amount, tx);
        
        // Обновляем статус сделки
        const updatedDeal = await tx.deal.update({
          where: { id: dealId },
          data: {
            status: DealStatus.ACTIVE,
            accepted_at: new Date(),
            funds_reserved: true,
          },
        });

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
        },
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
        },
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
        },
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

      const { isCustomer, isVendor } = this.validateDealAction(deal, userId, 'dispute');

      // Определяем роль пользователя, открывающего спор
      const userRole = isCustomer ? UserRole.CUSTOMER : UserRole.VENDOR;

      // Проверяем, не открыт ли уже спор
      const lastDispute = deal.disputes[0];
      if (lastDispute && lastDispute.status === DisputeStatus.PENDING) {
        throw new BadRequestException('A dispute is already open for this deal');
      }

      // Создаем новый спор
      const dispute = await tx.dispute.create({
        data: {
          deal_id: dealId,
          opened_by: userId,
          opened_by_role: userRole,
          reason,
          status: DisputeStatus.PENDING,
        },
      });

      // Обновляем статус сделки
      const updatedDeal = await tx.deal.update({
        where: { id: dealId },
        data: {
          status: DealStatus.DISPUTED,
        },
      });

      await this.kafka.sendDealEvent({
        type: 'DISPUTE_OPENED',
        payload: {
          deal: updatedDeal,
          dispute,
        },
      });

      // Уведомляем другую сторону
      await this.notification.notifyUser(
        isCustomer ? deal.vendor_id : deal.customer_id,
        {
          type: 'DISPUTE_OPENED',
          dealId: deal.id,
          disputeId: dispute.id,
        }
      );

      return {
        deal: updatedDeal,
        dispute,
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

      // Обновляем статус сделки в зависимости от резолюции
      let dealStatus = DealStatus.CANCELLED;
      if (resolution === 'CUSTOMER_WON') {
        // Возвращаем средства покупателю
        await this.releaseFunds(dispute.deal.customer_id, dispute.deal.amount, tx);
      } else if (resolution === 'VENDOR_WON') {
        // Переводим средства продавцу
        await this.transferFundsToVendor(dispute.deal, tx);
        dealStatus = DealStatus.CANCELLED;
      }

      const updatedDeal = await tx.deal.update({
        where: { id: dealId },
        data: {
          status: dealStatus,
          completed_at: resolution === 'VENDOR_WON' ? new Date() : null,
          cancelled_at: resolution !== 'VENDOR_WON' ? new Date() : null,
        },
      });

      await this.kafka.sendDealEvent({
        type: 'DISPUTE_RESOLVED',
        payload: {
          deal: updatedDeal,
          dispute: updatedDispute,
        },
      });

      // Уведомляем обе стороны
      await this.notification.notifyUser(dispute.deal.customer_id, {
        type: 'DISPUTE_RESOLVED',
        dealId: dealId,
        disputeId: disputeId,
        resolution,
      });

      await this.notification.notifyUser(dispute.deal.vendor_id, {
        type: 'DISPUTE_RESOLVED',
        dealId: dealId,
        disputeId: disputeId,
        resolution,
      });

      return {
        deal: updatedDeal,
        dispute: updatedDispute,
      };
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