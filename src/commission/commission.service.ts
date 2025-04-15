import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CommissionSettings, CommissionBalance } from '@prisma/client';

@Injectable()
export class CommissionService {
  private readonly logger = new Logger(CommissionService.name);

  constructor(
    private prisma: PrismaService,
  ) {}

  /**
   * Рассчитывает комиссию для сделки
   * @param dealAmount - Сумма сделки
   * @returns {Promise<number>} - Сумма комиссии
   */
  async calculateCommission(dealAmount: number): Promise<number> {
    const settings = await this.prisma.commissionSettings.findFirst({
      where: { is_active: true }
    });

    if (!settings) {
      throw new BadRequestException('Commission settings not found');
    }

    const commission = (dealAmount * settings.percentage) / 100;
    return Math.max(commission, settings.min_amount);
  }

  /**
   * Добавляет комиссию на баланс системы
   * @param amount - Сумма комиссии
   */
  async addToCommissionBalance(amount: number): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const balance = await tx.commissionBalance.findFirst();
        
        if (balance) {
          await tx.commissionBalance.update({
            where: { id: balance.id },
            data: { amount: { increment: amount } }
          });
        } else {
          await tx.commissionBalance.create({
            data: { amount }
          });
        }
      });
      
      this.logger.log(`Added ${amount} to commission balance`);
    } catch (error) {
      this.logger.error(`Failed to add commission to balance: ${error.message}`);
      throw new BadRequestException('Failed to update commission balance');
    }
  }

  /**
   * Возвращает комиссию при отмене/отклонении сделки
   * @param dealId - ID сделки
   */
  async refundCommission(dealId: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const deal = await tx.deal.findUnique({
          where: { id: dealId }
        });

        if (!deal) {
          this.logger.warn(`Deal ${dealId} not found for commission refund`);
          return;
        }

        if (!deal.commission_paid) {
          this.logger.warn(`Deal ${dealId} has no commission paid`);
          return;
        }

        const balance = await tx.commissionBalance.findFirst();
        if (balance) {
          await tx.commissionBalance.update({
            where: { id: balance.id },
            data: { amount: { decrement: deal.commission_amount } }
          });
          
          this.logger.log(`Refunded ${deal.commission_amount} commission for deal ${dealId}`);
        }
      });
    } catch (error) {
      this.logger.error(`Failed to refund commission: ${error.message}`);
      throw new BadRequestException('Failed to refund commission');
    }
  }

  /**
   * Получает текущий баланс комиссий
   * @returns {Promise<CommissionBalance>} - Текущий баланс комиссий
   */
  async getCommissionBalance(): Promise<CommissionBalance> {
    const balance = await this.prisma.commissionBalance.findFirst();
    
    if (!balance) {
      // Если баланс не существует, создаем его с нулевым значением
      return this.prisma.commissionBalance.create({
        data: { amount: 0 }
      });
    }
    
    return balance;
  }

  /**
   * Обновляет настройки комиссий
   * @param percentage - Процент комиссии
   * @param minAmount - Минимальная сумма комиссии
   * @returns {Promise<CommissionSettings>} - Обновленные настройки
   */
  async updateCommissionSettings(percentage: number, minAmount: number): Promise<CommissionSettings> {
    try {
      // Деактивируем все текущие настройки
      await this.prisma.commissionSettings.updateMany({
        where: { is_active: true },
        data: { is_active: false }
      });

      // Создаем новые настройки
      const settings = await this.prisma.commissionSettings.create({
        data: {
          percentage,
          min_amount: minAmount,
          is_active: true
        }
      });
      
      this.logger.log(`Updated commission settings: ${percentage}%, min ${minAmount}`);
      return settings;
    } catch (error) {
      this.logger.error(`Failed to update commission settings: ${error.message}`);
      throw new BadRequestException('Failed to update commission settings');
    }
  }

  /**
   * Получает текущие настройки комиссий
   * @returns {Promise<CommissionSettings>} - Текущие настройки комиссий
   */
  async getCommissionSettings(): Promise<CommissionSettings> {
    const settings = await this.prisma.commissionSettings.findFirst({
      where: { is_active: true }
    });

    if (!settings) {
      // Если настройки не существуют, создаем их с значениями по умолчанию
      return this.prisma.commissionSettings.create({
        data: {
          percentage: 5.0,
          min_amount: 100,
          is_active: true
        }
      });
    }

    return settings;
  }

  /**
   * Выводит средства из баланса комиссий
   * @param amount - Сумма для вывода
   * @param adminId - ID администратора
   * @returns {Promise<CommissionBalance>} - Обновленный баланс
   */
  async withdrawCommission(amount: number, adminId: string): Promise<CommissionBalance> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Проверяем, что пользователь является администратором
        const admin = await tx.user.findUnique({
          where: { id: adminId }
        });

        if (!admin || admin.role !== 'ADMIN') {
          throw new BadRequestException('Only administrators can withdraw commission');
        }

        const balance = await tx.commissionBalance.findFirst();
        if (!balance) {
          throw new BadRequestException('Commission balance not found');
        }
        
        if (balance.amount < amount) {
          throw new BadRequestException('Insufficient commission balance');
        }

        const updatedBalance = await tx.commissionBalance.update({
          where: { id: balance.id },
          data: { amount: { decrement: amount } }
        });
        
        this.logger.log(`Withdrawn ${amount} from commission balance by admin ${adminId}`);
        return updatedBalance;
      });
    } catch (error) {
      this.logger.error(`Failed to withdraw commission: ${error.message}`);
      throw new BadRequestException(error.message || 'Failed to withdraw commission');
    }
  }
} 