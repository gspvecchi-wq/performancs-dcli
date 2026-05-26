-- Agendamentos reais do Adão Ferreira dos Reis
-- Fonte: PDF "Agendamento Adão.pdf" exportado do SupportClinic em 26/05/2026
-- Plano: 3 meses a partir de 05/05/2026 → término 05/08/2026

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

  -- Atualiza data de término do plano para 3 meses (05/05/2026 + 3m = 05/08/2026)
  UPDATE pacientes
  SET plano_fim = '2026-08-05'
  WHERE id = v_paciente_id;

  -- Limpa agendamentos anteriores (re-executável)
  DELETE FROM agendamentos WHERE paciente_id = v_paciente_id;

  -- 1. 05/05/2026 — Sessão de injetáveis EV + IM + Medicamentos
  --    (1ª Sessão EV: MSM + L-Glicina + Alanil glutamina + AMINNU + Sulfato de Mg — EV lento 250ml SF0,9%)
  --    (1ª Sessão IM: IM profundo QSD — máx 5ml por glúteo)
  --    (1ª Sessão SC: Tirzepatida 60mg/2,4ml — 10 cliques/0,1ml SC)
  INSERT INTO agendamentos
    (paciente_id, clinica_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado)
  VALUES (
    v_paciente_id, v_clinica_id,
    'Injetáveis EV + IM + Tirzepatida (1ª Sessão)',
    '2026-05-05', '13:30',
    'Deborah Daniele',
    'atendido',
    'EV: MSM + L-Glicina + Alanil glutamina + AMINNU + Sulfato de Mg (250ml SF0,9% EV lento). IM: QSD profundo. SC: Tirzepatida 60mg — 0,1ml (10 cliques)',
    true
  );

  -- 2. 21/05/2026 — Consulta com Nutricionista
  --    Protocolo / Plano alimentar — Dra. Livia Negreiro
  INSERT INTO agendamentos
    (paciente_id, clinica_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado)
  VALUES (
    v_paciente_id, v_clinica_id,
    'Consulta Nutricionista — Protocolo e Plano',
    '2026-05-21', '15:00',
    'Livia Negreiro',
    'atendido',
    'Consulta de nutricionista para definição de protocolo alimentar e plano individualizado.',
    true
  );

  -- 3. 11/06/2026 — Acompanhamento com Dra. Dayane
  --    Revisão de protocolo, ajuste de doses, evolução do tratamento
  INSERT INTO agendamentos
    (paciente_id, clinica_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado)
  VALUES (
    v_paciente_id, v_clinica_id,
    'Acompanhamento Profissional — Dra. Dayane',
    '2026-06-11', '15:00',
    'Dra. Dayane Junqueira',
    'agendado',
    'Acompanhamento médico com Dra. Dayane Junqueira Vilela (CRM-GO 23897). Revisão de evolução, ajuste de protocolo e próximos passos do tratamento.',
    false
  );

  RAISE NOTICE 'Agendamentos atualizados. plano_fim ajustado para 05/08/2026. paciente_id: %', v_paciente_id;
END $$;
