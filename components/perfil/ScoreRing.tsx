'use client'

import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

interface ScoreRingProps {
  score: number
  size?: number
}

function getColor(score: number): string {
  if (score >= 75) return '#059669'  // emerald
  if (score >= 50) return '#16a34a'  // green
  return '#dc2626'                   // red
}

export function ScoreRing({ score, size = 88 }: ScoreRingProps) {
  const r = (size / 2) - 8
  const circumference = 2 * Math.PI * r
  const color = getColor(score)

  const motionScore = useMotionValue(0)
  const displayScore = useTransform(motionScore, (v) => Math.round(v))
  const dashoffset = useTransform(
    motionScore,
    (v) => circumference - (v / 100) * circumference
  )

  useEffect(() => {
    const controls = animate(motionScore, score, {
      duration: 1.2,
      ease: [0.4, 0, 0.2, 1],
    })
    return controls.stop
  }, [score, motionScore])

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e5e7eb"
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
      <span className="text-[10px] text-gray-400 font-medium mt-1 tracking-wide uppercase">
        engajamento
      </span>
    </div>
  )
}
