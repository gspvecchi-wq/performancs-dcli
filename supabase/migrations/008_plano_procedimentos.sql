-- Migration 008 — Plano de acompanhamento estruturado (procedimentos + itens)
-- Suporta a visão "feito × falta" por procedimento, alimentada por:
--   • PDF "Plano de Tratamento"  → itens previstos + início do plano (data de emissão)
--   • Excel Relatório de Frequência → realizadas/restantes
--   • Excel/PDF Agendamentos       → datas reais (via tabela agendamentos já existente)

-- ─────────────────────────────────────────────────────────────────────────────
-- Novos campos de identidade no paciente (vindos do PDF do plano)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS prontuario text;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS cpf        text;

CREATE INDEX IF NOT EXISTS idx_pacientes_prontuario ON pacientes(prontuario) WHERE prontuario IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pacientes_cpf         ON pacientes(cpf)         WHERE cpf IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- CATÁLOGO DE PROCEDIMENTOS (aberto — criado sob demanda na importação)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS procedimentos (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id       uuid NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
  nome             text NOT NULL,               -- ex.: "Injetáveis EV - Plano"
  categoria        text NOT NULL DEFAULT 'outro',
                   -- 'plano' | 'sessao_numerada' | 'consulta' | 'outro'
  frequencia_dias  integer NOT NULL DEFAULT 7,  -- intervalo recomendado (1x/semana = 7)
  rastrear         boolean NOT NULL DEFAULT true, -- entra na visão "feito × falta"?
  ativo            boolean NOT NULL DEFAULT true,
  criado_em        timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_procedimentos_nome ON procedimentos(clinica_id, nome);
CREATE INDEX IF NOT EXISTS idx_procedimentos_categoria    ON procedimentos(clinica_id, categoria);

-- ─────────────────────────────────────────────────────────────────────────────
-- ITENS DO PLANO POR PACIENTE (o contratado × o realizado — visão agregada)
-- Uma linha por (paciente, procedimento); a importação soma entre orçamentos.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plano_itens (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id      uuid NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  procedimento_id  uuid NOT NULL REFERENCES procedimentos(id) ON DELETE CASCADE,
  qtd_prevista     integer NOT NULL DEFAULT 0,
  qtd_realizada    integer NOT NULL DEFAULT 0,
  qtd_restante     integer GENERATED ALWAYS AS (GREATEST(qtd_prevista - qtd_realizada, 0)) STORED,
  orcamento_id     text,                         -- último orçamento visto (informativo)
  fonte            text NOT NULL DEFAULT 'manual',
                   -- 'pdf_plano' | 'excel_frequencia' | 'manual'
  editado_manual   boolean NOT NULL DEFAULT false, -- se true, importação não sobrescreve
  criado_em        timestamptz NOT NULL DEFAULT now(),
  atualizado_em    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (paciente_id, procedimento_id)
);

CREATE INDEX IF NOT EXISTS idx_plano_itens_paciente     ON plano_itens(paciente_id);
CREATE INDEX IF NOT EXISTS idx_plano_itens_procedimento ON plano_itens(procedimento_id);

CREATE TRIGGER trg_plano_itens_atualizado_em
BEFORE UPDATE ON plano_itens
FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS (mesmo padrão das demais tabelas)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE procedimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE plano_itens   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "procedimentos_select" ON procedimentos
  FOR SELECT USING (clinica_id = minha_clinica_id());
CREATE POLICY "procedimentos_insert" ON procedimentos
  FOR INSERT WITH CHECK (clinica_id = minha_clinica_id());
CREATE POLICY "procedimentos_update" ON procedimentos
  FOR UPDATE USING (clinica_id = minha_clinica_id());
CREATE POLICY "procedimentos_delete" ON procedimentos
  FOR DELETE USING (
    clinica_id = minha_clinica_id()
    AND (SELECT papel FROM usuarios WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "plano_itens_select" ON plano_itens
  FOR SELECT USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = minha_clinica_id())
  );
CREATE POLICY "plano_itens_insert" ON plano_itens
  FOR INSERT WITH CHECK (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = minha_clinica_id())
  );
CREATE POLICY "plano_itens_update" ON plano_itens
  FOR UPDATE USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = minha_clinica_id())
  );
CREATE POLICY "plano_itens_delete" ON plano_itens
  FOR DELETE USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = minha_clinica_id())
  );
