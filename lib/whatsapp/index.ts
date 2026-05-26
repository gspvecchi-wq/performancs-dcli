import type { WhatsAppProvider } from './types'
import { ZApiProvider } from './zapi'
import { EvolutionProvider } from './evolution'

export type { WhatsAppMessage, WhatsAppResponse, WebhookPayload } from './types'

/**
 * Factory: retorna o provider de WhatsApp configurado no .env
 * WHATSAPP_PROVIDER=zapi | evolution
 */
export function getWhatsAppProvider(): WhatsAppProvider {
  const provider = process.env.WHATSAPP_PROVIDER ?? 'zapi'

  switch (provider.toLowerCase()) {
    case 'evolution':
      return new EvolutionProvider()
    case 'zapi':
    default:
      return new ZApiProvider()
  }
}

/**
 * Normaliza número de telefone para E.164
 * Aceita: (11) 99999-9999, +55 11 99999-9999, 5511999999999, 11999999999
 */
export function normalizePhone(phone: string, defaultCountryCode = '55'): string {
  const digits = phone.replace(/\D/g, '')

  // Já está com código do país (>= 12 dígitos para Brasil)
  if (digits.length >= 12) return `+${digits}`

  // Com DDD mas sem código do país (11 dígitos)
  if (digits.length === 11) return `+${defaultCountryCode}${digits}`

  // Sem DDD (9 dígitos) — incomum, não adicionamos DDD
  return `+${defaultCountryCode}${digits}`
}
