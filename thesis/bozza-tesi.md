# Capitolo 1 — Introduzione

---

Lo sviluppo software sta attraversando una fase di profonda trasformazione. Gli strumenti di intelligenza artificiale sono diventati parte integrante del lavoro quotidiano di molti sviluppatori, riducendo drasticamente il tempo necessario per implementare funzionalità e generare codice.

Questa evoluzione, tuttavia, non elimina la necessità di comprendere i principi fondamentali dell'ingegneria del software. Al contrario, rende ancora più importanti attività come l'analisi dei requisiti, la progettazione architetturale, la definizione di standard, il controllo della qualità e la validazione e comprensione delle soluzioni sviluppate. Inoltre, l’aumento della velocità di produzione del codice può introdurre nuove insidie, come la percezione di produttività basata esclusivamente sulla quantità di codice generato, spesso a scapito della qualità, della coerenza architetturale e della reale comprensione delle soluzioni implementate

L'obiettivo di questa tesi è dimostrare a mia applicazione pratica di tali principi attraverso la progettazione e lo sviluppo di un prodotto software reale. In particolare, il lavoro documenta come i concetti studiati durante l'internship a Lisbona siano stati applicati lungo l'intero ciclo di vita del software, dall'analisi iniziale fino al testing e alla validazione finale.

La tesi ha inoltre un secondo obiettivo: dimostrare la comprensione delle scelte tecniche, architetturali e metodologiche adottate durante lo sviluppo.

In un periodo storico in cui generare codice è diventato più semplice che mai, il valore di uno sviluppatore non risiede soltanto nella capacità di produrre software, ma soprattutto nella capacità di progettare sistemi, valutarne la qualità, comprenderne i compromessi, garantirne la manutenibilità e giustificare le decisioni che ne hanno determinato l'evoluzione.

Per questo motivo, la tesi non documenta solamente ciò che è stato costruito, ma soprattutto perché è stato costruito in quel modo.


Questa tesi affronta tali temi attraverso un caso studio concreto: la progettazione e lo sviluppo di RemoteNIF v2.

---

## Il caso studio: RemoteNIF v2

RemoteNIF v2 è una piattaforma web per l'ottenimento remoto del NIF portoghese, il codice fiscale necessario per svolgere numerose attività amministrative e finanziarie in Portogallo.

Il progetto è stato scelto come caso studio perché presenta problematiche reali, requisiti concreti e vincoli tipici di un'applicazione destinata all'utilizzo in produzione. Il sistema gestisce l'intero ciclo di vita di una pratica: dalla selezione del piano alla consegna del NIF, includendo la raccolta e revisione dei documenti, i processi amministrativi interni e la comunicazione con il cliente.

L'applicazione è stata progettata seguendo criteri di qualità, manutenibilità e scalabilità, adottando pratiche normalmente utilizzate nello sviluppo professionale. Questo ha reso il progetto un contesto ideale per applicare e valutare i principi del software engineering studiati durante il percorso formativo.

RemoteNIF non rappresenta il tema principale di questa tesi. Rappresenta il caso studio attraverso cui vengono analizzati il processo di sviluppo, le decisioni progettuali e le pratiche adottate durante la realizzazione del prodotto.

---

## Il processo di sviluppo

L'intero progetto è stato sviluppato utilizzando un approccio AI-assisted, integrando strumenti di intelligenza artificiale all'interno del processo di sviluppo.

L'obiettivo del lavoro non è analizzare l'intelligenza artificiale come tecnologia, né valutare quale modello sia migliore. L'interesse è rivolto al modo in cui i principi del software engineering possono essere applicati efficacemente in un contesto in cui gran parte dell'implementazione viene delegata a sistemi AI.

Durante lo sviluppo sono emerse sfide legate alla qualità del codice, alla coerenza architetturale, alla gestione del contesto e alla verifica delle soluzioni prodotte. Per affrontarle è stato necessario definire standard, processi e meccanismi di controllo capaci di mantenere il progetto allineato agli obiettivi iniziali.

L'esperienza ha portato alla definizione di un approccio strutturato basato su documentazione, specifiche, standard condivisi e validazione continua, con l'obiettivo di utilizzare l'AI come strumento operativo senza rinunciare al controllo del sistema e delle decisioni progettuali.

---

## Struttura della tesi

I capitoli 2-5 documentano il caso studio: il problema analizzato, le scelte architetturali, le funzionalità sviluppate e le pratiche di qualità adottate. I capitoli successivi approfondiscono il processo di sviluppo nel suo complesso, le lezioni apprese e le conclusioni.

La tesi è organizzata in otto capitoli.

Il **Capitolo 2** analizza il problema da risolvere: il quadro normativo del NIF portoghese, il processo di ottenimento, il mercato esistente e i limiti delle soluzioni attualmente disponibili.

Il **Capitolo 3** descrive le scelte architetturali e tecnologiche del progetto, illustrando le ragioni che hanno guidato l'adozione delle diverse tecnologie e i compromessi valutati durante la progettazione.

Il **Capitolo 4** presenta le principali funzionalità dell'applicazione e il modo in cui esse contribuiscono a risolvere il problema individuato.

Il **Capitolo 5** descrive le pratiche di qualità adottate, tra cui la strategia di testing, le attività di audit del codebase e gli standard utilizzati per garantire affidabilità e manutenibilità del sistema.

Il **Capitolo 6** approfondisce il processo di sviluppo AI-assisted utilizzato durante il progetto, analizzandone vantaggi, limiti e problematiche operative. Vengono inoltre presentati gli strumenti, i documenti e le pratiche introdotte per mantenere coerenza e qualità durante lo sviluppo.

Il **Capitolo 7** raccoglie le lezioni apprese durante il progetto, evidenziando sia gli aspetti che hanno funzionato sia le criticità incontrate e le possibili aree di miglioramento.

Il **Capitolo 8** presenta le conclusioni finali, sintetizzando i risultati ottenuti e le competenze applicate durante la realizzazione del progetto, insieme a possibili sviluppi futuri del prodotto e del processo adottato.


# Capitolo 2 — Analisi del problema

---

## 2.1 Il NIF portoghese

Il NIF — *Número de Identificação Fiscal* — è il codice fiscale portoghese. È un numero univoco assegnato dall'Autoridade Tributária e Aduaneira (AT), l'equivalente dell'Agenzia delle Entrate italiana, e identifica ogni persona fisica o giuridica nel sistema fiscale del Paese.

Per uno straniero che si trasferisce in Portogallo, o che intende avere qualsiasi rapporto economico o legale con il Paese, il NIF non è facoltativo. È un prerequisito. Senza di esso, nessuna delle seguenti operazioni è possibile:

- aprire un conto corrente bancario
- firmare un contratto d'affitto registrato presso le Finanças — senza registrazione, l'inquilino non gode di alcuna tutela legale in caso di controversia con il locatore
- acquistare un immobile
- avviare un'attività lavorativa autonoma o dipendente
- accedere a servizi pubblici legati all'identità fiscale, come l'abbonamento gratuito ai trasporti pubblici per i residenti under 23 a Lisbona

Il NIF, in sostanza, è il documento che rende possibile la vita ordinaria in Portogallo. Chi arriva senza averlo ottenuto in anticipo si trova in una situazione bloccante: non può fare quasi nulla fino a quando non lo riceve.

---

## 2.2 Il problema: ottenere il NIF senza essere presenti fisicamente

Il processo tradizionale per ottenere un NIF prevede due strade.

La prima opzione è la richiesta di persona. Presentandosi a uno sportello delle Finanças con un documento d'identità, con un po' di fortuna si ottiene il NIF il giorno stesso; in alternativa, come è capitato a me, verrà  assegnato un appuntamento per un altro giorno. È il percorso più semplice, ma richiede di essere già in Portogallo. Per chi deve organizzare un trasloco internazionale, o per chi deve firmare un compromesso di acquisto prima ancora di partire, questa strada non è percorribile.

La seconda strada è la nomina di un rappresentante fiscale: una persona fisica o giuridica domiciliata in Portogallo che agisce per conto del richiedente davanti all'amministrazione fiscale. Questa figura è prevista dalla legge portoghese ed è, in alcuni casi, obbligatoria per legge (come si vedrà nella sezione 2.4). In altri casi, anche quando non obbligatoria, rimane la via più pratica per chi vuole ottenere il NIF senza spostarsi.

Il problema non è la norma. Il problema è come questa norma viene applicata nella pratica.

Oggi esistono diversi servizi online che offrono l'ottenimento del NIF tramite rappresentante fiscale. Il processo è stato digitalizzato: moduli web, caricamento documenti, pagamento online. Ma la digitalizzazione del flusso non ha risolto il problema di fondo. La maggior parte di questi servizi ha semplicemente tradotto il vecchio scambio di email in un'interfaccia web, senza ripensare l'esperienza. Il cliente paga, carica i documenti, e poi aspetta — senza sapere quanto, senza aggiornamenti automatici, senza visibilità reale sullo stato della sua pratica. Il risultato è lo stesso di prima: un processo che funziona, ma che non trasmette fiducia.

È in questo contesto che si inserisce RemoteNIF: non come prima soluzione digitale al problema, ma come alternativa costruita attorno a trasparenza e semplicità — due qualità che i servizi esistenti non hanno ancora reso centrali nella loro esperienza.

---

## 2.3 Il mercato esistente e l'opportunità

All'avvio del progetto, il mercato dei servizi di ottenimento remoto del NIF era già popolato da operatori esistenti. Non si trattava, quindi, di identificare un bisogno inesplorato, ma di analizzare perché i servizi esistenti non soddisfacevano pienamente la domanda.

L'analisi ha evidenziato tre pattern ricorrenti tra i competitor:


**Prezzi opachi.** Molti servizi pubblicizzano un prezzo base basso, o il prezzo iniziale, salvo poi aggiungere costi per la rappresentanza fiscale, per le comunicazioni con l'AT, o per il rinnovo annuale del mandato. Il cliente scopre il costo reale solo al momento del pagamento o durante la conversazione con l'operatore.

**Assenza di trasparenza sul processo.** Nessuno dei principali competitor offre un meccanismo strutturato per sapere a che punto si trova la propria pratica. La comunicazione rimane affidata a email manuali, con tempi variabili e nessuna notifica automatica.

**Assenza di un flusso basato sulla scadenza.** Nessuno dei servizi analizzati chiede all'utente quando ha bisogno del NIF. L'urgenza — che è spesso il fattore determinante nella scelta — non viene mai considerata nel processo di selezione del piano. L'utente deve interpretare da solo la differenza tra le opzioni disponibili e capire quale fa al caso suo.

L'opportunità non era inventare un servizio nuovo. Era costruire un servizio migliore: uno che mostrasse tutto il prezzo fin dall'inizio, che tenesse il cliente aggiornato in ogni fase, e che trasmettesse abbastanza fiducia da convincere una persona straniera — spesso in una situazione già stressante — a consegnare i propri documenti d'identità e pagare online.

C'era inoltre una dimensione strategica nella scelta di sviluppare questo servizio: il NIF è il primo documento che qualsiasi straniero deve ottenere prima di fare qualsiasi altra cosa in Portogallo. Chi lo ottiene tramite RemoteNIF diventa un potenziale cliente acquisito prima ancora di cercare casa, di aprire un conto, di valutare un investimento immobiliare. Il servizio funziona anche come primo punto di contatto di fiducia in un mercato — quello degli expat in Portogallo — con un alto potenziale di valore nel tempo.

---

## 2.4 Quadro normativo: il Decreto-Legge 44/2022

La nomina di un rappresentante fiscale non è sempre obbligatoria. Il Decreto-Legge 44/2022, recepito dall'Ofício Circulado n.º 90057 del luglio 2022, ha ridefinito i criteri in modo significativo.

La norma distingue tre categorie di richiedenti:

- **Cittadini UE/SEE:** non sono mai obbligati a nominare un rappresentante fiscale, indipendentemente dalla loro situazione tributaria in Portogallo.
- **Cittadini extra-UE/SEE con obblighi fiscali attivi in Portogallo** — come la proprietà di un immobile, un reddito da affitto, un'attività lavorativa o d'impresa — sono ancora legalmente tenuti a nominare un rappresentante fiscale.
- **Cittadini extra-UE/SEE senza obblighi fiscali attivi** possono fare a meno del rappresentante, a condizione di attivare le notifiche elettroniche (*notificações eletrónicas*) sul Portale das Finanças.

Questa distinzione ha implicazioni dirette sull'offerta del servizio e sul modo in cui deve essere comunicata. Il servizio non può presentare la rappresentanza fiscale come un requisito universale — sarebbe legalmente scorretto. Deve invece aiutare il cliente a identificare la propria situazione e a scegliere il piano adeguato.

---

## 2.5 Requisiti funzionali

Dall'analisi del contesto sono emersi i requisiti che il sistema avrebbe dovuto soddisfare. Non si tratta di una lista tecnica, ma di un insieme di risposte alle domande che un utente reale si pone durante il processo.

**Chiarezza sul costo.** L'utente deve sapere esattamente quanto paga, per cosa, e se ci sono costi futuri (come il rinnovo della rappresentanza fiscale). Nessun costo nascosto, nessuna sorpresa post-pagamento.

**Selezione basata sulla scadenza.** Il fattore che determina la scelta del piano non è il prezzo in sé, ma l'urgenza. Il sistema deve permettere all'utente di indicare quando ha bisogno del NIF e presentare le opzioni di conseguenza.

**Visibilità sullo stato della pratica.** Una volta completato il pagamento, l'utente deve poter sapere in ogni momento a che punto si trova la sua pratica, senza dover contattare il supporto.

**Gestione guidata dei documenti.** L'utente deve essere guidato nel caricare i documenti corretti nel formato corretto, e deve ricevere un feedback chiaro e azionabile se qualcosa non va — non un generico messaggio di errore.

**Gestione interna strutturata.** Gli operatori interni che gestiscono le pratiche devono disporre di strumenti adeguati: una coda prioritaria, accesso ai documenti, un sistema di notifiche, e la possibilità di aggiornare lo stato della pratica.

**Conformità normativa nella comunicazione.** Ogni testo, ogni CTA, ogni email deve rispettare i vincoli imposti dal Decreto-Legge 44/2022 — la rappresentanza fiscale non può essere presentata come obbligatoria per tutti.

Questi requisiti hanno guidato tutte le decisioni di progettazione descritte nel capitolo successivo.

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

# Capitolo 4 — Funzionalità principali

---

## 4.1 Checkout e selezione del piano

### I tre piani di servizio

RemoteNIF offre tre piani, differenziati per urgenza e livello di assistenza:

| Piano | Prezzo | Rappresentanza fiscale | Tempistica |
|---|---|---|---|
| **Essential** | €79 | No | 5 giorni lavorativi |
| **Standard** | €129 | 12 mesi inclusi | 5 giorni lavorativi |
| **Express** | €179 | 12 mesi inclusi | Invio entro 48h dall'approvazione documenti |

La differenza tra Essential e gli altri due piani non è solo di prezzo: riflette un requisito normativo reale. Come descritto nel Capitolo 2, i cittadini extra-UE/SEE con obblighi fiscali attivi in Portogallo sono tenuti per legge a nominare un rappresentante fiscale. Essential è pensato per chi non ha questo obbligo; Standard ed Express lo includono.

### Il flusso di selezione basato sulla scadenza

Una delle scelte di UX più rilevanti del progetto riguarda come viene presentata la selezione del piano. La domanda che l'utente si pone non è "quale piano voglio?" ma "quando ho bisogno del mio NIF?". La pagina dei prezzi è costruita attorno a questa domanda: l'utente indica la propria scadenza, e l'interfaccia mostra i piani compatibili con quel tempo disponibile. I piani con tempi di consegna incompatibili vengono disabilitati in tempo reale.

L'utente legge la domanda, valuta la propria situazione, e sceglie il pacchetto corrispondente — senza dover confrontare caratteristiche astratte o interpretare nomi di piani.

[Screenshot 1 — Pagina dei prezzi con i tre piani e la domanda sulla scadenza.]

### Il flusso di pagamento con Stripe

Il pagamento è il momento più delicato del prodotto: è il punto in cui l'utente consegna i propri soldi e si aspetta che il sistema funzioni in modo affidabile. La gestione di questo flusso richiede una comprensione di come Stripe funziona a livello architetturale.

[Figura 7 — Flusso di pagamento Stripe: dalla sessione di checkout alla creazione dell'ordine nel database.]

Il flusso si articola in cinque passaggi:

**1. Creazione della sessione di checkout.** Quando l'utente clicca sul bottone di acquisto, una Server Action chiama l'API di Stripe e crea una *Checkout Session* — una sessione di pagamento con importo, descrizione e URL di ritorno già definiti. Stripe restituisce un URL univoco per questa sessione.

**2. Redirect alla pagina di pagamento di Stripe.** L'utente viene reindirizzato alla pagina di pagamento ospitata direttamente da Stripe. Questo è importante: i dati della carta di credito non transitano mai per i server di RemoteNIF. Stripe gestisce l'intera transazione e la conformità PCI-DSS (lo standard di sicurezza per i pagamenti con carta).

**3. Completamento del pagamento.** L'utente inserisce i dati della carta su Stripe e completa il pagamento. Stripe gestisce anche la Strong Customer Authentication (SCA), obbligatoria nell'Unione Europea per i pagamenti online.

**4. Il webhook.** Qui sta il punto architetturale più importante. Stripe non si limita a reindirizzare l'utente al sito dopo il pagamento — invia anche una notifica HTTP (chiamata *webhook*) all'endpoint `/api/webhooks/stripe`. Questo webhook è il segnale affidabile che il pagamento è andato a buon fine.

Il motivo per cui esiste il webhook è la resilienza: il redirect finale verso il sito potrebbe fallire (l'utente chiude il browser, la connessione cade). Se la creazione dell'ordine dipendesse solo dal redirect, il pagamento sarebbe avvenuto ma nessun ordine verrebbe creato. Il webhook arriva indipendentemente da ciò che succede nel browser.

**5. Creazione dell'ordine nel database.** L'handler del webhook verifica la firma crittografica dell'evento (per assicurarsi che venga davvero da Stripe, non da una richiesta fraudolenta), controlla che quell'evento non sia già stato processato (idempotenza), e crea l'ordine nel database in una transazione atomica. Solo a questo punto l'ordine esiste nel sistema e l'utente viene indirizzato alla propria dashboard.

---

## 4.2 Revisione AI dei documenti

### Il problema da risolvere

Una volta completato il pagamento, l'utente deve caricare tre documenti: il passaporto, una prova di indirizzo (bolletta, estratto conto, o contratto d'affitto), e la procura firmata (*Power of Attorney*) che autorizza il rappresentante fiscale ad agire per suo conto.

La qualità dei documenti è critica: un documento illeggibile, scaduto, o non conforme alle specifiche richieste dal sistema fiscale portoghese blocca l'intera pratica. Senza un controllo preventivo, ogni problema viene scoperto solo quando un operatore umano esamina il pacchetto — con un ritardo che può essere di ore o giorni.

La soluzione adottata è un sistema di pre-verifica automatica basato sull'AI, che analizza ogni documento appena viene caricato e restituisce un feedback immediato e specifico.

[Screenshot 2 — Dashboard cliente: form di upload documenti con stato di revisione AI in tempo reale.]

### Il flusso di revisione

[Figura 8 — Flusso di revisione AI: dall'upload del documento alla risposta del modello.]

Il processo si articola in quattro fasi:

**1. Upload e storage.** Il documento viene caricato direttamente in Supabase Storage, in un bucket privato non accessibile pubblicamente. Solo il server — tramite un client con privilegi elevati — può leggere i file.

**2. Estrazione del testo.** Il testo del PDF viene estratto lato server con la libreria `pdfjs-dist`. Questo passaggio è necessario perché i modelli di linguaggio lavorano su testo, non su file binari. Il testo estratto viene poi inviato al modello.

**3. Analisi con Groq (Llama 4 Scout).** Il testo estratto viene inviato all'API di Groq, che esegue l'inferenza su Llama 4 Scout — un modello di linguaggio open-source ottimizzato per velocità. Il modello riceve il testo del documento e un prompt strutturato che descrive le specifiche richieste (ad esempio: la prova di indirizzo deve essere emessa negli ultimi tre mesi; i documenti accettati sono bollette di luce, acqua o gas, estratti conto, contratti d'affitto, o lettere ufficiali governative con indirizzo).

**4. Risposta e feedback.** Il modello restituisce uno dei tre stati possibili:
- **Clear** — il documento è conforme, viene approvato automaticamente.
- **Flagged** — il documento presenta un problema specifico. L'utente riceve un messaggio con il motivo esatto: *"La bolletta è più vecchia di tre mesi"* oppure *"Il documento non include un indirizzo leggibile"*. Il feedback è sempre azionabile — non un generico rifiuto, ma un'indicazione su cosa correggere.
- **Error** — il modello non è riuscito ad analizzare il documento (file corrotto, PDF non leggibile, timeout).

### Escalation automatica

Dopo due tentativi falliti sullo stesso tipo di documento, il sistema smette di reinviare al modello e passa automaticamente alla revisione manuale. L'utente vede un messaggio che lo informa che il suo team verificherà i documenti entro quattro ore. L'admin riceve una notifica via email. Questo meccanismo serve a non bloccare indefinitamente l'utente in un loop di upload falliti quando il problema non è risolvibile in autonomia.

Un timeout di 30 secondi sulla chiamata al modello innesca lo stesso comportamento: se Groq non risponde entro il limite, la pratica viene escalata senza attendere oltre.

---

## 4.3 Pannello amministrativo e coda operatore

Il backend umano di RemoteNIF è composto da due strumenti distinti: il pannello admin e la coda operatore. La distinzione tra i due riflette una separazione di responsabilità deliberata.

[Screenshot 3 — Pannello admin: lista ordini con filtri per stato e tier.]

### Il pannello admin

L'admin è responsabile della qualità. Il suo pannello mostra la lista di tutti gli ordini attivi, con filtri per stato e tier, e permette di:

- **Approvare o rifiutare i documenti** — con la possibilità di aggiungere un motivo specifico che viene mostrato al cliente. Una decisione di rifiuto non è mai anonima: richiede una spiegazione.
- **Sovrascrivere la decisione dell'AI** — se il modello ha flaggato un documento che è in realtà conforme, l'admin può approvarlo manualmente, o viceversa.
- **Aggiornare lo stato di una pratica** — con una nota visibile al cliente, per gestire situazioni eccezionali non coperte dal flusso automatico.
- **Inviare email al cliente** — per comunicazioni dirette in qualsiasi fase del processo.
- **Consegnare il NIF** — inserendo il numero una volta ricevuto dal portale AT. Questo aggiorna lo stato a `delivered` e scatena l'invio automatico dell'email di consegna.

### La coda operatore

L'operatore è responsabile della submission. Una volta che l'admin ha approvato il pacchetto documentale, la pratica appare nella coda dell'operatore — ordinata per priorità.

[Screenshot 4 — Coda operatore con countdown SLA e bottone di download pacchetto.]

[Figura 9 — Coda operatore: priorità, countdown SLA e flusso di submission.]

Le pratiche Express appaiono in cima, con un countdown che mostra le ore rimanenti prima della scadenza SLA (48 ore dall'approvazione dei documenti). Il colore del countdown cambia in base all'urgenza:
- Verde — più di 24 ore rimanenti
- Arancione — tra 8 e 24 ore
- Rosso — meno di 8 ore
- Rosso grassetto — SLA superato

Per ogni pratica, l'operatore può scaricare un pacchetto ZIP pre-assemblato che contiene tutti i documenti approvati più un foglio di copertina generato automaticamente con i dati del cliente. L'operatore invia questo pacchetto al portale AT (ebalcão) manualmente, poi marca la pratica come inviata nel sistema. Questo aggiorna lo stato dell'ordine e notifica automaticamente il cliente.

La submission manuale al portale AT è una scelta deliberata e non modificabile a breve termine: le API di ebalcão non sono pubblicamente accessibili, e il processo di accreditamento come intermediario digitale è separato dallo sviluppo del prodotto.

---

## 4.4 Email transazionali

Ogni fase del ciclo di vita di un ordine genera almeno un'email automatica. Le email non sono messaggi generici — ogni template è scritto specificamente per il momento in cui viene inviato, con il contenuto e il tono calibrati su ciò che l'utente sta vivendo in quel momento.

I template sono scritti come componenti React con la libreria `react-email`. Questo significa che vengono sviluppati e testati nello stesso ambiente del resto dell'applicazione, con gli stessi strumenti. Non è un sistema di template separato con una sintassi diversa — è lo stesso linguaggio del progetto.

Ogni template esiste in quattro versioni linguistiche. La lingua dell'email corrisponde alla lingua selezionata dall'utente al momento della registrazione.

Le email principali del ciclo di vita sono:

| Trigger | Email inviata a |
|---|---|
| Pagamento confermato | Cliente — conferma ordine con riepilogo |
| Documento flaggato dall'AI | Cliente — motivo specifico del rifiuto e istruzioni |
| Documenti escalati a revisione manuale | Admin — notifica con link alla pratica |
| Documenti approvati dall'admin | Cliente — istruzioni per il passo successivo |
| Ordine inviato al portale AT | Cliente — conferma submission con data stimata |
| NIF consegnato | Cliente — numero NIF in evidenza e link alla dashboard |
| Rinnovo rappresentanza fiscale (11 mesi) | Cliente — promemoria con link al checkout di rinnovo |

---

## 4.5 SEO e GEO

**SEO** (*Search Engine Optimization*) è l'insieme delle pratiche che migliorano la visibilità di un sito web nei risultati dei motori di ricerca come Google. Un sito ben ottimizzato per la SEO viene mostrato più in alto nelle ricerche pertinenti, raggiungendo utenti che stanno cercando attivamente quel tipo di servizio — senza pagare pubblicità.

**GEO** (*Generative Engine Optimization*) è il corrispettivo più recente, pensato per i motori di risposta basati sull'AI — come ChatGPT, Perplexity o Google AI Overview. Invece di posizionarsi nei risultati di una lista, l'obiettivo è che il modello citi o raccomandi il prodotto quando un utente fa una domanda pertinente. Le tecniche di GEO includono dati strutturati semanticamente comprensibili dalle AI e file dedicati ai crawler dei modelli di linguaggio.

Il prodotto si rivolge a un pubblico internazionale che cerca informazioni sul NIF portoghese in lingue diverse. La visibilità sui motori di ricerca — tradizionali e AI — non era un'aggiunta opzionale: era un requisito per raggiungere organicamente i potenziali clienti.

Le scelte implementative principali:

**Metadata dinamici.** Ogni pagina pubblica genera automaticamente i propri meta tag (titolo, descrizione, Open Graph per i social) in base al contenuto e al locale. Le pagine private — dashboard, admin, operatore — sono escluse dall'indicizzazione tramite `noindex`.

**Sitemap e hreflang.** La sitemap include tutte le pagine pubbliche nelle quattro lingue, con i tag `hreflang` che segnalano ai motori di ricerca quale versione linguistica mostrare in base alla lingua del browser dell'utente.

**JSON-LD.** Le pagine principali includono dati strutturati in formato JSON-LD — lo standard di markup per i dati semantici — che descrivono l'organizzazione, il sito web e i prodotti offerti. Questo migliora la capacità dei motori di ricerca (e dei crawler AI) di comprendere e rappresentare il contenuto del sito nei risultati di ricerca.

**llms.txt.** Seguendo la specifica llmstxt.org, il progetto include un file `llms.txt` nella root pubblica — un documento in formato Markdown che descrive il sito in modo ottimizzato per i crawler dei modelli di linguaggio, che stanno diventando un nuovo canale di discovery per i prodotti digitali.

# Capitolo 5 — Qualità del software

---

La qualità di un software non si misura solo da ciò che funziona, ma da quanto si riesce a rilevare e correggere ciò che non funziona — prima che arrivi in produzione. Questo capitolo descrive le tre pratiche adottate nel progetto per mantenere il codice affidabile: un framework di test strutturato su due livelli, un audit sistematico del codebase, e un insieme di standard di codice applicati in modo coerente durante tutto lo sviluppo.

---

## 5.1 Strategia di test

Il progetto adotta una distinzione netta tra due tipi di test, che rispondono a domande diverse.

I **test unitari** verificano che una singola funzione o azione si comporti correttamente in isolamento. Ogni dipendenza esterna — il database, le API di Stripe, Resend, Groq — viene sostituita da un sostituto controllato (*mock*). Questo permette di testare ogni ramo logico in modo rapido e deterministico, senza dipendere da una connessione di rete o da un database attivo.

I **test di integrazione** verificano che le componenti del sistema si comportino correttamente quando interagiscono tra loro — in particolare, che le query al database producano i risultati attesi su uno schema reale. Per questo scopo, i test di integrazione vengono eseguiti contro un database PostgreSQL locale avviato in un container Docker apposito. Non si utilizza l'ambiente di sviluppo o quello di produzione: il test ha il proprio database isolato, inizializzato con le stesse migrazioni del sistema reale.

Questa separazione è importante per due ragioni. I test unitari sono veloci (si eseguono in pochi secondi) e coprono tutti i casi limite e i rami condizionali. I test di integrazione sono più lenti ma garantiscono che la logica di business produca scritture corrette nel database reale — un tipo di errore che i mock non possono rilevare.

---

## 5.2 Test unitari — 423 test, zero fallimenti

Il progetto conta 423 test unitari, che coprono:

- **Tutte le Server Actions** — le funzioni che eseguono mutazioni di dati lato server (checkout, upload documenti, revisione AI, azioni admin, consegna del NIF, rinnovo della rappresentanza, impostazioni account). Ogni action viene testata per il percorso felice, le condizioni di errore, e i controlli di autorizzazione.
- **Il flusso di pagamento Stripe** — l'handler del webhook viene testato per l'idempotenza (due chiamate identiche non devono creare due ordini), per l'assenza di metadati, e per il percorso completo che include la creazione dell'ordine e l'invio dell'email di conferma.
- **La pipeline di revisione AI** — i cinque rami del sistema di revisione documenti: risposta *clear* (documento conforme), risposta *flagged* al primo tentativo, risposta *flagged* al secondo tentativo con escalation automatica, errore del modello con escalation, e risposta *clear* quando tutti e tre i documenti sono approvati (che scatena l'aggiornamento dello stato dell'ordine).
- **Il sistema di email** — tutti i template vengono testati come smoke test nelle quattro lingue (inglese, francese, spagnolo, tedesco) per verificare che rendano senza eccezioni e che le variabili vengano iniettate correttamente. La funzione di dispatch viene testata per ogni tipo di payload.
- **Le validazioni Zod** — gli schemi di validazione degli input utente sono testati con casi validi e casi limite (password troppo corta, email malformata, UUID non valido, campi obbligatori mancanti).

I test vengono eseguiti con Vitest, un framework di test moderno compatibile con l'ecosistema Next.js. Il comando `npx vitest run` produce un report con zero fallimenti e zero test saltati.

---

## 5.3 Test di integrazione — 64 test, database reale

I 64 test di integrazione sono distribuiti in quattro file, ognuno focalizzato su un dominio specifico.

**Query del database** — Le sei funzioni di query principali vengono testate con dati reali: `getOrderForUser` verifica che un utente non possa accedere all'ordine di un altro; `supersedePreviousDocuments` verifica che i documenti precedenti vengano marcati come superati senza toccare i documenti di altri ordini o di altri tipi; `markOrderDocumentsUnderReview` verifica che l'aggiornamento dello stato e il timestamp vengano scritti correttamente.

**Upload e revisione documenti end-to-end** — Il test più importante dell'intera suite verifica la catena completa di scritture al database che avviene quando il terzo e ultimo documento viene approvato dall'AI: il documento viene marcato come `approved: true` con il timestamp di approvazione, e l'ordine viene aggiornato da `documents_pending` a `documents_under_review`. Questo test non è riproducibile con i mock — solo un database reale può garantire che le due scritture avvengano nella sequenza corretta all'interno della stessa transazione.

**Idempotenza del webhook Stripe** — Due chiamate identiche all'handler del webhook devono produrre esattamente un ordine e un pagamento nel database. Questo test verifica che il controllo di idempotenza (basato sull'ID della sessione di checkout) funzioni correttamente su dati reali.

**Pacchetto operatore** — 18 casi verificano che la funzione `getOperatorPackageData` restituisca `null` in tutti i casi in cui il pacchetto non sarebbe ancora disponibile: ordine in stato sbagliato, documenti non ancora tutti approvati, dati personali incompleti. Il caso di successo verifica la forma completa del risultato.

---

## 5.4 Audit della qualità del codice

A progetto avanzato — dopo il completamento di 13 funzionalità principali — è stato condotto un audit sistematico del codebase. L'obiettivo era identificare eventuali violazioni degli standard di codice, duplicazioni di logica, o pattern che avrebbero potuto introdurre bug difficili da diagnosticare.

Ogni finding è stato classificato in tre categorie:

- **Violazione** (🔴) — rompe una regola fondamentale; deve essere corretta prima di procedere.
- **Smell** (🟡) — degrada la manutenibilità ma non è bloccante; da correggere quando conveniente.
- **Giustificato** (🟢) — si discosta da uno standard per una ragione documentata; accettato così com'è.

### Le tre violazioni critiche e come sono state corrette

**1. Tipo duplicato con semantica diversa.** Il file `app/actions/admin.ts` definiva il proprio tipo `ActionResult<T>` — un'interfaccia con tutti i campi opzionali — che coesisteva con il tipo `ActionResult<T>` definito in `lib/types.ts` come discriminated union. La differenza non era superficiale: con un'interfaccia a campi opzionali, TypeScript non riesce a garantire a compile time che `result.data` esista solo quando `result.success` è `true`. La correzione ha eliminato la definizione locale e importato il tipo condiviso, ripristinando la type-safety nelle azioni admin.

**2. Classi CSS con nome fuorviante.** Nel form di dettagli personali, alcune classi Tailwind come `text-primary` e `text-muted` producevano i colori sbagliati. In questo sistema di design, `text-primary` risolve al colore brand blue (tramite la catena di variabili CSS `--color-primary → --brand-primary`), non al colore del testo principale. Il testo intendeva essere grigio scuro (`text-text-primary`) o grigio medio (`text-text-muted`), ma appariva blu sull'interfaccia. La correzione ha sostituito le classi con i nomi semantici corretti.

**3. URL di redirect locale-inconsapevoli.** L'action di creazione della sessione di checkout costruiva gli URL di successo e di annullamento senza includere il locale: `/dashboard` e `/pricing` invece di `/en/dashboard` o `/fr/dashboard`. La struttura di routing con prefisso locale richiede il locale in ogni URL. Un utente tedesco che avesse completato il pagamento avrebbe potuto ritrovarsi nella dashboard in lingua inglese. La correzione ha aggiunto il locale come parametro dell'action, passato dal componente client che conosce il locale corrente.

### Gli yellow smell

Oltre alle tre violazioni, l'audit ha documentato 14 *smell* — pattern che non rompono il comportamento ma aumentano il rischio di future regressioni. Tra i più significativi:

- Una costante `statusOrder` (la sequenza degli stati dell'ordine) era duplicata in tre file diversi. Estratta come costante condivisa da un unico file.
- Le etichette di stato nell'admin bypassavano il sistema di traduzione, convertendo i nomi degli stati con `.replace(/_/g, ' ')` invece di usare le chiavi di traduzione già esistenti.
- Il componente di revisione documenti accedeva direttamente al client Supabase Storage invece di usare una funzione di utilità dedicata, accoppiando la UI alla forma del client.

Tutti i 14 smell sono stati tracciati. Al momento della consegna, sei di essi sono stati corretti nelle sessioni successive all'audit; gli altri otto rimangono documentati per una sessione di refactoring futura.

---

## 5.5 Standard di codice

Un modello di linguaggio non ha una comprensione reale dell'architettura di un sistema. Ha pattern appresi durante il suo addestramento — convenzioni generiche, soluzioni comuni, approcci che funzionano nella maggior parte dei casi — e li applica per default, anche quando il progetto ha scelto deliberatamente qualcosa di diverso.

Il risultato concreto, quando si sviluppa senza vincoli espliciti, è codice che *funziona* ma non è *corretto*: valori hardcodati invece di token centralizzati, tipi approssimativi (`any`) invece di interfacce definite, workaround che risolvono il sintomo invece della causa, stili scritti in tre modi diversi nello stesso progetto. Il codice supera i controlli di compilazione, ma introduce incoerenze che diventano bug difficili da trovare settimane dopo, quando il contesto è cambiato.

Il problema è strutturale. I modelli di linguaggio hanno un contesto limitato: in una sessione lunga, le decisioni architetturali prese all'inizio vengono dimenticate. Il modello inizia a usare le sue pratiche di addestramento di default, che possono essere datate o semplicemente diverse da quelle del progetto. Aggiunge una patch invece di capire la causa. Hardcoda un valore invece di cercare dove quel valore è già definito. Crea un tipo nuovo invece di importare quello che esiste già.

Gli standard di codice in questo progetto servono esattamente a questo: sono un insieme di regole scritte in anticipo, incluse nel contesto di ogni sessione di sviluppo, che vincolano l'AI a produrre output coerenti con l'architettura del sistema — indipendentemente da quanto tempo è passato dall'inizio del progetto. Il file `context/code-standards.md` è uno dei documenti letti dall'AI prima di ogni sessione. Non è un documento educativo rivolto a un team umano: è un documento di vincolo rivolto al modello.

Le più rilevanti, con il tipo di errore che ciascuna previene:

**TypeScript strict.** La modalità strict è attiva sull'intero progetto. Non è consentito usare il tipo `any` — ogni dato deve avere una forma definita esplicitamente. L'errore che questa regola previene è il *runtime crash*: senza tipizzazione, il codice riceve un campo che si aspetta sia una stringa, ma è `null` — e il programma crasha a runtime, davanti a un utente reale. Con TypeScript strict, questo errore viene rilevato dal compilatore prima ancora che il codice possa essere avviato.

**Validazione ai confini del sistema.** Qualsiasi dato che entra nel sistema dall'esterno — un form compilato dall'utente, la risposta di un'API, una variabile di ambiente — viene validato con uno schema Zod prima di essere usato. L'errore che questa regola previene è il *garbage-in, garbage-out*: un utente che invia un UUID malformato, o un'API esterna che restituisce un campo in formato diverso dal previsto, non devono mai raggiungere la logica di business in una forma inattesa. I tipi TypeScript vengono derivati dagli schemi Zod con `z.infer<>`, così la definizione della struttura dati esiste in un solo posto.

**Default server-side.** I componenti sono Server Components per default. Il marcatore `"use client"` viene aggiunto solo quando un componente ha bisogno di interattività reale — stato React, hook, risposta immediata al click. L'errore che questa regola previene è la *fuga di dati sensibili*: un Server Component che legge dal database non invia il suo codice o le sue variabili al browser. Se lo stesso componente fosse dichiarato client-side per errore, il bundle JavaScript inviato al browser potrebbe contenere logica o dati che non dovrebbero mai uscire dal server.

**Token di design centralizzati.** I colori, i font e le spaziature sono definiti come variabili CSS in un unico file (`globals.css`). Nessun valore raw come `#1a2b3c` o classi Tailwind generiche come `zinc-500` sono ammessi nei componenti. L'errore che questa regola previene è la *deriva visiva*: senza un sistema centralizzato, il colore del testo principale può essere definito in modo leggermente diverso in ogni file, rendendo impossibile aggiornare il design in modo coerente. Con i token, cambiare una variabile si propaga automaticamente a tutto il sistema. È proprio questa regola che ha reso rilevabile la violazione descritta nella sezione 5.4: le classi `text-primary` e `text-muted` non corrispondevano ai token semantici e producevano il colore sbagliato.

**Struttura per dominio.** La cartella `lib/` è organizzata per dominio funzionale (`lib/email/`, `lib/stripe/`, `lib/ai/`), non per tipo di file. L'errore che questa regola previene è la *navigazione cieca*: senza una struttura chiara, trovare dove si trova una certa logica richiede di aprire file a caso. Con la struttura per dominio, aggiungere o modificare una funzionalità — ad esempio un nuovo tipo di email — significa toccare una sola cartella, non cercare tra `helpers/`, `utils/`, e `services/` distribuite per il progetto.

---

La qualità di un software non si misura solo da ciò che funziona, ma da quanto si riesce a rilevare e correggere ciò che non funziona — prima che arrivi in produzione. Questo capitolo descrive le tre pratiche adottate nel progetto per mantenere il codice affidabile: un framework di test strutturato su due livelli, un audit sistematico del codebase, e un insieme di standard di codice applicati in modo coerente durante tutto lo sviluppo.

---

## 5.1 Strategia di test

Il progetto adotta una distinzione netta tra due tipi di test, che rispondono a domande diverse.

I **test unitari** verificano che una singola funzione o azione si comporti correttamente in isolamento. Ogni dipendenza esterna — il database, le API di Stripe, Resend, Groq — viene sostituita da un sostituto controllato (*mock*). Questo permette di testare ogni ramo logico in modo rapido e deterministico, senza dipendere da una connessione di rete o da un database attivo.

I **test di integrazione** verificano che le componenti del sistema si comportino correttamente quando interagiscono tra loro — in particolare, che le query al database producano i risultati attesi su uno schema reale. Per questo scopo, i test di integrazione vengono eseguiti contro un database PostgreSQL locale avviato in un container Docker apposito. Non si utilizza l'ambiente di sviluppo o quello di produzione: il test ha il proprio database isolato, inizializzato con le stesse migrazioni del sistema reale.

Questa separazione è importante per due ragioni. I test unitari sono veloci (si eseguono in pochi secondi) e coprono tutti i casi limite e i rami condizionali. I test di integrazione sono più lenti ma garantiscono che la logica di business produca scritture corrette nel database reale — un tipo di errore che i mock non possono rilevare.

---

## 5.2 Test unitari — 423 test, zero fallimenti

Il progetto conta 423 test unitari, che coprono:

- **Tutte le Server Actions** — le funzioni che eseguono mutazioni di dati lato server (checkout, upload documenti, revisione AI, azioni admin, consegna del NIF, rinnovo della rappresentanza, impostazioni account). Ogni action viene testata per il percorso felice, le condizioni di errore, e i controlli di autorizzazione.
- **Il flusso di pagamento Stripe** — l'handler del webhook viene testato per l'idempotenza (due chiamate identiche non devono creare due ordini), per l'assenza di metadati, e per il percorso completo che include la creazione dell'ordine e l'invio dell'email di conferma.
- **La pipeline di revisione AI** — i cinque rami del sistema di revisione documenti: risposta *clear* (documento conforme), risposta *flagged* al primo tentativo, risposta *flagged* al secondo tentativo con escalation automatica, errore del modello con escalation, e risposta *clear* quando tutti e tre i documenti sono approvati (che scatena l'aggiornamento dello stato dell'ordine).
- **Il sistema di email** — tutti i template vengono testati come smoke test nelle quattro lingue (inglese, francese, spagnolo, tedesco) per verificare che rendano senza eccezioni e che le variabili vengano iniettate correttamente. La funzione di dispatch viene testata per ogni tipo di payload.
- **Le validazioni Zod** — gli schemi di validazione degli input utente sono testati con casi validi e casi limite (password troppo corta, email malformata, UUID non valido, campi obbligatori mancanti).

I test vengono eseguiti con Vitest, un framework di test moderno compatibile con l'ecosistema Next.js. Il comando `npx vitest run` produce un report con zero fallimenti e zero test saltati.

---

## 5.3 Test di integrazione — 64 test, database reale

I 64 test di integrazione sono distribuiti in quattro file, ognuno focalizzato su un dominio specifico.

**Query del database** — Le sei funzioni di query principali vengono testate con dati reali: `getOrderForUser` verifica che un utente non possa accedere all'ordine di un altro; `supersedePreviousDocuments` verifica che i documenti precedenti vengano marcati come superati senza toccare i documenti di altri ordini o di altri tipi; `markOrderDocumentsUnderReview` verifica che l'aggiornamento dello stato e il timestamp vengano scritti correttamente.

**Upload e revisione documenti end-to-end** — Il test più importante dell'intera suite verifica la catena completa di scritture al database che avviene quando il terzo e ultimo documento viene approvato dall'AI: il documento viene marcato come `approved: true` con il timestamp di approvazione, e l'ordine viene aggiornato da `documents_pending` a `documents_under_review`. Questo test non è riproducibile con i mock — solo un database reale può garantire che le due scritture avvengano nella sequenza corretta all'interno della stessa transazione.

**Idempotenza del webhook Stripe** — Due chiamate identiche all'handler del webhook devono produrre esattamente un ordine e un pagamento nel database. Questo test verifica che il controllo di idempotenza (basato sull'ID della sessione di checkout) funzioni correttamente su dati reali.

**Pacchetto operatore** — 18 casi verificano che la funzione `getOperatorPackageData` restituisca `null` in tutti i casi in cui il pacchetto non sarebbe ancora disponibile: ordine in stato sbagliato, documenti non ancora tutti approvati, dati personali incompleti. Il caso di successo verifica la forma completa del risultato.

---

## 5.4 Audit della qualità del codice

A progetto avanzato — dopo il completamento di 13 funzionalità principali — è stato condotto un audit sistematico del codebase. L'obiettivo era identificare eventuali violazioni degli standard di codice, duplicazioni di logica, o pattern che avrebbero potuto introdurre bug difficili da diagnosticare.

Ogni finding è stato classificato in tre categorie:

- **Violazione** (🔴) — rompe una regola fondamentale; deve essere corretta prima di procedere.
- **Smell** (🟡) — degrada la manutenibilità ma non è bloccante; da correggere quando conveniente.
- **Giustificato** (🟢) — si discosta da uno standard per una ragione documentata; accettato così com'è.

### Le tre violazioni critiche e come sono state corrette

**1. Tipo duplicato con semantica diversa.** Il file `app/actions/admin.ts` definiva il proprio tipo `ActionResult<T>` — un'interfaccia con tutti i campi opzionali — che coesisteva con il tipo `ActionResult<T>` definito in `lib/types.ts` come discriminated union. La differenza non era superficiale: con un'interfaccia a campi opzionali, TypeScript non riesce a garantire a compile time che `result.data` esista solo quando `result.success` è `true`. La correzione ha eliminato la definizione locale e importato il tipo condiviso, ripristinando la type-safety nelle azioni admin.

**2. Classi CSS con nome fuorviante.** Nel form di dettagli personali, alcune classi Tailwind come `text-primary` e `text-muted` producevano i colori sbagliati. In questo sistema di design, `text-primary` risolve al colore brand blue (tramite la catena di variabili CSS `--color-primary → --brand-primary`), non al colore del testo principale. Il testo intendeva essere grigio scuro (`text-text-primary`) o grigio medio (`text-text-muted`), ma appariva blu sull'interfaccia. La correzione ha sostituito le classi con i nomi semantici corretti.

**3. URL di redirect locale-inconsapevoli.** L'action di creazione della sessione di checkout costruiva gli URL di successo e di annullamento senza includere il locale: `/dashboard` e `/pricing` invece di `/en/dashboard` o `/fr/dashboard`. La struttura di routing con prefisso locale richiede il locale in ogni URL. Un utente tedesco che avesse completato il pagamento avrebbe potuto ritrovarsi nella dashboard in lingua inglese. La correzione ha aggiunto il locale come parametro dell'action, passato dal componente client che conosce il locale corrente.

### Gli yellow smell

Oltre alle tre violazioni, l'audit ha documentato 14 *smell* — pattern che non rompono il comportamento ma aumentano il rischio di future regressioni. Tra i più significativi:

- Una costante `statusOrder` (la sequenza degli stati dell'ordine) era duplicata in tre file diversi. Estratta come costante condivisa da un unico file.
- Le etichette di stato nell'admin bypassavano il sistema di traduzione, convertendo i nomi degli stati con `.replace(/_/g, ' ')` invece di usare le chiavi di traduzione già esistenti.
- Il componente di revisione documenti accedeva direttamente al client Supabase Storage invece di usare una funzione di utilità dedicata, accoppiando la UI alla forma del client.

Tutti i 14 smell sono stati tracciati. Al momento della consegna, sei di essi sono stati corretti nelle sessioni successive all'audit; gli altri otto rimangono documentati per una sessione di refactoring futura.

---

## 5.5 Standard di codice

Un modello di linguaggio non ha una comprensione reale dell'architettura di un sistema. Ha pattern appresi durante il suo addestramento — convenzioni generiche, soluzioni comuni, approcci che funzionano nella maggior parte dei casi — e li applica per default, anche quando il progetto ha scelto deliberatamente qualcosa di diverso.

Il risultato concreto, quando si sviluppa senza vincoli espliciti, è codice che *funziona* ma non è *corretto*: valori hardcodati invece di token centralizzati, tipi approssimativi (`any`) invece di interfacce definite, workaround che risolvono il sintomo invece della causa, stili scritti in tre modi diversi nello stesso progetto. Il codice supera i controlli di compilazione, ma introduce incoerenze che diventano bug difficili da trovare settimane dopo, quando il contesto è cambiato.

Il problema è strutturale. I modelli di linguaggio hanno un contesto limitato: in una sessione lunga, le decisioni architetturali prese all'inizio vengono dimenticate. Il modello inizia a usare le sue pratiche di addestramento di default, che possono essere datate o semplicemente diverse da quelle del progetto. Aggiunge una patch invece di capire la causa. Hardcoda un valore invece di cercare dove quel valore è già definito. Crea un tipo nuovo invece di importare quello che esiste già.

Gli standard di codice in questo progetto servono esattamente a questo: sono un insieme di regole scritte in anticipo, incluse nel contesto di ogni sessione di sviluppo, che vincolano l'AI a produrre output coerenti con l'architettura del sistema — indipendentemente da quanto tempo è passato dall'inizio del progetto. Il file `context/code-standards.md` è uno dei documenti letti dall'AI prima di ogni sessione. Non è un documento educativo rivolto a un team umano: è un documento di vincolo rivolto al modello.

Le più rilevanti, con il tipo di errore che ciascuna previene:

**TypeScript strict.** La modalità strict è attiva sull'intero progetto. Non è consentito usare il tipo `any` — ogni dato deve avere una forma definita esplicitamente. L'errore che questa regola previene è il *runtime crash*: senza tipizzazione, il codice riceve un campo che si aspetta sia una stringa, ma è `null` — e il programma crasha a runtime, davanti a un utente reale. Con TypeScript strict, questo errore viene rilevato dal compilatore prima ancora che il codice possa essere avviato.

**Validazione ai confini del sistema.** Qualsiasi dato che entra nel sistema dall'esterno — un form compilato dall'utente, la risposta di un'API, una variabile di ambiente — viene validato con uno schema Zod prima di essere usato. L'errore che questa regola previene è il *garbage-in, garbage-out*: un utente che invia un UUID malformato, o un'API esterna che restituisce un campo in formato diverso dal previsto, non devono mai raggiungere la logica di business in una forma inattesa. I tipi TypeScript vengono derivati dagli schemi Zod con `z.infer<>`, così la definizione della struttura dati esiste in un solo posto.

**Default server-side.** I componenti sono Server Components per default. Il marcatore `"use client"` viene aggiunto solo quando un componente ha bisogno di interattività reale — stato React, hook, risposta immediata al click. L'errore che questa regola previene è la *fuga di dati sensibili*: un Server Component che legge dal database non invia il suo codice o le sue variabili al browser. Se lo stesso componente fosse dichiarato client-side per errore, il bundle JavaScript inviato al browser potrebbe contenere logica o dati che non dovrebbero mai uscire dal server.

**Token di design centralizzati.** I colori, i font e le spaziature sono definiti come variabili CSS in un unico file (`globals.css`). Nessun valore raw come `#1a2b3c` o classi Tailwind generiche come `zinc-500` sono ammessi nei componenti. L'errore che questa regola previene è la *deriva visiva*: senza un sistema centralizzato, il colore del testo principale può essere definito in modo leggermente diverso in ogni file, rendendo impossibile aggiornare il design in modo coerente. Con i token, cambiare una variabile si propaga automaticamente a tutto il sistema. È proprio questa regola che ha reso rilevabile la violazione descritta nella sezione 5.4: le classi `text-primary` e `text-muted` non corrispondevano ai token semantici e producevano il colore sbagliato.

**Struttura per dominio.** La cartella `lib/` è organizzata per dominio funzionale (`lib/email/`, `lib/stripe/`, `lib/ai/`), non per tipo di file. L'errore che questa regola previene è la *navigazione cieca*: senza una struttura chiara, trovare dove si trova una certa logica richiede di aprire file a caso. Con la struttura per dominio, aggiungere o modificare una funzionalità — ad esempio un nuovo tipo di email — significa toccare una sola cartella, non cercare tra `helpers/`, `utils/`, e `services/` distribuite per il progetto.

# Capitolo 6 — Sviluppo assistito dall'intelligenza artificiale

---

## Introduzione: il vibe coding e i suoi rischi

Negli ultimi due anni, una nuova modalità di sviluppo software si è diffusa rapidamente tra sviluppatori di tutti i livelli: il **vibe coding**. Il termine descrive un approccio in cui lo sviluppatore delega quasi interamente la scrittura del codice a un'AI, limitandosi a descrivere vagamente ciò che vuole e ad accettare l'output senza una comprensione reale di ciò che viene prodotto.

Il vibe coding ha un appeal immediato: sembra veloce, sembra produttivo, e richiede uno sforzo apparentemente minimo. Ma nasconde una serie di rischi concreti che emergono inevitabilmente nel tempo:

**Falsa produttività.** Il codice generato senza comprensione può sembrare funzionante in superficie, ma contenere assunzioni errate, casi limite non gestiti, o logica incompatibile con il resto del sistema. Il problema non si manifesta subito — emerge settimane dopo, quando qualcosa smette di funzionare in produzione.

**Accumulo di debito tecnico.** Senza una visione architetturale coerente, l'AI tende a risolvere ogni problema in modo indipendente — workaround qui, hardcoded value là, patch su patch. Il risultato è un codebase che funziona ma che diventa progressivamente più difficile da capire, modificare, o estendere.

**Incomprensione del codice prodotto.** Chi non capisce il codice che usa non è in grado di individuare i suoi errori, di valutarne la qualità, o di prendere decisioni informate su come estenderlo. È una posizione di dipendenza totale dallo strumento — il contrario di una competenza.

**Soluzioni insicure o di bassa qualità.** Un'AI che non conosce i requisiti di sicurezza specifici del sistema può generare codice che espone dati sensibili, bypassa controlli di autenticazione, o gestisce errori in modo che crea vulnerabilità. Senza un developer che capisca cosa sta succedendo, questi problemi non vengono mai rilevati.

**Incapacità di fare manutenzione.** Un codebase scritto in vibe coding è difficile da mantenere da chiunque — incluso lo sviluppatore che l'ha creato — perché le decisioni non sono state prese consapevolmente e non esistono principi coerenti a cui fare riferimento.

Questo capitolo descrive l'approccio alternativo adottato in questo progetto: uno sviluppo assistito dall'AI che mantiene il controllo architetturale in mano al developer, usa l'AI come strumento di implementazione ad alta velocità, e compensa strutturalmente i limiti dei modelli di linguaggio.

---

## Cosa sono un LLM e un AI agent

Per capire perché questo approccio è necessario, è utile capire brevemente come funzionano questi strumenti.

Un **Large Language Model** (LLM) — come GPT, Claude, o Llama — è un modello statistico addestrato su enormi quantità di testo. Non "capisce" il testo nel senso umano del termine: impara a predire quale sequenza di parole (o token) è più probabile dato un contesto. Quando genera codice, non sta ragionando sulla logica del sistema — sta producendo output statisticamente plausibile in base ai pattern visti durante l'addestramento.

Questo spiega molte delle sue caratteristiche: è molto bravo a produrre codice sintatticamente corretto, segue le convenzioni che ha visto più spesso durante il training, e produce output con sicurezza anche quando è sbagliato — perché la "sicurezza" non è una valutazione della correttezza, ma una proprietà della generazione.

Un **AI agent** (o AI coding agent) è un LLM a cui sono stati aggiunti strumenti: la capacità di leggere e scrivere file, eseguire comandi nel terminale, navigare il codebase, chiamare API. Non è solo un assistente di chat — è un sistema che può eseguire azioni reali sull'ambiente di sviluppo. Claude Code, lo strumento usato in questo progetto, è un esempio di AI agent: legge file, scrive codice, esegue build, e aggiorna la documentazione.

La potenza di un AI agent è reale. La sua autonomia non elimina i suoi limiti strutturali — li amplifica, perché ora i problemi del modello si materializzano direttamente nel codebase invece che rimanere in una finestra di chat.

---

## 6.1 I problemi strutturali dell'AI come strumento di sviluppo

I modelli di linguaggio hanno caratteristiche strutturali che li rendono strumenti rischiosi se usati senza un framework esplicito.

**Allucinazioni.** Il modello genera output plausibile anche quando è errato. Nel contesto dello sviluppo, questo significa funzioni richiamate che non esistono, API descritte con comportamenti diversi da quelli reali, logica che sembra corretta ma produce risultati sbagliati. La particolarità delle allucinazioni è che non producono errori visibili — il codice compila, ma fa la cosa sbagliata. Senza un developer che comprende cosa dovrebbe fare il codice, queste allucinazioni passano inosservate.

**Context drift.** In sessioni di lavoro lunghe, il modello perde progressivamente il filo delle decisioni prese in precedenza. Un'architettura definita all'inizio della sessione viene contraddetta tre funzionalità dopo. Pattern esplicitamente evitati ricompaiono. Vincoli chiaramente enunciati vengono ignorati. Non è una limitazione di questo o quel modello — è una caratteristica strutturale: il modello ragiona su ciò che è visibile nella finestra di contesto attiva, e questa finestra ha un limite fisico.

**Natura stateless.** Ogni nuova conversazione ricomincia da zero. Il modello non ha memoria persistente: non sa cosa è stato costruito ieri, quali decisioni architetturali sono state prese la settimana scorsa, cosa è esplicitamente fuori scope per questo progetto. La sessione di oggi è indipendente dalla sessione di ieri.

**Incapacità di comprendere la logica di business.** Questo è forse il punto più importante. Il modello non capisce perché un sistema è fatto in un certo modo — conosce i pattern tecnici, ma non le ragioni specifiche per cui questo progetto ha scelto quei pattern. Il risultato concreto è che propone soluzioni che funzionano tecnicamente ma che non sono necessariamente appropriate per il contesto: usa l'approccio più comune visto nel training data, non l'approccio più adatto a questo sistema specifico.

**La strada più semplice.** Anche quando capisce il contesto, il modello tende alla soluzione più immediata: hardcoda un valore invece di cercare dove quel valore è già definito nel sistema, crea un nuovo tipo invece di importare quello esistente, aggiunge una patch invece di correggere la causa del problema. Il codice risultante funziona, ma accumula incoerenze che diventano difficili da gestire nel tempo.

---

## 6.2 La risposta: Context-Driven Engineering

Il principio guida adottato in questo progetto ha un nome: **Context-Driven Engineering**. L'idea è semplice: invece di aspettare che i modelli migliorino i loro limiti strutturali, si costruisce un sistema di contesto esterno che compensa quei limiti attivamente.

Prima ancora di scrivere una riga di codice, è stato creato un insieme di documenti strutturati che danno al modello tutto ciò di cui ha bisogno per costruire il progetto — e che vincolano esplicitamente ciò che è autorizzato a fare. Questi documenti non sono documentazione tradizionale (commenti, README, wiki scritti dopo il fatto). Sono il contrario: vengono scritti prima del codice, vengono aggiornati durante lo sviluppo, e vengono letti dal modello all'inizio di ogni sessione.

Un punto critico: questi documenti **non sono scritti per gli esseri umani**. Sono scritti per l'AI. La loro struttura, il loro livello di sintesi, e il modo in cui le informazioni sono organizzate sono ottimizzati per il recupero da parte di un modello di linguaggio — non per la leggibilità umana. Questo significa essere più sintetici di quanto sembrerebbe naturale, evitare ambiguità che un umano risolverebbe con il contesto, e rendere esplicite informazioni che normalmente si darebbero per scontate. È un'area in cui c'è ancora margine di miglioramento: scrivere documenti di contesto efficaci per un'AI è una competenza specifica che si affina con l'esperienza.

Il sistema è composto da nove elementi principali.

---

### `AGENTS.md` — il punto di ingresso

Il primo file che il modello legge in ogni sessione. Non contiene informazioni di prodotto: definisce le istruzioni operative. L'ordine esatto in cui leggere tutti gli altri file. Le regole non negoziabili:

```
- Do not skip steps.
- Do not infer missing information — log it as an open question in progress-tracker.md.
- Never invent behavior that is not defined in the context files.
```

Questo file esiste perché un modello senza istruzioni esplicite su come comportarsi fa assunzioni — e le assunzioni in un sistema complesso si accumulano in incoerenze che emergono settimane dopo.

---

### `project-overview.md` — il cervello del prodotto

Risponde alle domande fondamentali: chi usa questo prodotto, quale problema risolve, cosa è in scope, cosa è esplicitamente **fuori scope**. La sezione out-of-scope è critica quanto l'elenco delle funzionalità. Senza di essa, il modello costruisce ciò che sembra logico costruire — non ciò che è stato chiesto.

---

### `feature-specs/0-feature-list.md` — la roadmap completa

Prima ancora di scrivere le specifiche dettagliate delle singole funzionalità, è stata creata una lista ordinata di tutte le unità di sviluppo del progetto — 23 in totale, numerate in ordine di dipendenza. Ogni voce descrive brevemente cosa fa quella funzionalità e da quali altre dipende.

```
## 07a — Checkout Session
Done when:
- Stripe package is installed and client is initialized.
- Checkout session can be created from the app (app/actions/checkout.ts).
- ActionResult<T> is moved from app/actions/auth.ts to lib/types.ts.

Notes:
- Do not add webhook handling or DB record creation yet.

Depends on: 04, 06a.
```

Questa lista non è rimasta statica: durante lo sviluppo sono state aggiunte unità, altre sono state suddivise in sotto-unità, alcune note hanno catturato problemi scoperti durante l'implementazione (`⚠️ BLOCKED — AI provider: Gemini no longer has a usable free tier`). La feature list è la mappa del territorio — non una specifica dettagliata, ma una visione d'insieme che dà direzione all'intero processo.

---

### Le feature spec e il loro template

Ogni funzionalità del progetto ha una specifica dettagliata in un file separato. Tutte le specifiche seguono la stessa struttura, definita nel file `00-template.md`. Il template non è solo una guida per lo sviluppatore — è uno strumento di disciplina per il modello.

```
## Constraints     ← regole di architettura, token, TypeScript, i18n specifici per questa unità
## Design          ← decisioni visive (solo per feature con UI)
## Implementation  ← passi numerati, specifici, sequenziali
## Scope Limits    ← lista esplicita di cosa NON è incluso
## Check When Done ← condizioni verificabili che definiscono "completato"
```

La sezione **Scope Limits** è la più importante. Ogni voce previene una forma specifica di scope creep — il modello che, interpretando il silenzio come permesso, costruisce ciò che sembra logico costruire invece di ciò che era stato richiesto:

```
## Scope Limits
- Do not add webhook handling or DB record creation yet.
- Do not send order confirmation emails yet (that belongs to Feature 12).
- Do not implement document upload UI yet (that belongs to Feature 10).
```

La sezione **Check When Done** trasforma il completamento da giudizio soggettivo a lista di controllo verificabile. Si conclude sempre con `npm run build` passa come condizione non negoziabile.

Al modello viene dato un solo file di feature spec alla volta — mai l'intera cartella. Il modello completa l'unità, verifica ogni voce, aggiorna il progress tracker, e solo allora riceve il file successivo.

---

### `architecture-context.md` e `tech-spec.md` — le regole e il piano

`architecture-context.md` definisce la struttura tecnica del sistema e gli **invarianti** — vincoli rigidi che il modello non può violare anche quando una scorciatoia sembra conveniente. Esempio: *"ogni Server Action verifica il ruolo dell'utente prima di eseguire qualsiasi mutazione."*

`tech-spec.md` contiene i modelli di dati, le route API, i contratti tra sistemi. Viene scritto prima del codice che lo implementa — i modelli di dati in particolare, perché gli errori di schema sono i più costosi da correggere.

---

### `ui-context.md` e `code-standards.md` — il contratto visivo e implementativo

Come descritto nel Capitolo 5, questi due documenti vincolano rispettivamente le scelte visive e le pratiche di codice. Il modello li legge prima di ogni sessione che tocca UI o logica — impedendo che applichi le sue abitudini di default del training data invece delle convenzioni del progetto.

---

### `progress-tracker.md` — la memoria di sessione

Il documento aggiornato dal modello stesso dopo ogni modifica significativa. Tiene traccia di cosa è completato, cosa è in corso, le domande aperte da risolvere prima di procedere. Ogni sessione inizia con la lettura di questo file. Senza di esso, ogni sessione sarebbe una rinegoziazione dell'intero stato del progetto.

---

## 6.3 Il sistema di current-issues: la gestione dei bug

Parallelamente alle feature spec, esiste un sistema separato per la gestione dei bug: i file `current-issues/`. Stessa struttura delle feature spec, scopo inverso: non costruire comportamento nuovo, ma correggere comportamento rotto senza introdurre nuove rotture.

Ogni issue include la descrizione del comportamento errato vs quello atteso, le istruzioni precise per la correzione, e la riga obbligatoria: *"Do not change anything else."*

Questa separazione è un vincolo che impedisce al modello di "migliorare" il codice circostante mentre risolve il problema — una delle cause più comuni di regressioni nei progetti assistiti dall'AI.

---

## 6.4 MCP e Skills: estendere le capacità dell'agente

Un AI agent moderno non è limitato alle capacità del modello base. Due meccanismi permettono di estenderne le funzionalità in modo significativo.

**MCP — Model Context Protocol** è uno standard aperto sviluppato da Anthropic che definisce come gli AI agent possono connettersi a strumenti e servizi esterni attraverso un'interfaccia unificata. In pratica, significa che un agente AI può avere accesso diretto a: il database del progetto, il sistema di deployment (Vercel), i servizi cloud (Supabase), strumenti di progettazione (Figma, Excalidraw), servizi di comunicazione (Gmail, Slack), e qualsiasi altro servizio che implementa il protocollo.

In questo progetto, Claude Code aveva accesso tramite MCP a Supabase (per leggere lo schema del database in tempo reale), Vercel (per verificare log di deployment e errori di build in produzione), e Excalidraw (per creare diagrammi direttamente senza uscire dall'ambiente di sviluppo).

**Skills** (o slash command nel contesto di Claude Code) sono capacità predefinite che possono essere invocate con un comando specifico. Ad esempio, `/code-review` avvia una sessione di revisione del codice con parametri specifici, `/compact` compatta il contesto per ottimizzare la finestra di memoria. Alcune skill sono built-in nello strumento; altre possono essere definite nel file di configurazione del progetto.

Questi meccanismi hanno anche un impatto diretto sulla qualità del codice prodotto. Un modello di linguaggio è limitato alle conoscenze disponibili al momento del suo ultimo training: le API cambiano, i framework si aggiornano, le best practice evolvono. Grazie all'MCP, l'agente può consultare la documentazione ufficiale aggiornata in tempo reale — verificando, ad esempio, i pattern corretti per Next.js 16.2 o le API più recenti di Stripe — invece di affidarsi ciecamente a ciò che ha visto durante l'addestramento. Nella feature list di questo progetto, alcune voci includevano esplicitamente questa istruzione: *"verify current Stripe checkout best practices"*, *"verify current Next.js internationalization guidance — breaking changes since your last training"*. Non era una nota di stile: era un riconoscimento che il training data del modello ha una data di scadenza.

---

## 6.5 Il developer come orchestratore

Il sistema descritto nelle sezioni precedenti ridistribuisce i ruoli in modo radicale rispetto allo sviluppo tradizionale.

Il modello fa il lavoro di implementazione: scrive il codice, costruisce le query, scrive i test, aggiorna la documentazione. Lo fa a una velocità che un singolo sviluppatore umano non potrebbe eguagliare.

Il developer fa il lavoro di architettura e di controllo: definisce i requisiti, scrive le specifiche, prende le decisioni che il modello non può prendere da solo — perché richiedono comprensione della logica di business, dei vincoli normativi, delle priorità del prodotto. Verifica l'output del modello non riga per riga, ma a livello architetturale: il comportamento era quello specificato? I vincoli erano stati rispettati? La soluzione è appropriata per questo sistema, o è quella che funziona tecnicamente ma non rispetta le convenzioni del progetto?

In questo senso, lo sviluppo assistito dall'AI introduce un nuovo livello di astrazione: così come i framework hanno astratto la gestione delle connessioni HTTP, e i linguaggi di alto livello hanno astratto la gestione della memoria, l'AI coding agent astrae la scrittura del codice. Il developer smette di operare al livello dell'implementazione e inizia a operare al livello dei principi, delle regole e dell'architettura. È una trasformazione del ruolo, non una sua scomparsa — tema su cui torneremo nelle conclusioni.

> *"Il valore di un AI coding agent non è la capacità grezza — è la capacità grezza moltiplicata per la qualità dei vincoli che gli dai."*

---

## 6.6 Risultati concreti

L'applicazione risultante comprende: checkout con Stripe, revisione AI dei documenti, pannello admin multi-funzionale, coda operatore con priorità SLA, email transazionali in quattro lingue, internazionalizzazione completa, SEO e GEO, flusso di rinnovo, audit log, impostazioni account. Venti unità di funzionalità, costruite sequenzialmente, ciascuna verificata end-to-end prima che la successiva iniziasse. 423 test unitari e 64 di integrazione, scritti contestualmente alle funzionalità — non come fase separata di QA. Il tempo totale di sviluppo: circa tre settimane.

Questo ritmo non sarebbe stato sostenibile senza il sistema di contesto. Senza di esso, la velocità del modello si sarebbe tradotta in debito tecnico proporzionale all'output. Con il sistema, velocità e coerenza hanno viaggiato insieme.

# Capitolo 7 — Lessons Learned

---

Un progetto completato è sempre più chiaro guardandolo indietro che guardandolo avanti. Alcune decisioni che sembravano ovvie durante lo sviluppo si sono rivelate problematiche; altre che sembravano rischiose hanno funzionato meglio del previsto. Questa sezione documenta le lezioni più significative — non come elenco di successi, ma come riflessione onesta su cosa ha funzionato, cosa non ha funzionato, e cosa farei diversamente.

---

## 7.1 La specifica è il prodotto

La lezione più importante del progetto è anche quella che sembra più ovvia a posteriori: la qualità di ogni funzionalità consegnata dal modello era una funzione diretta della qualità della specifica che la descriveva.

Una specifica vaga produceva codice vago — tecnicamente funzionante, ma non allineato con l'intenzione reale. Una specifica precisa, con scope limits espliciti e passi di implementazione chiari, produceva codice che richiedeva minime correzioni. All'inizio del progetto le specifiche erano troppo lasche: descrivevano l'obiettivo senza definire i confini. Il modello riempiva i vuoti con le proprie assunzioni — e queste assunzioni erano raramente sbagliate, ma spesso non erano quelle giuste per questo sistema specifico.

Scrivere buone feature spec ha richiesto lo stesso tipo di pensiero preciso che serve per scrivere buon codice. È una competenza che si affina con la pratica e che ho sottovalutato all'inizio.

---

## 7.2 Il sistema di contesto va mantenuto, non solo creato

I documenti di contesto erano efficaci quanto erano aggiornati. Quando un'implementazione divergeva — anche leggermente — dalla specifica nel contesto, e quella divergenza non veniva corretta immediatamente, il modello iniziava a costruire sulla base di una realtà che non esisteva più.

Questi disallineamenti erano silenziosi: nessun errore, nessun warning. Solo comportamento sottilmente sbagliato che emergeva più tardi, quando il gap tra documentazione e codice era già diventato difficile da chiudere.

La lezione: aggiornare i documenti di contesto non è overhead amministrativo. In questo workflow è il meccanismo con cui il sistema mantiene la coerenza tra sessioni. Ci sono stati momenti in cui la priorità era avanzare con le funzionalità invece di aggiornare la documentazione — e invariabilmente quei momenti hanno creato problemi da correggere in seguito.

---

## 7.3 Evitare versioni bleeding-edge

Next.js 16.2 era una versione rilasciata molto recentemente al momento dell'inizio del progetto. È stato interessante lavorare con le funzionalità più nuove del framework, ma in pratica questo ha significato documentazione ufficiale scarsa su alcuni pattern, training data del modello che non copriva le nuove convenzioni, e situazioni in cui l'approccio corretto doveva essere scoperto per tentativi invece che consultato.

Il problema si è amplificato nel contesto AI-assisted: quando il modello non ha esempi consolidati nel suo training data, tende a improvvisare basandosi su pattern simili di versioni precedenti — che a volte funzionano, a volte no. Ogni ora di debug su comportamenti specifici di una versione nuova è un'ora sottratta allo sviluppo del prodotto.

La scelta più pragmatica sarebbe stata usare una versione leggermente meno recente ma già consolidata: più documentazione, più esempi, una community più preparata, e un modello AI con training data più ricco su quella versione specifica. La versione più recente non è quasi mai quella più adatta per un progetto con una timeline definita.

---

## 7.4 Il design system è più complesso di quanto sembri

I design token sono stati introdotti fin dall'inizio per una ragione precisa: non avevo ancora una visione chiara del design finale, e volevo centralizzare colori, spaziature, tipografia e variabili custom in un unico posto per semplificare le modifiche future. L'idea era corretta. L'esecuzione ha rivelato complessità che non avevo previsto.

Il problema reale è che nel progetto coesistono tre sistemi di variabili con logiche diverse: le **CSS Custom Properties** (variabili CSS native, definite in `:root`), le **Tailwind CSS Variables** (che Tailwind usa per generare le sue utility class), e le **shadcn/ui Variables** (che shadcn usa internamente per i suoi componenti, seguendo una convenzione di naming propria). Questi tre sistemi devono essere mappati tra loro in modo coerente. Quando la mappatura non è esplicita, il risultato è quello descritto nell'audit di qualità del Capitolo 5: classi come `text-primary` che risolvono a un colore diverso da quello atteso, perché il nome è condiviso tra sistemi con semantiche diverse.

Costruire un design token system efficace richiede pianificazione architettuale prima ancora di scrivere la prima variabile: definire quali layer esistono, come si relazionano, quale sistema ha precedenza su quale, e soprattutto avere già una naming convention coerente che eviti collisioni.

Ma c'è una lezione più profonda sotto questa. Le variabili da sole non bastano. Prima degli strumenti servono **principi di design**: una gerarchia visiva chiara, una palette colori definita con intenzione, una scala tipografica coerente, regole per la spaziatura, criteri per quando usare un componente invece di un altro. Senza questi principi come fondamenta, anche il miglior sistema di variabili diventa difficile da mantenere — perché le decisioni vengono prese caso per caso, e il risultato è incoerenza visiva che i token non possono correggere.

---

## 7.5 Strutturare anche gli errori, non solo le funzionalità

Le feature spec hanno funzionato perché avevano un template preciso: ogni specifica seguiva la stessa struttura, con le stesse sezioni, con le stesse aspettative. Questo ha permesso al modello di lavorare in modo prevedibile e al developer di verificare in modo sistematico.

La stessa logica si applica alla gestione dei bug e delle richieste di modifica — ma questa connessione non era chiara all'inizio del progetto. I primi bug report erano scritti in modo informale: una descrizione del problema, magari un file coinvolto, e un'aspettativa vaga sul risultato. Il modello li gestiva con risultati variabili.

Il sistema dei `current-issues/` file, introdotto più avanti, ha risolto questo: ogni bug segue una struttura standard (comportamento osservato, comportamento atteso, file da leggere prima di toccare qualcosa, istruzione esplicita "non cambiare altro"). La qualità delle correzioni è migliorata immediatamente.

La lezione generale è questa: più il contesto viene fornito in modo chiaro, consistente e ripetibile — indipendentemente dal tipo di task — migliori sono i risultati dell'agente. Il template non è burocrazia: è il modo in cui si standardizza la comunicazione con uno strumento che risponde meglio alle strutture prevedibili che all'ambiguità naturale del linguaggio.

---

## 7.6 Il vero lavoro è il sistema, non il prompt

Questa è forse la lezione più generale, e quella che ha le implicazioni più ampie.

All'inizio di ogni progetto AI-assisted, la tentazione è concentrarsi sulla qualità del singolo prompt: trovare la formulazione giusta, il tono giusto, le parole giuste per far produrre al modello l'output desiderato. Con l'esperienza, si capisce che questa è la parte meno importante del processo.

Il successo dello sviluppo assistito dall'AI dipende molto meno dalla qualità dei prompt singoli e molto di più dalla qualità del sistema costruito attorno all'AI: la documentazione, il contesto, i template, i processi di verifica, il feedback sistematico. In altre parole, il vero lavoro non è chiedere all'AI di scrivere codice — è progettare l'ambiente e le informazioni che le permettono di produrre soluzioni coerenti e mantenibili, sessione dopo sessione, funzionalità dopo funzionalità.

Un buon prompt in un sistema povero produce output mediocri. Un prompt mediocre in un sistema ben costruito produce output sorprendentemente buoni. La qualità del sistema si compone nel tempo: ogni documento aggiornato, ogni template migliorato, ogni vincolo reso più preciso rende il progetto successivo più veloce e più coerente del precedente.

---

## 7.7 Capire prima di costruire

Questa è la lezione più scomoda. È facile sentirsi produttivi nell'AI-assisted development: il modello risponde immediatamente, genera codice con sicurezza, e il movimento sembra progresso. Ma terminare una funzionalità per poi scoprire che non aveva senso nel sistema più ampio non è progresso — è rilavorazione.

Ci sono stati momenti in cui ho approvato output del modello senza capirlo davvero — non nei dettagli implementativi, che possono essere delegati, ma nelle implicazioni architetturali. Quei momenti hanno creato i problemi più costosi da risolvere: non bug evidenti, ma scelte strutturali che si sono rivelate sbagliate settimane dopo.

Il ruolo del developer-orchestratore richiede comprensione, non solo supervisione. Leggere la specifica, capire il flusso, verificare che il risultato corrisponda all'intenzione — questi sono il contributo principale. Premere "vai avanti" è la parte più facile; assicurarsi di capire cosa significa è la parte più importante.

---

## 7.8 Testare alla stessa velocità con cui si costruisce

Quando si muove in fretta, i test sembrano la prima cosa da rimandare. Sono in realtà l'ultima. La velocità di sviluppo AI introduce regressioni silenziosamente: il modello non ha memoria delle sessioni precedenti e non è consapevole degli effetti collaterali attraverso il codebase. Una funzionalità corretta oggi può essere rotta domani da una modifica in un file diverso.

In questo progetto, i test sono stati trattati come deliverable delle funzionalità — non come fase separata. Ogni feature spec includeva la condizione "test scritti e passanti" nel Check When Done. Il risultato — 423 test unitari e 64 di integrazione — non è un punto di orgoglio in sé; è la prova che la velocità di sviluppo era sostenibile nel tempo.

---

## 7.9 Cosa rifarei diversamente

Sintetizzando:

- **Scriverei specifiche più precise dall'inizio**, con scope limits più granulari. Le prime funzionalità hanno richiesto più iterazioni del necessario perché i confini non erano abbastanza chiari.
- **Aggiornerei i documenti di contesto immediatamente** dopo ogni divergenza, invece di rimandare. Il debito documentale è più costoso del debito tecnico in questo workflow.
- **Definirei i principi di design prima del design system e creeerei dei mockup**: gerarchia visiva, palette, tipografia, spaziatura — e solo dopo costruirei il sistema di token attorno a questi principi.
- **Pianificherei la mappatura CSS/Tailwind/shadcn esplicitamente** prima di scrivere la prima variabile, per evitare collisioni di naming.
- **Concorderei un mockup visivo dettagliato prima di qualsiasi implementazione UI**, eliminando il refactoring visivo a fine progetto.
- **Userei una versione stabile del framework**, non la più recente.
- **Strutturerei i documenti di contesto pensando esplicitamente al recupero da parte dell'AI** — più sintetici, più strutturati, con meno prosa e più liste verificabili.
- **Applicerei template strutturati fin dal primo bug report**, non solo alle feature spec.

# Capitolo 8 — Conclusioni e sviluppi futuri

---

Questo progetto è partito da una domanda concreta: è possibile costruire un'applicazione web completa — con pagamenti reali, logica di business complessa, e qualità del codice verificabile — usando un AI coding agent come strumento primario di sviluppo, senza cadere nelle trappole del vibe coding? La risposta, documentata nei capitoli precedenti, è sì. Ma la risposta più interessante non è quella tecnica: è quella metodologica.

---

## 8.1 RemoteNIF v2: un prodotto completo

RemoteNIF v2 è un'applicazione web production-ready per l'ottenimento remoto del codice fiscale portoghese. Il prodotto copre l'intero ciclo di vita di una pratica: dalla selezione del piano alla consegna del NIF, con gestione automatizzata dei documenti, revisione AI, workflow operativo con priorità SLA, e comunicazione multilingue con il cliente.

Tecnicamente, il sistema integra: un flusso di pagamento Stripe con gestione webhook idempotente, una pipeline di revisione documenti basata su Llama 4 Scout via Groq, un pannello amministrativo completo, una coda operatore con countdown SLA, email transazionali in quattro lingue tramite react-email e Resend, internazionalizzazione completa via next-intl, e ottimizzazione SEO e GEO. Il tutto costruito su Next.js 16.2 App Router, Supabase, e Drizzle ORM, distribuito su Vercel.

Il risultato finale comprende venti unità di funzionalità verificate, 487 test (423 unitari, 64 di integrazione), e un audit di qualità con zero violazioni aperte. Il tempo di sviluppo totale è stato di circa tre settimane.

Questo non è il punto principale. Il punto principale è *come* è stato costruito.

---

## 8.2 Un nuovo livello di astrazione

Per capire la trasformazione che lo sviluppo assistito dall'AI introduce nel ruolo del developer, è utile guardare come il mestiere si è evoluto storicamente.

Negli anni '50, scrivere software significava operare direttamente al livello del hardware — istruzioni macchina in codice binario. L'assembly ha introdotto il primo livello di astrazione: i mnemonici hanno separato il programmatore dalla rappresentazione numerica delle istruzioni. I linguaggi ad alto livello — C, poi Java, poi Python — hanno astratto la gestione della memoria, dell'allocazione, e dei dettagli architetturali della macchina. I framework web hanno astratto la gestione delle connessioni HTTP, dei protocolli, del rendering — permettendo al developer di pensare in termini di rotte, componenti, e modelli di dati invece che di socket e header.

Ogni livello di astrazione ha fatto la stessa cosa: ha spostato il developer a un piano operativo più alto, eliminando la necessità di gestire i dettagli del livello inferiore, e ha reso possibile costruire sistemi più complessi di quanto sarebbe stato possibile senza quell'astrazione.

Ma ogni livello ha anche introdotto nuove responsabilità. L'assembly ha chiesto al programmatore di gestire i registri invece dei bit. I linguaggi ad alto livello hanno richiesto la comprensione della semantica, dei tipi, della gestione delle eccezioni. I framework hanno richiesto la comprensione dei loro pattern architetturali e delle loro convenzioni. Chi pensava di poter ignorare il livello inferiore ha scoperto che le astrazioni perdono — che a un certo punto il livello inferiore emerge, e non capirlo diventa un problema.

L'AI coding agent è il livello di astrazione successivo. Astrae la scrittura del codice: non è più necessario che il developer scriva ogni riga — l'AI lo fa, a una velocità che un singolo developer umano non potrebbe eguagliare. Ma questa astrazione non elimina le responsabilità del developer: le trasforma.

Il developer che opera con un AI coding agent non scrive codice — opera al livello dei principi, delle specifiche, dell'architettura. Decide cosa costruire, perché, con quali vincoli, e in quale ordine. Definisce le regole che il modello deve rispettare. Verifica che l'output sia coerente con l'intenzione. Prende le decisioni che il modello non può prendere da solo — quelle che richiedono comprensione della logica di business, dei requisiti normativi, delle priorità strategiche del prodotto.

Come con ogni livello di astrazione, chi tenta di usarlo senza capire cosa succede al livello inferiore — senza capire il codice, i pattern architetturali, i tipi di errore che il modello produce — si trova in una posizione fragile. Le astrazioni perdono. Un developer che non capisce il codice che approva non è in grado di valutarne la correttezza, rilevarne i problemi strutturali, o prendere decisioni informate su come estenderlo.

Il nuovo ruolo richiede competenze diverse da quelle tradizionali, non competenze inferiori. Richiede la capacità di pensare ad alto livello con precisione — specificare senza ambiguità, definire confini senza perdere di vista il sistema complessivo, valutare soluzioni senza necessariamente averle scritte. È il lavoro del software architect reso accessibile a chi, fino a ieri, lavorava al livello dell'implementazione.

---

## 8.3 Context-Driven Engineering come metodologia trasferibile

Il sistema descritto nel Capitolo 6 — nove documenti strutturati che definiscono l'architettura, le convenzioni, le funzionalità e i vincoli del progetto — non è specifico di RemoteNIF. È un template metodologico applicabile a qualsiasi progetto di sviluppo assistito dall'AI.

Il principio fondamentale è invariante: i problemi strutturali dei modelli di linguaggio (allucinazioni, context drift, natura stateless, tendenza alla strada più semplice) non scompaiono con modelli più nuovi o più grandi. Si attenuano, ma non scompaiono. La risposta corretta non è aspettare modelli migliori — è costruire sistemi di contesto che compensino questi limiti in modo deliberato e sistematico.

Il Context-Driven Engineering è una disciplina di gestione del contesto AI. Il suo obiettivo non è scrivere buoni prompt — è costruire l'ambiente in cui il modello opera: i vincoli che definiscono cosa è autorizzato a fare, i documenti che gli permettono di capire il sistema in cui sta lavorando, i template che standardizzano la comunicazione tra developer e agente. La qualità di questo ambiente determina la qualità dell'output — più di qualsiasi raffinamento del prompt singolo.

Questa metodologia si compone nel tempo. Un sistema di contesto ben costruito non è solo più veloce della sessione corrente — è un asset per tutte le sessioni successive. Ogni documento aggiornato, ogni vincolo reso più preciso, ogni template migliorato migliora l'intera traiettoria del progetto. Il costo di mantenere il sistema è reale; il costo di non mantenerlo è più alto.

---

## 8.4 Limitazioni e vincoli aperti

Questo progetto ha dimostrato che l'approccio funziona. Non ha dimostrato che è privo di limitazioni.

**La submission al portale AT è ancora manuale.** L'operatore scarica il pacchetto documentale e lo carica manualmente su ebalcão. Le API del portale non sono pubblicamente accessibili, e il processo di accreditamento come intermediario digitale è separato dallo sviluppo del prodotto. Questa limitazione è strutturale — non un gap tecnico, ma un vincolo normativo e burocratico.

**Il training data ha una data di scadenza.** Come descritto nel Capitolo 6, il modello non conosce le novità introdotte dopo la propria data di addestramento. In questo progetto, alcune note nel feature list — "verify current Stripe checkout best practices", "breaking changes since your last training" — documentano i punti in cui questa limitazione è emersa concretamente. È una limitazione che richiede attenzione continua, non un problema risolto una volta per tutte.

**Il sistema di contesto richiede manutenzione attiva.** Documenti non aggiornati producono comportamenti incoerenti — silenziosamente, senza errori visibili. Il costo di mantenerli è basso per ogni singolo aggiornamento; il costo di non mantenerli si accumula sessione dopo sessione.

**La qualità dell'output dipende dalla qualità delle specifiche.** Il modello non ha capacità di comprendere le intenzioni implicite. Una specifica ambigua produce output ambiguo. Questa non è una limitazione del modello — è una caratteristica della comunicazione precisa come competenza.

---

## 8.5 Sviluppi futuri del prodotto

**Integrazione con ebalcão.** Quando le API del portale AT diventeranno accessibili — o quando RemoteNIF otterrà l'accreditamento come intermediario digitale — la submission manuale potrà essere sostituita da un'integrazione automatica. Questo eliminerebbe il principale collo di bottiglia operativo del processo attuale e permetterebbe la gestione di volumi significativamente più alti senza aumentare il team operativo.

**Tracking del NIF in tempo reale.** Una volta inviata la pratica, il cliente non ha visibilità su quando il NIF sarà effettivamente emesso. Un sistema di polling sul portale AT — o notifiche push al momento dell'emissione — ridurrebbe il carico sul supporto clienti e migliorerebbe l'esperienza post-pagamento.

**Espansione geografica.** Il sistema è costruito con l'internazionalizzazione come requisito di base. L'estensione a servizi simili in altri paesi — NIE spagnolo, codice fiscale italiano per non residenti — riutilizzerebbe l'intera infrastruttura con l'adattamento delle specifiche documentali e dei flussi normativi.

**Analytics e metriche operative.** Una dashboard interna con metriche di business — conversione per piano, tasso di rifiuto documenti per tipo, tempo medio di completamento pratica, SLA compliance per tier — darebbe visibilità operativa al team e permetterebbe decisioni data-driven sul prodotto.

---

## 8.6 Sviluppi futuri della metodologia

**Il sistema di contesto come template riutilizzabile.** L'architettura del context system costruita per RemoteNIF — la struttura in nove file, il template delle feature spec, il sistema dei current-issues — è un punto di partenza applicabile a qualsiasi progetto futuro. Non sarà identico, ma la struttura e i principi si trasferiscono.

**MCP come infrastruttura di integrazione.** Il Model Context Protocol è ancora nelle prime fasi di adozione diffusa. Man mano che il numero di server MCP disponibili cresce — strumenti per database, API documentazione, sistemi di monitoring — il developer-orchestratore avrà accesso a un set di capacità molto più ampio. L'approccio descritto in questo progetto scala naturalmente con questa espansione.

**Testing degli output AI come disciplina.** I test scritti in questo progetto verificano la correttezza del codice — non la correttezza del processo con cui è stato generato. Una disciplina più matura di sviluppo assistito dall'AI includerà strumenti per verificare sistematicamente che l'output del modello rispetti i vincoli architetturali definiti nel contesto: non solo "il codice compila?" ma "il codice usa i pattern del progetto?".

---

## 8.7 Riflessione finale

Il titolo di questo corso è *Full Stack Software Developer*. La definizione tradizionale di questo ruolo è la capacità di costruire l'intera stack di un'applicazione — frontend, backend, database, deployment — senza dipendere da team specializzati.

L'AI coding agent non cambia questa definizione nella sostanza. Cambia *come* si esercita. Il developer full-stack del prossimo decennio non sarà necessariamente più veloce a digitare codice: sarà più capace di specificare con precisione, di pensare in termini architetturali, di valutare la qualità delle soluzioni invece di produrle manualmente.

Questo progetto è, tra le altre cose, un argomento a favore di questa tesi. In tre settimane, un singolo developer ha costruito un sistema che avrebbe richiesto mesi con gli strumenti tradizionali. Questo è stato possibile non perché l'AI abbia sostituito il lavoro del developer — ma perché ha amplificato quello che il developer era in grado di fare quando operava al livello giusto: principi chiari, vincoli espliciti, architettura coerente.

Il lavoro che conta non è scrivere il codice. È costruire il sistema in cui il codice viene scritto bene.
