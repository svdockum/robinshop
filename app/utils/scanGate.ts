/**
 * Voorkomt dubbele registraties: de camera ziet dezelfde code vele keren per seconde,
 * en een hand kan terugzwaaien over een buurlabel. Elke code telt pas opnieuw als hij
 * `windowMs` lang níet gezien is. Geeft `true` als de scan verwerkt moet worden.
 */
export function createScanGate(windowMs = 2500) {
  const lastSeen = new Map<string, number>()

  return (raw: string, nowMs: number = Date.now()): boolean => {
    const previous = lastSeen.get(raw)
    lastSeen.set(raw, nowMs)
    // Oude codes opruimen zodat de map klein blijft.
    for (const [code, at] of lastSeen) {
      if (nowMs - at > windowMs * 4) lastSeen.delete(code)
    }
    return previous === undefined || nowMs - previous >= windowMs
  }
}

interface DetectedLike {
  rawValue: string
  boundingBox?: { width: number, height: number }
}

/** Bij meerdere codes in beeld: de grootste, dus degene waar de camera op gericht is. */
export function pickPrimaryCode(codes: DetectedLike[]): string | null {
  let best: DetectedLike | null = null
  let bestArea = -1
  for (const c of codes) {
    if (!c.rawValue) continue
    const area = (c.boundingBox?.width ?? 0) * (c.boundingBox?.height ?? 0)
    if (area > bestArea) {
      best = c
      bestArea = area
    }
  }
  return best?.rawValue ?? null
}
