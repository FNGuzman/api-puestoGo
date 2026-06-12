import { createHmac } from 'crypto';
import {
  extractMercadoPagoDataId,
  verifyMercadoPagoWebhookSignature,
} from './mercadopago-webhook.util';

describe('mercadopago-webhook.util', () => {
  const secret = 'test-webhook-secret';

  function buildSignature(
    dataId: string,
    requestId: string,
    ts: string,
  ): string {
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const hash = createHmac('sha256', secret).update(manifest).digest('hex');
    return `ts=${ts},v1=${hash}`;
  }

  it('extrae data id desde body.data.id', () => {
    expect(extractMercadoPagoDataId({ data: { id: 12345 } })).toBe('12345');
  });

  it('extrae data id desde query.id', () => {
    expect(extractMercadoPagoDataId({}, { id: '999' })).toBe('999');
  });

  it('valida firma HMAC de Mercado Pago', () => {
    const dataId = '12345';
    const requestId = 'req-abc';
    const ts = '1700000000';
    const xSignature = buildSignature(dataId, requestId, ts);

    expect(
      verifyMercadoPagoWebhookSignature(
        secret,
        { xSignature, xRequestId: requestId },
        dataId,
      ),
    ).toBe(true);
  });

  it('rechaza firma inválida', () => {
    expect(
      verifyMercadoPagoWebhookSignature(
        secret,
        { xSignature: 'ts=1,v1=invalid', xRequestId: 'req-abc' },
        '12345',
      ),
    ).toBe(false);
  });
});
