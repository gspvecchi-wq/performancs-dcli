import { createClient } from '@/lib/supabase/server'
import { PatientListClient } from './pacientes-client'
import type { Patient } from '@/types/patient'

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
    .select('*')
    .eq('clinica_id', usuario.clinica_id)
    .order('nome', { ascending: true })

  return <PatientListClient pacientes={(pacientes ?? []) as unknown as Patient[]} />
}
