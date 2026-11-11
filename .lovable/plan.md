# Italia Explorer V1.4 — Esperienze multiple

## Risultato
Ogni città mantiene il suo stato Visitata/Non visitata, ma può contenere più esperienze indipendenti con titolo, data facoltativa, note, foto e video.

## Conservazione dei dati
- Migrazione additiva: nessuna tabella o campo esistente eliminato, nessun file spostato o duplicato.
- Creare «Il mio primo ricordo» solo per città con data, note o media, comprese quelle OFF.
- Associare gli stessi media alla nuova esperienza, conservando identificatori, percorsi e copertine.
- Confrontare conteggi e associazioni prima/dopo e usare una chiave stabile per evitare duplicazioni.
- Stato rilevato: 2 registrazioni di città, 1 visitata, 1 data, 1 nota, 2 fotografie, 0 video, 2 file, 2 badge e 2 posizioni in vetrina.
- Non posso creare né verificare un backup ripristinabile con gli strumenti disponibili. L’esportazione completa si avvia da **More → Database → Manage → Settings → Export project data**; file di storage esclusi. Nessuna operazione distruttiva verrà eseguita durante la migrazione.

## Schermate
- Scheda città: informazioni e interruttore invariati; sezione «Le mie esperienze» con anteprime e «Nuova esperienza».
- Dettaglio esperienza: titolo, data, note, galleria esistente e conferma di eliminazione.
- Creazione in città OFF: conferma esplicita e salvataggio atomico che attiva anche la città.
- Album: una card per città, numero di esperienze e ultimo ricordo; copertina cittadina invariata.
- Cronologia: una voce per esperienza, apertura diretta, date reali e sezione «Data non indicata»; filtri e preferenza mantenuti.
- Home, Badge, Profilo e navigazione restano invariati salvo adattamento della data degli ultimi ricordi alla nuova fonte.

## Dettagli tecnici
- Nuova tabella privata `visit_experiences`, collegata all’UUID stabile della città e con chiave legacy opzionale unica per proprietario.
- Riferimento nullable sui media; vincolo composto per garantire stessa città e proprietario.
- Policy owner-scoped, privilegi espliciti e funzione autenticata per la creazione atomica. Nessun nuovo ruolo.
- Date/note legacy restano archiviate e non modificabili dall’app: le esperienze diventano la fonte principale.
- Query paginate e cache separate per identità, svuotate al logout; anteprime solo per la pagina visibile.
- Eliminazione recuperabile: esperienza marcata in eliminazione, caricamenti bloccati, rimozione solo dei propri file; errore parziale visibile con possibilità di riprovare. Stato visitata mai disattivato automaticamente.
- Progressi e valutazione dei 12 badge continuano a contare città/regioni distinte tramite le strutture esistenti.

## Verifiche e rapporto
- Rieseguire i 69 test esistenti e aggiungere test su migrazione, esperienze, diario e invarianti.
- Provare creazione, modifica, upload ed eliminazione con soli contenuti di prova, su desktop e smartphone con account autorizzato.
- Verificare proprietà e riferimenti manipolati; non dichiarare verificati due account o un nuovo login se non disponibili.
- Produrre un rapporto con nuovi campi, esperienze migrate, media conservati, risultati e limiti delle prove.
