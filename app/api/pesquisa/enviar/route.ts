import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWhatsAppProvider, normalizePhone } from '@/lib/whatsapp'

export const runtime = 'nodejs'

/**
 * POST /api/pesquisa/enviar
 *
 * Envia por WhatsApp o link das pesquisas pendentes (criadas em
 * /api/pesquisa/gerar e ainda não enviadas). Marca `enviada_em` só quando o
 * envio dá certo, para que uma nova tentativa reenvie apenas o que falhou.
 *
 * Body opcional: { pesquisa_id } para enviar uma específica.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: usuario } = await supabase
      .from('usuarios').select('clinica_id').eq('id', user.id).single()
    if (!usuario) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 403 })

    const body = await req.json().catch(() => ({})) as { pesquisa_id?: string }

    let query = supabase
      .from('pesquisas')
      .select('id, token, paciente_id, paciente:pacientes(nome, telefone)')
      .eq('clinica_id', usuario.clinica_id)
      .is('enviada_em', null)
      .is('respondida_em', null)

    if (body.pesquisa_id) query = query.eq('id', body.pesquisa_id)

    const { data: pendentes } = await query

    if (!pendentes || pendentes.length === 0) {
      return NextResponse.json({
        success: true, enviadas: 0,
        message: 'Nenhuma pesquisa pendente de envio.',
      })
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      req.headers.get('origin') ??
      new URL(req.url).origin

    const whatsapp = getWhatsAppProvider()
    let enviadas = 0
    const semTelefone: string[] = []
    const falhas: string[] = []

    for (const p of pendentes) {
      const paciente = p.paciente as unknown as { nome?: string; telefone?: string } | null
      const telefone = paciente?.telefone
      const nome = paciente?.nome?.trim().split(/\s+/)[0] ?? ''

      if (!telefone) {
        semTelefone.push(paciente?.nome ?? p.paciente_id)
        continue
      }

      const link = `${baseUrl}/pesquisa/${p.token}`
      const mensagem =
        `Oi${nome ? ` ${nome}` : ''}! 😊\n\n` +
        `Queremos muito saber como está sendo sua experiência na D'Clinique. ` +
        `É bem rapidinho — leva menos de 1 minuto:\n\n${link}\n\n` +
        `Sua opinião ajuda a gente a cuidar melhor de você. Obrigado!`

      const res = await whatsapp.send({
        phone: normalizePhone(telefone),
        message: mensagem,
      })

      if (res.success) {
        await supabase
          .from('pesquisas')
          .update({ enviada_em: new Date().toISOString() })
          .eq('id', p.id)
        enviadas++
      } else {
        falhas.push(paciente?.nome ?? p.paciente_id)
      }
    }

    const partes = [`${enviadas} pesquisa(s) enviada(s).`]
    if (semTelefone.length) partes.push(`${semTelefone.length} sem telefone cadastrado.`)
    if (falhas.length) partes.push(`${falhas.length} falharam no envio.`)

    return NextResponse.json({
      success: true,
      enviadas,
      sem_telefone: semTelefone.length,
      falhas: falhas.length,
      message: partes.join(' '),
    })
  } catch (err) {
    console.error('[/api/pesquisa/enviar]', err)
    return NextResponse.json({ error: 'Erro ao enviar pesquisas' }, { status: 500 })
  }
}
