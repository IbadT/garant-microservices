// import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
// import { Response } from 'express';
// import { Prisma } from '@prisma/client';
// import { SentryExceptionCaptured } from '@sentry/nestjs';

// @Catch()
// export class HandleExceptionsFilter implements ExceptionFilter {
//     @SentryExceptionCaptured()
//   catch(exception: unknown, host: ArgumentsHost) {
//     const ctx = host.switchToHttp();
//     const response = ctx.getResponse<Response>();
//     const request = ctx.getRequest<Request>();

//     let status = HttpStatus.INTERNAL_SERVER_ERROR;
//     let message = 'Internal server error';

//     if (exception instanceof Prisma.PrismaClientKnownRequestError) {
//       switch (exception.code) {
//         case 'P2002':
//           status = HttpStatus.CONFLICT;
//           message = 'Unique constraint failed';
//           break;
//         // Добавьте обработку других кодов ошибок Prisma по мере необходимости
//         default:
//           message = 'Database error';
//           break;
//       }
//     } else if (exception instanceof HttpException) {
//       status = exception.getStatus();
//       const responseMessage = exception.getResponse();
//       message = typeof responseMessage === 'string' ? responseMessage : (responseMessage as any).message || exception.message;
//     } else if (exception instanceof Error) {
//       status = HttpStatus.BAD_REQUEST;
//       message = exception.message || 'Bad Request';
//     }

//     const errorResponse = {
//       statusCode: status,
//       timestamp: new Date().toISOString(),
//       path: request.url,
//       method: request.method,
//       message,
//     };

//     console.error(`${request.method} ${request.url}`, errorResponse);

//     response.status(status).json(errorResponse);
//   }
// }

