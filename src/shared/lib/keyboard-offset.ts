import { useEffect, useState } from 'react'

export function keyboardOffset({
  innerHeight,
  visualHeight,
  offsetTop,
}: {
  innerHeight: number
  visualHeight: number
  offsetTop: number
}) {
  return Math.max(0, innerHeight - visualHeight - offsetTop)
}

export function useKeyboardOffset() {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const sync = () =>
      setOffset(
        keyboardOffset({
          innerHeight: window.innerHeight,
          visualHeight: vv.height,
          offsetTop: vv.offsetTop,
        }),
      )

    sync()
    vv.addEventListener('resize', sync)
    vv.addEventListener('scroll', sync)
    return () => {
      vv.removeEventListener('resize', sync)
      vv.removeEventListener('scroll', sync)
    }
  }, [])

  return offset
}
