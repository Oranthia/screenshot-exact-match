# Italia Explorer — controllo funzionale

## Catalogo iniziale
- 104 città effettivamente presenti, 104 identificatori UUID distinti, 104 pagine distinte.
- 94 città aggiunte; 10 città precedenti preservate. Nessuna visita o immagine eliminata.
- Tutte le 20 regioni rappresentate; nessuna discordanza tra regione della città e della provincia.
- Regione → città: Piemonte 6; Valle d'Aosta 1; Lombardia 10; Trentino-Alto Adige 3; Veneto 7; Friuli-Venezia Giulia 4; Liguria 5; Emilia-Romagna 9; Toscana 8; Umbria 4; Marche 5; Lazio 5; Abruzzo 4; Molise 3; Campania 6; Puglia 5; Basilicata 2; Calabria 5; Sicilia 7; Sardegna 5.
- Identificatori interni indipendenti dai codici ISTAT ufficiali facoltativi; i 10 codici già esistenti sono conservati. Le nuove città non ricevono codici ISTAT inventati.

## Test eseguiti
- 28 test automatici superati: percentuali nazionali e regionali, utente nuovo a zero, attivazione ripetuta senza doppio conteggio, disattivazione conservando data e note, espansione del denominatore, aggiornamento immediato e ripristino su errore, stemmi e fallback, limiti foto/video, associazioni immagini, paginazione oltre 1000 visite e immagini, errori dei collegamenti privati ai file, accessibilità delle pagine attraverso il router.
- Browser con dati isolati: ricerca e filtri su 3000 città di test, ultima città ricercabile; attivazione immediata, disattivazione mantenendo note, filtro grayscale(1), salvataggio fallito con messaggio e ripristino.
- Browser sul catalogo pubblico reale: dashboard con 104 città, ricerca di Aosta, scheda Aosta e collegamento corretto alla Valle d'Aosta. Sessione e dati privati simulati: nessun account o visita reale creato.
- Smartphone 390×844 e desktop 1280×1800: schermate controllate, nessuno scorrimento orizzontale nei controlli eseguiti, nessun errore JavaScript rilevato.

## Problemi corretti
- Le visite si fermavano a 1000: lettura paginata con ordinamento deterministico; stesso trattamento per i ricordi.
- Ordinamento geografico reso deterministico anche con nomi uguali.
- Errori di caricamento delle schede città/regione lasciavano il caricamento senza termine: messaggio e possibilità di riprovare.
- Errore nella lettura dello stato del catalogo ignorato: ora propagato anziché mostrare dati di ripiego ingannevoli.
- Collegamenti firmati ai file senza scadenza di freschezza: rinnovo alla successiva lettura quando i dati hanno più di 45 minuti, prima della durata di un'ora. Errori individuali segnalati.
- Al logout ora vengono svuotate sia le visite sia i collegamenti privati ai ricordi dalla memoria dell'app; i file e le registrazioni rimangono nel database.

## Privacy verificata nella configurazione reale
- RLS abilitata su tutte le tabelle applicative e storage.objects.
- Visite e ricordi: lettura, inserimento, modifica e cancellazione limitate all'utente proprietario attraverso auth.uid().
- Catalogo geografico pubblico in sola lettura secondo le policy; nessuna policy consente scritture da utenti dell'app.
- Contenitore visit-media privato, limite 50 MB; policy sui file limitate alla cartella iniziale dell'utente proprietario. Non ci sono policy pubbliche di lettura dei file.
- Vincolo univoco utente + città presente nel database: impedisce visite duplicate.
- Controllo automatico delle policy: nessuna segnalazione. Questo controllo non sostituisce prove tra due account reali.

## Ancora da verificare con account reali
Il database contiene zero account, zero visite e zero file. Non è stato quindi possibile verificare realmente registrazione, upload di foto e video, recupero di data/note/file dopo logout e nuovo accesso, né tentativi di accesso tra due utenti differenti. Le relative regole sono state esaminate e alcune operazioni simulate, ma non sono dichiarate verificate end-to-end sul servizio reale.

Gli stemmi reali non sono ancora disponibili: controllati segnaposto, transizioni e mantenimento della stessa immagine nei test; qualità e caricamento delle future immagini personalizzate restano da verificare quando saranno fornite.

Il dataset di 3000 righe è solo un test isolato; il catalogo effettivo resta di 104 città. Nessun badge, premio o importazione massiva implementato; design e architettura preservati.