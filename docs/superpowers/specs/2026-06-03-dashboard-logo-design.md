# Design Doc: Customer Dashboard Logo Replacement

**Topic:** Replace text brand link with logo image in `DashboardHeader.tsx`.
**Date:** 2026-06-03
**Status:** Draft

## Context
The customer dashboard header currently uses a text link (`t('appName')`) to return to the homepage. The user wants to replace this with the company logo (`/images/logo.png`).

## Proposed Changes
- Import `Image` from `next/image`.
- Update `DashboardHeader.tsx` to replace the text within the brand `<Link>` with an `<Image>` component.
- Use styling consistent with `AdminLayout` and `OperatorLayout`: `h-24`, `w-auto`, and `[mix-blend-mode:multiply]`.
- Ensure the header container handles potential overflow if the logo height exceeds the header height, matching the `Admin`/`Operator` pattern if necessary.

## Success Criteria
- The logo image is displayed in the dashboard header.
- The logo is a functional link to the homepage (`/`).
- The implementation uses `next/image` as per code standards.
- The logo styling is consistent with other parts of the application.

## Testing Strategy
- Visual verification (manual).
- Ensure the link still works as expected.
- Check that the logo doesn't break the header layout on different screen sizes.
