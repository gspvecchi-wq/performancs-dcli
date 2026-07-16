import * as XLSX from 'xlsx'

// ─── Tipos de saída ───────────────────────────────────────────────────────────

export type CategoriaProc = 'plano' | 'sessao_numerada' | 'consulta' | 'outro'
export type StatusItem = 'nao_iniciado' | 'em_tratamento' | 'finalizado' | 'aguardando'

export interface FreqItem {
  paciente_nome: string
  procedimento: string
  categoria: CategoriaProc
  rastrear: boolean          // entra na visão "feito × falta"? (numeradas = false)
  qtd_prevista: number       // "Sessões" (somado entre orçamentos)
  qtd_realizada: number      // "Realizadas"
  qtd_restante: number       // recalculado: max(prevista - realizada, 0)
  status: StatusItem
  orcamento_id: string | null
}

export interface FreqPaciente {
  nome: string
  plano_inicio_fallback: string | null  // menor "Criação do plano" (usado só se não houver PDF)
}

export interface FrequenciaData {
  itens: FreqItem[]          // agregado por (paciente, procedimento) — só rastreáveis
  itensBrutos: FreqItem[]    // todos, inclusive sessões numeradas (para auditoria)
  pacientes: FreqPaciente[]
  _avisos: string[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function str(v: unknown): string {
  return v !== null && v !== undefined ? String(v).trim() : ''
}

function num(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

/** "25/08/2025" → "2025-08-25" */
function parseDate(raw: string): string | null {
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  return null
}

/** Classifica o procedimento pelo nome. */
export function classificarProcedimento(nome: string): CategoriaProc {
  const n = nome.trim()
  if (/^\d+\s*[ºªo°]?\s*Sess/i.test(n)) return 'sessao_numerada'
  if (/-\s*Plano\s*$/i.test(n)) return 'plano'
  if (/consulta|nutr[óo]log|nutricion/i.test(n)) return 'consulta'
  return 'outro'
}

/** Deriva o status a partir dos números (fonte mais confiável que o texto). */
function statusFromNumeros(prevista: number, realizada: number): StatusItem {
  if (realizada <= 0) return 'nao_iniciado'
  if (realizada >= prevista) return 'finalizado'
  return 'em_tratamento'
}

// ─── Parser ────────────────────────────────────────────────────────────────────

export function parseFrequencia(buffer: Buffer): FrequenciaData {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: false })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
  const avisos: string[] = []

  // Colunas esperadas (com fallback de nomes)
  const get = (row: Record<string, unknown>, keys: string[]) => {
    for (const k of keys) {
      const v = row[k]
      if (v !== undefined && v !== '') return v
    }
    return ''
  }

  // Agregação por (paciente, procedimento)
  const mapa = new Map<string, FreqItem>()
  const inicioPorPaciente = new Map<string, string>()

  for (const row of rows) {
    const paciente = str(get(row, ['Paciente', 'Cliente', 'paciente']))
    const procedimento = str(get(row, ['Procedimento', 'procedimento']))
    if (!paciente || !procedimento) continue

    const prevista = num(get(row, ['Sessões', 'Sessoes', 'Total_Sessoes']))
    const realizada = num(get(row, ['Realizadas', 'Sessoes_Realizadas']))
    const orcamento = str(get(row, ['Orçamento', 'Orcamento'])) || null
    const criacao = parseDate(str(get(row, ['Criação do plano', 'Criacao do plano', 'Inicio_Plano'])))

    // menor data de criação por paciente (fallback de início)
    if (criacao) {
      const atual = inicioPorPaciente.get(paciente)
      if (!atual || criacao < atual) inicioPorPaciente.set(paciente, criacao)
    }

    const categoria = classificarProcedimento(procedimento)
    const key = `${paciente}||${procedimento}`
    const existente = mapa.get(key)
    if (existente) {
      existente.qtd_prevista += prevista
      existente.qtd_realizada += realizada
    } else {
      mapa.set(key, {
        paciente_nome: paciente,
        procedimento,
        categoria,
        rastrear: categoria !== 'sessao_numerada',
        qtd_prevista: prevista,
        qtd_realizada: realizada,
        qtd_restante: 0,       // recalculado abaixo
        status: 'nao_iniciado', // recalculado abaixo
        orcamento_id: orcamento,
      })
    }
  }

  // Recalcula restante e status após somar
  const itensBrutos = [...mapa.values()].map((it) => {
    it.qtd_restante = Math.max(it.qtd_prevista - it.qtd_realizada, 0)
    it.status = statusFromNumeros(it.qtd_prevista, it.qtd_realizada)
    return it
  })

  const itens = itensBrutos.filter((it) => it.rastrear)

  const pacientes: FreqPaciente[] = [...new Set(itensBrutos.map((i) => i.paciente_nome))].map((nome) => ({
    nome,
    plano_inicio_fallback: inicioPorPaciente.get(nome) ?? null,
  }))

  if (itens.length === 0) avisos.push('Nenhum item rastreável encontrado no relatório de frequência')

  return { itens, itensBrutos, pacientes, _avisos: avisos }
}
