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

<!-- TODO: aggiungere una riga che riconosce cosa NON è testato — non ci sono test end-to-end UI (Playwright/Cypress). La commissione probabilmente chiederà "c'è qualcosa che non hai testato?". Meglio dirlo tu prima che aspettare la domanda. Anche: preparati a rispondere "come hai scelto cosa testare e cosa no?" -->

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

<!-- TODO: specificare brevemente perché gli 8 smell sono stati lasciati aperti — non erano bloccanti per il funzionamento del sistema, e il tempo rimanente è stato allocato a funzionalità più critiche. Così sembra capacity planning consapevole, non incompletezza. -->

---

## 5.5 Standard di codice

Un modello di linguaggio non ha una comprensione reale dell'architettura di un sistema. Ha pattern appresi durante il suo addestramento — convenzioni generiche, soluzioni comuni, approcci che funzionano nella maggior parte dei casi — e li applica per default, anche quando il progetto ha scelto deliberatamente qualcosa di diverso.

Il risultato concreto, quando si sviluppa senza vincoli espliciti, è codice che *funziona* ma non è *corretto*: valori hardcodati invece di token centralizzati, tipi approssimativi (`any`) invece di interfacce definite, workaround che risolvono il sintomo invece della causa, stili scritti in tre modi diversi nello stesso progetto. Il codice supera i controlli di compilazione, ma introduce incoerenze che diventano bug difficili da trovare settimane dopo, quando il contesto è cambiato.

Il problema è strutturale. I modelli di linguaggio hanno un contesto limitato: in una sessione lunga, le decisioni architetturali prese all'inizio vengono dimenticate. Il modello inizia a usare le sue pratiche di addestramento di default, che possono essere datate o semplicemente diverse da quelle del progetto. Aggiunge una patch invece di capire la causa. Hardcoda un valore invece di cercare dove quel valore è già definito. Crea un tipo nuovo invece di importare quello che esiste già.

<!-- TODO: riformulare l'apertura di questa sezione — gli standard di codice sono una pratica di software engineering professionale, non solo una risposta ai limiti dell'AI. L'AI li rende più necessari ma non li inventa. Il primo paragrafo rischia di far sembrare che gli standard esistano solo perché l'AI sbagliava. -->

Gli standard di codice in questo progetto servono esattamente a questo: sono un insieme di regole scritte in anticipo, incluse nel contesto di ogni sessione di sviluppo, che vincolano l'AI a produrre output coerenti con l'architettura del sistema — indipendentemente da quanto tempo è passato dall'inizio del progetto. Il file `context/code-standards.md` è uno dei documenti letti dall'AI prima di ogni sessione. Non è un documento educativo rivolto a un team umano: è un documento di vincolo rivolto al modello.

Le più rilevanti, con il tipo di errore che ciascuna previene:

**TypeScript strict.** La modalità strict è attiva sull'intero progetto. Non è consentito usare il tipo `any` — ogni dato deve avere una forma definita esplicitamente. L'errore che questa regola previene è il *runtime crash*: senza tipizzazione, il codice riceve un campo che si aspetta sia una stringa, ma è `null` — e il programma crasha a runtime, davanti a un utente reale. Con TypeScript strict, questo errore viene rilevato dal compilatore prima ancora che il codice possa essere avviato.

**Validazione ai confini del sistema.** Qualsiasi dato che entra nel sistema dall'esterno — un form compilato dall'utente, la risposta di un'API, una variabile di ambiente — viene validato con uno schema Zod prima di essere usato. L'errore che questa regola previene è il *garbage-in, garbage-out*: un utente che invia un UUID malformato, o un'API esterna che restituisce un campo in formato diverso dal previsto, non devono mai raggiungere la logica di business in una forma inattesa. I tipi TypeScript vengono derivati dagli schemi Zod con `z.infer<>`, così la definizione della struttura dati esiste in un solo posto.

**Default server-side.** I componenti sono Server Components per default. Il marcatore `"use client"` viene aggiunto solo quando un componente ha bisogno di interattività reale — stato React, hook, risposta immediata al click. L'errore che questa regola previene è la *fuga di dati sensibili*: un Server Component che legge dal database non invia il suo codice o le sue variabili al browser. Se lo stesso componente fosse dichiarato client-side per errore, il bundle JavaScript inviato al browser potrebbe contenere logica o dati che non dovrebbero mai uscire dal server.

**Token di design centralizzati.** I colori, i font e le spaziature sono definiti come variabili CSS in un unico file (`globals.css`). Nessun valore raw come `#1a2b3c` o classi Tailwind generiche come `zinc-500` sono ammessi nei componenti. L'errore che questa regola previene è la *deriva visiva*: senza un sistema centralizzato, il colore del testo principale può essere definito in modo leggermente diverso in ogni file, rendendo impossibile aggiornare il design in modo coerente. Con i token, cambiare una variabile si propaga automaticamente a tutto il sistema. È proprio questa regola che ha reso rilevabile la violazione descritta nella sezione 5.4: le classi `text-primary` e `text-muted` non corrispondevano ai token semantici e producevano il colore sbagliato.

**Struttura per dominio.** La cartella `lib/` è organizzata per dominio funzionale (`lib/email/`, `lib/stripe/`, `lib/ai/`), non per tipo di file. L'errore che questa regola previene è la *navigazione cieca*: senza una struttura chiara, trovare dove si trova una certa logica richiede di aprire file a caso. Con la struttura per dominio, aggiungere o modificare una funzionalità — ad esempio un nuovo tipo di email — significa toccare una sola cartella, non cercare tra `helpers/`, `utils/`, e `services/` distribuite per il progetto.
