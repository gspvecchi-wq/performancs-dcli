-- PerformanCS — Seed de desenvolvimento
-- Insere dados de exemplo baseados no protótipo

-- ATENÇÃO: Execute apenas em ambiente de desenvolvimento!
-- Substitua 'CLINICA_ID' e 'USER_ID' pelos IDs reais após criar a conta.

DO $$
DECLARE
  v_clinica_id  uuid := gen_random_uuid();
  v_user_id     uuid := gen_random_uuid(); -- substituir pelo auth.users.id real
  v_p_marcos    uuid := gen_random_uuid();
  v_p_camila    uuid := gen_random_uuid();
  v_p_leticia   uuid := gen_random_uuid();
  v_p_roberto   uuid := gen_random_uuid();
  v_m1 uuid; v_m2 uuid; v_m3 uuid; v_m4 uuid; v_m5 uuid; v_m6 uuid;
BEGIN

-- Clínica
INSERT INTO clinicas (id, nome, slug, plano)
VALUES (v_clinica_id, 'Clínica PerformanCS Demo', 'performancs-demo', 'mvp');

-- Momentos do plano de acompanhamento
INSERT INTO protocolo_momentos (id, clinica_id, ordem, label, offset_dias, pergunta) VALUES
  (gen_random_uuid(), v_clinica_id, 1, 'D+1 — boas-vindas',         1,  'Como você está se sentindo em relação ao início do tratamento? Tem alguma dúvida?'),
  (gen_random_uuid(), v_clinica_id, 2, 'D+7 — check-in',            7,  'Você conseguiu seguir as orientações essa semana?'),
  (gen_random_uuid(), v_clinica_id, 3, 'D+15 — check-in',           15, 'O que foi mais difícil até agora?'),
  (gen_random_uuid(), v_clinica_id, 4, 'D+30 — resultado percebido',30, 'Você já percebeu alguma diferença desde que começou?'),
  (gen_random_uuid(), v_clinica_id, 5, 'Meio do plano',              90, 'Olhando para o caminho percorrido até aqui, como você se sente em relação ao tratamento?'),
  (gen_random_uuid(), v_clinica_id, 6, '30 dias antes do fim',      150,'Seu plano está próximo do fim. O que você sentiu de mais impactante nesse período?')
RETURNING id INTO v_m1;

-- Pacientes
INSERT INTO pacientes (id, clinica_id, nome, telefone, objetivo, meta_kg, meta_prazo_meses,
  peso_inicial, peso_atual, motivacao, plano_inicio, plano_fim, especialidade,
  status, score, nivel, status_pagamento)
VALUES
  (v_p_marcos, v_clinica_id, 'Marcos Nunes', '+5511999991111',
   'emagrecimento', -12, 6, 92.0, 89.5,
   'Quer emagrecer para ter mais energia com os filhos. Histórico de sedentarismo.',
   '2025-01-02', '2025-06-30', 'Medicina integrativa',
   'ativo', 91, 'alto', 'adimplente'),

  (v_p_camila, v_clinica_id, 'Camila Torres', '+5511999992222',
   'emagrecimento', -10, 4, 78.0, 75.5,
   'Quer emagrecer antes do casamento. Dificuldades com dieta nos fins de semana.',
   '2025-02-01', '2025-05-30', 'Acompanhamento clínico',
   'ativo', 74, 'medio', 'adimplente'),

  (v_p_leticia, v_clinica_id, 'Letícia Melo', '+5511999993333',
   'emagrecimento', -8, 6, 71.0, 71.0,
   'Iniciante no processo. Motivação alta mas primeiro contato ainda pendente.',
   '2025-04-19', '2025-10-30', 'Medicina integrativa',
   'ativo', 52, 'medio', 'desconhecido'),

  (v_p_roberto, v_clinica_id, 'Roberto Alves', '+5511999994444',
   'emagrecimento', -15, 4, 105.0, 103.0,
   'Histórico de hipertensão. Cancelou última consulta sem remarcar. Problema no trabalho.',
   '2025-01-03', '2025-05-08', 'Acompanhamento clínico',
   'ativo', 29, 'baixo', 'em_atraso');

-- Alertas
INSERT INTO alertas (clinica_id, paciente_id, tipo, severidade, titulo, descricao)
VALUES
  (v_clinica_id, v_p_roberto, 'risco_evasao', 'critico',
   'Roberto em risco crítico de evasão',
   'Não respondeu check-in de 15 dias. Consulta cancelada sem remarcar. Plano vence em breve.'),
  (v_clinica_id, v_p_camila, 'plano_vencendo', 'atencao',
   'Plano de Camila vence em 28 dias',
   'Abordar renovação agora com dados de evolução concreta.'),
  (v_clinica_id, v_p_marcos, 'upsell', 'info',
   'Oportunidade de upsell — Marcos Nunes',
   'Score 91. Engajamento excelente. Ideal para apresentar upgrade.'),
  (v_clinica_id, v_p_leticia, 'protocolo_atrasado', 'critico',
   'Onboarding D+1 pendente — Letícia Melo',
   'Janela de vulnerabilidade pós-venda em aberto há 6 dias.');

-- Fila do dia
INSERT INTO fila_do_dia (clinica_id, paciente_id, data_fila, prioridade, motivo, mensagem_sugerida, status)
VALUES
  (v_clinica_id, v_p_roberto, CURRENT_DATE, 1,
   'Não respondeu check-in de 15 dias. Cancelou consulta sem remarcar. Plano vence em 11 dias.',
   'Roberto, percebi que você não conseguiu vir na última consulta. Quero entender como você está se sentindo com o tratamento — tem algo que aconteceu que eu possa ajudar?',
   'pendente'),
  (v_clinica_id, v_p_camila, CURRENT_DATE, 2,
   'Plano vence em 28 dias. Momento ideal para abordar renovação antes que vire urgência.',
   'Camila, estamos chegando na reta final do seu plano! Olhando para o caminho percorrido, como você se sente em relação ao tratamento até agora?',
   'pendente'),
  (v_clinica_id, v_p_marcos, CURRENT_DATE, 3,
   'Momento 5 do plano de acompanhamento — verificar evolução e preparar argumentos de renovação.',
   'Marcos, chegamos à metade do seu plano! Olhando para o caminho percorrido até aqui, como você se sente em relação ao tratamento?',
   'pendente'),
  (v_clinica_id, v_p_leticia, CURRENT_DATE, 4,
   'Onboarding D+1 pendente há 6 dias. Janela crítica de vulnerabilidade pós-venda.',
   'Letícia, bem-vinda ao seu plano de acompanhamento! Já faz alguns dias desde o início — como você está se sentindo? Tem alguma dúvida sobre o que foi orientado?',
   'pendente');

END $$;
