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
