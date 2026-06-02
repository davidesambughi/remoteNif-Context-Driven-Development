# Istruzioni per i diagrammi — Excalidraw

Strumento consigliato: excalidraw.com
Stile: hand-drawn (default di Excalidraw)
Esporta come PNG a risoluzione alta (usa "Export → PNG → Scale 2x")

---

## Figura 1 — Architettura del sistema

**Cosa mostra:** come le tre parti del sistema si parlano.

**Layout:** tre colonne verticali affiancate, con frecce orizzontali tra loro.

**Colonna sinistra — "Browser"**
- Un rettangolo grande con scritto "Browser"
- Dentro: tre rettangoli più piccoli etichettati "Pagina cliente", "Pannello admin", "Coda operatore"

**Colonna centrale — "Server Next.js"**
- Un rettangolo grande con scritto "Server Next.js"
- Dentro: tre rettangoli etichettati "Server Components", "Server Actions", "API Routes (webhook)"

**Colonna destra — "Servizi esterni"**
- Quattro rettangoli separati (non dentro un contenitore), etichettati:
  - "Supabase (DB + Auth + Storage)"
  - "Stripe (pagamenti)"
  - "Resend (email)"
  - "Groq (AI documenti)"

**Frecce:**
- Browser → Server: "richiesta pagina / azione utente"
- Server → Browser: "HTML / risposta"
- Server → Supabase: doppia freccia (lettura e scrittura)
- Server → Stripe: "crea sessione checkout"
- Stripe → Server (API Route): "webhook pagamento"
- Server → Resend: "invia email"
- Server → Groq: "analizza documento"

---

## Figura 2 — Server Components, Client Components e Server Actions

**Cosa mostra:** la distinzione tra ciò che gira sul server e ciò che gira nel browser.

**Layout:** due aree affiancate separate da una linea tratteggiata verticale. Etichetta sinistra: "SERVER". Etichetta destra: "BROWSER".

**Lato SERVER:**
- Rettangolo "Server Component" con sotto: "renderizza HTML", "accede al DB", "legge i dati"
- Rettangolo "Server Action" con sotto: "salva nel DB", "chiama Stripe", "invia email"

**Lato BROWSER:**
- Rettangolo "Client Component" con sotto: "form interattivo", "modale", "countdown SLA"

**Frecce:**
- Server Component → Browser: "invia HTML statico"
- Client Component → Server Action: "chiama la funzione" (freccia tratteggiata che attraversa la linea)
- Server Action → DB (piccolo cilindro a sinistra): freccia

**Nota in fondo:** "Le Server Actions sembrano chiamate di funzione normali. In realtà girano sul server."

---

## Figura 3 — Ciclo di vita di un ordine

**Cosa mostra:** i 6 stati di un ordine come macchina a stati, con cosa triggera ogni transizione.

**Layout:** sequenza orizzontale di box collegati da frecce, con etichette sulle frecce.

**Box (da sinistra a destra):**
1. `pending_payment` — colore grigio
2. `documents_pending` — colore grigio
3. `documents_under_review` — colore giallo/arancio
4. `documents_approved` — colore verde chiaro
5. `submitted` — colore verde
6. `delivered` — colore verde scuro / blu

**Frecce con etichette (sopra o sotto la freccia):**
- 1→2: "Stripe conferma il pagamento"
- 2→3: "Cliente carica i documenti"
- 3→4: "Admin approva il pacchetto"
- 4→5: "Operatore invia al portale AT"
- 5→6: "Operatore inserisce il NIF"

**Nota a lato:** "La progressione è irreversibile: nessun ordine può tornare a uno stato precedente."

---

## Figura 5 — Project tree

**Cosa mostra:** la struttura delle cartelle principali e il loro ruolo nel sistema.

**Layout:** usa uno screenshot reale di VS Code (sidebar sinistra con il file explorer aperto) oppure copia il tree testuale dal capitolo e mettilo in un rettangolo con sfondo scuro (stile terminale) in Excalidraw.

**Opzione consigliata — screenshot VS Code:**
- Apri VS Code sul progetto
- Espandi le cartelle: `app/`, `lib/`, `components/`, `messages/`
- Fai uno screenshot della sidebar sinistra
- Ritaglia e inserisci nella tesina come figura

Questo è più autentico e immediato di un diagramma disegnato.

---

## Figura 6 — Flusso next-intl

**Cosa mostra:** come una richiesta URL viene risolta nella lingua corretta.

**Layout:** sequenza verticale di tre step, con frecce verso il basso.

**Step 1 — "Utente naviga su /fr/pricing"**
- Rettangolo con l'URL evidenziato: `/fr/pricing`
- Sotto: due label colorate: `[locale] = fr` e `[page] = pricing`

**Step 2 — "next-intl risolve il locale"**
- Rettangolo con scritto "next-intl"
- Freccia verso sinistra che punta a un file: `messages/fr.json`
- Freccia verso destra che indica: "locale corrente = fr"

**Step 3 — "Il componente accede alla traduzione"**
- Due box affiancati:
  - Box A: "Server Component" → `getTranslations('pricing')` → `t('title')` → `"Obtenez votre NIF portugais"`
  - Box B: "Client Component" → `useTranslations('pricing')` → `t('title')` → `"Obtenez votre NIF portugais"`

**In fondo:**
- Un box rosso con: "Se la chiave non esiste in fr.json → errore TypeScript a compile time"

---

## Figura 7 — Flusso di pagamento Stripe

**Cosa mostra:** i 5 passaggi dal click sul bottone checkout alla creazione dell'ordine nel DB.

**Layout:** sequenza orizzontale con 5 colonne: Browser | Server Next.js | Stripe | Webhook | Database

**Passaggi (frecce numerate):**
1. Browser → Server: "Utente clicca 'Acquista'"
2. Server → Stripe API: "Crea Checkout Session"
3. Stripe API → Browser: "Redirect a pagina pagamento Stripe"
4. Browser → Stripe: "Utente inserisce carta e paga"
5. Stripe → Browser: "Redirect a /dashboard"
6. Stripe → Server (API Route webhook): "Webhook: payment_succeeded" (freccia separata, tratteggiata)
7. Server → Database: "Crea ordine in transazione atomica"
8. Server → Resend: "Invia email di conferma"

**Nota evidenziata in rosso:** "Il webhook (step 6) è indipendente dal redirect (step 5). Se il browser si chiude, l'ordine viene creato comunque."

---

## Figura 8 — Flusso revisione AI documenti

**Cosa mostra:** dall'upload del documento alla risposta del modello.

**Layout:** sequenza verticale di 4 step con frecce verso il basso.

**Step 1 — "Upload"**
- Utente carica il PDF
- Freccia → Supabase Storage (bucket privato)

**Step 2 — "Estrazione testo"**
- Server legge il file da Storage
- Libreria pdfjs-dist estrae il testo
- Output: testo grezzo del documento

**Step 3 — "Analisi con Groq / Llama 4 Scout"**
- Server invia testo + prompt strutturato a Groq API
- Timeout: 30 secondi

**Step 4 — "Risposta" (tre frecce divergenti)**
- ✓ Clear → documento approvato automaticamente
- ⚠ Flagged → motivo specifico mostrato al cliente
- ✗ Error / Timeout → escalation a revisione manuale

**Nota a lato:** "Dopo 2 tentativi falliti → escalation automatica all'admin"

---

## Figura 9 — Coda operatore

**Cosa mostra:** come appare la coda e il flusso di submission.

**Layout:** due sezioni verticali affiancate.

**Sezione sinistra — "La coda"**
- Titolo: "Express (priorità alta)"
  - Riga ordine con countdown rosso: "3h 42m rimanenti"
  - Riga ordine con countdown arancione: "11h 20m rimanenti"
- Separatore
- Titolo: "Standard"
  - Riga ordine senza countdown urgente

**Sezione destra — "Azione per ogni ordine"**
- Bottone "Scarica pacchetto ZIP"
- Bottone "Marca come inviato" (con finestra di conferma)
- Freccia verso il basso: "Ordine sparisce dalla coda → status = submitted → email al cliente"

---

## Figura 4 — I tre ruoli del sistema

**Cosa mostra:** customer, admin e operator — cosa vede e fa ciascuno.

**Layout:** tre colonne verticali, ognuna con un'intestazione colorata.

**Colonna 1 — "Customer" (blu)**
- Dashboard personale
- Timeline dello stato pratica
- Upload documenti
- Visualizzazione NIF consegnato
- Accede solo alla propria pratica

**Colonna 2 — "Admin" (arancio)**
- Lista di tutti gli ordini
- Revisione e approvazione documenti
- Aggiornamento manuale dello stato
- Invio email al cliente
- Accede a tutte le pratiche

**Colonna 3 — "Operator" (viola)**
- Coda prioritaria (Express prima)
- Countdown SLA per ogni ordine
- Download pacchetto documentale
- Marcatura ordine come inviato
- Non approva — solo gestisce la coda

**In fondo, una freccia orizzontale che attraversa tutte e tre le colonne:**
"Ogni ruolo vede solo ciò che è autorizzato a vedere — l'accesso è verificato lato server ad ogni richiesta."
