-- Limpa duplicatas de pacientes mantendo apenas o registro mais recente por nome.
-- CASCADE remove automaticamente agendamentos, alertas, pesos e fila_do_dia vinculados.
-- Execute UMA VEZ para corrigir, depois o insert_pacientes.sql já é seguro re-executar.

DELETE FROM pacientes
WHERE id NOT IN (
  SELECT DISTINCT ON (lower(trim(nome))) id
  FROM pacientes
  ORDER BY lower(trim(nome)), criado_em DESC
);

-- Confirma quantos pacientes sobraram
SELECT count(*) AS pacientes_restantes FROM pacientes;
