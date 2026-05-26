import type { WhatsAppMessage, WhatsAppProvider, WhatsAppResponse } from './types'

/**
 * Z-API WhatsApp provider
 * Docs: https://developer.z-api.io/
 */
export class ZApiProvider implements WhatsAppProvider {
  private readonly instanceId: string
  private readonly token: string
  private readonly clientToken: string
  private readonly baseUrl: string

  constructor() {
    this.instanceId  = process.env.ZAPI_INSTANCE_ID!
    this.token       = process.env.ZAPI_TOKEN!
    this.clientToken = process.env.ZAPI_CLIENT_TOKEN!
    this.baseUrl     = `https://api.z-api.io/instances/${this.instanceId}/token/${this.token}`
  }

  async send(msg: WhatsAppMessage): Promise<WhatsAppResponse> {
    // Z-API espera número sem + e sem espaços
    const phone = msg.phone.replace(/^\+/, '').replace(/\s/g, '')

    try {
      const res = await fetch(`${this.baseUrl}/send-text`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Client-Token':  this.clientToken,
        },
        body: JSON.stringify({ phone, message: msg.message }),
      })

      if (!res.ok) {
        const text = await res.text()
        return { success: false, error: `Z-API error ${res.status}: ${text}` }
      }

      const data = await res.json()
      return { success: true, messageId: data.zaapId ?? data.messageId }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }
}
