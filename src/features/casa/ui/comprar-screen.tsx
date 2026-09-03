import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/shared/ui/sheet'
import { cn } from '@/shared/lib/utils'
import { useCasa } from '../model/use-casa'

export function ComprarScreen() {
  const { casa, snapshot } = useCasa()
  const [particularidad, setParticularidad] = useState(false)
  const activos = casa.itemsActivos()

  return (
    <div className="px-3 pb-6">
      {activos.length === 0 && snapshot.particularidades.length === 0 && (
        <p className="py-6 font-bold">
          Nada en el catálogo. Sumá una particularidad o cargá la primera compra en
          Casa.
        </p>
      )}
      <div className="grid grid-cols-2 gap-2.5">
        {activos.map((item) => {
          const n = casa.countDe(item.id)
          const ticked = Boolean(snapshot.ticks[item.id])
          return (
            <button
              key={item.id}
              type="button"
              className={cn(
                'relative flex min-h-28 flex-col items-start rounded-[1.75rem] border-[3px] border-border p-3 text-left',
                n === 0 && 'border-dashed bg-muted',
                ticked && 'bg-primary text-primary-foreground',
              )}
              onClick={() => casa.toggleTick(item.id)}
            >
              <span className="text-base font-extrabold">{item.nombre}</span>
              <span className="text-[11px] font-bold">
                {n === 0 ? 'se acabó' : `${n} en casa`}
              </span>
              {ticked && <span className="mt-2 font-extrabold">✓</span>}
            </button>
          )
        })}
        {snapshot.particularidades.map((p) => (
          <div
            key={p.id}
            className={cn(
              'relative flex min-h-28 rounded-[1.75rem] border-[3px] border-dashed border-border p-3',
              p.ticked && 'bg-primary text-primary-foreground',
            )}
          >
            <button
              type="button"
              className="flex flex-1 flex-col items-start text-left"
              onClick={() => casa.toggleParticularidad(p.id)}
            >
              <span className="text-base font-extrabold">{p.nombre}</span>
              <span className="text-[11px] font-bold">particularidad</span>
              {p.ticked && <span className="mt-2 font-extrabold">✓</span>}
            </button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-1"
              aria-label="Sacar"
              onClick={() => casa.removeParticularidad(p.id)}
            >
              ×
            </Button>
          </div>
        ))}
        <button
          type="button"
          className="flex min-h-28 flex-col items-center justify-center rounded-[1.75rem] border-[3px] border-border bg-card text-2xl font-extrabold"
          onClick={() => setParticularidad(true)}
        >
          +
          <span className="text-base">Particularidad</span>
        </button>
      </div>
      <ParticularidadSheet
        open={particularidad}
        onOpenChange={setParticularidad}
      />
    </div>
  )
}

function ParticularidadSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { casa } = useCasa()
  const [nombre, setNombre] = useState('')
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) setNombre('')
        onOpenChange(next)
      }}
    >
      <SheetContent>
        <SheetTitle>Particularidad</SheetTitle>
        <SheetDescription>
          Algo que no está en el catálogo. No entra a Casa hasta que lo cargues
          después de comprarlo.
        </SheetDescription>
        <Input
          placeholder="Velas, carbón, algo del cumple…"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <Button
          type="button"
          className="mt-3 w-full"
          onClick={() => {
            casa.addParticularidad(nombre)
            setNombre('')
            onOpenChange(false)
          }}
        >
          Sumar a la compra
        </Button>
      </SheetContent>
    </Sheet>
  )
}
