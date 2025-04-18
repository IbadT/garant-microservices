import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DealsClient } from './deals.client';
import { DisputesClient } from './disputes.client';
import { Inject } from '@nestjs/common';
import {
  ApiCreateDeal,
  ApiAcceptDeal,
  ApiDeclineDeal,
  ApiCancelDeal,
  ApiConfirmCompletion,
  ApiGetActiveDeals,
  ApiGetDealById,
  ApiOpenDispute,
  ApiResolveDispute,
  ApiGetDisputeById,
  ApiGetDisputesByDealId,
  ApiSendHello,
} from '../decorators/swagger.decorators';
import {
  CreateDealRequest,
  AcceptDealRequest,
  DeclineDealRequest,
  CancelDealRequest,
  ConfirmCompletionRequest,
  GetActiveDealsRequest,
  GetDealByIdRequest,
  SendHelloRequest,
  OpenDisputeRequest,
  ResolveDisputeRequest,
  DealResponse,
  GetActiveDealsResponse,
  GetDealByIdResponse,
} from '../deals/interfaces/deal.interface';
import {
  OpenDisputeRequest as DisputeOpenDisputeRequest,
  ResolveDisputeRequest as DisputeResolveDisputeRequest,
  GetDisputeByIdRequest,
  GetDisputesByDealIdRequest,
  DisputeResponse,
  GetDisputeByIdResponse,
  GetDisputesByDealIdResponse,
} from '../disputes/interfaces/dispute.interface';
import { KafkaService } from '../kafka/kafka.service';
import { IDealsController, IDisputesController } from './interfaces/client.interface';

/**
 * Контроллер для работы со сделками
 * Предоставляет API для создания, принятия, отклонения и управления сделками
 */
@ApiTags('Deals')
@Controller('deals')
export class DealsController implements IDealsController {
  /**
   * Создает экземпляр DealsController
   * @param dealsClient - Клиент для работы со сделками
   * @param kafkaService - Сервис для работы с Kafka
   */
  constructor(
    private readonly dealsClient: DealsClient,
    private readonly kafkaService: KafkaService
  ) {}

  /**
   * Создает новую сделку
   * @param data - Данные для создания сделки
   * @returns {Promise<DealResponse>} Созданная сделка
   */
  @Post('create')
  @ApiCreateDeal()
  async createDeal(@Body() data: CreateDealRequest): Promise<DealResponse> {
    return this.dealsClient.createDeal(data);
  }

  /**
   * Принимает существующую сделку
   * @param data - Данные для принятия сделки
   * @returns {Promise<DealResponse>} Обновленная сделка
   */
  @Post('accept')
  @ApiAcceptDeal()
  async acceptDeal(@Body() data: AcceptDealRequest): Promise<DealResponse> {
    return this.dealsClient.acceptDeal(data);
  }

  /**
   * Отклоняет существующую сделку
   * @param data - Данные для отклонения сделки
   * @returns {Promise<DealResponse>} Обновленная сделка
   */
  @Post('decline')
  @ApiDeclineDeal()
  async declineDeal(@Body() data: DeclineDealRequest): Promise<DealResponse> {
    return this.dealsClient.declineDeal(data);
  }

  /**
   * Отменяет существующую сделку
   * @param data - Данные для отмены сделки
   * @returns {Promise<DealResponse>} Обновленная сделка
   */
  @Post('cancel')
  @ApiCancelDeal()
  async cancelDeal(@Body() data: CancelDealRequest): Promise<DealResponse> {
    return this.dealsClient.cancelDeal(data);
  }

  /**
   * Подтверждает завершение сделки
   * @param data - Данные для подтверждения завершения сделки
   * @returns {Promise<DealResponse>} Обновленная сделка
   */
  @Post('confirm-completion')
  @ApiConfirmCompletion()
  async confirmCompletion(@Body() data: ConfirmCompletionRequest): Promise<DealResponse> {
    return this.dealsClient.confirmCompletion(data);
  }

  /**
   * Открывает спор по сделке
   * @param data - Данные для открытия спора
   * @returns {Promise<DealResponse>} Обновленная сделка со спором
   */
  @Post('open-dispute')
  @ApiOpenDispute()
  async openDispute(@Body() data: OpenDisputeRequest): Promise<DealResponse> {
    return this.dealsClient.openDispute(data);
  }

  /**
   * Разрешает спор по сделке
   * @param data - Данные для разрешения спора
   * @returns {Promise<DealResponse>} Обновленная сделка с разрешенным спором
   */
  @Post('resolve-dispute')
  @ApiResolveDispute()
  async resolveDispute(@Body() data: ResolveDisputeRequest): Promise<DealResponse> {
    return this.dealsClient.resolveDispute(data);
  }

  /**
   * Получает список активных сделок
   * @param data - Параметры для фильтрации активных сделок
   * @returns {Promise<GetActiveDealsResponse>} Список активных сделок
   */
  @Post('active')
  @ApiGetActiveDeals()
  async getActiveDeals(@Body() data: GetActiveDealsRequest): Promise<GetActiveDealsResponse> {
    return this.dealsClient.getActiveDeals(data);
  }

  /**
   * Получает сделку по идентификатору
   * @param data - Данные для поиска сделки
   * @returns {Promise<GetDealByIdResponse>} Найденная сделка
   */
  @Post('by-id')
  @ApiGetDealById()
  async getDealById(@Body() data: GetDealByIdRequest): Promise<GetDealByIdResponse> {
    return this.dealsClient.getDealById(data);
  }

  /**
   * Тестирует отправку сообщения в Kafka
   * @returns {Promise<{success: boolean, message: string}>} Результат отправки тестового сообщения
   */
  @Post('test-kafka')
  async testKafka(): Promise<{ success: boolean; message: string }> {
    await this.kafkaService.sendDealEvent({
      type: 'TEST',
      payload: { message: 'This is a test message', timestamp: new Date().toISOString() }
    });
    return { success: true, message: 'Test message sent to Kafka' };
  }
}

/**
 * Контроллер для работы со спорами
 * Предоставляет API для открытия, разрешения и получения информации о спорах
 */
@ApiTags('Disputes')
@Controller('disputes')
export class DisputesController implements IDisputesController {
  /**
   * Создает экземпляр DisputesController
   * @param disputesClient - Клиент для работы со спорами
   */
  constructor(private readonly disputesClient: DisputesClient) {}

  /**
   * Открывает новый спор
   * @param data - Данные для открытия спора
   * @returns {Promise<DisputeResponse>} Созданный спор
   */
  @Post('open')
  @ApiOpenDispute()
  async openDispute(@Body() data: DisputeOpenDisputeRequest): Promise<DisputeResponse> {
    return this.disputesClient.openDispute(data);
  }

  /**
   * Разрешает существующий спор
   * @param data - Данные для разрешения спора
   * @returns {Promise<DisputeResponse>} Обновленный спор
   */
  @Post('resolve')
  @ApiResolveDispute()
  async resolveDispute(@Body() data: DisputeResolveDisputeRequest): Promise<DisputeResponse> {
    return this.disputesClient.resolveDispute(data);
  }

  /**
   * Получает спор по идентификатору
   * @param data - Данные для поиска спора
   * @returns {Promise<GetDisputeByIdResponse>} Найденный спор
   */
  @Post('by-id')
  @ApiGetDisputeById()
  async getDisputeById(@Body() data: GetDisputeByIdRequest): Promise<GetDisputeByIdResponse> {
    return this.disputesClient.getDisputeById(data);
  }

  /**
   * Получает список споров по идентификатору сделки
   * @param data - Данные для поиска споров
   * @returns {Promise<GetDisputesByDealIdResponse>} Список споров для указанной сделки
   */
  @Post('by-deal-id')
  @ApiGetDisputesByDealId()
  async getDisputesByDealId(@Body() data: GetDisputesByDealIdRequest): Promise<GetDisputesByDealIdResponse> {
    return this.disputesClient.getDisputesByDealId(data);
  }
} 