import { describe, expect, it } from 'vitest'
import { keyboardOffset } from './keyboard-offset'

describe('keyboardOffset', () => {
  it('is the gap between layout height and visual viewport', () => {
    expect(
      keyboardOffset({
        innerHeight: 800,
        visualHeight: 500,
        offsetTop: 0,
      }),
    ).toBe(300)
  })

  it('is zero when the visual viewport fills the layout', () => {
    expect(
      keyboardOffset({
        innerHeight: 800,
        visualHeight: 800,
        offsetTop: 0,
      }),
    ).toBe(0)
  })

  it('is zero when the visual viewport is taller than the layout', () => {
    expect(
      keyboardOffset({
        innerHeight: 800,
        visualHeight: 900,
        offsetTop: 0,
      }),
    ).toBe(0)
  })
})
