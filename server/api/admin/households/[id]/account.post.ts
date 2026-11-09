import { serverSupabaseServiceRole } from '#supabase/server'

/** Maakt of actualiseert het account van een huishouden (na opslaan in beheer). */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id') ?? ''
  const admin = serverSupabaseServiceRole(event)
  const { data: household } = await admin
    .from('households').select('id, name, email, auth_user_id').eq('id', id).maybeSingle()
  if (!household) {
    throw createError({ statusCode: 404, statusMessage: 'Huishouden niet gevonden' })
  }
  return await ensureHouseholdUser(event, household)
})
