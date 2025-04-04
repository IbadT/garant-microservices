// import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
// import { Prisma } from '@prisma/client';
// import { SentryExceptionCaptured } from '@sentry/nestjs';
// import { Response } from 'express';

// @Catch()
// export class PrismaExceptionFilter implements ExceptionFilter {
//     @SentryExceptionCaptured()
//   catch(exception: any, host: ArgumentsHost) {
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
//       }
//     } else if (exception instanceof HttpException) {
//       status = exception.getStatus();
//       message = exception.getResponse() as string;
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

