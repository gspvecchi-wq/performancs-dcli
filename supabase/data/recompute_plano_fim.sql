-- Recalcula o "fim do plano" dos pacientes já importados (que ficaram com o
-- fallback de +12 meses). Novo fim = início + duração do procedimento mais longo
-- ((nº de sessões − 1) × frequência do procedimento). Rode no SQL Editor.

UPDATE pacientes p
SET plano_fim = sub.fim
FROM (
  SELECT
    pi.paciente_id,
    (pac.plano_inicio
      + (MAX(GREATEST(pi.qtd_prevista - 1, 0) * COALESCE(pr.frequencia_dias, 7)))
        * INTERVAL '1 day')::date AS fim
  FROM plano_itens pi
  JOIN procedimentos pr  ON pr.id = pi.procedimento_id
  JOIN pacientes      pac ON pac.id = pi.paciente_id
  GROUP BY pi.paciente_id, pac.plano_inicio
) sub
WHERE p.id = sub.paciente_id;
