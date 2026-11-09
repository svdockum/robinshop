import { createHmac, timingSafeEqual } from 'node:crypto'

/** 'in' = ingang (poortje), 'uit' = kassa. */
export type ScanKind = 'in' | 'uit'

const SIG_LENGTH = 22

/** Nummer van het huidige tijdvenster: ⌊unix-tijd / interval⌋. */
export function currentWindow(intervalSec: number, nowMs: number = Date.now()): number {
  return Math.floor(nowMs / 1000 / intervalSec)
}

function signature(secret: string, slug: string, kind: ScanKind, window: number): string {
  return createHmac('sha256', secret)
    .update(`${slug}:${kind}:${window}`)
    .digest('base64url')
    .slice(0, SIG_LENGTH)
}

/** Token voor in de wisselende QR-code: `<venster>.<handtekening>`. */
export function signQrToken(secret: string, slug: string, kind: ScanKind, window: number): string {
  return `${window}.${signature(secret, slug, kind, window)}`
}

/** Geldig als het token bij dit scanpunt en deze soort hoort en uit het huidige of vorige venster komt. */
export function verifyQrToken(
  secret: string,
  slug: string,
  kind: ScanKind,
  token: string,
  intervalSec: number,
  nowMs: number = Date.now(),
): boolean {
  const match = /^(\d{1,12})\.([A-Za-z0-9_-]{22})$/.exec(token ?? '')
  if (!match) return false
  const window = Number(match[1])
  const current = currentWindow(intervalSec, nowMs)
  if (window !== current && window !== current - 1) return false

  const expected = Buffer.from(signature(secret, slug, kind, window))
  const given = Buffer.from(match[2]!)
  return expected.length === given.length && timingSafeEqual(expected, given)
}
