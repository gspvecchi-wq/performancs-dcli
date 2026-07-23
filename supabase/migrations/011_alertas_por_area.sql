-- Migration 011 — Alertas por área + caixa de decisão
--
-- ⚠️ RODE UM BLOCO POR VEZ (o app em produção lê `alertas`; script único
-- acumula locks e pode dar deadlock).
--
-- `area` roteia o alerta para a equipe certa (Enfermagem cuida de falta e
-- reagendamento; Comercial cuida de renovação, NPS e risco de churn).
-- Não há controle de acesso: todos veem tudo, a área serve para organizar.
--
-- `justificativa` + `acao` são a "caixa de decisão": ao resolver uma falta, a
-- enfermagem registra POR QUE o paciente não veio e O QUE foi feito — para não
-- cair no esquecimento e virar histórico consultável.

-- ═══════════════════════════════════════════════════════════════
-- BLOCO 1 — novas colunas
-- ═══════════════════════════════════════════════════════════════
SET lock_timeout = '5s';

ALTER TABLE alertas ADD COLUMN IF NOT EXISTS area          text NOT NULL DEFAULT 'geral';
ALTER TABLE alertas ADD COLUMN IF NOT EXISTS justificativa text;
ALTER TABLE alertas ADD COLUMN IF NOT EXISTS acao          text;


-- ═══════════════════════════════════════════════════════════════
-- BLOCO 2 — índices
-- ═══════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_alertas_area
  ON alertas(clinica_id, area, resolvido);


-- ═══════════════════════════════════════════════════════════════
-- BLOCO 3 — classifica os alertas que já existem
-- ═══════════════════════════════════════════════════════════════
UPDATE alertas SET area = 'enfermagem'
WHERE area = 'geral'
  AND tipo IN ('protocolo_atrasado', 'sessao_perdida', 'confirmacao_agendamento');

UPDATE alertas SET area = 'comercial'
WHERE area = 'geral'
  AND tipo IN ('plano_vencendo', 'renovacao', 'upsell', 'risco_evasao', 'nps_detrator');

COMMENT ON COLUMN alertas.area          IS 'enfermagem | comercial | geral — roteia para a equipe';
COMMENT ON COLUMN alertas.justificativa IS 'Motivo registrado ao resolver (ex.: por que o paciente faltou)';
COMMENT ON COLUMN alertas.acao          IS 'Ação tomada: reagendado | contatado | desistiu | adiado | outro';
