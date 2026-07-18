import * as XLSX from 'xlsx'
import { extractPdfText } from '@/lib/import/pdfText'

// ─── Tipos de saída ───────────────────────────────────────────────────────────

export interface AgendamentoItem {
  external_id: string | null   // código do SupportClinic (Excel) — null no PDF
  paciente_nome: string
  paciente_telefone: string | null
  data_agendamento: string     // ISO YYYY-MM-DD
  hora: string | null          // HH:MM
  procedimentos: string[]      // lista (o Excel traz completa; o PDF pode truncar)
  profissional: string | null
  status: StatusAgend
  orcamento_id: string | null
  truncado: boolean            // true = lista de procedimentos incompleta (PDF "...")
}

export type StatusAgend = 'agendado' | 'atendido' | 'cancelado' | 'remarcado'

export interface AgendamentosData {
  itens: AgendamentoItem[]
  _avisos: string[]
}

// ─── Mapas / helpers ───────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, StatusAgend> = {
  'agendado': 'agendado',
  'confirmado': 'agendado',
  'atrasado': 'agendado',
  'sala de espera': 'agendado',
  'atendido': 'atendido',
  'em atendimento': 'atendido',
  'cancelado': 'cancelado',
  'desmarcado': 'cancelado',
  'faltou': 'cancelado',
  'não atendido': 'cancelado',
  'reagendado': 'remarcado',
  'remarcado': 'remarcado',
}

// Status que aparecem no PDF, ordenados por especificidade (mais longos primeiro).
const STATUS_KEYS = Object.keys(STATUS_MAP).sort((a, b) => b.length - a.length)

function str(v: unknown): string {
  return v !== null && v !== undefined ? String(v).trim() : ''
}

function mapStatus(raw: string): StatusAgend {
  return STATUS_MAP[raw.trim().toLowerCase()] ?? 'agendado'
}

/** "11/06/2026 15:00 - 16:00" → { date: "2026-06-11", hora: "15:00" } */
function parseDataHora(raw: string): { date: string | null; hora: string | null } {
  const m = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}:\d{2}))?/)
  if (!m) return { date: null, hora: null }
  return {
    date: `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`,
    hora: m[4] ?? null,
  }
}

function toIsoDate(d: string, mo: string, y: string): string {
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
}

/** Quebra "A - Plano, B, 1º S..." em lista e detecta truncamento. */
function splitProcedimentos(raw: string): { lista: string[]; truncado: boolean } {
  const clean = raw.trim()
  const truncado = /\.\.\.\s*$/.test(clean) || /\d+[ºªo°]?\s*S\.\.\./.test(clean)
  const lista = clean
    .replace(/\s*\.\.\.\s*$/, '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return { lista, truncado }
}

// Rótulos que denunciam uma linha de cabeçalho embutida (export vem sem header,
// mas às vezes carrega uma linha "Paciente/Status/Profissional" no meio).
const HEADER_TOKENS = new Set(['status', 'profissional', 'paciente', 'agendado por', 'data'])

// ─── Parser Excel (headerless, colunas por posição) ────────────────────────────
//
// Layout real do export "Agendamentos.xlsx":
//   0 Código · 1 Paciente · 2 Telefone · 3 (vazio) · 4 Orçamento
//   5 Data ("11/06/2026 15:00 - 16:00") · 6 Procedimentos · 7 Profissional
//   8 Agendado por · 9 Status · 10 Criação
export function parseAgendamentosExcel(buffer: Buffer): AgendamentosData {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: false })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '', blankrows: false })
  const avisos: string[] = []
  const itens: AgendamentoItem[] = []

  for (const row of rows) {
    const status9 = str(row[9])
    // pula linhas de cabeçalho embutidas
    if (HEADER_TOKENS.has(status9.toLowerCase())) continue

    const paciente = str(row[1])
    const { date, hora } = parseDataHora(str(row[5]))
    if (!paciente || !date) continue

    const { lista, truncado } = splitProcedimentos(str(row[6]))

    itens.push({
      external_id: str(row[0]) || null,
      paciente_nome: paciente,
      paciente_telefone: str(row[2]) || null,
      data_agendamento: date,
      hora,
      procedimentos: lista,
      profissional: str(row[7]) || null,
      status: mapStatus(status9),
      orcamento_id: str(row[4]) || null,
      truncado,
    })
  }

  if (itens.length === 0) avisos.push('Nenhum agendamento válido encontrado na planilha')
  return { itens, _avisos: avisos }
}

// ─── Parser PDF (best-effort — layout tabular linearizado, pode truncar) ────────
//
// O PDF "Agendamentos - {Paciente}" é por paciente e trunca listas longas de
// procedimento com "...". Serve para DATAS/alertas; para a lista completa de
// procedimentos, prefira o Excel. Linhas truncadas são marcadas para revisão.
//
// Estrutura real (pdf-parse): colunas separadas por TAB, uma linha por registro,
// terminando no horário "HH:MM - HH:MM". Cada registro tem a forma
//   {Procedimento(s)} <status> {Profissional} {Data} {Hora}
// O token de status funciona como divisor entre Procedimento e Profissional.
export function parseAgendamentosPdfText(rawText: string): AgendamentosData {
  const text = rawText.replace(new RegExp(String.fromCharCode(0), 'g'), 'fi')
  const avisos: string[] = []
  const itens: AgendamentoItem[] = []

  // Nome do paciente: "Agendamentos - {Nome}"
  const nomeMatch = text.match(/Agendamentos\s*-\s*(.+)/)
  const paciente = nomeMatch ? nomeMatch[1].trim() : ''
  if (!paciente) avisos.push('Nome do paciente não encontrado no PDF de agendamentos')

  // Isola o corpo da tabela: depois do cabeçalho, antes do rodapé.
  let body = text
  const hdr = text.match(/Agendamento\s+Status\s+Profissional\s+Data/i)
  if (hdr) body = text.slice(text.indexOf(hdr[0]) + hdr[0].length)
  // corta rodapé (URL do supportclinic, paginação "-- 1 of 1 --")
  body = body.split(/https?:\/\/|--\s*\d+\s*of\s*\d+\s*--/i)[0]

  // Normaliza espaços/tabs e remove a paginação "DD/MM/AAAA, HH:MM  Agendamentos"
  const flat = body
    .replace(/\d{1,2}\/\d{1,2}\/\d{4},\s*\d{1,2}:\d{2}\s+Agendamentos/gi, ' ')
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Cada registro termina num horário "HH:MM - HH:MM". Quebramos por ele,
  // mantendo o horário como delimitador (pares [conteúdo, horário]).
  const partes = flat.split(/(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})/)
  for (let i = 0; i + 1 < partes.length; i += 2) {
    const chunk = partes[i].trim()
    const horaFull = partes[i + 1]
    if (!chunk) continue

    const hora = horaFull.match(/(\d{1,2}:\d{2})/)?.[1] ?? null

    // Data = última dd/mm/aaaa do chunk (coluna "Data")
    const datas = [...chunk.matchAll(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g)]
    if (datas.length === 0) continue
    const d = datas[datas.length - 1]
    const dataIso = toIsoDate(d[1], d[2], d[3])

    // Status = primeiro rótulo conhecido → divide Procedimento | Profissional
    let status: StatusAgend = 'agendado'
    let statusIdx = -1
    for (const k of STATUS_KEYS) {
      const idx = chunk.toLowerCase().indexOf(k)
      if (idx >= 0 && (statusIdx === -1 || idx < statusIdx)) {
        statusIdx = idx; status = STATUS_MAP[k]
      }
    }

    let procParte: string
    if (statusIdx >= 0) {
      procParte = chunk.slice(0, statusIdx)
      // (profissional = entre status e data — não persistido a partir do PDF)
    } else {
      procParte = chunk.slice(0, d.index ?? chunk.length)
      avisos.push(`Agendamento em ${dataIso} sem status reconhecido no PDF`)
    }

    // remove qualquer data residual que tenha sobrado no texto do procedimento
    procParte = procParte.replace(/\d{1,2}\/\d{1,2}\/\d{4}/g, '').trim()

    const { lista, truncado } = splitProcedimentos(procParte)
    if (lista.length === 0) continue

    itens.push({
      external_id: null,
      paciente_nome: paciente,
      paciente_telefone: null,
      data_agendamento: dataIso,
      hora,
      procedimentos: lista,
      profissional: null,
      status,
      orcamento_id: null,
      truncado,
    })
  }

  const truncados = itens.filter((it) => it.truncado).length
  if (truncados > 0) {
    avisos.push(`${truncados} agendamento(s) com lista de procedimentos truncada no PDF — confira/complete manualmente`)
  }
  if (itens.length === 0) avisos.push('Nenhum agendamento extraído do PDF')

  return { itens, _avisos: avisos }
}

/** Extrai o texto do PDF (Buffer) e parseia. Uso server-side. */
export async function parseAgendamentosPdf(buffer: Buffer): Promise<AgendamentosData> {
  const text = await extractPdfText(buffer)
  return parseAgendamentosPdfText(text)
}
