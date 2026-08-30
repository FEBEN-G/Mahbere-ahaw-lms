import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { MulterError } from 'multer';
import { ApiErrorResponse } from '../interfaces/api-response.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<{ id?: string; method?: string; url?: string }>();

    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let exceptionResponse: string | object | null =
      exception instanceof HttpException ? exception.getResponse() : null;

    if (exception instanceof MulterError) {
      if (exception.code === 'LIMIT_FILE_SIZE') {
        status = HttpStatus.PAYLOAD_TOO_LARGE;
        exceptionResponse = {
          message: 'File exceeds 10MB limit',
          error: 'Payload Too Large',
          statusCode: status,
        };
      } else {
        status = HttpStatus.BAD_REQUEST;
        exceptionResponse = {
          message: exception.message,
          error: 'Bad Request',
          statusCode: status,
        };
      }
    }

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : typeof exceptionResponse === 'object' &&
            exceptionResponse !== null &&
            'message' in exceptionResponse
          ? (exceptionResponse as { message: string | string[] }).message
          : 'Internal server error';

    if (status >= 500) {
      this.logger.error({
        msg: 'unhandled_exception',
        requestId: request?.id,
        method: request?.method,
        url: request?.url,
        error:
          exception instanceof Error
            ? { name: exception.name, message: exception.message, stack: exception.stack }
            : String(exception),
      });
    }

    const body: ApiErrorResponse = {
      success: false,
      data: null,
      meta: null,
      error: {
        code: HttpStatus[status] ?? 'INTERNAL_SERVER_ERROR',
        message: Array.isArray(message) ? message.join(', ') : String(message),
        details:
          typeof exceptionResponse === 'object' ? exceptionResponse : undefined,
      },
    };

    response.status(status).json(body);
  }
}
