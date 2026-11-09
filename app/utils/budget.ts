/** Zelfde regels als public.points_for_age in de database (eetpuntendocument). */
export function pointsForAge(age: number): number {
  if (!Number.isFinite(age)) return 0
  if (age >= 13) return 7280
  if (age >= 9) return 6240
  if (age >= 4) return 5200
  return 0
}

/** Jaarbudget: handmatig budget wint, anders de som per gezinslid. */
export function yearBudget(members: { age: number }[], override: number | null | undefined): number {
  if (override !== null && override !== undefined && Number.isFinite(override)) return override
  return members.reduce((sum, m) => sum + pointsForAge(m.age), 0)
}

/** Saldo vlak vóór een scan, zodat het zichtbaar naar het nieuwe saldo kan aftellen. */
export function balanceBeforeScan(r: { after: number, points: number, advanceUsed: boolean, advanceThisMonth: number }): number {
  return r.after + r.points - (r.advanceUsed ? r.advanceThisMonth : 0)
}
