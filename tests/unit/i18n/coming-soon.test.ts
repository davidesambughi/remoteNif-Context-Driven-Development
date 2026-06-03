import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ---------------------------------------------------------------------------
// i18n key existence tests — Feature 24: Coming Soon Section
//
// Verifies that every home.comingSoon.* key added in Feature 24 exists in all
// 4 locale files with a non-empty string value. A missing or empty key causes
// next-intl to throw or silently render nothing for that card at runtime.
// ---------------------------------------------------------------------------

type LocaleJson = Record<string, unknown>

function loadLocale(locale: string): LocaleJson {
  const path = resolve(process.cwd(), 'messages', `${locale}.json`)
  return JSON.parse(readFileSync(path, 'utf-8')) as LocaleJson
}

function getNestedValue(obj: LocaleJson, dotPath: string): unknown {
  return dotPath.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
    return undefined
  }, obj)
}

const LOCALES = ['en', 'fr', 'es', 'de'] as const

// All keys under home.comingSoon — section header, badge, accessibility labels,
// and 3 keys per card × 6 cards
const COMING_SOON_KEYS = [
  'home.comingSoon.titleBefore',
  'home.comingSoon.titleHighlight',
  'home.comingSoon.subtitle',
  'home.comingSoon.badge',
  'home.comingSoon.dotsAriaLabel',
  'home.comingSoon.slideAriaLabel',
  'home.comingSoon.card1Title',
  'home.comingSoon.card1Description',
  'home.comingSoon.card1ImageAlt',
  'home.comingSoon.card2Title',
  'home.comingSoon.card2Description',
  'home.comingSoon.card2ImageAlt',
  'home.comingSoon.card3Title',
  'home.comingSoon.card3Description',
  'home.comingSoon.card3ImageAlt',
  'home.comingSoon.card4Title',
  'home.comingSoon.card4Description',
  'home.comingSoon.card4ImageAlt',
  'home.comingSoon.card5Title',
  'home.comingSoon.card5Description',
  'home.comingSoon.card5ImageAlt',
  'home.comingSoon.card6Title',
  'home.comingSoon.card6Description',
  'home.comingSoon.card6ImageAlt',
] as const

describe('Coming Soon i18n keys', () => {
  LOCALES.forEach((locale) => {
    describe(`${locale}.json`, () => {
      const messages = loadLocale(locale)

      COMING_SOON_KEYS.forEach((key) => {
        it(`has a non-empty string value for "${key}"`, () => {
          const value = getNestedValue(messages, key)
          expect(value, `Key "${key}" missing in ${locale}.json`).toBeDefined()
          expect(typeof value, `Key "${key}" in ${locale}.json is not a string`).toBe('string')
          expect((value as string).trim().length, `Key "${key}" in ${locale}.json is empty`).toBeGreaterThan(0)
        })
      })
    })
  })

  it('all 4 locales define exactly the same set of keys', () => {
    const presenceMatrix = LOCALES.map((locale) => {
      const messages = loadLocale(locale)
      return COMING_SOON_KEYS.map((key) => typeof getNestedValue(messages, key) === 'string')
    })
    presenceMatrix.forEach((flags, localeIdx) => {
      flags.forEach((present, keyIdx) => {
        expect(
          present,
          `${LOCALES[localeIdx]}.json is missing key "${COMING_SOON_KEYS[keyIdx]}"`,
        ).toBe(true)
      })
    })
  })

  it('en.json titleHighlight value is "next"', () => {
    const messages = loadLocale('en')
    expect(getNestedValue(messages, 'home.comingSoon.titleHighlight')).toBe('next')
  })
})
