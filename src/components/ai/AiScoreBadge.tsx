// ============================================================
// AiScoreBadge — small inline badge showing AI score & grade
// ============================================================

import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AiScoreBadgeProps {
  score: number
  grade: 'A' | 'B' | 'C' | 'D'
  size?: 'sm' | 'md'
  className?: string
}

const GRADE_STYLES: Record<'A' | 'B' | 'C' | 'D', string> = {
  A: 'border-[#40826D]/30 bg-[#D6EDE7] text-[#245849]',
  B: 'border-blue-200   bg-blue-50   text-blue-700',
  C: 'border-amber-200  bg-amber-50  text-amber-700',
  D: 'border-red-200    bg-red-50    text-red-700',
}

const SPARKLE_COLOR: Record<'A' | 'B' | 'C' | 'D', string> = {
  A: 'text-[#40826D]',
  B: 'text-blue-500',
  C: 'text-amber-500',
  D: 'text-red-500',
}

export function AiScoreBadge({ score, grade, size = 'md', className }: AiScoreBadgeProps) {
  const isSm = size === 'sm'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium whitespace-nowrap',
        isSm ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs',
        GRADE_STYLES[grade],
        className,
      )}
    >
      <Sparkles className={cn('shrink-0', isSm ? 'size-2.5' : 'size-3', SPARKLE_COLOR[grade])} />
      {isSm ? (
        <span>{score}% <strong>{grade}</strong></span>
      ) : (
        <span>AI score: {score}% · <strong>{grade}</strong></span>
      )}
    </span>
  )
}
