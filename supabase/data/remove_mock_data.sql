-- Remove dados de seed/mock do banco (pacientes falsos criados pelo seed.sql)
-- Seguro rodar mesmo se algumas tabelas ainda não existem.

DO $$
DECLARE
  v_ids uuid[];
BEGIN
  -- Coleta IDs dos pacientes falsos
  SELECT ARRAY_AGG(id) INTO v_ids
  FROM pacientes
  WHERE nome IN (
    'Marcos Nunes',
    'Camila Torres',
    'Letícia Melo',
    'Roberto Alves'
  );

  IF v_ids IS NULL OR array_length(v_ids, 1) = 0 THEN
    RAISE NOTICE 'Nenhum paciente mock encontrado. Nada a remover.';
    RETURN;
  END IF;

  RAISE NOTICE 'Removendo % pacientes mock...', array_length(v_ids, 1);

  DELETE FROM fila_do_dia WHERE paciente_id = ANY(v_ids);
  DELETE FROM alertas     WHERE paciente_id = ANY(v_ids);
  DELETE FROM contatos    WHERE paciente_id = ANY(v_ids);
  DELETE FROM pesos       WHERE paciente_id = ANY(v_ids);

  -- Tabelas opcionais (só existem após migration completa)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'execucoes_protocolo') THEN
    DELETE FROM execucoes_protocolo WHERE paciente_id = ANY(v_ids);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'correcoes_rota') THEN
    DELETE FROM correcoes_rota WHERE paciente_id = ANY(v_ids);
  END IF;

  DELETE FROM pacientes WHERE id = ANY(v_ids);

  RAISE NOTICE 'Pacientes mock removidos com sucesso.';
END;
$$;
