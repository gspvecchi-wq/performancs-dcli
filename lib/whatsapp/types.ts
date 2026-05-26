export interface WhatsAppMessage {
  phone: string    // E.164 format: +5511999999999
  message: string
}

export interface WhatsAppResponse {
  success: boolean
  messageId?: string
  error?: string
}

export interface WhatsAppProvider {
  send(msg: WhatsAppMessage): Promise<WhatsAppResponse>
}

export interface WebhookPayload {
  phone: string
  message: string
  messageId?: string
  timestamp?: number
}
