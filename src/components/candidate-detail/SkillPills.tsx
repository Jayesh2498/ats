// ============================================================
// SkillPills — rounded pill badges for candidate skills
// Viridian claymorphism style
// ============================================================

import { cn } from '@/lib/utils'

interface SkillPillsProps {
  skills: string[]
  /** Maximum pills to show before "+N more" */
  max?: number
  /** Alias for max */
  limit?: number
  className?: string
}

export function SkillPills({ skills, max, limit, className }: SkillPillsProps) {
  const cap = limit ?? max ?? 8
  const visible = skills.slice(0, cap)
  const overflow = skills.length - cap

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {visible.map(skill => (
        <span
          key={skill}
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium',
            'border border-[#40826D]/20 bg-[#D6EDE7] text-[#245849]',
            'transition-colors hover:bg-[#40826D]/20',
          )}
        >
          {skill}
        </span>
      ))}

      {overflow > 0 && (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium',
            'border border-[#40826D]/30 bg-[#40826D]/10 text-[#40826D]',
          )}
        >
          +{overflow} more
        </span>
      )}
    </div>
  )
}
