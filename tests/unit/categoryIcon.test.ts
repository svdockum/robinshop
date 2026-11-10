import { describe, expect, test } from 'vitest'
import { categoryIcons } from '~/utils/categoryIcon'

describe('categoryIcons (beeld in plaats van de categorienaam)', () => {
  test('de vier categorieën van Robin', () => {
    expect(categoryIcons('Groente & fruit')).toEqual(['carrot', 'apple'])
    expect(categoryIcons('Zuivel')).toEqual(['milk'])
    expect(categoryIcons('Graanproducten')).toEqual(['wheat', 'bread'])
    expect(categoryIcons('Overige plantaardig')).toEqual(['bean', 'leaf'])
  })

  test('alleen groente of alleen fruit krijgt één icoon', () => {
    expect(categoryIcons('Groente')).toEqual(['carrot'])
    expect(categoryIcons('Vers fruit')).toEqual(['apple'])
  })

  test('hoofdletters maken niet uit', () => {
    expect(categoryIcons('ZUIVEL')).toEqual(['milk'])
  })

  test('onbekende categorie valt terug op bestek', () => {
    expect(categoryIcons('Testcategorie')).toEqual(['utensils'])
    expect(categoryIcons('')).toEqual(['utensils'])
  })

  test('nooit meer dan twee iconen', () => {
    expect(categoryIcons('Groente, fruit, zuivel en brood').length).toBe(2)
  })
})
