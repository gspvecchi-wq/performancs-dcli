import type { ProtocolExecution, Contact } from '@/types/patient'
import { daysSince } from '@/lib/utils/format'

export interface ScoreBreakdown {
  execucao: number     // 0-40
  respostas: number    // 0-30
  velocidade: number   // 10 ou 20
  recencia: number     // 0 ou 10
  total: number        // 0-100
}

export type ScoreLevel = 'risco' | 'bom' | 'excelente'

export function calcEngagementScore(
  execucoes: ProtocolExecution[],
  contatos: Contact[]
): ScoreBreakdown {
  // 40% — execução de momentos do plano de acompanhamento
  const total = execucoes.length
  const feitos = execucoes.filter((e) => e.status === 'executado').length
  const execucao = total > 0 ? Math.round((feitos / total) * 40) : 0

  // 30% — taxa de resposta histórica
  const enviados = contatos.filter((c) => c.tipo === 'enviado')
  const comResposta = enviados.filter((c) => c.resposta && c.resposta.trim().length > 0)
  const taxaResposta = enviados.length > 0 ? comResposta.length / enviados.length : 0
  const respostas = Math.round(taxaResposta * 30)

  // 20% — velocidade de resposta (heurística: score_resposta alto indica rápido)
  const scoresR = execucoes
    .filter((e) => e.score_resposta !== null)
    .map((e) => e.score_resposta as number)
  const mediaScore = scoresR.length > 0 ? scoresR.reduce((a, b) => a + b, 0) / scoresR.length : 50
  const velocidade = mediaScore >= 70 ? 20 : 10

  // 10% — recência do último contato
  const sortedContatos = [...contatos].sort(
    (a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
  )
  const ultimo = sortedContatos[0]
  const recencia = ultimo && daysSince(ultimo.criado_em) < 7 ? 10 : 0

  const total_score = Math.min(100, execucao + respostas + velocidade + recencia)

  return { execucao, respostas, velocidade, recencia, total: total_score }
}

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 75) return 'excelente'
  if (score >= 50) return 'bom'
  return 'risco'
}

export function getScoreColor(score: number): string {
  if (score >= 75) return 'var(--color-emerald-600)'
  if (score >= 50) return 'var(--color-green-600)'
  return 'var(--color-red-500)'
}

export function getScoreTailwindColor(score: number): string {
  if (score >= 75) return 'emerald'
  if (score >= 50) return 'green'
  return 'red'
}

export function getScoreLabel(score: number): string {
  if (score >= 75) return 'Excelente'
  if (score >= 50) return 'Bom'
  return 'Em risco'
}
