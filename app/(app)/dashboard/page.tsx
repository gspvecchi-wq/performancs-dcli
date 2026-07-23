import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './dashboard-client'
import type { Patient } from '@/types/patient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('clinica_id')
    .eq('id', user.id)
    .single()

  if (!usuario) return null

  const clinicaId = usuario.clinica_id

  // Stats via função PostgreSQL
  const { data: statsArr } = await supabase.rpc('get_dashboard_stats', {
    p_clinica_id: clinicaId,
  })
  const stats = statsArr?.[0] ?? {
    total_ativos: 0, em_risco: 0, bom: 0, excelente: 0,
    acionamentos_hoje: 0, alertas_abertos: 0,
  }

  // Carteira ativa — alimenta o Mapa de Decisão (engajamento × satisfação)
  // e o drawer de pacientes em risco
  const { data: ativos } = await supabase
    .from('pacientes')
    .select('*')
    .eq('clinica_id', clinicaId)
    .eq('status', 'ativo')
    .order('score', { ascending: true })

  const pacientes = (ativos ?? []) as unknown as Patient[]
  const emRisco = pacientes.filter((p) => (p.score ?? 0) < 50)

  return (
    <DashboardClient
      stats={stats}
      pacientes={pacientes}
      emRisco={emRisco}
    />
  )
}
