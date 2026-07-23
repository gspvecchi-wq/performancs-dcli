import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * Cliente com service_role — IGNORA RLS.
 *
 * Use APENAS em rotas server-side onde o acesso é legitimado por outro meio
 * (ex.: token opaco da pesquisa pública, em que o paciente responde sem login).
 * Nunca importar em componentes de cliente.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada')
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
