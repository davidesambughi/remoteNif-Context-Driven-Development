# 11a — Switch AI Document Review from Gemini to Groq

Read `context/AGENTS.md`, `context/progress-tracker.md` before starting.

Replace the Gemini-based document review implementation with Groq (`llama-4-scout-17b-16e-instruct`), preserving the identical `reviewDocumentWithAI` interface so no callers (actions, tests, or UI) need to change.

---

## Constraints

### Architecture

- All changes are confined to `lib/ai/` and `lib/env.ts`. No changes to `app/actions/`, `lib/validations/`, `lib/db/`, components, or locale files.
- The public interface — `reviewDocumentWithAI(filePath, mimeType, documentType)` → `Promise<AiReviewResult>` — must be identical to what `lib/ai/gemini.ts` currently exports. The action imports this function by path; the path changes (rename) but the signature does not.
- Rename `lib/ai/gemini.ts` → `lib/ai/document-review.ts`. Update the single import in `app/actions/documents.ts`.
- No business logic changes. The escalation logic (2 failures → `manual_review`, `error` → `manual_review`) lives in the action and stays untouched.
- PDF handling logic belongs inside `lib/ai/document-review.ts` — not in the action, not in a separate helper file.

### TypeScript

- Strict mode. No `any`. No type assertions without a comment explaining why.
- Infer types from Zod schemas with `z.infer<typeof Schema>` — no duplicate type definitions.
- `AiReviewResult` interface stays exactly as defined in current `gemini.ts` — move it to `document-review.ts`.

### Validation

The `AiReviewResponseSchema` and `DOCUMENT_FLAG_REASON_KEYS` already exist in `lib/validations/documents.ts` — do not modify them. The new implementation must validate the Groq response through the same schema with `safeParse`, same as today. Any unexpected key or parse failure returns `{ status: 'error' }`.

---

## Implementation

1. **Install packages and remove the old one.**

   Install: `groq-sdk`, `pdfjs-dist`
   Remove: `@google/genai`

2. **Swap the env var in `lib/env.ts`.**

   - Remove `GEMINI_API_KEY: z.string().min(1)` from the Zod schema.
   - Add `GROQ_API_KEY: z.string().min(1)` in its place.
   - Update `.env.local` template comment in `tech-spec.md` (swap variable name and example value) — also update the actual `.env.local` file if it exists locally.

3. **Create `lib/ai/document-review.ts`** — full replacement for `lib/ai/gemini.ts`.

   The file must:

   a. **Export `AiReviewResult`** — identical interface (`status: 'clear' | 'flagged' | 'error'`, `reasonKey?: DocumentFlagReasonKey`).

   b. **Export `reviewDocumentWithAI(filePath, mimeType, documentType)`** — same signature as today.

   c. **Inside the function:**
      - Download the file from Supabase Storage via the admin client — identical to current code.
      - Branch on `mimeType`:
        - **`image/jpeg` or `image/png`** → encode to base64, call Groq with `image_url` content block (see format below).
        - **`application/pdf`** → extract text with `pdfjs-dist`. If extracted text is empty or extraction throws → return `{ status: 'error' }`. Otherwise call Groq with a text-only message (no image block).
      - Call `groq.chat.completions.create` with model `meta-llama/llama-4-scout-17b-16e-instruct`.
      - Strip markdown fences from the response text (same regex as current code).
      - `JSON.parse` → `AiReviewResponseSchema.safeParse` → return validated result or `{ status: 'error' }`.
      - Wrap the entire function in `try/catch` — any unhandled error returns `{ status: 'error' }`, never throws.
      - Log prefix: `[document-review]` (replaces `[gemini]`).

   **Groq image message format:**
   ```typescript
   messages: [{
     role: 'user',
     content: [
       { type: 'text', text: buildPrompt(documentType) },
       { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
     ],
   }]
   ```

   **Groq text-only message format (PDF path):**
   ```typescript
   messages: [{
     role: 'user',
     content: `${buildPrompt(documentType)}\n\nDocument text:\n${extractedText}`,
   }]
   ```

   d. **Copy `buildPrompt` verbatim** from `gemini.ts` — the prompts are model-agnostic and correct as written.

   e. **`pdfjs-dist` usage pattern:**
   ```typescript
   import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
   
   pdfjsLib.GlobalWorkerOptions.workerSrc = '' // disable worker in Node.js environment

   const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise
   let text = ''
   for (let i = 1; i <= pdf.numPages; i++) {
     const page = await pdf.getPage(i)
     const content = await page.getTextContent()
     text += content.items.map((item) => ('str' in item ? item.str : '')).join(' ')
   }
   ```

4. **Delete `lib/ai/gemini.ts`.**

5. **Update the import in `app/actions/documents.ts`.**

   Change:
   ```typescript
   import { reviewDocumentWithAI } from '@/lib/ai/gemini'
   ```
   To:
   ```typescript
   import { reviewDocumentWithAI } from '@/lib/ai/document-review'
   ```

   No other changes to `documents.ts`.

6. **Update `context/progress-tracker.md`.**

   - Mark Feature 11a as complete under "Completed".
   - Remove it from "In Progress".
   - Note the provider swap and the PDF text-extraction strategy.

---

## Dependencies

Install: `groq-sdk`, `pdfjs-dist`
Remove: `@google/genai`

---

## Scope Limits

- Do not change `app/actions/documents.ts` beyond the single import path update.
- Do not change `lib/validations/documents.ts` — `AiReviewResponseSchema`, `DOCUMENT_FLAG_REASON_KEYS`, and the `AiReviewResponse` type stay as-is.
- Do not change any UI components, dashboard page, or locale files — the flag reason keys and their translations are already in place.
- Do not add image-to-JPEG conversion for PDFs (e.g. `pdf2pic`) — `pdfjs-dist` text extraction is the chosen strategy. Scanned/image-only PDFs fall through to `{ status: 'error' }` → `manual_review`, which is the correct and documented behavior.
- Do not add retry logic or rate-limit handling — not needed at current scale.
- Do not add tests in this unit — test coverage is Feature 12a-T.

---

## Check When Done

- `lib/ai/gemini.ts` no longer exists.
- `lib/ai/document-review.ts` exists and exports `reviewDocumentWithAI` and `AiReviewResult`.
- `lib/env.ts` has `GROQ_API_KEY`, not `GEMINI_API_KEY`.
- `app/actions/documents.ts` imports from `@/lib/ai/document-review`.
- `@google/genai` is absent from `package.json`.
- `groq-sdk` and `pdfjs-dist` are present in `package.json`.
- `npm run build` passes.
- tsc --noEmit passes with no type errors (verifying strict mode, no any, and inferred Zod types).

- The .env.local template in tech-spec.md has been successfully updated to show GROQ_API_KEY.

- The pdfjs-dist worker is explicitly disabled (pdfjsLib.GlobalWorkerOptions.workerSrc = '') to prevent Node.js environment crashes.

- All unhandled errors and empty PDF text extractions inside reviewDocumentWithAI are caught and return { status: 'error' } without throwing.

- The Zod schema AiReviewResponseSchema.safeParse is actively used to validate the parsed Groq response.

- The exported function signature remains exactly reviewDocumentWithAI(filePath, mimeType, documentType) with no missing or added parameters.
