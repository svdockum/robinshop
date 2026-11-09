export type ParsedScan =
  | { type: 'product', code: string }
  | { type: 'checkin', slug: string, token: string }
  | { type: 'checkout', slug: string, token: string }
  | { type: 'card', code: string }
  | { type: 'unknown', raw: string }

const PRODUCT_CODE = /^[A-Za-z0-9-]{2,32}$/
const SLUG = /^[a-z0-9-]{1,40}$/
const CARD_CODE = /^[A-Za-z0-9_-]{8,64}$/

/**
 * Vertaalt de inhoud van een gescande QR-code of barcode naar een actie.
 * De host van een URL maakt niet uit: labels kunnen vanaf een andere omgeving geprint zijn.
 */
export function parseScan(raw: string): ParsedScan {
  const text = (raw ?? '').trim()
  const unknown: ParsedScan = { type: 'unknown', raw: text }
  if (!text) return unknown

  if (/^https?:\/\//i.test(text)) {
    let url: URL
    try {
      url = new URL(text)
    }
    catch {
      return unknown
    }
    const [first, second, ...rest] = url.pathname.split('/').filter(Boolean)
    if (!first || !second || rest.length > 0) return unknown
    const value = decodeURIComponent(second)
    const token = url.searchParams.get('t') ?? ''

    switch (first) {
      case 'p':
        return PRODUCT_CODE.test(value) ? { type: 'product', code: value.toUpperCase() } : unknown
      case 'in':
        return SLUG.test(value) && token ? { type: 'checkin', slug: value, token } : unknown
      case 'uit':
        return SLUG.test(value) && token ? { type: 'checkout', slug: value, token } : unknown
      case 'pas':
        return CARD_CODE.test(value) ? { type: 'card', code: value } : unknown
      default:
        return unknown
    }
  }

  return PRODUCT_CODE.test(text) ? { type: 'product', code: text.toUpperCase() } : unknown
}
