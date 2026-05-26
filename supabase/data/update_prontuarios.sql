-- Atualização dos prontuários reais: Adão, Aparecida, Rejane e Santiago
-- Execute APÓS insert_pacientes.sql e update_lorivaldo.sql
DO $$
DECLARE
  v_clinica_id   uuid;
  v_adao_id      uuid;
  v_aparecida_id uuid;
  v_rejane_id    uuid;
  v_santiago_id  uuid;
BEGIN
  SELECT id INTO v_clinica_id FROM clinicas LIMIT 1;

  SELECT id INTO v_adao_id      FROM pacientes WHERE nome ILIKE '%Adão Ferreira%'        LIMIT 1;
  SELECT id INTO v_aparecida_id FROM pacientes WHERE nome ILIKE '%Aparecida Petronilha%' LIMIT 1;
  SELECT id INTO v_rejane_id    FROM pacientes WHERE nome ILIKE '%Rejane%'               LIMIT 1;
  SELECT id INTO v_santiago_id  FROM pacientes WHERE nome ILIKE '%santiago ferraz%'      LIMIT 1;

  -- ──────────────────────────────────────────────────────────────────────
  -- 1. ADÃO FERREIRA DOS REIS
  -- ──────────────────────────────────────────────────────────────────────
  UPDATE pacientes SET
    especialidade   = 'Nutrologia / Emagrecimento',
    motivacao       = 'Trabalhador rural (gado) em Goiás. Acorda 4:30h, treina em jejum. Quer perder peso e acabar com a barriga. Alimentação exagerada — come além da conta, pouco costume com frutas. Café da manhã: tapioca ou pão com ovos e muçarela; às 9h leite com café sem açúcar + whey. Almoço: arroz, feijão, carne e salada. Tarde: consome bastante doce (canjica, doce de leite). Jantar leve. Bebe pouca água. Dorme bem, estresse baixo. Plano 3 meses — pago R$10.000 PIX em 05/05/2026.',
    historico_saude = 'HDL levemente baixo. Sensibilidade à histamina: mamão (sintoma claro — coça nariz), tomate (investigando). Distensão abdominal e empanzinamento ao comer doce. Intestino regular. Insuficiência venosa/arterial em MMII — USG com doppler arterial e venoso solicitado. Tirzepatida (FLUKKA 60mg) em escalonamento — 3ª dose em 21/05/2026 sem perda de fome percebida. Sessões EV (aminoácidos, Vit C, ZMA, Selenio, MSM, BCAA, L-glutationa) + IM (carnitina, ornitina, carnosina, Thermoativador, BOOSTER ATP, NADH) + 2 consultas acompanhamento. Manipulados orais: Adidão 4.2mg (pré-almoço) + fórmula: MSM, Biotina, Clomifeno, Ioimbina, KSM66, Long Jack, ALA, Mesterolona, Metilcobalamina. Exames solicitados: hemograma, testosterona total/livre, hormônios sexuais (FSH, LH, estradiol, estriol, estrona, DHT, SHBG), lipidograma, PCR-us, homocisteína, D-dímero, fibrinogênio, glicemia. CID: Z10. Nutricionista: Livia Negreiro (acompanhamento 21/05/2026). Próxima consulta: 11/06/2026.'
  WHERE id = v_adao_id;

  -- ──────────────────────────────────────────────────────────────────────
  -- 2. APARECIDA PETRONILHA DE SOUSA
  -- ──────────────────────────────────────────────────────────────────────
  UPDATE pacientes SET
    especialidade   = 'Nutrologia',
    motivacao       = 'Paciente com foco em saúde intestinal, muscular e controle de peso. Intolerância à histamina. Plano com 6 sessões EV + 4 IM + 3 acompanhamentos profissionais. Uso de Corebiome, OmegaCore e vitaminas EV/IM.',
    historico_saude = 'Intolerância à histamina. Tratamento com suplementação EV/IM e probióticos (Corebiome). Uso de OmegaCore e vitaminas. Plano nutricional com foco intestinal e muscular.'
  WHERE id = v_aparecida_id;

  -- ──────────────────────────────────────────────────────────────────────
  -- 3. REJANE MOREIRA CASTRO
  -- ──────────────────────────────────────────────────────────────────────
  UPDATE pacientes SET
    especialidade   = 'Nutrologia / Menopausa / Emagrecimento',
    motivacao       = 'Artista plástica, 45 anos, em processo de investigação de menopausa. Mãe de 2 filhos (Davi e Samuel). Pratica musculação regularmente. Não realizou tratamento nutrológico anteriormente. Busca emagrecimento, qualidade de vida e manejo da menopausa.',
    historico_saude = 'Investigação completa de menopausa em andamento. Exames solicitados: hormônios sexuais extensos (estradiol, estriol, estrona, progesterona, DHEA, FSH, LH, testosterona). Exames de imagem pendentes: ECG, mamografia bilateral, USG transvaginal, USG abdome total. Cirurgia prévia: cesariana. Usa creatina. Sem doenças crônicas conhecidas.',
    peso_atual      = 74.0
  WHERE id = v_rejane_id;

  INSERT INTO pesos (paciente_id, clinica_id, peso_kg, data_pesagem, data_real_conhecida, observacao)
  VALUES (
    v_rejane_id, v_clinica_id,
    74.0, '2026-05-07', false,
    'Peso declarado no questionário de primeira consulta. Data exata não confirmada.'
  )
  ON CONFLICT (paciente_id, data_pesagem) DO NOTHING;

  -- ──────────────────────────────────────────────────────────────────────
  -- 4. SANTIAGO FERRAZ DE MAIA
  -- ──────────────────────────────────────────────────────────────────────
  UPDATE pacientes SET
    objetivo        = 'saude_geral',
    especialidade   = 'Nutrologia / Saúde Intestinal / Disbiose',
    motivacao       = 'Empresário, 43 anos. Histórico extenso e grave de problemas intestinais. Quer retornar a ter uma vida normal. Estresse nível 5/5 (máximo). Pratica musculação e treino funcional. Intolerâncias múltiplas: lactose, glúten, frutose.',
    historico_saude = 'Disbiose intestinal grave com investigação de SIBO (Xifaxan 220mg). Insuficiência pancreática exócrina (Creon 25000UI). CID k62.1 (sangramento retal/úlcera). Investigação de doença celíaca (anti-transglutaminase, HLA DQ2/DQ8). Probióticos intensivos: Akkermansia muciniphila, Probid, Fabergum + L. Rhamnosus + L. Salivarium. Teste intestinal Origon em andamento. Intolerâncias: lactose, glúten, frutose. Cirurgias prévias: joelho direito, ombro esquerdo, septo nasal.',
    peso_atual      = 72.0,
    meta_kg         = -2.0
  WHERE id = v_santiago_id;

  INSERT INTO pesos (paciente_id, clinica_id, peso_kg, data_pesagem, data_real_conhecida, observacao)
  VALUES (
    v_santiago_id, v_clinica_id,
    72.0, '2026-03-04', false,
    'Peso declarado no questionário de primeira consulta. Data exata não confirmada.'
  )
  ON CONFLICT (paciente_id, data_pesagem) DO NOTHING;

END;
$$;
