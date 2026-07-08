import { cn } from '@/lib/utils'

type Tone = 'ok' | 'pending' | 'danger' | 'muted'

const tones: Record<Tone, string> = {
  ok: 'text-primary bg-primary/10',
  pending: 'text-homy-amber bg-homy-amber/20',
  danger: 'text-destructive bg-destructive/10',
  muted: 'text-muted-foreground bg-muted',
}

/** Status / signal badge (Опубликовано / На модерации / Отклонено, стадии сделок, роли и т.д.). */
export function StatusPill({
  tone = 'muted',
  children,
  className,
}: {
  tone?: Tone
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[10.5px] font-bold',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  )
}
