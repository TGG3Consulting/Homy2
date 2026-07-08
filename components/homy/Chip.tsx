'use client'

import { cn } from '@/lib/utils'

/** Filter/selector chip. Active state uses the 20C emerald-underline treatment. */
export function Chip({
  active,
  children,
  onClick,
  className,
}: {
  active?: boolean
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'whitespace-nowrap text-[13px] font-semibold transition-colors',
        active
          ? 'rounded-none px-1 py-2 font-bold text-primary [box-shadow:inset_0_-2.5px_0_0_hsl(var(--primary))]'
          : 'rounded-full border border-border bg-card px-4 py-2 text-muted-foreground hover:text-primary',
        className
      )}
    >
      {children}
    </button>
  )
}
