# Italia Explorer — Validazione finale V1.2

| Test | Esito | Risultato |
| --- | --- | --- |
| 1. Nuovo login reale | NON ESEGUITO | Una sessione autorizzata disponibile, nessuna credenziale di account dedicato. Il ripristino della sessione non conta come nuovo login. |
| 2. Eliminazione fotografie | PASS | Due file tecnici caricati ed eliminati realmente; copertina alternativa, fallback e gestione errore verificati. |
| 3. Isolamento tra due utenti | NON ESEGUITO | Esiste un solo account; manca una seconda sessione di prova autorizzata. |
| 4. Tre nuovi badge simultanei | NON ESEGUITO | Manca un account dedicato sul quale predisporre traguardi senza alterare conquiste personali permanenti. |

## Test 2: verifiche effettivamente completate
- Aosta inizialmente senza visite e media, usata esclusivamente per la prova.
- Upload dalla galleria di validation-a.jpg e validation-b.jpg; prima foto impostata come copertina.
- Errore dello storage provocato sulla richiesta di eliminazione: messaggio corretto, entrambe le fotografie ancora presenti.
- Eliminazione della copertina dalla conferma nell'app: scomparsa immediata dalla galleria; seconda foto visibile nel Diario.
- Eliminazione della seconda foto: scudo segnaposto nel Diario, senza immagine rotta.
- Client autorizzato: zero righe dei file e download dei percorsi non più riuscito.
- Controllo separato del database: zero file di prova, zero oggetti nella cartella di Aosta, zero visite residue ad Aosta; le due fotografie personali iniziali ancora presenti.
- Confronto prima/dopo: badge ottenuti e vetrina invariati. Nessun errore JavaScript. Copertina alternativa e fallback ispezionati visivamente.

## Controlli supplementari, non equivalenti ai test mancanti
- RLS attiva su visite, media, badge, vetrina e oggetti dello storage; spazio dei media privato.
- Policy visite/media vincolate al proprietario; storage vincolato al bucket e alla cartella dell'utente.
- Il controllo automatico segnala tre funzioni privilegiate eseguibili dagli utenti autenticati: valutazione dei propri badge e gestione della propria vetrina. Definizioni lette: identità richiesta, scritture limitate al chiamante, badge ottenuti verificati. Non è un difetto da correggere disabilitando queste funzioni.
- Otto valutazioni realmente simultanee sull'account disponibile: tutte riuscite, badge invariati, nessun duplicato e nessuna nuova notifica. NON dimostra lo sblocco simultaneo di tre nuovi badge.
- Tutti i 64 test automatici rieseguiti e superati.
- Nessuna modifica a codice applicativo, design, policy o condizioni dei badge.

## Passaggi manuali per completare le verifiche

### Test 1
1. Preparare un account dedicato con email confermata; inserire le credenziali direttamente in Accedi, senza inviarle in chat.
2. Segnare una città, aggiungere data e nota riconoscibili, caricare una foto tecnica e impostarla come copertina; esporre un badge ottenuto.
3. Uscire dal Profilo e aprire una nuova finestra privata senza sessione.
4. Accedere nuovamente tramite il modulo e confrontare visita, data, nota, badge, vetrina e fotografia privata.

### Test 3
1. Preparare due account dedicati A/B in due profili browser indipendenti.
2. Inserire dati differenti sulla stessa città: visita, nota, foto, copertina e vetrina.
3. Confrontare Home, Diario, città e Badge: ciascuno deve vedere soltanto i propri dati.
4. Come B, tentare lettura, modifica ed eliminazione delle righe visite/media di A, lettura dei badge/vetrina di A e uso delle funzioni copertina/vetrina con riferimenti di A; nessun dato privato deve essere restituito o modificato.
5. Tentare download, firma, sostituzione e rimozione del percorso privato di A dal client autenticato di B; da A verificare che il file resti invariato. Non usare un URL già firmato da A: è un collegamento temporaneo utilizzabile da chi lo possiede, non una prova della policy.
6. Ripetere nella direzione opposta; pulire soltanto i dati tecnici di prova.

### Test 4
1. Usare un account dedicato che non abbia già i tre traguardi interessati.
2. Predisporre 24 città visitate su quattro regioni, con media tecnici in quattro città; Passaporto vissuto, Cinque regioni e Album di viaggio devono essere ancora bloccati.
3. Caricare una foto tecnica su una città non visitata di una quinta regione, mantenendo OFF.
4. Con l'app già aperta e l'osservatore inizializzato, attivare tale città: una sola operazione raggiunge 25 città, 5 regioni e 5 città visitate con ricordi.
5. Verificare i tre badge, date di ottenimento e una sola notifica aggregata; avviare valutazioni concorrenti da due schede della medesima identità e verificare assenza di duplicati e ulteriori notifiche.
6. Uscire ed effettuare un nuovo login; rileggere i badge. Non usare l'account personale: i badge rimangono permanenti anche dopo la pulizia delle visite.

## Problemi aperti
Account dedicati e accessi mancanti per i test 1, 3 e 4. Nessun difetto applicativo riprodotto nelle verifiche eseguite.