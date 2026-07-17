import { NextRequest, NextResponse } from 'next/server'
import { parsePlanoPdf } from '@/lib/import/planoPdfParser'
import { parseFrequencia } from '@/lib/import/frequenciaParser'
import {
  parseAgendamentosExcel,
  parseAgendamentosPdf,
  type AgendamentoItem,
} from '@/lib/import/agendamentosParser'
import { consolidar } from '@/lib/plano/consolidate'
import type { PlanoPdfData } from '@/lib/import/planoPdfParser'

/**
 * POST /api/plano/preview
 *
 * Recebe os arquivos de importação via FormData e devolve o PREVIEW consolidado
 * por paciente (feito × falta + agendamentos), SEM gravar no banco. É a etapa de
 * revisão: o usuário confere/edita antes de confirmar em /api/plano/confirm.
 *
 * Campos aceitos (todos opcionais, qualquer combinação):
 *   - planos        : 1+ PDFs "Plano de Tratamento" (um por paciente)
 *   - frequencia    : 1 Excel "Relatório de Frequência" (bulk)
 *   - agendamentos  : 1+ arquivos de agendamentos (Excel bulk ou PDF por paciente)
 *
 * Sem autenticação: apenas parseia os arquivos enviados pelo próprio usuário e
 * devolve o resultado — não acessa nem expõe dados do banco.
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()

    const planoFiles = form.getAll('planos').filter((f): f is File => f instanceof File)
    const freqFile = form.get('frequencia')
    const agendaFiles = form.getAll('agendamentos').filter((f): f is File => f instanceof File)

    const avisos: string[] = []

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
      } catch {
        avisos.push(`Falha ao ler o Excel de frequência "${freqFile.name}"`)
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
      } catch {
        avisos.push(`Falha ao ler os agendamentos "${f.name}"`)
      }
    }
    const agendamentos = agItens.length ? { itens: agItens, _avisos: agAvisos } : null

    if (!planos.length && !frequencia && !agendamentos) {
      return NextResponse.json({ error: 'Nenhum arquivo válido enviado' }, { status: 400 })
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
    return NextResponse.json({ error: 'Erro ao processar os arquivos' }, { status: 500 })
  }
}
