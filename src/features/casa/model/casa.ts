export type Item = {
  id: string
  nombre: string
  vidaUtilDias: number | null
  venceLote: string | null
  archived: boolean
}

export type Envase = {
  id: string
  itemId: string
  lugarId: string | null
  vence: string | null
}

export type Lugar = { id: string; nombre: string }

export type Particularidad = {
  id: string
  nombre: string
  ticked: boolean
}

export type ClosedEnvase = Envase & { itemNombre: string }

export type Snapshot = {
  ventanaDias: number
  lugares: Lugar[]
  items: Item[]
  envases: Envase[]
  ticks: Record<string, boolean>
  particularidades: Particularidad[]
  lastClosed: ClosedEnvase | null
}

export type VenceKind = 'ok' | 'por_vencer' | 'vencido' | 'sin_fecha'

export const UNDO_MS = 5000

export type CasaOptions = {
  hoy?: string
}

export const DEFAULT_LUGARES: Lugar[] = [
  { id: 'heladera', nombre: 'Heladera' },
  { id: 'alacena', nombre: 'Alacena' },
  { id: 'bano', nombre: 'Baño' },
  { id: 'mesada', nombre: 'Mesada' },
]

export function fechaCorta(iso: string | null) {
  if (!iso) return null
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

export function fechaISOLocal(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const VENCE_RANK: Record<VenceKind, number> = {
  vencido: 0,
  por_vencer: 1,
  sin_fecha: 2,
  ok: 3,
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function shiftISO(hoy: string, days: number) {
  const d = new Date(`${hoy}T00:00:00`)
  d.setDate(d.getDate() + days)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function emptySnapshot(): Snapshot {
  return {
    ventanaDias: 7,
    lugares: [],
    items: [],
    envases: [],
    ticks: {},
    particularidades: [],
    lastClosed: null,
  }
}

export function createCasa(options: CasaOptions = {}) {
  const hoy = options.hoy ?? fechaISOLocal(new Date())
  let state = emptySnapshot()
  const listeners = new Set<() => void>()

  function emit() {
    listeners.forEach((fn) => fn())
  }

  function set(next: Snapshot) {
    state = next
    emit()
  }

  function itemById(id: string) {
    return state.items.find((i) => i.id === id)
  }

  function envasesDe(itemId: string) {
    return state.envases.filter((e) => e.itemId === itemId)
  }

  function countDe(itemId: string) {
    return envasesDe(itemId).length
  }

  function seAcabo(itemId: string) {
    const item = itemById(itemId)
    return Boolean(item && !item.archived && countDe(itemId) === 0)
  }

  function crearItem(nombre: string, vidaUtilDias: number | null = null) {
    const trimmed = nombre.trim()
    if (!trimmed) return null
    const existing = state.items.find(
      (i) => i.nombre.toLowerCase() === trimmed.toLowerCase() && !i.archived,
    )
    if (existing) return existing
    const item: Item = {
      id: uid('i'),
      nombre: trimmed,
      vidaUtilDias,
      venceLote: null,
      archived: false,
    }
    set({ ...state, items: [...state.items, item] })
    return item
  }

  function proposedVence(item: Item, vence: string | null) {
    if (vence) return vence
    if (item.venceLote) return item.venceLote
    if (item.vidaUtilDias != null) return shiftISO(hoy, item.vidaUtilDias)
    return null
  }

  function setVenceLote(itemId: string, vence: string | null) {
    const item = itemById(itemId)
    if (!item) return
    const prev = item.venceLote
    set({
      ...state,
      items: state.items.map((i) =>
        i.id === itemId ? { ...i, venceLote: vence } : i,
      ),
      envases: state.envases.map((e) => {
        if (e.itemId !== itemId) return e
        if (!e.vence || e.vence === prev) return { ...e, vence }
        return e
      }),
    })
  }

  function addEnvase(
    itemId: string,
    lugarId: string | null,
    vence: string | null,
  ) {
    const item = itemById(itemId)
    if (!item || item.archived) return
    const envase: Envase = {
      id: uid('e'),
      itemId,
      lugarId,
      vence: proposedVence(item, vence),
    }
    set({ ...state, envases: [...state.envases, envase] })
  }

  function estadoVence(vence: string | null): VenceKind {
    if (!vence) return 'sin_fecha'
    if (vence < hoy) return 'vencido'
    const limite = shiftISO(hoy, state.ventanaDias)
    if (vence <= limite) return 'por_vencer'
    return 'ok'
  }

  function tonoItem(itemId: string): VenceKind {
    const item = itemById(itemId)
    const fechas = envasesDe(itemId).map((e) => e.vence)
    if (item?.venceLote) fechas.push(item.venceLote)
    const kinds = fechas.map((f) => estadoVence(f))
    if (kinds.includes('vencido')) return 'vencido'
    if (kinds.includes('por_vencer')) return 'por_vencer'
    return 'ok'
  }

  function envaseATachar(itemId: string) {
    const lista = envasesDe(itemId)
    if (lista.length === 0) return null
    return [...lista].sort((a, b) => {
      const ra = VENCE_RANK[estadoVence(a.vence)]
      const rb = VENCE_RANK[estadoVence(b.vence)]
      if (ra !== rb) return ra - rb
      if (a.vence && b.vence) return a.vence.localeCompare(b.vence)
      if (a.vence) return -1
      if (b.vence) return 1
      return 0
    })[0]
  }

  let undoTimer: ReturnType<typeof setTimeout> | null = null

  function tachar(envaseId: string) {
    const envase = state.envases.find((e) => e.id === envaseId)
    if (!envase) return
    const item = itemById(envase.itemId)
    const lastClosed: ClosedEnvase = {
      ...envase,
      itemNombre: item?.nombre ?? 'Ítem',
    }
    if (undoTimer) clearTimeout(undoTimer)
    set({
      ...state,
      envases: state.envases.filter((e) => e.id !== envaseId),
      lastClosed,
    })
    undoTimer = setTimeout(() => {
      undoTimer = null
      set({ ...state, lastClosed: null })
    }, UNDO_MS)
  }

  function tacharUno(itemId: string) {
    const envase = envaseATachar(itemId)
    if (envase) tachar(envase.id)
  }

  function deshacer() {
    const closed = state.lastClosed
    if (!closed) return
    if (undoTimer) clearTimeout(undoTimer)
    undoTimer = null
    const envase = {
      id: closed.id,
      itemId: closed.itemId,
      lugarId: closed.lugarId,
      vence: closed.vence,
    }
    set({
      ...state,
      envases: [...state.envases, envase],
      lastClosed: null,
    })
  }

  function setVenceEnvase(envaseId: string, vence: string | null) {
    set({
      ...state,
      envases: state.envases.map((e) =>
        e.id === envaseId ? { ...e, vence } : e,
      ),
    })
  }

  function setLugarEnvase(envaseId: string, lugarId: string | null) {
    if (!state.envases.some((e) => e.id === envaseId)) return
    set({
      ...state,
      envases: state.envases.map((e) =>
        e.id === envaseId ? { ...e, lugarId } : e,
      ),
    })
  }

  function toggleTick(itemId: string) {
    set({
      ...state,
      ticks: { ...state.ticks, [itemId]: !state.ticks[itemId] },
    })
  }

  function addParticularidad(nombre: string) {
    const trimmed = nombre.trim()
    if (!trimmed) return
    const existingItem = state.items.find(
      (i) => !i.archived && i.nombre.toLowerCase() === trimmed.toLowerCase(),
    )
    if (existingItem) {
      set({ ...state, ticks: { ...state.ticks, [existingItem.id]: true } })
      return
    }
    const dup = state.particularidades.find(
      (p) => p.nombre.toLowerCase() === trimmed.toLowerCase(),
    )
    if (dup) {
      set({
        ...state,
        particularidades: state.particularidades.map((p) =>
          p.id === dup.id ? { ...p, ticked: true } : p,
        ),
      })
      return
    }
    set({
      ...state,
      particularidades: [
        ...state.particularidades,
        { id: uid('p'), nombre: trimmed, ticked: true },
      ],
    })
  }

  function toggleParticularidad(id: string) {
    set({
      ...state,
      particularidades: state.particularidades.map((p) =>
        p.id === id ? { ...p, ticked: !p.ticked } : p,
      ),
    })
  }

  function removeParticularidad(id: string) {
    set({
      ...state,
      particularidades: state.particularidades.filter((p) => p.id !== id),
    })
  }

  function itemsActivos() {
    return state.items.filter((i) => !i.archived)
  }

  function itemsArchivados() {
    return state.items.filter((i) => i.archived)
  }

  function archivar(itemId: string) {
    if (countDe(itemId) > 0) return
    set({
      ...state,
      items: state.items.map((i) =>
        i.id === itemId ? { ...i, archived: true } : i,
      ),
      ticks: { ...state.ticks, [itemId]: false },
    })
  }

  function desarchivar(itemId: string) {
    set({
      ...state,
      items: state.items.map((i) =>
        i.id === itemId ? { ...i, archived: false } : i,
      ),
    })
  }

  function setVentanaDias(n: number) {
    if (!Number.isFinite(n) || n < 0) return
    set({ ...state, ventanaDias: n })
  }

  function setLugares(lugares: Lugar[]) {
    set({ ...state, lugares })
  }

  function hydrate(next: Snapshot) {
    if (undoTimer) clearTimeout(undoTimer)
    undoTimer = null
    set(next)
  }

  return {
    snapshot: () => state,
    subscribe(fn: () => void) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    crearItem,
    addEnvase,
    countDe,
    seAcabo,
    setVenceLote,
    setVenceEnvase,
    setLugarEnvase,
    tacharUno,
    deshacer,
    tonoItem,
    estadoVence,
    toggleTick,
    addParticularidad,
    toggleParticularidad,
    removeParticularidad,
    archivar,
    desarchivar,
    itemsActivos,
    itemsArchivados,
    setVentanaDias,
    setLugares,
    hydrate,
  }
}

export type Casa = ReturnType<typeof createCasa>
