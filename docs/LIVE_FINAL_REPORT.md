# Italia Explorer — collaudo live finale

Data: 12 novembre 2026 (UTC).

## Stato preliminare

**Collaudo live bloccato, rilascio pubblico non dichiarato pronto.**

La sessione disponibile non basta a identificare con certezza entrambi gli account dedicati. La lettura dei soli identificativi account ha rilevato due utenti totali, uno dei quali coincide con l'account personale principale già documentato. Non è stato selezionato un altro utente arbitrariamente, né sono state richieste password. Occorre identificare i due account di collaudo e disporre delle rispettive sessioni autorizzate. Per il test dei tre badge serve inoltre verificare la predisposizione dell'account dedicato.

Nessun dato personale, visita, esperienza, file, badge o impostazione è stato modificato. Nessuna modifica a design, funzionalità, autenticazione, autorizzazioni o database. Nessun dato tecnico creato: pulizia non necessaria.

## Esiti

| Verifica | Esito | Evidenza / prerequisito mancante |
|---|---|---|
| Baseline automatica | PASS | Suite rieseguita: 138/138 test, 24 file, zero falliti. Non sostituisce il collaudo live. |
| Login e logout reali con nuova sessione | NON ESEGUITO | Identificazione degli account dedicati e sessioni autorizzate mancanti; il ripristino di una sessione non sarebbe una prova di login reale. |
| Persistenza dopo logout e nuovo accesso | NON ESEGUITO | Dipende dal precedente test e dalla creazione autorizzata di dati tecnici. |
| Separazione completa dei dati A/B | NON ESEGUITO | Mancano due sessioni di account dedicati identificati. |
| Lettura di dati altrui negata | NON ESEGUITO | Necessarie prove con entrambi gli account, non una sola revisione delle policy. |
| Modifica di dati altrui negata | NON ESEGUITO | Necessari record tecnici e sessioni A/B. |
| Eliminazione di dati altrui negata | NON ESEGUITO | Necessari record tecnici e sessioni A/B. |
| Creazione, modifica ed eliminazione esperienze | NON ESEGUITO | Nessuna scrittura senza identificazione certa dell'account dedicato. |
| Caricamento ed eliminazione fotografie tecniche | NON ESEGUITO | Stesso blocco; non utilizzato storage personale. |
| Selezione e persistenza copertina | NON ESEGUITO | Richiede fotografie tecniche persistenti e nuova sessione. |
| Progressi dopo ON/OFF | NON ESEGUITO | Nessuna visita modificata. |
| Sblocco simultaneo di tre badge nuovi | NON ESEGUITO | Account predisposto non identificato; soglie e stato iniziale non verificati. |
| Assenza duplicati e persistenza conquiste | NON ESEGUITO | Richiede lo sblocco live e successiva nuova sessione. |
| Pulizia dati tecnici | NON ESEGUITO | Nessun dato tecnico creato in questa esecuzione. |

**Nessun FAIL rilevato nelle prove eseguite; i controlli live non eseguiti non sono PASS.**

## Prossimo passo

Indicare soltanto gli indirizzi email dei due account dedicati (nessuna password). Una sessione gestita per un account diverso verrà richiesta con l'apposita autorizzazione; l'account personale principale resta escluso. Se non è possibile ottenere una nuova autenticazione reale, quel test conserverà l'esito NON ESEGUITO anche quando altre prove siano eseguibili con sessioni autorizzate.