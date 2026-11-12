# Italia Explorer — Audit e piano frontend-first

## Perimetro di questo audit
Nessun cambiamento a codice applicativo, design, dipendenze, autenticazione, database o file personali. Ispezionati sorgenti, configurazione, documentazione e test; rieseguita la suite: **85/85 test superati in 16 file**. Le verifiche live della V1.4 restano evidenze precedenti, non nuove prove eseguite in questo audit. Non è stato provato un avvio da un clone GitHub pulito.

## Stato attuale

| Area | Implementazione presente | Dipendenza / limite |
|---|---|---|
| Home e navigazione | Home, Diario, Badge, Profilo; ricerca città e riepiloghi | Dati geografici e personali letti dal servizio attuale |
| Regioni e città | Ricerca, filtri visitati/da visitare, ordinamento, stato ON/OFF e stemmi condivisi | Stato visita persistente; elenco regionale renderizzato interamente, senza paginazione visiva |
| Esperienze multiple | Creazione, modifica titolo/data/note, conferma città OFF, galleria e cancellazione separata | Persistenza reale; creazione atomica e vincoli nel database |
| Diario | Album per città, Cronologia per esperienza, ricerca/regione/anno/ordinamento, pagine e copertine | Visite/esperienze/media reali; preferenza di vista salvata solo nel browser per utente |
| Badge e vetrina | 12 definizioni, dettagli, filtri, tre posizioni e notifiche | Assegnazione e vetrina persistenti tramite funzioni protette nel database |
| Profilo | Nome visualizzato, email, statistiche, logout | Nome salvato nei dati dell’account, non solo in memoria |
| Accesso | Interfacce email/password e registrazione con conferma | Servizio di autenticazione attuale; nuovo login con credenziali non riprovato |
| Aspetto | Componenti condivisi, palette e font esistenti, layout mobile/desktop, fallback stemmi/foto | Coerenza da rifinire per pagina, senza ridisegno globale |

**Non risultano CRUD personali simulati nell’app attuale.** I mock presenti nei test non sono una modalità dimostrativa dell’app. Il catalogo selezionato di 104 città è reale ma incompleto: non è l’elenco nazionale ISTAT completo. Gli scudi senza immagine sono fallback dichiarati, non stemmi inventati. Le percentuali sono calcolate sulle righe disponibili. Non risultano funzioni prodotto AI, mappe, social o pagamenti da completare.

## Dipendenze e punti da separare
- Letture già raccolte in query condivise, ma scritture dirette al servizio presenti in MediaGallery, ExperienceEditor, Profilo e Badge; autenticazione presente anche nella protezione delle pagine.
- Modelli applicativi derivati dai tipi generati del database; manca un contratto di dominio indipendente dal fornitore.
- Logica pura già riutilizzabile: progressi, filtri/ordinamenti Diario, raggruppamenti esperienze, validazione media e regole badge. Conservarla, senza duplicare formule.
- Funzioni database indispensabili oggi: creazione esperienza con conferma ON, assegnazione badge, posizioni vetrina e copertina. In una simulazione potranno essere riprodotte solo come comportamento dimostrativo, mai come garanzia di sicurezza reale.
- Configurazione di avvio usa `@lovable.dev/vite-tanstack-config`, TanStack Start e un target di pubblicazione Cloudflare. Sono dipendenze di toolchain da documentare, non prova che l’editor sia obbligatorio per avviare il codice.
- Font caricati da Google Fonts; stemmi da URL associati; foto personali da storage privato con URL temporanei. Questi URL non costituiscono un archivio esportabile delle fotografie.
- README generico e parzialmente obsoleto: dichiara ancora badge non implementati. Mancano istruzioni complete per modalità autonoma, configurazione e limiti di persistenza.
- Il collegamento GitHub e il suo stato non sono verificabili dal codice: **non verificati**. Esportare il repository non esporta automaticamente account, dati e file privati.

## Ordine di completamento proposto

### 1. Fissare la base di regressione
Inventario di tutte le pagine e azioni esistenti, con stato reale/temporaneo e matrice caricamento, vuoto, errore, successo. Conservare gli 85 test e aggiungere prove mirate solo sulle aree toccate. Nessuna modifica allo schema o ai dati.

**Criterio:** ON/OFF non perde ricordi; più esperienze non aumentano città/progressi; badge e vetrina restano invariati.

### 2. Separare i dati progressivamente, senza cambiare il comportamento
Definire tipi applicativi e contratti sostituibili per catalogo, visite, esperienze, media, badge e identità. Incapsulare gli accessi attuali in un adapter reale; mantenere query cache, protezioni e funzioni transazionali esistenti. Spostare prima le letture, poi le scritture, una singola area alla volta.

**Criterio:** la modalità reale continua a funzionare come prima; nessuna chiamata al fornitore nei componenti di presentazione nuovi o rifattorizzati.

### 3. Aggiungere una modalità locale esplicita per sviluppo frontend
Adapter con mock tipizzati e fixture deterministiche: nessuna copia di dati personali. Selezione esplicita mediante configurazione di sviluppo, mai passaggio automatico ai mock quando il servizio reale fallisce. Identità dimostrativa separata, cache distinta e importazione del client reale evitata nel percorso mock.

Completare creazione/modifica/eliminazione, filtri, modali e validazioni sulle stesse interfacce; anteprime media locali senza upload. Avviso visibile **«Modalità dimostrativa — dati temporanei»**, con messaggi di salvataggio che non suggeriscano persistenza remota. Se qualche preferenza resta nel browser, dichiararla separatamente. Nessuna autenticazione simulata presentata come sicurezza reale.

**Criterio:** tutte le schermate si aprono senza backend; nessuna richiesta a database, auth o storage nella modalità mock; dati dimostrativi eliminabili senza toccare i reali.

### 4. Completare e uniformare il frontend esistente
Lavorare nell’ordine: scheda città/esperienze → Diario → Home/regioni → Badge/Profilo/accesso. Preservare palette, tipografia e percorsi; riutilizzare componenti per campi, conferme, stati e paginazione.

Punti concreti emersi: errori delle esperienze e delle anteprime Home non esposti uniformemente; Home senza azione di riprova dedicata per i dati principali; alcuni errori auth/media mostrano messaggi grezzi del servizio; validazioni e stati di salvataggio da uniformare. Verificare anche focus dei modali, tastiera, testi lunghi, sovrapposizioni delle notifiche e schermate strette. Se il catalogo crescerà, introdurre paginazione visiva regionale senza importare nuovi dati.

**Criterio:** ogni azione ha esito comprensibile, nessun errore scambiato per elenco vuoto o successo, nessuna funzionalità preesistente rimossa.

### 5. Verificare portabilità GitHub e documentare l’avvio
Aggiornare README e configurazione di esempio priva di segreti; specificare versioni runtime, package manager/lockfile, comandi, modalità reale e mock. Provare installazione e avvio su copia pulita del sorgente, caricamento diretto delle pagine e test. Separare la verifica di sviluppo locale dalla futura scelta di hosting: conservare TanStack Start, senza introdurre ora un altro framework o una nuova infrastruttura.

**Criterio:** clone pulito avviabile e navigabile in modalità mock senza credenziali; modalità reale documentata con le dipendenze ancora necessarie. Non dichiarare indipendenza completa prima della prova.

### 6. Collaudo finale frontend
Suite regressione e prove dei flussi modificati su desktop e smartphone, sia in mock sia in modalità reale quando necessario. Scenari grandi solo con fixture, senza alterare dati personali. Report distinto: UI completa, simulazione completa, persistenza reale verificata e controlli non eseguiti.

## Fuori perimetro / verifiche ancora aperte
- Nessuna nuova infrastruttura, migrazione dati, provider auth, integrazione esterna o export di dati personali in queste fasi.
- Isolamento live tra due utenti, nuovo login con credenziali, alcuni traguardi badge e guasti parziali storage restano non verificati dalle validazioni precedenti; i mock non possono chiuderli.
- Conservazione dei video storici non verificabile con i dati allora disponibili, che contenevano solo fotografie.
- Catalogo ISTAT completo e stemmi mancanti restano dipendenze da fonti reali, non blocchi per completare il frontend.
- La futura migrazione definitiva di account, database e media richiederà una richiesta separata e una strategia di recupero verificata.

## Dettagli tecnici per le fasi successive
Flusso previsto: **UI React → hook/logica applicativa → contratti dati → adapter reale oppure mock**. Manteniamo React 19, TypeScript, TanStack Router/Query e Tailwind esistenti; nessuna nuova libreria necessaria per partire. Progressi restano nella funzione centrale; adapter e fixture devono rispettare chiavi immutabili e distinguere stato città da esperienza.

Questo piano non avvia implementazioni: l’app e il backend rimangono nello stato attuale.