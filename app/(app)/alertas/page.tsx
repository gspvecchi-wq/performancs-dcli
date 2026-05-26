import { createClient } from '@/lib/supabase/server'
import { AlertasClient } from './alertas-client'
import type { Alert } from '@/types/patient'

export default async function AlertasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('clinica_id')
    .eq('id', user.id)
    .single()
  if (!usuario) return null

  const { data: alertas } = await supabase
    .from('alertas')
    .select('*, paciente:pacientes(id,nome,nivel,score,especialidade)')
    .eq('clinica_id', usuario.clinica_id)
    .order('resolvido', { ascending: true })
    .order('criado_em', { ascending: false })

  return <AlertasClient alertas={(alertas ?? []) as unknown as Alert[]} />
}
