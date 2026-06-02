# Capitolo 4: AI-Assisted Development & Automation

L'intelligenza artificiale non è solo una funzionalità di RemoteNIF v2, ma è stata parte integrante del suo stesso processo di creazione. Questo capitolo esplora come l'AI sia stata utilizzata sia come **strumento di sviluppo** che come **motore di automazione** per l'utente finale.

## 4.1 Sviluppo guidato da Agenti AI: Workflow e Regole

A differenza dello sviluppo software tradizionale, RemoteNIF v2 è stato realizzato seguendo un framework rigoroso per **Agenti AI** (LLM). Questo approccio, definito "Spec-Driven Workflow", si basa su regole precise:
-   **Context-First Development:** Prima di scrivere una singola riga di codice, l'architettura e i requisiti vengono definiti in file di contesto (`.md`). L'AI utilizza questi file come "fonte di verità" per garantire che ogni incremento sia coerente con il sistema globale.
-   **Invarianti di Sistema:** Sono stati definiti dei vincoli tecnici invalicabili (es. "nessun accesso diretto al database dai componenti UI") che l'AI deve rispettare rigorosamente, garantendo una qualità del codice pari a quella di uno sviluppatore senior.
-   **Cicli di Validazione Iterativi:** Ogni funzionalità viene implementata in piccoli incrementi verificabili, con test automatizzati che confermano la correttezza di ogni passaggio prima di procedere al successivo.

Questo metodo dimostra come l'integrazione consapevole dell'IA nel ciclo di vita del software (SDLC) possa accelerare lo sviluppo riducendo drasticamente il debito tecnico.

## 4.2 Document Review: Integrazione Groq e Visione Artificiale

Una delle sfide principali di RemoteNIF v2 è la validazione dei documenti sensibili. Per risolverla, è stato implementato un sistema di **AI Document Review** basato su modelli LLM avanzati (Llama 3 via Groq API).

[IMMAGINE: Diagramma del Workflow AI: Caricamento Documento -> Estrazione Testo/Immagine -> Prompt Engineering -> Groq -> Risultato JSON -> Update Database]

### 4.2.1 Prompt Engineering per la Validazione Documentale

Il successo della revisione AI dipende dalla qualità del prompt. Ecco un estratto del prompt utilizzato per analizzare i passaporti:

```typescript
// Estratto da lib/ai/document-review.ts
const buildPrompt = (type: DocumentType) => `
  You are an expert Portuguese tax representative assistant.
  Analyze this ${type} and determine if it is clear and valid for a NIF application.
  
  RULES FOR PASSPORT:
  - Must be a valid passport (not expired).
  - All four corners must be visible.
  - The MRZ (Machine Readable Zone) at the bottom must be legible.
  
  Return ONLY a JSON object:
  {
    "status": "clear" | "flagged",
    "reasonKey": "specific_error_key" // if flagged
  }
`;
```

L'uso della tecnologia **Groq** assicura tempi di risposta inferiori ai 2 secondi, rendendo l'esperienza utente fluida e professionale, e riducendo il carico di lavoro degli operatori umani di oltre l'80%.
