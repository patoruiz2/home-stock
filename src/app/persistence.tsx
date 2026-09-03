import { useEffect, useState } from 'react'
import { casa, loadCasa, saveCasa } from '@/features/casa'

export function Persistence() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    void loadCasa().then((loaded) => {
      if (cancelled) return
      if (loaded) casa.hydrate(loaded)
      if (cancelled) return
      setReady(true)
      if (window.isSecureContext && navigator.storage?.persist) {
        void navigator.storage.persist()
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    const unsub = casa.subscribe(() => {
      void saveCasa(casa.snapshot())
    })
    return () => {
      unsub()
    }
  }, [ready])

  return null
}
