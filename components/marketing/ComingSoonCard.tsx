import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ComingSoonCardProps {
  title: string
  description: string
  imageSrc: string
  imageAlt: string
  badgeLabel: string
  distance: number // 0 = center, 1 = adjacent, 2+ = far
}

// Static resource card for the Coming Soon carousel.
// Scale and opacity are driven by distance from the carousel center.
export function ComingSoonCard({
  title,
  description,
  imageSrc,
  imageAlt,
  badgeLabel,
  distance,
}: ComingSoonCardProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col bg-surface border border-border-default',
        'rounded-[length:var(--radius-xl)] p-[length:var(--space-6)]',
        'transition-all duration-300 ease-out select-none',
        distance === 0 && 'scale-100 opacity-100 shadow-[var(--shadow-md)]',
        distance === 1 && 'scale-[0.88] opacity-60',
        distance >= 2 && 'scale-[0.80] opacity-40',
      )}
    >
      {/* Coming Soon badge — absolute top-right */}
      <span
        className={cn(
          'absolute top-[length:var(--space-4)] right-[length:var(--space-4)]',
          'inline-flex items-center bg-brand-primary-dim text-brand-primary',
          'text-[length:var(--text-xs)] font-[number:var(--font-medium)]',
          'px-[length:var(--space-3)] py-[length:var(--space-1)]',
          'rounded-[length:var(--radius-full)]',
        )}
      >
        {badgeLabel}
      </span>

      {/* Title — Playfair Display, bold */}
      <h3
        className={cn(
          'font-serif font-[number:var(--font-bold)]',
          'text-[length:var(--text-xl)] text-text-primary',
          'leading-[var(--leading-tight)]',
          'pr-[length:var(--space-16)]', // avoids overlap with badge
        )}
      >
        {title}
      </h3>

      {/* Description — Inter, normal weight */}
      <p
        className={cn(
          'mt-[length:var(--space-2)]',
          'text-[length:var(--text-sm)] font-[number:var(--font-normal)]',
          'text-text-secondary leading-[var(--leading-relaxed)]',
        )}
      >
        {description}
      </p>

      {/* Illustration pushed to bottom */}
      <div className="mt-auto pt-[length:var(--space-6)] flex justify-center">
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={200}
          height={140}
          className="object-contain w-auto h-auto max-h-36"
        />
      </div>
    </div>
  )
}
