import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

/**
 * Фильтр исключений для отправки ошибок в Sentry
 * Отлавливает все исключения и отправляет их в Sentry с дополнительным контекстом
 */
@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SentryExceptionFilter.name);

  /**
   * Обработка исключения
   * @param exception Исключение
   * @param host Хост запроса
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Определение статуса и сообщения ошибки
    const status = this.getHttpStatus(exception);
    const message = this.getErrorMessage(exception);
    const errorResponse = this.createErrorResponse(status, message);

    // Логирование ошибки
    this.logError(exception, request, status);

    // Отправка ошибки в Sentry
    this.sendToSentry(exception, request, status);

    // Отправка ответа клиенту
    response.status(status).json(errorResponse);
  }

  /**
   * Получение HTTP статуса из исключения
   */
  private getHttpStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * Получение сообщения об ошибке из исключения
   */
  private getErrorMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return response;
      }
      if (typeof response === 'object' && response !== null) {
        const message = (response as any).message;
        if (message) {
          return Array.isArray(message) ? message[0] : message;
        }
      }
    }
    if (exception instanceof Error) {
      return exception.message;
    }
    return 'Внутренняя ошибка сервера';
  }

  /**
   * Создание объекта ответа с ошибкой
   */
  private createErrorResponse(status: number, message: string): object {
    return {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: '/',
    };
  }

  /**
   * Логирование ошибки
   */
  private logError(exception: unknown, request: Request, status: number): void {
    const errorMessage = this.getErrorMessage(exception);
    const method = request.method;
    const url = request.url;
    const body = JSON.stringify(request.body);
    const query = JSON.stringify(request.query);
    const params = JSON.stringify(request.params);
    const headers = JSON.stringify(request.headers);

    this.logger.error(
      `[${method}] ${url} - ${status} - ${errorMessage}`,
      exception instanceof Error ? exception.stack : '',
      {
        body,
        query,
        params,
        headers,
      },
    );
  }

  /**
   * Отправка ошибки в Sentry
   */
  private sendToSentry(exception: unknown, request: Request, status: number): void {
    // Создание контекста для Sentry
    const context = {
      url: request.url,
      method: request.method,
      headers: request.headers,
      query: request.query,
      body: request.body,
      params: request.params,
      statusCode: status,
    };

    // Установка контекста запроса
    Sentry.setContext('request', context);
    Sentry.setTag('status_code', status.toString());
    Sentry.setTag('url', request.url);
    Sentry.setTag('method', request.method);

    // Отправка исключения в Sentry
    if (exception instanceof Error) {
      Sentry.captureException(exception);
    } else {
      Sentry.captureMessage(this.getErrorMessage(exception), 'error');
    }
  }
} 