import type { WhatsAppMessage, WhatsAppProvider, WhatsAppResponse } from './types'

/**
 * Evolution API WhatsApp provider (self-hosted)
 * Docs: https://doc.evolution-api.com/
 */
export class EvolutionProvider implements WhatsAppProvider {
  private readonly apiUrl: string
  private readonly apiKey: string
  private readonly instance: string

  constructor() {
    this.apiUrl   = process.env.EVOLUTION_API_URL!
    this.apiKey   = process.env.EVOLUTION_API_KEY!
    this.instance = process.env.EVOLUTION_INSTANCE!
  }

  async send(msg: WhatsAppMessage): Promise<WhatsAppResponse> {
    // Evolution API espera número no formato com @s.whatsapp.net
    const phone = msg.phone.replace(/^\+/, '').replace(/\s/g, '')

    try {
      const res = await fetch(`${this.apiUrl}/message/sendText/${this.instance}`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey':       this.apiKey,
        },
        body: JSON.stringify({
          number:  `${phone}@s.whatsapp.net`,
          options: { delay: 1200, presence: 'composing', linkPreview: false },
          textMessage: { text: msg.message },
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        return { success: false, error: `Evolution API error ${res.status}: ${text}` }
      }

      const data = await res.json()
      return { success: true, messageId: data.key?.id ?? data.id }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }
}
