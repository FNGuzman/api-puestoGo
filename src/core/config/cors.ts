import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { isProductionEnv } from 'src/common/utils/redact-sensitive.util';

function parseOriginList(raw: string): string[] | boolean {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '*') {
    return true;
  }
  return trimmed
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildCorsOptions(): CorsOptions {
  const methods =
    process.env.CORS_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS';
  const credentials = process.env.CORS_CREDENTIALS
    ? process.env.CORS_CREDENTIALS === 'true'
    : true;

  if (isProductionEnv()) {
    const originRaw = process.env.CORS_ORIGIN?.trim();
    if (!originRaw) {
      throw new Error('CORS_ORIGIN es obligatorio en producción.');
    }
    return {
      origin: parseOriginList(originRaw),
      methods,
      credentials,
    };
  }

  return {
    origin: process.env.CORS_ORIGIN
      ? parseOriginList(process.env.CORS_ORIGIN)
      : true,
    methods,
    credentials,
  };
}

/** @deprecated Usar buildCorsOptions() */
export const CORS: CorsOptions = buildCorsOptions();
