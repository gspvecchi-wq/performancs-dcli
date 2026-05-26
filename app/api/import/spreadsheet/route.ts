import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parsePatientSpreadsheet } from '@/lib/import/spreadsheetParser'

/**
 * POST /api/import/spreadsheet
 * Body: FormData com field "file" (xlsx/csv)
 *
 * Retorna preview dos dados para confirmação antes de salvar.
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
    const rows    = parsePatientSpreadsheet(buffer)

    const validos  = rows.filter(r => r._errors.length === 0)
    const invalidos = rows.filter(r => r._errors.length > 0)

    return NextResponse.json({
      clinica_id: usuario.clinica_id,
      preview:    rows,
      validos:    validos.length,
      invalidos:  invalidos.length,
      total:      rows.length,
    })
  } catch (err) {
    console.error('[/api/import/spreadsheet]', err)
    return NextResponse.json({ error: 'Erro ao processar planilha' }, { status: 500 })
  }
}
