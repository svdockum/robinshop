/**
 * Voorkomt dubbele registraties: de camera ziet dezelfde code vele keren per seconde.
 * Een code telt pas opnieuw als hij `windowMs` lang níet gezien is.
 * Geeft `true` als de scan verwerkt moet worden.
 */
export function createScanGate(windowMs = 2500) {
  let lastRaw = ''
  let lastSeen = Number.NEGATIVE_INFINITY

  return (raw: string, nowMs: number = Date.now()): boolean => {
    const repeat = raw === lastRaw && nowMs - lastSeen < windowMs
    lastRaw = raw
    lastSeen = nowMs
    return !repeat
  }
}
