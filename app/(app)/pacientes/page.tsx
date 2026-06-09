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

  const { data: pacientes } = await supabase
    .from('pacientes')
    .select('*, agendamentos(status)')
    .eq('clinica_id', usuario.clinica_id)
    .order('nome', { ascending: true })

  const withStats: PatientWithStats[] = (pacientes ?? []).map((p) => {
    const ags = (p.agendamentos ?? []) as { status: string }[]
    const realizadas = ags.filter((a) => a.status === 'atendido').length
    const agendadas  = ags.filter((a) => a.status !== 'a_agendar').length
    const base       = realizadas + ags.filter((a) => a.status === 'cancelado').length
    const frequencia = base > 0 ? Math.round((realizadas / base) * 100) : 0
    return {
      ...(p as unknown as Patient),
      stats: { agendadas, realizadas, frequencia },
    }
  })

  return <PatientListClient pacientes={withStats} />
}
