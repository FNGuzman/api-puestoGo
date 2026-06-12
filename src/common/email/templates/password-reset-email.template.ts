/**
 * Template HTML para recuperación de contraseña (misma línea visual que verificación).
 */

import { CODIGO_EXPIRA_MINUTOS } from './verification-email.template';

export { CODIGO_EXPIRA_MINUTOS };

const COLORS = {
  pageBg: '#F5F5F5',
  cardBg: '#FFFFFF',
  headerGradientFrom: '#4B5563',
  headerGradientTo: '#6B7280',
  accentLight: '#E5E7EB',
  codeBg: '#F3F4F6',
  codeBorder: '#D1D5DB',
  textStrong: '#111827',
  textPrimary: '#1F2937',
  textMuted: '#6B7280',
  borderSoft: '#E5E7EB',
  panelBg: '#F9FAFB',
  footerBg: '#F3F4F6',
} as const;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function getPasswordResetEmailHtml(
  codigo: string,
  logoUrl?: string | null,
): string {
  const logoBlock = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="Nest API Template" width="112" height="auto" style="display:block;max-width:112px;height:auto;margin:0 auto 16px;border-radius:8px;" />`
    : `<div style="width:52px;height:52px;margin:0 auto 16px;background:rgba(255,255,255,0.22);border:1px solid rgba(255,255,255,0.35);border-radius:50%;text-align:center;line-height:52px;font-size:24px;">&#128274;</div>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperar contraseña</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:${COLORS.pageBg};font-family:'Inter','Segoe UI',system-ui,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${COLORS.pageBg};padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:500px;border-radius:20px;overflow:hidden;box-shadow:0 6px 24px rgba(17,24,39,0.08);border:1px solid ${COLORS.borderSoft};">
          <tr>
            <td style="background:linear-gradient(145deg,${COLORS.headerGradientFrom} 0%,${COLORS.headerGradientTo} 100%);padding:32px 28px;text-align:center;">
              ${logoBlock}
              <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.85);font-weight:600;">Seguridad</p>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#FFFFFF;">Recuperar contraseña</h1>
              <p style="margin:12px 0 0;font-size:13px;color:rgba(255,255,255,0.88);">Usá este código en la app</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:${COLORS.cardBg};padding:32px 28px;">
              <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:${COLORS.textPrimary};">
                Ingresá el siguiente código para <strong style="color:${COLORS.textStrong};">elegir una nueva contraseña</strong>.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <div style="display:inline-block;padding:20px 28px;background-color:${COLORS.codeBg};border:1px solid ${COLORS.codeBorder};border-radius:14px;">
                      <span style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${COLORS.textMuted};display:block;margin-bottom:10px;">Código</span>
                      <span style="font-size:30px;font-weight:700;letter-spacing:10px;color:${COLORS.textStrong};font-variant-numeric:tabular-nums;">${escapeHtml(codigo)}</span>
                    </div>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" style="background-color:${COLORS.panelBg};border-radius:12px;border:1px solid ${COLORS.accentLight};">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0;font-size:13px;color:${COLORS.textMuted};">
                      Vence en <strong style="color:${COLORS.textPrimary};">${CODIGO_EXPIRA_MINUTOS} minutos</strong>. Si no pediste recuperar la contraseña, ignorá este mensaje.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:${COLORS.footerBg};padding:20px;text-align:center;border-top:1px solid ${COLORS.accentLight};">
              <p style="margin:0;font-size:12px;color:${COLORS.textMuted};"><strong style="color:${COLORS.textPrimary};">PUSH SOFTWARE</strong></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
