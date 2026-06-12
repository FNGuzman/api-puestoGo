import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

type PreferenceResponse = {
  id: string;
  init_point?: string;
  sandbox_init_point?: string;
};

type MpPayment = {
  id: number | string;
  status: string;
  external_reference?: string | null;
  transaction_amount?: number;
};

@Injectable()
export class MercadoPagoCheckoutService {
  private readonly logger = new Logger(MercadoPagoCheckoutService.name);

  private getToken(): string | undefined {
    return process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  }

  isConfigured(): boolean {
    return !!this.getToken();
  }

  async createPreference(params: {
    title: string;
    unitPrice: number;
    currencyId: string;
    externalReference: string;
    successUrl: string;
    failureUrl: string;
    pendingUrl: string;
    notificationUrl: string;
  }): Promise<{ id: string; init_point: string }> {
    const token = this.getToken();
    if (!token) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN no configurado');
    }
    const body = {
      items: [
        {
          title: params.title,
          quantity: 1,
          unit_price: params.unitPrice,
          currency_id: params.currencyId,
        },
      ],
      external_reference: params.externalReference,
      back_urls: {
        success: params.successUrl,
        failure: params.failureUrl,
        pending: params.pendingUrl,
      },
      auto_return: 'approved',
      notification_url: params.notificationUrl,
    };
    const res = await axios.post<PreferenceResponse>(
      'https://api.mercadopago.com/checkout/preferences',
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );
    const init = res.data.sandbox_init_point || res.data.init_point;
    if (!init) {
      throw new Error('Mercado Pago no devolvió init_point');
    }
    return { id: res.data.id, init_point: init };
  }

  async getPayment(paymentId: string): Promise<MpPayment | null> {
    const token = this.getToken();
    if (!token) return null;
    try {
      const res = await axios.get<MpPayment>(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return res.data;
    } catch (e) {
      this.logger.warn(
        `No se pudo obtener pago MP ${paymentId}: ${(e as Error).message}`,
      );
      return null;
    }
  }
}
