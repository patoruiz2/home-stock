import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/shared/ui/sheet'
import { useCasa } from '../model/use-casa'
import type { VenceKind } from '../model/casa'

function labelVence(kind: VenceKind) {
  if (kind === 'por_vencer') return 'por vencer'
  if (kind === 'sin_fecha') return 'sin fecha'
  if (kind === 'ok') return 'en casa'
  return kind
}

export function DetalleSheet({
  itemId,
  onClose,
}: {
  itemId: string
  onClose: () => void
}) {
  const { casa, snapshot } = useCasa()
  const item = snapshot.items.find((i) => i.id === itemId)
  const envases = snapshot.envases.filter((e) => e.itemId === itemId)
  const [lote, setLote] = useState(item?.venceLote ?? '')
  if (!item) return null
  const n = casa.countDe(itemId)

  return (
    <Sheet open onOpenChange={(next) => !next && onClose()}>
      <SheetContent>
        <SheetTitle>{item.nombre}</SheetTitle>
        <SheetDescription>
          El lote es la fecha general. Abajo, cada uno puede tener su vencimiento
          particular.
        </SheetDescription>
        <label
          htmlFor="detalle-lote"
          className="mb-2 flex flex-col gap-1 text-xs font-extrabold"
        >
          Vencimiento del lote
          <Input
            id="detalle-lote"
            type="date"
            value={lote}
            onChange={(e) => setLote(e.target.value)}
          />
        </label>
        <Button
          type="button"
          className="mb-2 w-full"
          onClick={() => casa.setVenceLote(itemId, lote || null)}
        >
          Guardar lote
        </Button>
        {item.venceLote && (
          <Button
            type="button"
            variant="outline"
            className="mb-3 w-full"
            onClick={() => {
              setLote('')
              casa.setVenceLote(itemId, null)
            }}
          >
            Sacar fecha de lote
          </Button>
        )}
        <h3 className="mb-1 text-xs font-extrabold tracking-wide uppercase">
          Cada uno
        </h3>
        {n === 0 && <p className="text-sm font-semibold text-muted-foreground">0 en casa.</p>}
        {envases.map((envase, idx) => {
          const particular =
            envase.vence && envase.vence !== item.venceLote
          return (
            <div
              key={envase.id}
              className="grid grid-cols-[1fr_auto] items-end gap-2 border-b border-border py-2"
            >
              <div>
                <strong>#{idx + 1}</strong>
                <small className="block text-xs font-semibold text-muted-foreground">
                  {labelVence(casa.estadoVence(envase.vence ?? item.venceLote))}
                  {particular
                    ? ' · particular'
                    : item.venceLote
                      ? ' · del lote'
                      : ' · sin fecha'}
                </small>
                <label className="mt-1 flex flex-col gap-1 text-xs font-extrabold">
                  Lugar
                  <select
                    className="h-11 w-full rounded-xl border-2 border-border bg-card px-3 text-base"
                    value={envase.lugarId ?? ''}
                    aria-label={`Lugar del envase ${idx + 1}`}
                    onChange={(e) =>
                      casa.setLugarEnvase(envase.id, e.target.value || null)
                    }
                  >
                    <option value="">Sin lugar</option>
                    {snapshot.lugares.map((lugar) => (
                      <option key={lugar.id} value={lugar.id}>
                        {lugar.nombre}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <Input
                type="date"
                className="w-40"
                value={envase.vence ?? ''}
                onChange={(e) =>
                  casa.setVenceEnvase(envase.id, e.target.value || null)
                }
              />
            </div>
          )
        })}
        {n === 0 && (
          <Button
            type="button"
            variant="destructive"
            className="mt-3 w-full text-foreground"
            onClick={() => {
              casa.archivar(itemId)
              onClose()
            }}
          >
            Archivar ítem
          </Button>
        )}
        <Button type="button" variant="ghost" className="mt-2 w-full" onClick={onClose}>
          Cerrar
        </Button>
      </SheetContent>
    </Sheet>
  )
}
