// Edge Function: weekly-weight-request
// Cron: toda SEXTA às 10h UTC
// Solicita atualização de peso para pacientes ativos

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TEMPLATES: Record<string, string> = {
  emagrecimento: `Olá, {nome}! 🌟

Sexta-feira, dia de atualizar o peso! ⚖️

Me manda o seu peso de hoje para acompanharmos sua evolução juntos. Cada kg conta na sua jornada!

Qual foi o peso hoje?`,

  massa_muscular: `Boa tarde, {nome}! 💪

Sexta-feira é dia de checar o progresso!

Me manda o seu peso atual para registrarmos sua evolução de ganho de massa. Estamos aqui para acompanhar cada conquista!

Qual está o peso hoje?`,

  saude_geral: `Olá, {nome}! 😊

Que tal uma atualização de fim de semana? ⚖️

Me manda seu peso de hoje para manter nosso acompanhamento em dia. Cada registro nos ajuda a cuidar melhor de você!

Qual é o seu peso hoje?`,
}

Deno.serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: pacientes, error } = await supabase
      .from('pacientes')
      .select('id, nome, telefone, objetivo, clinica_id')
      .eq('status', 'ativo')
      .not('telefone', 'is', null)

    if (error) throw error

    let enviados = 0
    const erros: string[] = []

    for (const paciente of pacientes ?? []) {
      try {
        const { data: clinica } = await supabase
          .from('clinicas')
          .select('whatsapp_config')
          .eq('id', paciente.clinica_id)
          .single()

        if (!clinica?.whatsapp_config) continue

        const config = clinica.whatsapp_config as Record<string, string>
        const template = TEMPLATES[paciente.objetivo] ?? TEMPLATES.saude_geral
        const mensagem = template.replace('{nome}', paciente.nome.split(' ')[0])

        const sent = await enviarMensagem(config, paciente.telefone, mensagem)

        await supabase.from('contatos').insert({
          paciente_id:         paciente.id,
          clinica_id:          paciente.clinica_id,
          tipo:                'automatico',
          canal:               'whatsapp',
          mensagem,
          execucao_id:         null,
          resposta:            null,
          analise_ia:          null,
          status_whatsapp:     sent ? 'enviando' : 'erro',
          whatsapp_message_id: null,
          enviado_por:         null,
        })

        if (sent) enviados++
      } catch (e) {
        erros.push(`${paciente.id}: ${e}`)
      }
    }

    return new Response(JSON.stringify({ ok: true, total: pacientes?.length ?? 0, enviados, erros }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status:  500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

async function enviarMensagem(config: Record<string, string>, telefone: string, mensagem: string): Promise<boolean> {
  const phone = telefone.replace(/\D/g, '')
  if (config.provider === 'zapi') {
    const res = await fetch(`https://api.z-api.io/instances/${config.instanceId}/token/${config.token}/send-text`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Client-Token': config.clientToken },
      body:    JSON.stringify({ phone, message: mensagem }),
    })
    return res.ok
  }
  if (config.provider === 'evolution') {
    const res = await fetch(`${config.apiUrl}/message/sendText/${config.instance}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': config.apiKey },
      body:    JSON.stringify({ number: `${phone}@s.whatsapp.net`, options: { delay: 1200 }, textMessage: { text: mensagem } }),
    })
    return res.ok
  }
  return false
}
