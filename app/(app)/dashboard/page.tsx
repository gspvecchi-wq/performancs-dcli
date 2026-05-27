import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './dashboard-client'
import type { Patient, Alert } from '@/types/patient'

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

  // Top 5 mais engajados
  const { data: top5Engajados } = await supabase
    .from('pacientes')
    .select('*')
    .eq('clinica_id', clinicaId)
    .eq('status', 'ativo')
    .order('score', { ascending: false })
    .limit(5)

  // Pacientes em risco para o drawer e ranking "Precisam de Atenção"
  const { data: emRisco } = await supabase
    .from('pacientes')
    .select('*')
    .eq('clinica_id', clinicaId)
    .eq('status', 'ativo')
    .lt('score', 50)
    .order('score', { ascending: true })

  // Alertas recentes (últimos 5)
  const { data: alertas } = await supabase
    .from('alertas')
    .select('*, paciente:pacientes(id,nome,nivel,score,especialidade)')
    .eq('clinica_id', clinicaId)
    .eq('resolvido', false)
    .order('criado_em', { ascending: false })
    .limit(5)

  return (
    <DashboardClient
      stats={stats}
      top5Engajados={(top5Engajados ?? []) as unknown as Patient[]}
      emRisco={(emRisco ?? []) as unknown as Patient[]}
      alertas={(alertas ?? []) as unknown as Alert[]}
    />
  )
}
