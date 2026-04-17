import { Resend } from "resend";
import { getPortfolioLogo, PORTFOLIO_LOGOS } from "@/lib/portfolio-logos";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.sinvest.cl";

function baseLayout(content: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f9ff;font-family:'Helvetica Neue',Arial,sans-serif;color:#0d1c2e;-webkit-font-smoothing:antialiased">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9ff;padding:40px 0">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e6eeff;box-shadow:0 2px 8px rgba(13,28,46,0.06);overflow:hidden">
${content}
<tr><td style="padding:24px 32px;border-top:1px solid #e6eeff;text-align:center">
  <p style="margin:0;font-size:12px;color:#737686">S-Invest · Este es un correo automático</p>
  <p style="margin:4px 0 0;font-size:12px;color:#737686"><a href="${APP_URL}" style="color:#004ac6;text-decoration:none">${APP_URL.replace("https://", "")}</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function headerRow(portfolioLogoUrl?: string | null) {
  const logoSrc = `${APP_URL}/logo.jpg`;
  let html = `<tr><td style="padding:28px 32px 20px;text-align:center">
  <img src="${logoSrc}" alt="S-Invest" width="48" height="48" style="border-radius:10px;display:inline-block">`;

  if (portfolioLogoUrl) {
    const fullUrl = portfolioLogoUrl.startsWith("http") ? portfolioLogoUrl : `${APP_URL}${portfolioLogoUrl}`;
    html += `<img src="${fullUrl}" alt="Portafolio" height="36" style="margin-left:12px;border-radius:8px;border:1px solid #e6eeff;padding:4px 8px;vertical-align:middle;display:inline-block">`;
  }

  html += `</td></tr>`;
  return html;
}

function buttonRow(label: string, url: string) {
  return `<tr><td style="padding:8px 32px 24px;text-align:center">
  <a href="${url}" style="display:inline-block;background:#004ac6;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;letter-spacing:0.01em">${label}</a>
</td></tr>`;
}

export async function sendInviteEmail(params: {
  to: string;
  userName: string;
  portfolioName: string;
  portfolioId?: number;
  inviteLink: string;
}) {
  const logoUrl = params.portfolioId ? getPortfolioLogo(params.portfolioId) : null;
  const firstName = params.userName.split(" ")[0];

  const html = baseLayout(`
    ${headerRow(logoUrl)}
    <tr><td style="padding:0 32px 8px">
      <h1 style="margin:0;font-size:20px;font-weight:700;color:#0d1c2e;letter-spacing:-0.02em">Bienvenido a S-Invest</h1>
    </td></tr>
    <tr><td style="padding:0 32px 20px">
      <p style="margin:0;font-size:14px;color:#434655;line-height:1.6">
        Hola ${firstName}, has sido invitado al portafolio <strong>${params.portfolioName}</strong> en la plataforma S-Invest.
      </p>
      <p style="margin:12px 0 0;font-size:14px;color:#434655;line-height:1.6">
        Para activar tu cuenta, haz clic en el botón de abajo y define tu contraseña.
      </p>
    </td></tr>
    ${buttonRow("Activar mi cuenta", params.inviteLink)}
    <tr><td style="padding:0 32px 24px">
      <p style="margin:0;font-size:12px;color:#737686;line-height:1.5">Este enlace es de un solo uso y expira en 24 horas. Si no solicitaste esta invitación, puedes ignorar este correo.</p>
    </td></tr>
  `);

  const { error } = await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Invitación a ${params.portfolioName} — S-Invest`,
    html,
  });

  if (error) throw new Error(`Error enviando email de invitación: ${error.message}`);
}

export async function sendRecoveryEmail(params: {
  to: string;
  userName: string;
  recoveryLink: string;
}) {
  const firstName = params.userName.split(" ")[0];

  const html = baseLayout(`
    ${headerRow()}
    <tr><td style="padding:0 32px 8px">
      <h1 style="margin:0;font-size:20px;font-weight:700;color:#0d1c2e;letter-spacing:-0.02em">Restablecer contraseña</h1>
    </td></tr>
    <tr><td style="padding:0 32px 20px">
      <p style="margin:0;font-size:14px;color:#434655;line-height:1.6">
        Hola ${firstName}, recibimos una solicitud para restablecer la contraseña de tu cuenta en S-Invest.
      </p>
      <p style="margin:12px 0 0;font-size:14px;color:#434655;line-height:1.6">
        Haz clic en el botón de abajo para elegir una nueva contraseña.
      </p>
    </td></tr>
    ${buttonRow("Restablecer contraseña", params.recoveryLink)}
    <tr><td style="padding:0 32px 24px">
      <p style="margin:0;font-size:12px;color:#737686;line-height:1.5">Este enlace es de un solo uso y expira en 24 horas. Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
    </td></tr>
  `);

  const { error } = await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: "Restablecer contraseña — S-Invest",
    html,
  });

  if (error) throw new Error(`Error enviando email de recuperación: ${error.message}`);
}
