# Conquiste V1.0 — verifica

## Implementato
- 12 badge con ID stabili: Prima impronta, Esploratore curioso, Viandante, Passaporto vissuto, Girovago, Cento orizzonti, Tre terre, Cinque regioni, Attraverso l'Italia, Italia in tasca, Primo ricordo e Album di viaggio.
- Coccarde Bronzo/Argento/Oro, stato grigio con lucchetto, dettagli, date reali di riconoscimento e progresso corrente. La data retroattiva è quella del riconoscimento, non una data storica inventata.
- Assegnazione protetta dal database, automatica sulle modifiche di visite/media e retroattiva all'accesso; nessun inserimento diretto di badge da parte del client. I media contano solo se foto/video di una città attualmente visitata e se il file esiste nel bucket privato del proprietario.
- Conquiste permanenti dopo correzioni; vetrina privata di massimo tre badge ottenuti, selezione, rimozione, sostituzione e ordine salvati atomicamente.
- Riepiloghi Home/Profilo e notifiche; il primo accesso mostra un riepilogo, non una sequenza di animazioni.
- Visite, navigazione e funzionalità precedenti conservate; corretto un overflow individuato a 320px nelle schede città e nelle notifiche.

## Verificato
- 60 test automatici superati: tutte le 12 soglie ai limiti, zero iniziale, riconoscimento retroattivo delle soglie città, unicità, massimo tre, rimozione/sostituzione, query personali, errori e funzionalità precedenti.
- Account reale: riconosciuti retroattivamente Prima impronta e Primo ricordo dai dati personali già salvati.
- Inserimento e rimozione dalla vetrina tramite interfaccia, lettura Home e persistenza dopo logout e ripristino della sessione gestita. Il ripristino non è un nuovo login con password.
- Disattivazione dell'unica città visitata: contatori città/regioni/ricordi a zero, entrambe le conquiste conservate; riattivazione: dati ripristinati senza duplicati. Stato della visita e scelte in vetrina ripristinati al termine delle prove.
- Richieste reali respinte: quattro slot, duplicati, badge non ottenuto, inserimento diretto di badge/vetrina e chiamata alla funzione interna di assegnazione.
- Protezioni verificate: lettura solo del proprietario, vincoli unici e riferimento a badge realmente ottenuti; funzioni interne non accessibili a utenti o anonimi.
- Desktop, smartphone 390px e 320px: collezione, vetrina e dettaglio; nessun errore JavaScript e nessuno sbordamento dopo la correzione.

## Non ancora verificato dal vivo
- Nuovo sblocco durante un upload e relativa animazione: il primo ricordo è stato verificato retroattivamente, non tramite un nuovo caricamento.
- Cinque città differenti con media, soglie alte e tre badge contemporaneamente in vetrina con riordino/sostituzione: l'account disponibile possiede due conquiste; regole e limiti sono testati automaticamente.
- Isolamento con due sessioni reali diverse: manca un secondo account autorizzato; configurazione e rifiuto di scritture arbitrarie verificati.
- Eliminazione di un media dopo lo sblocco: permanenza verificata correggendo una visita; nessun ricordo personale eliminato per la prova.