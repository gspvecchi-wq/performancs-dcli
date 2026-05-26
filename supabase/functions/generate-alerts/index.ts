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
    metadata:     null,
  })
}
