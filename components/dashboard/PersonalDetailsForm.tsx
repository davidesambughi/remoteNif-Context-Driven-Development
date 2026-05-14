'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { Loader2, AlertCircle, CheckCircle2, Pencil } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

import { PersonalDetailsSchema } from '@/lib/validations/orders'
import type { PersonalDetailsData } from '@/lib/validations/orders'
import { savePersonalDetails } from '@/app/actions/orders'
import { COUNTRIES } from '@/lib/utils/countries'

interface PersonalDetailsFormProps {
  orderId: string
  initialValues: Partial<PersonalDetailsData> | null
  // detailsSaved=true means the server already has complete details for this order
  detailsSaved: boolean
}

// Maps an ISO alpha-2 code to a display name for the saved summary view
function countryName(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.name ?? code
}

export function PersonalDetailsForm({
  orderId,
  initialValues,
  detailsSaved,
}: PersonalDetailsFormProps) {
  const t = useTranslations('personalDetails')

  // isSaved drives which mode is rendered.
  // Starts true when the server already has saved details so returning users
  // immediately see the summary card, not the blank form.
  const [isSaved, setIsSaved] = useState(detailsSaved)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveError, setSaveError] = useState(false)

  // Pre-resolve translations for the doc slot types (strict i18n typing requirement)
  const docSlots = [
    { id: 'passport', title: t('docs.passport.title'), description: t('docs.passport.description') },
    { id: 'proofOfAddress', title: t('docs.proofOfAddress.title'), description: t('docs.proofOfAddress.description') },
    { id: 'signedPoa', title: t('docs.signedPoa.title'), description: t('docs.signedPoa.description') },
  ]

  const form = useForm<PersonalDetailsData>({
    resolver: zodResolver(PersonalDetailsSchema),
    defaultValues: {
      fullName: initialValues?.fullName ?? '',
      dateOfBirth: initialValues?.dateOfBirth ?? '',
      nationality: initialValues?.nationality ?? '',
      passportNumber: initialValues?.passportNumber ?? '',
      passportExpiry: initialValues?.passportExpiry ?? '',
      address: initialValues?.address ?? '',
    },
  })

  // Current values used to render the summary card after a successful save
  const saved = form.getValues()

  async function onSubmit(data: PersonalDetailsData) {
    setIsSubmitting(true)
    setSaveError(false)

    try {
      const result = await savePersonalDetails(orderId, data)
      if (result.success) {
        // Collapse immediately — no delay needed, the summary card confirms success
        setIsSaved(true)
      } else {
        setSaveError(true)
      }
    } catch {
      setSaveError(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- Saved summary view ---
  // Shown after a successful save and on page load when details already exist.
  // "Edit" re-opens the form with the current values still populated.
  if (isSaved) {
    const values = form.getValues()
    return (
      <div className="space-y-8">
        <Card className="rounded-[length:var(--radius-xl)] shadow-[var(--shadow-md)] bg-[var(--bg-surface)] border-[var(--border-default)]">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[var(--status-success)] shrink-0" />
                <CardTitle className="text-text-primary">{t('title')}</CardTitle>
              </div>
              <CardDescription className="text-text-secondary">
                {t('summary.description')}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => setIsSaved(false)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              {t('summary.editButton')}
            </Button>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div className="col-span-1 md:col-span-2">
                <dt className="text-text-muted font-medium mb-0.5">{t('fullName')}</dt>
                <dd className="text-text-primary">{values.fullName}</dd>
              </div>
              <div>
                <dt className="text-text-muted font-medium mb-0.5">{t('dateOfBirth')}</dt>
                <dd className="text-text-primary">{values.dateOfBirth}</dd>
              </div>
              <div>
                <dt className="text-text-muted font-medium mb-0.5">{t('nationality')}</dt>
                <dd className="text-text-primary">{countryName(values.nationality)}</dd>
              </div>
              <div>
                <dt className="text-text-muted font-medium mb-0.5">{t('passportNumber')}</dt>
                <dd className="text-text-primary font-[family-name:var(--font-mono)]">{values.passportNumber}</dd>
              </div>
              <div>
                <dt className="text-text-muted font-medium mb-0.5">{t('passportExpiry')}</dt>
                <dd className="text-text-primary">{values.passportExpiry}</dd>
              </div>
              <div className="col-span-1 md:col-span-2">
                <dt className="text-text-muted font-medium mb-0.5">{t('address')}</dt>
                <dd className="text-text-primary whitespace-pre-line">{values.address}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Upload slots — unlocked because details are saved */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {docSlots.map((slot) => (
            <div
              key={slot.id}
              className="relative p-6 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center gap-3 transition-base border-border-default bg-surface hover:border-brand-primary"
            >
              <div className="p-3 rounded-full bg-brand-primary-dim text-brand-primary">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-text-primary">{slot.title}</h3>
                <p className="text-sm text-text-muted">{slot.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // --- Editing view ---
  // Shown on first visit (no saved details) or after the user clicks "Edit".
  return (
    <div className="space-y-8">
      <Card className="rounded-[length:var(--radius-xl)] shadow-[var(--shadow-md)] bg-[var(--bg-surface)] border-[var(--border-default)]">
        <CardHeader>
          <CardTitle className="text-text-primary">{t('title')}</CardTitle>
          <CardDescription className="text-text-secondary">
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Legal Name — full width */}
                <div className="col-span-1 md:col-span-2">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-text-secondary">{t('fullName')}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t('fullNamePlaceholder')}
                            className="rounded-md focus-visible:border-brand-primary"
                          />
                        </FormControl>
                        <FormMessage className="text-error" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Date of Birth */}
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-text-secondary">{t('dateOfBirth')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          className="rounded-md focus-visible:border-brand-primary"
                        />
                      </FormControl>
                      <FormMessage className="text-error" />
                    </FormItem>
                  )}
                />

                {/* Nationality */}
                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-text-secondary">{t('nationality')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-md focus-visible:border-brand-primary">
                            <SelectValue placeholder={t('nationalityPlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COUNTRIES.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-error" />
                    </FormItem>
                  )}
                />

                {/* Passport Number */}
                <FormField
                  control={form.control}
                  name="passportNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-text-secondary">{t('passportNumber')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t('passportNumberPlaceholder')}
                          className="rounded-md focus-visible:border-brand-primary"
                        />
                      </FormControl>
                      <FormMessage className="text-error" />
                    </FormItem>
                  )}
                />

                {/* Passport Expiry */}
                <FormField
                  control={form.control}
                  name="passportExpiry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-text-secondary">{t('passportExpiry')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          className="rounded-md focus-visible:border-brand-primary"
                        />
                      </FormControl>
                      <FormMessage className="text-error" />
                    </FormItem>
                  )}
                />

                {/* Current Address — full width */}
                <div className="col-span-1 md:col-span-2">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-text-secondary">{t('address')}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={t('addressPlaceholder')}
                            className="resize-none rounded-md focus-visible:border-brand-primary min-h-[100px]"
                          />
                        </FormControl>
                        <FormMessage className="text-error" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="mt-[length:var(--space-6)] flex flex-col gap-[length:var(--space-4)]">
                {/* Pre-submit note — reminds user to check details before locking them in */}
                <p className="text-sm text-text-muted">
                  {t('save.preSubmitNote')}
                </p>

                {saveError && (
                  <div className="flex items-center gap-3 p-4 rounded-md border border-error bg-error/10 text-error">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium">{t('save.error')}</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-brand-primary text-on-accent hover:bg-brand-primary/90 transition-base w-full md:w-auto"
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('saveButton')}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Upload slots — locked until details are saved */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {docSlots.map((slot) => (
          <div
            key={slot.id}
            className="relative p-6 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center gap-3 transition-base border-border-subtle bg-subtle opacity-50 cursor-not-allowed"
            title={t('uploadGate.tooltip')}
          >
            <div className="p-3 rounded-full bg-[var(--bg-base)] text-text-muted">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-text-muted">{slot.title}</h3>
              <p className="text-sm text-text-muted">{slot.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
