import { describe, expect, test } from 'vitest'
import { pointsForAge, yearBudget } from '~/utils/budget'

describe('budget (gelijk aan de database)', () => {
  test('punten per leeftijd', () => {
    expect([40, 13, 12, 9, 8, 4, 3, 0].map(pointsForAge)).toEqual([7280, 7280, 6240, 6240, 5200, 5200, 0, 0])
  })
  test('jaarbudget uit gezinsleden', () => {
    expect(yearBudget([{ age: 41 }, { age: 43 }, { age: 12 }, { age: 8 }, { age: 5 }], null)).toBe(31200)
  })
  test('handmatig budget wint, ook 0', () => {
    expect(yearBudget([{ age: 41 }], 12000)).toBe(12000)
    expect(yearBudget([{ age: 41 }], 0)).toBe(0)
  })
  test('lege of ongeldige leeftijd telt niet', () => {
    expect(yearBudget([{ age: Number.NaN }], null)).toBe(0)
  })
})

describe('balanceBeforeScan (waar het saldo vanaf telt)', () => {
  test('gewone scan: saldo + punten', async () => {
    const { balanceBeforeScan } = await import('~/utils/budget')
    expect(balanceBeforeScan({ after: 28585, points: 1, advanceUsed: false, advanceThisMonth: 0 })).toBe(28586)
  })
  test('scan met voorschot: het voorschot hoorde er vóór de scan nog niet bij', async () => {
    const { balanceBeforeScan } = await import('~/utils/budget')
    expect(balanceBeforeScan({ after: 4, points: 5, advanceUsed: true, advanceThisMonth: 8 })).toBe(1)
  })
})
