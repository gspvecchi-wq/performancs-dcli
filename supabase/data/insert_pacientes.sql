-- Pacientes reais D Clinique — fechamentos maio 2026
-- Execute no SQL Editor do Supabase
DO $$
DECLARE
  v_clinica_id uuid;
BEGIN
  SELECT id INTO v_clinica_id FROM clinicas LIMIT 1;

  INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, objetivo, plano_inicio, plano_fim, status, score, nivel, status_pagamento, status_pagamento_atualizado_em)
  VALUES (v_clinica_id, 'Lorivaldo Vitorino de Carvalho', '+5564999476425', NULL, '1961-07-30', 'emagrecimento', '2026-05-02', '2027-05-02', 'ativo', 75, 'alto', 'adimplente', CURRENT_DATE)
  ON CONFLICT DO NOTHING;

  INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, objetivo, plano_inicio, plano_fim, status, score, nivel, status_pagamento, status_pagamento_atualizado_em)
  VALUES (v_clinica_id, 'Adão Ferreira dos Reis', NULL, NULL, NULL, 'emagrecimento', '2026-05-05', '2027-05-05', 'ativo', 55, 'medio', 'em_atraso', CURRENT_DATE)
  ON CONFLICT DO NOTHING;

  INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, objetivo, plano_inicio, plano_fim, status, score, nivel, status_pagamento, status_pagamento_atualizado_em)
  VALUES (v_clinica_id, 'Aparecida Petronilha de Sousa', NULL, NULL, NULL, 'emagrecimento', '2026-05-06', '2027-05-06', 'ativo', 40, 'baixo', 'em_atraso', CURRENT_DATE)
  ON CONFLICT DO NOTHING;

  INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, objetivo, plano_inicio, plano_fim, status, score, nivel, status_pagamento, status_pagamento_atualizado_em)
  VALUES (v_clinica_id, 'santiago ferraz de maia', '+556284058158', NULL, '1982-05-03', 'emagrecimento', '2026-05-06', '2027-05-06', 'ativo', 75, 'alto', 'adimplente', CURRENT_DATE)
  ON CONFLICT DO NOTHING;

  INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, objetivo, plano_inicio, plano_fim, status, score, nivel, status_pagamento, status_pagamento_atualizado_em)
  VALUES (v_clinica_id, 'Rejane moreira castro', '+5562996533822', 'rejmoreira30@outlook.com', '1980-03-30', 'emagrecimento', '2026-05-07', '2027-05-07', 'ativo', 40, 'baixo', 'em_atraso', CURRENT_DATE)
  ON CONFLICT DO NOTHING;

  INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, objetivo, plano_inicio, plano_fim, status, score, nivel, status_pagamento, status_pagamento_atualizado_em)
  VALUES (v_clinica_id, 'Jacielly Soares de Faria', '+5562996861133', 'jacielly.soares@hotmail.com', '1986-06-26', 'emagrecimento', '2026-05-07', '2027-05-07', 'ativo', 40, 'baixo', 'em_atraso', CURRENT_DATE)
  ON CONFLICT DO NOTHING;

  INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, objetivo, plano_inicio, plano_fim, status, score, nivel, status_pagamento, status_pagamento_atualizado_em)
  VALUES (v_clinica_id, 'Ardala Policena Alexandre Fernandes', '+556291212804', 'ardalapaf@hotmail.com', '1988-07-14', 'emagrecimento', '2026-05-08', '2027-05-08', 'ativo', 40, 'baixo', 'em_atraso', CURRENT_DATE)
  ON CONFLICT DO NOTHING;

  INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, objetivo, plano_inicio, plano_fim, status, score, nivel, status_pagamento, status_pagamento_atualizado_em)
  VALUES (v_clinica_id, 'Gleiciane Pereira da Silva', '+5562984436240', 'gleicianepereiira@gmail.com', '1991-01-02', 'emagrecimento', '2026-05-11', '2027-05-11', 'ativo', 40, 'baixo', 'adimplente', CURRENT_DATE)
  ON CONFLICT DO NOTHING;

  INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, objetivo, plano_inicio, plano_fim, status, score, nivel, status_pagamento, status_pagamento_atualizado_em)
  VALUES (v_clinica_id, 'IDALINA PEREIRA BRITO', '+5564999450570', 'idalinapereirabrito@hotmail.com', '1973-07-29', 'emagrecimento', '2026-05-11', '2027-05-11', 'ativo', 55, 'medio', 'adimplente', CURRENT_DATE)
  ON CONFLICT DO NOTHING;

  INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, objetivo, plano_inicio, plano_fim, status, score, nivel, status_pagamento, status_pagamento_atualizado_em)
  VALUES (v_clinica_id, 'Marcos Antonio de Oliveira', '+5564992628222', NULL, '1959-07-01', 'emagrecimento', '2026-05-12', '2027-05-12', 'ativo', 55, 'medio', 'em_atraso', CURRENT_DATE)
  ON CONFLICT DO NOTHING;

  INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, objetivo, plano_inicio, plano_fim, status, score, nivel, status_pagamento, status_pagamento_atualizado_em)
  VALUES (v_clinica_id, 'sybelly Vieira Barros Arantes', '+5562996961331', '2019.gestao@gmail.com', '1976-09-01', 'emagrecimento', '2026-05-13', '2027-05-13', 'ativo', 75, 'alto', 'adimplente', CURRENT_DATE)
  ON CONFLICT DO NOTHING;

  INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, objetivo, plano_inicio, plano_fim, status, score, nivel, status_pagamento, status_pagamento_atualizado_em)
  VALUES (v_clinica_id, 'Antonia Leidiane Machado de Morais Santos', '+5562999422333', 'antonialeidiane@icloud.com', '1989-10-31', 'emagrecimento', '2026-05-18', '2027-05-18', 'ativo', 40, 'baixo', 'em_atraso', CURRENT_DATE)
  ON CONFLICT DO NOTHING;

  INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, objetivo, plano_inicio, plano_fim, status, score, nivel, status_pagamento, status_pagamento_atualizado_em)
  VALUES (v_clinica_id, 'Amanda Cruz Fidelis Andrade', '+5528929848462', 'amandacfidelis@gmail.com', '1991-11-08', 'emagrecimento', '2026-05-21', '2027-05-21', 'ativo', 40, 'baixo', 'em_atraso', CURRENT_DATE)
  ON CONFLICT DO NOTHING;

  INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, objetivo, plano_inicio, plano_fim, status, score, nivel, status_pagamento, status_pagamento_atualizado_em)
  VALUES (v_clinica_id, 'Kelly Cristina a Silva Amorim', '+5562981374664', 'kellyamor33@icloud.com', '1984-03-25', 'emagrecimento', '2026-05-25', '2027-05-25', 'ativo', 55, 'medio', 'em_atraso', CURRENT_DATE)
  ON CONFLICT DO NOTHING;

  INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, objetivo, plano_inicio, plano_fim, status, score, nivel, status_pagamento, status_pagamento_atualizado_em)
  VALUES (v_clinica_id, 'Cláudia Helena Borges Barbosa Almeida', '+556284061722', 'claudiahbba@hotmail.com', '1962-08-11', 'emagrecimento', '2026-05-25', '2027-05-25', 'ativo', 55, 'medio', 'em_atraso', CURRENT_DATE)
  ON CONFLICT DO NOTHING;

END;
$$;