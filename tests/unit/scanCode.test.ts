import { describe, expect, test } from 'vitest'
import { parseScan } from '~/utils/scanCode'

describe('parseScan', () => {
  test('product-URL geeft de productcode in hoofdletters', () => {
    expect(parseScan('https://robinshop.vercel.app/p/prei')).toEqual({ type: 'product', code: 'PREI' })
  })

  test('host maakt niet uit (labels geprint vanaf een andere omgeving)', () => {
    expect(parseScan('http://localhost:3000/p/MELK')).toEqual({ type: 'product', code: 'MELK' })
  })

  test('ingangs-URL geeft scanpunt en token', () => {
    expect(parseScan('https://robinshop.vercel.app/in/ingang?t=29839212.abcDEF_-123'))
      .toEqual({ type: 'checkin', slug: 'ingang', token: '29839212.abcDEF_-123' })
  })

  test('kassa-URL geeft scanpunt en token', () => {
    expect(parseScan('https://robinshop.vercel.app/uit/kassa?t=1.x'))
      .toEqual({ type: 'checkout', slug: 'kassa', token: '1.x' })
  })

  test('ledenpas-URL geeft de pascode', () => {
    expect(parseScan('https://robinshop.vercel.app/pas/DEMO-YILMAZ-PAS-0001'))
      .toEqual({ type: 'card', code: 'DEMO-YILMAZ-PAS-0001' })
  })

  test('EAN-13 barcode is een productcode', () => {
    expect(parseScan('8712345678906')).toEqual({ type: 'product', code: '8712345678906' })
  })

  test('losse code met spaties wordt opgeschoond', () => {
    expect(parseScan('  melk ')).toEqual({ type: 'product', code: 'MELK' })
  })

  test('andere websites zijn onbekend', () => {
    expect(parseScan('https://google.com/zoek')).toEqual({ type: 'unknown', raw: 'https://google.com/zoek' })
  })

  test('ingang zonder token is onbekend', () => {
    expect(parseScan('https://robinshop.vercel.app/in/ingang').type).toBe('unknown')
  })

  test('lege of vreemde invoer is onbekend', () => {
    expect(parseScan('').type).toBe('unknown')
    expect(parseScan('hallo daar!').type).toBe('unknown')
  })
})
