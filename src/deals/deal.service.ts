import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { KafkaService } from '../kafka/kafka.service';
import { NotificationService } from 'src/notifications/notification.service';
import { CreateDealRequest } from './dto/deal.dto';



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

  // async createDeal(data: {
  //   initiatorId: string;
  //   targetId: string;
  //   amount: number;
  //   description: string;
  //   isCustomerInitiator: boolean;
  // }) {
  async createDeal(data: any) { // !!!!!!!!!!!!!!!!!!!!!!!!!!!!! ИЗМЕНИТЬ
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

    const availableBalance = user.balance - user.reserved_balance;
    if (availableBalance < amount) {
      throw new BadRequestException('Insufficient funds');
    }

    await tx.user.update({
      where: { id: userId },
      data: { reserved_balance: { increment: amount } },
    });
  }


  private validateDealAction(deal: any, userId: string, action: string) {
    if (!deal) {
      throw new BadRequestException('Deal not found');
    }

    const isCustomer = deal.customer_id === userId;
    const isVendor = deal.vendor_id === userId;

    if (!isCustomer && !isVendor) {
      throw new BadRequestException('Not a participant of this deal');
    }

    switch (action) {
      case 'ACCEPT':
        if (deal.status !== 'PENDING') {
          throw new BadRequestException('Deal is not in pending state');
        }
        if ((deal.initiator === 'CUSTOMER' && !isVendor) || 
            (deal.initiator === 'VENDOR' && !isCustomer)) {
          throw new BadRequestException('Only counterparty can accept this deal');
        }
        break;
      
      case 'CANCEL':
        if (deal.status === 'COMPLETED' || deal.status === 'CANCELLED') {
          throw new BadRequestException(`Cannot cancel deal in ${deal.status} state`);
        }
        if (![deal.customer_id, deal.vendor_id].includes(userId)) {
          throw new BadRequestException('Not authorized to cancel this deal');
        }
        break;
      
      // Другие валидации по необходимости
    }
  };



  
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