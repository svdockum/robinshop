import fontkit from '@pdf-lib/fontkit'
import { PDFDocument, rgb } from 'pdf-lib'
import type { PDFFont, PDFPage, RGB } from 'pdf-lib'
import QRCode from 'qrcode'
import { LOGO_HEIGHT, LOGO_PATHS, LOGO_WIDTH } from '../brandLogo'

/** Merkfonts als bytes (browser: uit /fonts, tests: uit public/fonts). */
export interface BrandAssets {
  lektorat: Uint8Array
  workSans: Uint8Array
}

export interface BrandDoc {
  doc: PDFDocument
  display: PDFFont
  sans: PDFFont
}

/** Kleuren uit het merkboek. */
export const COLORS = {
  groen: rgb(17 / 255, 86 / 255, 86 / 255),
  beige: rgb(250 / 255, 245 / 255, 223 / 255),
  koraal: rgb(253 / 255, 100 / 255, 78 / 255),
} as const

export const A4 = { width: mm(210), height: mm(297) }

export function mm(value: number): number {
  return (value * 72) / 25.4
}

export async function loadBrandAssets(fetcher: typeof fetch = fetch): Promise<BrandAssets> {
  const [lektorat, workSans] = await Promise.all(
    ['/fonts/Lektorat-NarrowBold.ttf', '/fonts/WorkSans-Variable.ttf'].map(async (url) => {
      const res = await fetcher(url)
      if (!res.ok) throw new Error(`Font ${url} kon niet geladen worden`)
      return new Uint8Array(await res.arrayBuffer())
    }),
  )
  return { lektorat: lektorat!, workSans: workSans! }
}

export async function createBrandDoc(assets: BrandAssets, title: string): Promise<BrandDoc> {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  doc.setTitle(title)
  doc.setAuthor('Robin — de super fijne markt')
  doc.setCreator('Robin shop-scan')
  const display = await doc.embedFont(assets.lektorat, { subset: true })
  const sans = await doc.embedFont(assets.workSans, { subset: false })
  return { doc, display, sans }
}

/** Hoogte van hoofdletters/cijfers als fractie van de fontgrootte. */
export function capHeightRatio(font: PDFFont): number {
  const fk = (font as unknown as { embedder?: { font?: { capHeight?: number, unitsPerEm?: number } } }).embedder?.font
  return fk?.capHeight && fk.unitsPerEm ? fk.capHeight / fk.unitsPerEm : 0.72
}

/** Grootste fontgrootte waarbij `text` binnen `maxWidth` past (en niet groter dan `maxSize`). */
export function fitSize(font: PDFFont, text: string, maxWidth: number, maxSize: number): number {
  const w = font.widthOfTextAtSize(text, 1)
  return w > 0 ? Math.min(maxSize, maxWidth / w) : maxSize
}

/**
 * QR-code als één vectorpad (geen naden tussen de modules). (x, y) is linksonder,
 * `size` de breedte van de code zonder stille zone.
 */
export function drawQr(page: PDFPage, text: string, x: number, y: number, size: number, color: RGB) {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' })
  const n = qr.modules.size
  const parts: string[] = []
  for (let row = 0; row < n; row++) {
    let col = 0
    while (col < n) {
      if (!qr.modules.get(row, col)) {
        col++
        continue
      }
      const start = col
      while (col < n && qr.modules.get(row, col)) col++
      // Iets overlappen in de hoogte, zodat rijen naadloos op elkaar aansluiten.
      parts.push(`M${start} ${row}h${col - start}v1.02h${start - col}z`)
    }
  }
  page.drawSvgPath(parts.join(''), { x, y: y + size, scale: size / n, color, borderWidth: 0 })
}

/** ROBIN-logo (vector). (x, y) is linksonder, breedte in punten. */
export function drawLogo(page: PDFPage, x: number, y: number, width: number, color: RGB) {
  const scale = width / LOGO_WIDTH
  const height = LOGO_HEIGHT * scale
  for (const d of LOGO_PATHS) {
    page.drawSvgPath(d, { x, y: y + height, scale, color, borderWidth: 0 })
  }
}

export function logoHeight(width: number): number {
  return (LOGO_HEIGHT / LOGO_WIDTH) * width
}

/** Plaatsingen in een raster, van linksboven naar rechtsonder. */
export function gridSlots(opts: {
  pageWidth: number
  pageHeight: number
  itemWidth: number
  itemHeight: number
  cols: number
  rows: number
  gap: number
}): { x: number, y: number }[] {
  const { pageWidth, pageHeight, itemWidth, itemHeight, cols, rows, gap } = opts
  const marginX = (pageWidth - cols * itemWidth - (cols - 1) * gap) / 2
  const marginY = (pageHeight - rows * itemHeight - (rows - 1) * gap) / 2
  const slots: { x: number, y: number }[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      slots.push({
        x: marginX + c * (itemWidth + gap),
        y: pageHeight - marginY - (r + 1) * itemHeight - r * gap,
      })
    }
  }
  return slots
}

/** Dunne snijlijntjes in de hoeken van een vlak. */
export function drawCropMarks(page: PDFPage, x: number, y: number, w: number, h: number) {
  const len = mm(3)
  const off = mm(1)
  const color = rgb(0.7, 0.7, 0.7)
  const t = 0.4
  const lines: [number, number, number, number][] = [
    [x - off - len, y, x - off, y], [x, y - off - len, x, y - off],
    [x + w + off, y, x + w + off + len, y], [x + w, y - off - len, x + w, y - off],
    [x - off - len, y + h, x - off, y + h], [x, y + h + off, x, y + h + off + len],
    [x + w + off, y + h, x + w + off + len, y + h], [x + w, y + h + off, x + w, y + h + off + len],
  ]
  for (const [x1, y1, x2, y2] of lines) {
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: t, color })
  }
}

export function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}${path}`
}
