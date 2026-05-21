/**
 * ISO 3166-1 alpha-2 country codes and English names.
 * Sorted alphabetically by name.
 */
export const COUNTRIES = [
  { code: 'AR', name: 'Argentina' },
  { code: 'AU', name: 'Australia' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CA', name: 'Canada' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'DE', name: 'Germany' },
  { code: 'ES', name: 'Spain' },
  { code: 'FR', name: 'France' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IT', name: 'Italy' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'PT', name: 'Portugal' },
  { code: 'US', name: 'United States' },
].sort((a, b) => a.name.localeCompare(b.name))

/**
 * Resolves an ISO alpha-2 country code to its English display name.
 * Falls back to the raw code if it is not in the COUNTRIES list.
 * Shared by all PDF templates that need to display nationality.
 */
export function resolveCountry(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.name ?? code
}
