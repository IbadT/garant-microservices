import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KafkaService } from '../kafka/kafka.service';
import { NotificationService } from '../notifications/notification.service';
import { DealStatus, DealInitiator, Prisma } from '@prisma/client';

@Injectable()
export class DealService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private kafka: KafkaService,
    private notification: NotificationService,
  ) {}

  async onModuleInit() {
    await this.kafka.subscribeToDealUpdates(this.handleDealUpdate.bind(this));
  }

  private async handleDealUpdate(message: any) {
    // Обработка событий из Kafka
  }

  async createDeal(data: {
    initiatorId: string;
    targetId: string;
    amount: number;
    description: string;
    isCustomerInitiator: boolean;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // Проверка баланса инициатора
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

  async acceptDeal(dealId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const deal = await tx.deal.findUnique({ where: { id: dealId } });
      
      // Валидация прав и статуса сделки
      this.validateDealAction(deal, userId, 'ACCEPT');

      if (deal.initiator === DealInitiator.VENDOR && !deal.funds_reserved) {
        await this.validateAndReserveFunds(deal.customer_id, deal.amount, tx);
      }

      const updatedDeal = await tx.deal.update({
        where: { id: dealId },
        data: { 
          status: DealStatus.ACTIVE,
          funds_reserved: true,
          accepted_at: new Date(),
        },
      });

      await this.kafka.sendDealEvent({
        type: 'DEAL_ACCEPTED',
        payload: updatedDeal,
      });

      await this.notification.notifyUsers([deal.customer_id, deal.vendor_id], {
        type: 'DEAL_ACCEPTED',
        dealId: updatedDeal.id,
      });

      return updatedDeal;
    });
  }

  // Другие методы: cancelDeal, confirmCompletion, openDispute и т.д.
  // Полная реализация всех сценариев из схемы
}