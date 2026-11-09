import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  requireAdminAccess(event)
  const table = adminTable(getRouterParam(event, 'table'))
  const id = getRouterParam(event, 'id') ?? ''
  const values = pickColumns(table, (await readBody(event)) ?? {})
  const { data, error } = await serverSupabaseServiceRole(event)
    .from(table).update(values as never).eq('id', id).select(ADMIN_TABLES[table].select).single()
  if (error) dbError(error)
  return data
})
