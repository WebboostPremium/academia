import { cn } from '@/lib/utils'

export function Logo({
  className,
  showText = true,
  textClassName,
}: {
  className?: string
  showText?: boolean
  textClassName?: string
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={cn(
          'inline-flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground',
          className,
        )}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="size-5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3v18" />
          <path d="M6 8h12" />
          <path d="M12 21c4-2 6-5 6-9V6l-6-3-6 3v6c0 4 2 7 6 9Z" />
        </svg>
      </span>
      {showText && (
        <span
          className={cn(
            'font-serif text-lg font-semibold leading-tight tracking-tight',
            textClassName,
          )}
        >
          Catequesis
          <span className="text-accent">Online</span>
        </span>
      )}
    </span>
  )
}
