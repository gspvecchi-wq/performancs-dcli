import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PatientImportRow, FinanceiroImportRow } from '@/lib/import/spreadsheetParser'

/**
 * POST /api/import/confirm
 * Body: { type: 'pacientes' | 'financeiro', clinica_id, rows }
 *
 * Confirma e persiste os dados importados no banco.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('clinica_id')
      .eq('id', user.id)
      .single()
    if (!usuario) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 403 })

    const body = await req.json() as {
      type:       'pacientes' | 'financeiro'
      clinica_id: string
      rows:       (PatientImportRow | (FinanceiroImportRow & { paciente_id?: string | null }))[]
    }

    // Segurança: só permite salvar na clínica do usuário autenticado
    if (body.clinica_id !== usuario.clinica_id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    if (body.type === 'pacientes') {
      const rows = (body.rows as PatientImportRow[]).filter(r => r._errors.length === 0)
      const inserts = rows.map(r => ({
        clinica_id:       body.clinica_id,
        nome:             r.nome,
        telefone:         r.telefone ?? null,
        email:            r.email ?? null,
        data_nascimento:  r.data_nascimento ?? null,
        objetivo:         r.objetivo ?? 'saude_geral',
        especialidade:    r.especialidade ?? null,
        plano_inicio:     r.plano_inicio ?? new Date().toISOString().split('T')[0],
        plano_fim:        r.plano_fim ?? '',
        meta_kg:          r.meta_kg ?? null,
        meta_prazo_meses: r.meta_prazo_meses ?? null,
        peso_inicial:     r.peso_inicial ?? null,
        peso_atual:       r.peso_inicial ?? null,
        motivacao:        r.motivacao ?? null,
        historico_saude:  null,
        alertas_contexto: null,
        foto_url:         null,
        status:           'ativo',
        score:            50,
        nivel:            'medio',
        status_pagamento: 'adimplente',
        status_pagamento_atualizado_em: null,
        valor_plano:      null,
        valor_pago:       null,
        criado_por:       user.id,
      }))

      const { error } = await supabase.from('pacientes').insert(inserts)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })

      return NextResponse.json({ success: true, inserted: inserts.length })
    }

    if (body.type === 'financeiro') {
      const rows = (body.rows as (FinanceiroImportRow & { paciente_id?: string | null })[])
        .filter(r => r._errors.length === 0 && r.paciente_id)

      for (const row of rows) {
        await supabase
          .from('pacientes')
          .update({
            status_pagamento: row.status_pagamento,
            status_pagamento_atualizado_em: new Date().toISOString().split('T')[0],
          })
          .eq('id', row.paciente_id!)
          .eq('clinica_id', body.clinica_id)
      }

      return NextResponse.json({ success: true, updated: rows.length })
    }

    return NextResponse.json({ error: 'Tipo de importação inválido' }, { status: 400 })
  } catch (err) {
    console.error('[/api/import/confirm]', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
