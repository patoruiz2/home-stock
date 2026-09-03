import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { useCasa } from '../model/use-casa'

export function AjustesScreen() {
  const { casa, snapshot } = useCasa()
  const [ventana, setVentana] = useState(String(snapshot.ventanaDias))
  const [nuevoLugar, setNuevoLugar] = useState('')

  return (
    <div className="flex flex-col gap-4 px-3 pb-8">
      <h1 className="text-xl font-extrabold">Ajustes</h1>
      <label
        htmlFor="ventana-dias"
        className="flex flex-col gap-1 text-xs font-extrabold"
      >
        Ventana de vencimiento (días)
        <Input
          id="ventana-dias"
          inputMode="numeric"
          value={ventana}
          onChange={(e) => setVentana(e.target.value)}
        />
      </label>
      <Button
        type="button"
        onClick={() => {
          const n = Number(ventana)
          if (Number.isFinite(n) && n >= 0) casa.setVentanaDias(n)
        }}
      >
        Guardar ventana
      </Button>
      <h2 className="text-sm font-extrabold tracking-wide uppercase">Lugares</h2>
      <p className="text-sm font-semibold text-muted-foreground">
        Opcionales. El + diario no los pide.
      </p>
      <ul className="flex flex-col gap-2">
        {snapshot.lugares.map((lugar) => (
          <li
            key={lugar.id}
            className="flex items-center justify-between rounded-xl border-2 border-border px-3 py-2"
          >
            <span className="font-bold">{lugar.nombre}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`Quitar ${lugar.nombre}`}
              onClick={() =>
                casa.setLugares(snapshot.lugares.filter((l) => l.id !== lugar.id))
              }
            >
              ×
            </Button>
          </li>
        ))}
      </ul>
      <Input
        placeholder="Nuevo lugar"
        value={nuevoLugar}
        onChange={(e) => setNuevoLugar(e.target.value)}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          const nombre = nuevoLugar.trim()
          if (!nombre) return
          casa.setLugares([
            ...snapshot.lugares,
            { id: `l-${nombre.toLowerCase()}`, nombre },
          ])
          setNuevoLugar('')
        }}
      >
        Sumar lugar
      </Button>
    </div>
  )
}
