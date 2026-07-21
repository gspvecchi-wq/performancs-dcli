import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/plano/atualizar
 *
 * Atualiza os itens do plano de um paciente direto na ficha:
 *   - procedimentos: nome e frequência (catálogo da clínica)
 *   - plano_itens:   qtd_prevista e qtd_realizada (marca editado_manual)
 *
 * A RLS restringe as atualizações à clínica do usuário autenticado.
 */

interface ItemIn {
  id: string              // plano_itens.id
  procedimento_id: string
  nome: string
  frequencia_dias: number
  qtd_prevista: number
  qtd_realizada: number
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = (await req.json()) as { itens?: ItemIn[] }
    const itens = body.itens ?? []
    if (itens.length === 0) {
      return NextResponse.json({ error: 'Nenhum item enviado' }, { status: 400 })
    }

    let atualizados = 0
    for (const it of itens) {
      // Procedimento (nome/frequência) — best effort (renomear p/ nome existente
      // pode violar a unicidade; nesse caso mantemos o nome e seguimos)
      if (it.procedimento_id) {
        await supabase.from('procedimentos')
          .update({ nome: it.nome, frequencia_dias: it.frequencia_dias })
          .eq('id', it.procedimento_id)
      }
      // Quantidades do item do plano
      const { error } = await supabase.from('plano_itens')
        .update({
          qtd_prevista: Math.max(0, it.qtd_prevista),
          qtd_realizada: Math.max(0, it.qtd_realizada),
          editado_manual: true,
        })
        .eq('id', it.id)
      if (!error) atualizados++
    }

    return NextResponse.json({
      success: true,
      atualizados,
      message: `${atualizados} procedimento(s) atualizado(s).`,
    })
  } catch (err) {
    console.error('[/api/plano/atualizar]', err)
    return NextResponse.json({ error: 'Erro ao atualizar o plano' }, { status: 500 })
  }
}
