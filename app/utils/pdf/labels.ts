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
  /** klein: 95×45 mm, 10 per A4 staand. groot: 138×65 mm, 4 per A4 liggend. */
  size: 'klein' | 'groot'
  /** robin: beige QR op koraal (zoals de huidige labels). hoog: groene QR op beige vlak. */
  style: 'robin' | 'hoog'
  /** Basis-URL in de QR-code, bijv. https://robinshop.vercel.app */
  baseUrl: string
}

const LAYOUTS = {
  klein: { w: mm(95), h: mm(45), cols: 2, rows: 5, gap: mm(5), landscape: false },
  groot: { w: mm(138), h: mm(65), cols: 2, rows: 2, gap: mm(5), landscape: true },
} as const

/**
 * Productlabel in de stijl van docs/reference/Eetpunten.png:
 * koraal vlak, QR links, groot puntental, "eetpunt(en)" verticaal, ROBIN-logo rechtsonder.
 * Klein toegevoegd: de productnaam onderaan, zodat labels niet verwisseld worden.
 */
function drawLabel(page: PDFPage, brand: BrandDoc, product: LabelProduct, x: number, y: number, w: number, h: number, opts: LabelOptions) {
  const { display, sans } = brand
  page.drawRectangle({ x, y, width: w, height: h, color: COLORS.koraal })

  // QR-code
  const qrSize = h * 0.745
  const qrX = x + w * 0.09
  const qrTop = y + h - h * 0.105
  const qrY = qrTop - qrSize
  const url = joinUrl(opts.baseUrl, `/p/${encodeURIComponent(product.code)}`)
  if (opts.style === 'hoog') {
    const pad = qrSize * 0.06
    page.drawRectangle({ x: qrX, y: qrY, width: qrSize, height: qrSize, color: COLORS.beige })
    drawQr(page, url, qrX + pad, qrY + pad, qrSize - 2 * pad, COLORS.groen)
  }
  else {
    drawQr(page, url, qrX, qrY, qrSize, COLORS.beige)
  }

  // "eetpunt" / "eetpunten" verticaal, van onder naar boven gelezen
  const word = product.points === 1 ? 'eetpunt' : 'eetpunten'
  const wordSize = fitSize(display, 'eetpunten', h * 0.62, h * 0.2)
  const wordWidth = display.widthOfTextAtSize(word, wordSize)
  const wordX = x + w * 0.885
  const wordTop = qrTop - h * 0.02
  page.drawText(word, { x: wordX, y: wordTop - wordWidth, size: wordSize, font: display, color: COLORS.beige, rotate: degrees(90) })

  // Puntental tussen QR en woord
  const label = String(product.points)
  const zoneLeft = qrX + qrSize + w * 0.035
  const zoneRight = wordX - wordSize * capHeightRatio(display) - w * 0.04
  const capRatio = capHeightRatio(display)
  const numberSize = fitSize(display, label, zoneRight - zoneLeft, (qrSize * 0.98) / capRatio)
  const numberWidth = display.widthOfTextAtSize(label, numberSize)
  const capH = numberSize * capRatio
  page.drawText(label, {
    x: zoneLeft + (zoneRight - zoneLeft - numberWidth) / 2,
    y: qrY + (qrSize - capH) / 2,
    size: numberSize,
    font: display,
    color: COLORS.beige,
  })

  // Logo rechtsonder
  const logoW = w * 0.13
  drawLogo(page, x + w * 0.955 - logoW, y + h * 0.06, logoW, COLORS.beige)

  // Productnaam klein onder de QR
  const nameSize = fitSize(sans, product.name, qrSize + (zoneRight - zoneLeft), h * 0.06)
  page.drawText(product.name, { x: qrX, y: y + h * 0.035, size: nameSize, font: sans, color: COLORS.beige })
}

export async function buildLabelsPdf(products: LabelProduct[], opts: LabelOptions, assets: BrandAssets): Promise<Uint8Array> {
  if (!products.length) throw new Error('Kies minstens één product')
  const brand = await createBrandDoc(assets, 'Robin productlabels')
  const layout = LAYOUTS[opts.size]
  const pageWidth = layout.landscape ? A4.height : A4.width
  const pageHeight = layout.landscape ? A4.width : A4.height
  const slots = gridSlots({
    pageWidth, pageHeight, itemWidth: layout.w, itemHeight: layout.h, cols: layout.cols, rows: layout.rows, gap: layout.gap,
  })

  let page: PDFPage | null = null
  products.forEach((product, i) => {
    const slot = slots[i % slots.length]!
    if (i % slots.length === 0) page = brand.doc.addPage([pageWidth, pageHeight])
    drawCropMarks(page!, slot.x, slot.y, layout.w, layout.h)
    drawLabel(page!, brand, product, slot.x, slot.y, layout.w, layout.h, opts)
  })

  return brand.doc.save()
}
