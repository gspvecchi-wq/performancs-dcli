import { createClient } from '@/lib/supabase/server'
import { FilaClient } from './fila-client'
import type { FilaItem, Patient } from '@/types/patient'

export default async function FilaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('clinica_id')
    .eq('id', user.id)
    .single()
  if (!usuario) return null

  const hoje = new Date().toISOString().split('T')[0]

  const { data: fila } = await supabase
    .from('fila_do_dia')
    .select('*, paciente:pacientes(*)')
    .eq('clinica_id', usuario.clinica_id)
    .eq('data_fila', hoje)
    .order('prioridade', { ascending: true })

  type FilaItemWithPaciente = FilaItem & { paciente?: Patient | null }

  return (
    <FilaClient
      fila={(fila ?? []) as unknown as FilaItemWithPaciente[]}
      clinicaId={usuario.clinica_id}
      hoje={hoje}
    />
  )
}
