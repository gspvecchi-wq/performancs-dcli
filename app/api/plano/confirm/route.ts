import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeName } from '@/lib/plano/consolidate'

/**
 * POST /api/plano/confirm
 *
 * Recebe os pacientes já revisados/editados na tela de importação e grava:
 *   - pacientes    (cria ou atualiza; casa por nome/telefone normalizado)
 *   - procedimentos (catálogo da clínica; cria os que ainda não existem)
 *   - plano_itens  (previsto × realizado por paciente/procedimento; upsert)
 *
 * Requer autenticação. Não persiste agendamentos aqui (isso segue pelo fluxo
 * de sincronização do SupportClinic).
 */

interface ItemIn {
  procedimento: string
  categoria?: string
  qtd_prevista: number
  qtd_realizada: number
  frequencia_dias?: number | null
  fontes?: string[]
  orcamento_id?: string | null
}
interface PacienteIn {
  nome: string
  prontuario?: string | null
  cpf?: string | null
  telefone?: string | null
  plano_inicio?: string | null
  plano_fim?: string | null
  itens: ItemIn[]
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}
function addMonths(iso: string, months: number): string {
  const d = new Date(iso)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}
function normalizePhone(p: string): string {
  return p.replace(/\D/g, '')
}
function titleCase(s: string): string {
  return s.toLowerCase().split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: usuario } = await supabase
      .from('usuarios').select('clinica_id').eq('id', user.id).single()
    if (!usuario) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 403 })
    const clinicaId = usuario.clinica_id

    const body = (await req.json()) as { pacientes?: PacienteIn[] }
    const entrada = body.pacientes ?? []
    if (entrada.length === 0) {
      return NextResponse.json({ error: 'Nenhum paciente enviado' }, { status: 400 })
    }

    // ── Índices existentes ────────────────────────────────────────────────────
    const { data: existentes } = await supabase
      .from('pacientes').select('id, nome, telefone').eq('clinica_id', clinicaId)
    const byName = new Map<string, string>()
    const byPhone = new Map<string, string>()
    for (const p of existentes ?? []) {
      byName.set(normalizeName(p.nome), p.id)
      if (p.telefone) byPhone.set(normalizePhone(p.telefone), p.id)
    }

    const { data: procExist } = await supabase
      .from('procedimentos').select('id, nome').eq('clinica_id', clinicaId)
    const procByName = new Map<string, string>()
    for (const pr of procExist ?? []) procByName.set(normalizeName(pr.nome), pr.id)

    const stats = { pacientes_criados: 0, pacientes_atualizados: 0, procedimentos_criados: 0, itens: 0 }

    // ── Garante procedimento no catálogo (cria se novo) ───────────────────────
    async function ensureProcedimento(it: ItemIn): Promise<string | null> {
      const key = normalizeName(it.procedimento)
      const existing = procByName.get(key)
      if (existing) return existing
      const { data, error } = await supabase
        .from('procedimentos')
        .insert({
          clinica_id: clinicaId,
          nome: it.procedimento,
          categoria: it.categoria ?? 'outro',
          frequencia_dias: it.frequencia_dias ?? 7,
          rastrear: true,
          ativo: true,
        })
        .select('id').single()
      if (error || !data) return null
      procByName.set(key, data.id)
      stats.procedimentos_criados++
      return data.id
    }

    // ── Processa cada paciente ────────────────────────────────────────────────
    for (const pac of entrada) {
      const nomeNorm = normalizeName(pac.nome)
      const teleNorm = pac.telefone ? normalizePhone(pac.telefone) : ''
      const inicio = pac.plano_inicio || today()
      const fim = pac.plano_fim || addMonths(inicio, 12)

      let pacienteId = byName.get(nomeNorm) ?? (teleNorm ? byPhone.get(teleNorm) : undefined)

      if (pacienteId) {
        await supabase.from('pacientes').update({
          prontuario: pac.prontuario ?? undefined,
          cpf: pac.cpf ?? undefined,
          telefone: pac.telefone ?? undefined,
          plano_inicio: inicio,
          plano_fim: fim,
        }).eq('id', pacienteId).eq('clinica_id', clinicaId)
        stats.pacientes_atualizados++
      } else {
        const { data: novo, error } = await supabase.from('pacientes').insert({
          clinica_id: clinicaId,
          nome: titleCase(pac.nome),
          telefone: pac.telefone ?? null,
          email: null,
          prontuario: pac.prontuario ?? null,
          cpf: pac.cpf ?? null,
          data_nascimento: null,
          objetivo: 'emagrecimento',
          meta_kg: null,
          meta_prazo_meses: null,
          peso_inicial: null,
          peso_atual: null,
          foto_url: null,
          motivacao: null,
          historico_saude: null,
          alertas_contexto: null,
          especialidade: null,
          plano_inicio: inicio,
          plano_fim: fim,
          status: 'ativo',
          score: 50,
          nivel: 'medio',
          status_pagamento: 'desconhecido',
          status_pagamento_atualizado_em: null,
          valor_plano: null,
          valor_pago: null,
          criado_por: user.id,
        }).select('id').single()
        if (error || !novo) continue
        pacienteId = novo.id
        byName.set(nomeNorm, pacienteId)
        if (teleNorm) byPhone.set(teleNorm, pacienteId)
        stats.pacientes_criados++
      }

      // ── Itens do plano ──────────────────────────────────────────────────────
      for (const it of pac.itens) {
        const procId = await ensureProcedimento(it)
        if (!procId) continue
        const fonte = it.fontes?.includes('pdf_plano') ? 'pdf_plano' : 'excel_frequencia'
        const { error } = await supabase.from('plano_itens').upsert({
          paciente_id: pacienteId,
          procedimento_id: procId,
          qtd_prevista: it.qtd_prevista,
          qtd_realizada: it.qtd_realizada,
          orcamento_id: it.orcamento_id ?? null,
          fonte,
        }, { onConflict: 'paciente_id,procedimento_id' })
        if (!error) stats.itens++
      }
    }

    return NextResponse.json({
      success: true,
      ...stats,
      message: `Importação concluída: ${stats.pacientes_criados} criados, ${stats.pacientes_atualizados} atualizados, ${stats.itens} itens de plano.`,
    })
  } catch (err) {
    console.error('[/api/plano/confirm]', err)
    return NextResponse.json({ error: 'Erro ao gravar importação' }, { status: 500 })
  }
}
