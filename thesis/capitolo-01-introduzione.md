# Capitolo 1 — Introduzione

---

## Il Contesto del Prodotto

Il Numero di Identificazione Fiscale (NIF) portoghese rappresenta il prerequisito fondamentale per qualsiasi percorso di trasferimento o investimento in Portogallo. Serve per lavorare, aprire un conto bancario, acquistare un immobile, avviare un'attività, accedere a servizi pubblici. Non è uno dei tanti documenti burocratici — rappresenta il punto di partenza per la maggior parte delle procedure necessarie a vivere e operare nel Paese

Per i non residenti, ottenerlo richiede di delegare il processo a un rappresentante legale tramite una Procura — una procedura ormai gestibile interamente a distanza, ma che nel mercato esistente viene tipicamente offerta con scarsa trasparenza: prezzi poco chiari, nessuna visibilità sullo stato della pratica, comunicazione reattiva invece che proattiva.

L'idea alla base di RemoteNIF era precisa: entrare in un mercato con domanda consolidata — quella dei non residenti che si avvicinano al Portogallo — e differenziarsi non sul prezzo, ma sulla chiarezza. Prezzi fissi per fascia di urgenza, stato della pratica sempre visibile, comunicazioni automatiche a ogni cambio di stato. Un servizio che si comporta come un prodotto digitale moderno, non come uno studio legale con un form online.

RemoteNIF è quindi un'applicazione web con pagamento integrato, verifica automatica dei documenti tramite AI, e una dashboard che traccia l'intera pratica fino alla consegna del NIF.

Il prodotto non è l'oggetto di questa tesi. È il veicolo.

---

## Il Vero Oggetto: Come è Stato Costruito

Questa implementazione di RemoteNIF differisce dalla versione consegnata durante il periodo di tirocinio aziendale. È una ricostruzione sviluppata come progetto indipendente con l'obiettivo di applicare e valutare un approccio strutturato allo sviluppo software assistito da AI.

L'interesse del progetto non era limitato al dominio applicativo. Oltre alla realizzazione del servizio stesso, l'obiettivo era comprendere come affrontare in modo professionale e sistematico lo sviluppo di un'applicazione complessa utilizzando l'AI come strumento di supporto all'interno del processo di sviluppo.

A tal fine, è stato necessario selezionare un progetto sufficientemente articolato da includere problematiche reali: autenticazione, pagamenti, gestione dei file, ruoli utente distinti, internazionalizzazione in quattro lingue, review automatica dei documenti tramite AI, pipeline CI/CD e oltre 200 test. RemoteNIF ha fornito un contesto adeguato per affrontare questi aspetti all'interno di un'unica applicazione.


---

## I Due Binari di Questa Tesi

Tutta la tesi si muove su due aspetti paralleli, strettamente connessi tra loro.

Il primo riguarda l'utilizzo dell'intelligenza artificiale come strumento all'interno del processo di sviluppo software. Il secondo riguarda l'applicazione dei principi dell'ingegneria del software necessari per rendere tale processo affidabile, coerente e scalabile.

Nel corso del progetto è emerso che l'AI non riduce la necessità di competenze tecniche. Al contrario, attività come la definizione dell'architettura, la pianificazione del lavoro, la scomposizione dei requisiti, la gestione dei vincoli progettuali e la documentazione delle decisioni rimangono responsabilità dello sviluppatore.

I capitoli successivi descrivono quindi sia le scelte tecnologiche e architetturali adottate durante lo sviluppo di RemoteNIF, sia il metodo utilizzato per integrare l'AI all'interno di un processo strutturato. L'obiettivo non è valutare le capacità del modello in sé, ma mostrare come l'uso efficace di questi strumenti dipenda dall'applicazione di principi consolidati di ingegneria del software.

---

## Struttura della Tesi

I capitoli seguono una progressione logica. Si parte da una visione d'insieme del progetto e dell'architettura (Capitolo 2), si entra poi nel dettaglio delle tecnologie adottate (Capitoli 3–8), con un capitolo dedicato interamente al metodo di sviluppo assistito da AI (Capitolo 7). I capitoli finali raccolgono le lezioni apprese, le riflessioni sul percorso, e le conclusioni.

Per ogni tecnologia, la struttura è sempre la stessa: definizione della tecnologia, motivazione della scelta architettonica e modalità di implementazione nel progetto specifico. L'obiettivo non è fornire una spiegazione astratta degli strumenti, ma documentare e motivare le decisioni ingegneristiche alla base del loro utilizzo.
