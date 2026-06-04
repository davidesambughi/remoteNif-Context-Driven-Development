'use client'

import { useState, useRef, useEffect } from 'react'
import { HelpCircle } from 'lucide-react'

interface InfoHintProps {
  content: string
}

/**
 * Client Island: InfoHint
 * Renders a small question mark icon that shows a popover on click/hover.
 * Follows the user request to avoid making the whole TierCard a client component.
 */
export function InfoHint({ content }: InfoHintProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative inline-block ml-1 align-middle" ref={containerRef}>
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="text-text-muted hover:text-brand-primary transition-colors focus:outline-none"
        aria-label="More information"
      >
        <HelpCircle size={14} />
      </button>

      {isOpen && (
        <div 
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3
            bg-[var(--bg-surface)] border border-[var(--border-default)]
            shadow-[var(--shadow-lg)] rounded-xl text-[length:var(--text-xs)]
            text-text-secondary leading-normal animate-in fade-in zoom-in duration-200"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          {content}
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[var(--border-default)]" />
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[7px] border-transparent border-t-[var(--bg-surface)]" />
        </div>
      )}
    </div>
  )
}
