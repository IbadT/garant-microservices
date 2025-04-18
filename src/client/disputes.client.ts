import { Injectable, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { IDisputesClient } from './interfaces/client.interface';
import { DisputeResponse, GetDisputeByIdResponse, GetDisputesByDealIdResponse, OpenDisputeRequest, ResolveDisputeRequest, GetDisputeByIdRequest, GetDisputesByDealIdRequest } from '../disputes/interfaces/dispute.interface';
import { BaseGrpcClient } from './base.client';
import { DisputeStatus } from '@prisma/client';

/**
 * Клиент для работы со спорами через gRPC
 * Реализует интерфейс IDisputesClient для взаимодействия с сервисом споров
 */
@Injectable()
export class DisputesClient extends BaseGrpcClient implements IDisputesClient {
  private readonly disputesService: any;

  /**
   * Создает экземпляр DisputesClient
   * @param client - gRPC клиент для взаимодействия с сервисом споров
   */
  constructor(@Inject('DISPUTES_PACKAGE') client: ClientGrpc) {
    super(client, 'DisputesService');
    this.disputesService = this.client.getService('DisputesService');
  }

  /**
   * Открывает новый спор
   * @param data - Данные для открытия спора
   * @returns {Promise<DisputeResponse>} Созданный спор
   */
  async openDispute(data: OpenDisputeRequest): Promise<DisputeResponse> {
    return firstValueFrom(this.disputesService.openDispute(data));
  }

  /**
   * Разрешает существующий спор
   * @param data - Данные для разрешения спора
   * @returns {Promise<DisputeResponse>} Обновленный спор
   */
  async resolveDispute(data: ResolveDisputeRequest): Promise<DisputeResponse> {
    return firstValueFrom(this.disputesService.resolveDispute(data));
  }

  /**
   * Получает спор по идентификатору
   * @param data - Данные для поиска спора
   * @returns {Promise<GetDisputeByIdResponse>} Найденный спор
   */
  async getDisputeById(data: GetDisputeByIdRequest): Promise<GetDisputeByIdResponse> {
    return firstValueFrom(this.disputesService.getDisputeById(data));
  }

  /**
   * Получает список споров по идентификатору сделки
   * @param data - Данные для поиска споров
   * @returns {Promise<GetDisputesByDealIdResponse>} Список споров для указанной сделки
   */
  async getDisputesByDealId(data: GetDisputesByDealIdRequest): Promise<GetDisputesByDealIdResponse> {
    return firstValueFrom(this.disputesService.getDisputesByDealId(data));
  }
} 