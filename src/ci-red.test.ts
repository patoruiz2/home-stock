import { describe, expect, it } from 'vitest'

describe('CI smoke (borrar después de ver Actions en rojo)', () => {
  it('fails on purpose so the pipeline turns red', () => {
    expect(true).toBe(false)
  })
})
