import { createHmac, timingSafeEqual } from 'crypto';

export type MercadoPagoWebhookHeaders = {
  xSignature?: string;
  xRequestId?: string;
};

export function extractMercadoPagoDataId(
  body: Record<string, unknown>,
  query: Record<string, unknown> = {},
): string | null {
  const data = body?.data as Record<string, unknown> | undefined;
  if (data?.id != null) {
    const id = data.id;
    return typeof id === 'string' || typeof id === 'number' ? String(id) : null;
  }
  if (query?.id != null) {
    const id = query.id;
    return typeof id === 'string' || typeof id === 'number' ? String(id) : null;
  }
  if (typeof body?.resource === 'string' && /^\d+$/.test(body.resource))
    return body.resource;
  if (typeof body?.resource === 'number') return String(body.resource);
  return null;
}

export function verifyMercadoPagoWebhookSignature(
  secret: string,
  headers: MercadoPagoWebhookHeaders,
  dataId: string,
): boolean {
  const xSignature = headers.xSignature?.trim();
  const xRequestId = headers.xRequestId?.trim();
  if (!secret || !xSignature || !xRequestId || !dataId) {
    return false;
  }

  let ts: string | undefined;
  let hash: string | undefined;
  for (const part of xSignature.split(',')) {
    const [key, value] = part.split('=');
    if (!key || value == null) continue;
    if (key.trim() === 'ts') ts = value.trim();
    if (key.trim() === 'v1') hash = value.trim();
  }

  if (!ts || !hash) {
    return false;
  }

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = createHmac('sha256', secret).update(manifest).digest('hex');

  try {
    return timingSafeEqual(
      Buffer.from(expected, 'utf8'),
      Buffer.from(hash, 'utf8'),
    );
  } catch {
    return false;
  }
}
