# Capitolo 1 — Introduzione

---

## Il Contesto del Prodotto

Il Numero di Identificazione Fiscale portoghese (NIF) è lo step zero di qualsiasi percorso in Portogallo. Serve per lavorare, aprire un conto bancario, acquistare un immobile, avviare un'attività, accedere a servizi pubblici. Non è uno dei tanti documenti burocratici — è il prerequisito di tutto il resto. Senza NIF non si inizia.

Per i non residenti, ottenerlo richiede di delegare il processo a un rappresentante legale tramite una Procura — una procedura gestibile interamente a distanza, ma che nel mercato esistente viene tipicamente offerta con scarsa trasparenza: prezzi poco chiari, nessuna visibilità sullo stato della pratica, comunicazione reattiva invece che proattiva.

L'idea alla base di RemoteNIF era precisa: entrare in un mercato con domanda consolidata — quella dei non residenti che si avvicinano al Portogallo — e differenziarsi non sul prezzo, ma sulla chiarezza. Prezzi fissi per fascia di urgenza, stato della pratica sempre visibile, comunicazioni automatiche a ogni cambio di stato. Un servizio che si comporta come un prodotto digitale moderno, non come uno studio legale con un form online.

RemoteNIF è quindi un'applicazione web con pagamento integrato, verifica automatica dei documenti tramite AI, e una dashboard che traccia l'intera pratica fino alla consegna del NIF.

Il prodotto non è l'oggetto di questa tesi. È il veicolo.

---

## Il Vero Oggetto: Come è Stato Costruito

Questa versione di RemoteNIF non è il prodotto live. È una ricostruzione privata, avviata con uno scopo preciso: sviluppare e testare un metodo sistematico per costruire software reale con l'assistenza dell'intelligenza artificiale.

La domanda alla base del progetto non era *"come si ottiene un NIF?"* ma *"come si costruisce un'applicazione complessa in modo professionale, usando l'AI come strumento di sviluppo?"*

Rispondere a questa domanda ha richiesto costruire qualcosa abbastanza complesso da rendere il metodo significativo: autenticazione, pagamenti, gestione dei file, ruoli utente distinti, internazionalizzazione in quattro lingue, review automatica dei documenti tramite AI, pipeline CI/CD, oltre 200 test. RemoteNIF ha fornito quel contesto.

---

## I Due Binari di Questa Tesi

Tutta la tesi si muove su due binari paralleli, strettamente connessi tra loro.

**Primo binario — Lo sviluppo assistito da AI come metodo professionale.**
Al centro del progetto c'è un sistema chiamato `context/`: una cartella con 12 documenti strutturati che definiscono il prodotto, l'architettura, i flussi utente, gli standard di codice, e le regole di lavoro. Ogni sessione di sviluppo inizia leggendo questi documenti in un ordine preciso. Ogni funzionalità viene consegnata all'AI come una specifica autonoma — una *feature spec* — scritta in anticipo, con scope definito e criteri di verifica espliciti. L'AI esegue dentro questi vincoli. Il risultato è un processo tracciabile, ripetibile, e scalabile.

**Secondo binario — Le competenze di ingegneria del software.**
Usare l'AI bene non è una scorciatoia. Richiede le stesse competenze fondamentali di un ingegnere del software: saper pianificare un sistema, capirne l'architettura, scegliere le tecnologie giuste e sapere perché, scomporre un problema in unità di lavoro coerenti. Scrivere i documenti del `context/` ha richiesto di capire il prodotto in profondità. Scrivere le feature specs ha richiesto di sapere come si decompone un sistema. Ogni scelta tecnologica in questo progetto ha una ragione — e documentarla è parte del lavoro.

**Il punto di contatto tra i due binari** è questo: usare l'AI come strumento professionale di sviluppo *è* una competenza di ingegneria del software. Non sostituisce il pensiero architetturale, la pianificazione, e la comprensione del codice — li richiede. Questa tesi lo dimostra in pratica.

---

## Struttura della Tesi

I capitoli seguono una progressione logica. Si parte da una visione d'insieme del progetto e dell'architettura (Capitolo 2), si entra poi nel dettaglio delle tecnologie adottate (Capitoli 3–8), con un capitolo dedicato interamente al metodo di sviluppo assistito da AI (Capitolo 7). I capitoli finali raccolgono le lezioni apprese, le riflessioni sul percorso, e le conclusioni.

Per ogni tecnologia, la struttura è sempre la stessa: cos'è, perché è stata scelta, come è applicata in questo progetto specifico. L'obiettivo non è spiegare le tecnologie in astratto — è mostrare le decisioni dietro di esse.
