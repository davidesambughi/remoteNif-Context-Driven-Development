# UI Context — RemoteNIF v2

All colors are defined as CSS custom properties in `globals.css` and mapped to Tailwind via `@theme inline`. Components must use these tokens — never hardcoded values or raw Tailwind color classes. Use `shadcn/ui` via CLI only; never modify source files in `components/ui/`.

## Color Tokens

| Role | CSS Variable | OKLCH Value |
| :--- | :--- | :--- |
| Page canvas | `--bg-base` | `oklch(98% 0.006 264)` |
| Cards, forms | `--bg-surface` | `oklch(100% 0 0)` |
| Modals, dropdowns | `--bg-elevated` | `oklch(100% 0 0)` |
| Muted sections | `--bg-subtle` | `oklch(93% 0.04 250)` |
| Headings, body | `--text-primary` | `oklch(22% 0.04 264)` |
| Labels, support | `--text-secondary` | `oklch(45% 0.03 264)` |
| Placeholders, inactive | `--text-muted` | `oklch(62% 0.02 264)` |
| Text on colored bg | `--text-on-accent` | `oklch(100% 0 0)` |
| Dividers | `--border-subtle` | `oklch(96% 0.008 264)` |
| Cards, inputs | `--border-default` | `oklch(92% 0.01 264)` |
| Selected, focused | `--border-strong` | `oklch(22% 0.04 264)` |
| Primary CTAs | `--brand-primary` | `oklch(60% 0.16 250)` |
| Hover, selected bg | `--brand-primary-dim` | `oklch(93% 0.04 250)` |
| Secondary accents | `--brand-secondary` | `oklch(55% 0.18 275)` |
| Success / Clear | `--status-success` | `oklch(70% 0.14 165)` |
| Warning / Flagged | `--status-warning` | `oklch(78% 0.13 75)` |
| Error / Destructive | `--status-error` | `oklch(62% 0.18 25)` |
| Informational | `--status-info` | `oklch(72% 0.11 230)` |

## Typography

| Role | Font |
| :--- | :--- |
| UI text | Inter — loaded via `next/font/google`, applied as `--font-sans` on `<html>` |
| Code, NIF numbers, IDs | JetBrains Mono — `--font-mono` |

## Border Radius

| Context | Token |
| :--- | :--- |
| Badges, inline elements | `--radius-sm` (6px) |
| Inputs, buttons | `--radius-md` (8px) |
| Cards, panels | `--radius-lg` (12px) |
| Large cards | `--radius-xl` (16px) |
| Modals, sheets | `--radius-2xl` (24px) |
| Pills, avatars | `--radius-full` (9999px) |

## Shadows

| Context | Token |
| :--- | :--- |
| Subtle lift | `--shadow-sm` |
| Cards | `--shadow-md` |
| Dropdowns | `--shadow-lg` |
| Modals, overlays | `--shadow-xl` |

## Transitions

| Token | Value |
| :--- | :--- |
| `--transition-fast` | 150ms ease |
| `--transition-base` | 200ms ease |
| `--transition-slow` | 300ms ease |
| `--transition-smooth` | 300ms cubic-bezier(0.4, 0, 0.2, 1) |

## Icons

Lucide React, stroke-based only. Sizes: inline `h-4 w-4`, buttons `h-5 w-5`, feature `h-6 w-6`, hero `h-8 w-8`.

## Product-Specific Rules

**Checkout tier selection:** selected card uses `--border-strong` + `--shadow-md`. Unselected cards use `--bg-subtle` on hover.

**Timeline steps:**
- Completed: `--status-success` icon + `--text-primary` label
- Current: `--brand-primary` icon + `--text-primary` label
- Future: `--text-muted` icon + `--text-muted` label

**Copy tone:** precise and legal-safe ("Typically 5–10 business days"), never marketing language. AI document flags must state the exact issue. Upload states transition visually: `Uploading` → `Reviewing...` → `Approved / Flagged`.
