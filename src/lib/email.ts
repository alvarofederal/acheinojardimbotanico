import { Resend } from "resend"
import { render } from "@react-email/render"
import { VerificationEmailTemplate } from "@/components/emails/verification-email-template"

const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "Achei JBT <noreply@acheinojardimbotanico.com.br>"

const isDev = process.env.NODE_ENV === "development"

function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error("RESEND_API_KEY não configurada")
  return new Resend(apiKey)
}

export async function sendVerificationEmail(
  email: string,
  code: string,
  expiresInMinutes: number = 0.75
) {
  if (isDev) {
    console.log("\n✉️  [DEV] Código de Verificação:", code, "→", email)
    return
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY não configurada.")
    return
  }

  const emailHtml = await render(
    VerificationEmailTemplate({ code, expiresInMinutes })
  )

  const { error } = await getResend().emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "🔐 Código de Verificação — Achei no Jardim Botânico",
    html: emailHtml,
  })

  if (error) {
    console.error("Erro ao enviar email de verificação:", error)
    throw new Error(`Erro ao enviar email: ${error.message}`)
  }
}

/** Wrapper HTML padrão dos emails transacionais. */
function emailShell(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8"></head>
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;background:#f4f4f4">
    <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.1)">
      <div style="background:linear-gradient(135deg,#10b981,#14b8a6);padding:36px 30px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">${title}</h1>
      </div>
      <div style="padding:36px 30px">${bodyHtml}</div>
      <div style="background:#f9fafb;padding:24px;text-align:center">
        <p style="color:#6b7280;font-size:13px;margin:0">© ${new Date().getFullYear()} Achei no Jardim Botânico</p>
      </div>
    </div>
  </body>
</html>`
}

/** Notifica o admin de uma nova reivindicação pendente. */
export async function sendClaimReceivedEmail(
  adminEmail: string,
  businessName: string,
  userName: string,
  userEmail: string
) {
  if (isDev) {
    console.log(`\n📋 [DEV] Nova reivindicação: "${businessName}" por ${userName} (${userEmail})`)
    return
  }
  if (!process.env.RESEND_API_KEY) return

  const html = emailShell("📋 Nova reivindicação", `
    <p style="color:#4b5563;font-size:16px">Uma nova reivindicação aguarda análise:</p>
    <ul style="color:#4b5563;font-size:15px;line-height:1.8">
      <li><strong>Negócio:</strong> ${businessName}</li>
      <li><strong>Solicitante:</strong> ${userName} (${userEmail})</li>
    </ul>
    <div style="text-align:center;margin:28px 0">
      <a href="https://acheinojardimbotanico.com.br/dashboard/admin/claims" style="display:inline-block;background:#10b981;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600">Revisar reivindicações</a>
    </div>`)

  const { error } = await getResend().emails.send({
    from: EMAIL_FROM,
    to: adminEmail,
    subject: `📋 Nova reivindicação: ${businessName}`,
    html,
  })
  if (error) console.error("Erro ao enviar email de claim ao admin:", error)
}

/** Notifica o usuário sobre o resultado da reivindicação. */
export async function sendClaimResultEmail(
  email: string,
  businessName: string,
  approved: boolean,
  businessUrl?: string
) {
  if (isDev) {
    console.log(`\n${approved ? "✅" : "❌"} [DEV] Claim ${approved ? "aprovada" : "rejeitada"}: "${businessName}" → ${email}`)
    return
  }
  if (!process.env.RESEND_API_KEY) return

  const html = approved
    ? emailShell("✅ Reivindicação aprovada!", `
        <p style="color:#4b5563;font-size:16px">Boa notícia! Sua reivindicação de <strong>${businessName}</strong> foi aprovada.</p>
        <p style="color:#4b5563;font-size:15px">Agora você pode editar o perfil, adicionar fotos e gerenciar as informações do seu negócio.</p>
        <div style="text-align:center;margin:28px 0">
          <a href="https://acheinojardimbotanico.com.br/dashboard/negocio" style="display:inline-block;background:#10b981;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600">Gerenciar meu negócio</a>
        </div>
        ${businessUrl ? `<p style="color:#6b7280;font-size:14px;text-align:center">Ver perfil público: <a href="${businessUrl}" style="color:#10b981">${businessUrl}</a></p>` : ""}`)
    : emailShell("Reivindicação não aprovada", `
        <p style="color:#4b5563;font-size:16px">Sua reivindicação de <strong>${businessName}</strong> não foi aprovada desta vez.</p>
        <p style="color:#4b5563;font-size:15px">Isso pode acontecer quando não conseguimos confirmar a titularidade. Se acredita que houve um engano, entre em contato conosco respondendo este email.</p>`)

  const { error } = await getResend().emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: approved
      ? `✅ ${businessName} é seu! Reivindicação aprovada`
      : `Sobre sua reivindicação de ${businessName}`,
    html,
  })
  if (error) console.error("Erro ao enviar email de resultado de claim:", error)
}

/** Notifica o admin de um novo pagamento informado (aguardando confirmação). */
export async function sendPaymentClaimEmail(
  adminEmail: string,
  businessName: string,
  plan: string,
  months: number,
  amountCents: number,
  method: string
) {
  const valor = (amountCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  if (isDev) {
    console.log(`\n💳 [DEV] Pagamento informado: ${businessName} — ${plan} ${months}m ${valor} (${method})`)
    return
  }
  if (!process.env.RESEND_API_KEY) return

  const html = emailShell("💳 Pagamento informado", `
    <p style="color:#4b5563;font-size:16px">Um anunciante informou um pagamento que aguarda sua confirmação:</p>
    <ul style="color:#4b5563;font-size:15px;line-height:1.8">
      <li><strong>Negócio:</strong> ${businessName}</li>
      <li><strong>Plano:</strong> ${plan} — ${months} ${months > 1 ? "meses" : "mês"}</li>
      <li><strong>Valor:</strong> ${valor}</li>
      <li><strong>Método:</strong> ${method}</li>
    </ul>
    <div style="text-align:center;margin:28px 0">
      <a href="https://acheinojardimbotanico.com.br/dashboard/admin/pagamentos" style="display:inline-block;background:#10b981;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600">Confirmar pagamento</a>
    </div>
    <p style="color:#6b7280;font-size:13px">Confira o recebimento (PIX/Mercado Pago) antes de liberar.</p>`)

  const { error } = await getResend().emails.send({
    from: EMAIL_FROM,
    to: adminEmail,
    subject: `💳 Pagamento informado: ${businessName} (${valor})`,
    html,
  })
  if (error) console.error("Erro ao enviar email de pagamento:", error)
}

/** Notifica o anunciante que o plano foi liberado. */
export async function sendPlanActivatedEmail(
  email: string,
  businessName: string,
  plan: string,
  expiresAt: Date
) {
  if (isDev) {
    console.log(`\n✅ [DEV] Plano liberado: ${businessName} — ${plan} até ${expiresAt.toLocaleDateString("pt-BR")}`)
    return
  }
  if (!process.env.RESEND_API_KEY) return

  const html = emailShell("✅ Plano ativado!", `
    <p style="color:#4b5563;font-size:16px">Confirmamos seu pagamento e o plano <strong>${plan}</strong> de
    <strong>${businessName}</strong> está ativo até <strong>${expiresAt.toLocaleDateString("pt-BR")}</strong>.</p>
    <p style="color:#4b5563;font-size:15px">Agora você pode montar sua vitrine de produtos, destacar seu negócio e muito mais.</p>
    <div style="text-align:center;margin:28px 0">
      <a href="https://acheinojardimbotanico.com.br/dashboard" style="display:inline-block;background:#10b981;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600">Acessar painel</a>
    </div>`)

  const { error } = await getResend().emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: `✅ Plano ${plan} ativado — ${businessName}`,
    html,
  })
  if (error) console.error("Erro ao enviar email de ativação:", error)
}

/** Notifica admins de um novo evento submetido (aguardando moderação). */
export async function sendEventSubmittedEmail(adminEmail: string, businessName: string, title: string) {
  if (isDev) { console.log(`\n📅 [DEV] Evento submetido: "${title}" por ${businessName}`); return }
  if (!process.env.RESEND_API_KEY) return
  const html = emailShell("📅 Novo evento para moderar", `
    <p style="color:#4b5563;font-size:16px"><strong>${businessName}</strong> enviou um evento que aguarda sua aprovação:</p>
    <p style="color:#4b5563;font-size:15px"><strong>${title}</strong></p>
    <div style="text-align:center;margin:28px 0">
      <a href="https://acheinojardimbotanico.com.br/dashboard/admin/eventos" style="display:inline-block;background:#10b981;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600">Revisar evento</a>
    </div>`)
  const { error } = await getResend().emails.send({ from: EMAIL_FROM, to: adminEmail, subject: `📅 Evento para moderar: ${title}`, html })
  if (error) console.error("Erro email evento submetido:", error)
}

/** Notifica o anunciante do resultado da moderação do evento. */
export async function sendEventModeratedEmail(email: string, title: string, approved: boolean, note?: string) {
  if (isDev) { console.log(`\n${approved ? "✅" : "❌"} [DEV] Evento ${approved ? "aprovado" : "rejeitado"}: "${title}"${note ? ` — ${note}` : ""}`); return }
  if (!process.env.RESEND_API_KEY) return
  const html = approved
    ? emailShell("✅ Seu evento foi publicado!", `<p style="color:#4b5563;font-size:16px">O evento <strong>${title}</strong> já está no ar na agenda do Jardim Botânico. 🎉</p>`)
    : emailShell("Seu evento precisa de ajustes", `
        <p style="color:#4b5563;font-size:16px">O evento <strong>${title}</strong> ainda não foi publicado.</p>
        ${note ? `<p style="color:#4b5563;font-size:15px;background:#fef3c7;padding:12px;border-radius:8px"><strong>Observação:</strong> ${note}</p>` : ""}
        <p style="color:#6b7280;font-size:14px">Ajuste no painel e reenvie — vamos revisar de novo.</p>`)
  const { error } = await getResend().emails.send({ from: EMAIL_FROM, to: email, subject: approved ? `✅ Evento publicado: ${title}` : `Ajustes no evento: ${title}`, html })
  if (error) console.error("Erro email moderação evento:", error)
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  if (isDev) {
    console.log("\n🔑 [DEV] Recuperação de Senha →", email, "\nLink:", resetUrl)
    return
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY não configurada.")
    return
  }

  const emailHtml = `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8"></head>
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;background:#f4f4f4">
    <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.1)">
      <div style="background:linear-gradient(135deg,#10b981,#14b8a6);padding:40px 30px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:28px">🔑 Recuperação de Senha</h1>
      </div>
      <div style="padding:40px 30px">
        <p style="color:#4b5563;font-size:16px">Recebemos uma solicitação para redefinir a senha da sua conta no Achei no Jardim Botânico.</p>
        <div style="text-align:center;margin:30px 0">
          <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#10b981,#14b8a6);color:#fff;padding:16px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px">Redefinir Senha</a>
        </div>
        <p style="color:#d97706;font-size:14px;background:#fef3c7;padding:12px;border-radius:6px"><strong>⚠️ Este link expira em 1 hora.</strong></p>
        <p style="color:#6b7280;font-size:14px">Se não solicitou a recuperação, ignore este email.</p>
      </div>
      <div style="background:#f9fafb;padding:30px;text-align:center">
        <p style="color:#6b7280;font-size:14px;margin:0">© ${new Date().getFullYear()} Achei no Jardim Botânico. Todos os direitos reservados.</p>
      </div>
    </div>
  </body>
</html>`

  const { error } = await getResend().emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "🔑 Recuperação de Senha — Achei no Jardim Botânico",
    html: emailHtml,
  })

  if (error) {
    console.error("Erro ao enviar email de recuperação:", error)
    throw new Error(`Erro ao enviar email: ${error.message}`)
  }
}
