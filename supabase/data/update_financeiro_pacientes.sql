-- Atualização financeira — 15 pacientes D Clinique maio 2026
-- Fonte: Orçamentos (1).xlsx exportado do SupportClinic
-- Execute APÓS insert_pacientes.sql
-- Campos: valor_plano, valor_pago, status_pagamento, status_pagamento_atualizado_em

UPDATE pacientes SET
  especialidade                  = 'Nutrologia / Reposição Hormonal',
  valor_plano                    = 12000.00,
  valor_pago                     = 12000.00,
  status_pagamento               = 'adimplente',
  status_pagamento_atualizado_em = '2026-05-26'
WHERE nome ILIKE '%Lorivaldo%Vitorino%';

UPDATE pacientes SET
  especialidade                  = 'Nutrologia / Emagrecimento',
  valor_plano                    = 15000.00,
  valor_pago                     = 10000.00,
  plano_fim                      = '2026-08-05',
  status_pagamento               = 'em_atraso',
  status_pagamento_atualizado_em = '2026-05-26'
WHERE nome ILIKE '%Adão%Ferreira%' OR nome ILIKE '%Adao%Ferreira%';

UPDATE pacientes SET
  especialidade                  = 'Nutrologia / Emagrecimento',
  valor_plano                    = 8500.00,
  valor_pago                     = 2500.00,
  status_pagamento               = 'em_atraso',
  status_pagamento_atualizado_em = '2026-05-26'
WHERE nome ILIKE '%Aparecida%Petronilha%';

UPDATE pacientes SET
  especialidade                  = 'Nutrologia / Emagrecimento',
  valor_plano                    = 24000.00,
  valor_pago                     = 24000.00,
  status_pagamento               = 'adimplente',
  status_pagamento_atualizado_em = '2026-05-26'
WHERE nome ILIKE '%Santiago%' AND nome ILIKE '%Maia%';

UPDATE pacientes SET
  especialidade                  = 'Nutrologia / Emagrecimento',
  valor_plano                    = 960.00,
  valor_pago                     = 380.00,
  status_pagamento               = 'em_atraso',
  status_pagamento_atualizado_em = '2026-05-26'
WHERE nome ILIKE '%Rejane%' AND nome ILIKE '%Castro%';

UPDATE pacientes SET
  especialidade                  = 'Nutrologia / Emagrecimento',
  valor_plano                    = 920.00,
  valor_pago                     = 276.00,
  status_pagamento               = 'em_atraso',
  status_pagamento_atualizado_em = '2026-05-26'
WHERE nome ILIKE '%Jacielly%Soares%';

UPDATE pacientes SET
  especialidade                  = 'Nutrologia / Emagrecimento',
  valor_plano                    = 1100.00,
  valor_pago                     = 330.00,
  status_pagamento               = 'em_atraso',
  status_pagamento_atualizado_em = '2026-05-26'
WHERE nome ILIKE '%Ardala%';

UPDATE pacientes SET
  especialidade                  = 'Nutrologia / Emagrecimento',
  valor_plano                    = 1100.00,
  valor_pago                     = 1100.00,
  status_pagamento               = 'adimplente',
  status_pagamento_atualizado_em = '2026-05-26'
WHERE nome ILIKE '%Gleiciane%Pereira%';

UPDATE pacientes SET
  especialidade                  = 'Nutrologia / Menopausa',
  valor_plano                    = 15000.00,
  valor_pago                     = 15000.00,
  status_pagamento               = 'adimplente',
  status_pagamento_atualizado_em = '2026-05-26'
WHERE nome ILIKE '%Idalina%';

UPDATE pacientes SET
  especialidade                  = 'Nutrologia / Emagrecimento',
  valor_plano                    = 28100.00,
  valor_pago                     = 10000.00,
  status_pagamento               = 'em_atraso',
  status_pagamento_atualizado_em = '2026-05-26'
WHERE nome ILIKE '%Marcos%Antonio%Oliveira%';

UPDATE pacientes SET
  especialidade                  = 'Nutrologia / Emagrecimento',
  valor_plano                    = 13500.00,
  valor_pago                     = 13500.00,
  status_pagamento               = 'adimplente',
  status_pagamento_atualizado_em = '2026-05-26'
WHERE nome ILIKE '%Sybelly%';

UPDATE pacientes SET
  especialidade                  = 'Nutrologia / Reposição Hormonal',
  valor_plano                    = 1100.00,
  valor_pago                     = 330.00,
  status_pagamento               = 'em_atraso',
  status_pagamento_atualizado_em = '2026-05-26'
WHERE nome ILIKE '%Antonia%Leidiane%';

UPDATE pacientes SET
  especialidade                  = 'Nutrologia / Emagrecimento',
  valor_plano                    = 990.00,
  valor_pago                     = 330.00,
  status_pagamento               = 'em_atraso',
  status_pagamento_atualizado_em = '2026-05-26'
WHERE nome ILIKE '%Amanda%Cruz%';

UPDATE pacientes SET
  especialidade                  = 'Nutrologia / Emagrecimento',
  valor_plano                    = 18500.00,
  valor_pago                     = 8500.00,
  status_pagamento               = 'em_atraso',
  status_pagamento_atualizado_em = '2026-05-26'
WHERE nome ILIKE '%Kelly%Cristina%';

UPDATE pacientes SET
  especialidade                  = 'Nutrologia / Emagrecimento',
  valor_plano                    = 75888.00,
  valor_pago                     = 6324.00,
  status_pagamento               = 'em_atraso',
  status_pagamento_atualizado_em = '2026-05-26'
WHERE nome ILIKE '%Cláudia%Helena%' OR nome ILIKE '%Claudia%Helena%';
