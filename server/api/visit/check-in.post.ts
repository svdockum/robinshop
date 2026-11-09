import { serverSupabaseServiceRole } from '#supabase/server'
import { verifyQrToken } from '../../utils/qrToken'

/** Inchecken bij het poortje met de wisselende QR-code. */
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
    .from('scan_points').select('id, slug, interval_seconds').eq('slug', slug).eq('kind', 'entrance').maybeSingle()
  if (!point) return { ok: false as const, error: 'UNKNOWN_POINT' as const }

  if (!verifyQrToken(secret, point.slug, 'in', token, point.interval_seconds)) {
    return { ok: false as const, error: 'EXPIRED_CODE' as const }
  }

  const { data, error } = await admin.rpc('start_visit', {
    p_household: household.id,
    p_scan_point: point.id,
    p_user: userId,
  })
  if (error || !data) {
    throw createError({ statusCode: 500, statusMessage: 'Inchecken lukt nu niet' })
  }
  const result = data as { ok: boolean, already: boolean, visit_id: string }
  return {
    ok: true as const,
    already: result.already,
    visitId: result.visit_id,
    householdName: household.name,
  }
})
