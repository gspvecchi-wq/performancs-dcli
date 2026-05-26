import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PatientProfileClient } from './profile-client'
import type { Patient, ProtocolExecution, ProtocolMoment, Contact, WeightRecord, Alert, RouteCorrection, Agendamento } from '@/types/patient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PatientProfilePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('clinica_id')
    .eq('id', user.id)
    .single()
  if (!usuario) return null

  const [
    { data: paciente },
    { data: agendamentos },
    { data: execucoes },
    { data: momentos },
    { data: contatos },
    { data: pesos },
    { data: alertas },
    { data: correcoes },
  ] = await Promise.all([
    supabase
      .from('pacientes')
      .select('*')
      .eq('id', id)
      .eq('clinica_id', usuario.clinica_id)
      .single(),

    supabase
      .from('agendamentos')
      .select('*')
      .eq('paciente_id', id)
      .eq('clinica_id', usuario.clinica_id)
      .order('data_agendamento', { ascending: true }),

    supabase
      .from('execucoes_protocolo')
      .select('*, momento:protocolo_momentos(label, pergunta, ordem, offset_dias)')
      .eq('paciente_id', id)
      .order('data_prevista', { ascending: true }),

    supabase
      .from('protocolo_momentos')
      .select('*')
      .eq('clinica_id', usuario.clinica_id)
      .eq('ativo', true)
      .order('ordem', { ascending: true }),

    supabase
      .from('contatos')
      .select('*')
      .eq('paciente_id', id)
      .order('criado_em', { ascending: false }),

    supabase
      .from('pesos')
      .select('*')
      .eq('paciente_id', id)
      .order('data_pesagem', { ascending: false }),

    supabase
      .from('alertas')
      .select('*')
      .eq('paciente_id', id)
      .eq('resolvido', false),

    supabase
      .from('correcoes_rota')
      .select('*')
      .eq('paciente_id', id)
      .order('criado_em', { ascending: false }),
  ])

  if (!paciente) notFound()

  return (
    <PatientProfileClient
      paciente={paciente as unknown as Patient}
      agendamentos={(agendamentos ?? []) as unknown as Agendamento[]}
      execucoes={(execucoes ?? []) as unknown as (ProtocolExecution & { momento?: ProtocolMoment | null })[]}
      momentos={(momentos ?? []) as unknown as ProtocolMoment[]}
      contatos={(contatos ?? []) as unknown as Contact[]}
      pesos={(pesos ?? []) as unknown as WeightRecord[]}
      alertas={(alertas ?? []) as unknown as Alert[]}
      correcoes={(correcoes ?? []) as unknown as RouteCorrection[]}
      clinicaId={usuario.clinica_id}
    />
  )
}
