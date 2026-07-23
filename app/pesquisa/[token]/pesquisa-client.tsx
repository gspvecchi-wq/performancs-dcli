'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Dados {
  pergunta: string
  primeiro_nome: string | null
  ja_respondida: boolean
  nota: number | null
}

export function PesquisaClient({ token }: { token: string }) {
  const [dados, setDados] = useState<Dados | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)

  const [nota, setNota] = useState<number | null>(null)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    fetch(`/api/pesquisa/${token}`)
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error ?? 'Erro ao carregar')
        setDados(d)
        if (d.ja_respondida) setEnviado(true)
      })
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar'))
      .finally(() => setCarregando(false))
  }, [token])

  async function enviar() {
    if (nota === null) return
    setEnviando(true)
    try {
      const res = await fetch(`/api/pesquisa/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nota, comentario }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Erro ao enviar')
      setEnviado(true)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao enviar')
    } finally {
      setEnviando(false)
    }
  }

  // ── Estados de tela ──
  if (carregando) {
    return (
      <Wrapper>
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
      </Wrapper>
    )
  }

  if (erro && !dados) {
    return (
      <Wrapper>
        <p className="text-white/70 text-center">{erro}</p>
      </Wrapper>
    )
  }

  if (enviado) {
    return (
      <Wrapper>
        <div className="text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h1 className="font-display text-2xl text-white mb-2">Obrigado!</h1>
          <p className="text-white/50 text-sm">
            Sua resposta foi registrada e ajuda a melhorar nosso atendimento.
          </p>
        </div>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <div className="text-center mb-8">
        <p className="text-[11px] font-semibold text-emerald-400/70 uppercase tracking-widest mb-2">
          D&apos;Clinique
        </p>
        <h1 className="font-display text-xl sm:text-2xl text-white leading-snug">
          {dados?.primeiro_nome ? `${dados.primeiro_nome}, ` : ''}
          {dados?.pergunta}
        </h1>
      </div>

      {/* Escala 0–10 */}
      <div className="grid grid-cols-6 sm:grid-cols-11 gap-2 mb-3">
        {Array.from({ length: 11 }).map((_, n) => (
          <button
            key={n}
            onClick={() => setNota(n)}
            className={cn(
              'aspect-square rounded-xl border text-sm font-semibold transition-all',
              nota === n
                ? 'bg-emerald-500 border-emerald-400 text-[#030A07] scale-105'
                : 'bg-white/[0.04] border-white/[0.10] text-white/70 hover:border-emerald-500/50 hover:text-white',
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-white/30 mb-6">
        <span>Nada provável</span>
        <span>Muito provável</span>
      </div>

      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="Quer contar o porquê? (opcional)"
        rows={3}
        className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2.5 text-sm
                   text-white/85 placeholder:text-white/25 focus:border-emerald-500/50 focus:outline-none mb-4"
      />

      {erro && <p className="text-red-400 text-xs mb-3 text-center">{erro}</p>}

      <button
        onClick={enviar}
        disabled={nota === null || enviando}
        className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold
                   transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2"
      >
        {enviando && <Loader2 className="w-4 h-4 animate-spin" />}
        Enviar resposta
      </button>
    </Wrapper>
  )
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#030A07] flex items-center justify-center p-5">
      <div className="w-full max-w-lg bg-[#0C1F18] border border-[#14402C] rounded-2xl p-6 sm:p-8">
        {children}
      </div>
    </div>
  )
}
