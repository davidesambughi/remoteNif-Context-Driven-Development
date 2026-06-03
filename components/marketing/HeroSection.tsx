import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'

interface StatItemProps {
  value: string
  label: string
  // When true, adds a left border separator (all stats except the first)
  separator?: boolean
}

// Single stat cell — no background, no card, separator line only
function StatItem({ value, label, separator = false }: StatItemProps) {
  return (
    <div
      className={[
        'flex flex-col items-center px-[length:var(--space-6)]',
        separator ? 'border-l border-glass-separator' : '',
      ].join(' ')}
    >
      <span className="text-[length:var(--text-2xl)] font-[number:var(--font-bold)] text-glass-text leading-[var(--leading-tight)]">
        {value}
      </span>
      <span className="text-[length:var(--text-xs)] font-[number:var(--font-normal)] text-glass-text">
        {label}
      </span>
    </div>
  )
}

/**
 * Full-viewport photo-canvas hero.
 *
 * Layout rules (from design-principles.md):
 * - Photo fills the entire viewport, object-cover.
 * - Mobile-only gradient overlay darkens the bottom for text legibility;
 *   on desktop, the image is clean (text remains legible due to layout/contrast).
 * - Content block (badge → headline → subtext → CTA) is anchored bottom-left,
 *   confined to ≤50% width on desktop. Right half is deliberately empty.
 * - Stats row: horizontal flex, bottom-right on desktop; static centered row
 *   below CTA on mobile.
 * - mt-[-3.5rem] cancels the marketing layout's pt-14 so the hero bleeds
 *   all the way to the top of the viewport behind the sticky glass navbar.
 */
export function HeroSection() {
  const t = useTranslations('home.hero')

  // Split headline on the em-dash separator defined in the translation:
  // "Get Your Portuguese NIF Online — Fast, Transparent, Reliable"
  // Part before " — " renders upright; part after renders italic.
  const headlineParts = t('headline').split(' — ')
  const upright = headlineParts[0] ?? t('headline')
  const italic = headlineParts[1] ?? null

  // Highlight "NIF" in brand color within the upright clause.
  // Split on the literal word so it works regardless of surrounding text.
  const uptightParts = upright.split('NIF')
  const beforeNif = uptightParts[0] ?? ''
  const afterNif = uptightParts[1] ?? null

  // mt-[-7rem]: cancel both <main>'s pt-14 AND the sticky header's h-14 so the section
  // starts at y=0 and the hero image bleeds behind the glass navbar.
  // min-h-[100dvh]: dynamic viewport height — avoids the mobile address-bar crop
  // that min-h-screen (100vh) causes on iOS/Android.
  return (
    <section className="relative @container min-h-[100dvh] mt-[-7rem] flex flex-col overflow-hidden">

      {/* ── Background photo ─────────────────────────────────────────── */}
      {/* priority: this is the LCP element — Next.js must preload it.   */}
      {/* sizes: 100vw ensures browser doesn't over-fetch high-res on mobile */}
      {/* object-[75%_center]: preserves the face (on the right) on mobile */}
      <Image
        src="/images/hero-image.png"
        alt="Smiling Portugal Landscape"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[75%_center] @md:object-center"
      />

      {/* ── Gradient overlay — protective shadow for text legibility ─── */}
      {/* bg-linear-to-t: mobile starts from bottom to protect anchored text; uses orange-based overlay */}
      {/* @md:hidden: desktop removes the overlay for a cleaner look as requested by the user */}
      <div className="absolute inset-0 bg-linear-to-t from-glass-overlay-mobile via-glass-overlay-mobile/40 to-transparent @md:hidden pointer-events-none" />

      {/* ── Content + stats wrapper ───────────────────────────────────── */}

      {/* pt-14 re-introduces the header offset so text starts below navbar */}
      <div className="relative z-10 flex flex-col flex-1 pt-14">

        {/* ── Left zone — badge, headline, subtext, CTA ──────────────── */}
        {/* justify-end anchors the block to the lower half of the viewport */}
        {/* max-w-full @md:max-w-[50%] enforces the two-zone layout on desktop */}
        <div className="flex flex-col justify-end flex-1 px-[length:var(--space-6)] pb-[length:var(--space-12)] @md:px-[length:var(--space-16)]">
          <div className="max-w-full @md:max-w-[50%]">

            {/* Badge */}
            <span
              className="inline-flex items-center
                bg-glass-badge-bg border border-glass-badge-border rounded-full
                px-[length:var(--space-4)] py-[length:var(--space-2)]
                text-[length:var(--text-xs)] font-[number:var(--font-medium)] text-glass-text
                motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 duration-700"
            >
              {t('badge')}
            </span>

            {/* Headline — upright opening clause + italic closing clause */}
            {/* "NIF" is highlighted in brand-primary; surrounding text stays glass-text */}
            <h1
              className="mt-[length:var(--space-4)] leading-[var(--leading-tight)]
                motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 duration-700"
              style={{ animationDelay: '100ms' }}
            >
              <span className="font-serif font-[number:var(--font-bold)]
                text-[length:var(--text-3xl)] @md:text-[length:var(--text-4xl)]
                text-glass-text">
                {beforeNif}
                <span className="text-brand-primary">{afterNif !== null ? 'NIF' : upright}</span>
                {afterNif}
              </span>
              {italic && (
                <>
                  {' — '}
                  <span className="font-serif font-[number:var(--font-bold)] italic
                    text-[length:var(--text-3xl)] @md:text-[length:var(--text-4xl)]
                    text-glass-text">
                    {italic}.
                  </span>
                </>
              )}
            </h1>

            {/* Subtext — dimmed white for hierarchy without introducing a new colour */}
            <p
              className="mt-[length:var(--space-6)]
                text-[length:var(--text-lg)] text-glass-text-dim
                font-[number:var(--font-normal)] leading-[var(--leading-relaxed)]
                motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 duration-700"
              style={{ animationDelay: '200ms' }}
            >
              {t('subheadline')}
            </p>

            {/* CTA — white pill, orange text (inverted from the navbar orange pill) */}
            {/* Plain Link, not shadcn Button — inversion treatment conflicts with Button variants */}
            <Link
              href="/pricing"
              className="mt-[length:var(--space-8)] self-start inline-flex items-center
                bg-white text-brand-primary rounded-full
                px-[length:var(--space-8)] py-[length:var(--space-3)]
                font-[number:var(--font-semibold)] text-[length:var(--text-base)]
                hover:opacity-90 transition-[var(--transition-base)]
                motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 duration-700"
              style={{ animationDelay: '300ms' }}>
              {t('cta')}
            </Link>

            {/* ── Stats row — mobile only (static, below CTA) ──────── */}
            {/* On desktop this row is hidden; the absolute-positioned row below shows instead */}
            <div
              className="flex @md:hidden items-end justify-center
                mt-[length:var(--space-8)] pb-[length:var(--space-8)]
                motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 duration-700"
              style={{ animationDelay: '400ms' }}
            >
              <StatItem value={t('stat1Value')} label={t('stat1Label')} />
              <StatItem value={t('stat2Value')} label={t('stat2Label')} separator />
              <StatItem value={t('stat3Value')} label={t('stat3Label')} separator />
              <StatItem value={t('stat4Value')} label={t('stat4Label')} separator />
            </div>

          </div>
        </div>

        {/* ── Stats row — desktop only (absolute, bottom-right) ──────── */}
        {/* hidden on mobile; absolute positioning relative to the section  */}
        <div
          className="hidden @md:flex items-end
            absolute bottom-[length:var(--space-12)] right-[length:var(--space-16)] z-10
            motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 duration-700"
          style={{ animationDelay: '400ms' }}
        >
          <StatItem value={t('stat1Value')} label={t('stat1Label')} />
          <StatItem value={t('stat2Value')} label={t('stat2Label')} separator />
          <StatItem value={t('stat3Value')} label={t('stat3Label')} separator />
          <StatItem value={t('stat4Value')} label={t('stat4Label')} separator />
        </div>

      </div>
    </section>
  )
}
