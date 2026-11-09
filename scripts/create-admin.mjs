// Maakt een beheerder aan (of zet het wachtwoord opnieuw).
// Gebruik: node scripts/create-admin.mjs <email> <wachtwoord>
// Leest SUPABASE_URL en SUPABASE_SECRET_KEY uit .env of de omgeving.
import { existsSync } from 'node:fs'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'

if (existsSync('.env')) process.loadEnvFile('.env')

const [email, password] = process.argv.slice(2)
if (!email || !password || password.length < 8) {
  console.error('Gebruik: node scripts/create-admin.mjs <email> <wachtwoord (min. 8 tekens)>')
  process.exit(1)
}

const url = process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.NUXT_SUPABASE_SECRET_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('SUPABASE_URL en SUPABASE_SECRET_KEY ontbreken (zie .env.example).')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

let userId
const { data: created, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true })
if (created?.user) {
  userId = created.user.id
}
else {
  // Bestaat al: zoek op en zet het wachtwoord.
  let page = 1
  while (!userId) {
    const { data: list, error: listError } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (listError) throw listError
    const found = list.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (found) userId = found.id
    if (list.users.length < 200) break
    page++
  }
  if (!userId) {
    console.error('Aanmaken mislukt:', error?.message)
    process.exit(1)
  }
  await supabase.auth.admin.updateUserById(userId, { password, email_confirm: true })
}

const { error: adminError } = await supabase.from('admins').upsert({ user_id: userId })
if (adminError) {
  console.error('Beheerdersrechten geven mislukt:', adminError.message)
  process.exit(1)
}
console.log(`Beheerder klaar: ${email}`)
