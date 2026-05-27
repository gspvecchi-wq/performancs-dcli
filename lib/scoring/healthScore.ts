/**
 * Health Score Unificado — PerformanCS D'Clinique
 *
 * Fonte primária: `pacientes.score` calculado pelo trigger PostgreSQL
 *   → attendance_rate(60%) + recency(20%) + plan_progress(20%)
 *
 * Componente WhatsApp (dinâmico):
 *   → Só ativa quando há ≥ 3 mensagens enviadas registradas
 *   → Quando ativo, redistribui pesos: clínico(75%) + whatsapp(25%)
 *   → Blended = round(dbScore × 0.75 + taxaResposta × 100 × 0.25)
 *
 * Pagamento NÃO entra no score (tratado separadamente como indicador de risco).
 */

import type { Contact } from '@/types/patient'

// ── Tipos públicos ──────────────────────────────────────────────────────────

export interface HealthScoreBreakdown {
  label: string
  pts: number
  max: number
  /** cor Tailwind para a barra: 'emerald' | 'blue' | 'violet' | 'amber' */
  color: 'emerald' | 'blue' | 'violet' | 'amber'
}

export interface HealthScoreResult {
  /** Score final exibido (0–100) */
  total: number
  /** Score puro do banco (somente clínico) */
  dbScore: number
  /** Se o componente WhatsApp está ativo neste cálculo */
  whatsappActive: boolean
  /** Pts contribuídos pelo WhatsApp (0–25 quando ativo, 0 quando inativo) */
  whatsappPts: number
  /** Detalhamento para exibição no perfil */
  breakdown: HealthScoreBreakdown[]
  /** Nível derivado do score final */
  nivel: 'alto' | 'medio' | 'baixo'
  /** Classificação legível */
  label: 'Excelente' | 'Bom' | 'Em risco'
}

// ── Constante ───────────────────────────────────────────────────────────────

const MIN_MSGS_PARA_WHATSAPP = 3

// ── Função principal ────────────────────────────────────────────────────────

export function calcHealthScore(
  dbScore: number,
  contatos: Contact[],
): HealthScoreResult {
  const enviados = contatos.filter(
    (c) => c.tipo === 'enviado' || c.tipo === 'automatico',
  )
  const comResposta = enviados.filter(
    (c) => c.resposta && c.resposta.trim().length > 0,
  )

  const nivel   = dbScoreNivel(dbScore)
  const scoreLbl = dbScoreLabel(dbScore)

  // ── Sem histórico suficiente → score puro do banco ──
  if (enviados.length < MIN_MSGS_PARA_WHATSAPP) {
    return {
      total:           dbScore,
      dbScore,
      whatsappActive:  false,
      whatsappPts:     0,
      nivel,
      label:           scoreLbl,
      breakdown: [
        { label: 'Comparecimento', pts: Math.round(dbScore * 0.6), max: 60, color: 'emerald' },
        { label: 'Recência',       pts: Math.round(dbScore * 0.2), max: 20, color: 'blue'    },
        { label: 'Progresso',      pts: Math.round(dbScore * 0.2), max: 20, color: 'violet'  },
      ],
    }
  }

  // ── Com histórico WhatsApp ──────────────────────────────────────────────
  const taxaResposta  = comResposta.length / enviados.length   // 0–1
  const whatsappScore = Math.round(taxaResposta * 100)          // 0–100
  const whatsappPts   = Math.round(whatsappScore * 0.25)        // 0–25
  const blended       = Math.min(100, Math.round(dbScore * 0.75 + whatsappScore * 0.25))

  return {
    total:          blended,
    dbScore,
    whatsappActive: true,
    whatsappPts,
    nivel:          dbScoreNivel(blended),
    label:          dbScoreLabel(blended),
    breakdown: [
      { label: 'Comparecimento', pts: Math.round(dbScore * 0.45), max: 45, color: 'emerald' },
      { label: 'Recência',       pts: Math.round(dbScore * 0.15), max: 15, color: 'blue'    },
      { label: 'Progresso',      pts: Math.round(dbScore * 0.15), max: 15, color: 'violet'  },
      { label: 'WhatsApp',       pts: whatsappPts,                max: 25, color: 'amber'   },
    ],
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function dbScoreNivel(score: number): 'alto' | 'medio' | 'baixo' {
  if (score >= 75) return 'alto'
  if (score >= 50) return 'medio'
  return 'baixo'
}

function dbScoreLabel(score: number): 'Excelente' | 'Bom' | 'Em risco' {
  if (score >= 75) return 'Excelente'
  if (score >= 50) return 'Bom'
  return 'Em risco'
}

// ── Exportações auxiliares (compat) ──────────────────────────────────────────

export function getScoreColor(score: number): string {
  if (score >= 75) return '#059669'
  if (score >= 50) return '#16a34a'
  return '#dc2626'
}

export function getScoreTailwindColor(score: number): string {
  if (score >= 75) return 'emerald'
  if (score >= 50) return 'green'
  return 'red'
}

export { dbScoreLabel as getScoreLabel }
export { dbScoreNivel as getScoreLevel }
