import { ClientGrpc } from '@nestjs/microservices';
import { Injectable, Inject } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { IDealsClient } from './interfaces/client.interface';
import { 
  DealResponse, 
  GetActiveDealsResponse, 
  GetDealByIdResponse,
  SendHelloRequest,
  CreateDealRequest,
  AcceptDealRequest,
  DeclineDealRequest,
  CancelDealRequest,
  ConfirmCompletionRequest,
  OpenDisputeRequest,
  ResolveDisputeRequest,
  GetActiveDealsRequest,
  GetDealByIdRequest
} from '../deals/interfaces/deal.interface';
import { BaseGrpcClient } from './base.client';

/**
 * Клиент для работы со сделками через gRPC
 * Реализует интерфейс IDealsClient для взаимодействия с сервисом сделок
 */
@Injectable()
export class DealsClient extends BaseGrpcClient implements IDealsClient {
  private readonly dealsService: any;

  /**
   * Создает экземпляр DealsClient
   * @param client - gRPC клиент для взаимодействия с сервисом сделок
   */
  constructor(@Inject('DEALS_PACKAGE') client: ClientGrpc) {
    super(client, 'DealService');
    this.dealsService = this.client.getService('DealService');
  }

  /**
   * Создает новую сделку
   * @param data - Данные для создания сделки
   * @returns {Promise<DealResponse>} Созданная сделка
   */
  async createDeal(data: CreateDealRequest): Promise<DealResponse> {
    return firstValueFrom(this.dealsService.createDeal(data));
  }

  /**
   * Принимает существующую сделку
   * @param data - Данные для принятия сделки
   * @returns {Promise<DealResponse>} Обновленная сделка
   */
  async acceptDeal(data: AcceptDealRequest): Promise<DealResponse> {
    return firstValueFrom(this.dealsService.acceptDeal(data));
  }

  /**
   * Отклоняет существующую сделку
   * @param data - Данные для отклонения сделки
   * @returns {Promise<DealResponse>} Обновленная сделка
   */
  async declineDeal(data: DeclineDealRequest): Promise<DealResponse> {
    return firstValueFrom(this.dealsService.declineDeal(data));
  }

  /**
   * Отменяет существующую сделку
   * @param data - Данные для отмены сделки
   * @returns {Promise<DealResponse>} Обновленная сделка
   */
  async cancelDeal(data: CancelDealRequest): Promise<DealResponse> {
    return firstValueFrom(this.dealsService.cancelDeal(data));
  }

  /**
   * Подтверждает завершение сделки
   * @param data - Данные для подтверждения завершения сделки
   * @returns {Promise<DealResponse>} Обновленная сделка
   */
  async confirmCompletion(data: ConfirmCompletionRequest): Promise<DealResponse> {
    return firstValueFrom(this.dealsService.confirmCompletion(data));
  }

  /**
   * Открывает спор по сделке
   * @param data - Данные для открытия спора
   * @returns {Promise<DealResponse>} Обновленная сделка со спором
   */
  async openDispute(data: OpenDisputeRequest): Promise<DealResponse> {
    return firstValueFrom(this.dealsService.openDispute(data));
  }

  /**
   * Разрешает спор по сделке
   * @param data - Данные для разрешения спора
   * @returns {Promise<DealResponse>} Обновленная сделка с разрешенным спором
   */
  async resolveDispute(data: ResolveDisputeRequest): Promise<DealResponse> {
    return firstValueFrom(this.dealsService.resolveDispute(data));
  }

  /**
   * Получает список активных сделок
   * @param data - Параметры для фильтрации активных сделок
   * @returns {Promise<GetActiveDealsResponse>} Список активных сделок
   */
  async getActiveDeals(data: GetActiveDealsRequest): Promise<GetActiveDealsResponse> {
    return firstValueFrom(this.dealsService.getActiveDeals(data));
  }

  /**
   * Получает сделку по идентификатору
   * @param data - Данные для поиска сделки
   * @returns {Promise<GetDealByIdResponse>} Найденная сделка
   */
  async getDealById(data: GetDealByIdRequest): Promise<GetDealByIdResponse> {
    return firstValueFrom(this.dealsService.getDealById(data));
  }
} 

export { ConfirmCompletionRequest, CancelDealRequest };
