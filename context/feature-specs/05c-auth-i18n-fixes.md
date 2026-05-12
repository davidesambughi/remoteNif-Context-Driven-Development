# 05c — Auth i18n Fixes

Read `context/AGENTS.md`, `context/progress-tracker.md` before starting.

Fix five i18n defects in the auth layer left open after Feature 04: locale-unaware router and link imports in client form components cause post-auth redirects and internal links to strip the locale prefix on non-English locales; hardcoded English error strings in two Server Actions bypass the translation system; and the `auth` namespace in `fr.json`, `es.json`, and `de.json` contains English placeholder values instead of real translations.

---

## Constraints

### Tokens

No new UI. No token changes. All components already use correct token utilities — do not touch styling.

### Architecture

- `app/actions/auth.ts` — Server Action file. Two targeted line changes only (see Implementation steps 1–2). No structural changes.
- `components/auth/SignUpForm.tsx`, `SignInForm.tsx`, `NewPasswordForm.tsx`, `InternalSignInForm.tsx` — Client Components (`'use client'`). Import changes only — no JSX changes.
- `components/auth/RequestPasswordResetForm.tsx` — Client Component. Import change only.
- `messages/fr.json`, `es.json`, `de.json` — Replace English placeholder values in the `auth` namespace with translated values. Key structure must not change.
- No new files. No new routes. No new Server Actions. No new components.

**next-intl v4 navigation pattern (already used in this project — follow exactly):**

The project exports locale-aware navigation helpers from `@/i18n/navigation`. These automatically prepend the current locale to every `push`, `replace`, and `href`. Using `next/navigation` or `next/link` directly bypasses locale prefixing and breaks navigation on non-default locales. The correct import is:

```typescript
// Client components — use these, not next/navigation or next/link
import { useRouter, usePathname } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
```

This is already the established pattern in `LanguageSwitcher.tsx` and `MarketingHeader.tsx`. All auth form components must follow the same pattern.

### TypeScript

- Strict mode. No `any`. No type assertions.
- No new schemas or types in this feature.

### Validation

No new Zod schemas. No changes to `lib/validations/auth.ts`.

### i18n

- `messages/en.json` — add one new key: `auth.signUp.errors.emailConfirmationRequired`. No other changes to `en.json`.
- `messages/fr.json`, `es.json`, `de.json` — replace English placeholder values in the entire `auth` namespace with the translated values provided in Implementation step 5.
- Key structure must remain identical across all four locale files after this change.
- No hardcoded English strings in Server Actions or JSX — all error returns must be translation key strings.

---

## Implementation

### Step 1 — Fix hardcoded error string in `signUp` action

In `app/actions/auth.ts`, find the session guard added as a fallback for Supabase misconfiguration (the branch that fires when `data.session` is null):

```typescript
// current — hardcoded English string
return { success: false, error: 'Please confirm your email before continuing.' }
```

Replace with:

```typescript
// correct — translation key
return { success: false, error: 'auth.signUp.errors.emailConfirmationRequired' }
```

Then add the new key to `messages/en.json` under `auth.signUp.errors`:

```json
"emailConfirmationRequired": "Email confirmation is required. Please check your inbox."
```

---

### Step 2 — Fix raw `error.message` return in `updatePassword` action

In `app/actions/auth.ts`, find the error branch inside `updatePassword`:

```typescript
// current — returns raw Supabase error string (always English)
if (error) return { success: false, error: error.message }
```

Replace with:

```typescript
// correct — translation key; Supabase error detail is not user-facing
if (error) return { success: false, error: 'auth.newPassword.errors.generic' }
```

---

### Step 3 — Fix router and link imports in customer auth form components

In each of the following files, replace the `next/navigation` and `next/link` imports with the locale-aware equivalents from `@/i18n/navigation`. No other changes to these files.

**`components/auth/SignUpForm.tsx`**

Remove:
```typescript
import { useRouter } from 'next/navigation'
import Link from 'next/link'
```
Add:
```typescript
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
```

**`components/auth/SignInForm.tsx`**

Remove:
```typescript
import { useRouter } from 'next/navigation'
import Link from 'next/link'
```
Add:
```typescript
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
```

**`components/auth/RequestPasswordResetForm.tsx`**

Remove:
```typescript
import Link from 'next/link'
```
Add:
```typescript
import { Link } from '@/i18n/navigation'
```

**`components/auth/NewPasswordForm.tsx`**

Remove:
```typescript
import { useRouter } from 'next/navigation'
```
Add:
```typescript
import { useRouter } from '@/i18n/navigation'
```

---

### Step 4 — Fix router import in `InternalSignInForm`

**`components/auth/InternalSignInForm.tsx`**

Remove:
```typescript
import { useRouter } from 'next/navigation'
```
Add:
```typescript
import { useRouter } from '@/i18n/navigation'
```

No other changes. The `redirectTo` prop (already a locale-prefixed path supplied by the parent server component) passes through unchanged.

---

### Step 5 — Translate the `auth` namespace in `fr.json`, `es.json`, `de.json`

Replace the `auth` block in each file with the translations below. The key structure must be identical to `en.json`.

**`messages/fr.json` — `auth` block:**

```json
"auth": {
  "signIn": {
    "title": "Se connecter",
    "email": "Adresse e-mail",
    "password": "Mot de passe",
    "submit": "Se connecter",
    "forgotPassword": "Mot de passe oublié ?",
    "noAccount": "Pas encore de compte ?",
    "signUpLink": "S'inscrire",
    "errors": {
      "invalidCredentials": "E-mail ou mot de passe incorrect",
      "generic": "Une erreur est survenue. Veuillez réessayer.",
      "linkExpired": "Ce lien a expiré. Veuillez vous connecter et en demander un nouveau."
    }
  },
  "signUp": {
    "title": "Créer votre compte",
    "email": "Adresse e-mail",
    "password": "Mot de passe",
    "submit": "Créer un compte",
    "hasAccount": "Déjà un compte ?",
    "signInLink": "Se connecter",
    "errors": {
      "emailInUse": "Un compte avec cette adresse e-mail existe déjà.",
      "generic": "Une erreur est survenue. Veuillez réessayer.",
      "emailConfirmationRequired": "Une confirmation par e-mail est requise. Veuillez vérifier votre boîte de réception."
    }
  },
  "resetPassword": {
    "title": "Réinitialiser votre mot de passe",
    "description": "Saisissez votre e-mail et nous vous enverrons un lien de réinitialisation.",
    "email": "Adresse e-mail",
    "submit": "Envoyer le lien de réinitialisation",
    "backToSignIn": "Retour à la connexion",
    "successMessage": "Si un compte existe pour cet e-mail, vous recevrez un lien de réinitialisation sous peu.",
    "errors": {
      "linkInvalid": "Ce lien est invalide ou a expiré. Veuillez en demander un nouveau."
    }
  },
  "newPassword": {
    "title": "Définir un nouveau mot de passe",
    "password": "Nouveau mot de passe",
    "confirmPassword": "Confirmer le nouveau mot de passe",
    "submit": "Mettre à jour le mot de passe",
    "errors": {
      "passwordMismatch": "Les mots de passe ne correspondent pas",
      "generic": "Une erreur est survenue. Veuillez réessayer."
    }
  },
  "admin": {
    "signIn": {
      "title": "Connexion administrateur",
      "errors": {
        "invalidCredentials": "Identifiants administrateur invalides"
      }
    }
  },
  "operator": {
    "signIn": {
      "title": "Connexion opérateur",
      "errors": {
        "invalidCredentials": "Identifiants opérateur invalides"
      }
    }
  }
}
```

**`messages/es.json` — `auth` block:**

```json
"auth": {
  "signIn": {
    "title": "Iniciar sesión",
    "email": "Correo electrónico",
    "password": "Contraseña",
    "submit": "Iniciar sesión",
    "forgotPassword": "¿Olvidaste tu contraseña?",
    "noAccount": "¿No tienes cuenta?",
    "signUpLink": "Regístrate",
    "errors": {
      "invalidCredentials": "Correo electrónico o contraseña incorrectos",
      "generic": "Algo salió mal. Por favor, inténtalo de nuevo.",
      "linkExpired": "Este enlace ha caducado. Inicia sesión y solicita uno nuevo."
    }
  },
  "signUp": {
    "title": "Crear tu cuenta",
    "email": "Correo electrónico",
    "password": "Contraseña",
    "submit": "Crear cuenta",
    "hasAccount": "¿Ya tienes cuenta?",
    "signInLink": "Iniciar sesión",
    "errors": {
      "emailInUse": "Ya existe una cuenta con este correo electrónico.",
      "generic": "Algo salió mal. Por favor, inténtalo de nuevo.",
      "emailConfirmationRequired": "Se requiere confirmación por correo. Por favor, revisa tu bandeja de entrada."
    }
  },
  "resetPassword": {
    "title": "Restablecer contraseña",
    "description": "Introduce tu correo y te enviaremos un enlace de restablecimiento.",
    "email": "Correo electrónico",
    "submit": "Enviar enlace de restablecimiento",
    "backToSignIn": "Volver al inicio de sesión",
    "successMessage": "Si existe una cuenta para este correo, recibirás un enlace de restablecimiento en breve.",
    "errors": {
      "linkInvalid": "Este enlace no es válido o ha caducado. Solicita uno nuevo."
    }
  },
  "newPassword": {
    "title": "Establecer nueva contraseña",
    "password": "Nueva contraseña",
    "confirmPassword": "Confirmar nueva contraseña",
    "submit": "Actualizar contraseña",
    "errors": {
      "passwordMismatch": "Las contraseñas no coinciden",
      "generic": "Algo salió mal. Por favor, inténtalo de nuevo."
    }
  },
  "admin": {
    "signIn": {
      "title": "Inicio de sesión de administrador",
      "errors": {
        "invalidCredentials": "Credenciales de administrador no válidas"
      }
    }
  },
  "operator": {
    "signIn": {
      "title": "Inicio de sesión de operador",
      "errors": {
        "invalidCredentials": "Credenciales de operador no válidas"
      }
    }
  }
}
```

**`messages/de.json` — `auth` block:**

```json
"auth": {
  "signIn": {
    "title": "Anmelden",
    "email": "E-Mail-Adresse",
    "password": "Passwort",
    "submit": "Anmelden",
    "forgotPassword": "Passwort vergessen?",
    "noAccount": "Noch kein Konto?",
    "signUpLink": "Registrieren",
    "errors": {
      "invalidCredentials": "E-Mail-Adresse oder Passwort falsch",
      "generic": "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
      "linkExpired": "Dieser Link ist abgelaufen. Bitte melde dich an und fordere einen neuen an."
    }
  },
  "signUp": {
    "title": "Konto erstellen",
    "email": "E-Mail-Adresse",
    "password": "Passwort",
    "submit": "Konto erstellen",
    "hasAccount": "Bereits ein Konto?",
    "signInLink": "Anmelden",
    "errors": {
      "emailInUse": "Ein Konto mit dieser E-Mail-Adresse existiert bereits.",
      "generic": "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
      "emailConfirmationRequired": "E-Mail-Bestätigung erforderlich. Bitte prüfe deinen Posteingang."
    }
  },
  "resetPassword": {
    "title": "Passwort zurücksetzen",
    "description": "Gib deine E-Mail-Adresse ein und wir senden dir einen Reset-Link.",
    "email": "E-Mail-Adresse",
    "submit": "Reset-Link senden",
    "backToSignIn": "Zurück zur Anmeldung",
    "successMessage": "Wenn für diese E-Mail-Adresse ein Konto existiert, erhältst du in Kürze einen Reset-Link.",
    "errors": {
      "linkInvalid": "Dieser Link ist ungültig oder abgelaufen. Bitte fordere einen neuen an."
    }
  },
  "newPassword": {
    "title": "Neues Passwort festlegen",
    "password": "Neues Passwort",
    "confirmPassword": "Neues Passwort bestätigen",
    "submit": "Passwort aktualisieren",
    "errors": {
      "passwordMismatch": "Passwörter stimmen nicht überein",
      "generic": "Etwas ist schiefgelaufen. Bitte versuche es erneut."
    }
  },
  "admin": {
    "signIn": {
      "title": "Admin-Anmeldung",
      "errors": {
        "invalidCredentials": "Ungültige Admin-Anmeldedaten"
      }
    }
  },
  "operator": {
    "signIn": {
      "title": "Operator-Anmeldung",
      "errors": {
        "invalidCredentials": "Ungültige Operator-Anmeldedaten"
      }
    }
  }
}
```

---

### Step 6 — Update `context/progress-tracker.md`

Mark Feature 05c as complete. Record:
- `useRouter` and `Link` imports corrected in all five auth form components
- `updatePassword` and `signUp` hardcoded error strings replaced with translation keys
- `auth` namespace fully translated in `fr.json`, `es.json`, `de.json`
- New key `auth.signUp.errors.emailConfirmationRequired` added to all four locale files
- Current goal: Feature 06 — Pricing Page

---

## Dependencies

None. No new packages.

---

## Scope Limits

- Do not change any JSX or styling in the auth form components — import lines only.
- Do not add new translation keys beyond `auth.signUp.errors.emailConfirmationRequired`.
- Do not change the key structure of any message file — values only.
- Do not touch `proxy.ts`, `lib/supabase/proxy.ts`, `lib/auth/session.ts`, or any route files.
- Do not fix the missing `?redirectTo=` param on proxy redirects — that is a separate bug documented in Feature 04's Check When Done and will be addressed when Feature 13 (Admin Panel) updates the proxy redirect logic per the note already in the feature list.
- Do not add OAuth, magic links, or any new auth mechanism.
- Do not touch `components/ui/*`.
- Keep this focused on i18n correctness in the existing auth layer — nothing adjacent.

---

## Check When Done

- `app/actions/auth.ts` — `signUp` no longer returns a hardcoded English string; returns `'auth.signUp.errors.emailConfirmationRequired'`.
- `app/actions/auth.ts` — `updatePassword` no longer returns `error.message`; returns `'auth.newPassword.errors.generic'`.
- `components/auth/SignUpForm.tsx` — imports `useRouter` and `Link` from `@/i18n/navigation`, not from `next/navigation` or `next/link`.
- `components/auth/SignInForm.tsx` — imports `useRouter` and `Link` from `@/i18n/navigation`.
- `components/auth/RequestPasswordResetForm.tsx` — imports `Link` from `@/i18n/navigation`.
- `components/auth/NewPasswordForm.tsx` — imports `useRouter` from `@/i18n/navigation`.
- `components/auth/InternalSignInForm.tsx` — imports `useRouter` from `@/i18n/navigation`.
- `messages/en.json` — `auth.signUp.errors.emailConfirmationRequired` key exists.
- `messages/fr.json` — `auth` namespace values are French, not English.
- `messages/es.json` — `auth` namespace values are Spanish, not English.
- `messages/de.json` — `auth` namespace values are German, not English.
- All four locale files have identical `auth` key sets — no key present in `en.json` is missing from `fr`, `es`, or `de`.
- Navigating to `/fr/signin` renders French labels (Se connecter, Adresse e-mail, Mot de passe).
- Navigating to `/fr/signup` and signing up redirects to `/fr/dashboard`, not `/dashboard`.
- Navigating to `/es/signin` and clicking "¿Olvidaste tu contraseña?" goes to `/es/reset-password`, not `/reset-password`.
- `npm run build` passes with no TypeScript errors.
