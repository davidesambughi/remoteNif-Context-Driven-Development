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
