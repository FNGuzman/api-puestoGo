import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { RequestContext } from 'src/schematics/audit/config/request-context';
import { resolveAuditUserId } from 'src/schematics/audit/config/audit.utils';
import {
  isProductionEnv,
  redactSensitiveValue,
} from 'src/common/utils/redact-sensitive.util';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private logger = new Logger('Logging');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const reqTime = Date.now();

    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    req.headers['x-request-id'] = requestId;
    const userId = resolveAuditUserId(req);
    const store = {
      requestId,
      userId: userId > 0 ? userId : undefined,
      method,
      path: originalUrl,
    };

    res.on('finish', () => {
      const { statusCode } = res;
      const responseTime = Date.now() - reqTime;

      let bodySummary = '';
      if (!isProductionEnv()) {
        try {
          if (req.body) {
            bodySummary = JSON.stringify(redactSensitiveValue(req.body));
          }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.warn(
            `Error al procesar el body de la request: ${message}`,
          );
        }
      }

      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${responseTime}ms` +
          (bodySummary ? ` body=${bodySummary}` : ''),
      );
    });

    RequestContext.run(store, () => next());
  }
}
