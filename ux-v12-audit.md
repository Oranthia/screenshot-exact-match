# Italia Explorer — Verifica V1.2

## P0 — Copertine del Diario
- Prima delle modifiche, la fotografia reale di Venezia si caricava correttamente: due fotografie presenti, entrambi i file esistenti, spazio privato. Nessun problema di permessi riprodotto.
- Aggiunti rapporto 16:9, caricamento discreto e stemma/segnaposto se l'immagine fallisce; rinnovo periodico dei collegamenti firmati prima della scadenza e un solo tentativo di rinnovo per foto fallita.
- Un errore individuale non impedisce alle altre copertine di apparire.
- Verificati nel browser: foto personale caricata; richiesta dell'immagine bloccata intenzionalmente produce lo stemma anziché un rettangolo vuoto.

## P1 — Badge e vetrina
- Collezione compatta: tre colonne a 390px, due a 320px, quattro su tablet e sei su desktop; dodici badge e soglie invariati.
- Filtri Tutti/Ottenuti/Da sbloccare; categorie conservate; dettagli in pannello inferiore su smartphone e finestra su desktop.
- Vetrina condivisa Home/Badge: selezione diretta, sostituzione e rimozione, senza controlli permanenti aggiuntivi.
- La precedente funzione salvava un elenco contiguo: non poteva conservare un terzo slot scelto con i primi due vuoti. Aggiunta una funzione protetta sulle stesse tabelle che conserva la posizione e scambia eventuali duplicati atomicamente; nessun badge assegnato modificato.
- Verificati nel browser reale: tutti i dodici dettagli, filtri (2 ottenuti/10 bloccati), inserimento esatto nello slot 3 e persistenza dopo ricaricamento, sostituzione e rimozione. Vetrina originale ripristinata.
- Rifiutati realmente slot 4 e badge non ottenuto.

## P2 — Home e scheda città
- Ordine: passaporto, ricerca, conquiste, ultime città visitate, regioni. Nota del catalogo discreta vicino alle statistiche.
- Ultime città da date effettive, oppure dal timestamp esistente esclusivamente per ordinare; anteprime delle foto private, nessuna data inventata.
- Codice ISTAT nascosto nell'interfaccia, conservato nei dati; area dello stemma ridotta.
- Note: stati reali di salvataggio, successo ed errore; avviso quando si lascia la pagina con modifiche non salvate.
- Copertina fotografica privata per utente/città, con vincolo unico e divieto di video; scelta atomica sotto le policy esistenti. Nessun file reso pubblico.
- Verificati nel browser: ricerca Venezia, scelta della foto nella galleria e lettura nel Diario; copertina conservata dopo logout e ripristino della sessione gestita; salvataggio reale delle note, errore intenzionale con bozza conservata, avviso di abbandono, ON/OFF. Note, visita e preferenze originali ripristinate.

## Sicurezza e schermi
- Confermati spazio privato e policy delle fotografie attive; funzione copertina negata agli anonimi, rifiuto di fotografia inesistente/altrui; lettura filtrata su altro proprietario restituisce zero righe.
- Home, Badge, Diario e Venezia provati a 320, 390 e 1280px: nessun overflow orizzontale; nessun errore JavaScript nelle prove principali. Immagini e griglie ispezionate visivamente.
- Metadati specifici già presenti su tutte le pagine di contenuto, inclusa Home.

## Limiti delle verifiche
- Nessun nuovo accesso tramite credenziali: persistenza verificata dopo logout e ripristino della sessione autorizzata.
- Nessuna fotografia personale eliminata: scelta alternativa dopo eliminazione verificata dal test della selezione, non tramite cancellazione reale.
- Nessuna seconda sessione reale: isolamento tra due utenti distinti non provato end-to-end.
- L'account ha due conquiste: tre badge diversi simultanei e traguardi alti non provati dal browser; limiti e soglie coperti dai test e dalle protezioni del database.
- Nessun nuovo video caricato; nessuna attesa di un'ora per la scadenza reale dei collegamenti.