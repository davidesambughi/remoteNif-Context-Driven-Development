# Capitolo 6: Testing e Garanzia della Qualità

La natura critica dei dati trattati in RemoteNIF v2 ha richiesto una strategia di testing rigorosa e un processo continuo di audit della qualità del codice.

## 6.1 Metodologia di Testing: La Piramide dei Test

Il progetto adotta un approccio di testing su tre livelli per garantire la stabilità di ogni componente.

### 6.1.1 Esempio di Test d'Integrazione

Di seguito un estratto di un test d'integrazione che verifica la persistenza dei dati sul database reale (emulato tramite Docker):

```typescript
// Estratto da tests/integration/db/orders.test.ts
describe('Order Queries', () => {
  it('should create a new order and retrieve it correctly', async () => {
    const newOrder = await createOrder({
      userId: testUser.id,
      tier: 'express',
      status: 'documents_pending'
    });
    
    const retrieved = await getOrderById(newOrder.id);
    expect(retrieved.status).toBe('documents_pending');
    expect(retrieved.tier).toBe('express');
  });
});
```

[IMMAGINE: Screenshot del terminale con l'output di "npm run build" e "npm test" che passano con successo]

## 6.2 Quality Audit e Risoluzione Criticità

Periodicamente, il progetto viene sottoposto a un **Quality Audit** sistematico (documentato nel file `quality-audit.md`). Questo processo classifica i problemi riscontrati in tre categorie:
-   🔴 **Violazioni:** Errori gravi che rompono le regole architetturali o di sicurezza (es. URL di redirect non localizzati).
-   🟡 **Smells:** Problemi di manutenibilità o duplicazioni di codice che non bloccano il funzionamento ma degradano la qualità a lungo termine.
-   🟢 **Intenzionali:** Deviazioni dalle regole giustificate e documentate per motivi tecnici specifici.

## 6.3 Casi Studio: Risoluzione di Bug Architetturali

Durante l'audit sono state risolte criticità fondamentali che dimostrano l'importanza di questo processo:
-   **Tipi Duplicati:** È stato eliminato un problema di "stale types" dove definizioni diverse dello stesso oggetto portavano a errori di narrowing in TypeScript, rendendo il sistema più robusto e meno propenso a bug a runtime.
-   **Localizzazione dei Redirect:** È stato corretto un bug critico nel flusso di checkout di Stripe che rischiava di "disorientare" l'utente riportandolo in una lingua diversa da quella scelta dopo il pagamento.
-   **Collisione dei Token:** Una revisione dei token CSS ha risolto un problema di leggibilità dove i colori dei testi non rispettavano il contrasto minimo richiesto a causa di nomi di variabili troppo simili.

Questo impegno costante verso la qualità assicura che RemoteNIF v2 non sia solo un prototipo funzionante, ma un software pronto per la produzione (Production-Ready) e facilmente manutenibile nel tempo.
