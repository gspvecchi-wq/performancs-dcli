import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PERGUNTA_NPS, DIAS_ANTES_DO_FIM } from '@/lib/nps/nps'
import { gerarToken } from '@/lib/nps/token'

export const runtime = 'nodejs'

/**
 * POST /api/pesquisa/gerar
 *
 * Varre a carteira e cria as pesquisas PENDENTES (ainda não enviadas) para os
 * dois gatilhos combinados:
 *
 *  • inicio_plano — logo que o plano fecha (referência: plano_inicio)
 *  • fim_45d      — 45 dias antes do fim PREVISTO (que acompanha reagendamentos,
 *                   por isso é ele e não o fim contratado)
 *
 * Idempotente: o índice único (paciente_id, gatilho) impede duplicar. Rodar de
 * novo após uma importação só cria o que faltava.
 */
export async function POST(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: usuario } = await supabase
      .from('usuarios').select('clinica_id').eq('id', user.id).single()
    if (!usuario) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 403 })
    const clinicaId = usuario.clinica_id

    const { data: pacientes } = await supabase
      .from('pacientes')
      .select('id, nome, plano_inicio, plano_fim, plano_fim_previsto, status')
      .eq('clinica_id', clinicaId)
      .eq('status', 'ativo')

    // Pesquisas automáticas que já existem (para não recriar)
    const { data: existentes } = await supabase
      .from('pesquisas')
      .select('paciente_id, gatilho')
      .eq('clinica_id', clinicaId)
      .neq('gatilho', 'manual')

    const jaTem = new Set(
      (existentes ?? []).map((p) => `${p.paciente_id}|${p.gatilho}`),
    )

    const hoje = new Date()
    const hojeMs = hoje.getTime()
    const novas: {
      clinica_id: string
      paciente_id: string
      token: string
      pergunta: string
      gatilho: string
    }[] = []

    for (const p of pacientes ?? []) {
      // ── Gatilho 1: início do plano ──
      // O plano já começou (não dispara para plano futuro).
      if (!jaTem.has(`${p.id}|inicio_plano`) && p.plano_inicio) {
        if (new Date(`${p.plano_inicio}T00:00:00Z`).getTime() <= hojeMs) {
          novas.push({
            clinica_id: clinicaId,
            paciente_id: p.id,
            token: gerarToken(),
            pergunta: PERGUNTA_NPS,
            gatilho: 'inicio_plano',
          })
        }
      }

      // ── Gatilho 2: 45 dias antes do fim previsto ──
      const fim = p.plano_fim_previsto ?? p.plano_fim
      if (!jaTem.has(`${p.id}|fim_45d`) && fim) {
        const diasAteFim = Math.round(
          (new Date(`${fim}T00:00:00Z`).getTime() - hojeMs) / 86_400_000,
        )
        // Entrou na janela (inclusive já passou do fim — ainda vale perguntar)
        if (diasAteFim <= DIAS_ANTES_DO_FIM) {
          novas.push({
            clinica_id: clinicaId,
            paciente_id: p.id,
            token: gerarToken(),
            pergunta: PERGUNTA_NPS,
            gatilho: 'fim_45d',
          })
        }
      }
    }

    if (novas.length === 0) {
      return NextResponse.json({
        success: true, criadas: 0,
        message: 'Nenhuma pesquisa nova a criar.',
      })
    }

    // ignoreDuplicates: corrida com outra execução não quebra
    const { data: inseridas, error } = await supabase
      .from('pesquisas')
      .upsert(novas, { onConflict: 'paciente_id,gatilho', ignoreDuplicates: true })
      .select('id')

    if (error) throw error

    const criadas = inseridas?.length ?? 0
    return NextResponse.json({
      success: true,
      criadas,
      message: `${criadas} pesquisa(s) criada(s) e prontas para envio.`,
    })
  } catch (err) {
    console.error('[/api/pesquisa/gerar]', err)
    return NextResponse.json({ error: 'Erro ao gerar pesquisas' }, { status: 500 })
  }
}
