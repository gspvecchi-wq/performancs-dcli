import { randomBytes } from 'crypto'

/** Pergunta padrão do NPS — ajustável pela clínica. */
export const PERGUNTA_NPS =
  'De 0 a 10, o quanto você recomendaria a D\'Clinique para um amigo ou familiar?'

export type ClasseNps = 'promotor' | 'neutro' | 'detrator'

/** Classificação clássica do NPS. */
export function classificarNps(nota: number): ClasseNps {
  if (nota >= 9) return 'promotor'
  if (nota >= 7) return 'neutro'
  return 'detrator'
}

export const NPS_LABEL: Record<ClasseNps, string> = {
  promotor: 'Promotor',
  neutro:   'Neutro',
  detrator: 'Detrator',
}

/**
 * Satisfação normalizada 0–100 a partir da nota NPS (0–10).
 * Alimenta o eixo "satisfação" do mapa de calor e o score de engajamento.
 */
export function satisfacaoDeNps(nota: number | null | undefined): number | null {
  if (nota == null) return null
  return Math.round((Math.min(10, Math.max(0, nota)) / 10) * 100)
}

/** Considera "satisfeito" a partir de 7 (neutro/promotor) — eixo do mapa 2×2. */
export function estaSatisfeito(nota: number | null | undefined): boolean | null {
  if (nota == null) return null
  return nota >= 7
}

/** Token opaco para o link público da pesquisa. */
export function gerarToken(): string {
  return randomBytes(16).toString('base64url')
}

/**
 * NPS agregado da carteira: % promotores − % detratores (−100 a +100).
 * Considera apenas quem respondeu.
 */
export function calcularNpsGeral(notas: number[]): number | null {
  if (notas.length === 0) return null
  let promotores = 0
  let detratores = 0
  for (const n of notas) {
    const c = classificarNps(n)
    if (c === 'promotor') promotores++
    else if (c === 'detrator') detratores++
  }
  return Math.round(((promotores - detratores) / notas.length) * 100)
}

/** Dias antes do fim previsto para disparar a pesquisa de encerramento. */
export const DIAS_ANTES_DO_FIM = 45
