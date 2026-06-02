# Handoff — revisione tesi

## Stato attuale

Revisione capitolo per capitolo in corso. Obiettivo: allineare ogni capitolo al frame corretto (vedi `essenza-progetto.md`).

---

## Capitoli completati

| Capitolo | Stato | Note |
|---|---|---|
| Cap. 1 — Introduzione | ✅ Revisionato | Fix refuso "a mia" → "la mia"; ammorbidita frase sulla struttura |
| Cap. 2 — Analisi del problema | ✅ Nessuna modifica | Solido, nessun intervento necessario |
| Cap. 3 — Progettazione e Architettura | ✅ Revisionato | Aggiunti paragrafi su Supabase (trade-off consolidazione) e Drizzle vs Prisma |
| Cap. 4 — Funzionalità principali | ✅ Revisionato | Aggiunto ragionamento UX deadline-based; giustificata scelta Groq/Llama; nota GDPR trasformata in limitazione nota |
| Cap. 5 — Qualità del software | ⚠️ Note aggiunte | TODO comments nel file — tre punti da rivedere prima di finalizzare |

---

## Capitoli da fare

- **Cap. 6 — Sviluppo AI-assisted** — il più delicato. Va rinarrato in prima persona come percorso di problem-solving, non come spiegazione dell'AI. Ogni sezione deve rispondere: cosa ho incontrato → come l'ho risolto → perché → limiti. Vedi `essenza-progetto.md` per la regola narrativa.
- **Cap. 7 — Lessons Learned** — generalmente buono, rivedere le lezioni troppo centrate sull'AI vs quelle centrate sul processo.
- **Cap. 8 — Conclusioni** — ridurre le sezioni 8.2 e 8.3 (troppo filosofiche sull'AI); la riflessione finale deve atterrare sulle competenze dello studente, non sull'AI come paradigma.

---

## TODO aperti nel Cap. 5

1. **Apertura 5.5** — riformulare: gli standard di codice sono pratica professionale, non solo risposta all'AI.
2. **Fine 5.2** — aggiungere cosa NON è testato (no test UI end-to-end). Prepararsi alla domanda della commissione.
3. **Fine 5.4** — specificare perché gli 8 smell sono rimasti aperti (non bloccanti, tempo allocato altrove).

---

## Cosa ricordare prima dell'esame

- **LPU vs GPU** — saper spiegare perché Groq ha latenza inferiore (Language Processing Unit vs GPU tradizionale per inferenza sequenziale).
- **Gemini** — la storia è "le condizioni del piano API sono cambiate in corso d'opera", non "c'era un bug nel free tier".
- **Test** — saper rispondere a "cosa non hai testato?" (no test UI) e "come hai scelto cosa testare?".
- **8 smell aperti** — saper spiegare la prioritizzazione.

---

## Regola narrativa (da `essenza-progetto.md`)

Il prodotto è il veicolo. Il processo è la dimostrazione. Per ogni scelta: problema → soluzione → alternative → limiti. Chi parla è sempre lo studente che ragiona, non una voce esterna che descrive l'AI.
