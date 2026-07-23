import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { classificarNps } from '@/lib/nps/nps'

export const runtime = 'nodejs'

/**
 * Pesquisa pública (NPS) — o paciente responde por link, sem login.
 *
 * A legitimidade vem do TOKEN opaco na URL, por isso usamos service role
 * (a RLS é para o acesso interno da clínica). Devolvemos apenas o mínimo
 * necessário para renderizar a pesquisa — nada de dados clínicos.
 */

interface Ctx { params: Promise<{ token: string }> }

// GET — carrega a pesquisa para exibir
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { token } = await params
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('pesquisas')
      .select('id, pergunta, nota, respondida_em, expira_em, paciente:pacientes(nome)')
      .eq('token', token)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Pesquisa não encontrada' }, { status: 404 })
    }
    if (data.expira_em && new Date(data.expira_em) < new Date()) {
      return NextResponse.json({ error: 'Esta pesquisa expirou' }, { status: 410 })
    }

    const paciente = data.paciente as unknown as { nome?: string } | null
    // Só o primeiro nome — não expor o nome completo numa página pública
    const primeiroNome = paciente?.nome?.trim().split(/\s+/)[0] ?? null

    return NextResponse.json({
      pergunta: data.pergunta,
      primeiro_nome: primeiroNome,
      ja_respondida: !!data.respondida_em,
      nota: data.nota,
    })
  } catch (err) {
    console.error('[GET /api/pesquisa]', err)
    return NextResponse.json({ error: 'Erro ao carregar a pesquisa' }, { status: 500 })
  }
}

// POST — registra a resposta
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { token } = await params
    const body = (await req.json()) as { nota?: number; comentario?: string }

    const nota = Number(body.nota)
    if (!Number.isInteger(nota) || nota < 0 || nota > 10) {
      return NextResponse.json({ error: 'Informe uma nota de 0 a 10' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: pesquisa, error: findErr } = await supabase
      .from('pesquisas')
      .select('id, paciente_id, respondida_em, expira_em')
      .eq('token', token)
      .single()

    if (findErr || !pesquisa) {
      return NextResponse.json({ error: 'Pesquisa não encontrada' }, { status: 404 })
    }
    if (pesquisa.respondida_em) {
      return NextResponse.json({ error: 'Esta pesquisa já foi respondida' }, { status: 409 })
    }
    if (pesquisa.expira_em && new Date(pesquisa.expira_em) < new Date()) {
      return NextResponse.json({ error: 'Esta pesquisa expirou' }, { status: 410 })
    }

    const agora = new Date().toISOString()

    const { error: updErr } = await supabase
      .from('pesquisas')
      .update({
        nota,
        comentario: body.comentario?.slice(0, 2000) ?? null,
        respondida_em: agora,
      })
      .eq('id', pesquisa.id)

    if (updErr) throw updErr

    // Materializa a última nota no paciente (usada pelo engajamento e pelo mapa)
    await supabase
      .from('pacientes')
      .update({ nps_nota: nota, nps_respondido_em: agora.split('T')[0] })
      .eq('id', pesquisa.paciente_id)

    return NextResponse.json({ success: true, classe: classificarNps(nota) })
  } catch (err) {
    console.error('[POST /api/pesquisa]', err)
    return NextResponse.json({ error: 'Erro ao registrar a resposta' }, { status: 500 })
  }
}
