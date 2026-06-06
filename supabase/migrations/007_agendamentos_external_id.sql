-- Migration 007 — external_id nos agendamentos para upsert idempotente
-- Permite importar agendamentos do SupportClinic sem duplicar registros

ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS external_id text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_agendamentos_external_id
  ON agendamentos(external_id)
  WHERE external_id IS NOT NULL;
