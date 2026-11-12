# Italia Explorer — collaudo live finale

Data: 12 novembre 2026 (UTC). Ambiente: applicazione reale in anteprima, non demo.

## Sintesi

**138/138 test automatici PASS; controlli live di isolamento e persistenza PASS. Login tramite credenziali nell'interfaccia NON ESEGUITO. Nessuna dichiarazione di rilascio pubblico pronto.**

L'utente ha identificato A e B e confermato esplicitamente che entrambi contengono soltanto dati tecnici, chiarendo la precedente indicazione di A come account personale. Sono state usate sessioni gestite autorizzate, senza chiedere password, cambiare credenziali o creare utenti. Nessun altro account utilizzato.

## Esiti per verifica

| Verifica | Esito | Evidenza e limiti |
|---|---|---|
| Baseline automatica | PASS | Suite completa prima e dopo: 138/138 test in 24 file, zero falliti. |
| Login reale tramite form con nuova autenticazione | NON ESEGUITO | Non disponibili credenziali autorizzate al runner; una sessione gestita non equivale a provare il form email/password. Nessuna password richiesta in chat. |
| Logout reale A e B | PASS | Pulsante Logout, sessione assente, accesso diretto a Diario rimandato alla pagina di accesso. |
| Persistenza esperienze/foto/copertina in nuovo contesto browser | PASS | Dopo logout, contesti separati con sessioni autorizzate: titolo modificato e due foto leggibili; seconda foto ancora Copertina. Non sostituisce il test del form login. |
| Nuova sessione autorizzata e persistenza conquiste | PASS | Nuova sessione gestita B: pagina Badge mostra 9/12, nove ID unici; progressi ritornati a una città, una regione e una città con media dopo pulizia. |
| Separazione dati A/B — letture | PASS | Entrambe le direzioni: query mirate su visite, esperienze, media, badge e vetrina dell'altro account restituiscono zero righe. Pagina esperienza dell'altro: Esperienza non trovata. |
| Separazione dati A/B — modifica/eliminazione | PASS | Entrambe le direzioni: UPDATE e DELETE per ID di visite, esperienze e media tecnici altrui incidono su zero righe; i dati restano leggibili dal proprietario. Selezione della copertina altrui rifiutata. |
| Storage privato A/B | PASS | Entrambe le direzioni: download e creazione di URL firmato del percorso altrui negati; rimozione altrui non elimina oggetti. Il proprietario conserva entrambe le foto. |
| Creazione esperienze tecniche | PASS | A e B, tramite interfaccia; città OFF richiede Conferma e salva, record letto nuovamente. |
| Modifica esperienze tecniche | PASS | Titolo modificato, salvato e riletto dopo ricaricamento in A e B. |
| Eliminazione esperienze tecniche | PASS | Tramite interfaccia in A e B; ritorno alla scheda città, record e media associati assenti, altre esperienze invariate. |
| Upload fotografie tecniche | PASS | Due PNG sintetici di 320×240 per account, caricati tramite interfaccia, effettivamente visibili in galleria. Nessuna foto personale. |
| Eliminazione fotografie tecniche | PASS | Prima foto rimossa tramite interfaccia; seconda rimossa con l'esperienza. Foto di preparazione badge rimosse con le rispettive esperienze. |
| Copertina: scelta e persistenza | PASS | Seconda foto selezionata tramite interfaccia; flag univoco letto e pulsante Copertina presente dopo nuova apertura autorizzata. |
| Progressi dopo ON/OFF | PASS | Entrambi: OFF diminuisce di uno le città conteggiate senza cancellare esperienza; ON ripristina il conteggio. Baseline progressi recuperata dopo pulizia. |
| Tre badge nuovi simultanei | PASS | B predisposto su dati reali tecnici: 24 città, 9 regioni, 4 città con media. Un solo ON porta a 25/10/5 e assegna Passaporto vissuto, Attraverso l'Italia e Album di viaggio. |
| Notifica dei tre badge | PASS | Dopo l'ON, il controllo browser trova “3 nuovi badge nella collezione.”; badge visibili in collezione dopo ricarica. |
| Assenza duplicati | PASS | ID badge unici dopo ripetute sincronizzazioni; visite/esperienze iniziali confrontate esattamente dopo pulizia. Nessun record esperienza o media COLLAUDO residuo. |
| Permanenza conquiste | PASS | I badge ottenuti restano dopo OFF, eliminazione dei dati tecnici, ricarica e nuova sessione B. |
| Pulizia tecnica | PASS | Tutte le esperienze, foto e nuove righe visite create dal collaudo rimosse; visite ed esperienze preesistenti identiche alla baseline. Conquiste permanenti conservate come autorizzato. |

## Predisposizione e pulizia

A iniziale: 2 righe visita, 2 esperienze, 2 badge; B iniziale: 1 riga visita, 1 esperienza, 2 badge. Entrambi conteggiavano una città visitata, una regione e una città con media.

Per lo sblocco simultaneo sono state create soltanto esperienze, visite e fotografie tecniche attraverso le operazioni esistenti, senza alterare soglie o database. Una prima preparazione su A non ha prodotto una prova valida di tre nuovi badge insieme: alcune conquiste erano già state ottenute durante la preparazione. Non è stata conteggiata come PASS. La prova valida è stata eseguita su B, ancora disponibile per le tre soglie nuove. Entrambi terminano con nove badge permanenti; tutti i dati eliminabili creati durante i tentativi sono stati rimossi.

I controlli di pulizia confermano zero esperienze con titolo COLLAUDO e zero media con nomi technical-1.png/technical-2.png. I percorsi tecnici del test badge non sono più scaricabili; la cartella tecnica Agrigento di B contiene zero oggetti. Le visite e le esperienze iniziali dei due account sono identiche alla baseline, senza riscrittura dei dati preesistenti.

## Limiti di sicurezza e rilascio

- Le prove attestano gli scenari eseguiti, non una garanzia universale su ogni possibile attacco.
- Non è stato aperto un URL **già firmato dal proprietario** per dichiararlo negato all'altro account: quel collegamento concede accesso temporaneo a chi lo possiede. Sono stati verificati download privato e generazione di URL firmati con l'identità dell'altro account, entrambi negati.
- Il form di nuovo login resta NON ESEGUITO. Occorre provarlo tramite un canale autorizzato senza password in chat prima di chiudere questo punto.
- Nessuna modifica a design, funzionalità, autenticazione, autorizzazioni, policy, schema, catalogo o regole business. Solo rapporto e roadmap aggiornati; nessuna pubblicazione.
- Nessun FAIL prodotto riproducibile emerso nelle prove completate. Gli arresti del runner durante preparazione/attesa non sono stati trasformati in PASS: i flussi interessati sono stati ripresi e verificati; il login non disponibile resta NON ESEGUITO.
