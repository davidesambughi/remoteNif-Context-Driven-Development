# Capitolo 2: Analisi dei Requisiti e System Design

## 2.1 Requisiti Funzionali

L'analisi dei requisiti ha portato alla definizione di tre attori principali, ognuno con responsabilità e flussi di lavoro distinti.

### 2.1.1 Il Cliente (Customer)
Il cliente è l'utente finale che richiede il NIF. I suoi requisiti principali includono:
- **Selezione del Piano:** Scelta tra tre livelli di servizio (Essential, Standard, Express) con chiara indicazione di prezzi e tempistiche.
- **Onboarding e Pagamento:** Creazione rapida dell'account e pagamento sicuro tramite carta di credito.
- **Gestione Documentale:** Caricamento di Passaporto e Prova di Indirizzo, con feedback immediato tramite AI.
- **Monitoraggio in Tempo Reale:** Una dashboard che mostra lo stato della pratica attraverso una timeline visuale.
- **Download Documenti Legali:** Accesso alla Procura (POA) generata automaticamente e, a fine processo, al certificato NIF.

### 2.1.2 L'Amministratore (Admin)
L'amministratore gestisce il workflow operativo:
- **Validazione Manuale:** Revisione dei documenti che l'AI ha segnalato come dubbi o errati.
- **Gestione Ordini:** Visione d'insieme di tutte le pratiche, filtri per stato e gestione delle scadenze SLA (Service Level Agreement).
- **Comunicazione:** Possibilità di inviare note personalizzate o reinviare notifiche email ai clienti.

### 2.1.3 L'Operatore (Fiscal Representative)
L'operatore è il professionista abilitato in Portogallo:
- **Gestione Coda Submission:** Accesso a una lista prioritaria di pratiche approvate dall'admin.
- **Download Package:** Scaricamento di un pacchetto ZIP contenente tutti i documenti necessari e una scheda riassuntiva per l'inserimento nel portale governativo (ebalcão).
- **Consegna Finale:** Inserimento del numero NIF emesso dall'autorità fiscale per completare l'ordine.

## 2.2 Architettura del Sistema: Il modello Multi-Layer

RemoteNIF v2 adotta un'architettura **Full Stack** basata su **Next.js 16**, sfruttando il paradigma degli **App Router** e delle **Server Actions**. L'architettura è suddivisa in layer logici per garantire manutenibilità e sicurezza:

1.  **Layer di Presentazione (UI):** Composto da React Server Components (RSC) per la massima velocità di caricamento e Client Components solo dove è necessaria interattività (es. upload, form).
2.  **Layer Logico (Server Actions):** Funzioni che risiedono sul server e gestiscono le mutazioni dei dati, validando ogni input tramite la libreria **Zod**.
3.  **Layer Infrastrutturale (Lib):** Moduli condivisi che interfacciano il sistema con servizi esterni come Supabase (Database/Auth), Stripe (Pagamenti) e Resend (Email).
4.  **Layer di Sicurezza:** Gestito a livello di database tramite **Row Level Security (RLS)**, che assicura che un utente possa leggere solo i propri dati anche in caso di falle nel frontend.

## 2.3 Progettazione della Base Dati e Modellazione

Il database PostgreSQL, orchestrato tramite **Drizzle ORM**, è il cuore informativo del sistema. La scelta di Drizzle rispetto ad altri ORM è dettata dalla sua natura "TypeScript-first", che permette di avere una sincronizzazione perfetta tra lo schema del database e le interfacce del frontend.

### 2.3.1 Modello Entità-Relazione (ER)

[IMMAGINE: Inserire qui un diagramma ER del database. Può essere generato da Drizzle Studio o disegnato con strumenti come dbdiagram.io]

Il sistema si basa su un modello relazionale solido. Di seguito, un esempio della definizione della tabella `orders`, che gestisce lo stato dell'intero processo:

```typescript
// Estratto da lib/db/schema.ts
export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tier: tierEnum('tier').notNull(),
    status: orderStatusEnum('status').notNull().default('documents_pending'),
    
    // Dettagli anagrafici (raccolti dopo il pagamento)
    fullName: text('full_name'),
    dateOfBirth: date('date_of_birth'),
    nationality: text('nationality'),
    passportNumber: text('passport_number'),
    address: text('address'),
    
    // Dati di consegna
    nifNumber: text('nif_number'),
    deliveredAt: timestamp('delivered_at'),
    
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  }
);
```

### 2.3.2 Flusso degli Stati (State Machine)

La logica di RemoteNIF v2 è guidata da una macchina a stati finiti. Ogni transazione (es. caricamento documento, approvazione admin) fa avanzare l'ordine verso lo stato successivo.

[IMMAGINE: Diagramma di flusso degli stati: Documents Pending -> Under Review -> Approved -> Submitted -> Delivered]

## 2.4 Flussi Utente (User Flows)

Per garantire un'esperienza utente priva di attriti, ogni passaggio è stato mappato preventivamente.

[IMMAGINE: Diagramma a blocchi del percorso utente: Homepage -> Pricing -> Signup -> Stripe -> Dashboard]

Il vantaggio di questo design è la **separazione delle responsabilità**: l'utente si concentra solo su una azione alla volta (prima paga, poi inserisce i dati, poi carica i documenti), riducendo la possibilità di abbandono del processo.
