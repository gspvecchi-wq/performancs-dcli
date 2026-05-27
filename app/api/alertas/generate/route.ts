// POST /api/alertas/generate
// Roda a mesma lógica do cron generate-alerts mas sob demanda (ex: ao abrir dashboard)
// Foco: sessões atrasadas → alerta protocolo_atrasado + entrada na fila_do_dia

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const hoje = new Date().toISOString().split('T')[0]
  const gerados: string[] = []

  // ── Sessões atrasadas ────────────────────────────────────────────────────────
  const { data: sessoesAtrasadas, error } = await supabase
    .from('agendamentos')
    .select('id, paciente_id, clinica_id, label, data_agendamento')
    .eq('status', 'agendado')
    .lt('data_agendamento', hoje)
    .not('data_agendamento', 'is', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  for (const ag of sessoesAtrasadas ?? []) {
    const { data: pac } = await supabase
      .from('pacientes')
      .select('nome, status')
      .eq('id', ag.paciente_id)
      .single()

    if (!pac || pac.status !== 'ativo') continue

    const diasAtraso = Math.floor(
      (Date.now() - new Date(ag.data_agendamento).getTime()) / 86400000
    )
    const dataFormatada = new Date(ag.data_agendamento).toLocaleDateString('pt-BR')
    const primeiroNome = pac.nome.split(' ')[0]

    // Alerta — não duplica se já existe aberto do mesmo tipo+paciente
    const { data: jaExiste } = await supabase
      .from('alertas')
      .select('id')
      .eq('paciente_id', ag.paciente_id)
      .eq('tipo', 'protocolo_atrasado')
      .eq('resolvido', false)
      .limit(1)
      .maybeSingle()

    if (!jaExiste) {
      await supabase.from('alertas').insert({
        clinica_id:    ag.clinica_id,
        paciente_id:   ag.paciente_id,
        tipo:          'protocolo_atrasado',
        severidade:    diasAtraso >= 7 ? 'critico' : 'atencao',
        titulo:        `Sessão atrasada: ${pac.nome} — ${ag.label}`,
        descricao:     `"${ag.label}" estava agendada para ${dataFormatada} e não foi marcada como realizada (${diasAtraso} dia${diasAtraso > 1 ? 's' : ''} de atraso).`,
        resolvido:     false,
        resolvido_por: null,
        resolvido_em:  null,
        metadata:      { agendamento_id: ag.id, dias_atraso: diasAtraso },
      })
    }

    // Fila do dia — UPSERT para não duplicar mesmo paciente no mesmo dia
    await supabase.from('fila_do_dia').upsert(
      {
        clinica_id:        ag.clinica_id,
        paciente_id:       ag.paciente_id,
        data_fila:         hoje,
        prioridade:        diasAtraso >= 7 ? 1 : 2,
        motivo:            `Sessão atrasada ${diasAtraso}d: ${ag.label} (${dataFormatada})`,
        mensagem_sugerida: `Olá ${primeiroNome}! Vi que você tinha "${ag.label}" agendada no dia ${dataFormatada} e não conseguiu comparecer. Como você está? Podemos reagendar sua sessão? 😊`,
        status:            'pendente',
        enviado_em:        null,
        contato_id:        null,
      },
      { onConflict: 'clinica_id,paciente_id,data_fila', ignoreDuplicates: true }
    )

    gerados.push(`${pac.nome}: ${ag.label} (${diasAtraso}d)`)
  }

  return NextResponse.json({ ok: true, gerados: gerados.length, detalhes: gerados })
}
