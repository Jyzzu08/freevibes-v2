import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const payloadMessage =
      typeof payload === 'object' && payload !== null && 'message' in payload
        ? payload.message
        : undefined;
    const message =
      typeof payload === 'string'
        ? payload
        : Array.isArray(payloadMessage)
          ? payloadMessage.join(', ')
          : typeof payloadMessage === 'string'
            ? payloadMessage
            : undefined;

    response.status(status).json({
      statusCode: status,
      message: message ?? 'Internal server error',
      error:
        typeof payload === 'object' && payload !== null && 'error' in payload
          ? payload.error
          : HttpStatus[status],
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
