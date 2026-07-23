import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calcEngajamento, calcComparecimento } from '@/lib/scoring/engajamento'
import { calcWeightProgress } from '@/lib/weight/weightStats'
import type { WeightRecord } from '@/types/patient'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * POST /api/scores/recalcular
 *
 * Recalcula o engajamento (comparecimento 40% + meta de peso 30% + NPS 30%) de
 * toda a carteira e PERSISTE em `pacientes.score`/`nivel`.
 *
 * Persistir é necessário porque dashboard, filtros e a lista leem a coluna do
 * banco — calcular só na tela deixaria as duas visões divergentes.
 *
 * Busca tudo em 3 queries e agrupa em memória (evita N+1).
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

    const [{ data: pacientes }, { data: agendamentos }, { data: pesos }] = await Promise.all([
      supabase
        .from('pacientes')
        .select('id, objetivo, peso_inicial, meta_kg, nps_nota')
        .eq('clinica_id', clinicaId),
      supabase
        .from('agendamentos')
        .select('paciente_id, data_agendamento, status')
        .eq('clinica_id', clinicaId),
      supabase
        .from('pesos')
        .select('id, paciente_id, peso_kg, data_pesagem, data_real_conhecida, clinica_id, observacao, registrado_por, criado_em')
        .eq('clinica_id', clinicaId),
    ])

    // Agrupa por paciente
    const agsPor = new Map<string, { data_agendamento: string | null; status: string }[]>()
    for (const a of (agendamentos ?? []) as { paciente_id: string; data_agendamento: string | null; status: string }[]) {
      const arr = agsPor.get(a.paciente_id) ?? []
      arr.push({ data_agendamento: a.data_agendamento, status: a.status })
      agsPor.set(a.paciente_id, arr)
    }

    const pesosPor = new Map<string, WeightRecord[]>()
    for (const p of (pesos ?? []) as unknown as WeightRecord[]) {
      const arr = pesosPor.get(p.paciente_id) ?? []
      arr.push(p)
      pesosPor.set(p.paciente_id, arr)
    }

    const hoje = new Date().toISOString().split('T')[0]
    let atualizados = 0
    let semDados = 0

    for (const p of pacientes ?? []) {
      const ags = agsPor.get(p.id) ?? []
      const comp = calcComparecimento(ags, hoje)

      // Progresso da meta (respeita emagrecimento ↓ / hipertrofia ↑)
      let progressoMeta: number | null = null
      const meusPesos = pesosPor.get(p.id) ?? []
      if (p.peso_inicial != null && p.meta_kg != null && meusPesos.length > 0) {
        const prog = calcWeightProgress(
          meusPesos,
          p.meta_kg,
          (p.objetivo ?? 'saude_geral') as 'emagrecimento' | 'massa_muscular' | 'saude_geral',
          p.peso_inicial,
        )
        progressoMeta = prog?.percentualMeta ?? null
      }

      const resultado = calcEngajamento({
        sessoesAtendidas: comp.atendidas,
        sessoesCobradas:  comp.cobradas,
        progressoMetaPct: progressoMeta,
        npsNota:          p.nps_nota ?? null,
      })

      if (resultado.total == null) { semDados++; continue }

      const { error } = await supabase
        .from('pacientes')
        .update({ score: resultado.total, nivel: resultado.nivel })
        .eq('id', p.id)
      if (!error) atualizados++
    }

    return NextResponse.json({
      success: true,
      atualizados,
      sem_dados: semDados,
      message:
        `Engajamento recalculado em ${atualizados} paciente(s).` +
        (semDados > 0 ? ` ${semDados} ainda sem dados suficientes.` : ''),
    })
  } catch (err) {
    console.error('[/api/scores/recalcular]', err)
    return NextResponse.json({ error: 'Erro ao recalcular engajamento' }, { status: 500 })
  }
}
