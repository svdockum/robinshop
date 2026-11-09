import { degrees } from 'pdf-lib'
import type { PDFPage } from 'pdf-lib'
import type { BrandAssets, BrandDoc } from './brand'
import { A4, COLORS, capHeightRatio, createBrandDoc, drawCropMarks, drawLogo, drawQr, fitSize, gridSlots, joinUrl, mm } from './brand'

export interface LabelProduct {
  code: string
  name: string
  points: number
}

export interface LabelOptions {
  /** krat: 90×40 mm voor de inkeping in het krat, 12 per A4. groot: 138×65 mm, 4 per A4 liggend. */
  size: 'krat' | 'groot'
  /** robin: beige QR op koraal (zoals de huidige labels). hoog: groene QR op beige vlak. */
  style: 'robin' | 'hoog'
  /** Basis-URL in de QR-code, bijv. https://robinshop.vercel.app */
  baseUrl: string
}

/**
 * Labelformaten. `visible` is de breedte die zichtbaar blijft: de houder van het krat
 * bedekt links en rechts een strook, dus alle inhoud moet binnen die middelste breedte.
 */
export const LABEL_SIZES = {
  krat: { w: mm(90), h: mm(40), visible: mm(65), cols: 2, rows: 6, gap: mm(5), landscape: false },
  groot: { w: mm(138), h: mm(65), visible: mm(138), cols: 2, rows: 2, gap: mm(5), landscape: true },
} as const

export interface Box { x: number, y: number, w: number, h: number }

/** Verhouding breedte/hoogte van het inhoudsblok, afgeleid van docs/reference/Eetpunten.png. */
const BLOCK_ASPECT = 1.55
const SIDE_MARGIN = mm(2.5)

/**
 * Plaatsing van alle onderdelen binnen een label van w×h (oorsprong linksonder).
 * Het inhoudsblok houdt de verhoudingen van het referentielabel en wordt zo nodig
 * kleiner geschaald zodat het met marge binnen de zichtbare breedte valt.
 */
export function labelLayout(w: number, h: number, visible: number): { boxes: { qr: Box, number: Box, word: Box, logo: Box, name: Box } } {
  const maxBlockW = Math.min(w, visible) - 2 * SIDE_MARGIN
  const H = Math.min(h, maxBlockW / BLOCK_ASPECT)
  const W = BLOCK_ASPECT * H
  const bx = (w - W) / 2
  const by = (h - H) / 2
  const box = (x: number, y: number, bw: number, bh: number): Box => ({ x: bx + x * H, y: by + y * H, w: bw * H, h: bh * H })

  const qr = box(0, 0.15, 0.745, 0.745)
  const word = box(1.43, 0.31, 0.11, 0.58)
  const logoW = 0.205
  const logo = box(BLOCK_ASPECT - logoW, 0.06, logoW, logoW * 0.3944)
  const number = box(0.785, 0.15, 1.40 - 0.785, 0.745)
  const name = box(0, 0.025, BLOCK_ASPECT - logoW - 0.04, 0.075)
  return { boxes: { qr, number, word, logo, name } }
}

/**
 * Productlabel in de stijl van docs/reference/Eetpunten.png:
 * koraal vlak, QR links, groot puntental, "eetpunt(en)" verticaal, ROBIN-logo rechtsonder.
 * Klein toegevoegd: de productnaam onderaan, zodat labels niet verwisseld worden.
 */
function drawLabel(page: PDFPage, brand: BrandDoc, product: LabelProduct, x: number, y: number, size: typeof LABEL_SIZES[keyof typeof LABEL_SIZES], opts: LabelOptions) {
  const { display, sans } = brand
  const { w, h } = size
  const { boxes } = labelLayout(w, h, size.visible)
  const at = (b: Box): Box => ({ ...b, x: x + b.x, y: y + b.y })
  const capRatio = capHeightRatio(display)

  page.drawRectangle({ x, y, width: w, height: h, color: COLORS.koraal })

  // QR-code
  const qr = at(boxes.qr)
  const url = joinUrl(opts.baseUrl, `/p/${encodeURIComponent(product.code)}`)
  if (opts.style === 'hoog') {
    const pad = qr.w * 0.06
    page.drawRectangle({ x: qr.x, y: qr.y, width: qr.w, height: qr.h, color: COLORS.beige })
    drawQr(page, url, qr.x + pad, qr.y + pad, qr.w - 2 * pad, COLORS.groen)
  }
  else {
    drawQr(page, url, qr.x, qr.y, qr.w, COLORS.beige)
  }

  // "eetpunt" / "eetpunten" verticaal, van onder naar boven gelezen, bovenaan uitgelijnd
  const word = product.points === 1 ? 'eetpunt' : 'eetpunten'
  const wordBox = at(boxes.word)
  const wordSize = fitSize(display, 'eetpunten', wordBox.h, wordBox.w / capRatio)
  const wordLength = display.widthOfTextAtSize(word, wordSize)
  page.drawText(word, {
    x: wordBox.x + wordBox.w,
    y: wordBox.y + wordBox.h - wordLength,
    size: wordSize,
    font: display,
    color: COLORS.beige,
    rotate: degrees(90),
  })

  // Puntental, zo groot mogelijk, verticaal gecentreerd naast de QR-code
  const label = String(product.points)
  const zone = at(boxes.number)
  const numberSize = fitSize(display, label, zone.w, (zone.h * 0.98) / capRatio)
  const numberWidth = display.widthOfTextAtSize(label, numberSize)
  page.drawText(label, {
    x: zone.x + (zone.w - numberWidth) / 2,
    y: zone.y + (zone.h - numberSize * capRatio) / 2,
    size: numberSize,
    font: display,
    color: COLORS.beige,
  })

  // Logo rechtsonder
  const logo = at(boxes.logo)
  drawLogo(page, logo.x, logo.y, logo.w, COLORS.beige)

  // Productnaam klein onder de QR
  const nameBox = at(boxes.name)
  const nameSize = fitSize(sans, product.name, nameBox.w, nameBox.h / 0.72)
  page.drawText(product.name, { x: nameBox.x, y: nameBox.y, size: nameSize, font: sans, color: COLORS.beige })
}

export async function buildLabelsPdf(products: LabelProduct[], opts: LabelOptions, assets: BrandAssets): Promise<Uint8Array> {
  if (!products.length) throw new Error('Kies minstens één product')
  const brand = await createBrandDoc(assets, 'Robin productlabels')
  const size = LABEL_SIZES[opts.size]
  const pageWidth = size.landscape ? A4.height : A4.width
  const pageHeight = size.landscape ? A4.width : A4.height
  const slots = gridSlots({
    pageWidth, pageHeight, itemWidth: size.w, itemHeight: size.h, cols: size.cols, rows: size.rows, gap: size.gap,
  })

  let page: PDFPage | null = null
  products.forEach((product, i) => {
    const slot = slots[i % slots.length]!
    if (i % slots.length === 0) page = brand.doc.addPage([pageWidth, pageHeight])
    drawCropMarks(page!, slot.x, slot.y, size.w, size.h)
    drawLabel(page!, brand, product, slot.x, slot.y, size, opts)
  })

  return brand.doc.save()
}
