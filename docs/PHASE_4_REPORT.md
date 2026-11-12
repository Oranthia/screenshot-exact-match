# Fase 4 — Ambiente demo locale

## Avvio e isolamento
`bun install`, poi `bun run demo`; apri **http://localhost:8081**. Espandi la barra DEMO LOCALE per selezionare lo scenario o gli errori e ripristinare lo stato. La demo è disabilitata nel normale `bun run dev`; nessun flag nell’URL o preferenza locale può attivarla.

`scripts/run-demo.ts` avvia un processo separato, loopback, con `ITALIA_LOCAL_DEMO=1`. `demo-plugin.ts` sostituisce il barrel dati e la sessione solo con command serve/mode development; qualsiasi build con flag attivo è rifiutata. I sorgenti gate e middleware auth reali non sono modificati. Il plugin non interviene nelle build normali. Il listener rifiuta host esterni (403), impone CSP locale e blocca l’importazione dei client/adapter reali. Nessun token valido o chiave privilegiata nella demo.

## Scenari e dati
- **A:** zero visite, zero badge, Diario vuoto.
- **B:** Torino, Venezia e Firenze ON; altre città OFF; ricordi e foto sintetiche, tre badge earned e tre posizioni personalizzate.
- **C:** Venezia ON, tre esperienze indipendenti, due date differenti e una mancante; Album una card e Cronologia tre voci.
- **D:** errore letture, errore salvataggi e foto non disponibile; disabilita Errore letture per verificare il recupero, mantiene Errore salvataggi per i form; A riproduce lo stato vuoto.

`src/demo/catalog.json` è un sottoinsieme verificato del catalogo esistente: sei città, tre regioni. ID `demo:*`, note fittizie, nome Viaggiatore DEMO, email riservata example.invalid. Nessun record personale letto/copiato. Un’immagine sintetica generata, chiaramente descritta come non fotografica della città, nessuno stemma inventato; font locali incorporati preservano l’identità visiva senza CDN.

## Funzioni simulate
Visite ON/OFF, crea/modifica/elimina esperienze, filtri/ricerca, Album/Cronologia, progressi, badge e tre slot. Le soglie badge sono riusate dal catalogo esistente; awards permanenti soltanto durante la sessione demo. OFF non elimina esperienze, ripetizioni non gonfiano progressi; cancellazioni mantengono sorelle e stato città. Media selezionati diventano blob temporanei nel browser: **nessun upload reale**. Nome/accesso/logout sono simulati, non validano credenziali; usare soltanto dati di prova.

Reset e reload ricreano B/scenario selezionato rispettivamente; la navigazione interna conserva stato. Nessun database o localStorage per esperienze/media; la preferenza Diario esistente è sotto l’identità demo. Nessuna persistenza o sincronizzazione tra schede/browser. Il banner rimane visibile, comandi richiudibili, notifiche solo demo separate dai controlli.

## Verifiche realmente eseguite
- Baseline iniziale **119/119**; finale **133/133**, 23 file, 0 falliti/saltati; 14 nuovi test `src/demo/demo.test.ts` per attivazione, build bloccate, isolamento import/rete, vuoto, tre esperienze/città unica, OFF/ON, conferma, modifica/elimina, errori, badge/slot, identità, reset e catalogo.
- Browser localhost:8081: A/Diario vuoto, C Album 1/Cronologia 3; modifica letta nuovamente dal Diario, OFF zero, nuova esperienza dopo conferma, cancellazione e ritorno città, errore salvataggio, ripristino scenario, rimuovi/riaggiungi vetrina. Screenshot verificati.
- Flusso finale: **zero richieste esterne, zero moduli backend reali, zero errori runtime**. DevTools Network deve mostrare soltanto localhost:8081, data/blob; nessun percorso `/rest/v1`, `/auth/v1`, `/storage/v1`. È una prova di isolamento demo, non di RLS.
- Upload immagine di prova: presente nel browser, zero chiamate storage/data reali; galleria a 320/390/430/768/1280px senza overflow. Richiesta diretta modulo reale rifiutata; host example.org 403.
- Anteprima normale localhost:8080 senza barra demo; navigazione personale signed-out rimanda ad auth. Nessuna sessione reale ripristinata o dato personale modificato in questa fase.

## File introdotti/modificati
Nuovi: `src/demo/{catalog.json,state.ts,adapter.ts,controls.tsx,controls.css,fonts.css,demo.test.ts,assets/demo-piazza.jpg}`, `scripts/{demo-policy.ts,demo-plugin.ts,run-demo.ts}`, questo report.
Modificati: `vite.config.ts`, `package.json` (solo comando demo), `README.md`, `AGENTS.md`, `roadmap.md`, `docs/FRONTEND_BASELINE.md`. Contratti e 119 test preesistenti invariati; nessuna nuova libreria.

## Limiti e attività residue
Creazione/modifica/eliminazione persistente su account dedicato **NON ESEGUITA**; resta necessaria autorizzazione/account di prova. Due utenti, nuovo login reale, tre award simultanei, scadenza link firmati, storage parziale/concorrenza e video reali non certificati. La demo gestisce file locali, non emula fedelmente transazioni, RLS o guasti distribuiti. Il flag/build è testato tramite hook/policy; nessun artifact pubblicato ispezionato. Clone pulito esterno, dispositivi fisici e backup privati restano fuori da questa fase. Caratteri incorporati aumentano solo le risorse demo; non vengono importati dalla pubblicazione.