/**
 * Fail-fast al arrancar si faltan variables críticas.
 * En tests (Jest) se omite: usar `test/setup-e2e-env.ts` para valores dummy.
 */

import { isProductionEnv } from 'src/common/utils/redact-sensitive.util';

function shouldSkipAuthValidation(): boolean {
  return (
    process.env.NODE_ENV === 'test' ||
    process.env.JEST_WORKER_ID !== undefined ||
    process.env.SKIP_AUTH_ENV_VALIDATION === 'true'
  );
}

function requireNonEmpty(keys: readonly string[]): string[] {
  const missing: string[] = [];
  for (const key of keys) {
    if (!process.env[key]?.trim()) {
      missing.push(key);
    }
  }
  return missing;
}

function assertMinLength(keys: readonly string[], min: number): void {
  for (const key of keys) {
    const value = process.env[key]!.trim();
    if (value.length < min) {
      throw new Error(`${key} debe tener al menos ${min} caracteres.`);
    }
  }
}

function assertForbiddenTrue(key: string, message: string): void {
  const raw = (process.env[key] || '').trim().toLowerCase();
  if (raw === 'true' || raw === '1') {
    throw new Error(message);
  }
}

export function validateRequiredAuthEnv(): void {
  if (shouldSkipAuthValidation()) {
    return;
  }

  const missing = requireNonEmpty([
    'ACCESS_TOKEN_SECRET',
    'ACCESS_TOKEN_REFRESH_SECRET',
  ]);
  if (missing.length > 0) {
    throw new Error(
      `Variables de entorno faltantes: ${missing.join(', ')}. Copiá .env.example a .env y completá valores seguros.`,
    );
  }

  assertMinLength(['ACCESS_TOKEN_SECRET', 'ACCESS_TOKEN_REFRESH_SECRET'], 16);

  if (isProductionEnv()) {
    validateProductionEnv();
  }
}

export function validateProductionEnv(): void {
  const missing = requireNonEmpty([
    'DB_HOST',
    'DB_PORT',
    'DB_USERNAME',
    'DB_PASSWORD',
    'DB_NAME',
    'MERCADOPAGO_ACCESS_TOKEN',
    'MERCADOPAGO_WEBHOOK_SECRET',
    'PUBLIC_API_BASE_URL',
    'LANDING_BASE_URL',
    'CORS_ORIGIN',
  ]);

  if (missing.length > 0) {
    throw new Error(
      `Producción: faltan variables obligatorias: ${missing.join(', ')}.`,
    );
  }

  assertForbiddenTrue(
    'DB_SYNCHRONIZE',
    'DB_SYNCHRONIZE=true no está permitido en producción. Usá migraciones TypeORM.',
  );
  assertForbiddenTrue(
    'ALLOW_SUBSCRIPTION_MOCK_CHECKOUT',
    'ALLOW_SUBSCRIPTION_MOCK_CHECKOUT no está permitido en producción.',
  );
}
