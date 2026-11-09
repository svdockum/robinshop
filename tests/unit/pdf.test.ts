import { readFileSync } from 'node:fs'
import { PDFDocument } from 'pdf-lib'
import { beforeAll, describe, expect, test } from 'vitest'
import type { BrandAssets } from '~/utils/pdf/brand'
import { LABEL_SIZES, buildLabelsPdf, labelLayout } from '~/utils/pdf/labels'
import { mm } from '~/utils/pdf/brand'
import { buildCardsPdf } from '~/utils/pdf/cards'
import { buildPosterPdf } from '~/utils/pdf/poster'

let assets: BrandAssets

beforeAll(() => {
  assets = {
    lektorat: new Uint8Array(readFileSync('public/fonts/Lektorat-NarrowBold.ttf')),
    workSans: new Uint8Array(readFileSync('public/fonts/WorkSans-Variable.ttf')),
  }
})

async function pageCount(bytes: Uint8Array) {
  return (await PDFDocument.load(bytes)).getPageCount()
}

function isPdf(bytes: Uint8Array) {
  return new TextDecoder().decode(bytes.slice(0, 5)) === '%PDF-'
}

const products = Array.from({ length: 11 }, (_, i) => ({ code: `P${i}`, name: `Product ${i}`, points: (i % 12) + 1 }))

describe('productlabels', () => {
  test('krat: 12 per A4, dus 12 producten = 1 pagina en 13 = 2', async () => {
    const twaalf = Array.from({ length: 13 }, (_, i) => ({ code: `K${i}`, name: `Krat ${i}`, points: 3 }))
    const een = await buildLabelsPdf(twaalf.slice(0, 12), { size: 'krat', style: 'robin', baseUrl: 'https://robin.test' }, assets)
    expect(isPdf(een)).toBe(true)
    expect(await pageCount(een)).toBe(1)
    expect(await pageCount(await buildLabelsPdf(twaalf, { size: 'krat', style: 'robin', baseUrl: 'https://robin.test' }, assets))).toBe(2)
  })

  test('kratlabel is 90 × 40 mm (inkeping in het krat)', () => {
    expect(LABEL_SIZES.krat.w).toBeCloseTo(mm(90), 3)
    expect(LABEL_SIZES.krat.h).toBeCloseTo(mm(40), 3)
    expect(LABEL_SIZES.krat.visible).toBeCloseTo(mm(65), 3)
  })

  test('kratlabel: alles staat in de zichtbare 65 mm, met minstens 2 mm marge', () => {
    const { w, h, visible } = LABEL_SIZES.krat
    const layout = labelLayout(w, h, visible)
    const left = (w - visible) / 2 + mm(2)
    const right = (w + visible) / 2 - mm(2)
    for (const [name, box] of Object.entries(layout.boxes)) {
      expect(box.x, `${name} links`).toBeGreaterThanOrEqual(left - 1e-6)
      expect(box.x + box.w, `${name} rechts`).toBeLessThanOrEqual(right + 1e-6)
      expect(box.y, `${name} onder`).toBeGreaterThanOrEqual(0)
      expect(box.y + box.h, `${name} boven`).toBeLessThanOrEqual(h + 1e-6)
    }
  })

  test('kratlabel: QR-code minstens 25 mm, goed te scannen', () => {
    const { w, h, visible } = LABEL_SIZES.krat
    expect(labelLayout(w, h, visible).boxes.qr.w).toBeGreaterThanOrEqual(mm(25))
  })

  test('groot: 4 per A4', async () => {
    const pdf = await buildLabelsPdf(products.slice(0, 4), { size: 'groot', style: 'hoog', baseUrl: 'https://robin.test' }, assets)
    expect(await pageCount(pdf)).toBe(1)
  })

  test('A4 staand voor krat, liggend voor groot', async () => {
    const klein = await PDFDocument.load(await buildLabelsPdf(products.slice(0, 1), { size: 'krat', style: 'robin', baseUrl: 'https://robin.test' }, assets))
    const groot = await PDFDocument.load(await buildLabelsPdf(products.slice(0, 1), { size: 'groot', style: 'robin', baseUrl: 'https://robin.test' }, assets))
    const [kw, kh] = [klein.getPage(0).getWidth(), klein.getPage(0).getHeight()]
    const [gw, gh] = [groot.getPage(0).getWidth(), groot.getPage(0).getHeight()]
    expect(Math.round(kw)).toBe(595)
    expect(Math.round(kh)).toBe(842)
    expect(Math.round(gw)).toBe(842)
    expect(Math.round(gh)).toBe(595)
  })

  test('geen producten: fout in plaats van een lege PDF', async () => {
    await expect(buildLabelsPdf([], { size: 'krat', style: 'robin', baseUrl: 'https://robin.test' }, assets)).rejects.toThrow()
  })
})

describe('ledenpassen en poster', () => {
  test('3 passen passen op 1 pagina', async () => {
    const pdf = await buildCardsPdf([
      { name: 'Familie Yilmaz', cardCode: 'DEMO-YILMAZ-PAS-0001' },
      { name: 'Familie de Vries', cardCode: 'DEMO-DEVRIES-PAS-0002' },
      { name: 'Familie Met Een Hele Lange Achternaam Van Der Berg', cardCode: 'abcdefghijklmnopqrst' },
    ], 'https://robin.test', assets)
    expect(await pageCount(pdf)).toBe(1)
  })

  test('poster is één A4', async () => {
    const pdf = await buildPosterPdf('https://robin.test', assets)
    expect(isPdf(pdf)).toBe(true)
    expect(await pageCount(pdf)).toBe(1)
  })
})
