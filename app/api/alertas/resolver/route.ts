import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * POST /api/alertas/resolver
 *
 * Registra o andamento de um alerta.
 *
 * ENFERMAGEM é binário: a falta foi tratada (reagendou/contatou/…) e o alerta
 * fecha. COMERCIAL é PIPELINE: "em contato" e "apresentou oferta" são etapas
 * intermediárias — o alerta CONTINUA ABERTO mostrando em que pé está, e só
 * fecha quando dá em ganho ou perda.
 *
 * Body: { alerta_id, acao, justificativa?, finalizar? }
 */

// Enfermagem — todas encerram
const ACOES_ENFERMAGEM = ['reagendado', 'contatado', 'adiado', 'desistiu', 'outro']

// Comercial — pipeline; só as finais encerram
const ETAPAS_COMERCIAL_ABERTAS = ['em_contato', 'oferta_apresentada', 'negociando']
const ETAPAS_COMERCIAL_FINAIS  = ['ganho', 'perdido']

const TODAS = [
  ...ACOES_ENFERMAGEM,
  ...ETAPAS_COMERCIAL_ABERTAS,
  ...ETAPAS_COMERCIAL_FINAIS,
]

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = (await req.json()) as {
      alerta_id?: string
      acao?: string
      justificativa?: string
      finalizar?: boolean
    }

    if (!body.alerta_id) {
      return NextResponse.json({ error: 'Alerta não informado' }, { status: 400 })
    }
    if (!body.acao || !TODAS.includes(body.acao)) {
      return NextResponse.json({ error: 'Ação/etapa inválida' }, { status: 400 })
    }

    // Encerra quando: pedido explicitamente, é ação de enfermagem, ou é etapa
    // final do pipeline comercial. Etapa intermediária mantém aberto.
    const encerra =
      body.finalizar === true ||
      ACOES_ENFERMAGEM.includes(body.acao) ||
      ETAPAS_COMERCIAL_FINAIS.includes(body.acao)

    const patch: {
      acao: string
      justificativa: string | null
      resolvido?: boolean
      resolvido_por?: string
      resolvido_em?: string
    } = {
      acao: body.acao,
      justificativa: body.justificativa?.slice(0, 1000) ?? null,
    }
    if (encerra) {
      patch.resolvido = true
      patch.resolvido_por = user.id
      patch.resolvido_em = new Date().toISOString()
    }

    // A RLS já restringe à clínica do usuário
    const { error } = await supabase.from('alertas').update(patch).eq('id', body.alerta_id)
    if (error) throw error

    return NextResponse.json({
      success: true,
      encerrado: encerra,
      message: encerra ? 'Alerta encerrado.' : 'Etapa registrada — segue em aberto.',
    })
  } catch (err) {
    console.error('[/api/alertas/resolver]', err)
    const detalhe = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Erro ao registrar: ${detalhe}` }, { status: 500 })
  }
}
