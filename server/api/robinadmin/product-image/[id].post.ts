import { serverSupabaseServiceRole } from '#supabase/server'

const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
const MAX_BYTES = 5 * 1024 * 1024

/** Productfoto uploaden naar Supabase Storage en koppelen aan het product. */
export default defineEventHandler(async (event) => {
  requireAdminAccess(event)
  const id = getRouterParam(event, 'id') ?? ''
  const parts = await readMultipartFormData(event)
  const file = parts?.find(p => p.name === 'file' && p.data?.length)
  if (!file) throw createError({ statusCode: 400, statusMessage: 'Kies een foto' })
  const ext = TYPES[file.type ?? '']
  if (!ext) throw createError({ statusCode: 400, statusMessage: 'Alleen JPG, PNG of WebP' })
  if (file.data.length > MAX_BYTES) throw createError({ statusCode: 400, statusMessage: 'De foto is groter dan 5 MB' })

  const db = serverSupabaseServiceRole(event)
  const path = `${id}/${Date.now()}.${ext}`
  const { error: uploadError } = await db.storage.from('product-images').upload(path, file.data, { contentType: file.type, upsert: true })
  if (uploadError) throw createError({ statusCode: 500, statusMessage: `Uploaden lukt niet: ${uploadError.message}` })

  const imageUrl = db.storage.from('product-images').getPublicUrl(path).data.publicUrl
  const { data, error } = await db.from('products').update({ image_url: imageUrl }).eq('id', id)
    .select(ADMIN_TABLES.products.select).single()
  if (error) dbError(error)
  return data
})
