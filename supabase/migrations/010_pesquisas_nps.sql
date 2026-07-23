-- Migration 010 — Pesquisas de satisfação (NPS)
--
-- ⚠️ RODE UM BLOCO POR VEZ (não cole tudo de uma vez).
-- O script inteiro numa única transação acumula locks: o CREATE TABLE pega lock
-- em `pacientes` pela FK e o ALTER TABLE pede lock exclusivo — enquanto o app em
-- produção está lendo a tabela. Isso gera deadlock. Em blocos separados, cada
-- lock é curto e liberado na sequência.
--
-- A pesquisa é respondida por LINK PÚBLICO (sem login): o paciente recebe uma
-- URL com token único. A leitura/gravação pública passa por API server-side
-- (service role) — a RLS abaixo cobre só o acesso interno da clínica.

-- ═══════════════════════════════════════════════════════════════
-- BLOCO 1 — colunas de NPS no paciente (rápido)
-- ═══════════════════════════════════════════════════════════════
SET lock_timeout = '5s';

ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS nps_nota          integer;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS nps_respondido_em date;


-- ═══════════════════════════════════════════════════════════════
-- BLOCO 2 — tabela de pesquisas
-- ═══════════════════════════════════════════════════════════════
SET lock_timeout = '5s';

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


-- ═══════════════════════════════════════════════════════════════
-- BLOCO 3 — índices
-- ═══════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_pesquisas_paciente   ON pesquisas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_pesquisas_clinica    ON pesquisas(clinica_id);
CREATE INDEX IF NOT EXISTS idx_pesquisas_token      ON pesquisas(token);
CREATE INDEX IF NOT EXISTS idx_pesquisas_respondida ON pesquisas(respondida_em);

-- Evita duplicar a mesma pesquisa automática para o mesmo paciente
CREATE UNIQUE INDEX IF NOT EXISTS idx_pesquisas_gatilho_unico
  ON pesquisas(paciente_id, gatilho)
  WHERE gatilho <> 'manual';


-- ═══════════════════════════════════════════════════════════════
-- BLOCO 4 — RLS (acesso interno da clínica)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE pesquisas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pesquisas_select" ON pesquisas
  FOR SELECT USING (clinica_id = minha_clinica_id());
CREATE POLICY "pesquisas_insert" ON pesquisas
  FOR INSERT WITH CHECK (clinica_id = minha_clinica_id());
CREATE POLICY "pesquisas_update" ON pesquisas
  FOR UPDATE USING (clinica_id = minha_clinica_id());
