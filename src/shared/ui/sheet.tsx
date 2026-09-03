import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'
import { useKeyboardOffset } from '@/shared/lib/keyboard-offset'
import { cn } from '@/shared/lib/utils'

function Sheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog.Root>
  )
}

function SheetContent({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const offset = useKeyboardOffset()

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
      <Dialog.Content
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 overflow-auto rounded-t-3xl border-2 border-border bg-card p-4 pb-8 shadow-lg',
          className,
        )}
        style={{
          bottom: `max(${offset}px, env(keyboard-inset-height, 0px))`,
          maxHeight: `min(85dvh, calc(100dvh - max(${offset}px, env(keyboard-inset-height, 0px))))`,
        }}
      >
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  )
}

function SheetTitle({ children }: { children: ReactNode }) {
  return (
    <Dialog.Title className="mb-2 text-xl font-extrabold">{children}</Dialog.Title>
  )
}

function SheetDescription({ children }: { children: ReactNode }) {
  return (
    <Dialog.Description className="mb-3 text-sm font-semibold text-muted-foreground">
      {children}
    </Dialog.Description>
  )
}

export { Sheet, SheetContent, SheetDescription, SheetTitle }
