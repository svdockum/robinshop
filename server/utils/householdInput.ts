export interface HouseholdInput {
  name: string
  email: string | null
  start_month: string
  budget_override: number | null
  notes: string | null
  members: { name: string | null, age: number }[]
}

/** Controleert en normaliseert het formulier voor een huishouden. */
export function readHouseholdInput(body: Record<string, unknown> | null | undefined): HouseholdInput {
  const b = body ?? {}
  const name = String(b.name ?? '').trim()
  if (!name) throw createError({ statusCode: 400, statusMessage: 'Vul een naam in' })

  const email = String(b.email ?? '').trim().toLowerCase() || null
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Dit e-mailadres klopt niet' })
  }

  const month = String(b.start_month ?? '').slice(0, 7)
  if (!/^\d{4}-\d{2}$/.test(month)) throw createError({ statusCode: 400, statusMessage: 'Kies een startmaand' })

  const rawOverride = b.budget_override
  const override = rawOverride === null || rawOverride === '' || rawOverride === undefined ? null : Number(rawOverride)
  if (override !== null && (!Number.isInteger(override) || override < 0)) {
    throw createError({ statusCode: 400, statusMessage: 'Het jaarbudget moet een heel getal van 0 of meer zijn' })
  }

  const members = (Array.isArray(b.members) ? b.members : []) as { name?: unknown, age?: unknown }[]
  const cleanMembers = members.map((m) => {
    const age = Number(m?.age)
    if (m?.age === '' || m?.age === null || !Number.isInteger(age) || age < 0 || age > 120) {
      throw createError({ statusCode: 400, statusMessage: 'Vul bij elk gezinslid een leeftijd in (0–120)' })
    }
    return { name: String(m?.name ?? '').trim() || null, age }
  })

  return {
    name,
    email,
    start_month: `${month}-01`,
    budget_override: override,
    notes: String(b.notes ?? '').trim() || null,
    members: cleanMembers,
  }
}
