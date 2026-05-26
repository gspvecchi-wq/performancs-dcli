-- ══════════════════════════════════════════════════════════════════════
-- Migration 006 — Score de Engajamento baseado em Agendamentos
-- ══════════════════════════════════════════════════════════════════════
-- Fórmula:
--   score = attendance_rate × 60   (atendido / (atendido + cancelado))
--         + recency       × 20   (dias desde último atendido)
--         + plan_progress × 20   (progresso relativo ao total do plano)
--
-- Casos especiais:
--   • nenhum atendido + dias_plano < 45  → 50 (paciente novo, neutro)
--   • nenhum atendido + dias_plano ≥ 45  → 25 (preocupante)
--   • sem sessões passadas + dias_plano ≤ 30 → 50
--   • sem sessões passadas + dias_plano > 30  → 30
--
-- Nivel:  score ≥ 75 → 'alto' | 50-74 → 'medio' | < 50 → 'baixo'
-- ══════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────
-- 1. FUNÇÃO DE CÁLCULO
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION calcular_score_paciente(p_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_atendido         integer;
  v_cancelado        integer;
  v_total            integer;
  v_ultimo_atendido  date;
  v_plano_inicio     date;
  v_dias_plano       integer;
  v_dias_ultimo      integer;
  v_sessoes_passadas integer;
  v_attendance_pts   numeric;
  v_recency_pts      integer;
  v_progress_pts     numeric;
  v_score            integer;
BEGIN
  -- ── Contagens por status ──────────────────────────────────────────
  SELECT
    COUNT(*) FILTER (WHERE status = 'atendido'),
    COUNT(*) FILTER (WHERE status = 'cancelado'),
    COUNT(*)
  INTO v_atendido, v_cancelado, v_total
  FROM agendamentos
  WHERE paciente_id = p_id;

  -- ── Última sessão atendida ────────────────────────────────────────
  SELECT MAX(data_agendamento)
  INTO v_ultimo_atendido
  FROM agendamentos
  WHERE paciente_id = p_id
    AND status = 'atendido';

  -- ── Dados do paciente ─────────────────────────────────────────────
  SELECT plano_inicio
  INTO v_plano_inicio
  FROM pacientes
  WHERE id = p_id;

  -- Dias desde o início do plano (0 se ainda sem plano → novo, neutro)
  v_dias_plano := COALESCE(CURRENT_DATE - v_plano_inicio, 0);

  -- Sessões com data passada (excluindo a_agendar sem data)
  SELECT COUNT(*)
  INTO v_sessoes_passadas
  FROM agendamentos
  WHERE paciente_id    = p_id
    AND data_agendamento IS NOT NULL
    AND data_agendamento <= CURRENT_DATE
    AND status         != 'a_agendar';

  -- ── Casos especiais: pacientes sem atendimentos ───────────────────
  IF v_atendido = 0 THEN
    IF v_dias_plano < 45 THEN
      RETURN 50;   -- novo paciente: neutro
    ELSE
      RETURN 25;   -- preocupante: plano ativo há tempo sem comparecer
    END IF;
  END IF;

  -- Sem sessões passadas (todos futuros ou a_agendar)
  IF v_sessoes_passadas = 0 THEN
    IF v_dias_plano <= 30 THEN
      RETURN 50;
    ELSE
      RETURN 30;
    END IF;
  END IF;

  -- ── 1. Taxa de comparecimento → 0–60 pts ─────────────────────────
  IF (v_atendido + v_cancelado) = 0 THEN
    v_attendance_pts := 30;   -- neutro quando não há dados suficientes
  ELSE
    v_attendance_pts := (v_atendido::numeric / (v_atendido + v_cancelado)) * 60;
  END IF;

  -- ── 2. Recência → 0–20 pts ───────────────────────────────────────
  IF v_ultimo_atendido IS NULL THEN
    v_recency_pts := 3;
  ELSE
    v_dias_ultimo := CURRENT_DATE - v_ultimo_atendido;
    v_recency_pts := CASE
      WHEN v_dias_ultimo <=  14 THEN 20
      WHEN v_dias_ultimo <=  30 THEN 15
      WHEN v_dias_ultimo <=  60 THEN  8
      ELSE                             3
    END;
  END IF;

  -- ── 3. Progresso no plano → 0–20 pts ─────────────────────────────
  -- min(1.0, atendido / (total * 0.3)) × 20
  -- Chega ao máximo ao atingir 30% das sessões totais prescritas
  IF v_total = 0 THEN
    v_progress_pts := 0;
  ELSE
    v_progress_pts := LEAST(1.0, v_atendido::numeric / (v_total * 0.3)) * 20;
  END IF;

  -- ── Score final ───────────────────────────────────────────────────
  v_score := ROUND(v_attendance_pts + v_recency_pts + v_progress_pts)::integer;

  RETURN GREATEST(0, LEAST(100, v_score));
END;
$$;

-- ────────────────────────────────────────────────────────────────────
-- 2. FUNÇÃO DE TRIGGER
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_atualizar_score_paciente()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_paciente_id uuid;
  v_novo_score  integer;
  v_novo_nivel  text;
BEGIN
  v_paciente_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.paciente_id ELSE NEW.paciente_id END;

  v_novo_score := calcular_score_paciente(v_paciente_id);

  v_novo_nivel := CASE
    WHEN v_novo_score >= 75 THEN 'alto'
    WHEN v_novo_score >= 50 THEN 'medio'
    ELSE                         'baixo'
  END;

  UPDATE pacientes
  SET score = v_novo_score,
      nivel = v_novo_nivel
  WHERE id = v_paciente_id;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

-- ────────────────────────────────────────────────────────────────────
-- 3. TRIGGER — dispara em qualquer mudança de status
-- ────────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS tg_score_on_agendamento ON agendamentos;

CREATE TRIGGER tg_score_on_agendamento
  AFTER INSERT OR UPDATE OF status OR DELETE
  ON agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_atualizar_score_paciente();

-- ────────────────────────────────────────────────────────────────────
-- 4. SEED — recalcular todos os pacientes ativos com dados já inseridos
-- ────────────────────────────────────────────────────────────────────
WITH scores AS (
  SELECT id,
         calcular_score_paciente(id) AS novo_score
  FROM pacientes
  WHERE status = 'ativo'
)
UPDATE pacientes p
SET
  score = s.novo_score,
  nivel = CASE
    WHEN s.novo_score >= 75 THEN 'alto'
    WHEN s.novo_score >= 50 THEN 'medio'
    ELSE                         'baixo'
  END
FROM scores s
WHERE p.id = s.id;
