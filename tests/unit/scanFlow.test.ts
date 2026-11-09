import { describe, expect, test } from 'vitest'
import { createScanGate } from '~/utils/scanGate'

describe('createScanGate (geen dubbele scans door een trillende hand)', () => {
  test('zelfde code binnen 2,5 s wordt genegeerd', () => {
    const gate = createScanGate(2500)
    expect(gate('https://x/p/PREI', 0)).toBe(true)
    expect(gate('https://x/p/PREI', 800)).toBe(false)
  })

  test('zelfde code na 2,6 s mag weer', () => {
    const gate = createScanGate(2500)
    expect(gate('https://x/p/PREI', 0)).toBe(true)
    expect(gate('https://x/p/PREI', 2600)).toBe(true)
  })

  test('camera die 5 s op dezelfde code blijft gericht registreert maar één keer', () => {
    const gate = createScanGate(2500)
    const results: boolean[] = []
    for (let t = 0; t <= 5000; t += 100) results.push(gate('https://x/p/PREI', t))
    expect(results.filter(Boolean)).toHaveLength(1)
  })

  test('andere code direct erna wordt wel verwerkt', () => {
    const gate = createScanGate(2500)
    expect(gate('https://x/p/PREI', 0)).toBe(true)
    expect(gate('https://x/p/MELK', 100)).toBe(true)
  })
})
