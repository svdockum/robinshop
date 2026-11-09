import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  requireAdminAccess(event)
  const table = adminTable(getRouterParam(event, 'table'))
  const { select, order } = ADMIN_TABLES[table]
  const { data, error } = await serverSupabaseServiceRole(event).from(table).select(select).order(order)
  if (error) dbError(error)
  return data
})
