// ============================================================
// AiScoreRing — circular SVG ring showing AI score
// Viridian (#40826D) claymorphism style
// ============================================================

import { cn } from '@/lib/utils'

type Grade = 'A' | 'B' | 'C' | 'D'

interface AiScoreRingProps {
  score: number
  /** Grade letter. If omitted it is derived from score (>=80 A, >=65 B, >=50 C, else D). */
  grade?: Grade
  size?: number | 'sm' | 'md' | 'lg'
  className?: string
}

const GRADE_COLORS: Record<Grade, { stroke: string; text: string; bg: string }> = {
  A: { stroke: '#40826D', text: 'text-[#245849]', bg: 'bg-[#D6EDE7]' },
  B: { stroke: '#3B82F6', text: 'text-blue-700',  bg: 'bg-blue-50'   },
  C: { stroke: '#F59E0B', text: 'text-amber-700', bg: 'bg-amber-50'  },
  D: { stroke: '#EF4444', text: 'text-red-700',   bg: 'bg-red-50'    },
}

function scoreToGrade(score: number): Grade {
  if (score >= 80) return 'A'
  if (score >= 65) return 'B'
  if (score >= 50) return 'C'
  return 'D'
}

function resolveSize(size: AiScoreRingProps['size']): number {
  if (size === 'sm') return 44
  if (size === 'lg') return 96
  if (size === undefined || size === 'md') return 72
  return size
}

export function AiScoreRing({ score, grade: gradeProp, size, className }: AiScoreRingProps) {
  const grade = gradeProp ?? scoreToGrade(score)
  const px = resolveSize(size)
  const colors = GRADE_COLORS[grade]
  const radius = (px / 2) * 0.75
  const circumference = 2 * Math.PI * radius
  const filled = Math.min(100, Math.max(0, score))
  const dashOffset = circumference - (filled / 100) * circumference
  const cx = px / 2
  const cy = px / 2
  const strokeWidth = px * 0.1
  const isSm = px <= 44

  return (
    <div
      className={cn('relative inline-flex items-center justify-center shrink-0', className)}
      style={{ width: px, height: px }}
      role="img"
      aria-label={`AI score ${score}% grade ${grade}`}
    >
      <svg
        width={px}
        height={px}
        viewBox={`0 0 ${px} ${px}`}
        className="rotate-[-90deg]"
      >
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeOpacity={0.12}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        {isSm ? (
          <span className={cn('font-bold tabular-nums', colors.text)} style={{ fontSize: px * 0.26 }}>
            {score}
          </span>
        ) : (
          <>
            <span className={cn('font-bold tabular-nums', colors.text)} style={{ fontSize: px * 0.22 }}>
              {score}%
            </span>
            <span
              className={cn(
                'font-black tracking-tight rounded-full px-1 mt-0.5',
                colors.bg,
                colors.text,
              )}
              style={{ fontSize: px * 0.19 }}
            >
              {grade}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
