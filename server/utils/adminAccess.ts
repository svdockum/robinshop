import { timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

/**
 * /robinadmin staat voorlopig open (wens van Robin voor het prototype).
 * Zet NUXT_ADMIN_PASSWORD om het af te schermen; de beheerpagina vraagt dan om het wachtwoord.
 */
export function adminAccessAllowed(password: string, given: string | undefined): boolean {
  if (!password) return true
  const a = Buffer.from(given ?? '')
  const b = Buffer.from(password)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function requireAdminAccess(event: H3Event): void {
  const password = String(useRuntimeConfig(event).adminPassword ?? '')
  if (!adminAccessAllowed(password, getHeader(event, 'x-robin-admin'))) {
    throw createError({ statusCode: 401, statusMessage: 'Wachtwoord voor beheer nodig' })
  }
}
