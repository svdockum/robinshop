import { serverSupabaseServiceRole } from '#supabase/server'

/** Nieuwe displaysleutel: de oude displaylink werkt daarna niet meer. */
export default defineEventHandler(async (event) => {
  requireAdminAccess(event)
  const id = getRouterParam(event, 'id') ?? ''
  const { data, error } = await serverSupabaseServiceRole(event)
    .from('scan_points').update({ display_key: newRandomCode(24) }).eq('id', id)
    .select(ADMIN_TABLES.scan_points.select).single()
  if (error) dbError(error)
  return data
})
