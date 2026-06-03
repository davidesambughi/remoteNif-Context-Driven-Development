'use client'

import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { ComingSoonCard } from './ComingSoonCard'


// Distance from center accounting for loop wrap-around
function getLoopDistance(index: number, selectedIndex: number, total: number): number {
  const diff = Math.abs(index - selectedIndex)
  return Math.min(diff, total - diff)
}

export function ComingSoonCarousel() {
  const t = useTranslations('home.comingSoon')

  // Embla used directly for full control over DOM structure (peek effect)
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'center', loop: true })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  // All card data co-located — image paths paired with translations to avoid index access issues
  const cards = [
    { title: t('card1Title'), description: t('card1Description'), imageAlt: t('card1ImageAlt'), imageSrc: '/images/comingsoon-card1-image.png' },
    { title: t('card2Title'), description: t('card2Description'), imageAlt: t('card2ImageAlt'), imageSrc: '/images/comingsoon-card2-image.png' },
    { title: t('card3Title'), description: t('card3Description'), imageAlt: t('card3ImageAlt'), imageSrc: '/images/comingsoon-card3-image.png' },
    { title: t('card4Title'), description: t('card4Description'), imageAlt: t('card4ImageAlt'), imageSrc: '/images/comingsoon-card4-image.png' },
    { title: t('card5Title'), description: t('card5Description'), imageAlt: t('card5ImageAlt'), imageSrc: '/images/comingsoon-card5-image.png' },
    { title: t('card6Title'), description: t('card6Description'), imageAlt: t('card6ImageAlt'), imageSrc: '/images/comingsoon-card6-image.png' },
  ]
  const badgeLabel = t('badge')

  return (
    <div className="relative" aria-roledescription="carousel">
      {/* overflow-hidden clips the carousel at the section boundary.
          The embla viewport has no overflow restriction so adjacent cards peek in. */}
      <div className="overflow-hidden">
        <div ref={emblaRef}>
          <div className="flex">
            {cards.map((card, i) => (
              <div
                key={i}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} / ${cards.length}`}
                // 78% on mobile shows clear center + side peeks
                // 40% on md shows ~2.5 cards, 36% on lg shows ~2.8
                className="flex-[0_0_78%] md:flex-[0_0_40%] lg:flex-[0_0_36%] px-3"
              >
                <ComingSoonCard
                  title={card.title}
                  description={card.description}
                  imageSrc={card.imageSrc}
                  imageAlt={card.imageAlt}
                  badgeLabel={badgeLabel}
                  distance={getLoopDistance(i, selectedIndex, cards.length)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pagination dots */}
      <div
        className="flex justify-center gap-[length:var(--space-2)] mt-[length:var(--space-8)]"
        role="tablist"
        aria-label={t('dotsAriaLabel')}
      >
        {cards.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === selectedIndex}
            aria-label={`${t('slideAriaLabel')} ${i + 1}`}
            onClick={() => emblaApi?.scrollTo(i)}
            className={cn(
              'rounded-[length:var(--radius-full)] transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2',
              i === selectedIndex
                ? 'w-2.5 h-2.5 bg-brand-primary'
                : 'w-2 h-2 bg-border-default',
            )}
          />
        ))}
      </div>
    </div>
  )
}
