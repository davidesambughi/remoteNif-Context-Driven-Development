# Capitolo 3 — Progettazione e Architettura

---

## 3.1 Panoramica del sistema

RemoteNIF è un'applicazione web full-stack: gestisce l'interfaccia utente, la logica di business, i dati, i pagamenti e le comunicazioni all'interno di un sistema unico e coerente. Prima di entrare nelle singole scelte tecnologiche, è utile avere una visione d'insieme di come le parti sono connesse.

[Figura 1 — Architettura del sistema. Vedi descrizione diagramma in appendice.]

Il sistema si divide in tre livelli:

**Il browser** è ciò che l'utente vede e con cui interagisce. Riceve pagine già renderizzate dal server e gestisce solo le interazioni che richiedono risposta immediata — apertura di un modale, aggiornamento di un campo, animazione di un bottone.

**Il server Next.js** è il centro del sistema. Riceve le richieste del browser, esegue la logica di business, accede al database, comunica con i servizi esterni, e restituisce le pagine o i dati richiesti. Non è un server separato: vive nello stesso codebase dell'interfaccia.

**I servizi esterni** sono piattaforme specializzate che il server chiama quando ne ha bisogno: Supabase per i dati e l'autenticazione, Stripe per i pagamenti, Resend per le email, Groq per la revisione AI dei documenti.

Questa separazione — browser / server / servizi — è la base di tutte le decisioni architetturali descritte nelle sezioni successive.

---

## 3.2 Perché Next.js

La scelta del framework è la decisione architetturale più importante di un progetto web: definisce come è organizzato il codice, come vengono gestiti autenticazione e dati, e quali pattern sono disponibili per risolvere i problemi ricorrenti.

### Il problema da risolvere

Un'applicazione come RemoteNIF ha bisogno di tre cose che tradizionalmente richiedono due progetti separati: un'interfaccia utente interattiva, logica di business server-side (accesso al database, integrazione con Stripe, invio di email), e un sistema di autenticazione sicuro.

L'architettura classica prevede un frontend React che comunica via HTTP con un backend Node.js. I due progetti devono mantenersi sincronizzati: ogni modifica all'API del backend richiede un aggiornamento corrispondente nel frontend. Per un team piccolo, questa coordinazione ha un costo reale e continuo.

### La soluzione: un codebase unico

Next.js con App Router unifica i due livelli in un unico progetto. Il concetto chiave è la distinzione tra **Server Components** e **Client Components**.

I **Server Components** vengono eseguiti sul server e inviano al browser solo l'HTML risultante — nessun JavaScript aggiuntivo, nessun dato sensibile esposto. Sono il default: la maggior parte delle pagine di RemoteNIF viene renderizzata in questo modo.

I **Client Components** vengono eseguiti nel browser e gestiscono le interazioni che richiedono risposta immediata: un form che valida in tempo reale, un modale che si apre al click, un countdown che si aggiorna ogni minuto. Vengono usati selettivamente, solo dove l'interattività è necessaria.

Le **Server Actions** sono il meccanismo con cui i componenti React possono eseguire codice server-side — salvare dati nel database, inviare un'email, chiamare Stripe — senza definire un endpoint HTTP esplicito. Dal punto di vista del codice, sembra una chiamata di funzione normale; nella realtà, avviene sul server, con accesso alle credenziali e al database.

Gli **API Route** — endpoint HTTP tradizionali — vengono usati solo per comunicazioni con servizi esterni che richiedono un URL pubblico. In RemoteNIF, questo significa esclusivamente i webhook di Stripe: notifiche asincrone che Stripe invia al sistema quando un pagamento viene confermato.

[Figura 2 — Server Components, Client Components e Server Actions: schema del flusso dati.]

### Alternative considerate

**React + Express (architettura separata):** valida e molto diffusa, ma introduce la complessità di due repository, due deployment e un contratto API da mantenere. Scartata per ragioni di velocità di sviluppo e dimensione del team.

**Remix:** framework simile a Next.js per filosofia (full-stack, stesso codebase), con un approccio al data loading leggermente diverso. Meno maturo dell'ecosistema Next.js al momento della scelta, con meno integrazioni disponibili per Supabase e Stripe.

**SvelteKit:** ottima scelta per progetti nuovi, ma con un ecosistema più piccolo e meno documentazione specifica per le integrazioni richieste.

### Il trade-off accettato

La logica scritta con le convenzioni di Next.js — Server Actions, App Router, file-based routing — non si porta facilmente su un altro framework. Questo è il principale svantaggio della scelta. Era un rischio accettabile: il progetto ha una timeline definita, un team piccolo, e nessuna previsione di cambio di stack nel breve periodo.

---

## 3.3 Stack tecnologico

Ogni tecnologia dello stack è stata scelta per risolvere un problema specifico. La tabella seguente riassume le scelte e la motivazione principale per ciascuna.

| Tecnologia | Ruolo | Perché |
|---|---|---|
| **Next.js 16.2** | Framework full-stack | Un solo codebase per UI e logica server |
| **TypeScript** | Linguaggio | Gli errori vengono rilevati a compile time, non a runtime |
| **Supabase** | Database + Auth + Storage | Tre servizi critici sotto un'unica piattaforma gestita |
| **Drizzle ORM** | Accesso al database | Query type-safe con sintassi simile a SQL; più leggero di Prisma |
| **Stripe** | Pagamenti | Standard europeo, conformità SCA inclusa |
| **Resend + react-email** | Email transazionali | I template email sono componenti React, nello stesso linguaggio del progetto |
| **Groq (Llama 4 Scout)** | Revisione AI documenti | Inferenza rapida per classificare documenti in tempo quasi reale |
| **next-intl** | Internazionalizzazione | Integrazione nativa con App Router; chiavi di traduzione type-safe |
| **Tailwind CSS + shadcn/ui** | Stile e componenti | Sistema di design token centralizzato; componenti accessibili pronti all'uso |
| **Vercel** | Deployment | Piattaforma nativa per Next.js; zero configurazione infrastrutturale |

Un principio guida ha orientato queste scelte: ridurre la superficie di complessità infrastrutturale. Ogni servizio aggiuntivo è un account da gestire, una credenziale da custodire, un punto di guasto potenziale. Dove possibile, si è preferita la consolidazione — Supabase sostituisce tre servizi separati, Vercel elimina la configurazione del server di deployment.

**Supabase** merita un approfondimento. L'alternativa era comporre tre servizi indipendenti: PostgreSQL su un provider dedicato, un sistema di autenticazione come Auth0 o Clerk, e uno storage object come AWS S3. Questa architettura è più flessibile — ogni servizio può essere sostituito in modo indipendente — ma introduce tre integrazioni separate, tre set di credenziali, e tre superfici di errore potenziale. La scelta di Supabase ha un trade-off rilevante: se la piattaforma ha un'interruzione, tutti e tre i servizi smettono di funzionare simultaneamente. Per un progetto in fase iniziale con un team piccolo, questa dipendenza era un rischio accettabile rispetto al costo di gestire l'infrastruttura distribuita.

**Drizzle ORM** è stato scelto rispetto a Prisma — lo standard de facto nell'ecosistema Next.js — per due ragioni concrete. La prima è la sintassi: Drizzle scrive query in TypeScript con una struttura molto simile a SQL, il che rende più semplice ragionare su cosa viene eseguito nel database. Prisma ha un linguaggio di query proprietario che astrae maggiormente SQL, utile per la velocità ma meno trasparente. La seconda è l'assenza di un passaggio di generazione del codice: Prisma richiede di eseguire `prisma generate` ogni volta che lo schema cambia per aggiornare il client TypeScript; con Drizzle lo schema è direttamente il codice TypeScript, senza passaggi intermedi. Il trade-off: Prisma è più maturo, con documentazione più ricca e più esempi disponibili online.

---

## 3.4 Il database e il ciclo di vita di un ordine

Il database è composto da sette tabelle. La struttura rispecchia i due domini principali del sistema: il percorso del cliente e gli strumenti di gestione interna.

Le sette tabelle sono: `users`, `orders`, `documents`, `payments`, `operator_notifications`, `operator_preferences`, `audit_log`.

La tabella più importante è `orders`. Ogni riga rappresenta una pratica NIF, e il campo più significativo è lo **stato** (`status`), che segue una progressione lineare e irreversibile:

```
pending_payment → documents_pending → documents_under_review → documents_approved → submitted → delivered
```

Ogni transizione ha una causa precisa:

- `pending_payment → documents_pending` — pagamento confermato da Stripe via webhook
- `documents_pending → documents_under_review` — l'utente carica i documenti e l'AI avvia la revisione
- `documents_under_review → documents_approved` — l'admin approva il pacchetto documentale
- `documents_approved → submitted` — l'operatore scarica il pacchetto e lo invia al portale AT
- `submitted → delivered` — l'operatore inserisce il numero NIF consegnato

Nessun ordine può saltare uno stato o tornare indietro. Questa irreversibilità è una scelta deliberata: garantisce che ogni pratica segua sempre lo stesso percorso controllato, e che lo stato di ogni ordine sia sempre verificabile senza ambiguità.

[Figura 3 — Ciclo di vita di un ordine: macchina a stati con transizioni e trigger.]

La tabella `audit_log` merita una menzione separata. Non è un log tecnico di sistema — è la traccia delle azioni umane: ogni approvazione, ogni rifiuto, ogni aggiornamento di stato effettuato da admin e operatori viene registrato con timestamp e autore. In un servizio che gestisce documenti d'identità e denaro reale, questa tracciabilità non è opzionale.

---

## 3.5 I tre ruoli del sistema

RemoteNIF non è un'applicazione con un solo tipo di utente. Il sistema gestisce tre ruoli distinti, ognuno con un'interfaccia e un insieme di azioni propri.

[Figura 4 — I tre ruoli: customer, admin, operator e le aree del sistema a cui accedono.]

**Customer** — il cliente che ha acquistato il servizio. Vede la propria dashboard con lo stato della pratica, il timeline visivo degli step, e il form per caricare i documenti. Non ha accesso a nessuna pratica che non sia la propria. Una volta consegnato il NIF, lo vede visualizzato permanentemente nella dashboard.

**Admin** — il responsabile della revisione delle pratiche. Vede la lista di tutti gli ordini con filtri per stato e tier, può approvare o rifiutare i documenti con un motivo specifico, aggiornare manualmente lo stato di una pratica, e inviare email al cliente. Ha accesso a tutte le pratiche, non solo alle proprie.

**Operator** — l'operatore che gestisce la coda di submission. Vede una coda prioritaria degli ordini pronti per essere inviati al portale AT (le pratiche Express appaiono prime, con un countdown SLA), può scaricare il pacchetto documentale pre-assemblato per ogni ordine, e marca la pratica come inviata una volta completata la submission manuale.

La separazione tra admin e operator è una scelta deliberata: chi approva i documenti non è necessariamente chi li invia. Questo crea una catena di responsabilità chiara e consente di assegnare i due ruoli a persone diverse in base all'organizzazione del team.

---

## 3.6 Struttura del progetto

La struttura delle cartelle in un progetto Next.js non è solo una questione organizzativa — è parte dell'architettura. Il framework usa il filesystem come sistema di routing: la posizione di un file determina l'URL che quel file gestisce.

[Figura 5 — Project tree: le cartelle principali e il loro ruolo.]

```
app/
├── [locale]/              ← tutte le pagine sono sotto il locale
│   ├── (marketing)/       ← home e pricing (pubbliche)
│   ├── (auth)/            ← login, signup, reset password
│   ├── (dashboard)/       ← area cliente: dashboard, settings, renewal
│   ├── (operator)/        ← area operatore: coda, archivio, preferenze
│   └── admin/             ← area admin: lista ordini, dettaglio ordine
├── actions/               ← tutte le Server Actions
└── api/
    └── webhooks/stripe/   ← unico endpoint HTTP esterno

lib/
├── ai/                    ← logica revisione documenti con Groq
├── auth/                  ← gestione sessione e ruoli
├── db/                    ← schema, query, migrazioni
├── email/                 ← template email e funzione di invio
├── operator/              ← assemblaggio pacchetto ZIP per operatori
├── pdf/                   ← generazione PDF della procura (POA)
├── stripe/                ← client Stripe e handler webhook
├── supabase/              ← client Supabase (server, client, admin)
├── utils/                 ← funzioni di utilità condivise
└── validations/           ← schemi Zod per validazione input

components/
├── admin/                 ← componenti del pannello admin
├── auth/                  ← form di login, signup, reset
├── dashboard/             ← componenti dell'area cliente
├── marketing/             ← hero, pricing cards, FAQ
├── operator/              ← coda, countdown SLA, form preferenze
├── shared/                ← componenti usati in più aree
└── ui/                    ← componenti shadcn/ui (read-only)

messages/
├── en.json                ← traduzioni inglese (lingua default)
├── fr.json                ← traduzioni francese
├── es.json                ← traduzioni spagnolo
└── de.json                ← traduzioni tedesco
```

Ci sono tre principi strutturali da evidenziare.

**Le parentesi tonde `(nome)` creano gruppi di route senza influenzare l'URL.** Ad esempio, `(dashboard)/dashboard` corrisponde all'URL `/dashboard`, non a `/(dashboard)/dashboard`. Questo permette di raggruppare pagine con lo stesso layout — header, auth guard, navigazione — senza che il nome del gruppo appaia nell'indirizzo.

**`app/actions/` raccoglie tutte le Server Actions in un posto solo.** Questa è una scelta organizzativa: avremmo potuto distribuire le Server Actions accanto ai componenti che le usano, ma centralizzarle in una cartella dedicata rende più semplice trovare dove avviene ogni mutazione di dati.

**`lib/` è organizzata per dominio, non per tipo di file.** Tutta la logica relativa al database è in `lib/db/`, tutta la logica relativa alle email è in `lib/email/`, e così via. Questo significa che aggiungere una nuova funzionalità — ad esempio un nuovo tipo di email — richiede di toccare una sola cartella, non di navigare tra `helpers/`, `utils/`, `services/` sparse per il progetto.

---

## 3.7 Come funziona l'internazionalizzazione

L'internazionalizzazione — la capacità dell'applicazione di servire contenuti in lingue diverse — non è una funzionalità aggiunta a progetto avanzato. È stata progettata come parte dell'architettura fin dall'inizio, e influenza la struttura di routing, i componenti, e le Server Actions.

[Figura 6 — Flusso next-intl: come una richiesta URL viene risolta nella lingua corretta.]

### Il routing basato sul locale

Ogni URL dell'applicazione contiene il locale come primo segmento: `/fr/pricing`, `/es/dashboard`, `/de/signin`. Questo segmento è il parametro `[locale]` nella cartella `app/[locale]/` — Next.js lo legge automaticamente e lo rende disponibile a ogni pagina.

La lingua di default è l'inglese, e segue una strategia `as-needed`: l'URL `/pricing` (senza prefisso) corrisponde alla versione inglese, mentre tutte le altre lingue richiedono il prefisso esplicito. Un utente che naviga su `/fr/pricing` vede la pagina dei prezzi in francese; uno che naviga su `/pricing` vede la stessa pagina in inglese.

### I file di traduzione

Le stringhe di testo sono separate dal codice. Ogni lingua ha un file JSON nella cartella `messages/`: `en.json`, `fr.json`, `es.json`, `de.json`. Ogni file contiene le stesse chiavi, organizzate per namespace:

```json
// messages/fr.json (estratto)
{
  "pricing": {
    "title": "Obtenez votre NIF portugais",
    "essential": {
      "name": "Essentiel",
      "cta": "Commencer"
    }
  }
}
```

Il codice non contiene mai testo diretto — contiene solo la chiave: `t('pricing.essential.cta')`. È next-intl che, conoscendo il locale corrente, carica il file giusto e restituisce la stringa corrispondente.

### La type-safety delle chiavi

Il vantaggio più importante dell'approccio adottato è la **type-safety**: TypeScript sa quali chiavi esistono nei file di traduzione. Se nel codice viene referenziata una chiave che non esiste — ad esempio per un refactor che ha rinominato una chiave senza aggiornare tutti i riferimenti — il compilatore segnala un errore prima che il progetto possa essere compilato. Questo elimina una categoria intera di bug silenziosi: la pagina che mostra la chiave grezza `pricing.essential.cta` invece del testo tradotto.

### Server Components e Client Components

next-intl distingue il modo in cui le traduzioni vengono accedute in base a dove gira il componente:

- Nei **Server Components** si usa `await getTranslations('namespace')` — una funzione asincrona che legge il file di traduzione lato server.
- Nei **Client Components** si usa `useTranslations('namespace')` — un hook React che accede alle traduzioni già caricate e passate dal server.

Questa distinzione è coerente con l'architettura generale del progetto: il server fa il lavoro pesante, il client riceve solo ciò che gli serve.
