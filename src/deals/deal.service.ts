import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { KafkaService } from '../kafka/kafka.service';
import { NotificationService } from 'src/notifications/notification.service';
import { CreateDealRequest } from '../proto/generated/src/proto/deal.pb';

enum DealStatus {
  PENDING,
  ACTIVE,
  COMPLETED,
  CANCELLED,
  DECLINED,
  DISPUTED,
}

enum DealInitiator {
  CUSTOMER,
  VENDOR
}

// enum DisputeStatus {
//   PENDING,
//   RESOLVED,
// }

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
          status: 'PENDING',
          initiator: data.isCustomerInitiator ? 'CUSTOMER' : 'VENDOR',
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

    if (deal.status !== 'PENDING') {
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

      if (deal.initiator === 'CUSTOMER' && isVendor) {
        throw new BadRequestException('Only the customer can accept this deal');
      }

      if (deal.initiator === 'VENDOR' && isCustomer) {
        throw new BadRequestException('Only the vendor can accept this deal');
      }

      const updatedDeal = await tx.deal.update({
        where: { id: dealId },
        data: {
          status: 'ACTIVE',
        },
      });

      await this.kafka.sendDealEvent({
        type: 'DEAL_ACCEPTED',
        payload: updatedDeal,
      });

      await this.notification.notifyUser(
        isCustomer ? deal.vendor_id : deal.customer_id,
        {
          type: 'DEAL_ACCEPTED',
          dealId: deal.id,
        }
      );

      return updatedDeal;
    });
  }

  // Другие методы: cancelDeal, confirmCompletion, openDispute и т.д.
  // Полная реализация всех сценариев из схемы
}