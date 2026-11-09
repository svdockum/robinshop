import { readFileSync } from 'node:fs'
import { PDFDocument } from 'pdf-lib'
import { beforeAll, describe, expect, test } from 'vitest'
import type { BrandAssets } from '~/utils/pdf/brand'
import { buildLabelsPdf } from '~/utils/pdf/labels'
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
  test('klein: 10 per A4, dus 11 producten = 2 pagina’s', async () => {
    const pdf = await buildLabelsPdf(products, { size: 'klein', style: 'robin', baseUrl: 'https://robin.test' }, assets)
    expect(isPdf(pdf)).toBe(true)
    expect(await pageCount(pdf)).toBe(2)
  })

  test('groot: 4 per A4', async () => {
    const pdf = await buildLabelsPdf(products.slice(0, 4), { size: 'groot', style: 'hoog', baseUrl: 'https://robin.test' }, assets)
    expect(await pageCount(pdf)).toBe(1)
  })

  test('A4 staand voor klein, liggend voor groot', async () => {
    const klein = await PDFDocument.load(await buildLabelsPdf(products.slice(0, 1), { size: 'klein', style: 'robin', baseUrl: 'https://robin.test' }, assets))
    const groot = await PDFDocument.load(await buildLabelsPdf(products.slice(0, 1), { size: 'groot', style: 'robin', baseUrl: 'https://robin.test' }, assets))
    const [kw, kh] = [klein.getPage(0).getWidth(), klein.getPage(0).getHeight()]
    const [gw, gh] = [groot.getPage(0).getWidth(), groot.getPage(0).getHeight()]
    expect(Math.round(kw)).toBe(595)
    expect(Math.round(kh)).toBe(842)
    expect(Math.round(gw)).toBe(842)
    expect(Math.round(gh)).toBe(595)
  })

  test('geen producten: fout in plaats van een lege PDF', async () => {
    await expect(buildLabelsPdf([], { size: 'klein', style: 'robin', baseUrl: 'https://robin.test' }, assets)).rejects.toThrow()
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
