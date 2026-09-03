import { Button } from '@/shared/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet'
import { useCasa } from '../model/use-casa'

export function ArchivadosSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { casa } = useCasa()
  const list = casa.itemsArchivados()
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetTitle>Archivados</SheetTitle>
        {list.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between border-b border-border py-2"
          >
            <div className="font-bold">{item.nombre}</div>
            <Button type="button" size="sm" onClick={() => casa.desarchivar(item.id)}>
              Desarchivar
            </Button>
          </div>
        ))}
        <Button type="button" className="mt-4 w-full" onClick={() => onOpenChange(false)}>
          Cerrar
        </Button>
      </SheetContent>
    </Sheet>
  )
}
