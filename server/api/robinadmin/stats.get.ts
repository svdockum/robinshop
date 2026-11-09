import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  requireAdminAccess(event)
  const { data, error } = await serverSupabaseServiceRole(event).rpc('admin_stats')
  if (error) dbError(error)
  return data
})
