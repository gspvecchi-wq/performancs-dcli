import * as XLSX from 'xlsx'

export interface PatientImportRow {
  nome: string
  telefone?: string
  email?: string
  data_nascimento?: string
  objetivo?: string
  especialidade?: string
  plano_inicio?: string
  plano_fim?: string
  meta_kg?: number
  meta_prazo_meses?: number
  peso_inicial?: number
  motivacao?: string
  _errors: string[]
}

export interface FinanceiroImportRow {
  nome: string
  cpf?: string
  status_pagamento: 'adimplente' | 'inadimplente' | 'em_atraso' | 'desconhecido'
  _errors: string[]
}

const OBJETIVO_MAP: Record<string, string> = {
  'emagrecimento': 'emagrecimento',
  'perda de peso': 'emagrecimento',
  'emagrecer':     'emagrecimento',
  'massa':         'massa_muscular',
  'ganho de massa': 'massa_muscular',
  'musculação':    'massa_muscular',
  'saúde':         'saude_geral',
  'saude':         'saude_geral',
  'geral':         'saude_geral',
}

const STATUS_MAP: Record<string, 'adimplente' | 'inadimplente' | 'em_atraso'> = {
  'adimplente':   'adimplente',
  'ok':           'adimplente',
  'pago':         'adimplente',
  'ativo':        'adimplente',
  'inadimplente': 'inadimplente',
  'inad':         'inadimplente',
  'em atraso':    'em_atraso',
  'atraso':       'em_atraso',
  'atrasado':     'em_atraso',
  'pendente':     'em_atraso',
}

/**
 * Converte buffer de Excel/CSV em array de linhas de pacientes
 */
export function parsePatientSpreadsheet(buffer: Buffer): PatientImportRow[] {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const sheet    = workbook.Sheets[workbook.SheetNames[0]]
  const rows     = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

  return rows.map((row) => {
    const errors: string[] = []
    const get = (keys: string[]) => {
      for (const k of keys) {
        const val = row[k] ?? row[k.toLowerCase()] ?? row[k.toUpperCase()]
        if (val !== undefined && val !== '') return String(val).trim()
      }
      return ''
    }

    const nome = get(['nome', 'name', 'paciente'])
    if (!nome) errors.push('Nome obrigatório')

    const objetivoRaw = get(['objetivo', 'objetivo do tratamento', 'meta']).toLowerCase()
    const objetivo    = OBJETIVO_MAP[objetivoRaw] ?? 'saude_geral'

    const plano_inicio = formatDate(get(['plano_inicio', 'início', 'inicio', 'data inicio']))
    const plano_fim    = formatDate(get(['plano_fim', 'fim', 'data fim', 'vencimento']))
    if (!plano_fim) errors.push('Data de fim do plano obrigatória')

    return {
      nome,
      telefone:       get(['telefone', 'tel', 'phone', 'celular', 'whatsapp']) || undefined,
      email:          get(['email', 'e-mail']) || undefined,
      data_nascimento: formatDate(get(['data_nascimento', 'nascimento', 'data de nascimento'])) || undefined,
      objetivo,
      especialidade:  get(['especialidade', 'area', 'área']) || undefined,
      plano_inicio:   plano_inicio || new Date().toISOString().split('T')[0],
      plano_fim:      plano_fim || '',
      meta_kg:        parseFloat(get(['meta_kg', 'meta kg', 'meta'])) || undefined,
      meta_prazo_meses: parseInt(get(['meta_prazo', 'prazo meses', 'prazo'])) || undefined,
      peso_inicial:   parseFloat(get(['peso_inicial', 'peso inicial', 'peso'])) || undefined,
      motivacao:      get(['motivacao', 'motivação', 'observacao', 'observação', 'obs']) || undefined,
      _errors: errors,
    }
  })
}

/**
 * Converte buffer de planilha financeira em array de linhas
 */
export function parseFinanceiroSpreadsheet(buffer: Buffer): FinanceiroImportRow[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheet    = workbook.Sheets[workbook.SheetNames[0]]
  const rows     = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

  return rows.map((row) => {
    const errors: string[] = []
    const get = (keys: string[]) => {
      for (const k of keys) {
        const val = row[k] ?? row[k.toLowerCase()] ?? row[k.toUpperCase()]
        if (val !== undefined && val !== '') return String(val).trim()
      }
      return ''
    }

    const nome = get(['nome', 'name', 'paciente', 'cliente'])
    if (!nome) errors.push('Nome obrigatório')

    const statusRaw = get(['status', 'situação', 'situacao', 'pagamento']).toLowerCase()
    const statusPag = STATUS_MAP[statusRaw] ?? 'desconhecido'

    return {
      nome,
      cpf:              get(['cpf', 'document', 'doc']) || undefined,
      status_pagamento: statusPag,
      _errors: errors,
    }
  })
}

function formatDate(str: string): string {
  if (!str) return ''
  // Tenta detectar dd/mm/yyyy
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  // Tenta ISO
  const iso = new Date(str)
  if (!isNaN(iso.getTime())) return iso.toISOString().split('T')[0]
  return ''
}
