import { createClient } from '@/lib/supabase/server'
import { PatientListClient } from './pacientes-client'
import type { Patient } from '@/types/patient'

export type PlanoStats = {
  previstas: number
  realizadas: number
  pct: number // 0-100 (conclusão do plano)
}

export type PatientWithStats = Patient & {
  stats: PlanoStats
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

  const withStats: PatientWithStats[] = (pacientes ?? []).map((p) => {
    const s = statsByPaciente.get(p.id) ?? { previstas: 0, realizadas: 0 }
    const pct = s.previstas > 0 ? Math.round((s.realizadas / s.previstas) * 100) : 0
    return {
      ...(p as unknown as Patient),
      stats: { previstas: s.previstas, realizadas: s.realizadas, pct },
    }
  })

  return <PatientListClient pacientes={withStats} />
}
