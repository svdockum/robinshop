/** Toestemmingsstand van de camera voor deze site; 'unknown' als de browser dat niet zegt. */
export type CameraPermission = 'granted' | 'denied' | 'prompt' | 'unknown'

export type CameraProblemKind =
  | 'ask' // nog niet gevraagd, weggeklikt of "alleen deze keer" verlopen: de browser kan opnieuw vragen
  | 'blocked' // geblokkeerd voor deze site: alleen de gebruiker kan dat in de browser terugzetten
  | 'system' // de site mag, maar de telefoon of computer geeft de browser geen camera
  | 'busy'
  | 'missing'
  | 'overconstrained'
  | 'insecure'
  | 'unsupported'
  | 'failed'

export interface CameraProblem {
  kind: CameraProblemKind
  message: string
  /** Tekst van de knop die de camera opnieuw start; null als opnieuw proberen niet helpt. */
  button: string | null
}

const RETRY = 'Opnieuw proberen'

function kindFor(errorName: string, permission: CameraPermission): CameraProblemKind {
  switch (errorName) {
    case 'NotAllowedError':
    case 'SecurityError':
      if (permission === 'denied') return 'blocked'
      if (permission === 'granted') return 'system'
      return 'ask'
    case 'NotReadableError':
    case 'TrackStartError':
    case 'AbortError':
      return 'busy'
    case 'NotFoundError':
      return 'missing'
    case 'OverconstrainedError':
      return 'overconstrained'
    case 'InsecureContextError':
      return 'insecure'
    case 'StreamApiNotSupportedError':
      return 'unsupported'
    default:
      return 'failed'
  }
}

const PROBLEMS: Record<CameraProblemKind, Omit<CameraProblem, 'kind'>> = {
  ask: {
    message: 'Geef de website toestemming om je camera te gebruiken. Daarna kun je scannen.',
    button: 'Camera aanzetten',
  },
  blocked: {
    message: 'De camera staat uit voor deze website. Tik op het slotje naast het webadres en zet Camera aan.',
    button: RETRY,
  },
  system: {
    message: 'Je browser mag de camera niet gebruiken. Zet de camera aan voor je browser in de instellingen van je telefoon.',
    button: RETRY,
  },
  busy: {
    message: 'De camera is al in gebruik door een andere app. Sluit die app en probeer het opnieuw.',
    button: RETRY,
  },
  missing: { message: 'We vinden geen camera op dit apparaat.', button: RETRY },
  overconstrained: { message: 'De achtercamera kan niet worden gestart.', button: RETRY },
  insecure: { message: 'De camera werkt alleen via een beveiligde verbinding (https).', button: null },
  unsupported: { message: 'Deze browser kan de camera niet gebruiken. Probeer Safari of Chrome.', button: null },
  failed: { message: 'De camera starten lukt niet. Probeer het opnieuw.', button: RETRY },
}

export function describeCameraProblem(errorName: string, permission: CameraPermission): CameraProblem {
  const kind = kindFor(errorName, permission)
  return { kind, ...PROBLEMS[kind] }
}

/**
 * Start de camera vanzelf opnieuw als iemand terugkomt in de app (na de instellingen of
 * het sluiten van een andere app). Niet bij 'ask': dan zou de app ongevraagd een
 * toestemmingsvraag tonen, en Chrome blokkeert na een paar keer wegklikken.
 */
export function retriesOnReturn(kind: CameraProblemKind): boolean {
  return kind !== 'ask' && PROBLEMS[kind].button !== null
}
