import { serverSupabaseServiceRole } from '#supabase/server'

/** Verwijdert een huishouden inclusief het account, bezoeken en registraties. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id') ?? ''
  const admin = serverSupabaseServiceRole(event)
  const { data: household } = await admin
    .from('households').select('id, auth_user_id').eq('id', id).maybeSingle()
  if (!household) {
    throw createError({ statusCode: 404, statusMessage: 'Huishouden niet gevonden' })
  }
  const { error } = await admin.from('households').delete().eq('id', id)
  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Verwijderen lukt niet' })
  }
  if (household.auth_user_id) {
    await admin.auth.admin.deleteUser(household.auth_user_id)
  }
  return { ok: true }
})
