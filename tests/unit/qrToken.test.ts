import { describe, expect, test } from 'vitest'
import { currentWindow, signQrToken, verifyQrToken } from '~~/server/utils/qrToken'

const SECRET = 'test-geheim-voor-robin'
const INTERVAL = 60
const NOW = Date.UTC(2026, 10, 9, 12, 0, 30) // 9 nov 2026 12:00:30 UTC

describe('wisselende QR-token', () => {
  test('venster is unix-tijd gedeeld door het interval', () => {
    expect(currentWindow(60, NOW)).toBe(Math.floor(NOW / 1000 / 60))
    expect(currentWindow(3600, NOW)).toBe(Math.floor(NOW / 1000 / 3600))
  })

  test('token is deterministisch: <venster>.<22 tekens handtekening>', () => {
    const w = currentWindow(INTERVAL, NOW)
    const a = signQrToken(SECRET, 'ingang', 'in', w)
    const b = signQrToken(SECRET, 'ingang', 'in', w)
    expect(a).toBe(b)
    const [win, sig] = a.split('.')
    expect(win).toBe(String(w))
    expect(sig).toMatch(/^[A-Za-z0-9_-]{22}$/)
  })

  test('code van het huidige venster is geldig', () => {
    const token = signQrToken(SECRET, 'ingang', 'in', currentWindow(INTERVAL, NOW))
    expect(verifyQrToken(SECRET, 'ingang', 'in', token, INTERVAL, NOW)).toBe(true)
  })

  test('code van het vorige venster is nog geldig (wie net te laat scant)', () => {
    const token = signQrToken(SECRET, 'ingang', 'in', currentWindow(INTERVAL, NOW) - 1)
    expect(verifyQrToken(SECRET, 'ingang', 'in', token, INTERVAL, NOW)).toBe(true)
  })

  test('foto van 3 minuten oud (twee vensters terug) is verlopen', () => {
    const token = signQrToken(SECRET, 'ingang', 'in', currentWindow(INTERVAL, NOW - 3 * 60_000))
    expect(verifyQrToken(SECRET, 'ingang', 'in', token, INTERVAL, NOW)).toBe(false)
  })

  test('code uit de toekomst is ongeldig', () => {
    const token = signQrToken(SECRET, 'ingang', 'in', currentWindow(INTERVAL, NOW) + 1)
    expect(verifyQrToken(SECRET, 'ingang', 'in', token, INTERVAL, NOW)).toBe(false)
  })

  test('code van een ander scanpunt is ongeldig', () => {
    const token = signQrToken(SECRET, 'andere-ingang', 'in', currentWindow(INTERVAL, NOW))
    expect(verifyQrToken(SECRET, 'ingang', 'in', token, INTERVAL, NOW)).toBe(false)
  })

  test('ingangscode werkt niet bij de kassa', () => {
    const token = signQrToken(SECRET, 'ingang', 'in', currentWindow(INTERVAL, NOW))
    expect(verifyQrToken(SECRET, 'ingang', 'uit', token, INTERVAL, NOW)).toBe(false)
  })

  test('gemanipuleerde handtekening of ander geheim is ongeldig', () => {
    const w = currentWindow(INTERVAL, NOW)
    const token = signQrToken(SECRET, 'ingang', 'in', w)
    const tampered = `${w}.${'A'.repeat(22)}`
    expect(verifyQrToken(SECRET, 'ingang', 'in', tampered, INTERVAL, NOW)).toBe(false)
    expect(verifyQrToken('ander-geheim', 'ingang', 'in', token, INTERVAL, NOW)).toBe(false)
  })

  test('rommel is ongeldig zonder te crashen', () => {
    for (const junk of ['', 'abc', '123', '.', 'x.y', `${currentWindow(INTERVAL, NOW)}.`]) {
      expect(verifyQrToken(SECRET, 'ingang', 'in', junk, INTERVAL, NOW)).toBe(false)
    }
  })
})
