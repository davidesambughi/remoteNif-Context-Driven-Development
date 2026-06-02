# Capitolo 3: Lo Stack Tecnologico: Cloud e Sviluppo Moderno

La scelta dello stack tecnologico per RemoteNIF v2 è stata guidata da tre principi: **velocità di sviluppo**, **scalabilità cloud-native** e **sicurezza del dato**. Essendo un progetto rivolto a un pubblico internazionale, la robustezza dell'infrastruttura è fondamentale.

## 3.1 Frontend: Next.js 16 e App Router

Il core dell'applicazione è basato su **Next.js 16**, il framework React di riferimento per il web moderno. L'adozione del paradigma **App Router** ha permesso di:
-   **Massimizzare le Performance:** Utilizzando i *React Server Components* (RSC), gran parte del codice viene eseguito sul server, inviando al browser solo l'HTML necessario e riducendo drasticamente il bundle JavaScript.
-   **Semplificare le Mutazioni:** Attraverso le *Server Actions*, la comunicazione tra frontend e backend avviene in modo tipizzato e sicuro, eliminando la necessità di gestire manualmente endpoint API REST complessi per le operazioni interne.

### 3.1.1 Struttura del Progetto (Project Tree)

Una delle competenze chiave del Cloud Specialist è l'organizzazione modulare del codice. Di seguito la struttura principale di RemoteNIF v2:

```text
nif3/
├── app/                  # Route Next.js (Marketing, Dashboard, Admin, Operator)
│   ├── [locale]/         # Gestione dell'internazionalizzazione (i18n)
│   ├── actions/          # Server Actions (Mutazioni dei dati)
│   └── api/              # Endpoint per Webhook esterni (Stripe)
├── components/           # Componenti React riutilizzabili
│   ├── ui/               # Primitive shadcn/ui
│   └── marketing/        # Sezioni Hero, Pricing, FAQ
├── lib/                  # Logica di business e infrastruttura
│   ├── db/               # Schema e query Drizzle ORM
│   ├── supabase/         # Client per Auth e Storage
│   └── stripe/           # Integrazione pagamenti
├── messages/             # File di traduzione JSON (EN, FR, ES, DE)
└── public/               # Asset statici (immagini, font)
```

## 3.2 Backend-as-a-Service: L'ecosistema Supabase

[IMMAGINE: Diagramma dell'Architettura Cloud: Next.js (Vercel) <-> Supabase <-> Stripe <-> Resend]

Invece di gestire un'infrastruttura server tradizionale, RemoteNIF v2 si appoggia a **Supabase**, una piattaforma "Backend-as-a-Service" che integra diversi servizi critici.

### 3.2.1 Integrazione Server-Side

Per garantire la sicurezza, il sistema utilizza client Supabase differenziati. Ecco come viene istanziato il client server-side per gestire i cookie di sessione:

```typescript
// Estratto da lib/supabase/server.ts
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

## 3.3 Gestione dei Pagamenti e Notifiche (Stripe & Resend)

Il ciclo di vita dell'ordine è completato dall'integrazione con servizi cloud leader di mercato:
-   **Stripe:** Gestisce l'intero flusso di pagamento, garantendo la conformità agli standard PCI e supportando metodi di pagamento internazionali. Il sistema utilizza i *Webhook* di Stripe per sincronizzare istantaneamente lo stato dell'ordine nel database al momento del successo del pagamento.
-   **Resend:** Utilizzato per l'invio di email transazionali. Grazie alla libreria **React Email**, i template delle email sono scritti in React, permettendo di mantenere una coerenza visiva totale con il brand e di gestire facilmente le traduzioni dinamiche.

## 3.4 Strumenti di Validazione e Stile

-   **Zod:** Ogni dato che entra nel sistema, sia tramite form che tramite API esterne, viene validato a runtime attraverso schemi Zod. Questo previene l'inserimento di dati corrotti e garantisce che l'applicazione non vada mai in crash per errori di tipo.
-   **Tailwind CSS 4.x:** Per lo stile è stato utilizzato Tailwind CSS, che permette uno sviluppo rapido basato su utility class e una perfetta integrazione con un **Design System** centralizzato definito in `globals.css`.

L'unione di queste tecnologie permette a RemoteNIF v2 di operare come una piattaforma "Serverless" altamente efficiente, riducendo al minimo i costi di manutenzione e massimizzando la sicurezza degli utenti.
