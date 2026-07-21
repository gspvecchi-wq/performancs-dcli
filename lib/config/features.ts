/**
 * Flags de visibilidade do front.
 *
 * As áreas marcadas como `false` ficam ocultas no menu/tela, mas o código e as
 * rotas continuam existindo — basta virar para `true` para trazê-las de volta.
 */
export const FEATURES = {
  // Itens do menu lateral
  filaDoDia:  false,
  alertas:    false,
  relatorios: false,

  // Cards da ficha do paciente
  contextoPaciente: false, // "Quem é {nome}?"
  correcoesRota:    false, // "Correções de rota"
} as const
