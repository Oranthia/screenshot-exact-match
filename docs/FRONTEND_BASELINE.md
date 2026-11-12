# Italia Explorer V1.4 — Baseline frontend, Fase 1

## Perimetro
Consolidamento basato sull’audit frontend-first già completato; nessun nuovo audit generale o controllo sui dati personali. Consentite e svolte soltanto modifiche a documentazione e test. Nessun adapter o modalità mock nell’app; nessuna Fase 2 avviata.

Le evidenze live storiche sono in [final-validation-v14.md](../final-validation-v14.md); il presente documento non le dichiara rieseguite. Per i controlli V1.2 e i limiti auth/storage vedere [final-validation-v12.md](../final-validation-v12.md). Non sono duplicati qui conteggi personali o procedure di migrazione.

## Inventario e stati esistenti
“Successo” indica feedback o risultato disponibile, non una nuova prova di persistenza live.

| Pagina | Azioni principali | Dipendenze attuali | Caricamento / vuoto / errore / successo |
|---|---|---|---|
| Home `/` | Ricerca città, apertura regioni/città, progressi, ultime città, vetrina; accesso se non autenticato | Catalogo, visite, esperienze, anteprime private, badge e sessione | Skeleton; ricerca senza risultati e passaporto vuoto; errore dati principali; risultati e statistiche. Errori esperienze/anteprime non uniformemente esplicitati |
| Regione `/regione/$slug` | Ricerca, Tutti/Visitati/Da visitare, A–Z/Z–A, apertura città | Catalogo e visite personali | Skeleton; regione non trovata/lista vuota; errore e riprova; lista e percentuali |
| Città `/comune/$slug` | Stato Visitata/Non visitata, elenco esperienze, nuova esperienza, apertura dettagli | Catalogo, visite, esperienze e media | Caricamento; città non trovata e nessuna esperienza; errori/riprova; switch condiviso e feedback salvataggio |
| Esperienza `/esperienza/$id` | Titolo/data/note, crea/modifica, conferma OFF, annulla uscita non salvata, elimina esperienza | Letture personali, creazione atomica protetta, aggiornamento esperienza, eliminazione media/storage | Caricamento; esperienza non trovata/galleria vuota; salvataggio fallito/eliminazione incompleta e riprova; salvataggio e navigazione |
| Galleria nella scheda esperienza | Upload foto/video, visualizzazione, didascalia, copertina città, elimina singolo file | Storage privato, media associati, funzione copertina | Upload/loading; nessun ricordo; caricamento/salvataggio/eliminazione falliti; notifiche e aggiornamento cache |
| Diario `/diario` | Album/Cronologia, ricerca, regione, anno, ordinamento, reset, pagine, apertura città/esperienza | Visite, esperienze, geografia e anteprime della pagina visibile | Loading; diario/risultati vuoti; errori/riprova dati e anteprime; viste filtrate e copertine |
| Badge `/badge` | Tutti/Ottenuti/Da sbloccare, dettagli, colloca/rimuovi/sostituisci vetrina | Valutazione e assegnazioni protette, posizioni persistenti | Suspense; nessun badge ottenuto; errore pagina o operazione; collezione/vetrina aggiornate |
| Profilo `/profilo` | Modifica nome, annulla, statistiche, collezione, logout | Metadata account, visite, badge, auth | Suspense; nome mancante; errore/riprova e salvataggio/logout falliti; notifiche e navigazione |
| Accesso `/auth` | Accedi/registrati, validazione email/password, conferma email | Autenticazione esistente | Pulsante occupato; campi richiesti; errore accesso; attesa conferma o navigazione. Nessun nuovo login live provato in Fase 1 |
| Pagine globali | Riprovare o tornare alla Home per errore/404 | Router, query cache | Errore/404 gestiti; nessuna nuova navigazione aggiunta |

### Persistenza e temporaneità
- **Persistenti:** stato città, esperienze, date/note, media/didascalie, copertina città, badge/vetrina e nome account. Dipendono dal backend reale esistente.
- **Preferenze locali:** vista Album/Cronologia in localStorage con chiave per identità; non è un dato salvato nel database.
- **Stato di navigazione:** filtri/pagina Diario nell’URL; ricerca Home/Regione e ordinamento regionale in memoria della pagina.
- **Temporanei:** bozze non salvate, modali, loading/notifiche e patch ottimistiche con rollback; URL firmati delle foto scadono e sono rinnovati. Non equivalgono a nuovi salvataggi persistenti.
- **Non simulato:** catalogo selezionato reale di 104 città (incompleto rispetto all’Italia), con percentuali sulle città disponibili; scudi senza immagine sono fallback. Le fixture aggiunte esistono soltanto nei test.

## Protezione automatica effettiva
Baseline conservata: **85 test precedenti integralmente invariati**. Aggiunti **9 test** in tre file; risultato completo **94 superati, 0 falliti, 0 saltati**, 19 file.

| Comportamento | Copertura concreta | Limite della prova |
|---|---|---|
| OFF/ON indipendente da esperienze | `visit-cache`, `queries`, `experiences` e nuovo `frontend-baseline`: stato, rollback, identità note/esperienze e riferimenti foto/video nella cache | Nessuna prova di cancellazioni server reali |
| Più esperienze senza aumentare città | `experiences`: cinque esperienze, una card Album, una città contata; percentuali nazionali/regionali | Fixture, non cinque creazioni live |
| Modifica indipendente | Nuovo `ExperienceEditor`: payload titolo/data/note, filtri owner/id/deleting, nessuna mutazione delle fixture A/B | Verifica richiesta client; non transazione database |
| Creazione OFF | Nuovo `ExperienceEditor`: nessuna richiesta prima della conferma, singola chiamata atomica, nessuna scrittura client separata; fallimento senza navigazione/successo | Atomicità server resta evidenza storica/da verificare live |
| Eliminazione indipendente | `experience-queries`: filtri owner/esperienza, rimozione batch, nessuna cancellazione finale su errore storage, riprova; `experiences`: deleting esclusa, sorella visibile | Concorrenza/guasti parziali live non coperti |
| Media/copertine | `diary`, `diary-photos`, `queries`, `experience-queries` e nuovo `frontend-baseline`: foto selezionata tra esperienze, fallback foto rimanente, video non copertina, path/esperienza invariati | Riferimenti e richieste testati; rinnovo reale e rendering dopo scadenza non riprovati |
| Progressi | `progress`, `experiences`: catalogo disponibile, regioni esplorate/completate, zero città, formule centrali | Ispezione sorgenti: schermate richiamano `computeProgress`; non introdotte formule nuove |
| Diario | `diary`, `diary-timeline`, `experiences`: ricerca/regioni/anno reale, asc/desc, Album città/Cronologia esperienze, gruppo senza data | Preferenza coperta dalla chiave identity-scoped; click/persistenza/remount della pagina non coperti integralmente |
| Badge | `badges`: 12 ID univoci e soglie esplicite; `badge-queries` e `featured-slot`: selezione/limiti/errori/cache; nuovo `BadgeObserver`: nessun unlock a zero, uno o tre nuovi badge, niente duplicati a refetch identico | Assegnazione permanente e metriche media server non eseguite dalla suite unit |
| Navigazione/stemmi | `app-routing`, `Crest`, `coat-import`, `city-catalog`, `region-order` | Non equivalgono a un collaudo visivo completo |

Regole badge browser centralizzate in `badges.ts`; assegnazione reale resta nelle funzioni/trigger database, senza modificarli. Formula geografica centrale in `progress.ts`; il completamento della collezione badge è una metrica distinta, non una duplicazione del progresso geografico.

## Lacune e problemi documentati, non corretti
| Severità | Stato / impatto | Verifica successiva |
|---|---|---|
| Media | Home non espone uniformemente errori di esperienze/anteprime e non offre riprova dedicata sui dati principali; possibile stato apparentemente vuoto | Test di pagina con errore controllato, poi correzione solo se autorizzata |
| Bassa | Alcuni errori auth/media mostrano messaggi del servizio anziché una formulazione italiana uniforme | Fixture di errore sui form; nessuna modifica ora |
| Bassa | README generico contiene indicazioni obsolete sui badge | Aggiornamento documentazione di portabilità in una fase successiva |
| Limite copertura | Preferenza Diario coperta dalla chiave ma non dall’intero ciclo UI click/ricaricamento; form galleria, conferme/cancellazioni vetrina e stati Home non completamente coperti | Test di integrazione isolati testabili, senza backend; non duplicare fixture fingendo operazioni reali |
| Limite live | Due utenti, nuovo login, video persistenti, scadenza URL, atomicità/concorrenza, guasti storage e assegnazioni badge server | Account/scenari autorizzati e prove live separate; i mock non certificano sicurezza/persistenza |

Nessun nuovo bug bloccante dimostrato dai test mirati. Queste lacune non sono dichiarate risolte né costituiscono test saltati: non sono state eseguite in questa fase.

## Integrità e risultato
Sono stati confrontati hash prima/dopo dei file applicativi, catalogo, configurazioni, migrazioni e asset (esclusi i nuovi test): nessuna modifica. Nessuno strumento database/auth/storage è stato usato in Fase 1; nessun dato personale letto o alterato per le prove. Suite isolata con fixture, senza chiamate al backend.

**Fase 2 avviabile in modo incrementale**, iniziando dai contratti di lettura e mantenendo intatti i percorsi persistenti. La baseline non certifica ancora migrazione esterna o indipendenza dal backend, né elimina la necessità delle verifiche live prima di modificare scritture e autorizzazioni. **Fase 2 non avviata.**

File della Fase 1: questo documento, `src/lib/frontend-baseline.test.ts`, `src/components/explorer/ExperienceEditor.test.tsx`, `src/components/explorer/BadgeObserver.test.tsx`, `roadmap.md` e revisione del piano archiviata in `.lovable/plan/`. Nessuna modifica ai 16 file di test precedenti o al codice applicativo.
## Fase 2 — Separazione frontend / accesso ai dati

### Dipendenze dirette trovate prima della Fase 2
| Area | Punto di accesso diretto |
|---|---|
| Autenticazione e profilo | `lib/auth.tsx` (sessione), `routes/auth.tsx` (accesso/registrazione), `routes/_authenticated/profilo.tsx` (nome, logout), `_authenticated/route.tsx` (gate gestito, lasciato invariato) |
| Regioni e città, statistiche | `lib/queries.ts` `geoQuery` (le statistiche erano già calcolate solo in `lib/progress.ts`) |
| Visitata/Non visitata | `lib/queries.ts` `visitsQuery`, `useSaveVisit` |
| Esperienze, date e note | `lib/experience-queries.ts`, `components/explorer/ExperienceEditor.tsx` (scritture dirette) |
| Media e copertine | `lib/queries.ts` `mediaQuery`, `lib/diary-photos.ts`, `lib/experience-queries.ts` (anteprime), `components/explorer/MediaGallery.tsx` (upload, didascalia, copertina, eliminazione) |
| Badge e vetrina | `lib/badge-queries.ts`, `components/explorer/FeaturedSlots.tsx`, `routes/_authenticated/badge.tsx` |

### Struttura introdotta
- `src/data/contracts.ts`: contratti di dominio (Region, Province, City, Visit, VisitPatch, Experience, ExperienceDraft, Media, SignedMedia, ExperiencePreview, EarnedBadge, FeaturedBadge, BadgeState, UserProfile, Progress/ProgressStats). Indipendenti dai tipi generati; `visit_date` facoltativa resta `null`, distinta da `created_at`/`updated_at`.
- `src/data/backend/`: adapter reale per dominio (`geo`, `visits`, `experiences`, `media`, `badges`, `profile`), più `shared` (paginazione, URL firmati) e `mappers` (righe → contratti).
- Hook e query (`lib/*-queries.ts`, `lib/queries.ts`) usano solo l’adapter; chiavi di cache, invalidazioni, aggiornamento ottimistico e rinnovo URL firmati invariati.
- Funzioni server atomiche (creazione esperienza, copertina, vetrina, badge), RLS, bucket privato e gate di accesso invariati. Nessuna chiave privilegiata nel frontend.

### Letture e scritture migrate
Tutte: catalogo, visite, esperienze, media/anteprime/diario, badge, sessione; ON/OFF, crea/modifica/elimina esperienza, upload/didascalia/copertina/eliminazione media, vetrina, nome profilo, accesso/registrazione/logout.

### Test
105/105 superati (94 baseline + 11 in `src/data/backend/adapter.test.ts`: mapping, null/date facoltative, anteprime, profilo, errori, scritture vetrina/visite, separazione). Verifica reale in anteprima: Home, Diario, Badge, Profilo e scheda città caricano dati e foto private senza errori. Le scritture non sono state eseguite dal vivo per non alterare i dati personali: coperte solo da test automatici.

### Problemi preesistenti (non regressioni, ancora aperti)
- Gestione errori Home incompleta (media).
- Messaggi e README obsoleti (bassa).

### Attività residue
- Componenti con stato/mutazioni (MediaGallery, ExperienceEditor, FeaturedSlots) chiamano l’adapter direttamente: si possono estrarre in hook dedicati se servirà.
- Le pagine usano ancora i campi snake_case dei contratti, scelti per non toccare l’UI.
- Il gate `_authenticated/route.tsx` resta sul client generato perché gestito dalla piattaforma.
