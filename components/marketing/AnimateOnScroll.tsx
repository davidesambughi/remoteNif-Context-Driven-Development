'use client'
import { useEffect, useRef, useState } from 'react'

interface Props {
  children: React.ReactNode
  /** Optional delay in ms — use for staggered reveals within a group */
  delay?: number
  className?: string
}

// Fades and slides children up when they cross 10% into the viewport.
// Fires once then disconnects the observer. No-ops for prefers-reduced-motion users.
export function AnimateOnScroll({ children, delay = 0, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={[
        'transition-[opacity,transform] duration-700 ease-out',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        // Disabled entirely for users who prefer reduced motion
        'motion-reduce:opacity-100 motion-reduce:translate-y-0 motion-reduce:transition-none',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
