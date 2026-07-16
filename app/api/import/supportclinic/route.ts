import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  parseSupportClinic,
  normalizeName,
  normalizePhone,
  type SCPaciente,
  type SCAgendamento,
} from '@/lib/import/supportclinicParser'

/**
 * POST /api/import/supportclinic
 *
 * Recebe a planilha do SupportClinic via FormData (campo "file") e sincroniza:
 *  - Aba Dashboard    → upsert pacientes (nome, telefone, financeiro, plano)
 *  - Aba Agendamentos → upsert agendamentos (com external_id para idempotência)
 *
 * O score é recalculado automaticamente pelo trigger do Supabase após
 * cada upsert de agendamento.
 */
export async function POST(req: NextRequest) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('clinica_id')
      .eq('id', user.id)
      .single()
    if (!usuario) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 403 })

    const clinicaId = usuario.clinica_id

    // ── Leitura do arquivo enviado via FormData ─────────────────────────────
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado (campo "file")' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { pacientes: scPacientes, agendamentos: scAgendamentos } =
      parseSupportClinic(buffer)

    // ── Carregar pacientes existentes da clínica ────────────────────────────
    const { data: existentes } = await supabase
      .from('pacientes')
      .select('id, nome, telefone')
      .eq('clinica_id', clinicaId)

    const byName  = new Map<string, string>()  // nome normalizado → id
    const byPhone = new Map<string, string>()  // telefone normalizado → id

    for (const p of existentes ?? []) {
      byName.set(normalizeName(p.nome), p.id)
      if (p.telefone) byPhone.set(normalizePhone(p.telefone), p.id)
    }

    // ── Upsert pacientes (aba Dashboard) ────────────────────────────────────
    const stats = { pacientes_criados: 0, pacientes_atualizados: 0, agendamentos: 0 }
    const pacienteIdMap = new Map<string, string>()  // nome normalizado → id final

    for (const sc of scPacientes) {
      const nomeNorm  = normalizeName(sc.nome)
      const teleNorm  = normalizePhone(sc.telefone)
      const statusPag = deriveStatusPagamento(sc)

      const planoInicio = sc.plano_inicio ?? new Date().toISOString().split('T')[0]
      const planoFim    = addMonths(planoInicio, 12)

      const existingId = byName.get(nomeNorm) ?? (teleNorm ? byPhone.get(teleNorm) : undefined)

      if (existingId) {
        // Atualiza campos financeiros e de plano (não sobrescreve plano_fim existente)
        await supabase
          .from('pacientes')
          .update({
            telefone:                      sc.telefone || undefined,
            valor_plano:                   sc.valor_contratado || null,
            valor_pago:                    sc.valor_pago || null,
            status_pagamento:              statusPag,
            status_pagamento_atualizado_em: today(),
          })
          .eq('id', existingId)
          .eq('clinica_id', clinicaId)

        pacienteIdMap.set(nomeNorm, existingId)
        stats.pacientes_atualizados++
      } else {
        // Cria novo paciente
        const { data: novo, error } = await supabase
          .from('pacientes')
          .insert({
            clinica_id:                    clinicaId,
            nome:                          toTitleCase(sc.nome),
            telefone:                      sc.telefone || null,
            email:                         null,
            data_nascimento:               null,
            objetivo:                      'emagrecimento',
            meta_kg:                       null,
            meta_prazo_meses:              null,
            peso_inicial:                  null,
            peso_atual:                    null,
            foto_url:                      null,
            motivacao:                     null,
            historico_saude:               null,
            alertas_contexto:              null,
            especialidade:                 null,
            plano_inicio:                  planoInicio,
            plano_fim:                     planoFim,
            status:                        'ativo',
            score:                         50,
            nivel:                         'medio',
            valor_plano:                   sc.valor_contratado || null,
            valor_pago:                    sc.valor_pago || null,
            status_pagamento:              statusPag,
            status_pagamento_atualizado_em: today(),
            criado_por:                    user.id,
          })
          .select('id')
          .single()

        if (!error && novo) {
          pacienteIdMap.set(nomeNorm, novo.id)
          byName.set(nomeNorm, novo.id)
          if (teleNorm) byPhone.set(teleNorm, novo.id)
          stats.pacientes_criados++
        }
      }
    }

    // ── Upsert agendamentos (aba Agendamentos) ──────────────────────────────
    // Processar em lotes de 100 para não sobrecarregar o Supabase
    const BATCH = 100
    const agendRows = buildAgendamentos(scAgendamentos, pacienteIdMap, byName, byPhone, clinicaId)

    for (let i = 0; i < agendRows.length; i += BATCH) {
      const batch = agendRows.slice(i, i + BATCH)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('agendamentos') as any)
        .upsert(batch, { onConflict: 'external_id', ignoreDuplicates: false })

      if (!error) stats.agendamentos += batch.length
    }

    return NextResponse.json({
      success: true,
      ...stats,
      message: `Sincronização concluída: ${stats.pacientes_criados} pacientes criados, ${stats.pacientes_atualizados} atualizados, ${stats.agendamentos} agendamentos processados.`,
    })
  } catch (err) {
    console.error('[/api/import/supportclinic]', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// ─── Helpers locais ───────────────────────────────────────────────────────────

function deriveStatusPagamento(sc: SCPaciente): string {
  if (sc.valor_contratado === 0) return 'desconhecido'
  if (sc.valor_pendente === 0)   return 'adimplente'
  if (sc.valor_pago > 0)         return 'em_atraso'
  return 'inadimplente'
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

function addMonths(isoDate: string, months: number): string {
  const d = new Date(isoDate)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

type AgendRow = {
  external_id:              string
  paciente_id:              string
  clinica_id:               string
  label:                    string
  data_agendamento:         string
  hora:                     string | null
  profissional:             string | null
  status:                   string
  observacao:               null
  alerta_d1_enviado:        boolean
}

function buildAgendamentos(
  rows: SCAgendamento[],
  byNomeNorm: Map<string, string>,
  byName:     Map<string, string>,
  byPhone:    Map<string, string>,
  clinicaId:  string,
): AgendRow[] {
  const result: AgendRow[] = []

  for (const a of rows) {
    const nomeNorm = normalizeName(a.paciente_nome)
    const teleNorm = normalizePhone(a.paciente_telefone)

    const pacienteId =
      byNomeNorm.get(nomeNorm) ??
      byName.get(nomeNorm) ??
      (teleNorm ? byPhone.get(teleNorm) : undefined)

    if (!pacienteId) continue  // paciente não encontrado — pula

    result.push({
      external_id:       a.external_id,
      paciente_id:       pacienteId,
      clinica_id:        clinicaId,
      label:             a.label || 'Sessão',
      data_agendamento:  a.data_agendamento,
      hora:              a.hora ?? null,
      profissional:      a.profissional ?? null,
      status:            a.status,
      observacao:        null,
      alerta_d1_enviado: false,
    })
  }

  return result
}
