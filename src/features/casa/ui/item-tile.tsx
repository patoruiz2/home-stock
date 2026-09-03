import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'
import type { VenceKind } from '../model/casa'

function toneClass(tono: VenceKind, zero: boolean) {
  return cn(
    zero && 'border-dashed bg-muted',
    !zero && tono === 'vencido' && 'bg-red-200',
    !zero && tono === 'por_vencer' && 'bg-amber-200',
    !zero && tono === 'ok' && 'bg-card',
  )
}

export function ItemTile({
  nombre,
  count,
  loteHint,
  tono,
  onTachar,
  onCargar,
  onDetalle,
}: {
  nombre: string
  count: number
  loteHint: string
  tono: VenceKind
  onTachar: () => void
  onCargar: () => void
  onDetalle: () => void
}) {
  return (
    <div
      className={cn(
        'flex min-h-[7.5rem] flex-col justify-between rounded-[1.75rem] border-[3px] border-border p-3',
        toneClass(tono, count === 0),
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <div className="text-base font-extrabold">{nombre}</div>
          <div className="text-[11px] font-bold">{loteHint}</div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-1"
          aria-label="Más"
          onClick={onDetalle}
        >
          ···
        </Button>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={count === 0}
          aria-label="Se acabó uno"
          onClick={onTachar}
        >
          −
        </Button>
        <span className="min-w-[1.2em] text-center text-3xl font-extrabold">
          {count}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Cargar uno"
          onClick={onCargar}
        >
          +
        </Button>
      </div>
    </div>
  )
}
