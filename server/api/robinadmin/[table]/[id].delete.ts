import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  requireAdminAccess(event)
  const table = adminTable(getRouterParam(event, 'table'))
  const id = getRouterParam(event, 'id') ?? ''
  const { error } = await serverSupabaseServiceRole(event).from(table).delete().eq('id', id)
  if (error) dbError(error)
  return { ok: true }
})
