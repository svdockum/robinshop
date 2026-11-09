import { describe, expect, test } from 'vitest'
import { describeMembers, formatPoints, pointsLabel } from '~/utils/format'

describe('describeMembers', () => {
  test('gezin uit de ontwerpen', () => {
    expect(describeMembers([{ age: 41 }, { age: 43 }, { age: 12 }, { age: 8 }, { age: 5 }]))
      .toBe('2 volwassenen · 3 kinderen (12, 8 en 5)')
  })
  test('enkelvoud', () => {
    expect(describeMembers([{ age: 34 }])).toBe('1 volwassene')
    expect(describeMembers([{ age: 30 }, { age: 12 }])).toBe('1 volwassene · 1 kind (12)')
  })
  test('leeg', () => {
    expect(describeMembers([])).toBe('Nog geen gezinsleden')
  })
})

describe('formatPoints', () => {
  test('duizendtallen met een punt, zoals in de ontwerpen', () => {
    expect(formatPoints(31200)).toBe('31.200')
    expect(formatPoints(600)).toBe('600')
    expect(formatPoints(1234567)).toBe('1.234.567')
  })

  test('negatief en leeg', () => {
    expect(formatPoints(-1500)).toBe('-1.500')
    expect(formatPoints(null)).toBe('0')
    expect(formatPoints(undefined)).toBe('0')
  })
})

describe('pointsLabel', () => {
  test('enkelvoud en meervoud', () => {
    expect(pointsLabel(1)).toBe('1 punt')
    expect(pointsLabel(3)).toBe('3 punten')
    expect(pointsLabel(2600)).toBe('2.600 punten')
  })
})
