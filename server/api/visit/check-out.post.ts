import { serverSupabaseServiceRole } from '#supabase/server'
import { verifyQrToken } from '../../utils/qrToken'

/** Afronden bij de kassa met de wisselende QR-code. */
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const body = await readBody<{ slug?: string, t?: string }>(event)
  const slug = String(body?.slug ?? '')
  const token = String(body?.t ?? '')
  const secret = requireQrSecret(event)
  const admin = serverSupabaseServiceRole(event)

  const { data: household } = await admin
    .from('households').select('id, name').eq('auth_user_id', userId).maybeSingle()
  if (!household) return { ok: false as const, error: 'NOT_MEMBER' as const }

  const { data: point } = await admin
    .from('scan_points').select('id, slug, interval_seconds').eq('slug', slug).eq('kind', 'checkout').maybeSingle()
  if (!point) return { ok: false as const, error: 'UNKNOWN_POINT' as const }

  if (!verifyQrToken(secret, point.slug, 'uit', token, point.interval_seconds)) {
    return { ok: false as const, error: 'EXPIRED_CODE' as const }
  }

  const { data, error } = await admin.rpc('finish_visit', { p_household: household.id, p_scan_point: point.id })
  if (error || !data) {
    throw createError({ statusCode: 500, statusMessage: 'Afronden lukt nu niet' })
  }
  const result = data as { ok: boolean, error?: string, visit_id?: string, items?: number, points?: number, balance?: Record<string, unknown> }
  if (!result.ok) return { ok: false as const, error: 'NO_VISIT' as const }
  return {
    ok: true as const,
    visitId: result.visit_id!,
    householdName: household.name,
    items: result.items ?? 0,
    points: result.points ?? 0,
    balance: result.balance,
  }
})
