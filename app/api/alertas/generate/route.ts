// POST /api/alertas/generate
//
// Gera os alertas das duas áreas. Roda sob demanda (após a importação dos
// relatórios — o ritual manual da clínica), não por cron.
//
//   ENFERMAGEM → sessão perdida: estava agendada, a data passou e não foi
//                marcada como realizada. Precisa reagendar antes que caia no
//                esquecimento (hoje quem lembra é o paciente, e já tarde).
//
//   COMERCIAL  → NPS detrator, plano perto do fim com sessões pendentes e
//                engajamento baixo (risco de evasão).
//
// Idempotente: não recria alerta aberto do mesmo tipo para o mesmo paciente.

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { DIAS_ANTES_DO_FIM } from '@/lib/nps/nps'
import type { Json } from '@/lib/supabase/types'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: usuario } = await supabase
      .from('usuarios').select('clinica_id').eq('id', user.id).single()
    if (!usuario) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 403 })
    const clinicaId = usuario.clinica_id

    const hoje = new Date().toISOString().split('T')[0]
    const hojeMs = Date.now()

    // Pacientes ativos (uma query) — evita buscar um a um
    const { data: pacientes } = await supabase
      .from('pacientes')
      .select('id, nome, status, score, nps_nota, plano_fim, plano_fim_previsto')
      .eq('clinica_id', clinicaId)
      .eq('status', 'ativo')

    const pacPorId = new Map((pacientes ?? []).map((p) => [p.id, p]))

    // Alertas abertos (para não duplicar)
    const { data: abertos } = await supabase
      .from('alertas')
      .select('paciente_id, tipo')
      .eq('clinica_id', clinicaId)
      .eq('resolvido', false)

    const jaAberto = new Set(
      (abertos ?? []).map((a) => `${a.paciente_id}|${a.tipo}`),
    )

    type NovoAlerta = {
      clinica_id: string
      paciente_id: string
      tipo: string
      area: string
      severidade: string
      titulo: string
      descricao: string
      resolvido: boolean
      resolvido_por: null
      resolvido_em: null
      metadata: Json
    }
    const novos: NovoAlerta[] = []

    // ── ENFERMAGEM: sessões perdidas ────────────────────────────────────────
    const { data: perdidas } = await supabase
      .from('agendamentos')
      .select('id, paciente_id, label, data_agendamento')
      .eq('clinica_id', clinicaId)
      .eq('status', 'agendado')
      .lt('data_agendamento', hoje)
      .not('data_agendamento', 'is', null)

    for (const ag of perdidas ?? []) {
      const pac = pacPorId.get(ag.paciente_id)
      if (!pac) continue
      if (jaAberto.has(`${ag.paciente_id}|sessao_perdida`)) continue

      const diasAtraso = Math.floor(
        (hojeMs - new Date(ag.data_agendamento!).getTime()) / 86_400_000,
      )
      const dataFmt = new Date(ag.data_agendamento!).toLocaleDateString('pt-BR')

      novos.push({
        clinica_id: clinicaId,
        paciente_id: ag.paciente_id,
        tipo: 'sessao_perdida',
        area: 'enfermagem',
        severidade: diasAtraso >= 7 ? 'critico' : 'atencao',
        titulo: `Reagendar: ${pac.nome} — ${ag.label}`,
        descricao: `"${ag.label}" estava agendada para ${dataFmt} e não foi realizada (${diasAtraso} dia${diasAtraso > 1 ? 's' : ''} de atraso). Entrar em contato para reagendar.`,
        resolvido: false, resolvido_por: null, resolvido_em: null,
        metadata: { agendamento_id: ag.id, dias_atraso: diasAtraso },
      })
      jaAberto.add(`${ag.paciente_id}|sessao_perdida`)
    }

    // ── COMERCIAL ───────────────────────────────────────────────────────────
    // Sessões restantes por paciente (para saber se o plano acaba com pendência)
    const { data: itens } = await supabase
      .from('plano_itens')
      .select('paciente_id, qtd_restante')

    const restantePor = new Map<string, number>()
    for (const it of (itens ?? []) as { paciente_id: string; qtd_restante: number }[]) {
      restantePor.set(it.paciente_id, (restantePor.get(it.paciente_id) ?? 0) + it.qtd_restante)
    }

    for (const pac of pacientes ?? []) {
      // NPS detrator — insatisfação declarada, precisa de resgate
      if (pac.nps_nota != null && pac.nps_nota <= 6 && !jaAberto.has(`${pac.id}|nps_detrator`)) {
        novos.push({
          clinica_id: clinicaId, paciente_id: pac.id,
          tipo: 'nps_detrator', area: 'comercial', severidade: 'critico',
          titulo: `Detrator: ${pac.nome} (NPS ${pac.nps_nota})`,
          descricao: `Avaliou a experiência com nota ${pac.nps_nota}/10. Contato de resgate antes que vire cancelamento.`,
          resolvido: false, resolvido_por: null, resolvido_em: null,
          metadata: { nps: pac.nps_nota },
        })
        jaAberto.add(`${pac.id}|nps_detrator`)
      }

      // Plano chegando ao fim com sessões pendentes — renovação
      const fim = pac.plano_fim_previsto ?? pac.plano_fim
      const restantes = restantePor.get(pac.id) ?? 0
      if (fim && !jaAberto.has(`${pac.id}|renovacao`)) {
        const dias = Math.round((new Date(`${fim}T00:00:00Z`).getTime() - hojeMs) / 86_400_000)
        if (dias <= DIAS_ANTES_DO_FIM) {
          novos.push({
            clinica_id: clinicaId, paciente_id: pac.id,
            tipo: 'renovacao', area: 'comercial',
            severidade: dias < 0 ? 'critico' : 'atencao',
            titulo: `Renovação: ${pac.nome}`,
            descricao: dias < 0
              ? `Plano encerrou há ${Math.abs(dias)} dia(s)${restantes > 0 ? ` com ${restantes} sessão(ões) pendente(s)` : ''}. Conversar sobre renovação.`
              : `Plano termina em ${dias} dia(s)${restantes > 0 ? ` e ainda restam ${restantes} sessão(ões)` : ''}. Momento de conversar sobre renovação.`,
            resolvido: false, resolvido_por: null, resolvido_em: null,
            metadata: { dias_para_fim: dias, sessoes_restantes: restantes },
          })
          jaAberto.add(`${pac.id}|renovacao`)
        }
      }

      // Engajamento baixo — risco de evasão
      if (pac.score != null && pac.score < 50 && !jaAberto.has(`${pac.id}|risco_evasao`)) {
        novos.push({
          clinica_id: clinicaId, paciente_id: pac.id,
          tipo: 'risco_evasao', area: 'comercial', severidade: 'atencao',
          titulo: `Risco de evasão: ${pac.nome}`,
          descricao: `Engajamento em ${pac.score}/100. Vale entender o que está travando antes de perder o paciente.`,
          resolvido: false, resolvido_por: null, resolvido_em: null,
          metadata: { score: pac.score },
        })
        jaAberto.add(`${pac.id}|risco_evasao`)
      }
    }

    if (novos.length === 0) {
      return NextResponse.json({ ok: true, gerados: 0, message: 'Nenhum alerta novo.' })
    }

    const { error } = await supabase.from('alertas').insert(novos)
    if (error) throw error

    const porArea = {
      enfermagem: novos.filter((n) => n.area === 'enfermagem').length,
      comercial:  novos.filter((n) => n.area === 'comercial').length,
    }

    return NextResponse.json({
      ok: true,
      gerados: novos.length,
      por_area: porArea,
      message: `${novos.length} alerta(s): ${porArea.enfermagem} enfermagem, ${porArea.comercial} comercial.`,
    })
  } catch (err) {
    console.error('[/api/alertas/generate]', err)
    return NextResponse.json({ error: 'Erro ao gerar alertas' }, { status: 500 })
  }
}
