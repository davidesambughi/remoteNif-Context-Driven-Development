# 19e2 — PersonalDetailsForm: Section Split (No Hook)

<!-- Read before starting: context/AGENTS.md, context/progress-tracker.md, context/architecture-context.md, context/code-standards.md -->

Structural split of `components/dashboard/PersonalDetailsForm.tsx` (528 lines, three distinct concerns in one file) into three focused files. No behaviour changes. No new state management strategy — the parent retains all cross-cutting state and orchestration logic. The two extracted components are intentionally thin: they exist for navigability and concern separation, not to introduce new abstractions.

---

## Why This Split (and Why No Hook)

The three concerns that motivate splitting are:
1. **Form fields + save flow** — react-hook-form, Zod, `savePersonalDetails` action
2. **POA generation** — `generatePoa` action, download link, generate button, four sub-states
3. **Upload slot rendering** — mapping computed slot definitions to `DocumentUploadSlot` instances

The cross-cutting state (`isSaved`, `poaUrl`, `slotStatuses`, `hasFlaggedSlot`) belongs to the parent because it drives all three concerns simultaneously: `isSaved` gates both the POA section and all upload slots; `poaUrl` gates the signed POA slot specifically; `hasFlaggedSlot` locks approved slots across all three. Lifting this state or introducing a coordination hook would add indirection without removing complexity — the parent still needs to produce the same outputs. The split is about file size and locating-code-quickly, not about reducing coupling that isn't there.

---

## Constraints

### Architecture

- `PersonalDetailsForm.tsx` retains `'use client'`. Both extracted components are also `'use client'` (they receive callbacks and use hooks via their parent's rendered tree).
- No new Server Actions. No new DB queries. No new API routes.
- All three files stay in `components/dashboard/`. No new subdirectories.
- `SlotDefinition` is a new internal type — define it in `DocumentUploadSection.tsx` and re-export it from there so `PersonalDetailsForm.tsx` can import it without a cross-file circular ref.
- `deriveSlotStatus` helper stays in `PersonalDetailsForm.tsx` — it is only used during slot computation in the parent.
- `countryName` helper stays in `PersonalDetailsForm.tsx` — it is only used in the summary `<dl>`.

### TypeScript

- Strict mode. No `any`.
- `PoaGenerationSectionProps` and `DocumentUploadSectionProps` are declared as `interface` in their respective files.
- `SlotDefinition` is declared as `interface` in `DocumentUploadSection.tsx` and re-exported.
- No type is duplicated — if `PersonalDetailsForm.tsx` needs `SlotDefinition`, it imports it from `DocumentUploadSection`.
- `SlotStatus` and `DocumentRecord` are already imported (fixed in 19c) — do not re-introduce local definitions.

### Validation

No Zod schema changes.

### i18n

No translation key changes. All `useTranslations('personalDetails')` calls stay in `PersonalDetailsForm.tsx` — translation values are passed as plain strings (already resolved) into the extracted components via props. The sections do not call `useTranslations` directly.

---

## Target File Structure

```
components/dashboard/
  PersonalDetailsForm.tsx          ← parent: all state, handlers, form view, summary view shells (~200 lines)
  PoaGenerationSection.tsx         ← POA UI: heading, description, regenerate notice, download/generate button (~70 lines)
  DocumentUploadSection.tsx        ← slot render loop + SlotDefinition type (~35 lines)
```

---

## Prop Contracts

### `PoaGenerationSection`

```typescript
interface PoaGenerationSectionProps {
  // Current signed URL — null if not yet generated or cleared after Edit click
  poaUrl: string | null
  // True while generatePoa Server Action is in-flight
  isGenerating: boolean
  // True if last generatePoa call returned a failure
  poaError: boolean
  // True when the user edited personal details after a POA had been generated —
  // triggers the "regenerate needed" notice
  hadPoaBefore: boolean
  // Fires when the user clicks the generate/regenerate button
  onGenerate: () => void
  // Resolved translation strings — parent calls t(...) and passes results
  // so this component does not need its own useTranslations call
  labels: {
    sectionTitle: string
    sectionDescription: string
    regenerateNote: string
    ready: string
    downloadButton: string
    generating: string
    generateButton: string
    error: string
  }
}
```

### `DocumentUploadSection`

```typescript
// Re-exported so PersonalDetailsForm can import it
export interface SlotDefinition {
  id: string
  type: 'passport' | 'proof_of_address' | 'signed_poa'
  label: string
  description: string
  disabled: boolean
  disabledReason: 'details' | 'poa' | null
  // Pre-computed by parent — avoids passing documentRecords into this component
  initialStatus: SlotStatus
  initialFlagReason: string | null
}

interface DocumentUploadSectionProps {
  orderId: string
  // Fully computed by parent — disabled, disabledReason, initialStatus, initialFlagReason
  // are all resolved before being passed here
  slots: SlotDefinition[]
  onSlotStatusChange: (type: DocumentType, status: SlotStatus) => void
}
```

> **Key point:** The parent pre-computes every field on `SlotDefinition` (including `initialStatus` and `initialFlagReason`). `DocumentUploadSection` has no access to `documentRecords` or `deriveSlotStatus` — it only maps the pre-computed definitions to `DocumentUploadSlot` components.

---

## Implementation

Work in three steps. Verify `npm run build` passes after each step before proceeding.

---

### Step 1 — Extract `DocumentUploadSection`

This is the simplest extraction. Start here to prove the approach builds cleanly.

**Create `components/dashboard/DocumentUploadSection.tsx`.**

The file contains:
- The `'use client'` directive
- Imports: `DocumentUploadSlot` and `SlotStatus` from `./DocumentUploadSlot`
- The `SlotDefinition` interface (exported)
- The `DocumentUploadSectionProps` interface (not exported)
- A single functional component that maps `props.slots` to `<DocumentUploadSlot>` instances

The render output is identical to the current render of the `<div className="space-y-[length:var(--space-3)]">` block in both branches of `PersonalDetailsForm.tsx`.

`onStatusChange` in each slot calls `props.onSlotStatusChange(slot.type, status)`.

**Update `PersonalDetailsForm.tsx`:**

1. Add `import { DocumentUploadSection } from './DocumentUploadSection'`
2. Add `import type { SlotDefinition } from './DocumentUploadSection'`
3. Type the existing `slots` array as `SlotDefinition[]`
4. Move `initialStatus` and `initialFlagReason` computation into the `slots` array definition (they are currently in the JSX inline; move them up into the array). Each slot entry gains two new fields:
   ```typescript
   initialStatus: deriveSlotStatus(documentRecords.find((d) => d.type === 'passport')),
   initialFlagReason: documentRecords.find((d) => d.type === 'passport')?.aiReviewReason ?? null,
   ```
5. Replace both occurrences of the slot render `<div className="space-y-[length:var(--space-3)]">...</div>` blocks with:
   ```tsx
   <DocumentUploadSection
     orderId={orderId}
     slots={slots}
     onSlotStatusChange={handleSlotStatusChange}
   />
   ```
   There are two occurrences — one in the saved view, one in the editing view. Both are replaced with the same component call.

**Verify:** `npm run build` passes. The visual output is identical — two render branches still exist, upload slots still appear in both.

---

### Step 2 — Extract `PoaGenerationSection`

**Create `components/dashboard/PoaGenerationSection.tsx`.**

The file contains:
- The `'use client'` directive
- Imports: `Loader2`, `CheckCircle2`, `Download`, `FileText` from `lucide-react`; `Button` from `@/components/ui/button`
- The `PoaGenerationSectionProps` interface (not exported)
- A single functional component

The render output is identical to the current `<div className="mt-6 pt-6 border-t border-border-default">` block inside the saved card's `CardContent`. This includes:
- The section heading row (FileText icon + title)
- The section description paragraph
- The regenerate notice (conditional on `hadPoaBefore && !poaUrl`)
- The "POA ready" branch: CheckCircle2 icon + "ready" text + download Button
- The "generate" branch: optional error text + generate/generating Button

The component receives all display strings pre-resolved via `props.labels` — no `useTranslations` call.

**Update `PersonalDetailsForm.tsx`:**

1. Add `import { PoaGenerationSection } from './PoaGenerationSection'`
2. Build the `labels` object once, near the top of the component (after the `t = useTranslations(...)` call):
   ```typescript
   const poaLabels = {
     sectionTitle: t('poa.sectionTitle'),
     sectionDescription: t('poa.sectionDescription'),
     regenerateNote: t('poa.regenerateNote'),
     ready: t('poa.ready'),
     downloadButton: t('poa.downloadButton'),
     generating: t('poa.generating'),
     generateButton: t('poa.generateButton'),
     error: t('poa.error'),
   }
   ```
3. Replace the `<div className="mt-6 pt-6 border-t border-border-default">...</div>` block inside `CardContent` with:
   ```tsx
   <PoaGenerationSection
     poaUrl={poaUrl}
     isGenerating={isGenerating}
     poaError={poaError}
     hadPoaBefore={hadPoaBefore}
     onGenerate={handleGenerate}
     labels={poaLabels}
   />
   ```
4. The divider wrapper (`<div className="mt-6 pt-6 border-t border-border-default">`) stays in `PersonalDetailsForm.tsx` around the component — it is layout, not POA logic.

**Verify:** `npm run build` passes. The saved card view is visually unchanged.

---

### Step 3 — Clean up `PersonalDetailsForm.tsx`

After the two extractions, audit the parent for anything that can be removed or clarified:

- Remove any imports that are no longer used after moving JSX to the extracted components (`FileText`, `Download` from lucide-react — verify they are no longer referenced; `CheckCircle2` is still used in the summary card header, keep it).
- Confirm `handleGenerate` and `handleEditClick` remain in the parent — they update parent state and must stay here.
- Confirm `slotStatuses`, `hasFlaggedSlot`, `poaUrl`, `hadPoaBefore` all remain in the parent — they drive the `slots` array and `DocumentUploadSection` props.
- Add a short block comment above each section: `// --- State ---`, `// --- Derived values ---`, `// --- Slot definitions ---`, `// --- Handlers ---`. These are for navigability only — do not reorganize code, just label the existing groups.
- Verify `DocumentRecord` and `SlotStatus` are still imported (not re-declared).

**Verify:** `npm run build` passes.

---

### Step 4 — Update progress tracker

After all three steps are complete and `npm run build` passes:

1. Update `context/progress-tracker.md` — mark 19e2 complete in the Completed section.
2. Note that `PersonalDetailsForm.tsx` was split into three files: `PersonalDetailsForm.tsx` (parent/orchestrator), `PoaGenerationSection.tsx`, `DocumentUploadSection.tsx`.
3. Note that no behaviour, actions, translations, or DB queries were changed.

---

## Dependencies

No new packages.

---

## Scope Limits

- Do not touch `DocumentUploadSlot.tsx` — it is a self-contained component and is not part of this refactor.
- Do not move `handleGenerate` into `PoaGenerationSection` — it calls a Server Action and updates parent state that other sections depend on (`poaUrl`). Keeping it in the parent is intentional.
- Do not move `slotStatuses` or `hasFlaggedSlot` into `DocumentUploadSection` — the parent owns cross-slot coordination. The section is a renderer only.
- Do not add a `hooks/` directory or extract a `useDocumentUpload` hook — the coordination logic is ~30 lines in the parent and does not benefit from extraction. This was an explicit decision when writing this spec.
- Do not add new shadcn components, design tokens, or Tailwind utilities.
- Do not change any Server Action call signatures (`savePersonalDetails`, `generatePoa`, `uploadDocument`).
- Do not add or modify any i18n keys.
- Do not add new tests — no logic changes in this unit. All 436 existing tests cover the affected actions and components and must still pass without modification.
- Do not touch any admin, operator, or auth components.

---

## Check When Done

- `components/dashboard/PoaGenerationSection.tsx` exists. It has no `useTranslations` call. It has no Server Action import. It renders the POA download link and generate button states based solely on its props.
- `components/dashboard/DocumentUploadSection.tsx` exists. It exports `SlotDefinition`. It has no reference to `documentRecords`, `deriveSlotStatus`, `isSaved`, or `poaUrl`. It only maps `props.slots` to `<DocumentUploadSlot>` instances.
- `components/dashboard/PersonalDetailsForm.tsx` imports `PoaGenerationSection` and `DocumentUploadSection`. It does not re-declare `SlotStatus` or `DocumentRecord` locally (both are imported — fixed in 19c).
- The `slots` array in `PersonalDetailsForm.tsx` is typed as `SlotDefinition[]` and every entry includes `initialStatus` and `initialFlagReason` (moved up from inline JSX).
- Both render branches (saved view and editing view) use `<DocumentUploadSection>` — the raw slot map loop no longer appears in `PersonalDetailsForm.tsx`.
- The saved view uses `<PoaGenerationSection>` inside the divider wrapper — the raw POA JSX block no longer appears in `PersonalDetailsForm.tsx`.
- No `useTranslations` call in either extracted component.
- `npm run build` passes.
- `npx vitest run` passes (436 tests — no new tests added, no existing tests modified).
- User-visible behaviour is unchanged: saved/editing toggle, POA generation flow, upload slot disabling, cross-slot locking all work as before.
