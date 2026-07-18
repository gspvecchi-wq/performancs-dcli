import { createClient } from '@/lib/supabase/server'
import { PatientListClient } from './pacientes-client'
import type { Patient } from '@/types/patient'

export type AgendamentoStats = {
  agendadas: number
  realizadas: number
  frequencia: number // 0-100
}

export type PatientWithStats = Patient & {
  stats: AgendamentoStats
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

  // Busca pacientes e agendamentos separadamente — o embed do PostgREST
  // (pacientes → agendamentos) falha quando o relacionamento não é detectado,
  // o que zerava a lista mesmo com pacientes no banco.
  const [{ data: pacientes }, { data: todosAgs }] = await Promise.all([
    supabase
      .from('pacientes')
      .select('*')
      .eq('clinica_id', usuario.clinica_id)
      .order('nome', { ascending: true }),
    supabase
      .from('agendamentos')
      .select('paciente_id, status')
      .eq('clinica_id', usuario.clinica_id),
  ])

  // Agrupa os agendamentos por paciente
  const agsByPaciente = new Map<string, string[]>()
  for (const a of (todosAgs ?? []) as { paciente_id: string; status: string }[]) {
    const arr = agsByPaciente.get(a.paciente_id) ?? []
    arr.push(a.status)
    agsByPaciente.set(a.paciente_id, arr)
  }

  const withStats: PatientWithStats[] = (pacientes ?? []).map((p) => {
    const statuses   = agsByPaciente.get(p.id) ?? []
    const realizadas = statuses.filter((s) => s === 'atendido').length
    const agendadas  = statuses.filter((s) => s !== 'a_agendar').length
    const base       = realizadas + statuses.filter((s) => s === 'cancelado').length
    const frequencia = base > 0 ? Math.round((realizadas / base) * 100) : 0
    return {
      ...(p as unknown as Patient),
      stats: { agendadas, realizadas, frequencia },
    }
  })

  return <PatientListClient pacientes={withStats} />
}
