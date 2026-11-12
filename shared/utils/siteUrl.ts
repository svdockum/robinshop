/**
 * Maakt van de ingestelde site-URL een volledige link zonder slash aan het eind.
 * Zonder `https://` is een QR-code gewone tekst: de iPhone-camera biedt dan een
 * Google-zoekopdracht aan in plaats van de website te openen.
 */
export function normalizeSiteUrl(value: string | undefined | null): string {
  const trimmed = (value ?? '').trim().replace(/\/+$/, '')
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed.replace(/^\/+/, '')}`
}
