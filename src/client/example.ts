import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DealsClient } from './deals.client';
import { DisputesClient } from './disputes.client';
import { Inject } from '@nestjs/common';


// ПРИМЕР ИСПОЛЬЗОВАНИЯ КЛИЕНТОВ

export class ExampleService {
  constructor(
    @Inject('DEALS_PACKAGE') private readonly dealsClient: DealsClient,
    @Inject('DISPUTES_PACKAGE') private readonly disputesClient: DisputesClient,
  ) {}

  async example() {
    try {
      // Создание сделки
      const deal = await this.dealsClient.createDeal({
        initiatorId: 'user-1',
        targetId: 'user-2',
        amount: 1000,
        description: 'Test deal',
        isCustomerInitiator: true,
      });
      console.log('Created deal:', deal);

      // Принятие сделки
      const acceptedDeal = await this.dealsClient.acceptDeal({
        dealId: deal.id,
        userId: 'user-2',
      });
      console.log('Accepted deal:', acceptedDeal);

      // Открытие спора
      const dispute = await this.disputesClient.openDispute({
        dealId: deal.id,
        userId: 'user-1',
        reason: 'Quality issues',
      });
      console.log('Opened dispute:', dispute);

      // Получение информации о сделке
      const dealInfo = await this.dealsClient.getDealById({
        dealId: deal.id,
      });
      console.log('Deal info:', dealInfo);

      // Получение списка споров по сделке
      const disputes = await this.disputesClient.getDisputesByDealId({
        dealId: deal.id,
      });
      console.log('Deal disputes:', disputes);

    } catch (error) {
      console.error('Error:', error.message);
    }
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const exampleService = app.get(ExampleService);
  await exampleService.example();
  await app.close();
}

bootstrap(); 