import { Button } from '@/shared/ui/button'
import { useCasa } from '../model/use-casa'

export function UndoBar() {
  const { casa, snapshot } = useCasa()
  if (!snapshot.lastClosed) return null
  return (
    <div className="absolute inset-x-3 bottom-3 z-30 flex items-center justify-between rounded-2xl border-2 border-border bg-primary px-3 py-2 text-primary-foreground">
      <span className="text-sm font-bold">
        {casa.seAcabo(snapshot.lastClosed.itemId)
          ? `Listo: se acabó ${snapshot.lastClosed.itemNombre}`
          : `Listo: tachado ${snapshot.lastClosed.itemNombre}`}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-primary-foreground"
        onClick={() => casa.deshacer()}
      >
        Deshacer
      </Button>
    </div>
  )
}
