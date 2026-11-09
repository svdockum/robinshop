import { timingSafeEqual } from 'node:crypto'
import { serverSupabaseServiceRole } from '#supabase/server'
import { currentWindow, signQrToken } from '../../utils/qrToken'

function sameKey(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/**
 * Wisselende QR-code voor het scherm bij ingang of kassa, plus recente gebeurtenissen
 * ("Welkom, familie X!"). Beveiligd met de displaysleutel uit de URL.
 */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') ?? ''
  const query = getQuery(event)
  const key = String(query.key ?? '')
  const since = Number(query.since) || 0

  const admin = serverSupabaseServiceRole(event)
  const { data: point } = await admin
    .from('scan_points')
    .select('id, slug, name, kind, interval_seconds, display_key')
    .eq('slug', slug)
    .maybeSingle()

  if (!point) {
    throw createError({ statusCode: 404, statusMessage: 'Dit scanpunt bestaat niet' })
  }
  if (!sameKey(key, point.display_key)) {
    throw createError({ statusCode: 401, statusMessage: 'Verkeerde displaysleutel' })
  }

  const secret = requireQrSecret(event)
  const kind = point.kind === 'entrance' ? 'in' : 'uit'
  const now = Date.now()
  const window = currentWindow(point.interval_seconds, now)
  const token = signQrToken(secret, point.slug, kind, window)

  const { data: events } = await admin
    .from('display_events')
    .select('id, kind, title, detail, created_at')
    .eq('scan_point_id', point.id)
    .gt('id', since)
    .gte('created_at', new Date(now - 30_000).toISOString())
    .order('id')

  setHeader(event, 'cache-control', 'no-store')
  return {
    kind,
    name: point.name,
    url: `${siteBase(event)}/${kind}/${point.slug}?t=${token}`,
    expiresAt: (window + 1) * point.interval_seconds * 1000,
    serverNow: now,
    intervalSeconds: point.interval_seconds,
    events: events ?? [],
  }
})
