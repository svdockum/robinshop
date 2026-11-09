import type { PDFPage } from 'pdf-lib'
import type { BrandAssets, BrandDoc } from './brand'
import { A4, COLORS, createBrandDoc, drawCropMarks, drawLogo, drawQr, fitSize, gridSlots, joinUrl, mm } from './brand'

export interface CardHousehold {
  name: string
  cardCode: string
}

const CARD = { w: mm(85.6), h: mm(54), cols: 2, rows: 5, gap: mm(3) }

/** Ledenpas op creditcardformaat: groen vlak, beige logo, naam, QR op beige vlak. */
function drawCard(page: PDFPage, brand: BrandDoc, hh: CardHousehold, x: number, y: number, baseUrl: string) {
  const { w, h } = CARD
  const { display, sans } = brand
  page.drawRectangle({ x, y, width: w, height: h, color: COLORS.groen })

  const pad = mm(5)
  drawLogo(page, x + pad, y + h - pad - mm(9), mm(23), COLORS.beige)

  // QR rechts op beige vlak
  const tile = mm(33)
  const tileX = x + w - pad - tile
  const tileY = y + (h - tile) / 2 - mm(2)
  page.drawRectangle({ x: tileX, y: tileY, width: tile, height: tile, color: COLORS.beige })
  const inset = mm(2)
  drawQr(page, joinUrl(baseUrl, `/pas/${encodeURIComponent(hh.cardCode)}`), tileX + inset, tileY + inset, tile - 2 * inset, COLORS.groen)
  const hint = 'Scan om in te loggen'
  const hintSize = fitSize(sans, hint, tile, 6.5)
  page.drawText(hint, { x: tileX + (tile - sans.widthOfTextAtSize(hint, hintSize)) / 2, y: tileY - mm(3.2), size: hintSize, font: sans, color: COLORS.beige })

  // Tekst links
  const textW = tileX - x - pad - mm(3)
  page.drawText('Ledenpas', { x: x + pad, y: y + mm(21), size: 9, font: sans, color: COLORS.beige })
  const nameSize = fitSize(display, hh.name, textW, 20)
  page.drawText(hh.name, { x: x + pad, y: y + mm(13), size: nameSize, font: display, color: COLORS.beige })
  page.drawText('De super fijne markt', { x: x + pad, y: y + pad, size: 7, font: sans, color: COLORS.beige })
}

export async function buildCardsPdf(households: CardHousehold[], baseUrl: string, assets: BrandAssets): Promise<Uint8Array> {
  if (!households.length) throw new Error('Kies minstens één huishouden')
  const brand = await createBrandDoc(assets, 'Robin ledenpassen')
  const slots = gridSlots({ pageWidth: A4.width, pageHeight: A4.height, itemWidth: CARD.w, itemHeight: CARD.h, cols: CARD.cols, rows: CARD.rows, gap: CARD.gap })
  let page: PDFPage | null = null
  households.forEach((hh, i) => {
    const slot = slots[i % slots.length]!
    if (i % slots.length === 0) page = brand.doc.addPage([A4.width, A4.height])
    drawCropMarks(page!, slot.x, slot.y, CARD.w, CARD.h)
    drawCard(page!, brand, hh, slot.x, slot.y, baseUrl)
  })
  return brand.doc.save()
}
