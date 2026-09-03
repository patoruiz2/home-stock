import { NavLink, Outlet } from 'react-router'
import { UndoBar } from '@/features/casa'
import { cn } from '@/shared/lib/utils'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex-1 rounded-full border-2 border-border py-2 text-center text-sm font-extrabold',
    isActive && 'bg-primary text-primary-foreground',
  )

export function Shell() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background">
      <header className="flex items-center gap-2 p-3">
        <NavLink to="/" className={linkClass} end>
          Casa
        </NavLink>
        <NavLink to="/comprar" className={linkClass}>
          Comprar
        </NavLink>
        <NavLink
          to="/ajustes"
          className={linkClass}
          aria-label="Ajustes"
        >
          ···
        </NavLink>
      </header>
      <main className="relative min-h-0 flex-1">
        <Outlet />
        <UndoBar />
      </main>
    </div>
  )
}
