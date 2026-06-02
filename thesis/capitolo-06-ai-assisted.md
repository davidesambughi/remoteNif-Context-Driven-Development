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
