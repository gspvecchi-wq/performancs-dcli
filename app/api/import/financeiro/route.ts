import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseFinanceiroSpreadsheet } from '@/lib/import/spreadsheetParser'

/**
 * POST /api/import/financeiro
 * Body: FormData com field "file" (xlsx/csv exportado da ferramenta financeira)
 *
 * Retorna preview das atualizações de status de pagamento.
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

    const formData = await req.formData()
    const file     = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })

    const buffer  = Buffer.from(await file.arrayBuffer())
    const rows    = parseFinanceiroSpreadsheet(buffer)

    // Carregar pacientes da clínica para fazer match por nome
    const { data: pacientes } = await supabase
      .from('pacientes')
      .select('id, nome, status_pagamento')
      .eq('clinica_id', usuario.clinica_id)

    // Match fuzzy por nome normalizado
    const normalize = (s: string) =>
      s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()

    const updates = rows
      .filter(r => r._errors.length === 0)
      .map(importRow => {
        const match = pacientes?.find(
          p => normalize(p.nome) === normalize(importRow.nome)
        )
        return {
          ...importRow,
          paciente_id:   match?.id ?? null,
          nome_atual:    match?.nome ?? null,
          status_atual:  match?.status_pagamento ?? null,
          matched:       !!match,
        }
      })

    const matched   = updates.filter(u => u.matched)
    const unmatched = updates.filter(u => !u.matched)

    return NextResponse.json({
      clinica_id: usuario.clinica_id,
      updates,
      matched:   matched.length,
      unmatched: unmatched.length,
      total:     rows.length,
    })
  } catch (err) {
    console.error('[/api/import/financeiro]', err)
    return NextResponse.json({ error: 'Erro ao processar planilha financeira' }, { status: 500 })
  }
}
