# Capitolo 5: Implementazione e UI/UX Design

L'implementazione di RemoteNIF v2 ha seguito una filosofia che unisce l'estetica di alto livello alla funzionalità rigorosa di un'applicazione gestionale.

## 5.1 Design System: Il modello "Two Worlds"

Per differenziare l'esperienza di marketing da quella operativa, è stato ideato il modello visuale dei "Due Mondi", definito nel `design-principles.md`.

### 5.1.1 Photo Canvas: L'impatto visivo

[IMMAGINE: Screenshot della Hero Section. Descrizione: Background fotografico a tutto schermo, testo bianco, font serif Playfair Display, pulsante CTA bianco con testo arancione]

### 5.1.2 App Canvas: La funzionalità

[IMMAGINE: Screenshot della Dashboard. Descrizione: Sfondo chiaro, card bianche con bordi sottili, font sans-serif Inter, timeline di stato dell'ordine]

[IMMAGINE: Screenshot della pagina Pricing. Descrizione: Tre card affiancate (Essential, Standard, Express) con badge "Fastest" sulla Express]

## 5.2 Sicurezza e Gestione del Dato

Trattandosi di dati sensibili (documenti d'identità), la sicurezza non è un'opzione ma un pilastro architettonico.

[IMMAGINE: Screenshot del Pannello Admin - Lista Ordini. Descrizione: Tabella con countdown SLA per gli ordini Express, filtri per stato]

## 5.3 Implementazione Feature Chiave

### 5.3.1 Generazione Automatica della Procura (POA)

Uno dei punti di forza del progetto è la generazione istantanea del mandato legale (Power of Attorney). Utilizzando la libreria **@react-pdf/renderer**, il sistema crea un PDF bilingue popolato con i dati dell'utente.

```typescript
// Esempio di logica per la generazione del PDF (lib/pdf/poa-template.tsx)
const PoaTemplate = ({ data }: { data: PoaData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>PROCURA / POWER OF ATTORNEY</Text>
      <Text style={styles.body}>
        O mandante {data.fullName}, nascido em {data.dob}, 
        residente em {data.address}...
      </Text>
      {/* Traduzione inglese automatica sotto la parte portoghese */}
      <Text style={styles.body}>
        The principal {data.fullName}, born on {data.dob}, 
        residing at {data.address}...
      </Text>
    </Page>
  </Document>
);
```

### 5.3.2 Dashboard Admin e Operatore

[IMMAGINE: Screenshot del dettaglio ordine Admin. Descrizione: Documenti affiancati con i risultati della review AI e pulsanti di override]
