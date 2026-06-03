# S6-Fix8 — Status Update Note Email

<!-- Read before implementing: context/code-standards.md, context/tech-spec.md, context/progress-tracker.md -->

Wire the `status_update_with_note` email so that when an admin saves a manual status update with a note, the customer receives a transactional email containing the note and new status label in their preferred language.

---

## Constraints

### Architecture

- New email template at `lib/email/templates/status-update-with-note.tsx`. Follow the exact structure of `lib/email/templates/documents-approved-customer.tsx`: react-email primitives, inline `copy` object keyed by `EmailLocale`, exported `getStatusUpdateWithNoteSubject()` function, exported component.
- Register the template in `lib/email/send.ts`: import, add to `EmailTemplateName`, add to `EmailPayload` discriminated union, add a `case` in the `switch`.
- Wire the send call in `app/actions/admin.ts` inside the existing `if (validated.note)` block (lines 224–230). The `order` object already has `customerEmail`, `customerLanguage`, and `fullName` — no new query.
- `sendEmail()` is fire-and-forget (never throws) — do not alter error handling in the action.
- Email templates do not use next-intl. All copy lives in the inline `copy` object in the template file.

### TypeScript

- Strict mode. No `any`. No type assertions.
- `EmailPayload` new member: `{ template: 'status_update_with_note'; customerName: string; note: string; newStatus: string }`
- `newStatus` passed as the raw status enum string; the template maps it to a human-readable label internally via the `copy` object.
- `order.customerLanguage` is `'en' | 'fr' | 'es' | 'de'` (from `languageEnum`) — same as `EmailLocale`. No cast needed.

### Validation

No new schema. The existing `UpdateOrderStatusSchema` already validates `orderId`, `newStatus`, and `note`.

---

## Design

Standard transactional email layout — match `documents-approved-customer.tsx` exactly for brand, spacing, and button styles.

Structure:
1. Brand block: "RemoteNIF" in blue (`#3b82f6`)
2. Divider
3. Heading: e.g. "Update on your application"
4. Greeting: `Hello {customerName},`
5. Body: one sentence stating the new status (using the mapped human-readable label)
6. Note block: the admin's note, rendered in a visually distinct inline-styled container (grey background `#f8fafc`, left border `4px solid #e2e8f0`, `padding: 16px`, `borderRadius: 4px`) — so it reads as a quoted message, not RemoteNIF copy
7. CTA button: "View Dashboard" → `dashboardUrl`
8. Divider
9. Footer: "RemoteNIF · remotenif.com"

---

## Implementation

1. Create `lib/email/templates/status-update-with-note.tsx`:

   - Props interface: `locale: EmailLocale`, `customerName: string`, `note: string`, `newStatus: string`, `dashboardUrl: string`
   - `copy` object with `en`, `fr`, `es`, `de` entries. Each entry needs:
     - `subject`: e.g. `"Update on your NIF application"`
     - `preview`: e.g. `"There's an update on your NIF application."`
     - `heading`: e.g. `"Update on your application."`
     - `statusLabels`: a record mapping all 5 raw status values (`documents_pending`, `documents_under_review`, `documents_approved`, `submitted`, `delivered`) to human-readable labels in that locale
     - `statusLine`: function `(statusLabel: string) => string` — e.g. `(s) => \`Your application status has been updated to: ${s}.\``
     - `noteLabel`: e.g. `"Message from our team:"`
     - `cta`: e.g. `"View Dashboard"`
   - Export `getStatusUpdateWithNoteSubject(locale: EmailLocale): string`
   - Export `StatusUpdateWithNoteEmail` component — use `copy[locale].statusLabels[newStatus] ?? newStatus` to resolve the label safely

2. Register in `lib/email/send.ts`:

   - Import `StatusUpdateWithNoteEmail` and `getStatusUpdateWithNoteSubject` from `./templates/status-update-with-note`
   - Add `'status_update_with_note'` to `EmailTemplateName`
   - Add `{ template: 'status_update_with_note'; customerName: string; note: string; newStatus: string }` to `EmailPayload`
   - Add `case 'status_update_with_note':` in the switch: call `getStatusUpdateWithNoteSubject(locale)` and `StatusUpdateWithNoteEmail({ locale, customerName: payload.customerName, note: payload.note, newStatus: payload.newStatus, dashboardUrl })`

3. Wire in `app/actions/admin.ts` inside the `if (validated.note)` block (replacing lines 225–229):

   - Remove the existing TODO comment block entirely
   - Call: `await sendEmail(order.customerEmail, order.customerLanguage, { template: 'status_update_with_note', customerName: order.fullName ?? 'there', note: validated.note, newStatus: validated.newStatus })`

---

## Scope Limits

- Do not add `'status_update_with_note'` to the `emailType` enum in `ResendEmailSchema` — this email is not manually resendable via the admin resend route.
- Do not add keys to `messages/*.json` — email templates use inline copy, not next-intl.
- Do not change the audit log logic — the note continues to be saved to the audit log regardless of whether the email sends.
- Do not add retry logic — `sendEmail()` is fire-and-forget; existing error logging is sufficient.
- Keep this focused on the single send path triggered by `adminUpdateOrderStatus` when a note is present.

---

## Check When Done

- `lib/email/templates/status-update-with-note.tsx` exists with all 4 locales in the `copy` object and all 5 status values in each `statusLabels` record
- `EmailTemplateName` in `lib/email/send.ts` includes `'status_update_with_note'`
- `EmailPayload` discriminated union in `lib/email/send.ts` includes the new member
- The exhaustive `_exhaustive: never` check in the `switch` default still compiles (TypeScript confirms no missing case)
- The `if (validated.note)` block in `app/actions/admin.ts` calls `sendEmail()` — the old TODO comment is removed
- `npm run build` passes
