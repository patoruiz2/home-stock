import * as React from 'react'
import { cn } from '@/shared/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      className={cn(
        'h-11 w-full rounded-xl border-2 border-border bg-card px-3 text-base outline-none',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
