# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Aggiungere stemmi comunali

Le immagini sono facoltative: inviale in chat indicando il nome della città e la provincia. Lovable individua il suo identificatore interno stabile e associa l'URL permanente a `municipalities.coat_of_arms_url` soltanto se manca, senza modificare visite o immagini esistenti. Non servono codici ISTAT per questa procedura.

Per elaborare un gruppo di URL già caricati, prepara un JSON con oggetti `{ "istat_code": "codice a 6 cifre", "coat_of_arms_url": "URL HTTPS permanente dell'immagine" }` ed esegui `bun scripts/import-coats.ts associazioni.json > /tmp/stemmi.sql`. Lo script valida codici, duplicati e URL, genera un aggiornamento transazionale da applicare tramite gli strumenti dati di Lovable (non come migrazione), blocca codici sconosciuti e aggiorna soltanto stemmi mancanti. Verifica poi le associazioni leggendo i comuni aggiornati e aprendo le rispettive pagine. Non usare URL temporanei firmati.

Il componente condiviso usa sempre la stessa immagine: filtro CSS per i comuni non visitati, colori originali per quelli visitati. Immagini mancanti o non caricabili mostrano lo scudo segnaposto; nessuna immagine viene generata.

## Catalogo iniziale ampliabile

Il catalogo iniziale comprende 104 città selezionate tra capoluoghi e destinazioni turistiche, con tutte le 20 regioni rappresentate. L'elenco verificabile e la fonte delle associazioni geografiche sono in `scripts/data/initial-cities.json`. La fonte pubblica non è presentata come l'ultimo elenco ufficiale ISTAT: per le nuove città il codice ufficiale resta facoltativo e vuoto.

Ogni città ha `id` UUID stabile, `official_istat_code` facoltativo e URL dello stemma facoltativo. Il campo storico `istat_code` è mantenuto come chiave immutabile di compatibilità per visite e storage: i nuovi record usano `city:<slug>`, non codici ISTAT inventati. Le 10 città già esistenti conservano chiavi, immagini e ricordi. Aggiungere un codice ufficiale non cambia le chiavi delle visite.

Per aggiungere città si usano gli strumenti dati di Lovable: prima la provincia, poi la città, evitando conflitti su provincia e pagina. Nessun seed viene eseguito all'apertura delle schermate. Un eventuale importatore CSV futuro deve riconciliare città esistenti tramite codice ufficiale o pagina, senza mai cambiare le chiavi storiche; lo script storico `import-istat.ts` non va usato sul catalogo adattato senza questa riconciliazione. Non sono implementati badge o importazioni massive.
