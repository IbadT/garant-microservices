import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response, Request } from 'express';
import * as Sentry from '@sentry/node';

/**
 * Фильтр исключений для обработки ошибок Prisma
 * Преобразует ошибки Prisma в понятные HTTP-ответы и отправляет их в Sentry
 */
@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientValidationError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

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
    const { status, message, errorCode } = this.getErrorDetails(exception);
    
    // Создание объекта ответа с ошибкой
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(errorCode && { errorCode }),
    };

    // Логирование ошибки
    this.logError(exception, request, status, message);

    // Отправка ошибки в Sentry
    this.sendToSentry(exception, request, status, message, errorCode);

    // Отправка ответа клиенту
    response.status(status).json(errorResponse);
  }

  /**
   * Получение деталей ошибки
   */
  private getErrorDetails(exception: unknown): { status: number; message: string; errorCode?: string } {
    // Обработка ошибок Prisma
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          return {
            status: HttpStatus.CONFLICT,
            message: 'Нарушение уникального ограничения',
            errorCode: exception.code,
          };
        case 'P2025':
          return {
            status: HttpStatus.NOT_FOUND,
            message: 'Запись не найдена',
            errorCode: exception.code,
          };
        case 'P2003':
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'Нарушение внешнего ключа',
            errorCode: exception.code,
          };
        case 'P2014':
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'Нарушение ограничения идентификатора',
            errorCode: exception.code,
          };
        case 'P2015':
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'Нарушение ограничения связанной записи',
            errorCode: exception.code,
          };
        default:
          return {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            message: `Ошибка базы данных: ${exception.message}`,
            errorCode: exception.code,
          };
      }
    }
    
    // Обработка ошибок Prisma валидации
    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Ошибка валидации данных',
        errorCode: 'VALIDATION_ERROR',
      };
    }
    
    // Обработка HTTP исключений
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      let message = 'Ошибка сервера';
      
      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object' && response !== null) {
        const msg = (response as any).message;
        if (msg) {
          message = Array.isArray(msg) ? msg[0] : msg;
        }
      }
      
      return { status, message };
    }
    
    // Обработка стандартных ошибок
    if (exception instanceof Error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: exception.message,
      };
    }
    
    // Обработка неизвестных ошибок
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Внутренняя ошибка сервера',
    };
  }

  /**
   * Логирование ошибки
   */
  private logError(exception: unknown, request: Request, status: number, message: string): void {
    const method = request.method;
    const url = request.url;
    const body = JSON.stringify(request.body);
    const query = JSON.stringify(request.query);
    const params = JSON.stringify(request.params);

    this.logger.error(
      `[${method}] ${url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : '',
      {
        body,
        query,
        params,
      },
    );
  }

  /**
   * Отправка ошибки в Sentry
   */
  private sendToSentry(
    exception: unknown, 
    request: Request, 
    status: number, 
    message: string,
    errorCode?: string
  ): void {
    // Создание контекста для Sentry
    const context = {
      url: request.url,
      method: request.method,
      headers: request.headers,
      query: request.query,
      body: request.body,
      params: request.params,
      statusCode: status,
      errorCode,
    };

    // Установка контекста запроса
    Sentry.setContext('request', context);
    Sentry.setTag('status_code', status.toString());
    Sentry.setTag('url', request.url);
    Sentry.setTag('method', request.method);
    if (errorCode) {
      Sentry.setTag('error_code', errorCode);
    }

    // Отправка исключения в Sentry
    if (exception instanceof Error) {
      Sentry.captureException(exception);
    } else {
      Sentry.captureMessage(message, 'error');
    }
  }
}

