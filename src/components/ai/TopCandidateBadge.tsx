// ============================================================
// TopCandidateBadge — gold/amber "Top Candidate" badge
// ============================================================

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TopCandidateBadgeProps {
  className?: string
}

export function TopCandidateBadge({ className }: TopCandidateBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5',
        'border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700',
        'text-[10px] font-semibold whitespace-nowrap shadow-sm',
        className,
      )}
    >
      <Star className="size-2.5 fill-amber-400 text-amber-400" />
      Top Candidate
    </span>
  )
}
