import { serverSupabaseServiceRole } from '#supabase/server'

/**
 * Nieuwe pascode: de oude ledenpas werkt daarna niet meer, en telefoons die
 * ermee ingelogd waren worden uitgelogd.
 */
export default defineEventHandler(async (event) => {
  requireAdminAccess(event)
  const id = getRouterParam(event, 'id') ?? ''
  const db = serverSupabaseServiceRole(event)
  const { data, error } = await db
    .from('households').update({ card_code: newRandomCode(20) }).eq('id', id).select('card_code').single()
  if (error) dbError(error)
  const { data: revoked, error: revokeError } = await db.rpc('revoke_household_sessions', { p_household: id })
  if (revokeError) throw createError({ statusCode: 500, statusMessage: 'Nieuwe pascode gemaakt, maar uitloggen van telefoons lukte niet' })
  return { card_code: data.card_code, revokedSessions: revoked ?? 0 }
})
