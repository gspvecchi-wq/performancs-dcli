-- Migration 010 — Pesquisas de satisfação (NPS)
--
-- A pesquisa é respondida por LINK PÚBLICO (sem login): o paciente recebe uma
-- URL com token único. Por isso a leitura/gravação pela página pública passa por
-- API server-side (service role), não pelo cliente — a RLS abaixo cobre só o
-- acesso interno da clínica.
--
-- Gatilhos: 'inicio_plano' (logo que o plano fecha) e 'fim_45d' (45 dias antes
-- do fim PREVISTO, que acompanha reagendamentos). 'manual' para envio avulso.

CREATE TABLE IF NOT EXISTS pesquisas (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id     uuid NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
  paciente_id    uuid NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,

  tipo           text NOT NULL DEFAULT 'nps',
  gatilho        text NOT NULL DEFAULT 'manual',
                 -- 'inicio_plano' | 'fim_45d' | 'manual'
  token          text NOT NULL UNIQUE,          -- compõe o link público
  pergunta       text NOT NULL,

  -- Resposta
  nota           integer CHECK (nota BETWEEN 0 AND 10),
  comentario     text,

  enviada_em     timestamptz,
  respondida_em  timestamptz,
  expira_em      timestamptz,
  criado_em      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pesquisas_paciente  ON pesquisas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_pesquisas_clinica   ON pesquisas(clinica_id);
CREATE INDEX IF NOT EXISTS idx_pesquisas_token     ON pesquisas(token);
CREATE INDEX IF NOT EXISTS idx_pesquisas_respondida ON pesquisas(respondida_em);

-- Evita duplicar a mesma pesquisa automática para o mesmo paciente
CREATE UNIQUE INDEX IF NOT EXISTS idx_pesquisas_gatilho_unico
  ON pesquisas(paciente_id, gatilho)
  WHERE gatilho <> 'manual';

-- ── RLS (acesso interno da clínica) ──────────────────────────────────────────
ALTER TABLE pesquisas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pesquisas_select" ON pesquisas
  FOR SELECT USING (clinica_id = minha_clinica_id());
CREATE POLICY "pesquisas_insert" ON pesquisas
  FOR INSERT WITH CHECK (clinica_id = minha_clinica_id());
CREATE POLICY "pesquisas_update" ON pesquisas
  FOR UPDATE USING (clinica_id = minha_clinica_id());

-- ── Satisfação no paciente (última nota válida) ──────────────────────────────
-- Materializado para o mapa de calor e o score de engajamento não precisarem
-- varrer o histórico a cada leitura.
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS nps_nota           integer;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS nps_respondido_em  date;

COMMENT ON COLUMN pacientes.nps_nota IS 'Última nota NPS (0-10): promotor 9-10, neutro 7-8, detrator 0-6';
