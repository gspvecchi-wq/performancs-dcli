/**
 * Previsão dinâmica do fim do plano.
 *
 * O fim CONTRATADO é fixo (início + duração do procedimento mais longo). Mas o
 * cronograma real escorrega: o paciente falta, remarca, e a última sessão acaba
 * caindo muito depois do combinado.
 *
 * A previsão ancora no ritmo REAL: parte da última sessão efetivamente realizada
 * (ou do início, se nada foi feito) e projeta as sessões restantes na frequência
 * de cada procedimento. É esta data que deve disparar o NPS ("45 dias antes de
 * encerrar") e os alertas de vencimento.
 */

export interface ItemPrevisao {
  qtd_prevista: number
  qtd_realizada: number
  frequencia_dias: number   // 0 = dose única (não projeta recorrência)
}

function addDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  if (isNaN(d.getTime())) return iso
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().split('T')[0]
}

function hojeIso(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * @param planoInicio      início do plano (ISO)
 * @param itens            itens do plano com previsto/realizado/frequência
 * @param ultimaSessaoIso  data da última sessão realizada (ISO), se conhecida
 */
export function calcularFimPrevisto(
  planoInicio: string | null,
  itens: ItemPrevisao[],
  ultimaSessaoIso?: string | null,
): string | null {
  if (!planoInicio || itens.length === 0) return null

  // Dias ainda necessários = procedimento que mais demora a terminar
  const diasRestantes = Math.max(
    0,
    ...itens.map((it) => {
      const restante = Math.max(it.qtd_prevista - it.qtd_realizada, 0)
      if (restante <= 0 || it.frequencia_dias <= 0) return 0
      // a próxima sessão ocorre daqui a 1 intervalo; as demais, na sequência
      return restante * it.frequencia_dias
    }),
  )

  // Nada a fazer: o plano termina na última sessão realizada (ou no início)
  if (diasRestantes === 0) return ultimaSessaoIso ?? planoInicio

  // Âncora: de onde o cronograma retoma. Usamos a mais recente entre a última
  // sessão e hoje — se o paciente parou há meses, a projeção parte de agora.
  const hoje = hojeIso()
  let ancora = ultimaSessaoIso && ultimaSessaoIso > planoInicio ? ultimaSessaoIso : planoInicio
  if (ancora < hoje) ancora = hoje

  return addDias(ancora, diasRestantes)
}

/** Dias entre hoje e uma data ISO (negativo = já passou). */
export function diasAte(iso: string | null): number | null {
  if (!iso) return null
  const alvo = new Date(`${iso}T00:00:00Z`).getTime()
  const hoje = new Date(`${hojeIso()}T00:00:00Z`).getTime()
  if (isNaN(alvo)) return null
  return Math.round((alvo - hoje) / 86_400_000)
}
