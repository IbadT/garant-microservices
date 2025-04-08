import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

/**
 * Базовый класс для gRPC клиентов
 * Предоставляет общую функциональность для работы с gRPC сервисами
 */
export class BaseGrpcClient {
  /**
   * Создает экземпляр BaseGrpcClient
   * @param client - gRPC клиент для взаимодействия с сервисом
   * @param serviceName - Имя сервиса для взаимодействия
   */
  constructor(
    protected readonly client: ClientGrpc,
    protected readonly serviceName: string,
  ) {}

  /**
   * Получает сервис по имени
   * @param serviceName - Имя сервиса для получения
   * @returns {T} Экземпляр сервиса
   */
  protected getService<T extends object>(serviceName: string): T {
    return this.client.getService<T>(this.serviceName);
  }

  /**
   * Вызывает gRPC метод и обрабатывает результат
   * @param method - Метод для вызова
   * @param args - Аргументы для передачи в метод
   * @returns {Promise<T>} Результат вызова метода
   * @throws {Error} Если произошла ошибка при вызове метода
   */
  protected async callGrpcMethod<T>(
    method: (...args: any[]) => any,
    ...args: any[]
  ): Promise<T> {
    try {
      const response = await firstValueFrom(method(...args));
      return response as T;
    } catch (error) {
      if (error.details) {
        throw new Error(error.details);
      }
      throw error;
    }
  }
} 