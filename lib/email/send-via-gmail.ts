import nodemailer from "nodemailer"

import {
  buildLeadEmailHtml,
  buildLeadEmailText,
  type LeadEmailData,
  type LeadEmailOptions,
} from "@/lib/email/send-lead-notification"

export async function sendViaGmailSmtp(
  lead: LeadEmailData,
  options: LeadEmailOptions
): Promise<void> {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "")

  if (!user || !pass) {
    throw new Error("GMAIL_USER or GMAIL_APP_PASSWORD not configured.")
  }

  const fromName = process.env.GMAIL_FROM_NAME ?? process.env.BREVO_FROM_NAME ?? "SolarApp"

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  })

  const subjectPrefix = options.installerCompanyName
    ? `New solar lead (${options.installerCompanyName})`
    : "New solar lead"

  const info = await transporter.sendMail({
    from: `"${fromName}" <${user}>`,
    to: options.toEmails.join(", "),
    subject: `${subjectPrefix}: ${lead.fullName} — ${lead.city}`,
    html: buildLeadEmailHtml(lead, options.installerCompanyName),
    text: buildLeadEmailText(lead),
  })

  console.info("Lead email sent via Gmail SMTP:", info.messageId, "→", options.toEmails.join(", "))
}
