import type { BrandAssets } from './brand'
import { A4, COLORS, createBrandDoc, drawLogo, drawQr, fitSize, mm } from './brand'

/** A4-poster voor bij de winkelingang: QR-code en link naar de website. */
export async function buildPosterPdf(baseUrl: string, assets: BrandAssets): Promise<Uint8Array> {
  const { doc, display, sans } = await createBrandDoc(assets, 'Robin ingangsposter')
  const page = doc.addPage([A4.width, A4.height])
  const { width, height } = A4
  const margin = mm(18)

  page.drawRectangle({ x: 0, y: 0, width, height, color: COLORS.beige })
  // Koraal accent rechtsboven (zoals in de app)
  page.drawCircle({ x: width, y: height, size: mm(42), color: COLORS.koraal })

  drawLogo(page, margin, height - margin - mm(26), mm(66), COLORS.groen)
  page.drawText('De super fijne markt', { x: margin, y: height - margin - mm(34), size: 16, font: display, color: COLORS.groen })

  const title = 'Welkom bij Robin'
  const titleSize = fitSize(display, title, width - 2 * margin, 64)
  page.drawText(title, { x: margin, y: height - mm(78), size: titleSize, font: display, color: COLORS.groen })
  page.drawText('Scan de QR-code met je telefoon.', { x: margin, y: height - mm(92), size: 18, font: sans, color: COLORS.groen })
  page.drawText('Log in met je ledenpas en scan daarna de code bij het poortje.', { x: margin, y: height - mm(100), size: 12, font: sans, color: COLORS.groen })

  const tile = mm(120)
  const tileX = (width - tile) / 2
  const tileY = mm(48)
  page.drawRectangle({ x: tileX, y: tileY, width: tile, height: tile, color: COLORS.groen })
  const inset = mm(8)
  page.drawRectangle({ x: tileX + inset, y: tileY + inset, width: tile - 2 * inset, height: tile - 2 * inset, color: COLORS.beige })
  const qrInset = inset + mm(5)
  drawQr(page, baseUrl, tileX + qrInset, tileY + qrInset, tile - 2 * qrInset, COLORS.groen)

  const link = baseUrl.replace(/^https?:\/\//, '')
  const linkSize = fitSize(display, link, width - 2 * margin, 30)
  page.drawText(link, { x: (width - display.widthOfTextAtSize(link, linkSize)) / 2, y: mm(30), size: linkSize, font: display, color: COLORS.groen })

  return doc.save()
}
