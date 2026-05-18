# 11a — Automated AI Document Review

Read `context/AGENTS.md`, `context/progress-tracker.md`, `context/project-overview.md`, `context/user-flows.md` before starting.

Integrate the Google Gemini API to automatically review uploaded passports and proofs of address, updating the database and UI state, including cross-slot locking and timeout degradation.

---

## Constraints

### Architecture

- Server Action for AI review triggers after successful document upload.
- AI logic goes in `lib/ai/gemini.ts`.
- DB queries go in `lib/db/queries.ts`.
- The dashboard (`app/[locale]/(dashboard)/dashboard/page.tsx`) must fetch existing document records to hydrate the `DocumentUploadSlot` components (initial status, flag reason).
- Cross-slot locking: When one document slot is `flagged`, other slots that are `approved` must be locked (disabled) so the user focuses on re-uploading the flagged document.

### TypeScript

- Strict mode. No `any`. No type assertions without a comment explaining why.
- Define a strict Zod schema for the expected JSON response from the Gemini API and use `z.parse()` or `z.safeParse()` to validate the LLM output.

### Validation

```typescript
// lib/validations/documents.ts
export const AiReviewResponseSchema = z.object({
  status: z.enum(['clear', 'flagged', 'error']),
  reasonKey: z.string().optional() // Must map to a translation key if flagged
})
```

### i18n

- All AI flag reasons must be mapped to predefined translation keys in `messages/en.json` (under `documents.errors`). Do NOT display raw AI text.
- Add the "Still reviewing… this is taking longer than usual" message to the translations.
- Use `useTranslations('documents')` for user-facing text.

---

## Design

- Implement a 30-second client-side timeout during the `reviewing` state. If the API takes longer than 30 seconds, transition the slot badge to "Still reviewing… this is taking longer than usual."
- If a document is flagged, change the slot state to `flagged`, display the translated reason, and show a "Re-upload" button.
- Lock all other passed document slots if one slot is `flagged`.

---

## Implementation

1. Build `lib/ai/gemini.ts` to call the Gemini API. Construct a prompt that analyzes the document and returns JSON matching `AiReviewResponseSchema`.
2. Build a DB query in `lib/db/queries.ts` to fetch document records for an order.
3. Update `app/actions/documents.ts` (or create a new action) to trigger the AI review. Update the `documents` table with `aiReviewStatus` (`clear`, `flagged`, or `error`), `aiReviewReason`, and increment `aiReviewAttempts`.
4. If a document fails AI review 2 times (e.g. `aiReviewAttempts >= 2`), update its status to `manual_review`.
5. If all 3 documents for an order become `approved`, update the `orders` table status to `documents_under_review`.
6. Update the dashboard page to fetch the document records and pass the correct `initialStatus`, `initialFlagReason`, and cross-slot `disabled` state to the `DocumentUploadSlot` components (replacing the hardcoded `'idle'`).
7. Implement the 30-second timeout graceful degradation in the `DocumentUploadSlot` component.

---

## Dependencies

Install: `@google/genai` (if not already installed).

---

## Scope Limits

- Do NOT build the admin panel UI for manual review — keep this focused on the customer upload flow and AI integration.
- Do NOT build the admin notification system for escalation — that is covered in 11b.
- Do NOT modify the core upload logic from 10a/10b, only hook into it for the review step.

---

## Check When Done

- Dashboard fetches existing document records from the database and correctly hydrates the `initialStatus` of the slots.
- Uploaded Passports and Proofs of Address are automatically sent to Gemini for review.
- The AI response is parsed securely using Zod and updates the database.
- A 30-second client-side timeout updates the UI badge gracefully.
- A flagged document locks other approved document slots.
- After 2 failed attempts on the same document, the status escalates to `manual_review`.
- When all documents are approved, the order status transitions to `documents_under_review`.
- `npm run build` passes.
