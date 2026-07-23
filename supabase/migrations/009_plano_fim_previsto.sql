-- Migration 009 — Fim do plano PREVISTO (dinâmico)
--
-- `plano_fim` é o fim CONTRATADO (fixo, definido na importação do plano).
-- `plano_fim_previsto` é recalculado conforme as sessões vão sendo realizadas:
-- se o paciente atrasa ou reagenda, o cronograma escorrega e a previsão acompanha.
--
-- É essa data que deve disparar o NPS ("45 dias antes de encerrar") e os
-- alertas de vencimento — o fim contratado fica como referência do combinado.

ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS plano_fim_previsto date;

CREATE INDEX IF NOT EXISTS idx_pacientes_plano_fim_previsto
  ON pacientes(plano_fim_previsto)
  WHERE plano_fim_previsto IS NOT NULL;

COMMENT ON COLUMN pacientes.plano_fim   IS 'Fim contratado do plano (fixo)';
COMMENT ON COLUMN pacientes.plano_fim_previsto IS 'Fim projetado pelo ritmo real de sessões (dinâmico)';
