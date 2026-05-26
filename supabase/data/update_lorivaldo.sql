-- Atualização do paciente Lorivaldo com dados reais do prontuário
DO $$
DECLARE
  v_paciente_id uuid;
  v_clinica_id uuid;
BEGIN
  SELECT id INTO v_clinica_id FROM clinicas LIMIT 1;
  SELECT id INTO v_paciente_id FROM pacientes WHERE nome ILIKE '%Lorivaldo%' LIMIT 1;

  -- Atualizar dados clínicos reais
  UPDATE pacientes SET
    objetivo              = 'massa_muscular',
    peso_inicial          = 50.0,
    peso_atual            = 58.0,
    especialidade         = 'Nutrologia / Reposição Hormonal',
    motivacao             = 'Paciente de 64 anos, residente em área rural (fazenda em Caiapônia-GO). Busca ganho de massa muscular, melhora de disposição, ânimo, força e memória. Diagnóstico de sarcopenia grave + hipogonadismo. Intolerante à lactose. Em reposição hormonal com implantes de testosterona. Não tem desejo de ter filhos. Prefere não tomar medicamentos via oral — usa reposição intramuscular/EV.',
    historico_saude       = 'Hipogonadismo masculino (sarcopenia + andropausa). Cirurgia intestinal prévia (diverticulite, colostomia). Glaucoma (tratamento com Xarlatan). Asma (usa Alenia). Hiperplasia prostática benigna (Dudan/dutasterida). Insuficiência venosa e arterial em MMII. Gastrite. Deficiências: Vit D, B12, zinco, homocisteína elevada. Histórico de pré-diabetes controlado. Pai com IAM (vivo 90 anos), mãe com hipercolesterolemia e DM.',
    score                 = 75,
    nivel                 = 'alto'
  WHERE id = v_paciente_id;

  -- Inserir histórico de pesagens reais
  INSERT INTO pesos (paciente_id, clinica_id, peso_kg, data_pesagem, data_real_conhecida, observacao)
  VALUES
    (v_paciente_id, v_clinica_id, 50.0, '2024-07-31', true, 'Primeira consulta. Queixa de perda de peso (máx histórico: 62kg). Diagnóstico: sarcopenia grave, desnutrição.'),
    (v_paciente_id, v_clinica_id, 54.0, '2024-09-06', true, 'Retorno após início do tratamento com oxandrolona e suplementação.'),
    (v_paciente_id, v_clinica_id, 58.0, '2025-10-11', true, 'Teleconsulta. Paciente relata ganho de força e melhora. Evolução positiva do tratamento.')
  ON CONFLICT (paciente_id, data_pesagem) DO NOTHING;

  -- Inserir a mensagem de orientação da médica como contato
  INSERT INTO contatos (paciente_id, clinica_id, tipo, canal, mensagem, criado_em)
  VALUES (
    v_paciente_id,
    v_clinica_id,
    'enviado',
    'whatsapp',
    'Oi Lorivaldo, espero que esteja tudo ótimo por aí. Estou aqui para dizer o quanto estou feliz de acompanhar você nesse momento de vida. Seguem algumas metas: Meta de água: 1850ml por dia. Meta de alimentação: Consumir principalmente proteínas no café da manhã (ovo, queijos, leites, iogurte). Tente comer pelo menos 3x ao dia. Meta de exercício físico: Movimente-se e se possível use algo com pesinhos leves para ganhar massa muscular. Sono: Mantenha como vem fazendo. Um grande abraço.',
    '2026-05-25 21:34:54'
  );

END;
$$;
