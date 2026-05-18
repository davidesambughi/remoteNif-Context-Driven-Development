# 10a — Storage Infrastructure & Security

Read `context/-AGENTS.md`, `context/progress-tracker.md`, `context/architecture-context.md`, `context/tech-spec.md` before starting.

Set up the Supabase Storage bucket, configure Row Level Security (RLS) policies, and implement the Server Actions for secure document upload tracking in the database.

---

## Constraints

### Tokens

(No UI work in this unit, so no tokens applied.)

### Architecture

- DB queries (inserting document records, updating `supersededAt`) go in `lib/db/queries.ts`, not inline in the action.
- `uploadDocument` Server Action goes in `app/actions/documents.ts` — thin: validate → auth → interact with DB → return.
- `createUploadUrl` Server Action goes in `app/actions/documents.ts` — thin: validate → auth → create signed URL → return.
- Storage RLS policies must restrict customers to only reading and uploading files within their own order folder (`orderId`).
- This is purely an infrastructure and backend unit. No new React components are built here.

### TypeScript

- Strict mode. No `any`. No type assertions without a comment explaining why.
- Infer types from Zod schemas with `z.infer<typeof Schema>` — no duplicate type definitions.
- Use `interface` for DB model shapes.

### Validation

```typescript
// lib/validations/documents.ts
export const UploadDocumentSchema = z.object({
  orderId: z.string().uuid(),
  type: z.enum(["passport", "proof_of_address", "signed_poa"]),
  filePath: z.string(),
  fileName: z.string(),
  fileSize: z.number().max(10 * 1024 * 1024), // 10MB
  mimeType: z.string().regex(/^(application\/pdf|image\/jpeg|image\/png)$/),
});

export const CreateUploadUrlSchema = z.object({
  orderId: z.string().uuid(),
  fileName: z.string(),
  contentType: z.string(),
});
```

---

## Implementation

1. Create a `documents` bucket in Supabase Storage using the Supabase dashboard or CLI. Make it private.

2. Configure Row Level Security (RLS) policies on the `documents` bucket:
   - Ensure users can only `INSERT` and `SELECT` objects where the path prefix matches their own `userId` or `orderId` (depending on path structure). Example structure: `documents/{userId}/{orderId}/{filename}`.
   - Admins can `SELECT` and `DELETE` all objects.

3. Add database queries in `lib/db/queries.ts`:
   - `createDocumentRecord(data: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>)` — Inserts a row into the `documents` Postgres table.
   - `supersedePreviousDocuments(orderId: string, type: 'passport' | 'proof_of_address' | 'signed_poa')` — Soft-deletes existing documents of that type by setting `supersededAt = now()`.

4. Create the Server Action `createUploadSignedUrl` in `app/actions/documents.ts`:
   - Validates input against `CreateUploadUrlSchema`.
   - Verifies auth (`requireAuth()`) and ownership of the order.
   - Generates a signed upload URL using `supabase.storage.from('documents').createSignedUploadUrl(path)`.
   - Returns the URL so the client can upload securely and directly to Supabase from the browser.

5. Create the Server Action `uploadDocument` in `app/actions/documents.ts`:
   - Validates input against `UploadDocumentSchema`.
   - Verifies auth (`requireAuth()`) and ownership of the order.
   - Calls `supersedePreviousDocuments` to mark older uploads of the same type as inactive.
   - Inserts the new document record using `createDocumentRecord` (with `aiReviewStatus: 'pending'` for passport/proof_of_address, and `approved: true` for signed_poa).
   - Returns `ActionResult<void>`.

---

## Scope Limits

- Do NOT build any frontend upload components (e.g., dropzones, progress bars). That is Feature 10b.
- Do NOT add AI document review logic. That is Feature 11.
- Keep this focused entirely on the backend: Postgres tables, Supabase Storage setup, and Server Actions.

---

## Check When Done

- The `documents` bucket exists and is private.
- RLS policies restrict storage access properly to authenticated users owning the order.
- `createUploadSignedUrl` action is defined, secure, and generates upload URLs.
- `uploadDocument` action handles metadata tracking, correctly soft-deletes prior uploads by setting `supersededAt`, and handles the instant-approval of `signed_poa`.
- `npm run build` passes.
