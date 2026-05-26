import type { WeightRecord } from '@/types/patient'
import { parseISO, differenceInWeeks } from 'date-fns'

export interface WeightProgress {
  pesoAtual: number
  pesoInicial: number
  variacao: number           // kg perdidos/ganhos (negativo = perda)
  percentualMeta: number     // 0-100%
  metaKg: number
  dentroMeta: boolean
  perdaSemanaAtual: number   // variação da última semana
  perdaMediaSemanal: number  // média histórica de variação semanal
  semanasSemPesagem: number  // semanas sem registrar peso
}

export interface WeightDeviation {
  pacienteMediaSemanal: number   // média de variação semanal do paciente (kg)
  clinicaMediaSemanal: number    // média da clínica
  desvioPadrao: number           // desvio padrão do paciente
  desvioClinica: number          // desvio padrão da clínica
  zScore: number                 // quantos desvios padrão acima/abaixo da média
  status: 'acima_media' | 'na_media' | 'abaixo_media'
}

/**
 * Calcula progresso de peso de um paciente
 */
export function calcWeightProgress(
  pesos: WeightRecord[],
  metaKg: number,
  objetivo: 'emagrecimento' | 'massa_muscular' | 'saude_geral',
  pesoInicial: number
): WeightProgress | null {
  if (pesos.length === 0) return null

  const sorted = [...pesos].sort(
    (a, b) => new Date(b.data_pesagem).getTime() - new Date(a.data_pesagem).getTime()
  )
  const pesoAtual = sorted[0].peso_kg
  const variacao = pesoAtual - pesoInicial
  const meta = objetivo === 'emagrecimento' ? -Math.abs(metaKg) : Math.abs(metaKg)
  const percentualMeta = meta !== 0 ? Math.min(100, Math.abs(variacao / meta) * 100) : 0
  const dentroMeta =
    objetivo === 'emagrecimento' ? variacao <= 0 : variacao >= 0

  // Variação da última semana
  const ultimosPesos = sorted.slice(0, 2)
  const perdaSemanaAtual =
    ultimosPesos.length === 2 ? ultimosPesos[0].peso_kg - ultimosPesos[1].peso_kg : 0

  // Média semanal histórica
  const variacoes = calcVariacoesSemana(sorted)
  const perdaMediaSemanal =
    variacoes.length > 0
      ? variacoes.reduce((a, b) => a + b, 0) / variacoes.length
      : 0

  // Semanas sem pesagem
  const dataUltimaP = parseISO(sorted[0].data_pesagem)
  const semanasSemPesagem = Math.max(0, differenceInWeeks(new Date(), dataUltimaP))

  return {
    pesoAtual,
    pesoInicial,
    variacao,
    percentualMeta,
    metaKg: meta,
    dentroMeta,
    perdaSemanaAtual,
    perdaMediaSemanal,
    semanasSemPesagem,
  }
}

function calcVariacoesSemana(sortedPesos: WeightRecord[]): number[] {
  const variacoes: number[] = []
  for (let i = 0; i < sortedPesos.length - 1; i++) {
    const diff = sortedPesos[i].peso_kg - sortedPesos[i + 1].peso_kg
    const daysDiff =
      (new Date(sortedPesos[i].data_pesagem).getTime() -
        new Date(sortedPesos[i + 1].data_pesagem).getTime()) /
      (1000 * 60 * 60 * 24 * 7)
    if (daysDiff > 0) {
      variacoes.push(diff / daysDiff) // normalizado por semana
    }
  }
  return variacoes
}

/**
 * Calcula desvio padrão e z-score em relação à média da clínica
 * clinicaVariacoes: array de variações semanais médias de todos os pacientes
 */
export function calcWeightDeviation(
  pacientePesos: WeightRecord[],
  clinicaVariacoes: number[]
): WeightDeviation | null {
  if (pacientePesos.length < 2 || clinicaVariacoes.length === 0) return null

  const sorted = [...pacientePesos].sort(
    (a, b) => new Date(b.data_pesagem).getTime() - new Date(a.data_pesagem).getTime()
  )
  const variacoesPaciente = calcVariacoesSemana(sorted)
  if (variacoesPaciente.length === 0) return null

  const mediaP =
    variacoesPaciente.reduce((a, b) => a + b, 0) / variacoesPaciente.length

  const mediaC = clinicaVariacoes.reduce((a, b) => a + b, 0) / clinicaVariacoes.length

  const dpP = stdDev(variacoesPaciente)
  const dpC = stdDev(clinicaVariacoes)

  const z = dpC > 0 ? (mediaP - mediaC) / dpC : 0

  let status: WeightDeviation['status']
  if (z > 0.5) status = 'acima_media'
  else if (z < -0.5) status = 'abaixo_media'
  else status = 'na_media'

  return {
    pacienteMediaSemanal: mediaP,
    clinicaMediaSemanal: mediaC,
    desvioPadrao: dpP,
    desvioClinica: dpC,
    zScore: z,
    status,
  }
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const sq = values.map((v) => (v - mean) ** 2)
  return Math.sqrt(sq.reduce((a, b) => a + b, 0) / (values.length - 1))
}

/** Meta de peso esperada por semana (clínica usa 4-5 kg/mês) */
export const META_PERDA_SEMANAL_MIN = 4 / 4.33   // ~0.92 kg/semana
export const META_PERDA_SEMANAL_MAX = 5 / 4.33   // ~1.15 kg/semana

export function isForeMetaClinica(perdaSemanalMedia: number): boolean {
  return Math.abs(perdaSemanalMedia) < META_PERDA_SEMANAL_MIN
}
