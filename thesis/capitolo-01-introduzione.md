# Capitolo 1 — Introduzione

---

## Il Contesto del Prodotto

Il NIF (Número de Identificação Fiscal), ovvero il numero di Identificazione Fiscale portoghese, rappresenta il prerequisito tecnico e legale fondamentale per qualsiasi percorso di trasferimento o investimento in Portogallo. E' necessario per lavorare, aprire un conto bancario, acquistare un immobile, avviare un'attività e accedere a servizi pubblici.

Per i non residenti, ottenerlo richiede di delegare il processo a un rappresentante legale tramite una Procura. Sebbene la procedura possa essere completata interamente da remoto, le soluzioni presenti sul mercato risultano spesso caratterizzate da frammentazione nelle comunicazioni, opacità nei costi e assenza di tracciamento in tempo reale della pratica.

RemoteNIF è un'applicazione web full-stack con pagamento integrato, verifica automatica dei documenti tramite AI, tre aree di accesso separate per cliente, admin e operatore, e interfaccia in quattro lingue (EN, FR, ES, DE).

Il contesto di partenza è quello del tirocinio: la startup opera nel settore real estate portoghese. Offrire il servizio NIF in quel contesto non è casuale ma un punto di intercettazione naturale: chi richiede il NIF è già un potenziale cliente per tutto ciò che viene dopo. Il prodotto però non è l'oggetto di questa tesi, ma il veicolo.

---

## La Ricostruzione del Progetto

Questa implementazione di RemoteNIF è distinta dalla versione consegnata durante il tirocinio. È stata sviluppata come progetto indipendente con l'obiettivo di applicare un metodo chiamato context-driven (o specification-driven) development: un approccio allo sviluppo software assistito da AI che integra le fasi classiche del Software Development Life Cycle — requisiti, progettazione, sviluppo, testing — con lo sviluppo guidato da agenti AI. La definizione dell'architettura e delle specifiche di funzionalità precede e guida la generazione del codice. Questo metodo evidenzia che l'efficacia dell'AI dipende dalle competenze ingegneristiche di base: la scomposizione del sistema, le scelte architetturali e la gestione dei vincoli rimangono a carico dello sviluppatore.

Il progetto include autenticazione, pagamenti Stripe, gestione dei file, ruoli utente (customer, admin, operator), internazionalizzazione in quattro lingue, verifica automatica dei documenti tramite AI, CI/CD, 600 test unitari e 167 integration test .

---

## Struttura della Tesi

La tesi analizza il progetto da due prospettive: le scelte tecnologiche adottate e il processo di sviluppo utilizzato per realizzarlo.

I capitoli seguono questa progressione: panoramica del progetto e architettura (Capitolo 2), tecnologie frontend (Capitolo 3), backend e database (Capitolo 4), pagamenti, validazione e comunicazioni (Capitolo 5), funzionalità avanzate (Capitolo 6), qualità e testing (Capitolo 7), sviluppo assistito da AI (Capitolo 8). I capitoli conclusivi raccolgono le lezioni apprese e le conclusioni. Per ciascuna tecnologia, la struttura è costante: definizione, motivazione della scelta e implementazione nel progetto. Il Capitolo 8 è dedicato interamente al metodo context-driven: i documenti di contesto, le feature specs e il protocollo agente.
