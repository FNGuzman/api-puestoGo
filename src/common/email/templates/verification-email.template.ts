/**
 * Template HTML para email de verificacion de correo.
 * Estilo general de sistema: minimalista, blanco y grises.
 */

export const CODIGO_EXPIRA_MINUTOS = 15;

/** Paleta minimalista neutra: blanco y grises */
const COLORS = {
  pageBg: '#F5F5F5',
  cardBg: '#FFFFFF',
  headerGradientFrom: '#4B5563',
  headerGradientTo: '#6B7280',
  accentLight: '#E5E7EB',
  accentMuted: '#D1D5DB',
  panelBg: '#F9FAFB',
  textStrong: '#111827',
  textPrimary: '#1F2937',
  textMuted: '#6B7280',
  borderSoft: '#E5E7EB',
  codeBg: '#F3F4F6',
  codeBorder: '#D1D5DB',
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

/**
 * Genera el HTML del email de verificacion.
 * @param codigo Codigo de 6 digitos
 * @param logoUrl URL publica del logo (opcional)
 */
export function getVerificationEmailHtml(
  codigo: string,
  logoUrl?: string | null,
): string {
  const logoBlock = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="Nest API Template" width="112" height="auto" style="display:block;max-width:112px;height:auto;margin:0 auto 16px;border-radius:8px;" />`
    : `<div style="width:52px;height:52px;margin:0 auto 16px;background:rgba(255,255,255,0.22);border:1px solid rgba(255,255,255,0.35);border-radius:50%;text-align:center;line-height:52px;font-size:24px;">&#128236;</div>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verificacion de correo - Nest API Template</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:${COLORS.pageBg};font-family:'Inter','Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${COLORS.pageBg};padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:500px;border-radius:20px;overflow:hidden;box-shadow:0 6px 24px rgba(17,24,39,0.08),0 1px 3px rgba(17,24,39,0.06);border:1px solid ${COLORS.borderSoft};">
          <tr>
            <td style="background:linear-gradient(145deg,${COLORS.headerGradientFrom} 0%,${COLORS.headerGradientTo} 100%);padding:32px 28px 28px;text-align:center;">
              ${logoBlock}
              <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.85);font-weight:600;">Verificacion</p>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:-0.02em;line-height:1.35;">Codigo de acceso</h1>
              <p style="margin:12px 0 0;font-size:13px;color:rgba(255,255,255,0.88);font-weight:500;">Nest API Template</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:${COLORS.cardBg};padding:32px 28px 36px;">
              <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:${COLORS.textPrimary};">
                Usa este codigo en la aplicacion para <strong style="color:${COLORS.textStrong};font-weight:600;">confirmar tu correo</strong>.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <div style="display:inline-block;padding:20px 28px;background-color:${COLORS.codeBg};border:1px solid ${COLORS.codeBorder};border-radius:14px;">
                      <span style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${COLORS.textMuted};font-weight:600;display:block;margin-bottom:10px;">Código</span>
                      <span style="font-size:30px;font-weight:700;letter-spacing:10px;color:${COLORS.textStrong};font-variant-numeric:tabular-nums;">
                        ${escapeHtml(codigo)}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${COLORS.panelBg};border-radius:12px;border:1px solid ${COLORS.accentLight};">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0;font-size:13px;line-height:1.55;color:${COLORS.textMuted};">
                      El codigo vence en <strong style="color:${COLORS.textPrimary};">${CODIGO_EXPIRA_MINUTOS} minutos</strong>. Si no solicitaste este correo, puedes ignorarlo.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:${COLORS.footerBg};padding:20px 24px;text-align:center;border-top:1px solid ${COLORS.accentLight};">
              <p style="margin:0;font-size:12px;color:${COLORS.textMuted};">
                Desarrollado por <strong style="color:${COLORS.textPrimary};font-weight:600;">PUSH SOFTWARE</strong>
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:${COLORS.textMuted};opacity:0.9;">Nest API Template</p>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;font-size:11px;color:${COLORS.textMuted};opacity:0.75;max-width:480px;text-align:center;line-height:1.5;">
          Este mensaje fue enviado de forma automatica. No respondas a este correo.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
