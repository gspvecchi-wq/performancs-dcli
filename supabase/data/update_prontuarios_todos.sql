-- Atualização de prontuários — motivação, histórico, peso e diagnóstico
-- Fonte: Histórico do Paciente.pdf + Prontuário*.pdf de cada pasta
-- Execute APÓS insert_pacientes.sql e update_financeiro_pacientes.sql
-- Data de geração: 26/05/2026

-- ══════════════════════════════════════════════════════════════
-- LORIVALDO VITORINO DE CARVALHO
-- ══════════════════════════════════════════════════════════════
UPDATE pacientes SET
  motivacao         = 'Paciente de Caiapônia-GO, 64 anos. Busca reposição hormonal (testosterona) por hipogonadismo diagnosticado. Reside em fazenda — área rural — convive com crianças/adolescentes, por isso não pode usar gel de testosterona. Preocupado com qualidade de vida, energia e composição corporal. Valoriza praticidade e quer manter atividades sociais e familiares.',
  historico_saude   = 'Hipogonadismo masculino + Sarcopenia. Testosterona total e livre baixas. PCR elevada (processo inflamatório subclínico). Hipovitaminose B12. Histórico de anemia (resolvida), pré-diabetes (controlada), colesterol/triglicérides previamente alterados (normais atualmente). Dores articulares e formigamentos. Bom desempenho cardiovascular em teste ergométrico. Já realizou implante hormonal de testosterona (2021+). Nega outras comorbidades relevantes.',
  especialidade     = 'Nutrologia / Reposição Hormonal'
WHERE nome ILIKE '%Lorivaldo%Vitorino%';

-- ══════════════════════════════════════════════════════════════
-- SANTIAGO FERRAZ DE MAIA
-- ══════════════════════════════════════════════════════════════
UPDATE pacientes SET
  motivacao         = 'Paciente de Goiânia-GO, 44 anos. Objetivo: emagrecimento e saúde intestinal. Em tratamento desde março/2026, completando o protocolo EV/IM (9ª sessão de 12). Novo protocolo iniciado em maio/2026 focado em microbioma (BG-Imunoestimulante, Deep Regenera, Transforme X).',
  historico_saude   = 'Sem diagnóstico crônico maior reportado. Exames solicitados em maio/2026: sangue completo + hormônios + microbioma. Hemorroides (CID k62.1). Em protocolo de modução intestinal: Creon 25000UI, AdiDão 4,2mg, probióticos (Akkermancia, Corebiome, Fabergum/L.Rhamnosus/L.Salivarum), Glutamina. Alto engajamento com o tratamento.',
  especialidade     = 'Nutrologia / Emagrecimento'
WHERE nome ILIKE '%santiago%' AND nome ILIKE '%maia%';

-- ══════════════════════════════════════════════════════════════
-- REJANE MOREIRA CASTRO
-- ══════════════════════════════════════════════════════════════
UPDATE pacientes SET
  motivacao         = 'Paciente de Goiânia-GO, 46 anos. Objetivo: emagrecimento efetivo. Consulta agendada para 19/06/2026. Exames laboratoriais completos solicitados (hormônios femininos, cortisol salivar, marcadores tumorais, sangue oculto nas fezes). Exames de imagem: ECG, mamografia, USG transvaginal e abdome.',
  historico_saude   = 'Anamnese preenchida (questionário SupportClinic). Faixa etária 45-50 anos — exames de imagem indicados. Exames completos solicitados aguardando resultado para primeira consulta em 19/06/2026.',
  especialidade     = 'Nutrologia / Emagrecimento'
WHERE nome ILIKE '%Rejane%' AND nome ILIKE '%Castro%';

-- ══════════════════════════════════════════════════════════════
-- JACIELLY SOARES DE FARIA
-- ══════════════════════════════════════════════════════════════
UPDATE pacientes SET
  motivacao         = 'Paciente de Goiânia-GO, 40 anos. Objetivo: emagrecimento (menopausa). Consulta marcada para 29/05/2026. Exames completos solicitados incluindo densitometria óssea, TC de abdome total, hormônios femininos pós-menopausa, marcadores tumorais.',
  historico_saude   = 'Menopausa. Exames de imagem pós-menopausa (acima de 50 anos na prescrição: ECG, mamografia, USG transvaginal, USG abdome, USG rins e vias urinárias, densitometria óssea). TC de abdome total solicitado separadamente.',
  especialidade     = 'Nutrologia / Emagrecimento'
WHERE nome ILIKE '%Jacielly%Soares%';

-- ══════════════════════════════════════════════════════════════
-- ARDALA POLICENA ALEXANDRE FERNANDES
-- ══════════════════════════════════════════════════════════════
UPDATE pacientes SET
  motivacao         = 'Paciente de Goiânia-GO, 37 anos. Objetivo: emagrecimento + melhora de qualidade de vida. Consulta agendada para 10/06/2026. Exames laboratoriais completos solicitados (hormônios femininos, cortisol salivar, marcadores tumorais). Exames de imagem: ECG, USG de mama, USG transvaginal, USG abdome total.',
  historico_saude   = 'Sem histórico prévio detalhado. Anamnese preenchida (questionário SupportClinic). Faixa etária até 45 anos — exames de imagem padrão solicitados. Exames aguardando resultado para consulta em 10/06/2026.',
  especialidade     = 'Nutrologia / Emagrecimento'
WHERE nome ILIKE '%Ardala%';

-- ══════════════════════════════════════════════════════════════
-- GLEICIANE PEREIRA DA SILVA
-- ══════════════════════════════════════════════════════════════
UPDATE pacientes SET
  motivacao         = 'Paciente de Goiânia-GO, 35 anos. Objetivo: emagrecimento efetivo. Consulta realizada em 13/05/2026. Protocolo prescrito: 12 sessões EV + 12 IM + 24 Tirzepatida SC semanal + 5 acompanhamentos + checkup intestinal. Exames adicionais: Holter 24h, USG tireoide com Doppler, USG abdome.',
  historico_saude   = 'Receita prescrita: Berberina 500mg + Alicina 200mg + Magnésio Quelato 150mg (pré-refeições), Fluoxetina 10mg + Clordiazepóxido + Furosemida + Picolinato de Cromo + Psyllium (12/12h), Cureit + Trans-Resveratrol + Ác. R-alfa-Lipoico + CoQ10 + Quercetina (manhã), Guardian, Corebiome. Holter e USG tireoide solicitados (investigação de possíveis alterações cardíacas/tiroidianas).',
  especialidade     = 'Nutrologia / Emagrecimento'
WHERE nome ILIKE '%Gleiciane%Pereira%';

-- ══════════════════════════════════════════════════════════════
-- IDALINA PEREIRA BRITO
-- ══════════════════════════════════════════════════════════════
UPDATE pacientes SET
  motivacao         = 'Paciente de Caiapônia-GO, 52 anos. Objetivo: tratamento de sintomas da menopausa (ondas de calor, insônia grave — acorda às 4h sem retornar ao sono), fadiga e questões gastrointestinais. Trabalha em escola período integral. Faz caminhada leve diária (~30 min), planeja iniciar musculação. Filhos: 2.',
  historico_saude   = 'Menopausa em curso. Sintomas: ondas de calor, insônia importante (dorme 20h-21h mas sono não reparador), acorda às 4h. Gastrite crônica (uso contínuo de Guardian + Sucrafilm). Sintomas: azia, náusea com doces/sorvete, sensibilidade alimentar. Intestino desregulado previamente. Protocolo prescrito: 6 EV + 16 IM + 5 Consultas Nutricionista + 6 Acompanhamentos.',
  especialidade     = 'Nutrologia / Menopausa'
WHERE nome ILIKE '%Idalina%';

-- ══════════════════════════════════════════════════════════════
-- MARCOS ANTONIO DE OLIVEIRA
-- ══════════════════════════════════════════════════════════════
UPDATE pacientes SET
  motivacao         = 'Paciente de Anicuns-GO, 66 anos. Objetivo: emagrecimento e melhora metabólica. Iniciou tratamento em 12/05/2026. Protocolo: SC Sybrava + 6 EV (Ác. Alfa Lipoico, MSM, metiladores) + 6 IM (Coenzima Q10, D-Ribose, L-Carnitina) + 10 Deep Regenera + 2 Acompanhamentos. Em tratamento ativo — 2 sessões realizadas.',
  historico_saude   = 'Sem diagnóstico detalhado no prontuário. Receita prescrita 23/05/2026: Cureit + Trans-Resveratrol + Astaxantina + Ác. R-Alfa-Lipoico + CoQ10, Super Ômega 3, NAC + Magnésio Quelato + Silimarina + SAMe + Mix Tocoferóis. Screeningfeito em 25/05/2026.',
  especialidade     = 'Nutrologia / Emagrecimento'
WHERE nome ILIKE '%Marcos%Antonio%Oliveira%';

-- ══════════════════════════════════════════════════════════════
-- APARECIDA PETRONILHA DE SOUSA
-- ══════════════════════════════════════════════════════════════
UPDATE pacientes SET
  motivacao         = 'Paciente iniciou tratamento em 06/05/2026. Objetivo: emagrecimento. Em andamento: 2 sessões realizadas, 1 cancelada, 1 atrasada (21/05/2026 — pendente). Protocolo: 5 EV + 6+ IM semanais. Sem telefone ou e-mail cadastrado no prontuário.',
  historico_saude   = 'Sem histórico detalhado no prontuário. Protocolo EV inclui: MSM + L-Glicina + Trio metilador + Biocolin + Pool Aminoácidos. Protocolo IM inclui: Coenzima Q10, CHRONIC 10mg, Thermoativador (Teacrine+Cromo+HMB+Carnitina). Sessão de 21/05 está atrasada/pendente.',
  especialidade     = 'Nutrologia / Emagrecimento'
WHERE nome ILIKE '%Aparecida%Petronilha%';

-- ══════════════════════════════════════════════════════════════
-- ANTONIA LEIDIANE MACHADO DE MORAIS SANTOS
-- ══════════════════════════════════════════════════════════════
UPDATE pacientes SET
  motivacao         = 'Paciente de Goiânia-GO, 36 anos. Objetivo: reposição hormonal + tratamento de disbiose intestinal. Faz musculação todos os dias (SEG/QUA/SEX pela manhã, TER/QUI à tarde). Não trabalha fora. Filhos: 2. Consulta realizada em 25/05/2026 (teleconsulta). Nutritionist visto em 26/05/2026.',
  historico_saude   = 'Disbiose intestinal (descoberta com Dra. Dayane). Sensibilidade a histamina (tomate, coalhada, queijo, vinho tinto — causa coceira/nariz entupido/rosto inchado). Intolerância a leite (estufação). Gases após almoço, distensão abdominal à noite. Dor de cabeça frequente. Histórico familiar de hipertensão. Uso anterior de gestrinona (não se sentiu bem). Enzimas hepáticas alteradas — exames solicitados (HBV, HCV, Hepatite A, Rubéola, CMV, Anti-HBS, HIV). Protocolo prescrito: 12 EV + 12 IM + 5 Acompanhamentos + Teste Intestinal Origon.',
  especialidade     = 'Nutrologia / Reposição Hormonal'
WHERE nome ILIKE '%Antonia%Leidiane%';

-- ══════════════════════════════════════════════════════════════
-- AMANDA CRUZ FIDELIS ANDRADE
-- ══════════════════════════════════════════════════════════════
UPDATE pacientes SET
  motivacao         = 'Paciente de Goiânia-GO, 34 anos. Objetivo: emagrecimento. Primeira consulta agendada para 28/05/2026. Exames laboratoriais completos solicitados (hormônios femininos, sem cortisol nesse pedido). Exames de imagem até 45 anos solicitados (ECG, USG mama, USG transvaginal, USG abdome).',
  historico_saude   = 'Anamnese preenchida (questionário SupportClinic). Pedido de exames sem cortisol emitido em 22/05/2026. Protocolo a definir após consulta em 28/05/2026.',
  especialidade     = 'Nutrologia / Emagrecimento'
WHERE nome ILIKE '%Amanda%Cruz%';

-- ══════════════════════════════════════════════════════════════
-- KELLY CRISTINA A SILVA AMORIM
-- ══════════════════════════════════════════════════════════════
UPDATE pacientes SET
  motivacao         = 'Paciente de Goiânia-GO, 42 anos. Objetivo: emagrecimento pós-bariátrica + equilíbrio hormonal + melhora do sono e ansiedade. Gastroplastia há 5 anos (peso máximo 100kg, atual 64,5kg). Tirzepatida 5mg há 1 ano. Iniciou musculação há 2 meses. Faz faculdade de Farmácia (sai às 17h30, volta às 22h). Abdominoplastia e lipoaspiração em jan/2026.',
  historico_saude   = 'Pós-bariátrica. Tirzepatida 5mg atual. Ansiedade + episódios de insônia (acordou 3h — não voltou a dormir). Sem intolerâncias alimentares conhecidas. Nega rinite/sinusite. Dor de cabeça leve (melhorou com água). Intestino funciona melhor no fim de semana. Perimenopausa descartada por ora pela Dra. Dayane — insulina a tratar via alimentação. Protocolo prescrito: 4 EV + 4 IM + 1 Implante SC (Testosterona 100mg + NADH) + 1 Deep Regenera + 2 Acompanhamentos.',
  especialidade     = 'Nutrologia / Emagrecimento'
WHERE nome ILIKE '%Kelly%Cristina%';

-- ══════════════════════════════════════════════════════════════
-- CLÁUDIA HELENA BORGES BARBOSA ALMEIDA
-- ══════════════════════════════════════════════════════════════
UPDATE pacientes SET
  motivacao         = 'Paciente de Goiânia-GO, 63 anos. Objetivo: emagrecimento efetivo (plano premium — Mounjaro). Consulta realizada em 25/05/2026. Protocolo prescrito: EV + IM CHRONIC + SC Mounjaro Pen. Protocolo de modulação intestinal em 3 fases prescrito.',
  historico_saude   = 'Protocolo intestinal completo prescrito em 3 fases: Fase 1 (início imediato): NAC + Magnésio + Silimarina + SAMe + Mix Tocoferóis + Bromelina/Amilase/Protease/Lactase (enzimas digestivas) + Echinacea. Fase 2 (5 dias após): Biointestil + Motylite + Fibergum + Saccharomyces + L-Glutamina + NAC + Vit C + Zinco Carnosina + L-Glicina. Fase 3 (10 dias após fase 2): Akkermancia + L-Rhamnosus + L-Salivarum + B.Bifidum. Protocolo EV: Resveratrol + MSM + L-Glicina + Biocolin + Metilfolato + SAMe. 1ª sessão SC Mounjaro agendada para 26/05/2026.',
  especialidade     = 'Nutrologia / Emagrecimento'
WHERE nome ILIKE '%Cláudia%Helena%' OR nome ILIKE '%Claudia%Helena%';

-- ══════════════════════════════════════════════════════════════
-- SYBELLY VIEIRA BARROS ARANTES
-- ══════════════════════════════════════════════════════════════
UPDATE pacientes SET
  motivacao         = 'Paciente de Goiânia-GO, 49 anos. Paciente de longa data (desde 05/2025). Objetivo: emagrecimento. Histórico: múltiplas consultas e sessões em 2025 (SC Mounjaro + IM Nandrolona + Thermoativadores). Nova consulta em 13/05/2026 com início de novo protocolo EV (regeneração celular). 2ª sessão EV confirmada para 27/05/2026.',
  historico_saude   = 'Em acompanhamento contínuo desde maio/2025. Protocolo 2025 incluiu: SC Mounjaro Pen (semanal), IM Nandrolona 15mg (quinzenal), IM Morosil Booster (5/5 dias), IM Thermoativador (semanal), SC Hipersensibilidade alimentar 216 alimentos, SC Checkup intestinal. Novo protocolo 2026: EV com N-Acetil-Cisteina + Complexo B + Vit C + MSM + Sulfato Magnésio + Pool Aminoácidos + Resveratrol + L-Taurina + L-Arginina + Immunity + ZMA + SC Imunoestimulante.',
  especialidade     = 'Nutrologia / Emagrecimento'
WHERE nome ILIKE '%Sybelly%';

-- ══════════════════════════════════════════════════════════════
-- ADÃO FERREIRA DOS REIS (complemento)
-- ══════════════════════════════════════════════════════════════
UPDATE pacientes SET
  motivacao         = 'Paciente em emagrecimento. Plano de 3 meses (mai-ago/2026). Protocolo: EV+IM+SC Tirzepatida 0,1ml semanal. Sessões com Deborah Daniele (EV+IM) e Dra. Dayane/Livia (acompanhamentos).',
  historico_saude   = 'Sem histórico detalhado no prontuário. Plano iniciado em 05/05/2026. Sessão 1 realizada (05/05) + consulta nutricionista realizada (21/05). Acompanhamento com Dra. Dayane em 11/06/2026.',
  especialidade     = 'Nutrologia / Emagrecimento'
WHERE nome ILIKE '%Adão%Ferreira%' OR nome ILIKE '%Adao%Ferreira%';
