# 05b — Marketing Home (Localization)

Read `context/AGENTS.md`, `context/progress-tracker.md` before starting.

Replace the English placeholder strings in `fr.json`, `es.json`, and `de.json` with translated copy covering the `home` and `common` namespaces, and fix the copyright year across all four locale files.

---

## Constraints

### Architecture

- One new file: `i18n/types.ts` (the `AppConfig` declaration — see step 1).
- All other changes are message files only — no component changes, no new routes, no Server Actions.
- `LanguageSwitcher`, locale routing, and proxy are already correct — do not touch them.
- next-intl v4 locale cookies are now session-only and set only when the user switches away from their `Accept-Language` header default. This is already the correct behavior — no config change needed.

**v4 type safety gap (must fix in this feature):**
next-intl v4 requires an `AppConfig` interface declaration so that `useTranslations()` knows the message key shape at compile time. Without it, any string passes as a translation key — TypeScript cannot catch missing or misspelled keys. The `Locale` type is already exported from `i18n/routing.ts`. The `Messages` type comes from the English message file (source of truth for key structure). This declaration must exist before subsequent features add new translation keys — 05b is the right place to add it.

### TypeScript

- Strict mode. No `any`.
- No code changes in this feature — TypeScript does not apply.

### Validation

No forms or API input. No Zod schemas needed.

### i18n

- All changes are in `messages/*.json` only.
- Key structure must be identical across all four locale files — same keys, different values.
- No key additions or removals — only value replacements (and the copyright year fix).
- Do not translate the `auth` namespace in this feature — auth page translations are out of scope (see Scope Limits).
- Do not use ICU interpolation syntax unless the English source string also uses it — keep parity of message shape across locales.
- Translations in this spec are AI-generated starting points. They are correct enough to ship for development and staging. Require native speaker review before production launch (per PRD section 7 Localization constraint).

---

## Implementation

1. Create `i18n/types.ts` with the next-intl v4 `AppConfig` type augmentation:

```typescript
// Registers message key shapes and locale type with next-intl v4's type system.
// useTranslations() will error at compile time for missing or misspelled keys.
import type { routing } from './routing'
import type en from '../messages/en.json'

declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number]
    Messages: typeof en
  }
}
```

2. In `messages/fr.json`, replace every value under `home` and `common` with the French translations below. Do not touch `auth`.

```json
"common": {
  "appName": "RemoteNIF",
  "nav": {
    "signIn": "Se connecter",
    "getStarted": "Commencer"
  },
  "footer": {
    "copyright": "© 2026 RemoteNIF Portugal. Traitement NIF sécurisé et transparent.",
    "pricing": "Tarifs",
    "process": "Processus",
    "terms": "Conditions d'utilisation",
    "privacy": "Politique de confidentialité"
  }
},
"home": {
  "hero": {
    "headline": "Obtenez Votre NIF Portugais en Ligne — Rapide, Transparent, Fiable",
    "subheadline": "Aucun frais caché. Aucune surprise. Choisissez le forfait adapté à votre délai. Commencez votre parcours portugais avec confiance.",
    "cta": "Commencer",
    "learnMore": "En savoir plus",
    "stat1Value": "Dès €79",
    "stat1Label": "Prix transparents",
    "stat2Value": "5 jours",
    "stat2Label": "Livraison standard",
    "stat3Value": "48h",
    "stat3Label": "Option Express",
    "stat4Value": "Zéro",
    "stat4Label": "Frais cachés"
  },
  "howItWorks": {
    "title": "Un Processus Transparent en 3 Étapes",
    "subtitle": "Obtenir votre identification fiscale portugaise ne devrait pas être un labyrinthe. Nous avons simplifié la complexité en trois étapes claires.",
    "step1Number": "01",
    "step1Title": "Choisissez Votre Forfait",
    "step1Description": "Choisissez entre Essentiel, Standard ou Express selon votre délai. Les tarifs sont clairs dès le départ — aucune surprise.",
    "step2Number": "02",
    "step2Title": "Téléversez Vos Documents",
    "step2Description": "Téléversez votre passeport et justificatif de domicile. Notre système les vérifie automatiquement pour éviter tout retard.",
    "step3Number": "03",
    "step3Title": "Recevez Votre NIF",
    "step3Description": "Votre numéro NIF est livré sur votre tableau de bord sécurisé. Utilisez-le pour vos achats immobiliers, comptes bancaires et plus encore."
  },
  "faq": {
    "title": "Foire Aux Questions",
    "subtitle": "Tout ce que vous devez savoir sur le processus.",
    "q1": "Combien de temps prend le processus ?",
    "a1": "Les commandes Standard prennent 5 à 10 jours ouvrables à partir de l'approbation des documents. Les commandes Express sont soumises à la Finanças dans les 48 heures suivant l'approbation. Le délai de traitement par la Finanças après soumission est hors de notre contrôle.",
    "q2": "Dois-je être au Portugal ?",
    "a2": "Non. L'ensemble du processus est à distance. Nous agissons comme votre représentant fiscal au Portugal et soumettons la demande à la Finanças en votre nom.",
    "q3": "Quels documents sont requis ?",
    "a3": "Vous avez besoin d'un passeport valide et d'un justificatif de domicile datant de moins de 3 mois (facture d'énergie, relevé bancaire ou contrat de location). Les factures de téléphone et de télévision ne sont pas acceptées.",
    "q4": "Ai-je besoin d'un représentant fiscal ?",
    "a4": "Les résidents hors UE ont actuellement besoin d'un représentant fiscal agréé pour demander un NIF. Il est inclus dans les forfaits Standard et Express. Les citoyens de l'UE peuvent faire la demande sans représentant via notre forfait Essentiel.",
    "q5": "Qu'est-ce qui change en juillet 2026 ?",
    "a5": "La loi portugaise change le 1er juillet 2026 : les résidents hors UE sans obligations fiscales au Portugal ne seront plus légalement tenus de nommer un représentant fiscal. Nous mettrons à jour nos forfaits et tarifs en conséquence. Les clients Standard et Express seront prévenus à l'avance."
  }
}
```

3. In `messages/es.json`, replace every value under `home` and `common` with the Spanish translations below. Do not touch `auth`.

```json
"common": {
  "appName": "RemoteNIF",
  "nav": {
    "signIn": "Iniciar sesión",
    "getStarted": "Empezar"
  },
  "footer": {
    "copyright": "© 2026 RemoteNIF Portugal. Tramitación de NIF segura y transparente.",
    "pricing": "Precios",
    "process": "Proceso",
    "terms": "Términos de servicio",
    "privacy": "Política de privacidad"
  }
},
"home": {
  "hero": {
    "headline": "Obtén tu NIF Portugués Online — Rápido, Transparente, Fiable",
    "subheadline": "Sin cargos ocultos. Sin sorpresas. Elige el plan que se adapta a tu plazo. Comienza tu camino portugués con confianza.",
    "cta": "Empezar",
    "learnMore": "Saber más",
    "stat1Value": "Desde €79",
    "stat1Label": "Precios transparentes",
    "stat2Value": "5 días",
    "stat2Label": "Entrega estándar",
    "stat3Value": "48h",
    "stat3Label": "Opción Express",
    "stat4Value": "Cero",
    "stat4Label": "Cargos ocultos"
  },
  "howItWorks": {
    "title": "Un Proceso Transparente en 3 Pasos",
    "subtitle": "Obtener tu identificación fiscal portuguesa no tiene por qué ser un laberinto. Hemos simplificado la complejidad en tres etapas claras.",
    "step1Number": "01",
    "step1Title": "Elige Tu Plan",
    "step1Description": "Selecciona entre Esencial, Estándar o Express según tu plazo. Los precios son claros desde el principio — sin sorpresas.",
    "step2Number": "02",
    "step2Title": "Sube Tus Documentos",
    "step2Description": "Sube tu pasaporte y comprobante de domicilio. Nuestro sistema los revisa automáticamente para evitar retrasos.",
    "step3Number": "03",
    "step3Title": "Recibe Tu NIF",
    "step3Description": "Tu número NIF se entrega en tu panel de control seguro. Úsalo para compras de propiedades, cuentas bancarias y más."
  },
  "faq": {
    "title": "Preguntas Frecuentes",
    "subtitle": "Todo lo que necesitas saber sobre el proceso.",
    "q1": "¿Cuánto tiempo tarda el proceso?",
    "a1": "Los pedidos Estándar tardan entre 5 y 10 días hábiles desde la aprobación de documentos. Los pedidos Express se presentan a la Finanças en un plazo de 48 horas tras la aprobación. El tiempo de procesamiento de la Finanças tras la presentación está fuera de nuestro control.",
    "q2": "¿Necesito estar en Portugal?",
    "a2": "No. Todo el proceso es remoto. Actuamos como tu representante fiscal en Portugal y presentamos la solicitud a la Finanças en tu nombre.",
    "q3": "¿Qué documentos se requieren?",
    "a3": "Necesitas un pasaporte válido y un comprobante de domicilio con fecha de menos de 3 meses (factura de suministros, extracto bancario o contrato de alquiler). No se aceptan facturas de teléfono ni televisión.",
    "q4": "¿Necesito un representante fiscal?",
    "a4": "Los residentes de fuera de la UE necesitan actualmente un representante fiscal autorizado para solicitar un NIF. Está incluido en los planes Estándar y Express. Los ciudadanos de la UE pueden solicitarlo sin representante usando nuestro plan Esencial.",
    "q5": "¿Qué cambia en julio de 2026?",
    "a5": "La ley portuguesa cambia el 1 de julio de 2026: los residentes de fuera de la UE sin obligaciones fiscales en Portugal ya no estarán legalmente obligados a nombrar un representante fiscal. Actualizaremos nuestros planes y precios en consecuencia. Los clientes Estándar y Express serán notificados con antelación."
  }
}
```

4. In `messages/de.json`, replace every value under `home` and `common` with the German translations below. Do not touch `auth`.

```json
"common": {
  "appName": "RemoteNIF",
  "nav": {
    "signIn": "Anmelden",
    "getStarted": "Jetzt starten"
  },
  "footer": {
    "copyright": "© 2026 RemoteNIF Portugal. Sichere & transparente NIF-Bearbeitung.",
    "pricing": "Preise",
    "process": "Prozess",
    "terms": "Nutzungsbedingungen",
    "privacy": "Datenschutzrichtlinie"
  }
},
"home": {
  "hero": {
    "headline": "Holen Sie sich Ihren Portugiesischen NIF Online — Schnell, Transparent, Zuverlässig",
    "subheadline": "Keine versteckten Gebühren. Keine Überraschungen. Wählen Sie das Paket, das Ihrem Zeitplan entspricht. Starten Sie Ihr portugiesisches Vorhaben mit Vertrauen.",
    "cta": "Jetzt starten",
    "learnMore": "Mehr erfahren",
    "stat1Value": "Ab €79",
    "stat1Label": "Transparente Preise",
    "stat2Value": "5 Tage",
    "stat2Label": "Standardlieferung",
    "stat3Value": "48h",
    "stat3Label": "Express-Option",
    "stat4Value": "Null",
    "stat4Label": "Versteckte Gebühren"
  },
  "howItWorks": {
    "title": "Ein Transparenter 3-Schritte-Prozess",
    "subtitle": "Ihre portugiesische Steueridentifikationsnummer zu erhalten, sollte kein Labyrinth sein. Wir haben die Komplexität auf drei einfache Schritte reduziert.",
    "step1Number": "01",
    "step1Title": "Paket Wählen",
    "step1Description": "Wählen Sie zwischen Essential, Standard oder Express basierend auf Ihrem Zeitplan. Die Preise sind von Anfang an klar — keine Überraschungen.",
    "step2Number": "02",
    "step2Title": "Dokumente Hochladen",
    "step2Description": "Laden Sie Ihren Reisepass und Adressnachweis hoch. Unser System prüft diese automatisch, um Verzögerungen zu vermeiden.",
    "step3Number": "03",
    "step3Title": "NIF Erhalten",
    "step3Description": "Ihre NIF-Nummer wird in Ihrem sicheren Dashboard angezeigt. Verwenden Sie sie für Immobilienkäufe, Bankkonten und mehr."
  },
  "faq": {
    "title": "Häufig Gestellte Fragen",
    "subtitle": "Alles, was Sie über den Prozess wissen müssen.",
    "q1": "Wie lange dauert der Prozess?",
    "a1": "Standardbestellungen dauern 5–10 Werktage ab der Dokumentengenehmigung. Express-Bestellungen werden innerhalb von 48 Stunden nach der Genehmigung bei der Finanças eingereicht. Die Bearbeitungszeit der Finanças nach der Einreichung liegt außerhalb unserer Kontrolle.",
    "q2": "Muss ich in Portugal sein?",
    "a2": "Nein. Der gesamte Prozess erfolgt aus der Ferne. Wir agieren als Ihr steuerlicher Vertreter in Portugal und reichen den Antrag bei der Finanças in Ihrem Namen ein.",
    "q3": "Welche Dokumente werden benötigt?",
    "a3": "Sie benötigen einen gültigen Reisepass und einen Adressnachweis, der nicht älter als 3 Monate ist (Stromrechnung, Kontoauszug oder Mietvertrag). Telefon- und TV-Rechnungen werden nicht akzeptiert.",
    "q4": "Brauche ich einen steuerlichen Vertreter?",
    "a4": "Nicht-EU-Bürger benötigen derzeit einen zugelassenen steuerlichen Vertreter, um einen NIF zu beantragen. Dieser ist in den Standard- und Express-Paketen enthalten. EU-Bürger können ihn ohne Vertreter über unser Essential-Paket beantragen.",
    "q5": "Was ändert sich im Juli 2026?",
    "a5": "Das portugiesische Gesetz ändert sich am 1. Juli 2026: Nicht-EU-Bürger ohne portugiesische Steuerpflichten sind nicht mehr gesetzlich verpflichtet, einen steuerlichen Vertreter zu benennen. Wir werden unsere Pakete und Preise entsprechend aktualisieren. Standard- und Express-Kunden werden im Voraus informiert."
  }
}
```

5. In `messages/en.json`, fix the copyright year in `common.footer.copyright`: change `"© 2024 RemoteNIF Portugal. Secure & Transparent NIF Processing."` to `"© 2026 RemoteNIF Portugal. Secure & Transparent NIF Processing."`.

6. Run `npm run build` and confirm it passes with no TypeScript or missing-key errors.

---

## Dependencies

None. No new packages.

---

## Scope Limits

- Do not translate the `auth` namespace — auth page translations are a separate concern, not part of homepage localization.
- Do not change any component files (`components/`, `app/`) — this is message files only.
- Do not change the `LanguageSwitcher` or locale routing — they are already correct for next-intl v4.
- Do not add new i18n keys that don't already exist in `en.json` — key additions belong in the feature that introduces the new UI.
- Do not add ICU plural or date formatting syntax unless the English source already uses it.
- Do not refactor the key structure (e.g. flattening `home.hero.*` into arrays) — consistency with the existing shape takes priority.

---

## Check When Done

- `i18n/types.ts` exists and declares `AppConfig` with `Locale` and `Messages`.
- `messages/fr.json` `home` and `common` values are French (not English placeholder).
- `messages/es.json` `home` and `common` values are Spanish (not English placeholder).
- `messages/de.json` `home` and `common` values are German (not English placeholder).
- All four locale files have identical key sets — no key present in `en.json` is missing from `fr`, `es`, or `de`.
- Copyright year is `2026` in all four locale files.
- `/fr` loads and displays French copy (headline, FAQ titles, footer links).
- `/es` loads and displays Spanish copy.
- `/de` loads and displays German copy.
- Switching locale via the `LanguageSwitcher` on `/` navigates to the correct locale URL and renders translated content.
- `npm run build` passes with no TypeScript errors on translation key usage.
