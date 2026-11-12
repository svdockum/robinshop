import type { H3Event } from 'h3'
import { serverSupabaseUser } from '#supabase/server'

/** Id van de ingelogde gebruiker, of 401. */
export async function requireUserId(event: H3Event): Promise<string> {
  let sub: string | undefined
  try {
    const claims = await serverSupabaseUser(event)
    sub = claims?.sub
  }
  catch {
    sub = undefined
  }
  if (!sub) {
    throw createError({ statusCode: 401, statusMessage: 'Log eerst in' })
  }
  return sub
}

/** Geheim voor de wisselende QR-codes; zonder geheim werkt in- en uitchecken niet. */
export function requireQrSecret(event: H3Event): string {
  const secret = useRuntimeConfig(event).qrSecret
  if (!secret) {
    throw createError({ statusCode: 500, statusMessage: 'NUXT_QR_SECRET is niet ingesteld' })
  }
  return secret
}

/** Basis-URL voor QR-codes op schermen: ingestelde site-URL of de huidige host. */
export function siteBase(event: H3Event): string {
  const configured = normalizeSiteUrl(useRuntimeConfig(event).public.siteUrl as string)
  return configured || getRequestURL(event).origin.replace(/\/+$/, '')
}
