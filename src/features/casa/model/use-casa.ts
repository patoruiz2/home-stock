import { useSyncExternalStore } from 'react'
import { createCasa, DEFAULT_LUGARES } from './casa'

export const casa = createCasa()
casa.setLugares(DEFAULT_LUGARES)

export function useCasa() {
  const snapshot = useSyncExternalStore(
    casa.subscribe,
    casa.snapshot,
    casa.snapshot,
  )
  return { casa, snapshot }
}
