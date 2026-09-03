import { useState } from 'react'
import { fechaCorta } from '../model/casa'
import { useCasa } from '../model/use-casa'
import { ArchivadosSheet } from './archivados-sheet'
import { DetalleSheet } from './detalle-sheet'
import { ItemTile } from './item-tile'
import { NuevoItemSheet } from './nuevo-item-sheet'
import { Button } from '@/shared/ui/button'

export function CasaScreen() {
  const { casa, snapshot } = useCasa()
  const [filtro, setFiltro] = useState<'todos' | 'vence'>('todos')
  const [nuevo, setNuevo] = useState(false)
  const [detalleId, setDetalleId] = useState<string | null>(null)
  const [archivados, setArchivados] = useState(false)
  const activos = casa.itemsActivos()
  const catalogoVacio = snapshot.items.length === 0
  const visible = activos.filter((item) => {
    if (filtro === 'todos') return true
    const tono = casa.tonoItem(item.id)
    return tono === 'vencido' || tono === 'por_vencer'
  })

  return (
    <div className="flex h-full flex-col px-3 pb-6">
      {activos.length > 0 && (
        <>
          <div className="mb-2 grid max-w-56 grid-cols-2 gap-1.5">
            <Button
              type="button"
              variant={filtro === 'todos' ? 'default' : 'outline'}
              className="rounded-full"
              onClick={() => setFiltro('todos')}
            >
              Todos
            </Button>
            <Button
              type="button"
              variant={filtro === 'vence' ? 'default' : 'outline'}
              className="rounded-full"
              onClick={() => setFiltro('vence')}
            >
              Vence
            </Button>
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5" aria-label="Glosario de colores">
            <span className="rounded-full border-2 border-border bg-card px-2 py-0.5 text-[10px] font-extrabold">
              En casa
            </span>
            <span className="rounded-full border-2 border-border bg-amber-200 px-2 py-0.5 text-[10px] font-extrabold">
              Por vencer
            </span>
            <span className="rounded-full border-2 border-border bg-red-200 px-2 py-0.5 text-[10px] font-extrabold">
              Vencido
            </span>
            <span className="rounded-full border-2 border-dashed border-border bg-muted px-2 py-0.5 text-[10px] font-extrabold">
              Se acabó
            </span>
          </div>
        </>
      )}

      {catalogoVacio && (
        <div className="py-8">
          <p className="mb-4 font-bold">Primer mes: los botones todavía no existen.</p>
          <Button
            type="button"
            variant="outline"
            className="h-40 w-full rounded-[2rem] border-dashed text-xl"
            onClick={() => setNuevo(true)}
          >
            ¿Qué llegó?
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        {visible.map((item) => (
          <ItemTile
            key={item.id}
            nombre={item.nombre}
            count={casa.countDe(item.id)}
            loteHint={
              fechaCorta(item.venceLote)
                ? `Lote vence ${fechaCorta(item.venceLote)}`
                : 'Sin fecha de lote'
            }
            tono={casa.tonoItem(item.id)}
            onTachar={() => casa.tacharUno(item.id)}
            onCargar={() => casa.addEnvase(item.id, null, null)}
            onDetalle={() => setDetalleId(item.id)}
          />
        ))}
        {!catalogoVacio && (
          <button
            type="button"
            className="flex min-h-[7.5rem] flex-col items-center justify-center rounded-[1.75rem] border-[3px] border-border bg-card text-2xl font-extrabold"
            onClick={() => setNuevo(true)}
          >
            +
            <span className="text-base">Ítem nuevo</span>
          </button>
        )}
      </div>

      {casa.itemsArchivados().length > 0 && (
        <Button
          type="button"
          variant="outline"
          className="mt-4 w-full rounded-full"
          onClick={() => setArchivados(true)}
        >
          Archivados ({casa.itemsArchivados().length})
        </Button>
      )}

      <NuevoItemSheet open={nuevo} onOpenChange={setNuevo} primer={catalogoVacio} />
      {detalleId && (
        <DetalleSheet itemId={detalleId} onClose={() => setDetalleId(null)} />
      )}
      <ArchivadosSheet open={archivados} onOpenChange={setArchivados} />
      <span className="sr-only">{snapshot.items.length} ítems</span>
    </div>
  )
}
