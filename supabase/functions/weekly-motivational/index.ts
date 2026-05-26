// Edge Function: weekly-motivational
// Cron: toda TERÇA às 9h UTC
// Envia mensagem de incentivo para todos os pacientes ativos

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TEMPLATES_POR_OBJETIVO: Record<string, string> = {
  emagrecimento: `Olá, {nome}! 👋

Passando para lembrar que você não está sozinha(o) nessa jornada. Cada escolha saudável conta — mesmo nos dias difíceis.

Você está mais perto do seu objetivo do que imagina! 💪

Qualquer dúvida, estamos aqui. Conte comigo!`,

  massa_muscular: `Olá, {nome}! 👋

Mais uma semana de progresso! Seu corpo está respondendo ao seu esforço — continue consistente.

A consistência é o que transforma esforço em resultado. Continue assim! 🏋️

Qualquer dúvida, pode me chamar!`,

  saude_geral: `Olá, {nome}! 👋

Como você está se sentindo essa semana? Espero que bem! 😊

Lembre-se: cuidar da saúde é um investimento contínuo. Cada hábito positivo conta muito.

Estamos aqui sempre que precisar!`,
}

Deno.serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Busca todos os pacientes ativos de todas as clínicas
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
        // Busca config de WhatsApp da clínica
        const { data: clinica } = await supabase
          .from('clinicas')
          .select('whatsapp_config')
          .eq('id', paciente.clinica_id)
          .single()

        if (!clinica?.whatsapp_config) continue

        const config = clinica.whatsapp_config as {
          provider: 'zapi' | 'evolution'
          instanceId?: string
          token?: string
          clientToken?: string
          apiUrl?: string
          apiKey?: string
          instance?: string
        }

        // Monta mensagem personalizada
        const template = TEMPLATES_POR_OBJETIVO[paciente.objetivo] ?? TEMPLATES_POR_OBJETIVO.saude_geral
        const mensagem = template.replace('{nome}', paciente.nome.split(' ')[0])

        // Envia via provider da clínica
        const sent = await enviarMensagem(config, paciente.telefone, mensagem)

        // Salva em contatos
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

    return new Response(JSON.stringify({
      ok:      true,
      total:   pacientes?.length ?? 0,
      enviados,
      erros: erros.length > 0 ? erros : undefined,
    }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('[weekly-motivational]', err)
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

async function enviarMensagem(
  config: Record<string, string>,
  telefone: string,
  mensagem: string,
): Promise<boolean> {
  const phone = telefone.replace(/\D/g, '')

  if (config.provider === 'zapi') {
    const baseUrl = `https://api.z-api.io/instances/${config.instanceId}/token/${config.token}`
    const res = await fetch(`${baseUrl}/send-text`, {
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
      body:    JSON.stringify({
        number: `${phone}@s.whatsapp.net`,
        options: { delay: 1200 },
        textMessage: { text: mensagem },
      }),
    })
    return res.ok
  }

  return false
}
