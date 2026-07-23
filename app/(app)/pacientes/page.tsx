import { createClient } from '@/lib/supabase/server'
import { PatientListClient } from './pacientes-client'
import type { Patient } from '@/types/patient'

export type PlanoStats = {
  previstas: number
  realizadas: number
  pct: number // 0-100 (conclusão do plano)
}

/**
 * Situação do paciente na carteira — derivada, não é o `status` do banco.
 *
 *   'em_tratamento' → plano em andamento
 *   'concluido'     → todas as sessões previstas foram realizadas
 *   'vencido'       → o plano acabou mas sobraram sessões (pagou e não usou)
 *
 * O caso 'vencido' é o que a clínica mais precisa enxergar: some entre os
 * ativos se ficar em "Em Tratamento", e vira falso sucesso se cair em
 * "Concluídos".
 */
export type SituacaoPlano = 'em_tratamento' | 'concluido' | 'vencido'

export type PatientWithStats = Patient & {
  stats: PlanoStats
  situacao: SituacaoPlano
}

function derivarSituacao(
  stats: PlanoStats,
  planoFim: string | null,
  hojeIso: string,
): SituacaoPlano {
  const temPlano = stats.previstas > 0
  if (temPlano && stats.realizadas >= stats.previstas) return 'concluido'
  if (temPlano && planoFim && planoFim < hojeIso) return 'vencido'
  return 'em_tratamento'
}

export default async function PacientesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('clinica_id')
    .eq('id', user.id)
    .single()
  if (!usuario) return null

  // Busca pacientes e itens do plano separadamente (evita embed frágil do
  // PostgREST). As sessões da lista vêm do plano (plano_itens), não de
  // agendamentos — é onde vive o previsto × realizado do acompanhamento.
  const [{ data: pacientes }, { data: itens }] = await Promise.all([
    supabase
      .from('pacientes')
      .select('*')
      .eq('clinica_id', usuario.clinica_id)
      .order('nome', { ascending: true }),
    // plano_itens não tem clinica_id; a RLS já restringe aos pacientes da clínica
    supabase
      .from('plano_itens')
      .select('paciente_id, qtd_prevista, qtd_realizada'),
  ])

  // Agrega previstas/realizadas por paciente
  const statsByPaciente = new Map<string, { previstas: number; realizadas: number }>()
  for (const it of (itens ?? []) as { paciente_id: string; qtd_prevista: number; qtd_realizada: number }[]) {
    const cur = statsByPaciente.get(it.paciente_id) ?? { previstas: 0, realizadas: 0 }
    cur.previstas += it.qtd_prevista
    cur.realizadas += it.qtd_realizada
    statsByPaciente.set(it.paciente_id, cur)
  }

  const hojeIso = new Date().toISOString().split('T')[0]

  const withStats: PatientWithStats[] = (pacientes ?? []).map((p) => {
    const s = statsByPaciente.get(p.id) ?? { previstas: 0, realizadas: 0 }
    const pct = s.previstas > 0 ? Math.round((s.realizadas / s.previstas) * 100) : 0
    const paciente = p as unknown as Patient
    const stats: PlanoStats = { previstas: s.previstas, realizadas: s.realizadas, pct }
    // O vencimento segue o fim PREVISTO (que acompanha reagendamentos)
    const fim = paciente.plano_fim_previsto ?? paciente.plano_fim
    return {
      ...paciente,
      stats,
      situacao: derivarSituacao(stats, fim, hojeIso),
    }
  })

  return <PatientListClient pacientes={withStats} />
}
