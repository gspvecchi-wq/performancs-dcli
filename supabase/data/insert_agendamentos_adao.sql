-- Agendamentos (marcos) do paciente Adão Ferreira
-- Fonte: PDF de Agendamentos D Clinique / SupportClinic
-- Médica: Dra. Dayane Vilela (Nutrologia)

DO $$
DECLARE
  v_paciente_id uuid;
  v_clinica_id  uuid;
BEGIN
  SELECT id, clinica_id INTO v_paciente_id, v_clinica_id
  FROM pacientes
  WHERE nome ILIKE '%Adão%Ferreira%' OR nome ILIKE '%Adao%Ferreira%'
  LIMIT 1;

  IF v_paciente_id IS NULL THEN
    RAISE EXCEPTION 'Paciente Adão Ferreira não encontrado';
  END IF;

  -- Limpa agendamentos anteriores (re-executável)
  DELETE FROM agendamentos WHERE paciente_id = v_paciente_id;

  -- 1ª Sessão EV + IM — 05/05/2026 (já realizada)
  INSERT INTO agendamentos (paciente_id, clinica_id, label, data_agendamento, hora, profissional, status, alerta_d1_enviado)
  VALUES (v_paciente_id, v_clinica_id,
    '1ª Sessão EV + IM', '2026-05-05', '08:00', 'Dra. Dayane Vilela', 'atendido', true);

  -- 2ª Sessão EV + IM — 21/05/2026 (já realizada)
  INSERT INTO agendamentos (paciente_id, clinica_id, label, data_agendamento, hora, profissional, status, alerta_d1_enviado)
  VALUES (v_paciente_id, v_clinica_id,
    '2ª Sessão EV + IM', '2026-05-21', '08:00', 'Dra. Dayane Vilela', 'atendido', true);

  -- 3ª Sessão EV + IM — 11/06/2026 (próxima)
  INSERT INTO agendamentos (paciente_id, clinica_id, label, data_agendamento, hora, profissional, status, alerta_d1_enviado)
  VALUES (v_paciente_id, v_clinica_id,
    '3ª Sessão EV + IM', '2026-06-11', '08:00', 'Dra. Dayane Vilela', 'agendado', false);

  RAISE NOTICE 'Agendamentos inseridos para paciente_id: %', v_paciente_id;
END $$;
