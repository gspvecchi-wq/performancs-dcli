export type PatientStatus = 'ativo' | 'inativo' | 'concluido' | 'cancelado'
export type PatientLevel = 'alto' | 'medio' | 'baixo'
export type PatientObjective = 'emagrecimento' | 'massa_muscular' | 'saude_geral'
export type PaymentStatus = 'adimplente' | 'inadimplente' | 'em_atraso' | 'desconhecido'

export interface Patient {
  id: string
  clinica_id: string
  nome: string
  telefone: string | null
  email: string | null
  prontuario: string | null
  cpf: string | null
  data_nascimento: string | null
  objetivo: PatientObjective
  meta_kg: number | null
  meta_prazo_meses: number | null
  peso_inicial: number | null
  peso_atual: number | null
  foto_url: string | null
  motivacao: string | null
  historico_saude: string | null
  alertas_contexto: string | null
  plano_inicio: string
  plano_fim: string
  plano_fim_previsto: string | null
  especialidade: string | null
  status: PatientStatus
  score: number
  nivel: PatientLevel
  status_pagamento: PaymentStatus
  status_pagamento_atualizado_em: string | null
  valor_plano: number | null
  valor_pago: number | null
  criado_por: string | null
  criado_em: string
  atualizado_em: string
}

export interface PatientWithMoments extends Patient {
  execucoes: ProtocolExecution[]
  contatos: Contact[]
  pesos: WeightRecord[]
  alertas: Alert[]
}

export interface ProtocolExecution {
  id: string
  paciente_id: string
  momento_id: string
  status: 'futuro' | 'pendente' | 'atual' | 'executado' | 'risco' | 'cancelado'
  data_prevista: string
  data_execucao: string | null
  mensagem_enviada: string | null
  resposta_paciente: string | null
  analise_ia: string | null
  score_resposta: number | null
  executado_por: string | null
  criado_em: string
  momento?: ProtocolMoment
}

export interface ProtocolMoment {
  id: string
  clinica_id: string
  ordem: number
  label: string
  offset_dias: number
  pergunta: string
  ativo: boolean
}

export interface Contact {
  id: string
  paciente_id: string
  clinica_id: string
  execucao_id: string | null
  tipo: 'enviado' | 'recebido' | 'automatico'
  canal: string
  mensagem: string
  resposta: string | null
  analise_ia: string | null
  status_whatsapp: 'enviando' | 'entregue' | 'lido' | 'erro' | null
  whatsapp_message_id: string | null
  enviado_por: string | null
  criado_em: string
}

export interface WeightRecord {
  id: string
  paciente_id: string
  clinica_id: string
  peso_kg: number
  data_pesagem: string
  data_real_conhecida: boolean
  observacao: string | null
  registrado_por: string | null
  criado_em: string
}

export interface Alert {
  id: string
  clinica_id: string
  paciente_id: string | null
  tipo: AlertType
  severidade: AlertSeverity
  titulo: string
  descricao: string | null
  resolvido: boolean
  resolvido_por: string | null
  resolvido_em: string | null
  metadata: Record<string, unknown> | null
  criado_em: string
  paciente?: Patient
}

export type AlertType =
  | 'plano_vencendo'
  | 'protocolo_atrasado'
  | 'peso_fora_meta'
  | 'data_manipulada'
  | 'sem_contato'
  | 'risco_evasao'
  | 'renovacao'
  | 'upsell'
  | 'confirmacao_agendamento'

export type AlertSeverity = 'critico' | 'atencao' | 'info'

export interface FilaItem {
  id: string
  clinica_id: string
  paciente_id: string
  data_fila: string
  prioridade: number
  motivo: string
  mensagem_sugerida: string
  status: 'pendente' | 'enviado' | 'concluido'
  enviado_em: string | null
  contato_id: string | null
  criado_em: string
  paciente?: Patient
}

export interface Agendamento {
  id: string
  paciente_id: string
  clinica_id: string
  label: string
  data_agendamento: string | null   // NULL = ainda não agendado no SupportClinic
  hora: string | null
  profissional: string | null
  status: 'agendado' | 'atendido' | 'cancelado' | 'remarcado' | 'a_agendar'
  observacao: string | null
  alerta_d1_enviado: boolean
  criado_em: string
}

export interface PlanoItemView {
  id: string
  procedimento_id: string
  qtd_prevista: number
  qtd_realizada: number
  qtd_restante: number
  fonte: string
  procedimento: {
    nome: string
    categoria: string
    frequencia_dias: number
  } | null
}

export interface RouteCorrection {
  id: string
  paciente_id: string
  registrado_por: string
  desvio: string
  acao_corretiva: string
  criado_em: string
}

export interface DashboardStats {
  total_ativos: number
  em_risco: number
  bom: number
  excelente: number
  acionamentos_hoje: number
  alertas_abertos: number
}
