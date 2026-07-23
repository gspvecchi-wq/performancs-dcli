export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// ─── Tipos de linha (Row types) ───────────────────────────────────────────────
// IMPORTANTE: usar `type` (não `interface`) para compatibilidade com SupabaseClient generics

export type ClinicaRow = {
  id: string
  nome: string
  slug: string
  plano: string
  whatsapp_config: Json | null
  criado_em: string
}

export type UsuarioRow = {
  id: string
  clinica_id: string
  nome: string
  email: string
  papel: string
  avatar_url: string | null
  criado_em: string
}

export type PacienteRow = {
  id: string
  clinica_id: string
  nome: string
  telefone: string | null
  email: string | null
  prontuario: string | null
  cpf: string | null
  data_nascimento: string | null
  objetivo: string
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
  status: string
  score: number
  nivel: string
  status_pagamento: string
  status_pagamento_atualizado_em: string | null
  valor_plano: number | null
  valor_pago: number | null
  criado_por: string | null
  criado_em: string
  atualizado_em: string
}

export type ProtocoloMomentoRow = {
  id: string
  clinica_id: string
  ordem: number
  label: string
  offset_dias: number
  pergunta: string
  ativo: boolean
}

export type ExecucaoProtocoloRow = {
  id: string
  paciente_id: string
  momento_id: string
  status: string
  data_prevista: string
  data_execucao: string | null
  mensagem_enviada: string | null
  resposta_paciente: string | null
  analise_ia: string | null
  score_resposta: number | null
  executado_por: string | null
  criado_em: string
}

export type ContatoRow = {
  id: string
  paciente_id: string
  clinica_id: string
  execucao_id: string | null
  tipo: string
  canal: string
  mensagem: string
  resposta: string | null
  analise_ia: string | null
  status_whatsapp: string | null
  whatsapp_message_id: string | null
  enviado_por: string | null
  criado_em: string
}

export type PesoRow = {
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

export type AlertaRow = {
  id: string
  clinica_id: string
  paciente_id: string | null
  tipo: string
  severidade: string
  titulo: string
  descricao: string | null
  resolvido: boolean
  resolvido_por: string | null
  resolvido_em: string | null
  metadata: Json | null
  criado_em: string
}

export type FilaDoDiaRow = {
  id: string
  clinica_id: string
  paciente_id: string
  data_fila: string
  prioridade: number
  motivo: string
  mensagem_sugerida: string
  status: string
  enviado_em: string | null
  contato_id: string | null
  criado_em: string
}

export type AgendamentoRow = {
  id: string
  paciente_id: string
  clinica_id: string
  label: string
  data_agendamento: string | null
  hora: string | null
  profissional: string | null
  status: string
  observacao: string | null
  alerta_d1_enviado: boolean
  criado_em: string
}

export type ProcedimentoRow = {
  id: string
  clinica_id: string
  nome: string
  categoria: string
  frequencia_dias: number
  rastrear: boolean
  ativo: boolean
  criado_em: string
}

export type PlanoItemRow = {
  id: string
  paciente_id: string
  procedimento_id: string
  qtd_prevista: number
  qtd_realizada: number
  qtd_restante: number
  orcamento_id: string | null
  fonte: string
  editado_manual: boolean
  criado_em: string
  atualizado_em: string
}

export type CorrecaoRotaRow = {
  id: string
  paciente_id: string
  registrado_por: string
  desvio: string
  acao_corretiva: string
  criado_em: string
}

export type AuditLogRow = {
  id: string
  clinica_id: string
  usuario_id: string | null
  tabela: string
  operacao: string
  registro_id: string | null
  dados_antes: Json | null
  dados_depois: Json | null
  ip: string | null
  user_agent: string | null
  criado_em: string
}

// ─── Database type completo (compatível com @supabase/supabase-js 2.x) ────────

export type Database = {
  public: {
    Tables: {
      clinicas: {
        Row: ClinicaRow
        Insert: Omit<ClinicaRow, 'id' | 'criado_em'>
        Update: Partial<Omit<ClinicaRow, 'id' | 'criado_em'>>
        Relationships: []
      }
      usuarios: {
        Row: UsuarioRow
        Insert: Omit<UsuarioRow, 'criado_em'>
        Update: Partial<Omit<UsuarioRow, 'id' | 'criado_em'>>
        Relationships: []
      }
      pacientes: {
        Row: PacienteRow
        Insert: Omit<PacienteRow, 'id' | 'criado_em' | 'atualizado_em' | 'prontuario' | 'cpf' | 'plano_fim_previsto'>
          & { prontuario?: string | null; cpf?: string | null; plano_fim_previsto?: string | null }
        Update: Partial<Omit<PacienteRow, 'id' | 'criado_em'>>
        Relationships: []
      }
      protocolo_momentos: {
        Row: ProtocoloMomentoRow
        Insert: Omit<ProtocoloMomentoRow, 'id'>
        Update: Partial<Omit<ProtocoloMomentoRow, 'id'>>
        Relationships: []
      }
      execucoes_protocolo: {
        Row: ExecucaoProtocoloRow
        Insert: Omit<ExecucaoProtocoloRow, 'id' | 'criado_em'>
        Update: Partial<Omit<ExecucaoProtocoloRow, 'id' | 'criado_em'>>
        Relationships: []
      }
      contatos: {
        Row: ContatoRow
        Insert: Omit<ContatoRow, 'id' | 'criado_em'>
        Update: Partial<Omit<ContatoRow, 'id' | 'criado_em'>>
        Relationships: []
      }
      pesos: {
        Row: PesoRow
        Insert: Omit<PesoRow, 'id' | 'criado_em'>
        Update: Partial<Omit<PesoRow, 'id' | 'criado_em'>>
        Relationships: []
      }
      alertas: {
        Row: AlertaRow
        Insert: Omit<AlertaRow, 'id' | 'criado_em'>
        Update: Partial<Omit<AlertaRow, 'id' | 'criado_em'>>
        Relationships: []
      }
      fila_do_dia: {
        Row: FilaDoDiaRow
        Insert: Omit<FilaDoDiaRow, 'id' | 'criado_em'>
        Update: Partial<Omit<FilaDoDiaRow, 'id' | 'criado_em'>>
        Relationships: []
      }
      agendamentos: {
        Row: AgendamentoRow
        Insert: Omit<AgendamentoRow, 'id' | 'criado_em'>
        Update: Partial<Omit<AgendamentoRow, 'id' | 'criado_em'>>
        Relationships: []
      }
      correcoes_rota: {
        Row: CorrecaoRotaRow
        Insert: Omit<CorrecaoRotaRow, 'id' | 'criado_em'>
        Update: Partial<Omit<CorrecaoRotaRow, 'id' | 'criado_em'>>
        Relationships: []
      }
      procedimentos: {
        Row: ProcedimentoRow
        Insert: Omit<ProcedimentoRow, 'id' | 'criado_em'>
        Update: Partial<Omit<ProcedimentoRow, 'id' | 'criado_em'>>
        Relationships: []
      }
      plano_itens: {
        Row: PlanoItemRow
        Insert: Omit<PlanoItemRow, 'id' | 'qtd_restante' | 'criado_em' | 'atualizado_em' | 'editado_manual' | 'orcamento_id' | 'fonte'>
          & { editado_manual?: boolean; orcamento_id?: string | null; fonte?: string }
        Update: Partial<Omit<PlanoItemRow, 'id' | 'qtd_restante' | 'criado_em' | 'atualizado_em'>>
        Relationships: []
      }
      audit_log: {
        Row: AuditLogRow
        Insert: Omit<AuditLogRow, 'id' | 'criado_em'>
        Update: Record<string, never>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_dashboard_stats: {
        Args: { p_clinica_id: string }
        Returns: Array<{
          total_ativos: number
          em_risco: number
          bom: number
          excelente: number
          acionamentos_hoje: number
          alertas_abertos: number
        }>
      }
      get_clinic_weight_variations: {
        Args: { p_clinica_id: string }
        Returns: Array<{ media_semanal: number }>
      }
      minha_clinica_id: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
