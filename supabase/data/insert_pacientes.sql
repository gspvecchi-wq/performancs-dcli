-- Pacientes reais D Clinique — fechamentos maio 2026
-- IDEMPOTENTE: apaga e recria cada paciente pelo nome. Seguro re-executar.
-- Agendamentos/alertas vinculados são removidos em cascata (ON DELETE CASCADE).

DO $$
DECLARE
  v_clinica_id uuid;
BEGIN
  SELECT id INTO v_clinica_id FROM clinicas LIMIT 1;

  IF v_clinica_id IS NULL THEN
    RAISE EXCEPTION 'Nenhuma clínica encontrada. Crie a clínica antes de inserir pacientes.';
  END IF;

  -- ── Helper: apaga pelo nome antes de reinserir ──────────────────────────────
  -- (garante que não duplica caso o script rode mais de uma vez)

  DELETE FROM pacientes WHERE nome ILIKE '%Lorivaldo%Vitorino%';
  INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, objetivo, plano_inicio, plano_fim, status, score, nivel, status_pagamento, status_pagamento_atualizado_em)
  VALUES (v_clinica_id, 'Lorivaldo Vitorino de Carvalho', '+5564999476425', NULL, '1961-07-30', 'saude_geral', '2026-05-02', '2027-05-02', 'ativo', 50, 'medio', 'desconhecido', CURRENT_DATE);

  DELETE FROM pacientes WHERE nome ILIKE '%Adão%Ferreira%' OR nome ILIKE '%Adao%Ferreira%';
  INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, objetivo, plano_inicio, plano_fim, status, score, nivel, status_pagamento, status_pagamento_atualizado_em)
  VALUES (v_clinica_id, 'Adão Ferreira dos Reis', NULL, NULL, NULL, 'emagrecimento', '2026-05-05', '2026-08-05', 'ativo', 50, 'medio', 'desconhecido', CURRENT_DATE);

  DELETE FROM pacientes WHERE nome ILIKE '%Aparecida%Petronilha%';
  INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, objetivo, plano_inicio, plano_fim, status, score, nivel, status_pagamento, status_pagamento_atualizado_em)
  VALUES (v_clinica_id, 'Aparecida Petronilha de Sousa', NULL, NULL, NULL, 'emagrecimento', '2026-05-06', '2027-05-06', 'ativo', 50, 'medio', 'desconhecido', CURRENT_DATE);

  DELETE FROM pacientes WHERE nome ILIKE '%Santiago%Ferraz%';
  INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, objetivo, plano_inicio, plano_fim, status, score, nivel, status_pagamento, status_pagamento_atualizado_em)
  VALUES (v_clinica_id, 'Santiago Ferraz de Maia', '+556284058158', NULL, '1982-05-03', 'emagrecimento', '2026-03-18', '2027-03-18', 'ativo', 50, 'medio', 'desconhecido', CURRENT_DATE);

  DELETE FROM pacientes WHERE nome ILIKE '%Rejane%Castro%';
  INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, objetivo, plano_inicio, plano_fim, status, score, nivel, status_pagamento, status_pagamento_atualizado_em)
  VALUES (v_clinica_id, 'Rejane Moreira Castro', '+5562996533822', 'rejmoreira30@outlook.com', '1980-03-30', 'emagrecimento', '2026-05-07', '2027-05-07', 'ativo', 50, 'medio', 'desconhecido', CURRENT_DATE);

  DELETE FROM pacientes WHERE nome ILIKE '%Jacielly%Soares%';
  INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, objetivo, plano_inicio, plano_fim, status, score, nivel, status_pagamento, status_pagamento_atualizado_em)
  VALUES (v_clinica_id, 'Jacielly Soares de Faria', '+5562996861133', 'jacielly.soares@hotmail.com', '1986-06-26', 'emagrecimento', '2026-05-07', '2027-05-07', 'ativo', 50, 'medio', 'desconhecido', CURRENT_DATE);

  DELETE FROM pacientes WHERE nome ILIKE '%Ardala%';
  INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, objetivo, plano_inicio, plano_fim, status, score, nivel, status_pagamento, status_pagamento_atualizado_em)
  VALUES (v_clinica_id, 'Ardala Policena Alexandre Fernandes', '+556291212804', 'ardalapaf@hotmail.com', '1988-07-14', 'emagrecimento', '2026-05-08', '2027-05-08', 'ativo', 50, 'medio', 'desconhecido', CURRENT_DATE);

  DELETE FROM pacientes WHERE nome ILIKE '%Gleiciane%Pereira%';
  INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, objetivo, plano_inicio, plano_fim, status, score, nivel, status_pagamento, status_pagamento_atualizado_em)
  VALUES (v_clinica_id, 'Gleiciane Pereira da Silva', '+5562984436240', 'gleicianepereiira@gmail.com', '1991-01-02', 'emagrecimento', '2026-05-11', '2027-05-11', 'ativo', 50, 'medio', 'desconhecido', CURRENT_DATE);

  DELETE FROM pacientes WHERE nome ILIKE '%Idalina%';
  INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, objetivo, plano_inicio, plano_fim, status, score, nivel, status_pagamento, status_pagamento_atualizado_em)
  VALUES (v_clinica_id, 'Idalina Pereira Brito', '+5564999450570', 'idalinapereirabrito@hotmail.com', '1973-07-29', 'saude_geral', '2026-05-11', '2027-05-11', 'ativo', 50, 'medio', 'desconhecido', CURRENT_DATE);

  DELETE FROM pacientes WHERE nome ILIKE '%Marcos%Antonio%Oliveira%';
  INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, objetivo, plano_inicio, plano_fim, status, score, nivel, status_pagamento, status_pagamento_atualizado_em)
  VALUES (v_clinica_id, 'Marcos Antonio de Oliveira', '+5564992628222', NULL, '1959-07-01', 'emagrecimento', '2026-05-12', '2027-05-12', 'ativo', 50, 'medio', 'desconhecido', CURRENT_DATE);

  DELETE FROM pacientes WHERE nome ILIKE '%Sybelly%';
  INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, objetivo, plano_inicio, plano_fim, status, score, nivel, status_pagamento, status_pagamento_atualizado_em)
  VALUES (v_clinica_id, 'Sybelly Vieira Barros Arantes', '+5562996961331', '2019.gestao@gmail.com', '1976-09-01', 'emagrecimento', '2026-05-13', '2027-05-13', 'ativo', 50, 'medio', 'desconhecido', CURRENT_DATE);

  DELETE FROM pacientes WHERE nome ILIKE '%Antonia%Leidiane%';
  INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, objetivo, plano_inicio, plano_fim, status, score, nivel, status_pagamento, status_pagamento_atualizado_em)
  VALUES (v_clinica_id, 'Antonia Leidiane Machado de Morais Santos', '+5562999422333', 'antonialeidiane@icloud.com', '1989-10-31', 'saude_geral', '2026-05-18', '2027-05-18', 'ativo', 50, 'medio', 'desconhecido', CURRENT_DATE);

  DELETE FROM pacientes WHERE nome ILIKE '%Amanda%Cruz%';
  INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, objetivo, plano_inicio, plano_fim, status, score, nivel, status_pagamento, status_pagamento_atualizado_em)
  VALUES (v_clinica_id, 'Amanda Cruz Fidelis Andrade', '+5562984848462', 'amandacfidelis@gmail.com', '1991-11-08', 'emagrecimento', '2026-05-21', '2027-05-21', 'ativo', 50, 'medio', 'desconhecido', CURRENT_DATE);

  DELETE FROM pacientes WHERE nome ILIKE '%Kelly%Cristina%';
  INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, objetivo, plano_inicio, plano_fim, status, score, nivel, status_pagamento, status_pagamento_atualizado_em)
  VALUES (v_clinica_id, 'Kelly Cristina a Silva Amorim', '+5562981374664', 'kellyamor33@icloud.com', '1984-03-25', 'emagrecimento', '2026-05-25', '2027-05-25', 'ativo', 50, 'medio', 'desconhecido', CURRENT_DATE);

  DELETE FROM pacientes WHERE nome ILIKE '%Cláudia%Helena%' OR nome ILIKE '%Claudia%Helena%';
  INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, objetivo, plano_inicio, plano_fim, status, score, nivel, status_pagamento, status_pagamento_atualizado_em)
  VALUES (v_clinica_id, 'Cláudia Helena Borges Barbosa Almeida', '+556284061722', 'claudiahbba@hotmail.com', '1962-08-11', 'emagrecimento', '2026-05-25', '2027-05-25', 'ativo', 50, 'medio', 'desconhecido', CURRENT_DATE);

  RAISE NOTICE 'OK: 15 pacientes inseridos para clinica_id: %', v_clinica_id;
END;
$$;
