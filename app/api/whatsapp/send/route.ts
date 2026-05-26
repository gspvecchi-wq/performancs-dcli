import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWhatsAppProvider, normalizePhone } from '@/lib/whatsapp'

/**
 * POST /api/whatsapp/send
 * Body: { paciente_id, clinica_id, mensagem, fila_id? }
 *
 * Envia uma mensagem via WhatsApp e salva em `contatos`.
 * Credenciais ficam apenas aqui — nunca expostas ao browser.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await req.json()
    const { paciente_id, clinica_id, mensagem, fila_id } = body as {
      paciente_id: string
      clinica_id:  string
      mensagem:    string
      fila_id?:    string
    }

    if (!paciente_id || !clinica_id || !mensagem) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    // Verifica se o paciente pertence à clínica do usuário
    const { data: paciente } = await supabase
      .from('pacientes')
      .select('id, nome, telefone')
      .eq('id', paciente_id)
      .eq('clinica_id', clinica_id)
      .single()

    if (!paciente) {
      return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 })
    }

    if (!paciente.telefone) {
      return NextResponse.json({ error: 'Paciente sem telefone cadastrado' }, { status: 422 })
    }

    // Normalizar telefone e enviar
    const phone   = normalizePhone(paciente.telefone)
    const provider = getWhatsAppProvider()
    const result  = await provider.send({ phone, message: mensagem })

    // Salvar em contatos
    const { data: contato } = await supabase
      .from('contatos')
      .insert({
        paciente_id,
        clinica_id,
        tipo:                'enviado',
        canal:               'whatsapp',
        mensagem,
        enviado_por:         user.id,
        execucao_id:         null,
        resposta:            null,
        analise_ia:          null,
        status_whatsapp:     result.success ? 'enviando' : 'erro',
        whatsapp_message_id: result.messageId ?? null,
      })
      .select('id')
      .single()

    // Atualizar fila se informado
    if (fila_id) {
      await supabase
        .from('fila_do_dia')
        .update({
          status:     'enviado',
          enviado_em: new Date().toISOString(),
          contato_id: contato?.id ?? null,
        })
        .eq('id', fila_id)
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 502 })
    }

    return NextResponse.json({ success: true, contatoId: contato?.id, messageId: result.messageId })
  } catch (err) {
    console.error('[/api/whatsapp/send]', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
