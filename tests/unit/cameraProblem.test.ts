import { describe, expect, test } from 'vitest'
import { describeCameraProblem, retriesOnReturn } from '~/utils/cameraProblem'

describe('describeCameraProblem (welke melding en knop bij een camerafout)', () => {
  test('nog niet gevraagd of weggeklikt: knop vraagt opnieuw om toestemming', () => {
    const p = describeCameraProblem('NotAllowedError', 'prompt')
    expect(p.kind).toBe('ask')
    expect(p.button).toBe('Camera aanzetten')
  })

  test('toestemmingsstand onbekend (oude browser) gedraagt zich als vragen', () => {
    expect(describeCameraProblem('NotAllowedError', 'unknown').kind).toBe('ask')
  })

  test('geblokkeerd voor de site: uitleg waar je hem weer aanzet', () => {
    const p = describeCameraProblem('NotAllowedError', 'denied')
    expect(p.kind).toBe('blocked')
    expect(p.message).toMatch(/slotje/)
    expect(p.button).toBe('Opnieuw proberen')
  })

  test('site mag wel, maar de telefoon blokkeert de browser', () => {
    const p = describeCameraProblem('NotAllowedError', 'granted')
    expect(p.kind).toBe('system')
    expect(p.message).toMatch(/instellingen van je telefoon/)
  })

  test('camera kan niet starten', () => {
    expect(describeCameraProblem('NotReadableError', 'granted').kind).toBe('busy')
  })

  test('zonder https of zonder camera-ondersteuning helpt opnieuw proberen niet', () => {
    expect(describeCameraProblem('InsecureContextError', 'unknown').button).toBeNull()
    expect(describeCameraProblem('StreamApiNotSupportedError', 'unknown').button).toBeNull()
  })

  test('onbekende fout: algemene melding met knop', () => {
    const p = describeCameraProblem('SomethingElse', 'granted')
    expect(p.kind).toBe('failed')
    expect(p.button).toBe('Opnieuw proberen')
  })
})

describe('retriesOnReturn (opnieuw starten als je terugkomt in de app)', () => {
  test('na instellingen aanpassen of een andere app sluiten: ja', () => {
    expect(retriesOnReturn('blocked')).toBe(true)
    expect(retriesOnReturn('system')).toBe(true)
    expect(retriesOnReturn('busy')).toBe(true)
  })

  test('niet zelf een toestemmingsvraag opdringen', () => {
    expect(retriesOnReturn('ask')).toBe(false)
  })

  test('niet als opnieuw proberen toch niet kan helpen', () => {
    expect(retriesOnReturn('insecure')).toBe(false)
    expect(retriesOnReturn('unsupported')).toBe(false)
  })
})
