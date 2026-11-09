import { serverSupabaseServiceRole } from '#supabase/server'

/** Huishoudens met jaarbudget, saldo en pascode. */
export default defineEventHandler(async (event) => {
  requireAdminAccess(event)
  const { data, error } = await serverSupabaseServiceRole(event).rpc('admin_households')
  if (error) dbError(error)
  return data
})
