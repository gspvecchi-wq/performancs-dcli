-- Agendamentos completos do Adão Ferreira dos Reis
-- Fontes:
--   - Agendamento Adão.pdf   → 3 datas reais do SupportClinic
--   - Plano Adão.pdf         → totais por tipo (EV 2x, IM 12x, SC 4x, etc.)
--   - Plano Adão (1).pdf     → detalhes da 1ª sessão (medicamentos)
--   - Plano Adão (2).pdf     → detalhes das sessões 2–12
-- Plano: 3 meses — 05/05/2026 → 05/08/2026

DO $$
DECLARE
  v_paciente_id uuid;
  v_clinica_id  uuid;
BEGIN
  SELECT id, clinica_id INTO v_paciente_id, v_clinica_id
  FROM pacientes
  WHERE nome ILIKE '%Adão%' OR nome ILIKE '%Adao%'
  LIMIT 1;

  IF v_paciente_id IS NULL THEN
    RAISE EXCEPTION 'Paciente Adão Ferreira não encontrado';
  END IF;

  -- Corrige data de término do plano para 3 meses
  UPDATE pacientes
  SET plano_fim = '2026-08-05'
  WHERE id = v_paciente_id;

  -- Limpa agendamentos anteriores (re-executável)
  DELETE FROM agendamentos WHERE paciente_id = v_paciente_id;

  -- ── SESSÕES JÁ REALIZADAS ────────────────────────────────────────────────

  -- 1. 05/05/2026 — 1ª Sessão de Injetáveis (EV + IM + SC)
  --    EV: MSM + L-Glicina + Alanil glutamina + AMINNU + Sulfato de Mg (250ml SF0,9%)
  --    IM: QSD profundo | SC: Tirzepatida 60mg 0,1ml (10 cliques)
  INSERT INTO agendamentos (paciente_id, clinica_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado)
  VALUES (v_paciente_id, v_clinica_id,
    '1ª Sessão — EV + IM + SC (Tirzepatida)',
    '2026-05-05', '13:30', 'Deborah Daniele', 'atendido',
    'EV: MSM + L-Glicina + Alanil glutamina + AMINNU + Sulfato de Mg (250ml SF0,9% EV lento). IM: QSD profundo. SC: Tirzepatida 60mg 0,1ml (10 cliques).',
    true);

  -- 2. 21/05/2026 — 1ª Consulta Nutricionista
  INSERT INTO agendamentos (paciente_id, clinica_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado)
  VALUES (v_paciente_id, v_clinica_id,
    '1ª Consulta Nutricionista',
    '2026-05-21', '15:00', 'Livia Negreiro', 'atendido',
    'Consulta para definição de protocolo alimentar e plano individualizado.',
    true);

  -- ── AGENDADO ─────────────────────────────────────────────────────────────

  -- 3. 11/06/2026 — 1º Acompanhamento Profissional (Dra. Dayane)
  INSERT INTO agendamentos (paciente_id, clinica_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado)
  VALUES (v_paciente_id, v_clinica_id,
    '1º Acompanhamento — Dra. Dayane',
    '2026-06-11', '15:00', 'Dra. Dayane Junqueira', 'agendado',
    'Revisão de evolução, ajuste de protocolo e próximos passos do tratamento.',
    false);

  -- ── A AGENDAR — extraídos dos PDFs de plano ──────────────────────────────

  -- 4. 2ª Sessão — EV + IM + SC
  --    EV: L-Carnitina+L-Ornitina + Pool AA + Vit C + Biocolin
  --    IM: Thermoativador (QSE) | SC: Tirzepatida 0,1ml
  INSERT INTO agendamentos (paciente_id, clinica_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado)
  VALUES (v_paciente_id, v_clinica_id,
    '2ª Sessão — EV + IM + SC (Tirzepatida)',
    NULL, NULL, 'Deborah Daniele', 'a_agendar',
    'EV: L-Carnitina+L-Ornitina + Pool AA + Vit C + Biocolin (250ml SF0,9%). IM: Thermoativador QSE. SC: Tirzepatida 60mg 0,1ml.',
    false);

  -- 5. 3ª Sessão — IM + SC
  --    IM: L-carnitina + L-ornitina + L-carnosina + L-arginina + Lidocaína (QSD e QSE)
  --    SC: Tirzepatida 0,1ml
  INSERT INTO agendamentos (paciente_id, clinica_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado)
  VALUES (v_paciente_id, v_clinica_id,
    '3ª Sessão — IM + SC (Tirzepatida)',
    NULL, NULL, 'Deborah Daniele', 'a_agendar',
    'IM: L-carnitina + L-ornitina + L-carnosina + L-arginina 50% + Lidocaína (QSD e QSE). SC: Tirzepatida 60mg 0,1ml.',
    false);

  -- 6. 4ª Sessão — IM + SC (dose Tirzepatida aumentada)
  --    IM: L-carnosina + Sulf Mg + L-carnitina + Beta alanina + Lidocaína (QSE)
  --    SC: Tirzepatida 0,15ml (15 cliques — dose ajustada)
  INSERT INTO agendamentos (paciente_id, clinica_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado)
  VALUES (v_paciente_id, v_clinica_id,
    '4ª Sessão — IM + SC (Tirzepatida dose ajustada)',
    NULL, NULL, 'Deborah Daniele', 'a_agendar',
    'IM: L-carnosina + Sulf Mg + L-carnitina + Beta alanina + Lidocaína (QSE). SC: Tirzepatida 60mg 0,15ml (15 cliques — dose aumentada).',
    false);

  -- 7. 5ª Sessão — EV + IM
  --    EV: L-Carnitina + Picolinato Cromo + HMB + L-Glutamina + MSM + BCAA + L-arginina
  --    IM: L-arginina cloridrato
  INSERT INTO agendamentos (paciente_id, clinica_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado)
  VALUES (v_paciente_id, v_clinica_id,
    '5ª Sessão — EV + IM',
    NULL, NULL, 'Deborah Daniele', 'a_agendar',
    'EV: L-Carnitina + Picolinato Cromo + HMB + L-Glutamina + MSM + BCAA + L-arginina (250ml SF0,9%). IM: L-arginina cloridrato.',
    false);

  -- 8. 6ª Sessão — IM
  INSERT INTO agendamentos (paciente_id, clinica_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado)
  VALUES (v_paciente_id, v_clinica_id,
    '6ª Sessão — IM',
    NULL, NULL, 'Deborah Daniele', 'a_agendar',
    'IM: L-carnitina + L-ornitina + L-Carnosina + Lidocaína (QSD e QSE).',
    false);

  -- 9. 7ª Sessão — EV + IM
  --    EV: L-glutathion + (Vit C + Complexo B + ZMA + Pool AA)
  --    IM: NADH + Complexo B + Thermoativador
  INSERT INTO agendamentos (paciente_id, clinica_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado)
  VALUES (v_paciente_id, v_clinica_id,
    '7ª Sessão — EV + IM',
    NULL, NULL, 'Deborah Daniele', 'a_agendar',
    'EV: L-glutathion / Vit C + Complexo B + ZMA + Pool AA (250ml SF0,9%). IM: NADH + Complexo B (QSD e QSE) + Thermoativador (QSE).',
    false);

  -- 10. 8ª Sessão — IM
  --     IM: NADH + Lidocaína + Complexo B + Thermoativador
  INSERT INTO agendamentos (paciente_id, clinica_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado)
  VALUES (v_paciente_id, v_clinica_id,
    '8ª Sessão — IM',
    NULL, NULL, 'Deborah Daniele', 'a_agendar',
    'IM: NADH + Lidocaína + Complexo B (QSD e QSE) + Thermoativador (QSE).',
    false);

  -- 11. 9ª Sessão — IM
  --     IM: L-carnitina + L-ornitina + L-carnosina + Beta alanina + Lidocaína (QSD e QSE)
  INSERT INTO agendamentos (paciente_id, clinica_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado)
  VALUES (v_paciente_id, v_clinica_id,
    '9ª Sessão — IM',
    NULL, NULL, 'Deborah Daniele', 'a_agendar',
    'IM: L-carnitina + L-ornitina + L-carnosina + Beta alanina + Lidocaína (QSD e QSE).',
    false);

  -- 12. 10ª Sessão — IM (Booster ATP)
  --     IM: BOOSTER ATP (ATP+L-CARNITINA+PQQ) + Thermoativador (QSD/QSE)
  INSERT INTO agendamentos (paciente_id, clinica_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado)
  VALUES (v_paciente_id, v_clinica_id,
    '10ª Sessão — IM (Booster ATP)',
    NULL, NULL, 'Deborah Daniele', 'a_agendar',
    'IM: BOOSTER ATP (ATP+L-CARNITINA+PQQ) QSD + Thermoativador (QSE).',
    false);

  -- 13. 11ª Sessão — IM
  --     IM: L-carnitina + L-ornitina + L-arginina + L-carnosina + Lidocaína (QSD e QSE)
  INSERT INTO agendamentos (paciente_id, clinica_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado)
  VALUES (v_paciente_id, v_clinica_id,
    '11ª Sessão — IM',
    NULL, NULL, 'Deborah Daniele', 'a_agendar',
    'IM: L-carnitina + L-ornitina + L-arginina cloridrato + L-carnosina + Lidocaína (QSD e QSE).',
    false);

  -- 14. 12ª Sessão — EV + IM (Finalização do protocolo)
  --     EV: Selenio + Pool 10 EV + L-Glutamina + MSM + Trio metilador
  --     IM: BOOSTER ATP (QSD)
  INSERT INTO agendamentos (paciente_id, clinica_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado)
  VALUES (v_paciente_id, v_clinica_id,
    '12ª Sessão — EV + IM (Finalização)',
    NULL, NULL, 'Deborah Daniele', 'a_agendar',
    'EV: Selenio + Pool 10 EV + L-Glutamina + MSM + Trio metilador (250ml SF0,9%). IM: BOOSTER ATP (QSD). Última sessão do protocolo de injetáveis.',
    false);

  -- 15. 2ª Consulta Nutricionista
  INSERT INTO agendamentos (paciente_id, clinica_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado)
  VALUES (v_paciente_id, v_clinica_id,
    '2ª Consulta Nutricionista',
    NULL, NULL, 'Livia Negreiro', 'a_agendar',
    'Reavaliação nutricional e ajuste do plano alimentar.',
    false);

  -- 16. 2º Acompanhamento Profissional (Dra. Dayane)
  INSERT INTO agendamentos (paciente_id, clinica_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado)
  VALUES (v_paciente_id, v_clinica_id,
    '2º Acompanhamento — Dra. Dayane',
    NULL, NULL, 'Dra. Dayane Junqueira', 'a_agendar',
    'Consulta de encerramento ou renovação do plano. Avaliação final dos resultados.',
    false);

  RAISE NOTICE 'OK: 16 agendamentos inseridos para paciente_id: %', v_paciente_id;
END $$;
