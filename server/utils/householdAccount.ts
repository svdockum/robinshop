import type { H3Event } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

export interface HouseholdAccountRow {
  id: string
  name: string
  email: string | null
  auth_user_id: string | null
}

/** Intern adres voor huishoudens zonder e-mail; zij loggen alleen in met hun ledenpas. */
export function placeholderEmail(householdId: string): string {
  return `hh-${householdId}@leden.robin.invalid`
}

/**
 * Zorgt dat het huishouden precies één Supabase-account heeft met het juiste e-mailadres.
 * Er wordt geen e-mail verstuurd; inloggen gaat via de pas of een zelf aangevraagde inloglink.
 */
export async function ensureHouseholdUser(event: H3Event, hh: HouseholdAccountRow): Promise<{ userId: string, email: string }> {
  const admin = serverSupabaseServiceRole(event)
  const email = hh.email?.trim().toLowerCase() || placeholderEmail(hh.id)

  if (hh.auth_user_id) {
    const { data } = await admin.auth.admin.getUserById(hh.auth_user_id)
    if (data?.user) {
      if (data.user.email !== email) {
        const { error } = await admin.auth.admin.updateUserById(hh.auth_user_id, { email, email_confirm: true })
        if (error) {
          throw createError({ statusCode: 409, statusMessage: `E-mailadres kan niet worden gebruikt: ${error.message}` })
        }
      }
      return { userId: hh.auth_user_id, email }
    }
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { household_id: hh.id, household_name: hh.name },
  })
  if (error || !data.user) {
    throw createError({ statusCode: 409, statusMessage: `Account aanmaken lukt niet: ${error?.message ?? 'onbekende fout'}` })
  }

  const { error: linkError } = await admin.from('households').update({ auth_user_id: data.user.id }).eq('id', hh.id)
  if (linkError) {
    await admin.auth.admin.deleteUser(data.user.id)
    throw createError({ statusCode: 500, statusMessage: 'Account koppelen lukt niet' })
  }
  return { userId: data.user.id, email }
}
