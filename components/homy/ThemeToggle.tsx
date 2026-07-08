'use client'

import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from './ThemeProvider'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  return (
    <div
      className={cn(
        'inline-flex gap-0.5 rounded-full border border-border bg-secondary p-1',
        className
      )}
    >
      <button
        type="button"
        aria-label="Тёмная тема"
        onClick={() => setTheme('dark')}
        className={cn(
          'flex h-7 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors',
          theme === 'dark' && 'bg-primary text-primary-foreground'
        )}
      >
        <Moon size={15} />
      </button>
      <button
        type="button"
        aria-label="Светлая тема"
        onClick={() => setTheme('light')}
        className={cn(
          'flex h-7 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors',
          theme === 'light' && 'bg-primary text-primary-foreground'
        )}
      >
        <Sun size={15} />
      </button>
    </div>
  )
}
