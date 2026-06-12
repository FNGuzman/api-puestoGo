const SENSITIVE_KEYS = new Set([
  'password',
  'contrasena',
  'nuevaContrasena',
  'confirmarContrasena',
  'refresh_token',
  'access_token',
  'authorization',
  'token',
  'codigo',
  'signature',
  'base64',
  'file',
  'attachment',
  'attachments',
  'image',
  'web_image',
  'mobile_image',
  'polygon',
]);

const REDACTED = '[REDACTED]';

export function redactSensitiveValue(value: unknown): unknown {
  if (value == null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveValue(item));
  }

  const result: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (SENSITIVE_KEYS.has(key.toLowerCase()) || SENSITIVE_KEYS.has(key)) {
      result[key] = REDACTED;
      continue;
    }
    result[key] = redactSensitiveValue(nested);
  }
  return result;
}

export function redactHeaders(
  headers: Record<string, unknown>,
): Record<string, unknown> {
  const copy = { ...headers };
  if (copy.authorization) copy.authorization = REDACTED;
  if (copy.Authorization) copy.Authorization = REDACTED;
  if (copy.cookie) copy.cookie = REDACTED;
  if (copy.Cookie) copy.Cookie = REDACTED;
  return copy;
}

export function isProductionEnv(): boolean {
  return process.env.NODE_ENV === 'production';
}
