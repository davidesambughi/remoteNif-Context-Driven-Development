# 19e — PersonalDetailsForm Refactor (Deferred)

<!-- Status: PLACEHOLDER — not ready to implement. Do not start this until explicitly handed a session with this spec. -->

---

## What This Is

Structural refactor of `components/dashboard/PersonalDetailsForm.tsx`.

The component is currently 500+ lines and manages three distinct responsibilities in a single `'use client'` component:

1. **Personal details form** — react-hook-form fields (name, DOB, nationality, passport, address)
2. **POA generation** — `poaUrl`, `isGenerating`, `poaError`, `hadPoaBefore` state + "Save and generate" flow
3. **Document upload orchestration** — three `DocumentUploadSlot` instances, cross-slot locking logic, `SlotStatus` derived state per slot

This is Quality Audit finding 5a, accepted as known debt at the time of audit.

---

## Why It Is Deferred

- The component works correctly end-to-end. There are no bugs, wrong colors, or incorrect behaviors to fix.
- The refactor is purely structural — it carries real split/wiring risk for zero user-visible benefit.
- The right time to do it is before a new document-upload feature touches this file, not as a standalone cleanup sprint.

---

## Planned Split

When this is picked up, the target structure is:

```
components/dashboard/
  PersonalDetailsForm.tsx          ← form fields + save action only (~150 lines)
  PoaGenerationSection.tsx         ← POA state + download link (~100 lines)
  DocumentUploadSection.tsx        ← slot orchestration + cross-slot locking (~150 lines)
  hooks/
    useDocumentUpload.ts           ← SlotStatus state machine per slot, extracted from form
```

`SlotStatus` is already exported from `DocumentUploadSlot.tsx` (fixed in 19c). The `useDocumentUpload` hook consolidates the per-slot state that currently lives inline in `PersonalDetailsForm`.

---

## Prerequisites Before Starting

- 19c must be complete (`SlotStatus` already exported — ✅ if 19c is done).
- Read `components/dashboard/PersonalDetailsForm.tsx` in full before touching anything.
- Write the hook (`useDocumentUpload`) first and verify it compiles before splitting the component.
- Keep a passing `npm run build` after each sub-step — do not do the full split in one commit.
- No new DB queries, Server Actions, or i18n keys are expected from this refactor.

---

## Scope

This is a structural refactor only. The following must not change:

- User-visible behavior (upload flow, POA generation, cross-slot locking, error states)
- Server Action calls (`savePersonalDetails`, `generatePoa`, `uploadDocument`)
- DB queries or data shapes
- i18n keys
- Design tokens or visual output

`npm run build` and all 423+ tests must pass without modification after the refactor.
