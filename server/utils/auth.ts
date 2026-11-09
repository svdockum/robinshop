import type { H3Event } from 'h3'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

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

/** Alleen beheerders; anders 401/403. */
export async function requireAdmin(event: H3Event): Promise<string> {
  const userId = await requireUserId(event)
  const admin = serverSupabaseServiceRole(event)
  const { data } = await admin.from('admins').select('user_id').eq('user_id', userId).maybeSingle()
  if (!data) {
    throw createError({ statusCode: 403, statusMessage: 'Alleen voor beheerders' })
  }
  return userId
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
  const configured = useRuntimeConfig(event).public.siteUrl
  return (configured || getRequestURL(event).origin).replace(/\/+$/, '')
}
