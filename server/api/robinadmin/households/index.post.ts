import { serverSupabaseServiceRole } from '#supabase/server'

/** Nieuw huishouden met gezinsleden en account (voor pas-login en inloglink). */
export default defineEventHandler(async (event) => {
  requireAdminAccess(event)
  const { members, ...fields } = readHouseholdInput(await readBody(event))
  const db = serverSupabaseServiceRole(event)

  const { data: household, error } = await db.from('households').insert(fields)
    .select('id, name, email, auth_user_id').single()
  if (error) dbError(error)

  try {
    if (members.length) {
      const { error: memberError } = await db.from('household_members')
        .insert(members.map(m => ({ ...m, household_id: household.id })))
      if (memberError) dbError(memberError)
    }
    await ensureHouseholdUser(event, household)
  }
  catch (e) {
    // Niets half laten staan: zonder account kan de pas niet inloggen.
    await db.from('households').delete().eq('id', household.id)
    throw e
  }
  return { id: household.id }
})
