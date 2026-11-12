# Portabilità — Fase 5

## Stack verificato
- TanStack Start v1 (React 19) su Vite 7, Tailwind v4, TypeScript; output Nitro in `dist/` (target edge/Cloudflare).
- Package manager: **Bun** (`bun.lock` versionato). Test: Vitest. Lint: ESLint + Prettier.

## Avvio locale
```bash
git clone <url-del-repository> italia-explorer && cd italia-explorer
bun install
cp .env.example .env        # inserire solo valori pubblici del proprio backend
bun run dev                 # app reale (richiede backend configurato)
bun run demo                # demo isolata su http://localhost:8081, nessun backend
bun run test                # suite Vitest
bunx tsc -b --noEmit        # controllo TypeScript (in editor: tsgo -b --noEmit)
bunx eslint src scripts     # lint
bun run build               # build di produzione in dist/
```

## Ambienti
| Ambiente | Comando | Dati | Note |
|---|---|---|---|
| Sviluppo locale | `bun run dev` | backend reale da `.env` | auth/RLS/storage invariati |
| Demo isolata | `bun run demo` | sintetici in memoria | solo serve/development su loopback, CSP senza origini esterne |
| Produzione | `bun run build` | backend reale | con `ITALIA_LOCAL_DEMO` impostata la build **fallisce** |

`allowLocalDemo` richiede flag esatto `1`, comando serve, modalità development e host loopback; ogni altra combinazione lascia la demo spenta (coperto da test).

## Sincronizzazione GitHub
Connessione non verificabile dall'agente. Per collegarla: Impostazioni progetto → Git → Connetti GitHub (crea un nuovo repository privato, sync bidirezionale sul ramo principale). Download senza Git: Impostazioni → Git → Download codebase. Nessun repository creato in questa fase.

File esclusi/controllati: `.env` contiene solo URL e chiave **pubblicabile** (nessuna chiave privilegiata); `node_modules`, `dist`, log ignorati; nessuna foto personale o esportazione database versionata (test `src/test/portability.test.ts`).

## Backend attuale
- Provider: Lovable Cloud (Postgres + Auth + Storage gestiti).
- Auth: email/password; sessione nel browser.
- Tabelle: regioni, province, città (catalogo pubblico in sola lettura), `user_visits`, `visit_experiences`, `visit_media`, badge (`badge_rules`, badge ottenuti, vetrina).
- Storage: bucket privato `visit-media`, percorsi `<user_id>/<codice città>/…`.
- Funzioni database: `create_my_experience`, `set_my_city_cover`, `set_my_featured_badges`, `set_my_featured_badge_slot`, `sync_my_badges` + trigger di protezione.
- RLS: proprietario su tutti i dati personali; storage chiave sulla prima cartella.
- Migrazioni: `drizzle/migrations/0000`–`0006`.

### Checklist trasferimento futuro (non eseguita)
1. Nuovo progetto backend; applicare migrazioni 0000–0006 in ordine.
2. Verificare policy RLS e bucket privato con stesse regole.
3. Esportare dati del database (Database → Impostazioni → Export) — **separato** dal codice.
4. Copiare i file dello storage (non inclusi nell'export database).
5. Utenti: richiedono nuova password o migrazione gestita.
6. Aggiornare `.env`, eseguire collaudo live sotto.

## Collaudo reale — NON ESEGUITO (nessun account di test autorizzato)
Con due account dedicati A e B (mai l'account principale):
- A. Registrazione/login nuovo di A: Home 0%, Diario vuoto, nessun badge.
- B. A segna una città e carica una foto; B non vede visita né foto; URL della foto di A aperto da B → negato.
- C. A crea/modifica/elimina esperienza; logout/login → dati invariati; OFF chiede conferma.
- D. A raggiunge tre soglie badge con una sola azione → tre notifiche, badge persistenti dopo ricarica.
