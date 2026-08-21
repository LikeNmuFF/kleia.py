export interface EmailResult {
  email: string
  ok: boolean
  error?: string
}

const apiKey = process.env.RESEND_API_KEY
if (!apiKey) {
  throw new Error("RESEND_API_KEY is missing")
}
export const resend = new (require("resend").Resend)(apiKey)

const fromAddress = process.env.EMAIL_FROM
if (!fromAddress) {
  throw new Error("EMAIL_FROM is missing")
}
export function getFromAddress(): string {
  return fromAddress
}

export const BATCH_SIZE = 100

export function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export function buildHtml(subject: string, body: string): string {
  return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #333;">${escapeHtml(subject)}</h2><div style="color: #555; line-height: 1.6;">${escapeHtml(body).split("\n").map((line) => `<p>${line}</p>`).join("")}</div><footer style="font-size: 12px; color: #888; margin-top: 20px; text-align: center;"><p>Sent via Kleia</p></footer></div>`
}

export async function sendBulkEmailsTo(to: string[], subject: string, body: string): Promise<EmailResult[]> {
  const results: EmailResult[] = []
  const chunks: string[][] = []

  for (let i = 0; i < to.length; i += BATCH_SIZE) {
    chunks.push(to.slice(i, i + BATCH_SIZE))
  }

  for (const chunk of chunks) {
    const { results: batchResults } = await resend.batch.send({
      from: getFromAddress(),
      to: chunk,
      subject,
      html: buildHtml(subject, body),
    })

    for (const item of batchResults) {
      if (item.error) {
        results.push({ email: item.email ?? "", ok: false, error: item.error.message })
      } else {
        results.push({ email: item.email ?? "", ok: true })
      }
    }
  }

  return results
}