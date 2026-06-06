import * as XLSX from 'xlsx'

// ─── Tipos de saída ───────────────────────────────────────────────────────────

export interface SCAgendamento {
  external_id: string        // Código original do SupportClinic
  paciente_nome: string
  paciente_telefone: string
  data_agendamento: string   // ISO: YYYY-MM-DD
  hora: string | null        // HH:MM
  label: string
  profissional: string | null
  status: string             // 'agendado' | 'atendido' | 'cancelado' | 'remarcado'
  orcamento_ids: string[]
}

export interface SCPaciente {
  nome: string               // UPPERCASE original da planilha
  telefone: string
  plano_inicio: string | null  // ISO date
  total_sessoes: number
  sessoes_realizadas: number
  pct_conclusao: number
  status_frequencia: string
  valor_contratado: number
  valor_pago: number
  valor_pendente: number
  agend_atendido: number
  agend_cancelado: number
  agend_faltou: number
}

export interface SCOrcamento {
  id: string
  paciente_nome: string
  status: string
  total: number
  valor_pago: number
  valor_pendente: number
}

export interface SupportClinicData {
  pacientes: SCPaciente[]
  agendamentos: SCAgendamento[]
  orcamentos: SCOrcamento[]
}

// ─── Mapas de status ─────────────────────────────────────────────────────────

const AGEND_STATUS: Record<string, string> = {
  'atendido':         'atendido',
  'agendado':         'agendado',
  'cancelado':        'cancelado',
  'desmarcado':       'cancelado',
  'faltou':           'cancelado',
  'não atendido':     'cancelado',
  'reagendado':       'remarcado',
  'em atendimento':   'atendido',
  'confirmado':       'agendado',
  'sala de espera':   'agendado',
  'atrasado':         'agendado',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function str(v: unknown): string {
  return v !== null && v !== undefined ? String(v).trim() : ''
}

/** "02/06/2025 09:00 - 10:00" → { date: "2025-06-02", hora: "09:00" } */
function parseAgendData(raw: string): { date: string; hora: string | null } {
  const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}:\d{2})/)
  if (m) return { date: `${m[3]}-${m[2]}-${m[1]}`, hora: m[4] }
  return { date: '', hora: null }
}

/** "R$ 6.800,00" → 6800.00 */
function parseMoney(raw: string): number {
  if (!raw || raw === '-') return 0
  const cleaned = raw.replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

/** "25/08/2025" → "2025-08-25" */
function parseDate(raw: string): string {
  if (!raw || raw === '-') return ''
  const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  return ''
}

// ─── Parseadores por aba ──────────────────────────────────────────────────────

function parseDashboard(ws: XLSX.WorkSheet): SCPaciente[] {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
  return rows
    .map((row) => ({
      nome:               str(row['Cliente'] ?? row['cliente']),
      telefone:           str(row['Telefone'] ?? row['telefone']),
      plano_inicio:       parseDate(str(row['Inicio_Plano'] ?? row['Início do Plano'])) || null,
      total_sessoes:      Number(row['Total_Sessoes'] ?? row['Total Sessões']) || 0,
      sessoes_realizadas: Number(row['Sessoes_Realizadas'] ?? row['Sessões Realizadas']) || 0,
      pct_conclusao:      Number(row['Pct_Conclusao'] ?? row['% Conclusão']) || 0,
      status_frequencia:  str(row['Status_Frequencia'] ?? row['Status Frequência']),
      valor_contratado:   parseMoney(str(row['Total_Contratado'] ?? row['Total Contratado'])),
      valor_pago:         parseMoney(str(row['Total_Pago'] ?? row['Total Pago'])),
      valor_pendente:     parseMoney(str(row['Total_Pendente'] ?? row['Total Pendente'])),
      agend_atendido:     Number(row['Agend_Atendido'] ?? 0),
      agend_cancelado:    Number(row['Agend_Cancelado'] ?? 0) + Number(row['Agend_Desmarcado'] ?? 0),
      agend_faltou:       Number(row['Agend_Faltou'] ?? 0),
    }))
    .filter((p) => p.nome)
}

function parseAgendamentos(ws: XLSX.WorkSheet): SCAgendamento[] {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
  return rows
    .map((row) => {
      const dataRaw   = str(row['Data'] ?? row['data'])
      const { date, hora } = parseAgendData(dataRaw)
      const statusRaw = str(row['Status'] ?? row['status']).toLowerCase()
      const orcRaw    = str(row['Orçamento'] ?? row['Orcamento'] ?? '')

      return {
        external_id:       str(row['Código'] ?? row['Codigo'] ?? row['ID']),
        paciente_nome:     str(row['Paciente'] ?? row['paciente']),
        paciente_telefone: str(row['Telefone'] ?? row['telefone']),
        data_agendamento:  date,
        hora,
        label:             str(row['Agendamento'] ?? row['agendamento']).trim(),
        profissional:      str(row['Profissional'] ?? row['profissional']) || null,
        status:            AGEND_STATUS[statusRaw] ?? 'agendado',
        orcamento_ids:     orcRaw ? orcRaw.split(',').map((s) => s.trim()).filter(Boolean) : [],
      }
    })
    .filter((a) => a.external_id && a.data_agendamento)
}

function parseOrcamentos(ws: XLSX.WorkSheet): SCOrcamento[] {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
  return rows
    .map((row) => ({
      id:             str(row['ID'] ?? row['id']),
      paciente_nome:  str(row['Paciente'] ?? row['paciente']),
      status:         str(row['Status'] ?? row['status']),
      total:          parseMoney(str(row['Total'] ?? row['total'])),
      valor_pago:     parseMoney(str(row['Valor Pago'] ?? '')),
      valor_pendente: parseMoney(str(row['Valor Pendente'] ?? '')),
    }))
    .filter((o) => o.id && o.paciente_nome)
}

// ─── Exportação principal ─────────────────────────────────────────────────────

export function parseSupportClinic(buffer: Buffer): SupportClinicData {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: false })

  const sheetName = (candidates: string[]) => {
    for (const name of candidates) {
      const found = wb.SheetNames.find(
        (s) => s.toLowerCase().includes(name.toLowerCase())
      )
      if (found) return found
    }
    return null
  }

  const dashSheet  = sheetName(['Dashboard', 'dashboard'])
  const agendSheet = sheetName(['Agendamento', 'agendamento'])
  const orcSheet   = sheetName(['Orçamento', 'Orcamento', 'Budget'])

  return {
    pacientes:    dashSheet  ? parseDashboard(wb.Sheets[dashSheet])     : [],
    agendamentos: agendSheet ? parseAgendamentos(wb.Sheets[agendSheet]) : [],
    orcamentos:   orcSheet   ? parseOrcamentos(wb.Sheets[orcSheet])     : [],
  }
}

/** Normaliza nome para matching: "JOÃO DA SILVA" == "João da Silva" */
export function normalizeName(name: string): string {
  return name.toUpperCase().replace(/\s+/g, ' ').trim()
}

/** Remove tudo que não é dígito para matching de telefone */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}
