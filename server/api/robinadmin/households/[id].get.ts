import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  requireAdminAccess(event)
  const id = getRouterParam(event, 'id') ?? ''
  const db = serverSupabaseServiceRole(event)
  const { data: household, error } = await db
    .from('households')
    .select('id, name, email, start_month, budget_override, notes, card_code, auth_user_id, created_at, members:household_members(id, name, age)')
    .eq('id', id)
    .maybeSingle()
  if (error) dbError(error)
  if (!household) throw createError({ statusCode: 404, statusMessage: 'Huishouden niet gevonden' })

  const { data: balance } = await db.rpc('household_balance', { h: id })
  return { ...household, members: [...household.members].sort((a, b) => b.age - a.age), balance }
})
