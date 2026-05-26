-- Agendamentos por paciente (marcos reais do plano de tratamento)
-- Importados do D Clinique / SupportClinic via PDF ou manualmente

CREATE TABLE agendamentos (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id      uuid NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  clinica_id       uuid NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
  label            text NOT NULL,         -- "1ª Sessão EV + IM", "Consulta Nutricionista"
  data_agendamento date NOT NULL,
  hora             time,
  profissional     text,
  status           text NOT NULL DEFAULT 'agendado',
                   -- 'agendado' | 'atendido' | 'cancelado' | 'remarcado'
  observacao       text,
  alerta_d1_enviado boolean NOT NULL DEFAULT false,  -- controle do alerta D-1
  criado_em        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_agendamentos_paciente ON agendamentos(paciente_id);
CREATE INDEX idx_agendamentos_clinica  ON agendamentos(clinica_id);
CREATE INDEX idx_agendamentos_data     ON agendamentos(data_agendamento);

-- RLS
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agendamentos_clinica" ON agendamentos
  USING (clinica_id = (SELECT clinica_id FROM usuarios WHERE id = auth.uid()));

-- Adiciona tipo de alerta para confirmação de agendamento
-- (tabela alertas usa text livre — apenas documentando o novo tipo aqui)
-- tipo: 'confirmacao_agendamento' | severidade: 'atencao'
