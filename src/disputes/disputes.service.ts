import { Injectable } from '@nestjs/common';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeDto } from './dto/update-dispute.dto';
import { PrismaService } from 'src/prisma.service';

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
      const deal = await tx.deal.findUnique({ where: { id: dealId } });
      
      // Проверка прав
      if (deal.customer_id !== userId && deal.vendor_id !== userId) {
        throw new Error('Not a participant');
      }
  
      // Обновление статуса сделки
      await tx.deal.update({
        where: { id: dealId },
        data: { status: 'DISPUTED' },
      });
  
      // Создание спора
      return tx.dispute.create({
        data: {
          deal_id: dealId,
          opened_by: deal.customer_id === userId ? 'CUSTOMER' : 'VENDOR',
          reason,
        },
      });
    });
  }
}
