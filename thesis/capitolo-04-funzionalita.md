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

L'alternativa classica — una tabella comparativa con le caratteristiche dei piani affiancate — è il pattern più diffuso nei SaaS. Il problema è che presuppone che l'utente sappia già quale dimensione di valore gli interessa. In questo contesto, l'utente non sta scegliendo tra "più o meno funzionalità": sta risolvendo un problema con una scadenza. Inquadrare la scelta attorno alla domanda "quando hai bisogno del NIF?" elimina l'ambiguità e riduce il rischio di errori di piano — che avrebbero implicazioni operative per l'intero workflow.

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

**3. Analisi con Groq (Llama 4 Scout).** Il testo estratto viene inviato all'API di Groq per la classificazione. La scelta del provider è stata valutata su tre criteri: latenza, costo per richiesta, e condizioni di trattamento dei dati.

Il task da eseguire è classificazione, non generazione: il modello non deve produrre testo creativo, deve rispondere a una domanda binaria — il documento è conforme o no, e se no, perché. Per questo tipo di task, la latenza conta più della sofisticazione del modello: l'utente è in attesa in tempo reale.

Groq è stato scelto perché la sua architettura hardware — progettata specificatamente per l'inferenza LLM — produce latenze significativamente inferiori rispetto a provider generalisti come OpenAI per lo stesso tipo di richiesta. Llama 4 Scout è il modello della famiglia Llama ottimizzato per velocità su task strutturati. Il modello riceve il testo del documento e un prompt strutturato che descrive le specifiche richieste (ad esempio: la prova di indirizzo deve essere emessa negli ultimi tre mesi; i documenti accettati sono bollette di luce, acqua o gas, estratti conto, contratti d'affitto, o lettere ufficiali governative con indirizzo).

Durante lo sviluppo è stato valutato anche Google Gemini come alternativa. L'integrazione è stata abbandonata quando le condizioni del piano API sono cambiate in corso d'opera, rendendo il provider non utilizzabile nelle fasi di sviluppo e test. Questa esperienza ha evidenziato un rischio reale nello sviluppo AI-assisted: la dipendenza da provider esterni i cui termini possono cambiare in qualsiasi momento — un fattore da considerare nelle scelte architetturali di qualsiasi sistema che integri modelli di linguaggio.

**4. Risposta e feedback.** Il modello restituisce uno dei tre stati possibili:
- **Clear** — il documento è conforme, viene approvato automaticamente.
- **Flagged** — il documento presenta un problema specifico. L'utente riceve un messaggio con il motivo esatto: *"La bolletta è più vecchia di tre mesi"* oppure *"Il documento non include un indirizzo leggibile"*. Il feedback è sempre azionabile — non un generico rifiuto, ma un'indicazione su cosa correggere.
- **Error** — il modello non è riuscito ad analizzare il documento (file corrotto, PDF non leggibile, timeout).

### Escalation automatica

Dopo due tentativi falliti sullo stesso tipo di documento, il sistema smette di reinviare al modello e passa automaticamente alla revisione manuale. L'utente vede un messaggio che lo informa che il suo team verificherà i documenti entro quattro ore. L'admin riceve una notifica via email. Questo meccanismo serve a non bloccare indefinitamente l'utente in un loop di upload falliti quando il problema non è risolvibile in autonomia.

Un timeout di 30 secondi sulla chiamata al modello innesca lo stesso comportamento: se Groq non risponde entro il limite, la pratica viene escalata senza attendere oltre.

### Trattamento dei dati personali e conformità GDPR

Il flusso di revisione AI tratta dati personali sensibili — testo estratto da passaporti e documenti di identità. Questo richiede alcune considerazioni esplicite sul trattamento dei dati.

La base giuridica per il trattamento è l'esecuzione del contratto: l'utente ha acquistato il servizio di ottenimento del NIF, e la verifica dei documenti è necessaria per erogarlo. Senza questa verifica, il servizio non può essere completato.

Sul piano tecnico, il testo estratto dai documenti non viene mai persistito nel sistema. Viene processato in memoria, inviato a Groq per la classificazione, e scartato. Nel database viene salvato esclusivamente il risultato della revisione — uno dei codici di esito predefiniti (`passport_expired`, `address_too_old`, ecc.) — senza alcun dato personale del documento. I file originali rimangono nel bucket privato di Supabase Storage, non accessibile pubblicamente.

Groq opera come **data processor** ai sensi del GDPR: il suo Data Processing Addendum vieta esplicitamente l'utilizzo dei dati inviati via API per l'addestramento dei modelli. I dati sono trattati esclusivamente per produrre la risposta di classificazione richiesta.

**Limitazione nota.** Al momento del rilascio, l'interfaccia non include un disclaimer esplicito che informa l'utente che i suoi documenti vengono analizzati da un servizio AI di terze parti. Aggiungere un messaggio nel form di upload — *"I tuoi documenti vengono analizzati automaticamente per verificarne la conformità. Il testo estratto non viene conservato."* — migliorerebbe sia la trasparenza verso l'utente sia la postura GDPR del prodotto. È un intervento pianificato per la versione successiva.

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
