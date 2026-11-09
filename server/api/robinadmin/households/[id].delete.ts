import { serverSupabaseServiceRole } from '#supabase/server'

/** Verwijdert een huishouden inclusief account, bezoeken en registraties. */
export default defineEventHandler(async (event) => {
  requireAdminAccess(event)
  const id = getRouterParam(event, 'id') ?? ''
  const db = serverSupabaseServiceRole(event)
  const { data: household } = await db.from('households').select('id, auth_user_id').eq('id', id).maybeSingle()
  if (!household) throw createError({ statusCode: 404, statusMessage: 'Huishouden niet gevonden' })

  const { error } = await db.from('households').delete().eq('id', id)
  if (error) dbError(error)
  if (household.auth_user_id) await db.auth.admin.deleteUser(household.auth_user_id)
  return { ok: true }
})
