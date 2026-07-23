import type { PlanoPdfData } from '@/lib/import/planoPdfParser'
import type { FrequenciaData, FreqItem, CategoriaProc, StatusItem } from '@/lib/import/frequenciaParser'
import { classificarProcedimento } from '@/lib/import/frequenciaParser'
import type { AgendamentosData, AgendamentoItem } from '@/lib/import/agendamentosParser'

// ─── Tipos ─────────────────────────────────────────────────────────────────────

export interface ItemConsolidado {
  procedimento: string
  categoria: CategoriaProc
  qtd_prevista: number
  qtd_realizada: number
  qtd_restante: number
  status: StatusItem
  frequencia_dias: number | null   // do PDF (quando disponível)
  fontes: Array<'pdf_plano' | 'excel_frequencia'>
}

export interface PacienteConsolidado {
  nome: string
  prontuario: string | null
  cpf: string | null
  telefone: string | null
  plano_inicio: string | null
  plano_fim: string | null
  /** true quando veio de um PDF de Plano de Tratamento. Só esses podem CRIAR
   *  paciente — frequência e agendamentos apenas atualizam quem já existe. */
  tem_plano_pdf: boolean
  itens: ItemConsolidado[]
  agendamentos: AgendamentoItem[]
  _avisos: string[]
}

export interface ConsolidacaoInput {
  planos?: PlanoPdfData[] | null   // um PDF de plano por paciente (bulk permitido)
  frequencia?: FrequenciaData | null
  agendamentos?: AgendamentosData | null
}

// ─── Normalização de nomes (matching entre fontes) ─────────────────────────────

/**
 * Remove marcas diacríticas combinantes (U+0300–U+036F) via código de caractere
 * — evita literais/escapes frágeis no fonte. "café" → "cafe".
 */
function stripAccents(s: string): string {
  return s
    .normalize('NFD')
    .split('')
    .filter((c) => {
      const code = c.charCodeAt(0)
      return code < 0x300 || code > 0x36f
    })
    .join('')
}

/** "Kelly Cristina a Silva  Amorim" == "KELLY CRISTINA A SILVA AMORIM" */
export function normalizeName(name: string): string {
  return stripAccents(name).toUpperCase().replace(/\s+/g, ' ').trim()
}

/** Normaliza nome de procedimento para casar entre PDF e frequência. */
function normalizeProc(nome: string): string {
  return stripAccents(nome).toUpperCase().replace(/\s+/g, ' ').trim()
}

// ─── Consolidação ──────────────────────────────────────────────────────────────

/**
 * Cruza as três fontes num único registro por paciente:
 *   • Identidade + início do plano  → do PDF (fonte assinada pela Dra.)
 *   • Prevista/Realizada/Restante   → da frequência (fonte da verdade do progresso)
 *   • Datas das sessões             → dos agendamentos
 *
 * O casamento entre fontes é por nome normalizado. Quando ambos PDF e frequência
 * trazem o mesmo procedimento, a quantidade prevista do PDF prevalece.
 */
export function consolidar(input: ConsolidacaoInput): PacienteConsolidado[] {
  const porPaciente = new Map<string, PacienteConsolidado>()

  const getOuCria = (nome: string): PacienteConsolidado => {
    const key = normalizeName(nome)
    let p = porPaciente.get(key)
    if (!p) {
      p = {
        nome, prontuario: null, cpf: null, telefone: null,
        plano_inicio: null, plano_fim: null,
        tem_plano_pdf: false,
        itens: [], agendamentos: [], _avisos: [],
      }
      porPaciente.set(key, p)
    }
    return p
  }

  // itens indexados por (pacienteKey || procKey)
  const itemIndex = new Map<string, ItemConsolidado>()
  const itemKey = (pac: string, proc: string) => `${normalizeName(pac)}||${normalizeProc(proc)}`

  // 1) PDFs de plano — identidade, início, previstas (um por paciente)
  for (const pdf of input.planos ?? []) {
    if (!pdf.paciente_nome) continue
    const p = getOuCria(pdf.paciente_nome)
    p.tem_plano_pdf = true   // habilita o cadastro deste paciente
    p.prontuario = pdf.prontuario ?? p.prontuario
    p.cpf = pdf.cpf ?? p.cpf
    p.telefone = pdf.telefone ?? p.telefone
    p.plano_inicio = pdf.plano_inicio ?? p.plano_inicio
    p.plano_fim = pdf.plano_fim ?? p.plano_fim
    p._avisos.push(...pdf._avisos)

    for (const it of pdf.itens) {
      const item: ItemConsolidado = {
        procedimento: it.procedimento,
        categoria: classificarProcedimento(it.procedimento),
        qtd_prevista: it.qtd_prevista,
        qtd_realizada: 0,
        qtd_restante: it.qtd_prevista,
        status: 'nao_iniciado',
        frequencia_dias: it.frequencia_dias,
        fontes: ['pdf_plano'],
      }
      itemIndex.set(itemKey(pdf.paciente_nome, it.procedimento), item)
      p.itens.push(item)
    }
  }

  // 2) Frequência — progresso (realizada/restante/status). Só itens rastreáveis.
  if (input.frequencia) {
    for (const fi of input.frequencia.itens) {
      const p = getOuCria(fi.paciente_nome)
      const k = itemKey(fi.paciente_nome, fi.procedimento)
      const existente = itemIndex.get(k)
      if (existente) {
        // PDF já trouxe o item: adiciona progresso da frequência
        existente.qtd_realizada = fi.qtd_realizada
        existente.qtd_restante = Math.max(existente.qtd_prevista - fi.qtd_realizada, 0)
        existente.status = fi.status
        if (!existente.fontes.includes('excel_frequencia')) existente.fontes.push('excel_frequencia')
      } else {
        // Item só na frequência (ex.: sem PDF)
        const item = freqParaItem(fi)
        itemIndex.set(k, item)
        p.itens.push(item)
      }
    }
    // fallback de início do plano quando não veio do PDF
    for (const fp of input.frequencia.pacientes) {
      const p = getOuCria(fp.nome)
      if (!p.plano_inicio && fp.plano_inicio_fallback) p.plano_inicio = fp.plano_inicio_fallback
    }
  }

  // 3) Agendamentos — datas das sessões
  if (input.agendamentos) {
    for (const ag of input.agendamentos.itens) {
      const p = getOuCria(ag.paciente_nome)
      p.agendamentos.push(ag)
      if (!p.telefone && ag.paciente_telefone) p.telefone = ag.paciente_telefone
    }
  }

  return [...porPaciente.values()]
}

function freqParaItem(fi: FreqItem): ItemConsolidado {
  return {
    procedimento: fi.procedimento,
    categoria: fi.categoria,
    qtd_prevista: fi.qtd_prevista,
    qtd_realizada: fi.qtd_realizada,
    qtd_restante: fi.qtd_restante,
    status: fi.status,
    frequencia_dias: null,
    fontes: ['excel_frequencia'],
  }
}
