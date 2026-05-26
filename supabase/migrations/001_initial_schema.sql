-- PerformanCS — Schema inicial
-- Migração 001: tabelas core

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- CLÍNICAS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE clinicas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            text NOT NULL,
  slug            text UNIQUE NOT NULL,
  plano           text NOT NULL DEFAULT 'mvp',
  whatsapp_config jsonb,                 -- { provider, instance_id, token }
  criado_em       timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- USUÁRIOS (profiles vinculados ao Supabase Auth)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE usuarios (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  clinica_id  uuid NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
  nome        text NOT NULL,
  email       text NOT NULL,
  papel       text NOT NULL DEFAULT 'cs',   -- 'admin' | 'cs' | 'medico'
  avatar_url  text,
  criado_em   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_usuarios_clinica ON usuarios(clinica_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- PACIENTES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE pacientes (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id                      uuid NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
  nome                            text NOT NULL,
  telefone                        text,                -- E.164: +5511999999999
  email                           text,
  data_nascimento                 date,
  objetivo                        text NOT NULL DEFAULT 'emagrecimento',
                                  -- 'emagrecimento' | 'massa_muscular' | 'saude_geral'
  meta_kg                         numeric(5,2),        -- negativo = meta de perda
  meta_prazo_meses                integer,
  peso_inicial                    numeric(5,2),
  peso_atual                      numeric(5,2),
  foto_url                        text,

  -- Contexto "Quem é esse paciente"
  motivacao                       text,
  historico_saude                 text,
  alertas_contexto                text,

  -- Plano
  plano_inicio                    date NOT NULL,
  plano_fim                       date NOT NULL,
  especialidade                   text,
  status                          text NOT NULL DEFAULT 'ativo',
                                  -- 'ativo' | 'inativo' | 'concluido' | 'cancelado'

  -- Engajamento
  score                           integer NOT NULL DEFAULT 50 CHECK (score BETWEEN 0 AND 100),
  nivel                           text NOT NULL DEFAULT 'medio',
                                  -- 'alto' | 'medio' | 'baixo'

  -- Financeiro (importado de relatório externo)
  status_pagamento                text NOT NULL DEFAULT 'desconhecido',
                                  -- 'adimplente' | 'inadimplente' | 'em_atraso' | 'desconhecido'
  status_pagamento_atualizado_em  date,

  criado_por                      uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  criado_em                       timestamptz NOT NULL DEFAULT now(),
  atualizado_em                   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pacientes_clinica     ON pacientes(clinica_id);
CREATE INDEX idx_pacientes_status      ON pacientes(status);
CREATE INDEX idx_pacientes_score       ON pacientes(score);
CREATE INDEX idx_pacientes_plano_fim   ON pacientes(plano_fim);
CREATE INDEX idx_pacientes_telefone    ON pacientes(telefone);

-- Trigger: atualizar atualizado_em automaticamente
CREATE OR REPLACE FUNCTION update_atualizado_em()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.atualizado_em = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_pacientes_atualizado_em
BEFORE UPDATE ON pacientes
FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

-- ─────────────────────────────────────────────────────────────────────────────
-- PLANO DE ACOMPANHAMENTO — MOMENTOS (templates por clínica)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE protocolo_momentos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id  uuid NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
  ordem       integer NOT NULL,
  label       text NOT NULL,
  offset_dias integer NOT NULL,   -- dias após plano_inicio
  pergunta    text NOT NULL,
  ativo       boolean NOT NULL DEFAULT true
);

CREATE UNIQUE INDEX idx_protocolo_ordem ON protocolo_momentos(clinica_id, ordem);

-- ─────────────────────────────────────────────────────────────────────────────
-- EXECUÇÕES DO PLANO DE ACOMPANHAMENTO (por paciente)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE execucoes_protocolo (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id         uuid NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  momento_id          uuid NOT NULL REFERENCES protocolo_momentos(id) ON DELETE CASCADE,
  status              text NOT NULL DEFAULT 'futuro',
                      -- 'futuro' | 'pendente' | 'atual' | 'executado' | 'risco' | 'cancelado'
  data_prevista       date NOT NULL,
  data_execucao       timestamptz,
  mensagem_enviada    text,
  resposta_paciente   text,
  analise_ia          text,
  score_resposta      integer CHECK (score_resposta BETWEEN 0 AND 100),
  executado_por       uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  criado_em           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_exec_paciente   ON execucoes_protocolo(paciente_id);
CREATE INDEX idx_exec_status     ON execucoes_protocolo(status);
CREATE INDEX idx_exec_prevista   ON execucoes_protocolo(data_prevista);

-- ─────────────────────────────────────────────────────────────────────────────
-- CONTATOS (histórico de mensagens)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE contatos (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id             uuid NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  clinica_id              uuid NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
  execucao_id             uuid REFERENCES execucoes_protocolo(id) ON DELETE SET NULL,
  tipo                    text NOT NULL,   -- 'enviado' | 'recebido' | 'automatico'
  canal                   text NOT NULL DEFAULT 'whatsapp',
  mensagem                text NOT NULL,
  resposta                text,
  analise_ia              text,
  status_whatsapp         text,            -- 'enviando' | 'entregue' | 'lido' | 'erro'
  whatsapp_message_id     text,
  enviado_por             uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  criado_em               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contatos_paciente  ON contatos(paciente_id);
CREATE INDEX idx_contatos_clinica   ON contatos(clinica_id);
CREATE INDEX idx_contatos_criado    ON contatos(criado_em DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- PESOS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE pesos (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id           uuid NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  clinica_id            uuid NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
  peso_kg               numeric(5,2) NOT NULL,
  data_pesagem          date NOT NULL,
  data_real_conhecida   boolean NOT NULL DEFAULT true,  -- FALSE = "data manipulada"
  observacao            text,
  registrado_por        uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  criado_em             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pesos_paciente     ON pesos(paciente_id);
CREATE INDEX idx_pesos_data         ON pesos(data_pesagem DESC);
CREATE UNIQUE INDEX idx_pesos_unico ON pesos(paciente_id, data_pesagem);

-- Trigger: atualizar peso_atual no paciente ao inserir/atualizar peso
CREATE OR REPLACE FUNCTION sync_peso_atual()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE pacientes
  SET peso_atual = (
    SELECT peso_kg FROM pesos
    WHERE paciente_id = NEW.paciente_id
    ORDER BY data_pesagem DESC
    LIMIT 1
  )
  WHERE id = NEW.paciente_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_sync_peso_atual
AFTER INSERT OR UPDATE ON pesos
FOR EACH ROW EXECUTE FUNCTION sync_peso_atual();

-- ─────────────────────────────────────────────────────────────────────────────
-- ALERTAS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE alertas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id    uuid NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
  paciente_id   uuid REFERENCES pacientes(id) ON DELETE CASCADE,
  tipo          text NOT NULL,
  -- 'plano_vencendo' | 'protocolo_atrasado' | 'peso_fora_meta'
  -- | 'data_manipulada' | 'sem_contato' | 'risco_evasao'
  -- | 'renovacao' | 'upsell'
  severidade    text NOT NULL DEFAULT 'atencao',   -- 'critico' | 'atencao' | 'info'
  titulo        text NOT NULL,
  descricao     text,
  resolvido     boolean NOT NULL DEFAULT false,
  resolvido_por uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  resolvido_em  timestamptz,
  metadata      jsonb,
  criado_em     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_alertas_clinica    ON alertas(clinica_id);
CREATE INDEX idx_alertas_paciente   ON alertas(paciente_id);
CREATE INDEX idx_alertas_resolvido  ON alertas(resolvido);
CREATE INDEX idx_alertas_tipo       ON alertas(tipo);

-- ─────────────────────────────────────────────────────────────────────────────
-- FILA DO DIA
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE fila_do_dia (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id          uuid NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
  paciente_id         uuid NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  data_fila           date NOT NULL,
  prioridade          integer NOT NULL DEFAULT 5,
  motivo              text NOT NULL,
  mensagem_sugerida   text NOT NULL,
  status              text NOT NULL DEFAULT 'pendente',  -- 'pendente' | 'enviado' | 'concluido'
  enviado_em          timestamptz,
  contato_id          uuid REFERENCES contatos(id) ON DELETE SET NULL,
  criado_em           timestamptz NOT NULL DEFAULT now(),
  UNIQUE(clinica_id, paciente_id, data_fila)
);

CREATE INDEX idx_fila_clinica_data ON fila_do_dia(clinica_id, data_fila);

-- ─────────────────────────────────────────────────────────────────────────────
-- CORREÇÕES DE ROTA
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE correcoes_rota (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id       uuid NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  registrado_por    uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  desvio            text NOT NULL,
  acao_corretiva    text NOT NULL,
  criado_em         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_correcoes_paciente ON correcoes_rota(paciente_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- AUDIT LOG
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE audit_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id    uuid NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
  usuario_id    uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  tabela        text NOT NULL,
  operacao      text NOT NULL,   -- 'INSERT' | 'UPDATE' | 'DELETE'
  registro_id   uuid,
  dados_antes   jsonb,
  dados_depois  jsonb,
  ip            text,
  user_agent    text,
  criado_em     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_clinica  ON audit_log(clinica_id);
CREATE INDEX idx_audit_criado   ON audit_log(criado_em DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNÇÃO: dashboard stats
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_clinica_id uuid)
RETURNS TABLE (
  total_ativos        bigint,
  em_risco            bigint,
  bom                 bigint,
  excelente           bigint,
  acionamentos_hoje   bigint,
  alertas_abertos     bigint
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    COUNT(*) FILTER (WHERE status = 'ativo')                    AS total_ativos,
    COUNT(*) FILTER (WHERE status = 'ativo' AND score < 50)     AS em_risco,
    COUNT(*) FILTER (WHERE status = 'ativo' AND score BETWEEN 50 AND 74) AS bom,
    COUNT(*) FILTER (WHERE status = 'ativo' AND score >= 75)    AS excelente,
    (SELECT COUNT(*) FROM fila_do_dia
     WHERE clinica_id = p_clinica_id
       AND data_fila = CURRENT_DATE
       AND status = 'enviado')                                   AS acionamentos_hoje,
    (SELECT COUNT(*) FROM alertas
     WHERE clinica_id = p_clinica_id
       AND resolvido = false)                                    AS alertas_abertos
  FROM pacientes
  WHERE clinica_id = p_clinica_id;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNÇÃO: variações de peso da clínica (para desvio padrão)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_clinic_weight_variations(p_clinica_id uuid)
RETURNS TABLE (media_semanal numeric) LANGUAGE sql SECURITY DEFINER AS $$
  WITH pesos_ordenados AS (
    SELECT
      paciente_id,
      peso_kg,
      data_pesagem,
      LAG(peso_kg) OVER (PARTITION BY paciente_id ORDER BY data_pesagem) AS peso_anterior,
      LAG(data_pesagem) OVER (PARTITION BY paciente_id ORDER BY data_pesagem) AS data_anterior
    FROM pesos
    WHERE clinica_id = p_clinica_id
      AND data_real_conhecida = true
  )
  SELECT
    ROUND(
      (peso_kg - peso_anterior)::numeric /
      NULLIF((data_pesagem - data_anterior)::numeric / 7, 0),
      2
    ) AS media_semanal
  FROM pesos_ordenados
  WHERE peso_anterior IS NOT NULL
    AND data_anterior IS NOT NULL
    AND (data_pesagem - data_anterior) > 0;
$$;
