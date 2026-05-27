'use client'

import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import type { HealthScoreBreakdown } from '@/lib/scoring/healthScore'

interface ScoreRingProps {
  score: number
  size?: number
  breakdown?: HealthScoreBreakdown[]
  whatsappActive?: boolean
}

function getColor(score: number): string {
  if (score >= 75) return '#10b981'  // emerald-500
  if (score >= 50) return '#22c55e'  // green-500
  return '#ef4444'                   // red-500
}

const BAR_COLORS: Record<string, string> = {
  emerald: 'bg-emerald-500',
  blue:    'bg-blue-400',
  violet:  'bg-violet-400',
  amber:   'bg-amber-400',
}

export function ScoreRing({ score, size = 88, breakdown, whatsappActive }: ScoreRingProps) {
  const r = (size / 2) - 8
  const circumference = 2 * Math.PI * r
  const color = getColor(score)

  const motionScore = useMotionValue(0)
  const displayScore = useTransform(motionScore, (v) => Math.round(v))
  const dashoffset = useTransform(
    motionScore,
    (v) => circumference - (v / 100) * circumference,
  )

  useEffect(() => {
    const controls = animate(motionScore, score, {
      duration: 1.2,
      ease: [0.4, 0, 0.2, 1],
    })
    return controls.stop
  }, [score, motionScore])

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Anel */}
      <div className="relative inline-flex flex-col items-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={7}
          />
          {/* Progress */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset: dashoffset, rotate: -90, transformOrigin: '50% 50%' }}
          />
          {/* Número */}
          <foreignObject x="0" y="0" width={size} height={size}>
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ fontFamily: 'inherit' }}
            >
              <motion.span
                style={{ color, fontSize: size < 80 ? 16 : 20, fontWeight: 700, lineHeight: 1 }}
              >
                {displayScore}
              </motion.span>
            </div>
          </foreignObject>
        </svg>
        <span className="text-[10px] text-white/35 font-medium mt-1 tracking-wide uppercase">
          {whatsappActive ? 'health score' : 'engajamento'}
        </span>
      </div>

      {/* Breakdown (opcional) */}
      {breakdown && breakdown.length > 0 && (
        <div className="w-full space-y-1.5 min-w-[140px]">
          {breakdown.map((b) => (
            <div key={b.label} className="flex items-center gap-2">
              <span className="text-[10px] text-white/40 w-[80px] truncate shrink-0">{b.label}</span>
              <div className="flex-1 h-1 rounded-full bg-white/[0.07] overflow-hidden">
                <div
                  className={`h-full rounded-full ${BAR_COLORS[b.color] ?? 'bg-emerald-500'}`}
                  style={{ width: `${Math.round((b.pts / b.max) * 100)}%`, transition: 'width 0.8s ease' }}
                />
              </div>
              <span className="text-[10px] text-white/35 w-[26px] text-right shrink-0">{b.pts}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
