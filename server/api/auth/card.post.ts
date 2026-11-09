import { serverSupabaseServiceRole } from '#supabase/server'

/**
 * Inloggen met de ledenpas (voorloper van de NFC-pas). De pas bevat een geheime code;
 * de server maakt een eenmalig inlogtoken dat de browser met verifyOtp inwisselt.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ code?: string }>(event)
  const code = String(body?.code ?? '').trim()
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(code)) {
    throw createError({ statusCode: 400, statusMessage: 'Deze pas kennen we niet' })
  }

  const admin = serverSupabaseServiceRole(event)
  const { data: household } = await admin
    .from('households')
    .select('id, name, email, auth_user_id')
    .eq('card_code', code)
    .maybeSingle()
  if (!household) {
    throw createError({ statusCode: 404, statusMessage: 'Deze pas kennen we niet' })
  }

  // Bij inloggen niets aan het e-mailadres veranderen; dat doet alleen het beheer.
  const { email } = await ensureHouseholdUser(event, household, { syncEmail: false })
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  const tokenHash = data?.properties?.hashed_token
  if (error || !tokenHash) {
    throw createError({ statusCode: 500, statusMessage: 'Inloggen met de pas lukt nu niet' })
  }
  return { tokenHash, householdName: household.name }
})
