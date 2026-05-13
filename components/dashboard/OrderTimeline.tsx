import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTranslations } from 'next-intl/server'
import type { SelectOrder } from '@/lib/db/schema'

/**
 * Visual progress tracker for the NIF acquisition process.
 * Highlights the current step and shows completion status for previous steps.
 */

interface OrderTimelineProps {
  status: SelectOrder['status']
}

// Canonical sequence of order statuses for the timeline
const steps = [
  { id: 'documents_pending', labelKey: 'timeline.upload' },
  { id: 'documents_under_review', labelKey: 'timeline.review' },
  { id: 'documents_approved', labelKey: 'timeline.approved' },
  { id: 'submitted', labelKey: 'timeline.submitted' },
  { id: 'delivered', labelKey: 'timeline.delivered' },
] as const

export default async function OrderTimeline({ status }: OrderTimelineProps) {
  const t = await getTranslations('dashboard')
  
  // Calculate the current progress percentage
  const currentStepIndex = steps.findIndex((step) => step.id === status)

  return (
    <div className="w-full py-[length:var(--space-8)] px-[length:var(--space-4)] sm:px-0">
      <div className="relative flex items-center justify-between">
        {/* Progress Line */}
        <div className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-[var(--border-subtle)]" />
        <div 
          className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 bg-[var(--status-success)] transition-all duration-500"
          style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
        />

        {/* Steps */}
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex || status === 'delivered'
          const isCurrent = index === currentStepIndex && status !== 'delivered'
          
          return (
            <div key={step.id} className="relative flex flex-col items-center">
              <div 
                className={cn(
                  "relative z-10 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 bg-[var(--bg-base)] transition-colors duration-300",
                  isCompleted ? "border-[var(--status-success)] bg-[var(--status-success)] text-[var(--text-on-accent)]" : 
                  isCurrent ? "border-[var(--brand-primary)] bg-[var(--bg-base)] text-[var(--brand-primary)]" : 
                  "border-[var(--border-subtle)] bg-[var(--bg-base)] text-[var(--text-muted)]"
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5 sm:h-6 sm:w-6" />
                ) : (
                  <div className={cn("h-2 w-2 sm:h-3 sm:w-3 rounded-full", isCurrent ? "bg-[var(--brand-primary)]" : "bg-[var(--border-subtle)]")} />
                )}
              </div>
              <span 
                className={cn(
                  // text-[8px]: no token exists below --text-xs (12px); 8px needed on mobile to fit 5 labels without overflow
                  "absolute -bottom-8 whitespace-nowrap text-[8px] sm:text-[length:var(--text-xs)] font-[number:var(--font-medium)] uppercase tracking-wider",
                  isCompleted ? "text-[var(--status-success)]" : 
                  isCurrent ? "text-[var(--brand-primary)]" : 
                  "text-[var(--text-muted)]"
                )}
              >
                {t(step.labelKey)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
