import { describe, expect, it, vi } from 'vitest'
import { createCasa, fechaISOLocal } from './casa'

describe('casa model', () => {
  it('fechaISOLocal uses the local calendar day, not UTC', () => {
    expect(fechaISOLocal(new Date(2026, 8, 3, 23, 30))).toBe('2026-09-03')
  })

  it('starts with no ítems', () => {
    const casa = createCasa({ hoy: '2026-09-03' })
    expect(casa.snapshot().items).toEqual([])
  })

  it('crearItem adds an ítem to the catalog', () => {
    const casa = createCasa({ hoy: '2026-09-03' })
    const item = casa.crearItem('Banana')
    expect(item?.nombre).toBe('Banana')
    expect(casa.snapshot().items).toHaveLength(1)
  })

  it('crearItem trims the name and ignores a blank name', () => {
    const casa = createCasa({ hoy: '2026-09-03' })
    expect(casa.crearItem('   ')).toBeNull()
    const item = casa.crearItem('  Leche  ')
    expect(item?.nombre).toBe('Leche')
  })

  it('crearItem reuses an active ítem with the same name', () => {
    const casa = createCasa({ hoy: '2026-09-03' })
    const first = casa.crearItem('Banana')
    const second = casa.crearItem('banana')
    expect(second?.id).toBe(first?.id)
    expect(casa.snapshot().items).toHaveLength(1)
  })

  it('addEnvase increases count and is en casa, not se acabó', () => {
    const casa = createCasa({ hoy: '2026-09-03' })
    const item = casa.crearItem('Leche')!
    casa.addEnvase(item.id, null, null)
    casa.addEnvase(item.id, null, null)
    expect(casa.countDe(item.id)).toBe(2)
    expect(casa.seAcabo(item.id)).toBe(false)
  })

  it('an ítem with zero envases is se acabó', () => {
    const casa = createCasa({ hoy: '2026-09-03' })
    const item = casa.crearItem('Aceite')!
    expect(casa.countDe(item.id)).toBe(0)
    expect(casa.seAcabo(item.id)).toBe(true)
  })

  it('addEnvase does not collect lugar on the daily +', () => {
    const casa = createCasa({ hoy: '2026-09-03' })
    const item = casa.crearItem('Arroz')!
    casa.addEnvase(item.id, null, null)
    expect(casa.snapshot().envases[0].lugarId).toBeNull()
  })

  it('setLugarEnvase puts or clears the lugar on an envase', () => {
    const casa = createCasa({ hoy: '2026-09-03' })
    const item = casa.crearItem('Leche')!
    casa.addEnvase(item.id, null, null)
    const envaseId = casa.snapshot().envases[0].id
    casa.setLugarEnvase(envaseId, 'heladera')
    expect(casa.snapshot().envases[0].lugarId).toBe('heladera')
    casa.setLugarEnvase(envaseId, null)
    expect(casa.snapshot().envases[0].lugarId).toBeNull()
  })

  it('setLugarEnvase is a no-op when the envase does not exist', () => {
    const casa = createCasa({ hoy: '2026-09-03' })
    const item = casa.crearItem('Leche')!
    casa.addEnvase(item.id, null, null)
    const before = casa.snapshot()
    casa.setLugarEnvase('missing', 'heladera')
    expect(casa.snapshot().envases).toEqual(before.envases)
  })

  it('addEnvase uses an explicit date, else lote, else vida útil from today', () => {
    const casa = createCasa({ hoy: '2026-09-03' })
    const leche = casa.crearItem('Leche')!
    casa.setVenceLote(leche.id, '2026-09-10')
    casa.addEnvase(leche.id, null, '2026-09-20')
    casa.addEnvase(leche.id, null, null)
    expect(casa.snapshot().envases.map((e) => e.vence)).toEqual([
      '2026-09-20',
      '2026-09-10',
    ])

    const banana = casa.crearItem('Banana', 5)!
    casa.addEnvase(banana.id, null, null)
    expect(casa.snapshot().envases.find((e) => e.itemId === banana.id)?.vence).toBe(
      '2026-09-08',
    )
  })

  it('tacharUno closes the vencido envase first and leaves the ítem', () => {
    const casa = createCasa({ hoy: '2026-09-03' })
    const item = casa.crearItem('Yogur')!
    casa.addEnvase(item.id, 'heladera', '2026-09-10')
    casa.addEnvase(item.id, 'heladera', '2026-08-31')
    casa.tacharUno(item.id)
    expect(casa.countDe(item.id)).toBe(1)
    expect(casa.snapshot().envases[0].vence).toBe('2026-09-10')
    expect(casa.snapshot().items).toHaveLength(1)
  })

  it('tacharUno is a no-op when count is 0', () => {
    const casa = createCasa({ hoy: '2026-09-03' })
    const item = casa.crearItem('Aceite')!
    casa.tacharUno(item.id)
    expect(casa.countDe(item.id)).toBe(0)
    expect(casa.snapshot().lastClosed).toBeNull()
  })

  it('deshacer restores the closed envase lugar and fecha', () => {
    vi.useFakeTimers()
    const casa = createCasa({ hoy: '2026-09-03' })
    const item = casa.crearItem('Leche')!
    casa.addEnvase(item.id, 'heladera', '2026-09-05')
    casa.tacharUno(item.id)
    expect(casa.countDe(item.id)).toBe(0)
    casa.deshacer()
    expect(casa.countDe(item.id)).toBe(1)
    expect(casa.snapshot().envases[0]).toMatchObject({
      lugarId: 'heladera',
      vence: '2026-09-05',
    })
    expect(casa.snapshot().lastClosed).toBeNull()
    vi.useRealTimers()
  })

  it('a new tachar replaces the pending undo', () => {
    vi.useFakeTimers()
    const casa = createCasa({ hoy: '2026-09-03' })
    const item = casa.crearItem('Leche')!
    casa.addEnvase(item.id, null, '2026-09-04')
    casa.addEnvase(item.id, null, '2026-09-08')
    casa.tacharUno(item.id)
    casa.tacharUno(item.id)
    casa.deshacer()
    expect(casa.countDe(item.id)).toBe(1)
    expect(casa.snapshot().envases[0].vence).toBe('2026-09-08')
    vi.advanceTimersByTime(5000)
    expect(casa.snapshot().lastClosed).toBeNull()
    vi.useRealTimers()
  })

  it('changing lote does not overwrite a particular date', () => {
    const casa = createCasa({ hoy: '2026-09-03' })
    const item = casa.crearItem('Leche')!
    casa.setVenceLote(item.id, '2026-09-05')
    casa.addEnvase(item.id, null, null)
    casa.addEnvase(item.id, null, null)
    const particularId = casa.snapshot().envases[0].id
    casa.setVenceEnvase(particularId, '2026-08-20')
    casa.setVenceLote(item.id, '2026-09-12')
    const envases = casa.snapshot().envases
    expect(envases.find((e) => e.id === particularId)?.vence).toBe('2026-08-20')
    expect(envases.find((e) => e.id !== particularId)?.vence).toBe('2026-09-12')
    expect(casa.snapshot().items[0].venceLote).toBe('2026-09-12')
  })

  it('tonoItem is vencido if lote or any envase is past today', () => {
    const casa = createCasa({ hoy: '2026-09-03' })
    const item = casa.crearItem('Yogur')!
    casa.setVenceLote(item.id, '2026-08-31')
    casa.addEnvase(item.id, null, null)
    expect(casa.tonoItem(item.id)).toBe('vencido')
  })

  it('tonoItem is por_vencer when the date is today through today plus ventana', () => {
    const casa = createCasa({ hoy: '2026-09-03' })
    const item = casa.crearItem('Leche')!
    casa.setVenceLote(item.id, '2026-09-05')
    casa.addEnvase(item.id, null, null)
    expect(casa.tonoItem(item.id)).toBe('por_vencer')
  })

  it('an ítem with no dates is en casa, not vence', () => {
    const casa = createCasa({ hoy: '2026-09-03' })
    const item = casa.crearItem('Arroz')!
    casa.addEnvase(item.id, null, null)
    expect(casa.tonoItem(item.id)).toBe('ok')
  })

  it('addParticularidad ticks an active ítem with the same name', () => {
    const casa = createCasa({ hoy: '2026-09-03' })
    const item = casa.crearItem('Leche')!
    casa.addParticularidad('leche')
    expect(casa.snapshot().ticks[item.id]).toBe(true)
    expect(casa.snapshot().particularidades).toHaveLength(0)
  })

  it('addParticularidad appends a ticked extra and can remove it', () => {
    const casa = createCasa({ hoy: '2026-09-03' })
    casa.addParticularidad('Velas')
    expect(casa.snapshot().particularidades).toEqual([
      expect.objectContaining({ nombre: 'Velas', ticked: true }),
    ])
    const id = casa.snapshot().particularidades[0].id
    casa.toggleParticularidad(id)
    expect(casa.snapshot().particularidades[0].ticked).toBe(false)
    casa.removeParticularidad(id)
    expect(casa.snapshot().particularidades).toHaveLength(0)
  })

  it('archivar is only allowed at count 0 and drops the compra tick', () => {
    const casa = createCasa({ hoy: '2026-09-03' })
    const item = casa.crearItem('Aceite')!
    casa.addEnvase(item.id, null, null)
    casa.toggleTick(item.id)
    casa.archivar(item.id)
    expect(casa.snapshot().items[0].archived).toBe(false)
    casa.tacharUno(item.id)
    casa.archivar(item.id)
    expect(casa.snapshot().items[0].archived).toBe(true)
    expect(casa.snapshot().ticks[item.id]).toBe(false)
    expect(casa.itemsActivos()).toHaveLength(0)
    casa.desarchivar(item.id)
    expect(casa.itemsActivos()).toHaveLength(1)
  })

  it('settings change ventana and lugares without requiring lugar on +', () => {
    const casa = createCasa({ hoy: '2026-09-03' })
    casa.setVentanaDias(3)
    casa.setLugares([{ id: 'heladera', nombre: 'Heladera' }])
    const item = casa.crearItem('Leche')!
    casa.setVenceLote(item.id, '2026-09-08')
    casa.addEnvase(item.id, null, null)
    expect(casa.snapshot().ventanaDias).toBe(3)
    expect(casa.tonoItem(item.id)).toBe('ok')
    expect(casa.snapshot().envases[0].lugarId).toBeNull()
    expect(casa.snapshot().lugares).toEqual([
      { id: 'heladera', nombre: 'Heladera' },
    ])
  })
})
