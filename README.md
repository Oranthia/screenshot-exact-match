# Italia Explorer

Passaporto privato delle città italiane: stato Visitata/Non visitata, esperienze multiple per città, foto/video e copertine, Diario Album/Cronologia, dodici badge permanenti e vetrina di tre posizioni.

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Per lavorare localmente usa Bun. `bun run dev` usa il backend reale e la sua configurazione pubblica; non inserire chiavi private nel repository. La demo isolata si avvia separatamente con `bun run demo`.

```sh
git clone <this-repository-url>
cd <repository-name>
bun install
bun run dev
```

## Built with

## Demo locale (Fase 4)
Esegui `bun install` e `bun run demo`, poi apri **http://localhost:8081**. Non servono account o credenziali. Espandi la barra **DEMO LOCALE** per scegliere A (nuovo utente), B (viaggiatore attivo), C (tre esperienze a Venezia) o D (errori). Il pulsante Ripristina scenario e il ricaricamento scartano tutte le modifiche. Naviga tramite i link dell’app per conservare lo stato durante il collaudo.

Le operazioni sono simulate in memoria; i file aggiunti rimangono temporanei nel browser, mai caricati online. Nessuna verifica demo certifica storage o sicurezza reali. `ITALIA_LOCAL_DEMO=1` viene impostata solo dal comando demo; qualsiasi build con questa variabile viene rifiutata, anche con modalità development. Il listener accetta solo localhost; la normale anteprima e la pubblicazione restano reali. Dettagli, scenari e limiti in [docs/PHASE_4_REPORT.md](docs/PHASE_4_REPORT.md).

Suite attuale: **133 test passati** (119 conservati + 14 demo), con `bun run test`.

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Architettura e verifiche

- `src/routes`: schermate TanStack e metadati specifici per pagina; `src/components/explorer`: componenti riutilizzabili; `src/components/ui`: controlli Radix/shadcn.
- `src/data/contracts.ts`: contratti di dominio; `src/data/backend`: adapter reale sostituibile. Schermate, hook e query non importano direttamente il client dati.
- `src/lib/queries.ts`, `experience-queries.ts` e `badge-queries.ts`: cache condivise, aggiornamenti ottimistici e invalidazioni. Nessuna nuova cache nella Fase 3.
- `src/lib/progress.ts`: unico calcolo dei progressi sulle righe disponibili; `src/lib/badges.ts`: catalogo delle soglie. Assegnazioni badge e operazioni atomiche restano protette nel backend.
- Stato città ed esperienze sono indipendenti: OFF conserva i ricordi; eliminare un’esperienza non cambia le altre o lo stato città. Date facoltative mai inventate.
- Filtri Diario nell’URL; preferenza Album/Cronologia locale e distinta per account. Bozze e notifiche sono temporanee; visite, ricordi e vetrina sono persistenti.

Comandi disponibili: `bun run test` (suite completa), `bun run test:watch`, `bun run dev`, `bun run build`, `bun run preview`, `bun run lint`, `bun run format`. La suite usa fixture isolate senza dati personali; la verifica grafica è separata e non certifica scritture reali.

Baseline Fase 3: 119 test passati (105 precedenti + 14 nuovi). Inventario e limiti: [docs/FRONTEND_BASELINE.md](docs/FRONTEND_BASELINE.md); report: [docs/PHASE_3_REPORT.md](docs/PHASE_3_REPORT.md).

### Limiti aperti

Creazione/modifica/eliminazione live di un’esperienza tecnica **NON ESEGUITA**: manca un account di test dedicato autorizzato. Nessuna scrittura sull’account principale. Restano da verificare nuovo login, isolamento tra due account, tre nuovi badge simultanei, scadenza reale dei link media, guasti parziali/concorrenza storage e clone/avvio esterno pulito con relativa configurazione. Tastiera virtuale e safe area reali richiedono dispositivi fisici. L’esportazione del sorgente non include un backup dei file privati.

## Aggiungere stemmi comunali

Le immagini sono facoltative: inviale in chat indicando il nome della città e la provincia. Lovable individua il suo identificatore interno stabile e associa l'URL permanente a `municipalities.coat_of_arms_url` soltanto se manca, senza modificare visite o immagini esistenti. Non servono codici ISTAT per questa procedura.

Per elaborare un gruppo di URL già caricati, prepara un JSON con oggetti `{ "istat_code": "codice a 6 cifre", "coat_of_arms_url": "URL HTTPS permanente dell'immagine" }` ed esegui `bun scripts/import-coats.ts associazioni.json > /tmp/stemmi.sql`. Lo script valida codici, duplicati e URL, genera un aggiornamento transazionale da applicare tramite gli strumenti dati di Lovable (non come migrazione), blocca codici sconosciuti e aggiorna soltanto stemmi mancanti. Verifica poi le associazioni leggendo i comuni aggiornati e aprendo le rispettive pagine. Non usare URL temporanei firmati.

Il componente condiviso usa sempre la stessa immagine: filtro CSS per i comuni non visitati, colori originali per quelli visitati. Immagini mancanti o non caricabili mostrano lo scudo segnaposto; nessuna immagine viene generata.

## Catalogo iniziale ampliabile

Il catalogo iniziale comprende 104 città selezionate tra capoluoghi e destinazioni turistiche, con tutte le 20 regioni rappresentate. L'elenco verificabile e la fonte delle associazioni geografiche sono in `scripts/data/initial-cities.json`. La fonte pubblica non è presentata come l'ultimo elenco ufficiale ISTAT: per le nuove città il codice ufficiale resta facoltativo e vuoto.

Ogni città ha `id` UUID stabile, `official_istat_code` facoltativo e URL dello stemma facoltativo. Il campo storico `istat_code` è mantenuto come chiave immutabile di compatibilità per visite e storage: i nuovi record usano `city:<slug>`, non codici ISTAT inventati. Le 10 città già esistenti conservano chiavi, immagini e ricordi. Aggiungere un codice ufficiale non cambia le chiavi delle visite.

Per aggiungere città si usano gli strumenti dati di Lovable: prima la provincia, poi la città, evitando conflitti su provincia e pagina. Nessun seed viene eseguito all'apertura delle schermate. Un eventuale importatore CSV futuro deve riconciliare città esistenti tramite codice ufficiale o pagina, senza mai cambiare le chiavi storiche; lo script storico `import-istat.ts` non va usato sul catalogo adattato senza questa riconciliazione. L’importazione completa ISTAT resta rinviata; i badge sono già implementati.
