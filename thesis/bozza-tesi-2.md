# Capitolo 1 — Introduzione

Lo sviluppo di un prodotto software destinato alla produzione è un processo complesso che va ben oltre la semplice scrittura di codice. Richiede l'analisi dei requisiti, la progettazione architetturale, la valutazione dei compromessi, la definizione di standard di qualità e una rigorosa validazione.

Questo progetto di tesi nasce con un obiettivo preciso: dimostrare l'applicazione pratica dei principi dell'Ingegneria del Software e del *Software Development Life Cycle* (SDLC) appresi e consolidati durante la mia esperienza di internship a Lisbona. L'intento è documentare come metodologie teoriche e pratiche professionali possano essere orchestrate per governare la complessità di un sistema reale, dall'ideazione fino al rilascio.

Per dimostrare queste competenze, ho scelto di realizzare un prodotto software completo: **RemoteNIF v2**. Si tratta di una piattaforma web progettata per automatizzare e gestire l'ottenimento remoto del NIF (il codice fiscale portoghese) per cittadini stranieri. RemoteNIF, tuttavia, non rappresenta il fine ultimo di questa tesi, ma il **caso studio** — il veicolo attraverso il quale vengono analizzate le decisioni ingegneristiche, i pattern adottati e le strategie di testing.

### L'obiettivo della tesi: la comprensione dietro l'implementazione

Oggi, la generazione di codice è diventata più accessibile che mai. Tuttavia, il valore di un ingegnere del software non risiede nella quantità di codice prodotto, ma nella capacità di progettare sistemi manutenibili, valutarne la qualità e, soprattutto, giustificare le decisioni tecniche.

Per questo motivo, l'obiettivo fondamentale di questo elaborato non è semplicemente mostrare *cosa* è stato costruito, ma dimostrare una profonda comprensione del *perché* è stato costruito in un determinato modo. Ogni scelta architetturale, tecnologica o di processo descritta nei prossimi capitoli verrà analizzata seguendo una metrica rigorosa:
- Quale problema specifico doveva essere risolto?
- Quali alternative tecnologiche o metodologiche erano disponibili?
- Perché è stata scelta una determinata soluzione rispetto alle altre?
- Quali sono i limiti, i compromessi (*trade-off*) e i rischi della soluzione adottata?
- Come è stata verificata e validata la sua correttezza?

### Il contesto operativo: lo sviluppo AI-Assisted

L'intero ciclo di sviluppo di RemoteNIF è stato condotto utilizzando un approccio *AI-assisted*. È essenziale chiarire che **l'Intelligenza Artificiale non è il tema di questa tesi**, ma lo strumento operativo utilizzato all'interno del processo. 

L'utilizzo di agenti AI per la generazione del codice non ha eliminato la necessità di applicare i principi dell'ingegneria del software; al contrario, ne ha reso l'applicazione ancora più critica. Delegare l'implementazione a un modello linguistico richiede specifiche più precise, vincoli architetturale più rigidi e un'infrastruttura di testing molto più solida per prevenire regressioni e debito tecnico. In questo contesto, il mio ruolo si è elevato da quello di mero esecutore a quello di orchestratore e architetto del sistema: l'AI ha fornito la velocità di esecuzione, ma la direzione, le decisioni e la validazione sono rimaste di esclusiva competenza umana.

### Struttura dell'elaborato

La tesi è organizzata in modo da ripercorrere le fasi fondamentali del ciclo di vita del software:

Il **Capitolo 2** affronta l'analisi dei requisiti (Requirements Engineering). Definisce il problema di dominio (il quadro normativo portoghese), analizza i limiti delle soluzioni di mercato esistenti e deduce i requisiti funzionali e non funzionali che il sistema deve soddisfare.

Il **Capitolo 3** è dedicato alla progettazione (System Design & Architecture). Documenta le scelte tecnologiche (Next.js, Supabase, Stripe), giustificando l'adozione di un'architettura full-stack unificata, il design del database e la gestione dello stato dell'applicativo.

Il **Capitolo 4** esplora l'implementazione delle funzionalità *core* (Implementation), analizzando il flusso di checkout, l'integrazione di sistemi esterni e la gestione dei ruoli (Customer, Admin, Operator), sempre mantenendo il focus sui compromessi tecnici accettati.

Il **Capitolo 5** tratta il controllo qualità (Testing & Quality Assurance). Descrive la strategia di test (unitari e di integrazione), i processi di audit del codice e l'imposizione di standard rigidi per garantire l'affidabilità del sistema.

Il **Capitolo 6** analizza la gestione del processo di sviluppo. Descrive come il *Software Development Life Cycle* sia stato adattato per integrare strumenti AI in modo sicuro, documentando le strategie utilizzate per gestire il contesto, evitare derive architetturali e mantenere il controllo sul prodotto.

Il **Capitolo 7** raccoglie le *Lessons Learned*, analizzando criticamente gli errori commessi, i limiti delle soluzioni adottate e le competenze acquisite durante il progetto.

Il **Capitolo 8** presenta le conclusioni, sintetizzando i risultati ottenuti e tracciando i possibili sviluppi futuri sia del prodotto che della metodologia applicata.

# Capitolo 2 — Analisi del Dominio e Ingegneria dei Requisiti

L’analisi dei requisiti rappresenta la fase più critica del ciclo di vita del software: un errore o un'omissione in questa fase si propaga inevitabilmente sull'architettura e sul codice, con costi di correzione esponenziali. In questo capitolo viene analizzato il dominio del progetto, i vincoli normativi che lo governano e il processo che ha portato alla definizione dei requisiti funzionali e non funzionali di RemoteNIF.

## 2.1 Analisi del dominio: il NIF portoghese

Il NIF (*Número de Identificação Fiscal*) non è semplicemente un codice identificativo, ma una "chiave di accesso" fondamentale all'intero ecosistema amministrativo e finanziario portoghese. Dal punto di vista sistemistico, il NIF rappresenta una dipendenza bloccante per quasi tutti gli altri processi:
- Apertura di conti correnti bancari.
- Registrazione di contratti di locazione (fondamentale per la tutela legale dell'inquilino).
- Accesso ai servizi pubblici e stipula di contratti di lavoro.

Senza il NIF, l’individuo è "invisibile" per lo Stato Portoghese. La necessità di ottenerlo *prima* del trasferimento fisico nel Paese crea un problema di accesso remoto che costituisce il nucleo del dominio di questo progetto.

## 2.2 Vincoli Normativi: Il Decreto-Legge 44/2022

Un software che gestisce pratiche fiscali non può prescindere da una rigorosa analisi del quadro normativo. Il Decreto-Legge 44/2022 ha introdotto una distinzione cruciale che impatta direttamente sulla logica di business dell'applicazione:
1. **Cittadini UE/SEE:** Non hanno l'obbligo di nomina di un rappresentante fiscale.
2. **Cittadini Extra-UE/SEE con obblighi fiscali:** Devono obbligatoriamente nominare un rappresentante residente in Portogallo.
3. **Cittadini Extra-UE/SEE senza obblighi fiscali:** Possono evitare la rappresentanza attivando le notifiche elettroniche.

**Decisione Ingegneristica:** Questa distinzione non è solo informativa, ma è stata tradotta in **logica di validazione**. Il sistema non deve permettere a un cittadino UE di acquistare (per errore o disinformazione) un piano che includa la rappresentanza fiscale se questa non è necessaria, garantendo la correttezza etica e legale del servizio.

## 2.3 Analisi dei Gap e dello Stato dell'Arte

L'analisi dei competitor esistenti ha rivelato diversi "punti di fallimento" che ho deciso di risolvere attraverso scelte progettuali mirate:
- **Asimmetria informativa:** Molti servizi nascondono i costi reali (rinnovi annuali, spese amministrative) fino al checkout.
- **Assenza di Feedback Loop:** Il cliente, dopo il pagamento, perde visibilità sullo stato della pratica, generando ansia e carico sul supporto clienti.
- **Mancanza di gestione dell'urgenza:** I piani sono spesso generici e non tengono conto della *deadline* reale dell'utente.

## 2.4 Definizione dei Requisiti

Dall'analisi precedente sono stati estratti i requisiti che hanno guidato la progettazione del sistema.

### 2.4.1 Requisiti Funzionali (RF)
Il sistema deve permettere:
- **RF1 - Selezione dinamica del piano:** L'utente deve poter scegliere il servizio in base alla propria urgenza (SLA di consegna) e necessità legale (Rappresentanza).
- **RF2 - Gestione documentale assistita:** Il sistema deve permettere l'upload di documenti d'identità e prove di indirizzo, fornendo feedback immediato sulla conformità.
- **RF3 - Tracciamento granulare:** L'utente deve disporre di una dashboard che mostri lo stato attuale della pratica all'interno di una *macchina a stati* predefinita.
- **RF4 - Backoffice Operativo:** Gli operatori devono disporre di strumenti per la validazione manuale, il download dei pacchetti documentali e l'aggiornamento degli stati.

### 2.4.2 Requisiti Non Funzionali (RNF)
- **RNF1 - Sicurezza e Privacy:** Trattando documenti d'identità, il sistema deve garantire lo storage crittografato e l'accesso limitato ai file (Private Buckets).
- **RNF2 - Affidabilità dei Pagamenti:** La creazione dell'ordine nel database deve essere atomica e garantita anche in caso di fallimento della connessione dell'utente (implementazione tramite Webhook).
- **RNF3 - Internazionalizzazione:** Essendo un servizio per stranieri, l'interfaccia e le comunicazioni email devono supportare nativamente più lingue.
- RNF4 - Scalabilità Operativa: Il sistema deve minimizzare il lavoro manuale degli operatori tramite l'automazione della pre-verifica dei documenti.

# Capitolo 3 — Progettazione e Architettura

La progettazione di un sistema complesso come RemoteNIF v2 non riguarda solo la scrittura di codice funzionante, ma la creazione di un'architettura capace di gestire il rischio, garantire la sicurezza del dato e minimizzare l'errore umano. In questo capitolo verranno analizzate le scelte tecnologiche e progettuali, con un focus particolare sui ragionamenti e sui compromessi (*trade-offs*) che hanno portato alla configurazione finale del sistema.

## 3.1 La scelta del Framework: l’evoluzione Full-Stack con Next.js

Il cuore pulsante dell'applicazione è Next.js 16. La decisione di adottare questo framework è maturata dalla necessità di superare la tradizionale separazione tra frontend e backend, che spesso rappresenta una fonte di attrito e bug nelle architetture web. 

L’adozione dell'**App Router** e dei **React Server Components (RSC)** ha permesso di implementare un modello di esecuzione in cui la logica di business e l'accesso ai dati sensibili rimangono confinati sul server. Questo non solo migliora le prestazioni riducendo il JavaScript inviato al browser, ma eleva drasticamente il livello di sicurezza: il codice che dialoga con il database non viene mai esposto al client, eliminando un'intera classe di vulnerabilità.

Tuttavia, questa scelta non è priva di sfide. Sebbene un'architettura disaccoppiata (basata ad esempio su un backend in Go o Node/Express e un frontend React indipendente) avrebbe garantito una maggiore modularità e l'assenza di *vendor lock-in*, essa avrebbe richiesto la gestione di due codebase separate e la continua sincronizzazione dei contratti API. Per RemoteNIF, ho valutato che il vantaggio di avere un unico linguaggio (TypeScript) e un unico "confine di serializzazione" tramite le **Server Actions** superasse di gran lunga i benefici di una separazione fisica dei servizi, permettendo una velocità di sviluppo e una coerenza dei tipi di dato altrimenti difficili da ottenere.

## 3.2 La gestione del dato: Supabase e la pragmatica del BaaS

Per la persistenza e l'infrastruttura, si è scelto di non "reinventare la ruota", adottando **Supabase** come piattaforma di *Backend-as-a-Service*. Questa scelta riflette una decisione strategica: delegare la complessità operativa (gestione del database PostgreSQL, backup, autenticazione e storage dei file) a una piattaforma matura per potersi concentrare sulla logica di business specifica del NIF.

Un punto di forza fondamentale di questa scelta è l'integrazione delle **Row Level Security (RLS)** di PostgreSQL. Invece di affidarsi esclusivamente a controlli scritti nel codice applicativo — che potrebbero essere dimenticati o aggirati — la sicurezza è scolpita direttamente nel database. È il database stesso a garantire che un utente possa accedere solo ai propri documenti, agendo come un secondo guardiano insuperabile. 

Naturalmente, l'adozione di un BaaS comporta dei limiti. Si accetta una dipendenza operativa verso un fornitore specifico e si rinuncia a un controllo granulare su alcune configurazioni di basso livello del sistema. Nel contesto di questo progetto, tuttavia, la scalabilità e l'affidabilità garantite da Supabase sono state considerate prioritari rispetto alla massima libertà configurativa.

## 3.3 Type-Safety e Accesso ai Dati: Drizzle ORM

Per dialogare con il database, la scelta è ricaduta su **Drizzle ORM**. In un ecosistema dove **Prisma** domina il mercato, la scelta di Drizzle è stata dettata dalla ricerca di efficienza e trasparenza. Prisma, pur essendo eccellente per l'automazione, introduce un motore pesante e un linguaggio di schema proprietario che aggiunge uno strato di astrazione tra lo sviluppatore e SQL. 

Drizzle, al contrario, adotta un approccio "TypeScript-first" e "headless": non nasconde SQL, ma lo rende tipizzato. Questo ha permesso di creare uno schema che è contemporaneamente la fonte di verità per il database e per l'applicazione. Se una colonna viene rinominata o rimossa, il compilatore TypeScript segnala immediatamente l'errore in ogni punto del codice, garantendo una manutenzione sicura nel tempo. Il compromesso, in questo caso, è una curva di apprendimento leggermente più ripida e la necessità di una conoscenza più solida della sintassi SQL, che considero però un valore aggiunto per la qualità del lavoro ingegneristico.

## 3.4 Prevedibilità del sistema: La Macchina a Stati

Il processo di ottenimento di un documento fiscale è per sua natura sequenziale e rigoroso. Per riflettere questa realtà nel software, lo stato degli ordini è stato modellato attraverso una **Macchina a Stati Finiti**. 

Questa scelta progettuale garantisce che un ordine non possa mai trovarsi in una condizione logicamente impossibile — come ad esempio essere "Inviato alle Finanze" senza che i documenti siano stati preventivamente "Approvati". Ogni transizione di stato è presidiata da logica di business che verifica i prerequisiti e registra l'azione in un `audit_log`. Sebbene questa rigidità possa rendere più complessa la gestione di casi eccezionali, essa è il pilastro su cui poggia l'affidabilità del servizio e la fiducia dell'utente finale.

## 3.5 Sicurezza a due livelli: Proxy e Autorizzazione

Infine, l'architettura di sicurezza di RemoteNIF segue il principio della "difesa in profondità". 
Il primo livello è rappresentato dal `proxy.ts` (una funzionalità introdotta in Next.js 16), che agisce come un gatekeeper a livello di rete: intercetta le richieste e reindirizza gli utenti non autenticati prima ancora che il sistema consumi risorse per renderizzare una pagina. 
Il secondo livello risiede nelle Server Actions, dove ogni operazione di scrittura viene preceduta da un controllo di autorizzazione granulare (`requireRole`). Questo garantisce che, anche nell'ipotesi remota in cui un utente riuscisse a manipolare l'interfaccia client, il server rifiuterebbe categoricamente qualsiasi comando non autorizzato, proteggendo l'integrità del sistema.

# Capitolo 4 — Implementazione delle Funzionalità Core

Una volta definita l'architettura, la sfida si sposta sull'implementazione dei flussi utente. In questo capitolo verranno analizzate le tre colonne portanti di RemoteNIF: il sistema di pagamento resiliente, la pipeline di validazione documentale basata su intelligenza artificiale e la gestione operativa delle pratiche.

## 4.1 Il flusso di Checkout: Resilienza e Transazionalità

Il pagamento non è solo una transazione finanziaria, ma il trigger che dà inizio al ciclo di vita di un ordine nel database.

### 4.1.1 Architettura del pagamento con Stripe
Il sistema utilizza le **Stripe Checkout Sessions**. Questa scelta permette di delegare interamente la gestione dei dati sensibili (numeri di carta, conformità PCI) a un fornitore certificato. Tuttavia, la sfida ingegneristica risiede nel garantire che ogni pagamento andato a buon fine generi *esattamente* un ordine nel database, eliminando il rischio di ordini "fantasma" o pagamenti senza pratica associata.

### 4.1.2 Webhook vs Success Redirect
Il design di RemoteNIF non si affida al redirect dell'utente dopo il pagamento per creare l'ordine. Se l'utente chiudesse il browser prima del caricamento della pagina di successo, il sistema rimarrebbe in uno stato inconsistente. Per risolvere questo problema, è stato implementato un **modello basato su Webhook**. 
Quando Stripe conferma il pagamento, invia una notifica asincrona (HTTP POST) a un endpoint dedicato dell'applicazione. Solo in quel momento, all'interno di una **transazione atomica** di PostgreSQL, il sistema verifica l'idempotenza della richiesta (per evitare duplicati) e crea contemporaneamente l'ordine e il record di pagamento. Questo garantisce la massima resilienza anche in caso di instabilità della rete del cliente.

## 4.2 Pipeline di Validazione Documentale AI-Assisted

Il requisito di scalabilità operativa (**RNF4**) è stato affrontato attraverso l'integrazione di un sistema di pre-verifica automatica dei documenti caricati dall'utente.

### 4.2.1 Analisi Vision con Groq e Llama 4 Scout
L'utente carica documenti d'identità e prove di indirizzo. Invece di attendere la revisione manuale (che richiederebbe ore), il sistema invia il testo estratto dai file all'API di **Groq**, utilizzando il modello **Llama 4 Scout**. Il modello è istruito a comportarsi come un revisore esperto, verificando parametri specifici: la validità del passaporto, la data di emissione della bolletta (non più di 3 mesi) e la corrispondenza dei dati.

### 4.2.2 Gestione del Fallimento e Escalation
L'intelligenza artificiale non è infallibile e può produrre "allucinazioni" o falsi positivi. Per mitigare questo limite, ho progettato un meccanismo di **escalation automatica**. Se il sistema rileva due tentativi falliti consecutivi o se la chiamata al modello supera un timeout di 30 secondi, la pratica viene automaticamente spostata in una coda di "Revisione Manuale". In questo modo, l'AI funge da acceleratore per i casi standard, ma non diventa mai un blocco insuperabile per l'utente, garantendo sempre un'uscita di emergenza presidiata da un operatore umano.

## 4.3 Gestione Operativa e Coda Prioritaria

L'interfaccia rivolta agli operatori interni è progettata per massimizzare l'efficienza nella sottomissione manuale al portale governativo portoghese (*ebalcão*).

### 4.3.1 Il problema della sottomissione manuale
Attualmente, non esistono API pubbliche per l'invio automatizzato delle pratiche al fisco portoghese. Questo rappresenta un vincolo esterno ineliminabile. Per ottimizzare questo processo manuale, il sistema genera automaticamente un **pacchetto ZIP pre-assemblato** per ogni ordine, contenente tutti i documenti necessari rinominati secondo standard e un foglio di copertina PDF con i dati del cliente pronti per il copia-incolla.

### 4.3.2 Coda SLA e Gestione delle Priorità
La coda operatore implementa una logica di priorità dinamica. Gli ordini "Express" vengono visualizzati in cima alla lista con un countdown visivo che indica il tempo rimanente per rispettare lo SLA di 48 ore. Questa visualizzazione non è solo estetica: serve a dirigere l'attenzione dell'operatore sulle pratiche più urgenti, trasformando i requisiti di business in segnali visivi chiari e azionabili.

## 4.4 Ottimizzazione per i motori di risposta (GEO)

Oltre alla tradizionale SEO, ho implementato tecniche di **GEO (Generative Engine Optimization)**. Attraverso l'uso di dati strutturati in formato **JSON-LD** e un file `llms.txt`, l'applicazione comunica in modo semantico con i crawler dei modelli di linguaggio (es. ChatGPT, Perplexity). L'obiettivo è fare in modo che RemoteNIF non venga solo indicizzato, ma "compreso" dalle AI, aumentando la probabilità di essere citato come risorsa affidabile quando un utente interroga un assistente virtuale sul processo del NIF portoghese.

# Capitolo 5 — Qualità del Software e Validazione

La qualità di un sistema software non è una proprietà che può essere aggiunta alla fine dello sviluppo; deve essere integrata nel processo fin dalla prima riga di codice. Per RemoteNIF v2, la strategia di garanzia della qualità si è articolata su tre pilastri: una suite di test automatizzati su più livelli, un audit sistematico del codebase e l'imposizione di standard di codice rigorosi intesi come vincoli per lo sviluppo assistito dall'AI.

## 5.1 Strategia di Testing: Oltre il "Happy Path"

Nel progetto è stata adottata una distinzione netta tra test unitari e test di integrazione, con l'obiettivo di coprire sia la logica algoritmica sia le interazioni complesse con l'infrastruttura.

### 5.1.1 Test Unitari: Velocità e Copertura
I **423 test unitari** implementati fungono da rete di sicurezza per ogni singola unità logica del sistema. In questa fase, le dipendenze esterne (database, Stripe, servizi email) sono state sostituite da **mock** (sostituti controllati). Questo ha permesso di testare in modo deterministico ogni ramo condizionale: dalle validazioni degli input tramite Zod fino ai complessi calcoli degli SLA e delle scadenze fiscali. La velocità di esecuzione di questi test (pochi secondi per l'intera suite) ha permesso un feedback immediato durante ogni sessione di sviluppo.

### 5.1.2 Test di Integrazione: La necessità di un Database Reale
I **64 test di integrazione** rispondono a una domanda diversa: "Il sistema si comporta correttamente quando interagisce con il database reale?". Per rispondere, è stato utilizzato un database PostgreSQL isolato all'interno di un container **Docker**. 

Questa scelta è stata fondamentale per validare operazioni che i mock non potrebbero mai simulare correttamente, come le **transazioni atomiche**. Un esempio critico è il momento in cui l'utente carica l'ultimo dei tre documenti: in un'unica transazione, il sistema deve salvare il file, aggiornare lo stato del documento e far avanzare l'ordine allo stato successivo. Solo un test contro un database reale può garantire che, in caso di errore in uno di questi passaggi, l'intero sistema torni correttamente allo stato precedente (rollback), evitando corruzione dei dati.

## 5.2 L’Audit di Qualità: Imparare dagli Errori

A progetto avanzato, ho condotto un audit sistematico per identificare eventuali deviazioni dagli standard architetturali. Invece di nascondere le criticità, l'audit le ha classificate in tre categorie (Violazioni, Smell, Giustificati), trasformandole in un'opportunità di miglioramento.

L'esempio più significativo è stato il ritrovamento di una **duplicazione di tipi con semantica diversa**. Due definizioni diverse dell'interfaccia `ActionResult` coesistevano nel progetto: una utilizzava campi opzionali, l'altra una *discriminated union*. Questa inconsapevole divergenza impediva a TypeScript di garantire a compile-time che i dati di successo esistessero solo quando l'operazione era effettivamente riuscita. Identificare e correggere questa violazione ha ripristinato la robustezza del sistema e ha dimostrato l'importanza di una supervisione umana critica anche in un contesto di alta automazione.

## 5.3 Standard di Codice come Vincoli Operativi

In uno sviluppo assistito dall'intelligenza artificiale, gli standard di codice non servono solo alla leggibilità umana, ma fungono da **vincoli per l'agente AI**. I modelli di linguaggio tendono naturalmente verso la soluzione più comune o generica; gli standard forzano l'AI a produrre output coerenti con l'architettura specifica di RemoteNIF.

- **Type-Safety Assoluta:** L'uso vietato del tipo `any` obbliga a definire ogni interfaccia dati, trasformando potenziali crash a runtime in errori di compilazione risolvibili all'istante.
- **Validazione ai confini:** Ogni dato in entrata (form, API, webhook) viene filtrato da uno schema Zod. Questo garantisce il principio di "Fail Fast": se un dato è malformato, il sistema lo rifiuta immediatamente prima che possa inquinare la logica di business.
- **Design Token Centralizzati:** L'uso esclusivo di variabili CSS per colori e spaziature impedisce la "deriva visiva". Se un colore brand cambia, la modifica avviene in un unico file e si propaga coerentemente a tutto il sistema, eliminando la necessità di interventi manuali su decine di componenti.

In sintesi, la qualità in RemoteNIF v2 non è stata misurata dal numero di righe di codice, ma dalla capacità del sistema di resistere ai cambiamenti e di segnalare i propri errori in modo preventivo e automatico.

# Capitolo 6 — Metodologia: Context-Driven Engineering nell'era dell'AI

Il mercato dello sviluppo software sta assistendo alla diffusione del cosiddetto *vibe coding*: un approccio in cui lo sviluppatore delega ciecamente la scrittura del codice a un modello di linguaggio (LLM), focalizzandosi sull'output visivo e perdendo il controllo sull'architettura. Sebbene questo metodo offra una percezione di estrema velocità, genera rapidamente un debito tecnico insostenibile, introducendo soluzioni insicure, pattern incoerenti e codice non manutenibile.

Per lo sviluppo di RemoteNIF v2, ho adottato un paradigma diametralmente opposto, che ho definito **Context-Driven Engineering**. In questo approccio, l'Agente AI (in questo caso Claude Code) è trattato come un esecutore velocissimo ma privo di "memoria architetturale" e di comprensione del business. Per colmare queste lacune strutturali dell'AI (allucinazioni, "context drift", propensione a scegliere la strada più facile a scapito della solidità), ho dovuto progettare non solo il software, ma il **sistema di istruzioni** che governa la scrittura del software.

## 6.1 Il Sistema di Contesto: Istruire l'Esecutore

Prima di scrivere la prima riga di codice, ho definito una gerarchia rigorosa di file di contesto (`context/`). Questi documenti non sono scritti per essere letti da umani dopo il rilascio, ma sono ottimizzati per essere letti dall'AI *prima* di ogni sessione di lavoro. Essi definiscono i binari entro cui l'agente può operare.

1. **Il Contratto Operativo (`AGENTS.md`):** Il punto d'ingresso per l'AI. Impone regole non negoziabili: vietato saltare passaggi, vietato inventare funzionalità non descritte, obbligo di segnalare incongruenze.
2. **I Vincoli di Sistema (`architecture-context.md` e `code-standards.md`):** Dettano le regole dell'infrastruttura (es. l'obbligo di usare Server Actions per le mutazioni o di non usare `any` in TypeScript). Impediscono all'AI di usare pattern obsoleti imparati durante la sua fase di addestramento.
3. **La Memoria di Progetto (`progress-tracker.md`):** Risolve il problema della natura "stateless" dei modelli linguistici. Aggiornato alla fine di ogni sessione, mantiene traccia di cosa è stato fatto, cosa deve essere fatto e delle decisioni architetturali prese in corso d'opera.

## 6.2 Lo Sviluppo Guidato da Specifiche (Feature Specs)

Nell'approccio *Context-Driven*, l'AI non è mai lasciata libera di "costruire una funzionalità". Ogni blocco logico del sistema è governato da una **Feature Spec** dedicata (es. `07a-checkout.md`), che segue un template inflessibile:
- **Constraints:** Regole specifiche per quella singola funzionalità.
- **Implementation:** Passaggi algoritmici sequenziali.
- **Scope Limits:** Forse la sezione più importante. Definisce esplicitamente cosa l'AI **non** deve fare (es. "Non implementare la gestione del webhook ora"). Serve a prevenire lo *scope creep* tipico degli agenti autonomi.
- **Check When Done:** Le condizioni verificabili (incluso il passaggio dei test automatizzati) che determinano il completamento della feature.

## 6.3 Gestione dei Bug (Current Issues) e Model Context Protocol (MCP)

La stessa rigidità applicata allo sviluppo è stata applicata alla risoluzione dei bug. I file nella cartella `current-issues/` definiscono il comportamento atteso e il comportamento errato, aggiungendo un vincolo tassativo: *"Non modificare nulla al di fuori di questo scope"*. Questo impedisce all'AI di "migliorare" o riscrivere codice funzionante durante la risoluzione di un problema isolato, evitando regressioni silenziose.

Inoltre, per estendere le capacità dell'agente oltre i limiti del suo addestramento (che è fermo a una data passata), ho sfruttato il **Model Context Protocol (MCP)**. Questo standard ha permesso all'agente di interrogare direttamente il database Supabase in tempo reale, leggere i log di Vercel e accedere a documentazione API aggiornata (es. Stripe e Next.js 16.2), riducendo a zero le allucinazioni su interfacce obsolete.

## 6.4 Il nuovo ruolo dello Sviluppatore: da Esecutore ad Architetto

Questa metodologia trasforma radicalmente il ruolo dello sviluppatore. Il lavoro principale non si esaurisce più nella digitazione della sintassi; si sposta a un livello di astrazione superiore. Lo sviluppatore diventa un "architetto-orchestratore" il cui compito è:
1. Comprendere profondamente la logica di business e i vincoli normativi.
2. Progettare l'architettura dei dati e dei sistemi.
3. Tradurre la complessità in specifiche inequivocabili per l'agente.
4. Validare l'output non solo a livello sintattico (dove l'AI eccelle), ma a livello architetturale e di business.

Delegare la scrittura del codice non significa delegare l'ingegneria del software. Significa, piuttosto, assumersi la responsabilità totale della progettazione, usando l'AI come compilatore di idee ad altissima velocità.





