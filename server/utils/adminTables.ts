import { randomBytes } from 'node:crypto'

/** Tabellen die /robinadmin direct mag lezen en schrijven, met de toegestane kolommen. */
export const ADMIN_TABLES = {
  products: {
    select: 'id, code, name, category_id, storage, points, portion, max_per_visit, image_url, active, created_at',
    order: 'name',
    columns: ['code', 'name', 'category_id', 'storage', 'points', 'portion', 'max_per_visit', 'image_url', 'active'],
  },
  categories: {
    select: 'id, name, color, sort',
    order: 'sort',
    columns: ['name', 'color', 'sort'],
  },
  scan_points: {
    select: 'id, slug, name, kind, interval_seconds, display_key',
    order: 'slug',
    columns: ['slug', 'name', 'kind', 'interval_seconds'],
  },
} as const

export type AdminTable = keyof typeof ADMIN_TABLES

export function adminTable(name: string | undefined): AdminTable {
  if (!name || !(name in ADMIN_TABLES)) {
    throw createError({ statusCode: 404, statusMessage: 'Onbekende lijst' })
  }
  return name as AdminTable
}

/** Alleen toegestane kolommen; lege strings worden null; productcodes in hoofdletters. */
export function pickColumns(table: AdminTable, body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const col of ADMIN_TABLES[table].columns) {
    if (!(col in body)) continue
    let value = body[col]
    if (typeof value === 'string') value = value.trim()
    if (value === '') value = null
    if (col === 'code' && typeof value === 'string') value = value.toUpperCase()
    if (col === 'slug' && typeof value === 'string') value = value.toLowerCase()
    out[col] = value
  }
  return out
}

/** Postgres-fouten vertalen naar begrijpelijke meldingen. */
export function dbError(error: { code?: string, message?: string } | null): never {
  const messages: Record<string, string> = {
    '23505': 'Deze code of naam bestaat al.',
    '23514': 'Een van de waarden klopt niet (bijv. code alleen A-Z, 0-9 en streepjes, punten 1–999).',
    '23503': 'Dit wordt nog gebruikt (er zijn registraties). Zet het op inactief in plaats van verwijderen.',
    '23502': 'Vul alle verplichte velden in.',
    '22P02': 'Een van de waarden heeft een verkeerd formaat.',
  }
  throw createError({
    statusCode: 400,
    statusMessage: messages[error?.code ?? ''] ?? `Opslaan lukt niet: ${error?.message ?? 'onbekende fout'}`,
  })
}

export function newRandomCode(length = 20): string {
  return randomBytes(Math.ceil((length * 3) / 4)).toString('base64url').slice(0, length)
}
