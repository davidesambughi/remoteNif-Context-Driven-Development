# Capitolo 1 — Introduzione

---

Lo sviluppo software sta attraversando una fase di profonda trasformazione. Gli strumenti di intelligenza artificiale sono diventati parte integrante del lavoro quotidiano di molti sviluppatori, riducendo drasticamente il tempo necessario per implementare funzionalità e generare codice.

Questa evoluzione, tuttavia, non elimina la necessità di comprendere i principi fondamentali dell'ingegneria del software. Al contrario, rende ancora più importanti attività come l'analisi dei requisiti, la progettazione architetturale, la definizione di standard, il controllo della qualità e la validazione e comprensione delle soluzioni sviluppate. Inoltre, l’aumento della velocità di produzione del codice può introdurre nuove insidie, come la percezione di produttività basata esclusivamente sulla quantità di codice generato, spesso a scapito della qualità, della coerenza architetturale e della reale comprensione delle soluzioni implementate

L'obiettivo di questa tesi è dimostrare la mia applicazione pratica di tali principi attraverso la progettazione e lo sviluppo di un prodotto software reale. In particolare, il lavoro documenta come i concetti studiati durante l'internship a Lisbona siano stati applicati lungo l'intero ciclo di vita del software, dall'analisi iniziale fino al testing e alla validazione finale.

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

I capitoli 2-5 documentano il caso studio e il prodotto sviluppato. I capitoli successivi approfondiscono il processo utilizzato, le pratiche adottate e le lezioni apprese durante lo sviluppo.

La tesi è organizzata in otto capitoli.

Il **Capitolo 2** analizza il problema da risolvere: il quadro normativo del NIF portoghese, il processo di ottenimento, il mercato esistente e i limiti delle soluzioni attualmente disponibili.

Il **Capitolo 3** descrive le scelte architetturali e tecnologiche del progetto, illustrando le ragioni che hanno guidato l'adozione delle diverse tecnologie e i compromessi valutati durante la progettazione.

Il **Capitolo 4** presenta le principali funzionalità dell'applicazione e il modo in cui esse contribuiscono a risolvere il problema individuato.

Il **Capitolo 5** descrive le pratiche di qualità adottate, tra cui la strategia di testing, le attività di audit del codebase e gli standard utilizzati per garantire affidabilità e manutenibilità del sistema.

Il **Capitolo 6** approfondisce il processo di sviluppo AI-assisted utilizzato durante il progetto, analizzandone vantaggi, limiti e problematiche operative. Vengono inoltre presentati gli strumenti, i documenti e le pratiche introdotte per mantenere coerenza e qualità durante lo sviluppo.

Il **Capitolo 7** raccoglie le lezioni apprese durante il progetto, evidenziando sia gli aspetti che hanno funzionato sia le criticità incontrate e le possibili aree di miglioramento.

Il **Capitolo 8** presenta le conclusioni finali, sintetizzando i risultati ottenuti e le competenze applicate durante la realizzazione del progetto, insieme a possibili sviluppi futuri del prodotto e del processo adottato.
