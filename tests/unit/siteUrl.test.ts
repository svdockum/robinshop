import { describe, expect, test } from 'vitest'
import { normalizeSiteUrl } from '~~/shared/utils/siteUrl'

describe('normalizeSiteUrl', () => {
  test('zet https:// voor een kale domeinnaam', () => {
    expect(normalizeSiteUrl('robinshop-nu.vercel.app')).toBe('https://robinshop-nu.vercel.app')
  })

  test('laat een volledige URL staan en haalt de slash weg', () => {
    expect(normalizeSiteUrl('https://robinshop.nl/')).toBe('https://robinshop.nl')
    expect(normalizeSiteUrl('http://localhost:3000')).toBe('http://localhost:3000')
  })

  test('leeg blijft leeg', () => {
    expect(normalizeSiteUrl('')).toBe('')
    expect(normalizeSiteUrl(undefined)).toBe('')
    expect(normalizeSiteUrl('  ')).toBe('')
  })
})
