// Basisgegevens voor een nieuwe (cloud)omgeving: categorieën, testproducten en scanpunten.
// Geen demo-huishoudens en willekeurige displaysleutels, dus veilig voor productie.
// Kan vaker draaien: bestaande codes en scanpunten blijven ongemoeid.
// Gebruik: node scripts/seed-base.mjs            (leest .env)
//          node scripts/seed-base.mjs .env.local
import { existsSync } from 'node:fs'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'

const envFile = process.argv[2] ?? '.env'
if (existsSync(envFile)) process.loadEnvFile(envFile)

const url = process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.NUXT_SUPABASE_SECRET_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error(`SUPABASE_URL en SUPABASE_SECRET_KEY ontbreken in ${envFile}.`)
  process.exit(1)
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

const CATEGORIES = [
  { name: 'Groente & fruit', color: '#115656', sort: 1 },
  { name: 'Zuivel', color: '#fd644e', sort: 2 },
  { name: 'Graanproducten', color: '#115656', sort: 3 },
  { name: 'Overige plantaardig', color: '#fd644e', sort: 4 },
]

const PRODUCTS = [
  ['PREI', 'Prei', 'Groente & fruit', 'vers', 1, '1 stuk', null],
  ['APPELS', 'Appels', 'Groente & fruit', 'vers', 2, '1 stuk', null],
  ['AARDAPPELS', 'Aardappels', 'Groente & fruit', 'vers', 3, '1 kilo', null],
  ['POMPOEN', 'Pompoen', 'Groente & fruit', 'vers', 4, '1 stuk', 2],
  ['BROOD', 'Robin brood', 'Graanproducten', 'vers', 10, '1 brood', null],
  ['MELK', 'Melk', 'Zuivel', 'koel', 7, '1 liter', null],
  ['YOGHURT', 'Yoghurt', 'Zuivel', 'koel', 5, '500 gram', null],
  ['HAVERMOUT', 'Havermout', 'Graanproducten', 'houdbaar', 3, '1 schep', null],
  ['LINZEN', 'Linzen', 'Overige plantaardig', 'houdbaar', 3, '1 schep', null],
]

const SCAN_POINTS = [
  { slug: 'ingang', name: 'Ingang (poortje)', kind: 'entrance', interval_seconds: 60 },
  { slug: 'kassa', name: 'Kassa', kind: 'checkout', interval_seconds: 60 },
]

function check(error, what) {
  if (error) {
    console.error(`${what} mislukt: ${error.message}`)
    process.exit(1)
  }
}

const { data: existingCats, error: catError } = await db.from('categories').select('id, name')
check(catError, 'Categorieën lezen')
const catIds = Object.fromEntries(existingCats.map(c => [c.name, c.id]))
for (const cat of CATEGORIES) {
  if (catIds[cat.name]) continue
  const { data, error } = await db.from('categories').insert(cat).select('id').single()
  check(error, `Categorie ${cat.name}`)
  catIds[cat.name] = data.id
}

const rows = PRODUCTS.map(([code, name, cat, storage, points, portion, max]) => ({
  code, name, category_id: catIds[cat], storage, points, portion, max_per_visit: max,
}))
const { error: productError } = await db.from('products').upsert(rows, { onConflict: 'code', ignoreDuplicates: true })
check(productError, 'Producten')

const { error: pointError } = await db.from('scan_points').upsert(SCAN_POINTS, { onConflict: 'slug', ignoreDuplicates: true })
check(pointError, 'Scanpunten')

const { count } = await db.from('products').select('*', { count: 'exact', head: true })
console.log(`Klaar: ${CATEGORIES.length} categorieën, ${count} producten, scanpunten ingang en kassa.`)
console.log('De display-links (met sleutel) staan in het beheer onder Scanpunten.')
