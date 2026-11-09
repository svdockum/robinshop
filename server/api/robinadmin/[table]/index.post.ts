import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  requireAdminAccess(event)
  const table = adminTable(getRouterParam(event, 'table'))
  const values = pickColumns(table, (await readBody(event)) ?? {})
  const { data, error } = await serverSupabaseServiceRole(event)
    .from(table).insert(values as never).select(ADMIN_TABLES[table].select).single()
  if (error) dbError(error)
  return data
})
