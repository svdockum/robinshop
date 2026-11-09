import { serverSupabaseServiceRole } from '#supabase/server'

/** Laatste bezoeken met huishouden en gescande producten. */
export default defineEventHandler(async (event) => {
  requireAdminAccess(event)
  const householdId = getQuery(event).household
  let query = serverSupabaseServiceRole(event)
    .from('visits')
    .select('id, started_at, ended_at, status, household:households(id, name), scans(id, points, quantity, created_at, removed_at, product:products(name, code))')
    .order('started_at', { ascending: false })
    .limit(100)
  if (typeof householdId === 'string' && householdId) query = query.eq('household_id', householdId)
  const { data, error } = await query
  if (error) dbError(error)
  return data
})
