import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizePhone } from '@/lib/whatsapp'
import type { WebhookPayload } from '@/lib/whatsapp'
import crypto from 'crypto'

/**
 * POST /api/whatsapp/webhook
 * Recebe mensagens de resposta dos pacientes via Z-API ou Evolution API.
 *
 * - Valida HMAC se ZAPI_WEBHOOK_SECRET estiver configurado
 * - Identifica paciente por telefone (E.164)
 * - Salva em `contatos` com tipo='recebido'
 * - Atualiza status_whatsapp do contato de envio correspondente
 */
export async function POST(req: NextRequest) {
  try {
    // ── Validação HMAC (Z-API) ──────────────────────────────────────────
    const webhookSecret = process.env.ZAPI_WEBHOOK_SECRET
    if (webhookSecret) {
      const signature = req.headers.get('x-hub-signature-256') ??
                        req.headers.get('x-zaapi-signature')
      if (signature) {
        const body    = await req.text()
        const hmac    = `sha256=${crypto.createHmac('sha256', webhookSecret).update(body).digest('hex')}`
        const valid   = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(hmac))
        if (!valid) {
          return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
        }
        // Reparsar após ler como texto
        const payload = JSON.parse(body) as Record<string, unknown>
        return await processWebhook(payload)
      }
    }

    const payload = await req.json() as Record<string, unknown>
    return await processWebhook(payload)
  } catch (err) {
    console.error('[/api/whatsapp/webhook]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

async function processWebhook(payload: Record<string, unknown>) {
  // Suporte a Z-API e Evolution API
  const parsed = parseWebhookPayload(payload)
  if (!parsed) {
    // Eventos que não são mensagem recebida (entrega, leitura, etc.)
    return NextResponse.json({ ok: true })
  }

  const { phone, message, messageId } = parsed
  const normalizedPhone = normalizePhone(phone)

  const supabase = await createClient()

  // Encontrar paciente pelo telefone
  const { data: paciente } = await supabase
    .from('pacientes')
    .select('id, clinica_id, telefone')
    .ilike('telefone', `%${phone.replace(/\D/g, '').slice(-8)}%`)  // busca pelos últimos 8 dígitos
    .limit(1)
    .single()

  if (!paciente) {
    console.warn(`[webhook] Paciente não encontrado para telefone: ${normalizedPhone}`)
    return NextResponse.json({ ok: true, skipped: 'paciente não encontrado' })
  }

  // Verificar se é resposta a uma mensagem enviada (último contato do paciente)
  const { data: ultimoEnvio } = await supabase
    .from('contatos')
    .select('id')
    .eq('paciente_id', paciente.id)
    .eq('tipo', 'enviado')
    .order('criado_em', { ascending: false })
    .limit(1)
    .single()

  // Salvar resposta
  await supabase
    .from('contatos')
    .insert({
      paciente_id:         paciente.id,
      clinica_id:          paciente.clinica_id,
      tipo:                'recebido',
      canal:               'whatsapp',
      mensagem:            message,
      execucao_id:         null,
      resposta:            null,
      analise_ia:          null,
      status_whatsapp:     'entregue',
      whatsapp_message_id: messageId ?? null,
      enviado_por:         null,
    })

  // Atualizar status do envio correspondente para 'lido'
  if (ultimoEnvio) {
    await supabase
      .from('contatos')
      .update({ status_whatsapp: 'lido' })
      .eq('id', ultimoEnvio.id)
  }

  return NextResponse.json({ ok: true, pacienteId: paciente.id })
}

/**
 * Parseia payload de webhook de Z-API ou Evolution API
 * Retorna null para eventos que não são mensagens recebidas
 */
function parseWebhookPayload(payload: Record<string, unknown>): WebhookPayload | null {
  // Z-API format
  if (payload.type === 'ReceivedCallback' || payload.type === 'received') {
    const phone   = (payload.phone as string | undefined) ?? ''
    const message = (payload.text as { message?: string } | undefined)?.message ?? ''
    if (!phone || !message) return null
    return { phone, message, messageId: payload.messageId as string | undefined }
  }

  // Evolution API format
  if (payload.event === 'messages.upsert' || payload.event === 'messages.update') {
    const msg = payload.data as Record<string, unknown> | undefined
    if (!msg) return null
    const key   = msg.key as Record<string, unknown> | undefined
    const phone = (key?.remoteJid as string | undefined)?.replace('@s.whatsapp.net', '') ?? ''
    const body  = (msg.message as Record<string, unknown> | undefined)?.conversation as string | undefined
    if (!phone || !body) return null
    return { phone, message: body, messageId: key?.id as string | undefined }
  }

  return null
}

// GET para validação de webhook (alguns provedores fazem GET de verificação)
export async function GET(req: NextRequest) {
  const challenge = req.nextUrl.searchParams.get('hub.challenge')
  if (challenge) {
    return new Response(challenge, { status: 200 })
  }
  return NextResponse.json({ ok: true, service: 'PerformanCS WhatsApp Webhook' })
}
