import { PDFParse } from 'pdf-parse'

// ─── Tipos de saída ───────────────────────────────────────────────────────────

export interface PlanoItem {
  procedimento: string      // ex.: "Injetáveis EV - Plano"
  qtd_prevista: number      // nº de sessões
  frequencia_texto: string  // ex.: "1 vez por semana"
  frequencia_dias: number   // 7 (semanal), 14 (quinzenal), 30 (mensal)
}

export interface PlanoPdfData {
  paciente_nome: string
  prontuario: string | null
  cpf: string | null
  telefone: string | null
  plano_inicio: string | null   // ISO YYYY-MM-DD (data de emissão do PDF)
  plano_fim: string | null      // ISO — calculado (início + procedimento mais longo)
  itens: PlanoItem[]
  _avisos: string[]             // problemas de extração para revisão manual
}

// ─── Constantes de domínio ─────────────────────────────────────────────────────

const MESES: Record<string, string> = {
  janeiro: '01', fevereiro: '02', 'março': '03', marco: '03', abril: '04',
  maio: '05', junho: '06', julho: '07', agosto: '08', setembro: '09',
  outubro: '10', novembro: '11', dezembro: '12',
}

/**
 * "1 vez por semana" → 7 · "quinzenal" → 14 · "mensal" → 30 · "dose única" → 0
 * frequencia_dias === 0 significa procedimento sem recorrência (não gera
 * agendamento periódico e não influencia o fim do plano).
 */
function frequenciaParaDias(txt: string): number {
  const t = txt.toLowerCase()
  if (/dose [úu]nica|[úu]nica|avuls/.test(t)) return 0
  if (/quinzen|15 dias|a cada 15/.test(t)) return 14
  if (/mensal|por m[êe]s|30 dias/.test(t)) return 30
  if (/semana|semanal|7 dias/.test(t)) return 7
  return 7 // padrão: semanal (formato-padrão da clínica)
}

/**
 * pdf-parse converte a ligadura tipográfica "ﬁ" (U+FB01) em caractere nulo
 * (U+0000). Ex.: "Prossional" → "Profissional", "vericada" →
 * "verificada". Restauramos "fi" (caso dominante) e removemos demais caracteres
 * de controle, preservando tab, newline e carriage-return.
 */
function sanitize(text: string): string {
  return text
    .replace(/\u0000/g, 'fi')
    .replace(/[\u0001-\u0008\u000b\u000c\u000e-\u001f]/g, '')
}

// ─── Extração ──────────────────────────────────────────────────────────────────

/** Recebe o texto já extraído do PDF e devolve os dados estruturados. */
export function parsePlanoText(rawText: string): PlanoPdfData {
  const text = sanitize(rawText)
  const lines = text.split('\n').map((l) => l.trim())
  const avisos: string[] = []

  // Nome do paciente — linha "Paciente: ..."
  const nomeMatch = text.match(/Paciente:\s*(.+)/)
  const paciente_nome = nomeMatch ? nomeMatch[1].trim() : ''
  if (!paciente_nome) avisos.push('Nome do paciente não encontrado no PDF')

  const prontMatch = text.match(/Prontu[áa]rio:\s*(\d+)/)
  const prontuario = prontMatch ? prontMatch[1] : null

  // CPF do PACIENTE — o primeiro "CPF:" DEPOIS do bloco "Paciente:"
  // (o topo do PDF traz o CPF da médica, que devemos ignorar).
  let cpf: string | null = null
  const pacIdx = text.indexOf('Paciente:')
  if (pacIdx >= 0) {
    const cpfMatch = text.slice(pacIdx).match(/CPF:\s*([\d.\-]+)/)
    if (cpfMatch) cpf = cpfMatch[1].trim()
  }

  // Telefone do PACIENTE — "Telefone:" (singular). A médica usa "Telefones:" (plural).
  const telMatch = text.match(/(?:^|\n)Telefone:\s*([^\n]+)/)
  const telefone = telMatch ? telMatch[1].trim() : null

  // Início do plano = data de emissão assinada pela Dra.
  let plano_inicio: string | null = null
  const dataMatch = text.match(/Data de emiss[ãa]o:\s*(\d{1,2})\s+de\s+([A-Za-zçÇ]+)\s+de\s+(\d{4})/i)
  if (dataMatch) {
    const dia = dataMatch[1].padStart(2, '0')
    const mes = MESES[dataMatch[2].toLowerCase()]
    const ano = dataMatch[3]
    if (mes) plano_inicio = `${ano}-${mes}-${dia}`
    else avisos.push(`Mês da data de emissão não reconhecido: "${dataMatch[2]}"`)
  } else {
    avisos.push('Data de emissão (início do plano) não encontrada')
  }

  // Itens: ancoramos na linha "Aplicação: N sessões ..." e pegamos o nome do
  // procedimento na linha não-vazia imediatamente anterior. Robusto a nomes que
  // não terminam em "- Plano".
  const itens: PlanoItem[] = []
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/Aplica[çc][ãa]o:\s*(\d+)\s*sess[õo]es?\s*(.*)/i)
    if (!m) continue

    // procura o rótulo do procedimento acima
    let label = ''
    for (let j = i - 1; j >= 0; j--) {
      if (lines[j]) { label = lines[j]; break }
    }
    if (!label) {
      avisos.push(`Procedimento sem nome antes de "${lines[i]}"`)
      continue
    }

    const qtd = parseInt(m[1], 10)
    const freqTexto = m[2].trim() || '1 vez por semana'
    itens.push({
      procedimento: label,
      qtd_prevista: qtd,
      frequencia_texto: freqTexto,
      frequencia_dias: frequenciaParaDias(freqTexto),
    })
  }

  if (itens.length === 0) avisos.push('Nenhum item de plano encontrado no PDF')

  return {
    paciente_nome,
    prontuario,
    cpf,
    telefone,
    plano_inicio,
    plano_fim: plano_inicio ? computePlanoFim(plano_inicio, itens) : null,
    itens,
    _avisos: avisos,
  }
}

/** Extrai o texto do PDF (Buffer) e parseia. Uso server-side (API Route). */
export async function parsePlanoPdf(buffer: Buffer): Promise<PlanoPdfData> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) })
  const result = await parser.getText()
  return parsePlanoText(result.text)
}

/**
 * Fim do plano = data da última sessão prevista do procedimento mais longo.
 * Cada procedimento roda em paralelo (mesma visita), então quem manda é o de
 * maior duração total = (nº de sessões − 1) × intervalo. Regra editável na UI.
 */
export function computePlanoFim(inicioIso: string, itens: PlanoItem[]): string | null {
  if (!inicioIso || itens.length === 0) return null
  const maxDias = Math.max(
    ...itens.map((it) => Math.max(it.qtd_prevista - 1, 0) * it.frequencia_dias),
  )
  const d = new Date(`${inicioIso}T00:00:00Z`)
  if (isNaN(d.getTime())) return null
  d.setUTCDate(d.getUTCDate() + maxDias)
  return d.toISOString().split('T')[0]
}
