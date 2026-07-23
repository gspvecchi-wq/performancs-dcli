import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * POST /api/alertas/resolver
 *
 * "Caixa de decisão": ao fechar um alerta, registra POR QUE aconteceu e O QUE
 * foi feito. No caso da enfermagem (falta), é isso que impede o reagendamento
 * de cair no esquecimento — e forma o histórico de motivos de ausência.
 *
 * Body: { alerta_id, acao, justificativa? }
 */

const ACOES_VALIDAS = ['reagendado', 'contatado', 'desistiu', 'adiado', 'outro'] as const

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = (await req.json()) as {
      alerta_id?: string
      acao?: string
      justificativa?: string
    }

    if (!body.alerta_id) {
      return NextResponse.json({ error: 'Alerta não informado' }, { status: 400 })
    }
    if (!body.acao || !ACOES_VALIDAS.includes(body.acao as typeof ACOES_VALIDAS[number])) {
      return NextResponse.json(
        { error: `Ação inválida. Use: ${ACOES_VALIDAS.join(', ')}` },
        { status: 400 },
      )
    }

    // A RLS já restringe à clínica do usuário
    const { error } = await supabase
      .from('alertas')
      .update({
        resolvido: true,
        resolvido_por: user.id,
        resolvido_em: new Date().toISOString(),
        acao: body.acao,
        justificativa: body.justificativa?.slice(0, 1000) ?? null,
      })
      .eq('id', body.alerta_id)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Alerta resolvido.' })
  } catch (err) {
    console.error('[/api/alertas/resolver]', err)
    return NextResponse.json({ error: 'Erro ao resolver alerta' }, { status: 500 })
  }
}
