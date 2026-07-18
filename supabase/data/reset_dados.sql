-- ⚠️  RESET COMPLETO DOS DADOS DE PACIENTES  ⚠️
-- Rode no SQL Editor do Supabase para começar do zero (ex.: reimportar a partir
-- do Laércio). Operação IRREVERSÍVEL.
--
-- MANTÉM: clinicas, usuarios, protocolo_momentos (config).
-- APAGA:  pacientes e tudo que depende deles (agendamentos, alertas, pesos,
--         contatos, fila_do_dia, correcoes_rota, execucoes_protocolo,
--         plano_itens) + o catálogo de procedimentos.
--
-- O CASCADE remove automaticamente todas as tabelas com FK para pacientes.

TRUNCATE TABLE
  pacientes,
  procedimentos
CASCADE;
