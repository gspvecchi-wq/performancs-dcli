/**
 * @deprecated Use `healthScore.ts` — este módulo é mantido apenas para compatibilidade.
 * O health score unificado está em `lib/scoring/healthScore.ts`.
 */

export {
  calcHealthScore as calcEngagementScore,
  getScoreColor,
  getScoreTailwindColor,
  getScoreLabel,
  getScoreLevel,
  type HealthScoreResult as ScoreBreakdown,
} from './healthScore'
