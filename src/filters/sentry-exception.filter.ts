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
    const path = request.url.startsWith('/api') ? request.url : `/api${request.url}`;
    const errorResponse = this.createErrorResponse(status, message, path);

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
    return 'Internal server error';
  }

  /**
   * Создание объекта ответа с ошибкой
   */
  private createErrorResponse(status: number, message: string, path: string): object {
    return {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path,
    };
  }

  /**
   * Логирование ошибки
   */
  private logError(exception: unknown, request: Request, status: number): void {
    const message = this.getErrorMessage(exception);
    const path = request.url.startsWith('/api') ? request.url : `/api${request.url}`;
    this.logger.error(
      `[${request.method}] ${path} - Status: ${status} - Message: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );
  }

  /**
   * Отправка ошибки в Sentry
   */
  private sendToSentry(exception: unknown, request: Request, status: number): void {
    // Создание контекста для Sentry
    const path = request.url.startsWith('/api') ? request.url : `/api${request.url}`;
    const context = {
      url: path,
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
    Sentry.setTag('url', path);
    Sentry.setTag('method', request.method);

    // Отправка исключения в Sentry
    if (exception instanceof Error) {
      Sentry.captureException(exception);
    } else {
      Sentry.captureMessage(this.getErrorMessage(exception), 'error');
    }
  }
} 