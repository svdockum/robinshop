import { serverSupabaseServiceRole } from '#supabase/server'

/** Huishouden bijwerken; de gezinsleden worden vervangen door de nieuwe lijst. */
export default defineEventHandler(async (event) => {
  requireAdminAccess(event)
  const id = getRouterParam(event, 'id') ?? ''
  const { members, ...fields } = readHouseholdInput(await readBody(event))
  const db = serverSupabaseServiceRole(event)

  const { data: current } = await db.from('households').select('id, auth_user_id').eq('id', id).maybeSingle()
  if (!current) throw createError({ statusCode: 404, statusMessage: 'Huishouden niet gevonden' })

  // Eerst het account bijwerken: lukt dat niet (e-mail al in gebruik), dan verandert er niets.
  await ensureHouseholdUser(event, { id, name: fields.name, email: fields.email, auth_user_id: current.auth_user_id })

  const { error } = await db.from('households').update(fields).eq('id', id)
  if (error) dbError(error)

  const { error: deleteError } = await db.from('household_members').delete().eq('household_id', id)
  if (deleteError) dbError(deleteError)
  if (members.length) {
    const { error: memberError } = await db.from('household_members')
      .insert(members.map(m => ({ ...m, household_id: id })))
    if (memberError) dbError(memberError)
  }
  return { id }
})
