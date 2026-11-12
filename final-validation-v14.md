# Italia Explorer — Verifica finale V1.4

## Esito richiesto
- **Migrazione eseguita: SÌ**, verificata nel database, non soltanto predisposta.
- **Esperienze migrate: 1**, «Il mio primo ricordo».
- **Media conservati: 2 fotografie, 0 video**; entrambi associati all’esperienza corretta e presenti nello storage privato.
- **Progressi invariati: PASS**. Una città visitata prima e dopo; il test con cinque esperienze conta una sola città e mantiene le percentuali regionali/nazionali corrette.
- **Badge invariati: PASS**. Restano `prima-impronta` e `primo-ricordo`, con vetrina nelle posizioni 1 e 2. Nessun terzo badge assegnato durante le prove.
- **Test automatici superati: 85/85**, in 16 file, inclusi tutti i 69 precedenti e 16 nuovi test sulle esperienze.

## Confronto prima/dopo, dopo pulizia delle prove
| Dato | Prima | Dopo |
|---|---:|---:|
| Righe di stato città | 2 | 2 |
| Città visitate | 1 | 1 |
| Date legacy conservate | 1 | 1 |
| Note legacy conservate | 1 | 1 |
| Fotografie | 2 | 2 |
| Video | 0 | 0 |
| File nello storage | 2 | 2 |
| Media associati a esperienza | — | 2 |
| Media non associati | — | 0 |
| Copertine esplicitamente selezionate | 0 | 0 |
| Badge ottenuti | 2 | 2 |
| Posizioni vetrina occupate | 2 | 2 |

Zero differenze tra date/note migrate e gli originali; zero duplicati della migrazione; zero eliminazioni pendenti. La migrazione modifica solo l’associazione all’esperienza: non riscrive gli identificatori dei media né i percorsi dei file. I campi originali delle visite restano conservati e non editabili. Le due foto originali sono state aperte realmente; la copertina del Diario si carica attraverso la selezione automatica esistente.

## Prove reali con l’account disponibile
- Due esperienze nella stessa città: creazione, modifica e ricaricamento indipendente di titolo, data e note.
- Foto tecnica caricata solo nella prima esperienza; la seconda non la mostra.
- Album: una sola card Roma; Cronologia: voci separate per le due esperienze.
- Ricerca Roma e filtro anno 2025 corretti; esperienza senza data nel gruppo dedicato.
- OFF: esperienze nascoste nel Diario, ma note, data e fotografia ancora accessibili nella scheda.
- Nuova esperienza in città OFF: conferma esplicita visibile; conferma e salvataggio creano esperienza e stato ON in un’unica funzione transazionale.
- Eliminazione della prima esperienza e del suo file tecnico: seconda esperienza conservata, città ancora ON.
- Eliminati esclusivamente tutti i ricordi tecnici creati per questa prova; Roma ripristinata OFF. Nessun ricordo personale eliminato.
- Verifiche desktop 1280 px e smartphone 390 px: nessun overflow orizzontale, nessun errore JavaScript osservato.

## Sicurezza e problemi corretti
- Esperienze: RLS attiva; letture/modifiche/eliminazioni limitate al proprietario. Creazione diretta client negata; creazione consentita solo tramite funzione autenticata con conferma OFF.
- Media: relazione composita impedisce associazioni a un’esperienza di altro utente/città; trigger impediscono spostamenti e upload verso esperienze in eliminazione.
- File: bucket privato e accesso limitato alla cartella dell’utente; anteprime firmate e cache personali.
- Metriche badge verificate nel database: `memories` conta città distinte con un file presente, non numero di esperienze o fotografie.
- Corretti errori di compilazione della nuova pagina e chiusa la possibilità di aggirare la conferma OFF mediante inserimento diretto.
- Test automatici verificano paginazione di 2001 esperienze, anteprime owner-scoped e conservazione della procedura di riprova dopo un errore storage.

## Non verificato / limiti aperti
- **Isolamento end-to-end tra due utenti: NON VERIFICATO**, manca un secondo account autorizzato. Le policy e i vincoli sono stati controllati; ciò non equivale alla prova con due sessioni.
- Nessun video storico presente: conservazione di video esistenti non provabile con i dati disponibili; upload video non ripetuto in questa verifica.
- Errore reale parziale dello storage e concorrenza tra upload/eliminazione non simulati nel servizio live; percorso di riprova coperto da test isolati.
- Nessun backup completo ripristinabile comprensivo di storage creato o ripristino provato. La migrazione è additiva e conserva gli originali; questo non sostituisce un backup.
- Login nuovo con credenziali e sblocco contemporaneo di tre badge restano limiti della precedente validazione, non dichiarati superati qui.

Nessuna ulteriore modifica estetica introdotta nella verifica finale.