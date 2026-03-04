import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    if (!isHttpException) {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const exceptionResponse = isHttpException ? exception.getResponse() : null;
    const body =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? {
            ...exceptionResponse,
            path: request.url,
            timestamp: new Date().toISOString(),
          }
        : {
            statusCode: status,
            message: exceptionResponse ?? 'Internal server error',
            path: request.url,
            timestamp: new Date().toISOString(),
          };

    response.status(status).json(body);
  }
}
