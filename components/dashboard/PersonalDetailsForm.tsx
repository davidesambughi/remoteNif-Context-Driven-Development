'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

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
  detailsSaved: boolean
}

export function PersonalDetailsForm({
  orderId,
  initialValues,
  detailsSaved,
}: PersonalDetailsFormProps) {
  const t = useTranslations('personalDetails')
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Pre-resolve translations for the three doc slot types to satisfy strict i18n typing
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

  async function onSubmit(data: PersonalDetailsData) {
    setIsSubmitting(true)
    setSaveStatus('idle')

    try {
      const result = await savePersonalDetails(orderId, data)
      if (result.success) {
        setSaveStatus('success')
        // Delay refresh so the success banner is visible before the component remounts
        setTimeout(() => router.refresh(), 1500)
      } else {
        setSaveStatus('error')
      }
    } catch {
      setSaveStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

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
                {/* Full Legal Name - Full Width */}
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

                {/* Current Address - Full Width */}
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
                {saveStatus === 'success' && (
                  <div className="flex items-center gap-3 p-4 rounded-md border border-success bg-success/10 text-success">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium">{t('save.success')}</span>
                  </div>
                )}
                {saveStatus === 'error' && (
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

      {/* Upload Gate - Placeholder Slots */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {docSlots.map((slot) => (
          <div
            key={slot.id}
            className={`
              relative p-6 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center gap-3 transition-base
              ${detailsSaved
                ? 'border-border-default bg-surface hover:border-brand-primary'
                : 'border-border-subtle bg-subtle opacity-50 cursor-not-allowed'}
            `}
            title={!detailsSaved ? t('uploadGate.tooltip') : undefined}
          >
            <div className={`p-3 rounded-full ${detailsSaved ? 'bg-brand-primary-dim text-brand-primary' : 'bg-[var(--bg-base)] text-text-muted'}`}>
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className={`font-semibold ${detailsSaved ? 'text-text-primary' : 'text-text-muted'}`}>
                {slot.title}
              </h3>
              <p className="text-sm text-text-muted">
                {slot.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
