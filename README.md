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

Invia in chat le immagini e un elenco dei rispettivi codici ISTAT a 6 cifre (per esempio nomi file `001272.png`). Lovable carica i file forniti e associa i loro URL permanenti a `municipalities.coat_of_arms_url`, senza modificare le visite o sostituire gli stemmi già presenti. I codici assenti dal catalogo vanno prima importati dal dataset ufficiale; non vengono inventati comuni.

Per elaborare un gruppo di URL già caricati, prepara un JSON con oggetti `{ "istat_code": "codice a 6 cifre", "coat_of_arms_url": "URL HTTPS permanente dell'immagine" }` ed esegui `bun scripts/import-coats.ts associazioni.json > /tmp/stemmi.sql`. Lo script valida codici, duplicati e URL, genera un aggiornamento transazionale da applicare tramite gli strumenti dati di Lovable (non come migrazione), blocca codici sconosciuti e aggiorna soltanto stemmi mancanti. Verifica poi le associazioni leggendo i comuni aggiornati e aprendo le rispettive pagine. Non usare URL temporanei firmati.

Il componente condiviso usa sempre la stessa immagine: filtro CSS per i comuni non visitati, colori originali per quelli visitati. Immagini mancanti o non caricabili mostrano lo scudo segnaposto; nessuna immagine viene generata.
