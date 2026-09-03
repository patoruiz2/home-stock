import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet'
import { useCasa } from '../model/use-casa'

export function NuevoItemSheet({
  open,
  onOpenChange,
  primer,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  primer: boolean
}) {
  const { casa } = useCasa()
  const [nombre, setNombre] = useState('')
  const [vida, setVida] = useState('')
  const [vence, setVence] = useState('')

  function reset() {
    setNombre('')
    setVida('')
    setVence('')
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <SheetContent>
        <SheetTitle>{primer ? 'Primer ítem' : 'Ítem nuevo'}</SheetTitle>
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <Input
            placeholder="Vida útil días (opcional)"
            inputMode="numeric"
            value={vida}
            onChange={(e) => setVida(e.target.value)}
          />
          <label
            htmlFor="nuevo-lote"
            className="flex flex-col gap-1 text-xs font-extrabold"
          >
            Vencimiento del lote (opcional)
            <Input
              id="nuevo-lote"
              type="date"
              value={vence}
              onChange={(e) => setVence(e.target.value)}
            />
          </label>
          <Button
            type="button"
            className="mt-2"
            onClick={() => {
              const item = casa.crearItem(
                nombre,
                vida ? Number(vida) : null,
              )
              if (!item) return
              if (vence) casa.setVenceLote(item.id, vence)
              casa.addEnvase(item.id, null, vence || null)
              reset()
              onOpenChange(false)
            }}
          >
            Crear y cargar 1
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
