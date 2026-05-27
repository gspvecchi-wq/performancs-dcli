// Edge Function: generate-alerts
// Cron: diariamente às 6h UTC
// Gera alertas automáticos para pacientes que precisam de atenção

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const hoje = new Date()
  const alertasGerados: string[] = []
  const erros: string[] = []

  try {
    // 1. Plano vencendo em <= 30 dias
    const em30dias = new Date(hoje)
    em30dias.setDate(em30dias.getDate() + 30)

    const { data: vencendo } = await supabase
      .from('pacientes')
      .select('id, nome, clinica_id, plano_fim')
      .eq('status', 'ativo')
      .lte('plano_fim', em30dias.toISOString().split('T')[0])
      .gte('plano_fim', hoje.toISOString().split('T')[0])

    for (const p of vencendo ?? []) {
      const diasRestantes = Math.floor((new Date(p.plano_fim).getTime() - hoje.getTime()) / 86400000)
      await upsertAlerta(supabase, {
        clinica_id:   p.clinica_id,
        paciente_id:  p.id,
        tipo:         'plano_vencendo',
        severidade:   diasRestantes <= 7 ? 'critico' : 'atencao',
        titulo:       `Plano de ${p.nome} vence em ${diasRestantes} dias`,
        descricao:    `O plano do paciente vence em ${new Date(p.plano_fim).toLocaleDateString('pt-BR')}. Entre em contato para renovação.`,
      })
      alertasGerados.push(`plano_vencendo:${p.id}`)
    }

    // 2. Sem contato nos últimos 14 dias
    const ha14dias = new Date(hoje)
    ha14dias.setDate(ha14dias.getDate() - 14)

    const { data: semContato } = await supabase
      .from('pacientes')
      .select('id, nome, clinica_id')
      .eq('status', 'ativo')

    for (const p of semContato ?? []) {
      const { data: ultimoContato } = await supabase
        .from('contatos')
        .select('criado_em')
        .eq('paciente_id', p.id)
        .order('criado_em', { ascending: false })
        .limit(1)
        .single()

      const semContatoRecente = !ultimoContato ||
        new Date(ultimoContato.criado_em) < ha14dias

      if (semContatoRecente) {
        await upsertAlerta(supabase, {
          clinica_id:  p.clinica_id,
          paciente_id: p.id,
          tipo:        'sem_contato',
          severidade:  'atencao',
          titulo:      `Sem contato com ${p.nome} há mais de 14 dias`,
          descricao:   'O paciente não foi contactado recentemente. Considere enviar uma mensagem de engajamento.',
        })
        alertasGerados.push(`sem_contato:${p.id}`)
      }
    }

    // 3. Score baixo (< 30) — risco de evasão
    const { data: riscoEvasao } = await supabase
      .from('pacientes')
      .select('id, nome, clinica_id, score')
      .eq('status', 'ativo')
      .lt('score', 30)

    for (const p of riscoEvasao ?? []) {
      await upsertAlerta(supabase, {
        clinica_id:  p.clinica_id,
        paciente_id: p.id,
        tipo:        'risco_evasao',
        severidade:  'critico',
        titulo:      `${p.nome} com score crítico (${p.score}/100)`,
        descricao:   'Score abaixo de 30. Alto risco de abandono do plano de acompanhamento. Intervenção urgente recomendada.',
      })
      alertasGerados.push(`risco_evasao:${p.id}`)
    }

    // 4. Peso fora da meta — sem registro de peso nas últimas 2 semanas
    const ha14diasStr = ha14dias.toISOString().split('T')[0]

    const { data: semPeso } = await supabase
      .from('pacientes')
      .select('id, nome, clinica_id')
      .eq('status', 'ativo')
      .not('meta_kg', 'is', null)

    for (const p of semPeso ?? []) {
      const { data: ultimoPeso } = await supabase
        .from('pesos')
        .select('data_pesagem')
        .eq('paciente_id', p.id)
        .order('data_pesagem', { ascending: false })
        .limit(1)
        .single()

      const semRegistro = !ultimoPeso || ultimoPeso.data_pesagem < ha14diasStr

      if (semRegistro) {
        await upsertAlerta(supabase, {
          clinica_id:  p.clinica_id,
          paciente_id: p.id,
          tipo:        'peso_fora_meta',
          severidade:  'atencao',
          titulo:      `${p.nome} sem registro de peso há 2+ semanas`,
          descricao:   'Nenhuma pesagem registrada nas últimas 2 semanas. Solicite atualização.',
        })
        alertasGerados.push(`peso_fora_meta:${p.id}`)
      }
    }

    // 5. Renovação — plano vencendo em <= 45 dias + score >= 40 (vale renovar)
    const em45dias = new Date(hoje)
    em45dias.setDate(em45dias.getDate() + 45)

    const { data: candidatosRenovacao } = await supabase
      .from('pacientes')
      .select('id, nome, clinica_id, plano_fim, score, objetivo')
      .eq('status', 'ativo')
      .lte('plano_fim', em45dias.toISOString().split('T')[0])
      .gte('plano_fim', hoje.toISOString().split('T')[0])
      .gte('score', 40)

    for (const p of candidatosRenovacao ?? []) {
      const diasRestantes = Math.floor((new Date(p.plano_fim).getTime() - hoje.getTime()) / 86400000)
      const objetivoLabel = p.objetivo === 'emagrecimento' ? 'emagrecimento'
        : p.objetivo === 'massa_muscular' ? 'ganho de massa'
        : 'saúde geral'

      await upsertAlerta(supabase, {
        clinica_id:  p.clinica_id,
        paciente_id: p.id,
        tipo:        'renovacao',
        severidade:  'atencao',
        titulo:      `Hora de renovar o plano de ${p.nome} (${diasRestantes} dias restantes)`,
        descricao:   `Score ${p.score}/100 — bom engajamento. Sugestão de mensagem:\n\n"Olá ${p.nome.split(' ')[0]}! Seu acompanhamento de ${objetivoLabel} está chegando ao fim e você teve uma evolução incrível! Quero conversar sobre a continuidade do seu tratamento para mantermos os resultados. Podemos agendar uma conversa?"`,
      })
      alertasGerados.push(`renovacao:${p.id}`)
    }

    // 6. Upsell — plano vencendo em <= 60 dias + score >= 65 + boa evolução de peso
    const em60dias = new Date(hoje)
    em60dias.setDate(em60dias.getDate() + 60)

    const { data: candidatosUpsell } = await supabase
      .from('pacientes')
      .select('id, nome, clinica_id, plano_fim, score, objetivo, peso_inicial, peso_atual, meta_kg')
      .eq('status', 'ativo')
      .lte('plano_fim', em60dias.toISOString().split('T')[0])
      .gte('plano_fim', hoje.toISOString().split('T')[0])
      .gte('score', 65)

    for (const p of candidatosUpsell ?? []) {
      const diasRestantes = Math.floor((new Date(p.plano_fim).getTime() - hoje.getTime()) / 86400000)

      // Só upsell se ainda não tem alerta de renovação aberto para não duplicar
      const { data: jaTemRenovacao } = await supabase
        .from('alertas')
        .select('id')
        .eq('paciente_id', p.id)
        .eq('tipo', 'renovacao')
        .eq('resolvido', false)
        .limit(1)
        .single()

      if (jaTemRenovacao) continue

      // Verifica evolução de peso — se tem progresso real, é candidato a upsell
      const temProgressoPeso = p.peso_inicial && p.peso_atual && p.meta_kg
        && Math.abs(p.peso_inicial - p.peso_atual) >= Math.abs(p.meta_kg) * 0.3

      await upsertAlerta(supabase, {
        clinica_id:  p.clinica_id,
        paciente_id: p.id,
        tipo:        'upsell',
        severidade:  'info',
        titulo:      `${p.nome} é candidato a upgrade de protocolo`,
        descricao:   `Score ${p.score}/100 — alto engajamento${temProgressoPeso ? ' + boa evolução de peso' : ''}. Plano encerra em ${diasRestantes} dias.\n\nSugestão de mensagem:\n\n"Olá ${p.nome.split(' ')[0]}! Você está indo muito bem! Com sua dedicação, quero apresentar um protocolo mais completo para acelerar ainda mais seus resultados. Posso te explicar como funciona?"`,
      })
      alertasGerados.push(`upsell:${p.id}`)
    }

    // 7. Protocolo atrasado — sessão agendada mas data já passou sem ser marcada
    const { data: sessoesAtrasadas } = await supabase
      .from('agendamentos')
      .select('id, paciente_id, clinica_id, label, data_agendamento, hora')
      .eq('status', 'agendado')
      .lt('data_agendamento', hoje.toISOString().split('T')[0])
      .not('data_agendamento', 'is', null)

    for (const ag of sessoesAtrasadas ?? []) {
      const { data: pac } = await supabase
        .from('pacientes')
        .select('nome, status')
        .eq('id', ag.paciente_id)
        .single()

      if (!pac || pac.status !== 'ativo') continue

      const diasAtraso = Math.floor(
        (hoje.getTime() - new Date(ag.data_agendamento).getTime()) / 86400000
      )
      const dataFormatada = new Date(ag.data_agendamento).toLocaleDateString('pt-BR')
      const primeiroNome = pac.nome.split(' ')[0]

      // Cria alerta (upsert — não duplica se já existe aberto)
      await upsertAlerta(supabase, {
        clinica_id:  ag.clinica_id,
        paciente_id: ag.paciente_id,
        tipo:        'protocolo_atrasado',
        severidade:  diasAtraso >= 7 ? 'critico' : 'atencao',
        titulo:      `Sessão atrasada: ${pac.nome} — ${ag.label}`,
        descricao:   `"${ag.label}" estava agendada para ${dataFormatada} e não foi marcada como realizada (${diasAtraso} dia${diasAtraso > 1 ? 's' : ''} de atraso). Acionar para reagendamento.`,
        metadata:    { agendamento_id: ag.id, dias_atraso: diasAtraso },
      })

      // Insere na fila do dia para acionamento (UPSERT — não duplica)
      const mensagemSugerida =
        `Olá ${primeiroNome}! Vi que você tinha "${ag.label}" agendada no dia ${dataFormatada} e não conseguiu comparecer. Como você está? Podemos reagendar sua sessão? 😊`

      await supabase.from('fila_do_dia').upsert({
        clinica_id:        ag.clinica_id,
        paciente_id:       ag.paciente_id,
        data_fila:         hoje.toISOString().split('T')[0],
        prioridade:        diasAtraso >= 7 ? 1 : 2,
        motivo:            `Sessão atrasada ${diasAtraso}d: ${ag.label} (${dataFormatada})`,
        mensagem_sugerida: mensagemSugerida,
        status:            'pendente',
      }, { onConflict: 'clinica_id,paciente_id,data_fila', ignoreDuplicates: true })

      alertasGerados.push(`protocolo_atrasado:${ag.paciente_id}`)
    }

    // 8. Confirmação de agendamento (D-1)
    const amanha = new Date(hoje)
    amanha.setDate(amanha.getDate() + 1)
    const amanhaStr = amanha.toISOString().split('T')[0]

    const { data: agendamentosAmanha } = await supabase
      .from('agendamentos')
      .select('id, paciente_id, clinica_id, label, hora')
      .eq('data_agendamento', amanhaStr)
      .eq('status', 'agendado')
      .eq('alerta_d1_enviado', false)

    for (const ag of agendamentosAmanha ?? []) {
      // Busca nome do paciente
      const { data: pac } = await supabase
        .from('pacientes')
        .select('nome')
        .eq('id', ag.paciente_id)
        .single()

      const nomePaciente = pac?.nome ?? 'Paciente'
      const horaStr = ag.hora ? ` às ${String(ag.hora).substring(0, 5)}` : ''

      await supabase.from('alertas').insert({
        clinica_id:    ag.clinica_id,
        paciente_id:   ag.paciente_id,
        tipo:          'confirmacao_agendamento',
        severidade:    'atencao',
        titulo:        `Confirmar agendamento de ${nomePaciente} amanhã`,
        descricao:     `${ag.label}${horaStr}. Envie confirmação pelo WhatsApp.`,
        resolvido:     false,
        resolvido_por: null,
        resolvido_em:  null,
        metadata:      { agendamento_id: ag.id },
      })

      // Marca que o alerta D-1 foi disparado para não repetir
      await supabase
        .from('agendamentos')
        .update({ alerta_d1_enviado: true })
        .eq('id', ag.id)

      alertasGerados.push(`confirmacao_agendamento:${ag.paciente_id}`)
    }

    return new Response(JSON.stringify({
      ok:      true,
      gerados: alertasGerados.length,
      detalhes: alertasGerados,
    }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('[generate-alerts]', err)
    return new Response(JSON.stringify({ ok: false, error: String(err), erros }), {
      status:  500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

async function upsertAlerta(
  supabase: ReturnType<typeof createClient>,
  data: {
    clinica_id:  string
    paciente_id: string
    tipo:        string
    severidade:  string
    titulo:      string
    descricao?:  string
    metadata?:   Record<string, unknown>
  },
) {
  // Verifica se já existe alerta aberto do mesmo tipo para o mesmo paciente
  const { data: existing } = await supabase
    .from('alertas')
    .select('id')
    .eq('paciente_id', data.paciente_id)
    .eq('tipo', data.tipo)
    .eq('resolvido', false)
    .limit(1)
    .single()

  if (existing) return // Já existe alerta aberto, não duplicar

  await supabase.from('alertas').insert({
    clinica_id:   data.clinica_id,
    paciente_id:  data.paciente_id,
    tipo:         data.tipo,
    severidade:   data.severidade,
    titulo:       data.titulo,
    descricao:    data.descricao ?? null,
    resolvido:    false,
    resolvido_por: null,
    resolvido_em: null,
    metadata:     data.metadata ?? null,
  })
}
