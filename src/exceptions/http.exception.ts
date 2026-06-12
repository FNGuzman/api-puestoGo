import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  isProductionEnv,
  redactHeaders,
  redactSensitiveValue,
} from 'src/common/utils/redact-sensitive.util';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : exception instanceof Error
          ? exception.message
          : 'Error interno del servidor';

    const errorDetails =
      exception instanceof HttpException
        ? exception.getResponse()
        : {
            message: isProductionEnv() ? 'Error interno del servidor' : message,
          };

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}: ${message}`,
        isProductionEnv()
          ? undefined
          : exception instanceof Error
            ? exception.stack
            : undefined,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} -> ${status}: ${message}`,
      );
    }

    if (!isProductionEnv()) {
      this.logger.debug(
        `Request debug: headers=${JSON.stringify(redactHeaders(request.headers as Record<string, unknown>))} ` +
          `params=${JSON.stringify(request.params)} ` +
          `body=${JSON.stringify(redactSensitiveValue(request.body))}`,
      );
    }

    response.status(status).json({ error: true, errorDetails });
  }
}
