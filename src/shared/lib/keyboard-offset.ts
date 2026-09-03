import { useEffect, useRef, useState } from 'react'

type VirtualKeyboard = {
  overlaysContent: boolean
  boundingRect: { height: number }
  addEventListener(type: 'geometrychange', listener: () => void): void
  removeEventListener(type: 'geometrychange', listener: () => void): void
}

function virtualKeyboard() {
  return (navigator as Navigator & { virtualKeyboard?: VirtualKeyboard })
    .virtualKeyboard
}

export function keyboardOffset({
  innerHeight,
  visualHeight,
  offsetTop,
  keyboardInset = 0,
}: {
  innerHeight: number
  visualHeight: number
  offsetTop: number
  keyboardInset?: number
}) {
  return Math.max(0, innerHeight - visualHeight - offsetTop, keyboardInset)
}

export function useKeyboardOffset() {
  const [offset, setOffset] = useState(0)
  const closedHeight = useRef(0)

  useEffect(() => {
    const vk = virtualKeyboard()
    if (vk) vk.overlaysContent = true

    const sync = () => {
      const vv = window.visualViewport
      const visualHeight = vv?.height ?? window.innerHeight
      const offsetTop = vv?.offsetTop ?? 0
      closedHeight.current = Math.max(closedHeight.current, visualHeight)
      setOffset(
        keyboardOffset({
          innerHeight: closedHeight.current,
          visualHeight,
          offsetTop,
          keyboardInset: vk?.boundingRect.height ?? 0,
        }),
      )
    }

    const onOrient = () => {
      closedHeight.current = window.visualViewport?.height ?? window.innerHeight
      sync()
    }

    let frames = 0
    let raf = 0
    const poll = () => {
      sync()
      frames += 1
      if (frames < 30) raf = requestAnimationFrame(poll)
    }
    const onFocus = () => {
      frames = 0
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(poll)
    }

    sync()
    window.visualViewport?.addEventListener('resize', sync)
    window.visualViewport?.addEventListener('scroll', sync)
    window.addEventListener('resize', sync)
    window.addEventListener('orientationchange', onOrient)
    window.addEventListener('focusin', onFocus)
    vk?.addEventListener('geometrychange', sync)
    return () => {
      cancelAnimationFrame(raf)
      window.visualViewport?.removeEventListener('resize', sync)
      window.visualViewport?.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
      window.removeEventListener('orientationchange', onOrient)
      window.removeEventListener('focusin', onFocus)
      vk?.removeEventListener('geometrychange', sync)
    }
  }, [])

  return offset
}
