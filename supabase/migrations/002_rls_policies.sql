-- PerformanCS — RLS Policies
-- Migração 002: Row Level Security

-- Habilitar RLS em todas as tabelas
ALTER TABLE clinicas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios              ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocolo_momentos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE execucoes_protocolo   ENABLE ROW LEVEL SECURITY;
ALTER TABLE contatos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE pesos                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas               ENABLE ROW LEVEL SECURITY;
ALTER TABLE fila_do_dia           ENABLE ROW LEVEL SECURITY;
ALTER TABLE correcoes_rota        ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log             ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- Função auxiliar: clínica do usuário autenticado
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION minha_clinica_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT clinica_id FROM usuarios WHERE id = auth.uid() LIMIT 1;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- CLINICAS — somente admin pode ver/editar a própria clínica
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "clinica_select" ON clinicas
  FOR SELECT USING (id = minha_clinica_id());

CREATE POLICY "clinica_update" ON clinicas
  FOR UPDATE USING (
    id = minha_clinica_id()
    AND (SELECT papel FROM usuarios WHERE id = auth.uid()) = 'admin'
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- USUARIOS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "usuarios_select" ON usuarios
  FOR SELECT USING (clinica_id = minha_clinica_id());

CREATE POLICY "usuarios_update_self" ON usuarios
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "usuarios_insert" ON usuarios
  FOR INSERT WITH CHECK (
    clinica_id = minha_clinica_id()
    AND (SELECT papel FROM usuarios WHERE id = auth.uid()) = 'admin'
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- PACIENTES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "pacientes_select" ON pacientes
  FOR SELECT USING (clinica_id = minha_clinica_id());

CREATE POLICY "pacientes_insert" ON pacientes
  FOR INSERT WITH CHECK (clinica_id = minha_clinica_id());

CREATE POLICY "pacientes_update" ON pacientes
  FOR UPDATE USING (clinica_id = minha_clinica_id());

CREATE POLICY "pacientes_delete" ON pacientes
  FOR DELETE USING (
    clinica_id = minha_clinica_id()
    AND (SELECT papel FROM usuarios WHERE id = auth.uid()) = 'admin'
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- PLANO_ACOMPANHAMENTO_MOMENTOS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "momentos_select" ON protocolo_momentos
  FOR SELECT USING (clinica_id = minha_clinica_id());

CREATE POLICY "momentos_insert" ON protocolo_momentos
  FOR INSERT WITH CHECK (
    clinica_id = minha_clinica_id()
    AND (SELECT papel FROM usuarios WHERE id = auth.uid()) IN ('admin', 'medico')
  );

CREATE POLICY "momentos_update" ON protocolo_momentos
  FOR UPDATE USING (
    clinica_id = minha_clinica_id()
    AND (SELECT papel FROM usuarios WHERE id = auth.uid()) IN ('admin', 'medico')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- EXECUCOES_PLANO_ACOMPANHAMENTO
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "exec_select" ON execucoes_protocolo
  FOR SELECT USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = minha_clinica_id())
  );

CREATE POLICY "exec_insert" ON execucoes_protocolo
  FOR INSERT WITH CHECK (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = minha_clinica_id())
  );

CREATE POLICY "exec_update" ON execucoes_protocolo
  FOR UPDATE USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = minha_clinica_id())
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- CONTATOS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "contatos_select" ON contatos
  FOR SELECT USING (clinica_id = minha_clinica_id());

CREATE POLICY "contatos_insert" ON contatos
  FOR INSERT WITH CHECK (clinica_id = minha_clinica_id());

CREATE POLICY "contatos_update" ON contatos
  FOR UPDATE USING (clinica_id = minha_clinica_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- PESOS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "pesos_select" ON pesos
  FOR SELECT USING (clinica_id = minha_clinica_id());

CREATE POLICY "pesos_insert" ON pesos
  FOR INSERT WITH CHECK (clinica_id = minha_clinica_id());

CREATE POLICY "pesos_update" ON pesos
  FOR UPDATE USING (clinica_id = minha_clinica_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- ALERTAS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "alertas_select" ON alertas
  FOR SELECT USING (clinica_id = minha_clinica_id());

CREATE POLICY "alertas_insert" ON alertas
  FOR INSERT WITH CHECK (clinica_id = minha_clinica_id());

CREATE POLICY "alertas_update" ON alertas
  FOR UPDATE USING (clinica_id = minha_clinica_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- FILA DO DIA
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "fila_select" ON fila_do_dia
  FOR SELECT USING (clinica_id = minha_clinica_id());

CREATE POLICY "fila_insert" ON fila_do_dia
  FOR INSERT WITH CHECK (clinica_id = minha_clinica_id());

CREATE POLICY "fila_update" ON fila_do_dia
  FOR UPDATE USING (clinica_id = minha_clinica_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- CORREÇÕES DE ROTA
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "correcoes_select" ON correcoes_rota
  FOR SELECT USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = minha_clinica_id())
  );

CREATE POLICY "correcoes_insert" ON correcoes_rota
  FOR INSERT WITH CHECK (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = minha_clinica_id())
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- AUDIT LOG — somente leitura para admins, inserção apenas server-side
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "audit_select" ON audit_log
  FOR SELECT USING (
    clinica_id = minha_clinica_id()
    AND (SELECT papel FROM usuarios WHERE id = auth.uid()) = 'admin'
  );
-- INSERT via service_role key apenas (API Routes server-side)
