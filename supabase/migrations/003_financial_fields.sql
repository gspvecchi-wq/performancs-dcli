-- Adiciona campos financeiros à tabela pacientes
ALTER TABLE pacientes
  ADD COLUMN IF NOT EXISTS valor_plano  NUMERIC(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS valor_pago   NUMERIC(10,2) DEFAULT NULL;
