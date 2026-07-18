import { NextRequest, NextResponse } from 'next/server'
import type { PlanoPdfData } from '@/lib/import/planoPdfParser'
import type { AgendamentoItem } from '@/lib/import/agendamentosParser'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * POST /api/plano/preview
 *
 * Recebe os arquivos de importação via FormData e devolve o PREVIEW consolidado
 * por paciente (feito × falta + agendamentos), SEM gravar no banco.
 *
 * Os parsers são importados dinamicamente para que uma eventual falha ao carregar
 * o pdf-parse (worker do pdfjs em serverless) seja capturada e devolvida como JSON
 * legível — em vez de derrubar a função e retornar HTML de erro.
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()

    const planoFiles = form.getAll('planos').filter((f): f is File => f instanceof File)
    const freqFile = form.get('frequencia')
    const agendaFiles = form.getAll('agendamentos').filter((f): f is File => f instanceof File)

    const avisos: string[] = []

    // Imports dinâmicos (isola falha de carregamento do pdf-parse)
    const [{ parsePlanoPdf }, { parseFrequencia }, agMod, { consolidar }] = await Promise.all([
      import('@/lib/import/planoPdfParser'),
      import('@/lib/import/frequenciaParser'),
      import('@/lib/import/agendamentosParser'),
      import('@/lib/plano/consolidate'),
    ])
    const { parseAgendamentosExcel, parseAgendamentosPdf } = agMod

    // ── Planos (PDF, um por paciente) ─────────────────────────────────────────
    const planos: PlanoPdfData[] = []
    for (const f of planoFiles) {
      try {
        const buf = Buffer.from(await f.arrayBuffer())
        planos.push(await parsePlanoPdf(buf))
      } catch (e) {
        console.error('[preview] erro plano', f.name, e)
        avisos.push(`Falha ao ler o PDF de plano "${f.name}": ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    // ── Frequência (Excel bulk) ───────────────────────────────────────────────
    let frequencia = null
    if (freqFile instanceof File) {
      try {
        frequencia = parseFrequencia(Buffer.from(await freqFile.arrayBuffer()))
      } catch (e) {
        avisos.push(`Falha ao ler o Excel de frequência "${freqFile.name}": ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    // ── Agendamentos (Excel bulk ou PDF por paciente) ─────────────────────────
    const agItens: AgendamentoItem[] = []
    const agAvisos: string[] = []
    for (const f of agendaFiles) {
      try {
        const buf = Buffer.from(await f.arrayBuffer())
        const data = f.name.toLowerCase().endsWith('.pdf')
          ? await parseAgendamentosPdf(buf)
          : parseAgendamentosExcel(buf)
        agItens.push(...data.itens)
        agAvisos.push(...data._avisos)
      } catch (e) {
        avisos.push(`Falha ao ler os agendamentos "${f.name}": ${e instanceof Error ? e.message : String(e)}`)
      }
    }
    const agendamentos = agItens.length ? { itens: agItens, _avisos: agAvisos } : null

    if (!planos.length && !frequencia && !agendamentos) {
      // nenhum arquivo parseou — devolve os avisos pra o usuário entender o porquê
      return NextResponse.json(
        { error: avisos[0] ?? 'Nenhum arquivo válido enviado', avisos },
        { status: 400 },
      )
    }

    const pacientes = consolidar({ planos, frequencia, agendamentos })

    const resumo = {
      pacientes: pacientes.length,
      com_plano: planos.length,
      itens_rastreaveis: pacientes.reduce((n, p) => n + p.itens.length, 0),
      agendamentos: agItens.length,
      truncados: agItens.filter((a) => a.truncado).length,
    }

    return NextResponse.json({ pacientes, resumo, avisos: [...avisos, ...agAvisos] })
  } catch (err) {
    console.error('[/api/plano/preview]', err)
    // devolve a mensagem real (não HTML) para permitir diagnóstico no front
    return NextResponse.json(
      { error: `Erro ao processar: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    )
  }
}
