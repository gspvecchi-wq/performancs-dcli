-- Agendamentos e Prontuários — todos os 14 pacientes D Clinique (exceto Adão, já inserido)
-- Fonte: Agendamentos.pdf + Histórico do Paciente.pdf + Plano*.pdf de cada pasta
-- Execute NO SQL Editor do Supabase, APÓS insert_pacientes.sql ter rodado
-- Data de geração: 26/05/2026

DO $$
DECLARE
  v_pac uuid;
  v_cli uuid;
BEGIN

/* ══════════════════════════════════════════════════════════════════════
   1. LORIVALDO VITORINO DE CARVALHO
   Diagnóstico: Hipogonadismo + Sarcopenia
   Plano atual: 02/05/2026 – 02/05/2027
   ══════════════════════════════════════════════════════════════════════ */
SELECT id, clinica_id INTO v_pac, v_cli
  FROM pacientes WHERE nome ILIKE '%Lorivaldo%Vitorino%';

INSERT INTO agendamentos (clinica_id, paciente_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado) VALUES
(v_cli, v_pac, 'Consulta Nutróloga', '2025-08-12', '10:30', 'Dra. Dayane Junqueira', 'atendido',
 'Consulta nova/avulsa — avaliação inicial de hipogonadismo e sarcopenia.', false),
(v_cli, v_pac, 'Consulta Nutricionista', '2025-08-14', '10:00', 'Livia Negreiro', 'atendido',
 'Consulta avulsa com nutricionista — avaliação alimentar.', false),
(v_cli, v_pac, 'Procedimentos Diversos', '2025-10-18', '11:00', 'Dra. Dayane Junqueira', 'cancelado',
 'Sessão cancelada.', false),
(v_cli, v_pac, 'Consulta Nutricionista Pré Nutróloga', '2025-10-21', '16:30', 'Isabella Jaime', 'atendido',
 'Avaliação nutricional pré-consulta com nutróloga.', false),
(v_cli, v_pac, 'Consulta Nutróloga + Implante Hormonal', '2025-10-21', '17:30', 'Dra. Dayane Junqueira', 'atendido',
 'Consulta + implante SC: Testosterona 300mg (5u) + Oxandrolona 200mg — Hipogonadismo.', false),
(v_cli, v_pac, 'Consulta Nutróloga', '2025-11-01', '07:00', 'Dra. Dayane Junqueira', 'atendido',
 'Retorno pós-implante — orientações e suplementação IV.', false),
(v_cli, v_pac, 'Consulta Nutróloga — Início Plano', '2026-05-02', '09:00', 'Dra. Dayane Junqueira', 'agendado',
 'Consulta nova/avulsa — início plano 05/2026. Reposição hormonal + suplementação EV/IM.', false),
(v_cli, v_pac, 'Implante SC — Testosterona', '2026-05-14', NULL, 'Dra. Dayane Junqueira', 'atendido',
 'Implante SC: Testosterona 300mg (4 unidades, LOT:547 VAL:02/2027). Sem intercorrência.', false),
-- Sessões a agendar (plano 05/2026: 4 EV + 2 IM + Nutri + Acompanhamento)
(v_cli, v_pac, '1ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV lento: ZMA + L-Theanina + Vit B5 + Inositol+Taurina (250ml SF0,9%).', false),
(v_cli, v_pac, '2ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV lento: Complexo B + Vit C + MSM + Sulfato de Magnésio.', false),
(v_cli, v_pac, '3ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV lento: L-Theanina + GABA + Pool Cognitivo + Complexo B.', false),
(v_cli, v_pac, '4ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV lento: L-Glutathion + Vit C + Pool Aminoácidos + Selênio.', false),
(v_cli, v_pac, '1ª Sessão IM', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'IM QSE: Coenzima Q10 100mg.', false),
(v_cli, v_pac, '2ª Sessão IM', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'IM QSE: Coenzima Q10 100mg.', false),
(v_cli, v_pac, 'Consulta Nutricionista — Protocolo', NULL, NULL, 'Livia Negreiro', 'a_agendar',
 'Consulta nutricionista protocolo/plano — acompanhamento alimentar do plano de reposição.', false),
(v_cli, v_pac, 'Acompanhamento Profissional', NULL, NULL, 'Dra. Dayane Junqueira', 'a_agendar',
 'Retorno médico — revisão de exames e ajuste da conduta terapêutica.', false);


/* ══════════════════════════════════════════════════════════════════════
   2. SANTIAGO FERRAZ DE MAIA
   Diagnóstico: Nutrologia / Emagrecimento + Saúde Intestinal
   Plano atual: 06/05/2026 – 06/05/2027
   ══════════════════════════════════════════════════════════════════════ */
SELECT id, clinica_id INTO v_pac, v_cli
  FROM pacientes WHERE nome ILIKE '%santiago%' AND nome ILIKE '%maia%';

INSERT INTO agendamentos (clinica_id, paciente_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado) VALUES
(v_cli, v_pac, 'Consulta Nutróloga — Início Plano', '2026-03-18', '14:00', 'Dra. Dayane Junqueira', 'atendido',
 'Consulta nova — início do protocolo de emagrecimento e suplementação EV/IM.', false),
(v_cli, v_pac, '1ª Sessão EV + IM — Testagem', '2026-03-18', '17:16', 'Deborah Daniele', 'atendido',
 '1ª sessão EV+IM: Ác. Alfa Lipoico + MSM + L-Glicina + Trio metilador + ADEK2 IM.', false),
(v_cli, v_pac, 'Consulta Nutricionista Pré Nutróloga', '2026-03-19', '09:00', 'Livia Negreiro', 'cancelado',
 'Consulta cancelada.', false),
(v_cli, v_pac, 'Consulta Nutricionista Pré Nutróloga', '2026-03-20', '14:00', 'Isabella Jaime', 'atendido',
 'Avaliação nutricional e orientação alimentar.', false),
(v_cli, v_pac, '2ª Sessão EV', '2026-03-25', '14:00', 'Deborah Daniele', 'atendido',
 '2ª sessão EV: Vit C 5g + Complexo B + Metilfolato + B12 + Sulf. Magnésio + Sulf. Zinco.', false),
(v_cli, v_pac, '2ª Sessão EV+IM (cancelado)', '2026-03-25', '17:00', 'Deborah Daniele', 'cancelado',
 'Sessão cancelada.', false),
(v_cli, v_pac, '3ª Sessão EV + IM', '2026-04-01', '14:00', 'Deborah Daniele', 'atendido',
 '3ª sessão EV + IM: Vit C + EV metiladores + Coenzima Q10 IM.', false),
(v_cli, v_pac, '4ª Sessão EV', '2026-04-08', '14:00', 'Deborah Daniele', 'atendido',
 '4ª sessão EV: Ác. Alfa Lipoico + Pool Aminoácidos + MSM + Vit C.', false),
(v_cli, v_pac, '5ª Sessão EV', '2026-04-15', '14:00', 'Deborah Daniele', 'atendido',
 '5ª sessão EV: protocolo antioxidante e energético.', false),
(v_cli, v_pac, '6ª Sessão EV', '2026-04-22', '16:00', 'Deborah Daniele', 'atendido',
 '6ª sessão EV: protocolo antioxidante e energético.', false),
(v_cli, v_pac, 'Acompanhamento Profissional', '2026-04-23', '17:00', 'Dra. Dayane Junqueira', 'cancelado',
 'Retorno cancelado.', false),
(v_cli, v_pac, '7ª Sessão EV', '2026-04-29', '14:00', 'Deborah Daniele', 'atendido',
 '7ª sessão EV: protocolo antioxidante e energético.', false),
(v_cli, v_pac, 'Acompanhamento Profissional (Atrasado)', '2026-05-06', '16:00', 'Dra. Dayane Junqueira', 'agendado',
 'Retorno médico — avaliação de exames solicitados + ajuste do protocolo. PENDENTE.', false),
(v_cli, v_pac, '8ª Sessão EV', '2026-05-06', '17:00', 'Deborah Daniele', 'atendido',
 '8ª sessão EV: protocolo antioxidante e energético.', false),
(v_cli, v_pac, '9ª Sessão EV + IM', '2026-05-13', '14:00', 'Deborah Daniele', 'atendido',
 '9ª sessão EV + 9ª IM: protocolo EV + IM simultâneos.', false),
(v_cli, v_pac, '9ª Sessão (cancelado)', '2026-05-14', '14:00', 'Deborah Daniele', 'cancelado',
 'Sessão cancelada — reagendada para 13/05.', false),
(v_cli, v_pac, '10ª Sessão IM (Atrasada)', '2026-05-22', '15:00', 'Deborah Daniele', 'agendado',
 '10ª sessão IM: protocolo intramuscular. PENDENTE/ATRASADA.', false),
(v_cli, v_pac, 'Acompanhamento Profissional', '2026-06-18', '15:00', 'Dra. Dayane Junqueira', 'agendado',
 'Retorno médico agendado — revisão pós 10 sessões + avaliação do novo protocolo.', false),
-- Novo plano 06/05/2026 — sessões a agendar
(v_cli, v_pac, '10ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV lento: Ác. Alfa Lipoico 600mg + MSM + metiladores.', false),
(v_cli, v_pac, '11ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV lento: protocolo antioxidante avançado.', false),
(v_cli, v_pac, '12ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV lento: Selênio + L-Glutamina + MSM + SAMe + Pool aminoácidos.', false),
(v_cli, v_pac, '11ª Sessão IM', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'IM QSE: protocolo intramuscular.', false),
(v_cli, v_pac, '12ª Sessão IM', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'IM QSE: protocolo intramuscular.', false),
(v_cli, v_pac, 'Imunoestimulante SC (1ª)', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'SC: BG-Imunoestimulante (B-Glucana + B-Glucuronidase) — 1ª de 6 sessões semanais.', false),
(v_cli, v_pac, 'Imunoestimulante SC (2ª)', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'SC: BG-Imunoestimulante — 2ª de 6 sessões.', false),
(v_cli, v_pac, 'Imunoestimulante SC (3ª)', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'SC: BG-Imunoestimulante — 3ª de 6 sessões.', false),
(v_cli, v_pac, 'Deep Regenera (1ª)', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'SC: Deep Regenera — regeneração celular. 1ª de 5 sessões semanais.', false),
(v_cli, v_pac, 'Deep Regenera (2ª)', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'SC: Deep Regenera — 2ª de 5 sessões.', false),
(v_cli, v_pac, 'Teste Intestinal Origon', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'SC: Teste Intestinal Origon — análise de microbioma. 1ª aplicação.', false),
(v_cli, v_pac, 'Transforme X (1ª)', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'SC: Transforme X — protocolo emagrecimento avulso. 1ª de 5 sessões.', false),
(v_cli, v_pac, 'Transforme X (2ª)', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'SC: Transforme X — 2ª de 5 sessões.', false);


/* ══════════════════════════════════════════════════════════════════════
   3. REJANE MOREIRA CASTRO
   Diagnóstico: Nutrologia / Emagrecimento — primeira consulta pendente
   Plano: 07/05/2026 – 07/05/2027
   ══════════════════════════════════════════════════════════════════════ */
SELECT id, clinica_id INTO v_pac, v_cli
  FROM pacientes WHERE nome ILIKE '%Rejane%' AND nome ILIKE '%Castro%';

INSERT INTO agendamentos (clinica_id, paciente_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado) VALUES
(v_cli, v_pac, 'Consulta Nutricionista Pré Nutróloga', '2026-05-26', '09:00', 'Livia Negreiro', 'cancelado',
 'Consulta pré-consulta cancelada.', false),
(v_cli, v_pac, 'Consulta Nutróloga — 1ª Consulta', '2026-06-19', '10:00', 'Dra. Dayane Junqueira', 'agendado',
 'Primeira consulta com Dra. Dayane — exames solicitados, aguardando avaliação completa para definir protocolo.', false),
-- Sessões futuras a definir após consulta
(v_cli, v_pac, 'Consulta Nutricionista — Protocolo', NULL, NULL, 'Livia Negreiro', 'a_agendar',
 'Consulta nutricionista pós-avaliação nutrológica.', false),
(v_cli, v_pac, '1ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'Protocolo EV a definir após consulta inicial.', false),
(v_cli, v_pac, '1ª Sessão IM', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'Protocolo IM a definir após consulta inicial.', false),
(v_cli, v_pac, 'Acompanhamento Profissional', NULL, NULL, 'Dra. Dayane Junqueira', 'a_agendar',
 'Retorno médico — revisão de exames e ajuste do protocolo.', false);


/* ══════════════════════════════════════════════════════════════════════
   4. JACIELLY SOARES DE FARIA
   Diagnóstico: Nutrologia / Emagrecimento (menopausa)
   Plano: 07/05/2026 – 07/05/2027
   ══════════════════════════════════════════════════════════════════════ */
SELECT id, clinica_id INTO v_pac, v_cli
  FROM pacientes WHERE nome ILIKE '%Jacielly%Soares%';

INSERT INTO agendamentos (clinica_id, paciente_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado) VALUES
(v_cli, v_pac, 'Consulta Nutróloga — 1ª Consulta', '2026-05-29', '14:00', 'Dra. Dayane Junqueira', 'agendado',
 'Primeira consulta — exames solicitados, TC de abdome, imagem pós-menopausa. Definição do protocolo.', false),
(v_cli, v_pac, 'Consulta Nutricionista Pré Nutróloga', '2026-06-01', '09:00', 'Livia Negreiro', 'agendado',
 'Avaliação nutricional pré-consulta com nutróloga.', false),
-- Sessões futuras
(v_cli, v_pac, '1ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'Protocolo EV a definir após consulta inicial.', false),
(v_cli, v_pac, '1ª Sessão IM', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'Protocolo IM a definir após consulta inicial.', false),
(v_cli, v_pac, 'Acompanhamento Profissional', NULL, NULL, 'Dra. Dayane Junqueira', 'a_agendar',
 'Retorno médico — revisão de exames e ajuste do protocolo.', false);


/* ══════════════════════════════════════════════════════════════════════
   5. ARDALA POLICENA ALEXANDRE FERNANDES
   Diagnóstico: Nutrologia / Emagrecimento — primeira consulta pendente
   Plano: 08/05/2026 – 08/05/2027
   ══════════════════════════════════════════════════════════════════════ */
SELECT id, clinica_id INTO v_pac, v_cli
  FROM pacientes WHERE nome ILIKE '%Ardala%';

INSERT INTO agendamentos (clinica_id, paciente_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado) VALUES
(v_cli, v_pac, 'Consulta Nutróloga — 1ª Consulta', '2026-06-10', '13:00', 'Dra. Dayane Junqueira', 'agendado',
 'Primeira consulta — exames solicitados. Definição do protocolo de emagrecimento.', false),
(v_cli, v_pac, 'Consulta Nutricionista Pré Nutróloga', '2026-06-11', '09:00', 'Livia Negreiro', 'agendado',
 'Avaliação nutricional pré-consulta com nutróloga.', false),
-- Sessões futuras
(v_cli, v_pac, '1ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'Protocolo EV a definir após consulta inicial.', false),
(v_cli, v_pac, '1ª Sessão IM', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'Protocolo IM a definir após consulta inicial.', false),
(v_cli, v_pac, 'Acompanhamento Profissional', NULL, NULL, 'Dra. Dayane Junqueira', 'a_agendar',
 'Retorno médico — revisão de exames e ajuste do protocolo.', false);


/* ══════════════════════════════════════════════════════════════════════
   6. GLEICIANE PEREIRA DA SILVA
   Diagnóstico: Nutrologia / Emagrecimento — consulta realizada, protocolo prescrito
   Plano: 11/05/2026 – 11/05/2027
   Protocolo: 12 EV + 12 IM + 24 Tirzepatida SC + 5 Acompanhamentos + Checkup Intestinal
   ══════════════════════════════════════════════════════════════════════ */
SELECT id, clinica_id INTO v_pac, v_cli
  FROM pacientes WHERE nome ILIKE '%Gleiciane%Pereira%';

INSERT INTO agendamentos (clinica_id, paciente_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado) VALUES
(v_cli, v_pac, 'Consulta Nutróloga — Início Plano', '2026-05-13', '13:00', 'Dra. Dayane Junqueira', 'atendido',
 'Consulta inicial — screening + prescrição de protocolo EV/IM/Tirzepatida + receitas + pedido exames.', false),
(v_cli, v_pac, 'Consulta Nutricionista Pré Nutróloga', '2026-05-14', '09:30', 'Livia Negreiro', 'cancelado',
 'Consulta cancelada.', false),
(v_cli, v_pac, 'Consulta Nutróloga (cancelado)', '2026-05-14', '14:30', 'Dra. Dayane Junqueira', 'cancelado',
 'Cancelado.', false),
-- Protocolo prescrito (a agendar)
(v_cli, v_pac, 'Consulta Nutricionista — Protocolo', NULL, NULL, 'Livia Negreiro', 'a_agendar',
 'Consulta nutricionista protocolo/plano — acompanhamento alimentar.', false),
(v_cli, v_pac, 'Checkup Intestinal', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'Análise de microbioma pelas fezes — cadastro no sistema Bioma.', false),
(v_cli, v_pac, '1ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV lento: Berberina + Alicina + Magnésio Quelato (protocolo emagrecimento).', false),
(v_cli, v_pac, '1ª Sessão IM', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'IM QSE: ativos termoativadores.', false),
(v_cli, v_pac, '1ª Sessão Tirzepatida SC', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'SC: Tirzepatida + Ativos Emagrecimento — 1ª de 24 sessões semanais.', false),
(v_cli, v_pac, '2ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV lento: protocolo emagrecimento — 2ª sessão.', false),
(v_cli, v_pac, '2ª Sessão IM', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'IM QSE: protocolo emagrecimento — 2ª sessão.', false),
(v_cli, v_pac, '2ª Sessão Tirzepatida SC', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'SC: Tirzepatida + Ativos Emagrecimento — 2ª sessão.', false),
(v_cli, v_pac, '3ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV lento: protocolo emagrecimento — 3ª sessão.', false),
(v_cli, v_pac, '3ª Sessão IM', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'IM: protocolo emagrecimento — 3ª sessão.', false),
(v_cli, v_pac, '3ª Sessão Tirzepatida SC', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'SC: Tirzepatida — 3ª sessão.', false),
(v_cli, v_pac, '1º Acompanhamento Profissional', NULL, NULL, 'Dra. Dayane Junqueira', 'a_agendar',
 'Retorno médico — 1º acompanhamento profissional.', false),
(v_cli, v_pac, '4ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV: 4ª sessão.', false),
(v_cli, v_pac, '4ª Sessão IM', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'IM: 4ª sessão.', false),
(v_cli, v_pac, '4ª Sessão Tirzepatida SC', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'SC: Tirzepatida — 4ª sessão.', false),
(v_cli, v_pac, '5ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV: 5ª sessão.', false),
(v_cli, v_pac, '5ª Sessão IM', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'IM: 5ª sessão.', false),
(v_cli, v_pac, '5ª Sessão Tirzepatida SC', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'SC: Tirzepatida — 5ª sessão.', false),
(v_cli, v_pac, '2º Acompanhamento Profissional', NULL, NULL, 'Dra. Dayane Junqueira', 'a_agendar',
 'Retorno médico — 2º acompanhamento.', false),
(v_cli, v_pac, 'Medicamentos Manipulados — Entrega', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'Entrega/retirada de medicamentos manipulados prescritos.', false);


/* ══════════════════════════════════════════════════════════════════════
   7. IDALINA PEREIRA BRITO
   Diagnóstico: Menopausa + Sintomas gastrointestinais
   Plano: 11/05/2026 – 11/05/2027
   Protocolo: 6 EV + 16 IM + 6 Acompanhamentos + 5 Consultas Nutricionista
   ══════════════════════════════════════════════════════════════════════ */
SELECT id, clinica_id INTO v_pac, v_cli
  FROM pacientes WHERE nome ILIKE '%Idalina%';

INSERT INTO agendamentos (clinica_id, paciente_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado) VALUES
(v_cli, v_pac, 'Consulta Nutróloga (cancelado)', '2026-03-28', '14:00', 'Dra. Dayane Junqueira', 'cancelado',
 'Primeira tentativa — cancelada.', false),
(v_cli, v_pac, 'Consulta Nutricionista (cancelado)', '2026-03-30', '16:00', 'Isabella Jaime', 'cancelado',
 'Cancelada.', false),
(v_cli, v_pac, 'Consulta Nutróloga — Início Plano', '2026-05-11', '11:00', 'Dra. Dayane Junqueira', 'atendido',
 'Consulta inicial — sintomas menopausa (ondas de calor, insônia), gastrite crônica. Prescrito plano EV+IM.', false),
(v_cli, v_pac, 'Consulta Nutricionista — Protocolo', '2026-05-12', '12:00', 'Livia Negreiro', 'atendido',
 'Acompanhamento nutricional — trabalha em escola (período integral), caminhada diária.', false),
(v_cli, v_pac, 'Acompanhamento Profissional', '2026-06-15', '10:00', 'Dra. Dayane Junqueira', 'agendado',
 'Retorno médico agendado — revisão de resultados e ajuste do protocolo.', false),
-- Sessões a agendar
(v_cli, v_pac, '1ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV lento: Biocolin + ZMA + Trio metilador + Vit C + PQQ (menopausa/longevidade).', false),
(v_cli, v_pac, '2ª Sessão IM', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'IM QSE: L-Carnitina + BCAA + L-Arginina + L-Ornitina (emagrecimento + energia).', false),
(v_cli, v_pac, '3ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV lento: Biocolin + Biotina + Pool Aminoácidos + Vit C + L-Glicina.', false),
(v_cli, v_pac, '4ª Sessão IM', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'IM QSE: L-Carnitina + BCAA + L-Arginina + L-Carnosina.', false),
(v_cli, v_pac, '5ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV lento: protocolo longevidade sessão 5.', false),
(v_cli, v_pac, '6ª Sessão IM', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'IM QSE: protocolo intramuscular sessão 6.', false),
(v_cli, v_pac, '6ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV lento: protocolo longevidade sessão 6.', false),
(v_cli, v_pac, '2ª Consulta Nutricionista', NULL, NULL, 'Livia Negreiro', 'a_agendar',
 'Acompanhamento nutricional — 2ª de 5 consultas.', false),
(v_cli, v_pac, '2º Acompanhamento Profissional', NULL, NULL, 'Dra. Dayane Junqueira', 'a_agendar',
 'Retorno médico — 2º acompanhamento.', false);


/* ══════════════════════════════════════════════════════════════════════
   8. MARCOS ANTONIO DE OLIVEIRA
   Diagnóstico: Nutrologia / Emagrecimento
   Plano: 12/05/2026 – 12/05/2027
   Protocolo: SC Sybrava + 6 EV + 6 IM + 2 Acompanhamentos + 10 Deep Regenera
   ══════════════════════════════════════════════════════════════════════ */
SELECT id, clinica_id INTO v_pac, v_cli
  FROM pacientes WHERE nome ILIKE '%Marcos%Antonio%Oliveira%';

INSERT INTO agendamentos (clinica_id, paciente_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado) VALUES
(v_cli, v_pac, '1ª Sessão IM', '2026-05-12', '19:51', 'Deborah Daniele', 'atendido',
 'IM QSE: Coenzima Q10 100mg — 1ª sessão.', false),
(v_cli, v_pac, 'Consulta Nutricionista', '2026-05-18', '14:00', 'Livia Negreiro', 'atendido',
 'Avaliação nutricional avulsa.', false),
(v_cli, v_pac, '2ª Sessão EV + IM', '2026-05-20', '16:00', 'Deborah Daniele', 'atendido',
 'EV: Ác. Alfa Lipoico + L-Arginina + Vit C + metiladores. IM: D-Ribose + L-Carnitina + Sulfato Magnésio.', false),
(v_cli, v_pac, '3ª Sessão EV + IM', '2026-05-26', '13:00', 'Deborah Daniele', 'agendado',
 'EV: Ác. Alfa Lipoico 300mg + Pool Aminoácidos. IM: CHRONIC 10mg.', false),
(v_cli, v_pac, '4ª Sessão IM', '2026-06-02', '18:00', 'Deborah Daniele', 'agendado',
 'IM QSE: Coenzima Q10 100mg.', false),
(v_cli, v_pac, 'Acompanhamento Profissional', '2026-06-17', '11:00', 'Dra. Dayane Junqueira', 'agendado',
 '1º acompanhamento médico agendado — revisão de resultados.', false),
-- Sessões a agendar
(v_cli, v_pac, 'SC Sybrava', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'SC: Sybrava 248mg/1,5mL — aplicação semanal.', false),
(v_cli, v_pac, '4ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV: Ác. Alfa Lipoico 600mg + MSM + metiladores + NAC + Vit C + Complexo B.', false),
(v_cli, v_pac, '5ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV: Ác. Alfa Lipoico 600mg.', false),
(v_cli, v_pac, '6ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV: protocolo antioxidante — 6ª e última sessão EV do plano.', false),
(v_cli, v_pac, '5ª Sessão IM', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'IM QSE: protocolo IM — 5ª sessão.', false),
(v_cli, v_pac, '6ª Sessão IM', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'IM QSE: protocolo IM — 6ª e última sessão IM do plano.', false),
(v_cli, v_pac, 'Deep Regenera (1ª)', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'SC: Deep Regenera — regeneração celular. 1ª de 10 sessões.', false),
(v_cli, v_pac, 'Deep Regenera (2ª)', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'SC: Deep Regenera — 2ª sessão.', false),
(v_cli, v_pac, 'Deep Regenera (3ª)', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'SC: Deep Regenera — 3ª sessão.', false),
(v_cli, v_pac, '2º Acompanhamento Profissional', NULL, NULL, 'Dra. Dayane Junqueira', 'a_agendar',
 'Retorno médico — 2º acompanhamento.', false);


/* ══════════════════════════════════════════════════════════════════════
   9. APARECIDA PETRONILHA DE SOUSA
   Diagnóstico: Nutrologia / Emagrecimento
   Plano: 06/05/2026 – 06/05/2027
   ══════════════════════════════════════════════════════════════════════ */
SELECT id, clinica_id INTO v_pac, v_cli
  FROM pacientes WHERE nome ILIKE '%Aparecida%Petronilha%';

INSERT INTO agendamentos (clinica_id, paciente_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado) VALUES
(v_cli, v_pac, '1ª Sessão EV + IM', '2026-05-06', '14:00', 'Deborah Daniele', 'atendido',
 '1ª sessão: EV lento com MSM + L-Glicina + trio metilador + Biocolin + pool aminoácidos. IM: Coenzima Q10.', false),
(v_cli, v_pac, '2ª Sessão EV + IM', '2026-05-14', '11:00', 'Deborah Daniele', 'cancelado',
 'Sessão cancelada — reagendada para 15/05.', false),
(v_cli, v_pac, '2ª Sessão EV + IM', '2026-05-15', '14:00', 'Deborah Daniele', 'atendido',
 'EV: L-Theanina + L-Glicina + MSM + Pool Aminoácidos + Biocolin. IM: CHRONIC 10mg.', false),
(v_cli, v_pac, '3ª Sessão IM (Atrasada)', '2026-05-21', '14:00', 'Deborah Daniele', 'agendado',
 'IM: Coenzima Q10 + Thermoativador (Teacrine+Cromo+HMB+Carnitina). PENDENTE/ATRASADA.', false),
-- Sessões a agendar
(v_cli, v_pac, '4ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV: Pool Aminoácidos + NAC + Biocolin + Biotina + trio metilador.', false),
(v_cli, v_pac, '4ª Sessão IM', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'IM: CHRONIC 10mg.', false),
(v_cli, v_pac, '5ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV: D-Ribose + Pool Aminoácidos + Biocolin + MSM + Vit C + L-Glicina.', false),
(v_cli, v_pac, '5ª Sessão IM', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'IM QSD: Coenzima Q10.', false),
(v_cli, v_pac, '6ª Sessão IM', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'IM QSE: Coenzima Q10.', false),
(v_cli, v_pac, 'Consulta Nutróloga — Acompanhamento', NULL, NULL, 'Dra. Dayane Junqueira', 'a_agendar',
 'Retorno médico — avaliação de progresso e ajuste de protocolo.', false),
(v_cli, v_pac, 'Consulta Nutricionista — Protocolo', NULL, NULL, 'Livia Negreiro', 'a_agendar',
 'Acompanhamento nutricional.', false);


/* ══════════════════════════════════════════════════════════════════════
   10. ANTONIA LEIDIANE MACHADO DE MORAIS SANTOS
   Diagnóstico: Nutrologia / Reposição Hormonal + Disbiose Intestinal
   Plano: 18/05/2026 – 18/05/2027
   Consulta realizada: 25/05/2026 — protocolo prescrito: 12 EV + 12 IM + 5 Acomp + Teste Intestinal
   ══════════════════════════════════════════════════════════════════════ */
SELECT id, clinica_id INTO v_pac, v_cli
  FROM pacientes WHERE nome ILIKE '%Antonia%Leidiane%';

INSERT INTO agendamentos (clinica_id, paciente_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado) VALUES
(v_cli, v_pac, 'Consulta Nutróloga — Início Plano', '2026-05-25', '12:00', 'Dra. Dayane Junqueira', 'atendido',
 'Teleconsulta — objetivo: reposição hormonal + disbiose intestinal. Paciente faz musculação diária, sensibilidade a histamina, gastrite prévia.', false),
(v_cli, v_pac, 'Consulta Nutricionista — Protocolo', '2026-05-26', '10:00', 'Livia Negreiro', 'atendido',
 'Avaliação nutricional + plano alimentar individualizado. Histórico: Herbalife, intolerâncias.', false),
-- Protocolo prescrito (a agendar)
(v_cli, v_pac, 'Teste Intestinal Origon', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'Teste intestinal SC — análise de microbioma (Origon).', false),
(v_cli, v_pac, '1ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV lento: protocolo EV — 1ª de 12 sessões semanais.', false),
(v_cli, v_pac, '1ª Sessão IM', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'IM QSE: protocolo IM — 1ª de 12 sessões.', false),
(v_cli, v_pac, '2ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV: 2ª sessão.', false),
(v_cli, v_pac, '2ª Sessão IM', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'IM: 2ª sessão.', false),
(v_cli, v_pac, '3ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV: 3ª sessão.', false),
(v_cli, v_pac, '3ª Sessão IM', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'IM: 3ª sessão.', false),
(v_cli, v_pac, '1º Acompanhamento Profissional', NULL, NULL, 'Dra. Dayane Junqueira', 'a_agendar',
 'Retorno médico — 1º acompanhamento.', false),
(v_cli, v_pac, '4ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV: 4ª sessão.', false),
(v_cli, v_pac, '4ª Sessão IM', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'IM: 4ª sessão.', false),
(v_cli, v_pac, '2ª Consulta Nutricionista', NULL, NULL, 'Livia Negreiro', 'a_agendar',
 'Acompanhamento nutricional — 2ª consulta.', false),
(v_cli, v_pac, '2º Acompanhamento Profissional', NULL, NULL, 'Dra. Dayane Junqueira', 'a_agendar',
 'Retorno médico — 2º acompanhamento.', false);


/* ══════════════════════════════════════════════════════════════════════
   11. AMANDA CRUZ FIDELIS ANDRADE
   Diagnóstico: Nutrologia / Emagrecimento — primeira consulta amanhã
   Plano: 21/05/2026 – 21/05/2027
   ══════════════════════════════════════════════════════════════════════ */
SELECT id, clinica_id INTO v_pac, v_cli
  FROM pacientes WHERE nome ILIKE '%Amanda%Cruz%';

INSERT INTO agendamentos (clinica_id, paciente_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado) VALUES
(v_cli, v_pac, 'Consulta Nutróloga — 1ª Consulta', '2026-05-28', '13:00', 'Dra. Dayane Junqueira', 'agendado',
 'Primeira consulta — exames solicitados. Definição do protocolo de emagrecimento.', false),
(v_cli, v_pac, 'Consulta Nutricionista Pré Nutróloga', '2026-05-29', '11:00', 'Livia Negreiro', 'agendado',
 'Avaliação nutricional pré-consulta.', false),
-- Sessões futuras (após consulta)
(v_cli, v_pac, '1ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'Protocolo EV a definir após consulta inicial.', false),
(v_cli, v_pac, '1ª Sessão IM', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'Protocolo IM a definir após consulta inicial.', false),
(v_cli, v_pac, 'Acompanhamento Profissional', NULL, NULL, 'Dra. Dayane Junqueira', 'a_agendar',
 'Retorno médico — revisão de exames e ajuste do protocolo.', false);


/* ══════════════════════════════════════════════════════════════════════
   12. KELLY CRISTINA A SILVA AMORIM
   Diagnóstico: Nutrologia / Emagrecimento + Pós-cirurgia bariátrica
   Plano: 25/05/2026 – 25/05/2027
   Protocolo: 4 EV + 4 IM + 2 Acompanhamentos + 1 Implante SC + 1 Deep Regenera
   ══════════════════════════════════════════════════════════════════════ */
SELECT id, clinica_id INTO v_pac, v_cli
  FROM pacientes WHERE nome ILIKE '%Kelly%Cristina%';

INSERT INTO agendamentos (clinica_id, paciente_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado) VALUES
(v_cli, v_pac, 'Consulta Nutróloga — Início Plano', '2026-05-25', '08:00', 'Dra. Dayane Junqueira', 'atendido',
 'Consulta inicial — pós-bariátrica, tirzepatida 5mg há 1 ano, peso atual 64,5kg. Ansiedade + insônia. Prescrito protocolo EV+IM+implante.', false),
(v_cli, v_pac, '1ª Sessão EV + IM', '2026-05-25', '11:30', 'Deborah Daniele', 'agendado',
 '1ª sessão EV: Resveratrol + NAC + MSM + Biocolin + Inositol+Taurina + Pool Aminoácidos. Aguarda início.', false),
(v_cli, v_pac, 'Consulta Nutricionista — Protocolo', '2026-05-26', '13:00', 'Livia Negreiro', 'atendido',
 'Avaliação nutricional — rotina alimentar irregular, faz faculdade de Farmácia, pós-bariátrica.', false),
-- Protocolo a agendar
(v_cli, v_pac, 'Implante SC — Testosterona + NADH', NULL, NULL, 'Dra. Dayane Junqueira', 'a_agendar',
 'Implante SC: Testosterona 100mg + NADH 200mg (2u) — protocolo hormonal/regenerativo.', false),
(v_cli, v_pac, '2ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV: 2ª sessão do protocolo.', false),
(v_cli, v_pac, '2ª Sessão IM', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'IM: 2ª sessão do protocolo.', false),
(v_cli, v_pac, '3ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV: 3ª sessão do protocolo.', false),
(v_cli, v_pac, '3ª Sessão IM', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'IM: 3ª sessão do protocolo.', false),
(v_cli, v_pac, '1º Acompanhamento Profissional', NULL, NULL, 'Dra. Dayane Junqueira', 'a_agendar',
 'Retorno médico — 1º acompanhamento.', false),
(v_cli, v_pac, '4ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV: 4ª e última sessão EV do plano.', false),
(v_cli, v_pac, '4ª Sessão IM', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'IM: 4ª e última sessão IM do plano.', false),
(v_cli, v_pac, 'Deep Regenera', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'SC: Deep Regenera — 1 sessão regenerativa.', false),
(v_cli, v_pac, '2º Acompanhamento Profissional', NULL, NULL, 'Dra. Dayane Junqueira', 'a_agendar',
 'Retorno médico — 2º acompanhamento.', false);


/* ══════════════════════════════════════════════════════════════════════
   13. CLÁUDIA HELENA BORGES BARBOSA ALMEIDA
   Diagnóstico: Nutrologia / Emagrecimento (plano premium — Mounjaro)
   Plano: 25/05/2026 – 25/05/2027
   Consulta realizada: 25/05/2026
   ══════════════════════════════════════════════════════════════════════ */
SELECT id, clinica_id INTO v_pac, v_cli
  FROM pacientes WHERE nome ILIKE '%Cláudia%Helena%' OR nome ILIKE '%Claudia%Helena%';

INSERT INTO agendamentos (clinica_id, paciente_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado) VALUES
(v_cli, v_pac, 'Consulta Nutróloga — Início Plano', '2026-05-25', '10:00', 'Dra. Dayane Junqueira', 'atendido',
 'Consulta inicial — protocolo premium. Prescrito: EV + IM + SC Mounjaro Pen + receita modulação intestinal (3 fases).', false),
(v_cli, v_pac, '1ª Sessão EV', '2026-05-26', '09:00', 'Deborah Daniele', 'agendado',
 'EV: Resveratrol + MSM + L-Glicina + Biocolin + Metilfolato + SAMe. IM: CHRONIC 10mg.', false),
(v_cli, v_pac, 'Consulta Nutricionista (cancelado)', '2026-05-26', '11:00', 'Livia Negreiro', 'cancelado',
 'Cancelada — reagendada para 28/05.', false),
(v_cli, v_pac, 'Consulta Nutricionista — Protocolo', '2026-05-28', '09:00', 'Livia Negreiro', 'agendado',
 'Avaliação nutricional pós-consulta nutrológica.', false),
(v_cli, v_pac, 'Acompanhamento Profissional', '2026-07-03', '09:30', 'Dra. Dayane Junqueira', 'agendado',
 '1º acompanhamento médico agendado — revisão de resultados pós-início do protocolo.', false),
-- Protocolo Mounjaro + EV/IM restantes (a agendar)
(v_cli, v_pac, '1ª Sessão SC — Mounjaro', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'SC: Mounjaro Pen 10 cliques (0,1ml) — abdome ou face interna do braço. 1ª aplicação.', false),
(v_cli, v_pac, '2ª Sessão SC — Mounjaro', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'SC: Mounjaro Pen — 2ª aplicação semanal.', false),
(v_cli, v_pac, '3ª Sessão SC — Mounjaro', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'SC: Mounjaro Pen — 3ª aplicação semanal.', false),
(v_cli, v_pac, '4ª Sessão SC — Mounjaro', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'SC: Mounjaro Pen — 4ª aplicação semanal.', false),
(v_cli, v_pac, '5ª Sessão SC — Mounjaro', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'SC: Mounjaro Pen — 5ª aplicação semanal.', false),
(v_cli, v_pac, '2ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV: 2ª sessão do protocolo.', false),
(v_cli, v_pac, '2ª Sessão IM', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'IM: 2ª sessão do protocolo.', false),
(v_cli, v_pac, '3ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV: 3ª sessão.', false),
(v_cli, v_pac, '3ª Sessão IM', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'IM: 3ª sessão.', false),
(v_cli, v_pac, '2º Acompanhamento Profissional', NULL, NULL, 'Dra. Dayane Junqueira', 'a_agendar',
 'Retorno médico — 2º acompanhamento.', false);


/* ══════════════════════════════════════════════════════════════════════
   14. SYBELLY VIEIRA BARROS ARANTES
   Diagnóstico: Nutrologia / Emagrecimento (paciente desde 2025)
   Plano: 13/05/2026 – 13/05/2027
   ══════════════════════════════════════════════════════════════════════ */
SELECT id, clinica_id INTO v_pac, v_cli
  FROM pacientes WHERE nome ILIKE '%Sybelly%';

INSERT INTO agendamentos (clinica_id, paciente_id, label, data_agendamento, hora, profissional, status, observacao, alerta_d1_enviado) VALUES
-- Histórico 2025
(v_cli, v_pac, 'Sessão IM', '2025-05-07', '10:00', 'Francielly Ferreira', 'atendido',
 'IM: primeira sessão do protocolo anterior.', false),
(v_cli, v_pac, 'Consulta Nutricionista (desmarcado)', '2025-05-07', '11:00', 'Isabella Jaime', 'cancelado',
 'Desmarcado.', false),
(v_cli, v_pac, 'Consulta Nutróloga (desmarcado)', '2025-05-15', '17:00', 'Dra. Dayane Junqueira', 'cancelado',
 'Desmarcado.', false),
(v_cli, v_pac, 'SC + IM', '2025-06-04', '10:00', 'Francielly Ferreira', 'atendido',
 'SC: Mounjaro Pen + IM: Nandrolona 15mg + Morosil Booster + Thermoativador.', false),
(v_cli, v_pac, 'Sessão IM', '2025-06-18', '08:44', 'Francielly Ferreira', 'atendido',
 'IM: protocolo quinzenal Nandrolona + Termoativadores.', false),
(v_cli, v_pac, 'Consulta Nutróloga PROTOCOLO/PLANO', '2025-07-08', '14:00', 'Dra. Dayane Junqueira', 'atendido',
 'Consulta protocolo/plano — acompanhamento do protocolo de emagrecimento.', false),
(v_cli, v_pac, 'Consulta Nutricionista', '2025-11-04', '15:00', 'Isabella Jaime', 'atendido',
 'Avaliação nutricional — acompanhamento evolutivo.', false),
(v_cli, v_pac, 'Consulta Nutróloga', '2025-11-04', '16:00', 'Dra. Dayane Junqueira', 'atendido',
 'Consulta nova/avulsa — revisão de protocolo.', false),
(v_cli, v_pac, 'Consulta Nutróloga', '2025-11-13', '11:30', 'Dra. Dayane Junqueira', 'atendido',
 'Consulta nova/avulsa — ajuste de conduta.', false),
(v_cli, v_pac, 'Procedimentos Diversos', '2025-11-14', '17:00', 'Dra. Dayane Junqueira', 'atendido',
 'Procedimentos clínicos diversos.', false),
-- Plano 2026
(v_cli, v_pac, 'Consulta Nutróloga — Novo Plano', '2026-05-13', '15:00', 'Dra. Dayane Junqueira', 'atendido',
 'Consulta nova — início do novo plano 05/2026. Prescrito novo protocolo EV com regeneração celular.', false),
(v_cli, v_pac, '2ª Sessão EV', '2026-05-27', '10:00', 'Deborah Daniele', 'agendado',
 'EV lento: N-Acetil-Cisteina + Complexo B + Vit C + MSM + Sulfato de Magnésio + Pool Aminoácidos.', false),
-- Sessões a agendar
(v_cli, v_pac, '3ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV: Resveratrol + NAC + L-Taurina.', false),
(v_cli, v_pac, '4ª Sessão EV', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'EV: Resveratrol + NAC + L-Arginina + Vit C + Immunity + Complexo B + ZMA.', false),
(v_cli, v_pac, '3ª Sessão SC — Imunoestimulante', NULL, NULL, 'Deborah Daniele', 'a_agendar',
 'SC: Imunoestimulante Lisina 98% + Beta-Glucana.', false),
(v_cli, v_pac, 'Consulta Nutricionista — Protocolo', NULL, NULL, 'Livia Negreiro', 'a_agendar',
 'Acompanhamento nutricional do novo plano.', false),
(v_cli, v_pac, 'Acompanhamento Profissional', NULL, NULL, 'Dra. Dayane Junqueira', 'a_agendar',
 'Retorno médico — revisão de resultados e ajuste da conduta.', false);


END $$;
