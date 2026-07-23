/**
 * Score de Engajamento — PerformanCS D'Clinique
 *
 * Composição acordada com a clínica:
 *   • Comparecimento  40%  → sessões atendidas ÷ sessões que chegaram a ser
 *                            AGENDADAS e cuja data já passou. Agendamento futuro
 *                            não pune; quem nunca foi agendado não entra na conta.
 *   • Meta de peso    30%  → progresso rumo à meta, respeitando a direção
 *                            (emagrecimento ↓ ou hipertrofia ↑).
 *   • NPS             30%  → satisfação declarada pelo paciente (0–10 → 0–100).
 *
 * REDISTRIBUIÇÃO: um componente sem dado não zera o score — o peso dele é
 * diluído entre os disponíveis. Assim um paciente novo (sem NPS, sem meta) não
 * "nasce" com nota baixa por falta de informação.
 */

export const PESOS = {
  comparecimento: 0.40,
  meta:           0.30,
  nps:            0.30,
} as const

export interface EngajamentoInput {
  /** Sessões atendidas (status 'atendido') com data já passada */
  sessoesAtendidas: number
  /** Sessões agendadas com data já passada (atendidas + faltas/cancelamentos) */
  sessoesCobradas: number
  /** Progresso da meta de peso, 0–100 (null = meta não definida ou sem pesagem) */
  progressoMetaPct: number | null
  /** Última nota NPS, 0–10 (null = ainda não respondeu) */
  npsNota: number | null
}

export interface ComponenteEngajamento {
  chave: 'comparecimento' | 'meta' | 'nps'
  label: string
  /** Valor do componente, 0–100 (null quando indisponível) */
  valor: number | null
  /** Peso efetivo aplicado (já redistribuído), 0–1 */
  peso: number
  disponivel: boolean
}

export interface EngajamentoResult {
  /** 0–100. null quando não há NENHUM dado para pontuar. */
  total: number | null
  componentes: ComponenteEngajamento[]
  nivel: 'alto' | 'medio' | 'baixo'
  label: 'Excelente' | 'Bom' | 'Em risco' | 'Sem dados'
}

function clamp0a100(v: number): number {
  return Math.max(0, Math.min(100, v))
}

export function calcEngajamento(input: EngajamentoInput): EngajamentoResult {
  // ── Componente 1: comparecimento ──
  const comparecimento =
    input.sessoesCobradas > 0
      ? clamp0a100((input.sessoesAtendidas / input.sessoesCobradas) * 100)
      : null

  // ── Componente 2: meta de peso ──
  const meta = input.progressoMetaPct != null ? clamp0a100(input.progressoMetaPct) : null

  // ── Componente 3: NPS (0–10 → 0–100) ──
  const nps = input.npsNota != null ? clamp0a100((input.npsNota / 10) * 100) : null

  const brutos: { chave: ComponenteEngajamento['chave']; label: string; valor: number | null; pesoBase: number }[] = [
    { chave: 'comparecimento', label: 'Comparecimento', valor: comparecimento, pesoBase: PESOS.comparecimento },
    { chave: 'meta',           label: 'Meta de peso',   valor: meta,           pesoBase: PESOS.meta },
    { chave: 'nps',            label: 'NPS',            valor: nps,            pesoBase: PESOS.nps },
  ]

  const disponiveis = brutos.filter((c) => c.valor != null)
  const somaPesos = disponiveis.reduce((s, c) => s + c.pesoBase, 0)

  // Nenhum dado ainda — não inventa nota
  if (disponiveis.length === 0 || somaPesos === 0) {
    return {
      total: null,
      componentes: brutos.map((c) => ({
        chave: c.chave, label: c.label, valor: null, peso: 0, disponivel: false,
      })),
      nivel: 'medio',
      label: 'Sem dados',
    }
  }

  // Redistribui o peso dos ausentes entre os presentes
  const componentes: ComponenteEngajamento[] = brutos.map((c) => ({
    chave: c.chave,
    label: c.label,
    valor: c.valor,
    peso: c.valor != null ? c.pesoBase / somaPesos : 0,
    disponivel: c.valor != null,
  }))

  const total = Math.round(
    componentes.reduce((s, c) => s + (c.valor ?? 0) * c.peso, 0),
  )

  return {
    total,
    componentes,
    nivel: nivelDe(total),
    label: labelDe(total),
  }
}

export function nivelDe(score: number): 'alto' | 'medio' | 'baixo' {
  if (score >= 75) return 'alto'
  if (score >= 50) return 'medio'
  return 'baixo'
}

export function labelDe(score: number): 'Excelente' | 'Bom' | 'Em risco' {
  if (score >= 75) return 'Excelente'
  if (score >= 50) return 'Bom'
  return 'Em risco'
}

/**
 * Comparecimento a partir da lista de agendamentos do paciente.
 * Só conta o que já passou e chegou a ser agendado — futuro não pune.
 */
export function calcComparecimento(
  agendamentos: { data_agendamento: string | null; status: string }[],
  hojeIso = new Date().toISOString().split('T')[0],
): { atendidas: number; cobradas: number; pct: number | null } {
  let atendidas = 0
  let cobradas = 0

  for (const ag of agendamentos) {
    if (!ag.data_agendamento) continue          // ainda não agendado
    if (ag.data_agendamento > hojeIso) continue // futuro não entra
    if (ag.status === 'a_agendar') continue
    if (ag.status === 'remarcado') continue     // virou outro agendamento

    cobradas++
    if (ag.status === 'atendido') atendidas++
  }

  return {
    atendidas,
    cobradas,
    pct: cobradas > 0 ? Math.round((atendidas / cobradas) * 100) : null,
  }
}
