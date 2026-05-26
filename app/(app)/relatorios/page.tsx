import { createClient } from '@/lib/supabase/server'
import { RelatoriosClient } from './relatorios-client'
import type { Patient, Contact, WeightRecord } from '@/types/patient'

export default async function RelatoriosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('clinica_id')
    .eq('id', user.id)
    .single()
  if (!usuario) return null

  const { clinica_id } = usuario
  const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: pacientes },
    { data: contatos },
    { data: pesos },
  ] = await Promise.all([
    supabase
      .from('pacientes')
      .select('*')
      .eq('clinica_id', clinica_id)
      .order('score', { ascending: true }),

    supabase
      .from('contatos')
      .select('*')
      .eq('clinica_id', clinica_id)
      .gte('criado_em', desde)
      .order('criado_em', { ascending: false }),

    supabase
      .from('pesos')
      .select('*')
      .eq('clinica_id', clinica_id)
      .gte('criado_em', desde)
      .order('data_pesagem', { ascending: false }),
  ])

  return (
    <RelatoriosClient
      pacientes={(pacientes ?? []) as unknown as Patient[]}
      contatos={(contatos ?? []) as unknown as Contact[]}
      pesos={(pesos ?? []) as unknown as WeightRecord[]}
    />
  )
}
