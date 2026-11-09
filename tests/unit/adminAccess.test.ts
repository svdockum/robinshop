import { describe, expect, test } from 'vitest'
import { adminAccessAllowed } from '~~/server/utils/adminAccess'

describe('toegang tot /robinadmin', () => {
  test('zonder ingesteld wachtwoord staat het beheer open', () => {
    expect(adminAccessAllowed('', undefined)).toBe(true)
    expect(adminAccessAllowed('', 'iets')).toBe(true)
  })
  test('met wachtwoord: alleen het juiste wachtwoord', () => {
    expect(adminAccessAllowed('geheim-123', 'geheim-123')).toBe(true)
    expect(adminAccessAllowed('geheim-123', 'geheim-124')).toBe(false)
    expect(adminAccessAllowed('geheim-123', '')).toBe(false)
    expect(adminAccessAllowed('geheim-123', undefined)).toBe(false)
  })
})
