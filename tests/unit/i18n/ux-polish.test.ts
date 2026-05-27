import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ---------------------------------------------------------------------------
// Locale key existence tests — UX polish sprint
//
// Verifies that every new i18n key added in the UX polish sprint exists in
// all 4 locale files with a non-empty string value. These tests catch the
// case where a key is added to en.json but forgotten in fr/es/de, which
// would cause next-intl to silently fall back or throw at runtime.
// ---------------------------------------------------------------------------

type LocaleJson = Record<string, unknown>

/** Load and parse a locale JSON file. */
function loadLocale(locale: string): LocaleJson {
  const path = resolve(process.cwd(), 'messages', `${locale}.json`)
  return JSON.parse(readFileSync(path, 'utf-8')) as LocaleJson
}

/** Safely read a nested key using dot notation (e.g. 'admin.detail.updateStatusDescription'). */
function getNestedValue(obj: LocaleJson, dotPath: string): unknown {
  return dotPath.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
    return undefined
  }, obj)
}

const LOCALES = ['en', 'fr', 'es', 'de'] as const

/** New keys added in the UX polish sprint and where they live. */
const NEW_KEYS = [
  // Admin action section hints
  'admin.detail.updateStatusDescription',
  'admin.detail.resendEmailDescription',
  // Operator queue section hints
  'operator.queue.expressHint',
  'operator.queue.standardHint',
] as const

describe('UX polish i18n keys', () => {
  LOCALES.forEach((locale) => {
    describe(`${locale}.json`, () => {
      const messages = loadLocale(locale)

      NEW_KEYS.forEach((key) => {
        it(`has a non-empty value for "${key}"`, () => {
          const value = getNestedValue(messages, key)
          expect(value, `Key "${key}" missing in ${locale}.json`).toBeDefined()
          expect(typeof value, `Key "${key}" in ${locale}.json is not a string`).toBe('string')
          expect((value as string).trim().length, `Key "${key}" in ${locale}.json is empty`).toBeGreaterThan(0)
        })
      })
    })
  })

  it('all 4 locales have exactly the same set of new keys', () => {
    // Sanity check: no locale has a key the others are missing
    const valueSets = LOCALES.map((locale) => {
      const messages = loadLocale(locale)
      return NEW_KEYS.map((key) => typeof getNestedValue(messages, key) === 'string')
    })
    // Every locale should have all keys defined
    valueSets.forEach((presenceFlags, i) => {
      presenceFlags.forEach((present, j) => {
        expect(present, `${LOCALES[i]}.json is missing key "${NEW_KEYS[j]}"`).toBe(true)
      })
    })
  })
})
