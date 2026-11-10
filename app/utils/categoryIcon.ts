import type { IconName } from '~/components/RIcon.vue'

/** Trefwoord in de categorienaam → icoon. Volgorde bepaalt welk icoon vooraan staat. */
const RULES: [RegExp, IconName][] = [
  [/groente/, 'carrot'],
  [/fruit/, 'apple'],
  [/zuivel|melk|kaas|yoghurt/, 'milk'],
  [/graan|meel|pasta|rijst|havermout/, 'wheat'],
  [/graan|brood/, 'bread'],
  [/plantaardig|peulvrucht|bonen|linzen|noten/, 'bean'],
  [/plantaardig/, 'leaf'],
]

/**
 * Iconen bij een categorie, zodat je zonder lezen ziet om welk eten het gaat:
 * "Groente & fruit" → wortel + appel. Onbekende categorie → bestek.
 */
export function categoryIcons(name: string): IconName[] {
  const n = name.toLowerCase()
  const icons = RULES.filter(([match]) => match.test(n)).map(([, icon]) => icon)
  return icons.length ? [...new Set(icons)].slice(0, 2) : ['utensils']
}
