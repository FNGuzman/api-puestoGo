import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { getVerificationEmailHtml, CODIGO_EXPIRA_MINUTOS } from './templates/verification-email.template';

/** Lee una variable de entorno y la normaliza: trim y quita comillas al inicio/final (por si viene "valor" o 'valor'). */
function getEnvNormalized(key: string): string {
  const raw = process.env[key];
  if (raw == null) return '';
  let value = raw.trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  return value;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly RETRY_DELAYS_MS = [5000, 15000];

  private getTransporter(): nodemailer.Transporter | null {
    if (this.transporter) return this.transporter;
    const host = getEnvNormalized('SMTP_HOST');
    const port = getEnvNormalized('SMTP_PORT');
    const user = getEnvNormalized('SMTP_USER');
    const pass = getEnvNormalized('SMTP_PASS');
    if (!host || !user || !pass) {
      return null;
    }
    this.transporter = nodemailer.createTransport({
      host,
      port: port ? parseInt(port, 10) : 465,
      secure: port !== '587',
      auth: { user, pass },
    });
    return this.transporter;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private shouldRetry(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const maybe = error as { responseCode?: number; code?: string };
    // 4xx temporales de SMTP (ej: 421) y algunos códigos transitorios de transporte.
    return (
      maybe.responseCode === 421 ||
      maybe.code === 'ETIMEDOUT' ||
      maybe.code === 'ECONNECTION' ||
      maybe.code === 'ESOCKET'
    );
  }

  /** Envía el correo con el código de verificación (estética Nonna). No lanza si SMTP no está configurado (solo log). */
  async sendVerificationEmail(to: string, codigo: string): Promise<void> {
    const trans = this.getTransporter();
    const from = getEnvNormalized('SMTP_FROM') || getEnvNormalized('SMTP_USER') || 'noreply@example.com';
    if (!trans) {
      console.warn('[EmailService] SMTP no configurado. Código de verificación (para pruebas):', codigo);
      return;
    }
    const logoUrl = getEnvNormalized('EMAIL_LOGO_URL') || null;
    const html = getVerificationEmailHtml(codigo, logoUrl);
    const mailOptions = {
      from: from.includes('<') ? from : `"API Template" <${from}>`,
      to,
      subject: 'Tu código de verificación',
      text: `Tu código de verificación es: ${codigo}. Válido por ${CODIGO_EXPIRA_MINUTOS} minutos.`,
      html,
    };

    for (let attempt = 0; attempt <= this.RETRY_DELAYS_MS.length; attempt++) {
      try {
        await trans.sendMail(mailOptions);
        return;
      } catch (err) {
        const isLastAttempt = attempt === this.RETRY_DELAYS_MS.length;
        if (!this.shouldRetry(err) || isLastAttempt) {
          console.error('[EmailService] Error al enviar correo de verificación:', err);
          throw err;
        }
        const delay = this.RETRY_DELAYS_MS[attempt];
        console.warn(
          `[EmailService] Fallo temporal SMTP. Reintentando en ${delay}ms (intento ${attempt + 2}/${this.RETRY_DELAYS_MS.length + 1}).`,
        );
        await this.sleep(delay);
      }
    }
  }
}
