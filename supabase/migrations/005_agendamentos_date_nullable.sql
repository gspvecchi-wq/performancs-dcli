-- Permite agendamentos sem data definida (status 'a_agendar')
-- Sessões prescritas no plano mas ainda não agendadas no SupportClinic

ALTER TABLE agendamentos
  ALTER COLUMN data_agendamento DROP NOT NULL;

-- Novos valores válidos de status:
-- 'agendado' | 'atendido' | 'cancelado' | 'remarcado' | 'a_agendar'
COMMENT ON COLUMN agendamentos.status IS
  'agendado | atendido | cancelado | remarcado | a_agendar';
