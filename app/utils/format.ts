/** 31200 → "31.200" (Nederlandse notatie, zoals in de ontwerpen). */
export function formatPoints(n: number | null | undefined): string {
  const value = Math.round(Number(n ?? 0)) || 0
  const sign = value < 0 ? '-' : ''
  return sign + String(Math.abs(value)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/** 1 → "1 punt", 3 → "3 punten". */
export function pointsLabel(n: number | null | undefined): string {
  return `${formatPoints(n)} ${Math.abs(Number(n ?? 0)) === 1 ? 'punt' : 'punten'}`
}

/** "2 volwassenen · 3 kinderen (12, 8 en 5)" — volwassen vanaf 18 jaar. */
export function describeMembers(members: { age: number }[]): string {
  if (!members.length) return 'Nog geen gezinsleden'
  const adults = members.filter(m => m.age >= 18).length
  const kids = members.filter(m => m.age < 18).map(m => m.age).sort((a, b) => b - a)
  const parts: string[] = []
  if (adults) parts.push(`${adults} ${adults === 1 ? 'volwassene' : 'volwassenen'}`)
  if (kids.length) {
    const ages = kids.length === 1 ? `${kids[0]}` : `${kids.slice(0, -1).join(', ')} en ${kids.at(-1)}`
    parts.push(`${kids.length} ${kids.length === 1 ? 'kind' : 'kinderen'} (${ages})`)
  }
  return parts.join(' · ')
}

const MONTHS = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december']

export function monthName(date: Date = new Date()): string {
  return MONTHS[date.getMonth()]!
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam',
  }).format(new Date(iso))
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' }).format(new Date(iso))
}
