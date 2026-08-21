# Modello previsionale Knesset 2026

Modello statistico per le elezioni della 26ª Knesset del **27 ottobre 2026**, pubblicato su
<https://angrisanidj.github.io/modello-israele/>. Autore: Daniele Angrisani (FocusAmerica).

Tutto il testo rivolto al lettore è **in italiano**. Anche i commenti nel codice sono in italiano.

---

## Regola prima: il file è uno solo

`index.html` è un file **autonomo**: HTML, CSS e JavaScript in un unico documento, nessuna
dipendenza esterna, nessuna chiamata di rete all'infuori dell'API di Wikipedia e dei file
del progetto stesso (dati/archivio.json, servito da Pages accanto alla pagina; da disco il
fetch fallisce e vale il seme BASE dentro il file). Deve poter essere
salvato su disco, aperto con un doppio clic e funzionare. Deve poter essere incorporato in una
pagina di Fanpage o FocusAmerica senza portarsi dietro nulla.

Aprendo index.html con doppio clic, Chrome blocca il fetch di dati/archivio.json con un
errore CORS in console — origine null, schema file: non ammesso. **È il comportamento
atteso, non un difetto**: il catch ripiega sul seme BASE e la pagina funziona per intero.
Verificato a mano il 21 agosto 2026, perché nessuna prova automatica può dirlo: jsdom non
fa rete e il riquadro del browser non naviga file://.

Non introdurre bundler, framework, npm a runtime, font remoti, CDN. `devDependencies` serve solo
alle prove.

## Come si lavora

```bash
npm install          # solo la prima volta: installa jsdom per le prove
npm test             # estrae il JS e lancia le 611 prove
npm run verifica     # prove + controlli strutturali
```

`npm test` rigenera `test/app.js` da `index.html`. Non modificare `test/app.js` a mano: è un
prodotto, viene sovrascritto.

**Nessuna modifica a `index.html` è finita finché `npm run verifica` non passa per intero.**

## Invarianti che non si toccano

Sono verificate dalle prove. Se una salta, il difetto è nel codice, non nella prova — a meno che
l'attesa non sia diventata obsoleta di proposito, e allora si aggiorna la prova *nello stesso
commit* spiegando perché nel messaggio.

1. **La somma dei seggi fa sempre 120.** Con qualunque swing, esclusione di istituti, affluenza.
2. **La soglia della maggioranza separa esattamente 60 seggi** nell'emiciclo, in entrambe le viste.
3. **Nessuna funzione JavaScript definita due volte.** È già successo due volte con tagli
   sbagliati: una copia vecchia sovrascrive quella nuova e il difetto è invisibile.
4. **Nessun `id` usato dal JavaScript che manchi nel markup.**
5. **Nessuna risorsa esterna** oltre all'API di Wikipedia.
6. **L'avviso di avvio** (`#k-boot`) resta nel markup, visibile per impostazione predefinita, e
   viene rimosso dal JavaScript al primo render riuscito. Serve a chi apre il file in anteprima.
7. **Contrasto leggibile** nei due temi, chiaro e scuro.
8. **Su schermo stretto** (viewport 380 px) nessun testo negli SVG scende sotto i 5 px reali.

## Trappole già incontrate, da non ripetere

- **Tagliare il file usando come confine una funzione che sta *prima***: duplica un blocco e la
  versione vecchia vince. Prima di un taglio, verificare che l'indice di fine sia maggiore di
  quello di inizio.
- **Stub di prova che creano gli elementi mancanti su richiesta**: nascondono patch non applicate.
  Le prove usano un DOM jsdom vero, costruito da `index.html`. Non tornare a stub permissivi.
- **Patch a catena in un unico script che si interrompe a metà**: se un ancoraggio non viene
  trovato, lo script muore e le modifiche precedenti non vengono scritte. Applicare le patch in
  modo indipendente e riferire quali non sono andate a segno.
- **Sostituzioni automatiche di nomi**: rinominare «Coalizione uscente» in «Blocco Netanyahu» ha
  prodotto sei errori di concordanza («alla blocco», «La blocco»). Dopo una sostituzione, elencare
  le parole che precedono l'espressione e controllarle.
- **Ricostruire angoli da coordinate SVG arrotondate**: le prove sull'emiciclo leggono coordinate a
  due decimali. Non ridurre la precisione.

## Struttura

```
index.html            il modello, pubblicato così com'è come GitHub Pages
.github/
  workflows/aggiorna.yml   lavoro notturno: parser, guardie, commit dei soli file dati
  scripts/aggiorna.mjs     le guardie (valuta) e il registro, funzioni pure provate da job.js
test/
  estrai.mjs          estrae il JS da index.html in test/app.js
  esegui.mjs          lancia tutta la suite e riassume
  struttura.mjs       controlli strutturali sul file
  suite/*.js          le prove, una per area
  misura-consegna.mjs misuratore di tavolozza, a mano: node test/misura-consegna.mjs
dati/
  colore-liste.js     la regola generativa dei colori di lista
  storico.js          sondaggi delle elezioni 2020, 2021, 2022 (banco di prova)
  backtest.js         riapplica il motore alle elezioni passate
  corr.js             misura le correlazioni fra liste sull'archivio
  prefus.js           analisi della fusione B'Yachad del 26 aprile
  wikiparser.js       copia orfana del parser: obsoleta, nessuno la importa, da eliminare
  fixture.js          tabella Wikipedia di riferimento per le prove
  archivio.json       l'archivio pubblicato: la pagina lo carica con fetch relativo
  eventi-grezzi.json  registro delle voci-evento da Wikipedia, in inglese, in attesa di revisione
  stato-job.json      i conteggi di ieri, riferimento delle guardie del lavoro notturno
docs/
  regola-colore.md    la specifica dei colori: bande, settori, punti, distanze
  pubblicare.md       note di lavoro
```

## Il modello in breve

Per ogni sondaggio si invertono i seggi in quote di voto (D'Hondt inverso), si fa una media pesata
per recenza (dimezzamento ogni 7 giorni), numerosità del campione e grappolo di istituto, si
normalizza a 99 e si riparte con Bader-Ofer/D'Hondt sopra la soglia del 3,25%. Poi 20.000
simulazioni Monte Carlo con scosse per lista, per blocco, accoppiate fra liste affini e maggiorate
in zona soglia.

Finestra: 60 giorni, massimo 45 rilevazioni. Direct Polls pesa la metà (sopravvaluta il Likud di
6,2 seggi su 39 rilevazioni).

### Cosa il modello NON fa, di proposito

- **Non corregge la distorsione storica dei sondaggi.** Nel 2020, 2021 e 2022 hanno sottostimato il
  blocco di Netanyahu; nel settembre 2019 lo hanno sopravvalutato di 4,5 seggi. Gli istituti
  ricalibrano dopo ogni elezione, quindi gli errori passati non sono informativi sul prossimo. I
  pulsanti sotto il cursore dello swing *interrogano* quell'ipotesi, non la applicano.
- **Non modella i cambi di lista.** Il banco di prova mostra che a distanza dal voto è la fonte di
  errore dominante — nel 2020 le fusioni di Yamina ed Emet, nel 2021 il Sionismo Religioso sotto
  soglia poi fuso con Otzma, nel 2022 la spaccatura della Lista Unita. Le liste si chiudono l'**8
  settembre 2026**.

### Come si è comportato sulle elezioni vere

| Istantanea | Giorni al voto | Modello | Reale | Errore |
|---|---|---|---|---|
| 2020 | 62 | 54 | 58 | +4 |
| 2021 | 58 | 47 | 52 | +5 |
| 2022 | 49 | 59 | 64 | +5 |
| 2022 | 38 | 60 | 64 | +4 |
| 2020 | 3 | 57 | 58 | +1 |
| 2021 | 4 | 51 | 52 | +1 |
| 2022 | 4 | 61 | 64 | +3 |

Sette su sette dentro l'intervallo dell'80%. Gli intervalli sulle singole liste sono però
ottimistici: coprono il 73% dei casi, non l'80%. È dichiarato nella nota metodologica.

## Pubblicazione

`index.html` è la pagina servita da GitHub Pages. Un commit su `main` la aggiorna.

**Non fare commit senza che l'utente lo abbia chiesto esplicitamente in quel messaggio.** Il file
è pubblico e collegato a un giornale: ogni push è una pubblicazione. Prima di ogni commit:

```bash
npm run verifica     # deve passare per intero
```

Messaggi di commit in italiano, all'infinito, con il perché e non solo il cosa.

## Ancora da fare

1. **Modalità `?embed=1`** per l'inserimento in FocusAmerica.

   **Da sapere prima di scriverlo, non dopo: dentro un `<iframe>` con `sandbox`, un
   `<a download>` non scarica niente** se la sandbox non dichiara `allow-downloads`, e
   vale anche per un `href` `blob:` o `data:` e per uno scaricamento avviato dal
   codice. Fanpage e FocusAmerica incorporano in sandbox. Riguarda l'esportazione PNG
   (punto 7), che è tutta costruita su quello: o l'embed chiede `allow-downloads`
   all'ospite, o dentro l'embed il pulsante di esportazione non va messo. **Non è una
   cosa da scoprire quando il PNG è già scritto.**
2. Accordi di apparentamento (dall'8 settembre, valgono 1-2 seggi)
3. Liste nuove e scissioni fino all'8 settembre (mappatura manuale, il parser avvisa)
4. Incertezza sulla configurazione delle liste nel Monte Carlo
5. Affluenza haredi (nessuna leva, ha oscillato meno di quella araba)
6. Storico delle proiezioni salvate su disco invece che ricalcolate
7. **Esportazione PNG dei grafici.** Il vincolo annotato il 21 agosto — i marcatori
   numerati fuori dall'SVG, che un'esportazione del solo disegno avrebbe perso — **non
   esiste più dal 22 agosto 2026**: i dischi si disegnano dentro l'SVG a **tutte** le
   larghezze, e lo strato HTML (`#k-evlay`) porta soltanto bersagli trasparenti da 30px
   per il fuoco e il tocco.

   **Inventario fatto il 22 agosto 2026, decisioni prese, codice non ancora scritto.**

   ### Quattro disegni, non undici sezioni

   | id | sezione | viewBox | elementi | testi |
   |---|---|---|---|---|
   | `#k-hist` | Il verdetto — blocco Netanyahu | 460×210 | 46 | 8 |
   | `#k-hist2` | Il verdetto — opposizione | 460×210 | 45 | 8 |
   | `#k-emi` | La prossima Knesset | 430×232 | 249 | 7 |
   | `#k-trend` | Come si è mossa la proiezione | 520×331 | 650 | 44 |

   Tutto il resto della pagina è HTML: `#k-house`, `#k-power`, il simulatore
   (`#k-chips` + `#k-gauge`), `#k-coal`, `#k-tab`, `#k-analisi`, `#k-calend`,
   `#k-probs`. **Restano fuori, e la ragione è quella di sempre**: rasterizzarli vuol
   dire `foreignObject` — che contamina la tela in Safari — oppure riscrivere ogni
   impaginato in SVG a mano, cioè **un secondo renderer da tenere allineato al primo**.
   È la strada doppia che questo progetto ha già pagato tre volte.
   Le sparkline di `#k-proj` e `#k-movers` sono SVG ma sono ornamenti di riga, 200×16
   e 200×12 con due-quattro elementi: da sole non dicono niente.

   ### Cosa va incorporato

   **I colori non vanno risolti: sono già risolti.** `leggiTema()` legge le variabili in
   `C{}` e il codice scrive esadecimali letterali. Misurato: `var(--` compare **0 volte**
   nei quattro disegni, e **0 elementi** sono senza `fill` o `stroke` espliciti. Zero
   `currentColor`, zero `url(...)`, zero `foreignObject`.

   Va invece iniettato al momento dell'esportazione:

   - **`xmlns`** — nessuno dei quattro root ce l'ha, e senza `new Image()` fallisce in
     silenzio;
   - **`width` e `height`** — tutti hanno solo il `viewBox`;
   - **`font-family` sulla radice** — **45 dei 67 `<text>`** non hanno l'attributo e
     ereditano dal `#kn26`: emiciclo 4/7, tendenza 25/44, i due istogrammi 8/8. Dentro un
     `<img>` non c'è antenato. Verificato: rasterizzando `#k-hist` con e senza, i pixel
     sono diversi (PNG 30 058 byte contro 31 010);
   - **le opacità degli stati interattivi**, che vivono sul foglio e non nell'SVG:
     `#k-trend.iso .ln`/`.pt`/`.acc`/`.evm`, `#k-trendwrap.solo-*`, `#k-emi.filtra
     circle`. Sono 538 elementi con classe nel solo grafico della tendenza.

   **Sul carattere si accetta la pila della macchina che esporta** — `-apple-system,
   BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` e `Georgia,
   serif`. Il PNG coincide con quello che vede chi lo esporta, non con quello che
   vedrebbe un altro. **Va scritto nella nota metodologica**: incorporare un font vero
   come data URI sono centinaia di KB e viola la regola del file unico.

   ### La strada, provata su browser

   Serializzare → `Blob` (**non** data URI: la tendenza fa 94 473 caratteri, e un `#` di
   colore non codificato tronca l'URI come frammento) → `new Image()` → `drawImage` →
   `toDataURL('image/png')`. Misurato sulla pagina, `#k-emi` a 3×: PNG di **142,8 KB a
   1290×696**, e `getImageData` non solleva niente — **la tela non è contaminata.**

   Deciso: **`Blob`**, **`fillRect` col fondo del tema prima di disegnare** (la tela
   nasce trasparente e nessuno dei quattro SVG disegna un fondo: trasparente si legge nero
   in gran parte delle app), **K=3**.

   ### La targa, e lo stato isolato

   Deciso: **B** — targa sopra (44 unità: titolo della sezione, data dell'archivio,
   firma, indirizzo) **e piede sotto** (30 unità, con la legenda che oggi vive in HTML) —
   per la tendenza e i due istogrammi; **A**, la sola targa, per l'emiciclo, che la
   legenda ce l'ha dentro. Tendenza a K=2: 520×405 di viewBox, cioè 1040×810.

   Deciso sullo stato isolato: **si esporta quello che si vede**, con le opacità stampate
   sulla copia, **e la riga dell'evento va nella targa** — «26.04 · Bennett e Lapid
   fondono le liste in B'Yachad — nei 30 giorni successivi: Netanyahu 51, opposizione 47,
   arabi 11». È l'unica delle tre che produce un'immagine pubblicabile: senza quella riga
   l'isolato è un disegno quasi tutto grigio con una scheggia accesa di 36,8px su un asse
   da 274.

   ### Il comando

   **Un pulsante per disegno**, nella testata della sezione, stile `.lnk`, con
   **`aria-label` che nomina il grafico** — quattro pulsanti chiamati tutti «Scarica PNG»
   sono indistinguibili in un elenco di comandi, ed è la stessa lezione dei bersagli dei
   marcatori. Niente pulsante unico di pagina (quattro scaricamenti in un gesto), niente
   scorciatoia da tastiera (un tasto nudo collide col filtro dell'archivio, una
   combinazione con la pagina ospite): il pulsante nell'ordine di tabulazione **è**
   l'accesso da tastiera.

   ### Due trappole annotate prima di scrivere il codice

   1. **La nuvola dei sondaggi porta `opacity=".28"` come attributo mentre il valore
      calcolato in stato isolato è `.07`.** Oggi la pagina rende `.07`, che è quello che
      si vuole — in SVG un attributo di presentazione perde contro qualunque dichiarazione
      CSS — quindi non è un difetto di resa. **Ma le due strade dicono due cose diverse**,
      e chiunque legga l'SVG invece del valore calcolato prende quella sbagliata:
      l'esportazione lo farebbe, e mostrerebbe la nuvola a **quattro volte** l'opacità
      voluta. È la solita forma — due strade per lo stesso valore, nessuna prova che le
      leghi — e qui la divergenza è già scritta nel file. Chi scrive l'esportazione
      stampa il valore **calcolato**, non l'attributo, e già che c'è valuti se
      l'attributo debba restare.
   2. **`<a download>` non scarica dentro un `<iframe>` con `sandbox`** senza
      `allow-downloads`, nemmeno con `href` `blob:`. Cioè dentro `?embed=1`. Vedi il
      punto 1: la cosa serve a chi scrive l'embed, e prima, non dopo.
8. Aggiornamento automatico programmato, con avviso se l'archivio è vecchio
9. Accessibilità: navigazione da tastiera, ruoli ARIA.

   **Chiuso il 22 agosto 2026**, dentro questo punto: i bersagli dei marcatori degli
   eventi avevano per nome accessibile il solo numero — «6, pulsante» — e ora portano
   `aria-label` con data e fatto, mentre il numero interno esce dall'albero con
   `aria-hidden`. Vedi «Le due domande in sospeso» in fondo.

   **Resta aperta, e non si decide a tavolino: i dischi dentro l'SVG sotto i 900px.**
   Lì il `<title>` è l'unica cosa che li descrive, e sta dentro il `<text>`, non dentro
   il `<g>`. **Si è scelto di lasciarlo com'è**, e la ragione è che sotto i 900 il disco
   **non è attivabile**: dargli un nome accessibile metterebbe nell'albero una voce che
   il lettore incontra senza poterci fare niente. Il comando è la voce di cronologia, che
   ha un testo suo.

   Ma è una scelta da **provare con un lettore di schermo vero**, non da stabilire
   ragionando: è la stessa famiglia del layout — nessuna misura la risolve, e nessuna
   prova di questa suite può dire come suona. Le alternative scartate, se la prova le
   riaprisse: spostare il `<title>` sul `<g>` dandogli `role="img"`, oppure dichiarare
   il gruppo decorativo con `aria-hidden` perché il testo è già nella cronologia sotto.
10. **Prova su browser veri.** Tutto è verificato in jsdom, che non fa layout. I difetti veri
    segnalati finora — testo nero su fondo nero, anteprima senza JavaScript, didascalia sopra i
    seggi — erano tutti di quel tipo e nessuna prova automatica li avrebbe visti.
11. Settembre 2019 ricalcolato riga per riga (oggi è dato di seconda mano, da titoli di stampa)
12. **Il conto dei giorni al voto tronca le ore invece di contare i giorni di calendario.**
    Il 20 agosto la pagina dice «67 giorni», ma dal 20 agosto al 27 ottobre sono 68 giorni di
    calendario. Il lettore confronta col calendario, non con le ore: il conto va fatto sulle
    date a mezzanotte, non sulla differenza di millisecondi troncata.

    **È la stessa famiglia del difetto dell'ora legale chiuso il 21 agosto 2026** nella
    finestra dei 30 giorni dell'evento isolato, dove `setDate/getDate` in ora locale
    scavallavano il cambio del 29 marzo e il riquadro annunciava «Nei 29 giorni
    successivi». Entrambi contano giorni di calendario come differenze di millisecondi,
    e il rimedio è lo stesso: portare le date a mezzanotte **UTC** e fare la sottrazione lì.

    Cercato in tutto il file dopo quella riparazione: **`setDate/getDate` in ora locale non
    compaiono altrove**. Restano però tre punti della stessa famiglia, e non sono
    equivalenti:

    | dove | com'è | verdetto |
    |---|---|---|
    | `gg(new Date(), VOTO)` — il conto alla rovescia | istante locale contro `new Date('2026-10-27T00:00:00')`, cioè mezzanotte **locale** | **è questo punto 12** |
    | `gg(oggi, new Date(x.d+'T00:00:00'))` — le tappe del calendario | idem, per ognuna delle sei tappe | **stesso difetto, stesso rimedio** |
    | la finestra a 7 giorni della mediana | `getTime()-7*864e5` su una data letta come UTC e riformattata con `toISOString` | **sano**: non tocca mai l'ora locale |

    Una precisazione sul titolo di questo punto: `gg()` **arrotonda**, non tronca. Il
    risultato per il lettore è lo stesso — un giorno di scarto — ma chi lo ripara deve
    sapere che il conto scatta a mezzogiorno, non a mezzanotte.

    E c'è un aggravante che il testo del punto non diceva: fra oggi e il voto cade il
    **cambio d'ora del 25 ottobre**, due giorni prima delle urne. Da lì in poi la
    differenza in millisecondi porta un'ora in più, e siccome `gg()` arrotonda invece di
    troncare, il giorno in cui il conto scatta dipende dall'ora in cui si apre la pagina.
    Chi lo ripara lo verifichi **a cavallo del 25 ottobre**, non solo a una data qualsiasi.
13. **Sei suite usano un DOM ridotto invece di jsdom.** `aff`, `emi`, `final`, `tema`,
    `testint` e `verifica` sostituiscono `document` con oggetti finti in cui `innerHTML` è
    una semplice proprietà di testo: nessun albero viene mai analizzato, quindi
    `querySelector` non esiste. Sono state scritte così perché leggono la stringa HTML che
    il modello scrive, non il risultato reso — costa meno di un'analisi per suite. Ma è
    esattamente lo stub permissivo contro cui mette in guardia la sezione delle trappole,
    e ha già presentato il conto: l'aggancio interattivo degli istogrammi ha dovuto
    aggiungere una guardia d'uscita per non farle cadere, e quella guardia rendeva 108
    righe non esercitate da nessuna prova. Oggi le copre `interazione.js`, che costruisce
    un DOM vero. Vanno convertite: finché restano così, ogni codice che tocchi elementi
    resi va provato altrove o non è provato affatto.
14. **La tabella che sfora è quella dell'*house effect*, non quella dell'archivio.**
    Questo punto ha indirizzato sulla tabella sbagliata per tre commit: la misura era
    giusta — 942px dentro un `div` con `overflow-x:visible` — ma quei numeri sono di
    `#k-house`, non di `#k-tab`. Rimisurato su browser vero il 21 agosto 2026:

    | | larghezza | contenitore | `overflow-x` | spinge il documento? |
    |---|---|---|---|---|
    | house effect `#k-house` | **941,8px**, 13 colonne | `#k-house` | **`visible`** | **sì, 588,8px a 380** |
    | archivio `#k-tab` | 1288,9px, 22 colonne | `.scroll` | `auto` | no, scorre da sé |

    L'archivio è **il doppio più largo** e non sfora, perché sta già dentro `.scroll`.
    Era chiuso da prima; non c'è niente da fare lì.

    **Chiuso il 21 agosto 2026** con le schede, non con uno scorrevole: vedi la sezione
    «L'house effect: due forme». Il documento a 380 passa da 588,8 a **35px** di
    sforamento, e a 760 da 225 a **zero**. I 35 che restano non sono suoi: sono i punti
    15 e 16 qui sotto. Tre sorgenti indipendenti, non una — chiuderne una non chiude le
    altre. **Chiuse anche quelle il 22 agosto 2026: a 380 lo sforamento è zero.**
15. ~~Quattro tabelle dentro `#k-metodo` sforano~~ — **chiuse il 22 agosto 2026, e non
    come l'house effect.** Il punto diceva «è lo stesso caso», e non lo era. Rimisurato:
    quei quattro numeri sono lo sforamento del documento che ciascuna tabella provoca da
    sola, e finalmente si sa quale è quale — il contenitore `#k-foot` a 380 vale 326px:

    | tabella | col. | larghezza | sforamento |
    |---|---|---|---|
    | Liste che si muovono insieme | 3 | **528,0** | **175** |
    | Il modello alla prova (backtest) | 5 | 427,9 | 74,9 |
    | Ancoraggi dello swing | 4 | 388,4 | 35,4 |
    | Affluenza araba | 4 | 381,8 | 28,8 |

    **Non si sommano**: lo sforamento è un massimo. `#k-metodo` portava 175 e solo
    quelli, tutti dalla tabella a *tre* colonne — non da quella a cinque, come verrebbe
    da pensare.

    **La larghezza non era del contenuto.** Gliela dava il `white-space:nowrap` **globale**
    delle celle, scritto per l'archivio e per l'house effect — dove le colonne sono cifre
    e andare a capo sarebbe un difetto — ed ereditato da quattro tabelle di prosa che non
    ne hanno mai avuto bisogno: «Meccanismo» da sola 232,3px, «Configurazione» 153,
    «Istantanea» 143,6. Rimedio: `white-space:normal` dentro `.foot`, e tutte e quattro
    tornano a 326, cioè al contenitore. Costa 472px di verticale; il `padding:6px 5px`
    sotto i 660 ne restituisce 186.

    **Le schede sarebbero state il rimedio giusto per il problema sbagliato**: l'house
    effect era largo *davvero* (941,8px di numeri) e doveva mettere un pulsante accanto a
    un nome. Qui non c'è nessun comando — **zero elementi focalizzabili** in tutte e
    quattro — e la larghezza era di una regola altrui. Nemmeno lo scorrevole serviva.

    **E c'erano due difetti a 1265 che nessuno aveva registrato**, perché la nota è chiusa
    per impostazione predefinita e lì va su **due colonne da 515px**:

    - la tabella delle correlazioni, larga 528, **sbordava di 13px nella gronda da 44** —
      e non solo a 1265: `width:100%` in multicolonna si risolve sulla colonna, e 528 è
      il suo minimo, quindi sbordava **a qualunque larghezza a due colonne**;
    - il backtest **si spezzava fra le due colonne**: `getClientRects()` ne restituiva
      **due** frammenti, alti 45,2 e 248,2 — testata orfana in fondo alla sinistra e corpo
      in cima alla destra. È un difetto di lettura, non di larghezza, e nessuna misura di
      sforamento poteva vederlo. `break-inside:avoid` era su `.foot p` e non su
      `.foot table`.

    Verificato dopo, con le regole applicate, alle tre larghezze: documento **380 / 760 /
    1250** con la nota **chiusa e aperta**, tabelle 326 · 678 · 515 cioè esattamente il
    contenitore, **un frammento ciascuna**, zero nella gronda.

    Una nota per l'8 settembre: queste tabelle non crescono con le liste, sono di storia.
    Non vanno rimisurate come l'house effect.
16. ~~`#k-upd` sfora di 35px a 380~~ — **chiuso il 22 agosto 2026, e la diagnosi del punto
    era sbagliata.** Gli 85,8px non sono la larghezza della stringa: **la data era già
    andata a capo quattro volte**, una parola per riga, e 85,8 è la larghezza della sola
    parola «AGGIORNATO» a 10px maiuscolo con 2px di spaziatura — cioè il minimo sotto cui
    un riquadro flessibile non può scendere. Ricostruito riga per riga dai rettangoli del
    testo, a 380:

    ```
    AGGIORNATO    da 329 a 415   ← 35px fuori dallo schermo
    AL 20         da 329 a 365
    AGOSTO        da 329 a 381   ← 1px fuori
    2026          da 329 a 360
    ```

    La testata era alta **62px invece di 31**. E l'aritmetica della riga dice perché
    accorciare il testo *spostava* il problema invece di chiuderlo: 12 (marchio) + 93,6
    (titolo) + 0 (il filetto `.bar`, già collassato) + 168,3 (i tre pulsanti del tema) +
    85,8 = **359,7 in 358**, e i 44px di gap sono in più. **Nemmeno azzerando tutti i gap
    la riga starebbe.** Provate e misurate: «20 ago 2026» arriva a sforamento zero ma resta
    impilata su tre righe; «20.08.2026» è una parola sola larga 71,4 e **sfora comunque**
    di 20px.

    Rimedio: `flex-wrap:wrap` sulla testata — agisce da solo quando serve, a 760 e 1265
    la testata è identica a prima — più `margin-left:auto` sull'`<em>`, che tiene la data
    allineata a destra sulla riga sua, dov'era. A 380 la data sta su **una riga** larga
    219,7 a filo del bordo destro, e la testata passa da 62 a 77px. A **660** migliora
    anche dove non sforava: prima ci stava su due righe schiacciate, ora su una.

    **Nascondere la data era la strada scartata**, benché la data compaia altre due volte
    nella pagina: la testata è il primo posto in cui si guarda per sapere se il dato è
    fresco.

    **Con i punti 15 e 16 chiusi, a 380 il documento non scorre più in orizzontale — né
    con la nota chiusa né con la nota aperta.** È la prima volta, ed è il prerequisito che
    l'embed chiedeva.
17. **Le righe degli istituti esclusi stanno a `opacity:.42`, e lì nessun token arriva a
    4,5.** Misurato nei due temi: il migliore è `--ink` a **2,70** in chiaro e **3,65** in
    scuro, `--mute` sta a 1,79 e 1,91, `--neg` a 2,03 e 2,44. Nessuna scelta di colore
    lo risolve — **la leva è l'opacità**, esattamente come per le tre sparkline di
    `k-proj` a 0,55. Ed è la riga che il lettore deve poter rileggere per decidere se
    reinserire l'istituto. Le schede non copiano il difetto: l'escluso lo segnano col
    tratteggio e col pulsante.

## L'house effect: due forme, e un colore che non giudica

Applicato il 21 agosto 2026. Due cose insieme, perché toccavano lo stesso codice.

### La forma: schede sotto la soglia, tabella sopra

La tabella ha **941,8px** di larghezza minima — tredici colonne con `white-space:nowrap`,
di cui 241,9 la sola «Istituto» — e il contenitore vale `clientWidth − 110`. Sotto i
~1052px spingeva l'intero documento fuori dalla finestra: 588,8px a 380, 225 a 760.

**Non si è messa a scorrere: ha cambiato forma.** Sotto la soglia una scheda per istituto,
larga quanto il contenitore, con i soli scarti da 0,8 in su — 48 celle su 88, cioè da tre
a nove voci per istituto. Sopra, la tabella di prima.

Perché non lo scorrevole, che pure sarebbe stato meno codice:

- **L'8 settembre.** Due liste in più portano il minimo della tabella a ~1060px contro un
  contenitore che il `max-width:1180` blocca a **1070**: dieci pixel, che il primo
  deposito si mangia. Le schede non crescono in larghezza — due liste in più sono due voci
  dentro un elenco che va a capo.
- **La tastiera.** Chrome rende gli scroller raggiungibili col tabulatore **solo se non
  contengono elementi focalizzabili**. Misurato: `#k-tab` ne ha zero e lo è gratis;
  `#k-house` ne ha **otto**, un pulsante per riga, quindi sarebbe stato escluso. E
  tabulare sui pulsanti non aiuta: stanno tutti nella prima colonna, sempre visibile, così
  il fuoco non fa mai scorrere niente. Sarebbe servito un `tabindex="0"` esplicito.
- **A 380 lo scorrevole lascia fuori il 65%** — 616px su 942 — dietro un contenitore che
  quel lettore non sa di poter scorrere.

Con le schede il pulsante di esclusione sta **accanto al nome a cui si riferisce**. Nella
tabella a 380 era visibile e i dati su cui decidere erano fuori schermo: si decideva senza
vedere su cosa.

### Il confine è 1075, e dentro quel numero c'è una trappola

1052 sarebbe il confine esatto, ma lascia due decimi di pixel, che non è un margine.

E poi la trappola, misurata su browser e da non ridimenticare: **la media query si
confronta con `innerWidth`, cioè con la finestra COMPRESA la barra di scorrimento, mentre
il contenitore vive dentro il `clientWidth`.** Misurato: la media query rispondeva 1070
dove il `clientWidth` era 1055, quindici pixel di barra. Con la soglia a 1060 il
contenitore vale `1060 − 15 − 110 = 935` e **la tabella sarebbe ricomparsa sforando di
sette pixel** — cioè il difetto che la regola esiste per chiudere, ricreato dalla regola
stessa. Il conto va fatto sulla barra più larga: `1075 − 17 − 110 = 948` contro 941,8.

Verificato su browser al confine: a media query 1075 il contenitore è 950 e la tabella
950, sforamento zero; a 1070 compaiono le schede. A 1265 tabella, contenitore 1070,
sforamento zero. A 760 schede e **sforamento del documento zero**. A 380 schede,
sforamento della sezione zero e del documento 35, che sono i punti 15 e 16.

**Da rimisurare l'8 settembre**: con quindici colonne la soglia sale a ~1190.

### Il colore: il segno non è un giudizio, quindi il colore non lo dice

I valori erano `--coal` in eccesso e `--neg` in difetto. Nell'house effect «+6,1 al
Likud» vuol dire che quell'istituto gli dà sei seggi più della media degli altri: è uno
scarto, non un miglioramento.

**Tutti e due i token significavano altro**, ed erano la sesta e la settima strada per gli
stessi valori: `--coal` è il Blocco Netanyahu in cinque punti — `BL{}` per emiciclo e
legende, `C.coal` per la barra di probabilità, l'istogramma con la sua pastiglia e una
colonna del backtest — e `--neg` è «ha perso seggi» nelle colonne 7 GG e 30 GG, oltre
che errore, veto violato e somma che non fa 120. Il blu diceva la cosa più falsa:
**«B'Yachad +4,4» finiva dipinto nel colore del blocco avversario.**

**Nella tavolozza non esiste una coppia libera**: quattro token sono di blocco, due sono
`--pos`/`--neg`, uno è la bandiera. `--acc`/`--inc` sarebbe stata la coppia divergente
migliore — contrasti 9,30 e 7,22 in chiaro, 5,94 e 9,35 in scuro, ΔE per protanopia 61,6
contro i 43,8 di oggi e i **10,0** di verde-rosso, che è la ragione numerica per cui
`--pos`/`--neg` non era comunque un'opzione — ma scambiava un significato sbagliato con
due presi in prestito.

Quindi: **la direzione la porta il segno**, che era già scritto, **e l'intensità il peso**,
che scatta a 1,5 e c'era già. Al colore resta la sola distinzione fra scarto che conta e
rumore: `--ink` da 0,8 in su, `--mute` sotto. Contrasti nelle schede, nei due temi: il
valore `--ink` sulla pastiglia `--card` 17,82 e 15,25; il nome della lista `--ink2`
10,04 e 8,39; testata e conteggio `--mute` su `--wash` 4,79 e 4,75. **Righe alternate non
ce ne sono**: nessun `nth-child` in tutto il file.

E il meno è quello tipografico, `−` (U+2212), lo stesso delle colonne 7 GG e 30 GG:
`f()` da sola dà il trattino d'unione, e due punti della stessa pagina che mostrano la
stessa grandezza non possono usare due segni diversi. Chi legge quei numeri dal DOM in
una prova deve normalizzarlo, o `parseFloat` restituisce `NaN` e ogni scarto negativo
sparisce dal conto senza far cadere niente.

### Le soglie si decidono sul numero che il lettore vede

Le tre soglie — trattino a 0,1, grigio a 0,8, grassetto a 1,5 — si applicano al valore
**arrotondato a un decimale**, non a quello grezzo. Sul grezzo due celle che dicevano
entrambe «−0,8» finivano una in `--ink` e una in `--mute`, e la scheda ne prendeva una
e lasciava fuori l'altra.

**L'ha trovato la prova che lega le due forme, al primo giro.** È la regola generale del
progetto applicata a una strada doppia nuova: tabella e schede sono due percorsi per lo
stesso valore, e `test/suite/house.js` verifica che per ogni istituto gli scarti da 0,8
in su siano gli stessi nelle due. Senza quella prova il difetto sarebbe stato invisibile,
perché ciascuna forma era corretta rispetto a sé stessa.

## Calendario

| Data | Cosa |
|---|---|
| 8 settembre 2026 | Deposito delle liste: la mappa dei partiti si chiude |
| 6 ottobre 2026 | Comincia la propaganda televisiva |
| 23 ottobre 2026 | Silenzio demoscopico: ultimi sondaggi pubblicabili |
| **27 ottobre 2026** | **Voto** |
| 4 novembre 2026 | Risultati ufficiali |

---

## La tavolozza: perché la soglia interna è 7,5 e non 8

Applicata il 20 agosto 2026. I colori delle liste non sono più scritti a mano
nell'anagrafica: vengono da una regola generativa — quattro bande di luminanza (una per
blocco), un settore di tinta disgiunto per blocco, e per ogni slot una terna
*tinta · posizione nella banda · croma*.

**Il vincolo che morde è la larghezza delle bande, non la scelta dei punti.** Le bande
sono fissate da due cose che non si possono allentare: i salti fra bande adiacenti devono
stare a ≥ 1,309 in forma WCAG `(L₁+0,05)/(L₂+0,05)`, e i soffitti di contrasto impongono
il tetto in tema chiaro e il pavimento in tema scuro. Quel che resta è un intervallo
stretto, e dentro un settore di 50° con sei liste il ΔE2000 minimo non arriva a 8.

Misurato, sull'opposizione sionista:

| Configurazione | ΔE2000 minimo |
|---|---|
| sei liste accese | **8,0** |
| cinque liste accese | **8,9** |
| bande allargate, fuori specifica | **11,6** |

Il riposizionamento degli slot vale molto — porta l'opposizione da 3,7 a 7,9 e la
coalizione da 6,3 a 13,2 — ma 9,7 non è raggiungibile senza allargare le bande, e
allargarle farebbe cadere il vincolo dei salti. La soglia di 8 era ricavata da una misura
su un solo tema e con varianza sottostimata: **si corregge l'ingresso, non si aggiusta il
risultato.** Da qui 7,5.

Non riaprire la partita senza rimisurare: `node test/misura-consegna.mjs` rifà tutto il
conto, e `MUTA=settori` verifica che il controllo sulle famiglie di tinta sappia fallire.

**Due vincoli aggiunti che non sono negoziabili.** Massimizzare il ΔE senza di essi
distrugge la famiglia di tinta: l'ottimo porta il croma a zero e produce grigi — e un
grigio ha un angolo di tinta che non significa niente, quindi il controllo sui settori non
se ne accorge. Perciò: pavimento di croma OKLCH a 0,0424 (il minimo della consegna
precedente, quindi nessuna regressione) e ancore di blocco vincolate, tinta entro ±6° e
croma non inferiore a quello della consegna precedente.

## Le bande restano: cosa sopravvive al bianco e nero e al daltonismo

Deciso il 20 agosto 2026, misurato, e scritto qui per non riaprire la partita.

Era stato chiesto se convenisse abbandonare le bande di luminanza — quelle che fanno dire
il blocco al colore — per guadagnare distanza fra le liste. Senza bande il ΔE2000 minimo
fra liste sale da **7,88** a **22,72**, quasi il triplo. Ma le quattro fasce di luminanza
si sovrappongono tutte, e il blocco smette del tutto di leggersi in bianco e nero.

La misura che ha deciso è un'altra, e va nella direzione opposta a quanto sembrava.
Simulando deuteranopia e protanopia sulle 372 coppie di liste coesistenti:

| | Nominale | Per un dicromate |
|---|---|---|
| fra **blocchi diversi** (294 coppie) | 14,85 | **9,18** |
| dentro lo **stesso blocco** (78 coppie) | 7,88 | **0,86** |

**Tutte e dodici** le coppie che scendono sotto ΔE 3 per un dicromate sono dello stesso
blocco: nemmeno una fra blocchi diversi. La separazione fra blocchi regge in scala di
grigi e regge per un occhio daltonico; quella fra liste della stessa famiglia no, perché
è affidata alla sola tinta.

È il compromesso giusto proprio perché i due posti non sono simmetrici: **nella tabella
per lista il blocco è già scritto sotto ogni nome**, quindi la tinta ridondante che
collassa non porta via informazione; **nell'emiciclo il colore è l'unico portatore**, e
lì quello che conta è che il blocco si legga — e si legge.

Rimisurabile con `node test/misura-consegna.mjs <cartella> --colori`. La simulazione usa
le matrici di Viénot, Brettel e Mollon su RGB lineare: serve a ordinare le coppie, non a
certificarle.

## L'obiettivo a cascata, e perché l'ultimo blocco paga il conto

Misurato il 20 agosto 2026. **Non ancora applicato alla tavolozza**: è una proprietà del
metodo, registrata perché non si riparta da capo.

Massimizzare il ΔE minimo *globale* è l'obiettivo sbagliato: appena il blocco più
vincolato inchioda il minimo — l'opposizione, sei liste in un settore di 50° — l'ottimizzatore
smette di spingere gli altri, che restano fermi al valore di quello. Massimizzando invece
**blocco per blocco in cascata**, dal più vincolato al meno, ciascuno tenuto fisso per i
successivi:

| Blocco | Globale (oggi) | A cascata |
|---|---|---|
| opposizione | 7,88 | 7,88 |
| arabo | 7,97 | **9,48** |
| coalizione | 13,16 | **14,60** |
| incerto | 14,52 | 14,46 |

ΔE fra blocchi diversi: 14,85, invariato.

**L'ultimo blocco della cascata non è libero come il primo, e può uscire peggiorato.**
`incerto` scende di sei centesimi non per un difetto della ricerca ma per costruzione: la
configurazione di partenza è valida finché anche i blocchi precedenti sono quelli di
partenza, e una volta che gli altri tre si sono spostati quella configurazione può violare
il ΔE ≥ 11 verso di loro. Chi viene per ultimo eredita i vincoli di tutti.

Conseguenza pratica: l'ordine della cascata è una scelta, non un dettaglio. Metterci per
ultimo il blocco che ha più margine — oggi `incerto`, a 14,5 — è ciò che rende il costo
trascurabile.

## Due limiti della tavolozza, misurati. Non rifare questo giro

**L'opposizione non può cambiare banda, e il suo ~7,5 è il pavimento di tutta la
tavolozza.** Sei liste coesistenti in un settore di tinta da 50° stanno **solo** nella
banda più chiara: nelle altre tre l'ottimizzatore non trova nemmeno una configurazione
valida. Su ventiquattro assegnazioni famiglia→banda, dodici cadono, e in dieci casi il
blocco che non trova posto è l'opposizione. Da qui discende che il ΔE minimo dell'intera
tavolozza è sempre il suo, fra 7,0 e 7,9 a seconda di dove stanno gli altri: qualunque
guadagno su arabo, coalizione o ago della bilancia **non sposta il minimo complessivo**.

**L'assegnazione famiglia→banda è stata enumerata su tutte e ventiquattro le combinazioni**,
con i settori e le ancore di oggi e tutti i vincoli attivi. **Ne sopravvivono due**, e sono
quelle con l'opposizione nella banda chiara:

| B1 · B2 · B3 · B4 | arabo | oppos | coali | incer | fra blocchi |
|---|---|---|---|---|---|
| verde · blu · sabbia · verdeazzurro | 9,0 | 7,9 | 15,1 | 14,5 | 17,0 |
| **blu · verde · sabbia · verdeazzurro** *(applicata)* | **14,0** | 7,9 | 12,4 | 14,5 | 13,5 |

**È stata scelta la seconda, e non per il ΔE.** Con il verde nella banda più scura
`--arab` era `#202E00`, luminanza 0,0226 e croma 0,070: non si legge come verde, si legge
come nero — e il verde per le liste arabe è una convenzione a cui non si rinuncia. Il blu
quella banda la regge, perché è naturalmente scuro. La fisica è quella: la luminanza pesa
0,7152 sul verde e 0,0722 sul blu, quindi un verde saturo è intrinsecamente chiaro e un
blu saturo intrinsecamente scuro.

Il prezzo, accettato: coalizione da 15,1 a **12,4** e distanza fra blocchi da 17,0 a
**13,5**, entrambe sopra soglia. Il guadagno: blocco arabo da 9,0 a **14,0**.

**L'ancora della coalizione è stata riportata verso il blu bandiera**: da 241,6° a 262,2°,
con `#0038B8` a 262,9° e il blu sRGB puro a 264,1°. Stava ventun gradi sotto, verso il
ciano — la tinta meno blu del suo settore. `--coal` passa da `#004A72` a `#00226E`.

Con il blu nella banda più scura serve anche un **pavimento di croma dedicato all'ancora
della coalizione, 0,12** invece del generale 0,0424: senza, l'ottimo produceva `#1D2A40`,
che si legge grigio e non blu — lo stesso difetto per cui il verde è stato spostato. Non
costa niente, anzi: il blocco sale da 11,85 a 12,40 e la distanza fra blocchi da 12,62 a
13,47, perché il vincolo spinge la ricerca in un bacino migliore.

## Difetti noti, di codice e non di tavolozza

Nessuna scelta di colore li risolve: dipendono da come il modello disegna.

1. **Tre sparkline di `k-proj` a opacità 0,55** stanno sotto 3:1 contro il fondo. Un
   tratto al 55% su fondo pieno non arriva a 3 con nessuna tinta ragionevole: il massimo
   ottenibile a α = 0,55 richiede una tinta piena con luminanza ≤ 0,048. La leva è
   l'opacità, non il colore.
2. ~~La linea della maggioranza in `k-emi`~~ — **chiusa il 21 agosto 2026** con la stessa
   costruzione a due tinte dell'anello degli istogrammi e del tratto del simulatore: alone
   continuo `--card` sotto, tratto tratteggiato `--ink` sopra. Misurata nuda contro tutti i
   49 fondi che può attraversare (pannello, 24 pieni, 24 attenuati a 0,22): 1,17 in chiaro
   e 1,05 in scuro sul peggiore, nessuna tinta singola bastava. Con l'alone, in ogni punto
   una coppia sta sopra 3.

---

## Da dove riprendere

Scritto il 20 agosto 2026, a fine sessione. Serve a chi apre il progetto domani senza
ricordare niente di oggi.

### Trovato guardando la pagina pubblicata, dopo il push

I quattro token CSS di blocco — `--coal` `--oppo` `--arab` `--inc` — non seguivano la
regola. Il blocco arriva allo schermo per **due strade**: `BL{}` colora l'emiciclo e le
legende, i token vengono letti da `leggiTema()` in `C{}` e colorano le barre di
probabilità, i due istogrammi con le pastiglie di legenda, due colonne del backtest e il
tratteggio dell'ago della bilancia. Erano già divergenti di ΔE 3–4 da prima; lo scambio di
banda ha portato blu e verde a **ΔE 11**, e nel tema scuro `--arab` stava a **4,32** di
contrasto, sotto la soglia. Allineati a `di(blocco, 0, tema)`: tutti i contrasti restano
sopra 4,5 (il minimo diventa 4,69, `--coal` scuro), e `--arab` scuro sale a 6,19.

La lezione non è il colore, è che **nessuna prova legava le due strade**. Ora
`regola.js` lo fa. Prima di aggiungere un colore da qualche parte, cercare se lo stesso
concetto ha già un'altra strada verso lo schermo.

**La regola che vale oltre questo caso: ogni valore che arriva allo schermo per più di una
strada deve avere una prova che le leghi.** Non basta che ciascuna strada sia giusta per
conto suo — due copie corrette oggi divergono domani, e divergono in silenzio, perché
nessuna delle due è sbagliata rispetto a sé stessa. Il colore di blocco è stato divergente
per tre commit e nessuna delle 211 prove di allora aveva niente da ridire. Le due strade
del colore di blocco sono chiuse; **se ce ne sono altre nel modello vanno cercate, ed è la
prossima cosa da fare dopo l'embed.**

### E la regola gemella: misurare convince di aver guardato

Scritta il 21 agosto 2026, dopo tre difetti trovati a occhio su schermate che la suite
dichiarava sane. **Ogni proprietà che si sceglie di misurare convince di aver guardato, e
ciò che non si è misurato resta invisibile esattamente come prima.** È la sorella della
regola qui sopra: là due strade corrette divergono in silenzio, qui una misura corretta
copre il posto di quella che serviva.

I tre casi, tutti nello stesso schermo a 380px:

| misurato, e vero | non misurato, e falso |
|---|---|
| il riquadro dell'evento è visibile, dista 12px dalla voce, la pagina non si muove | **che dentro ci fossero delle cifre**: i tre seggi erano macchie scure, testo `--ink` su fondo `--ink2`, 1,76:1 |
| lo strato dei marcatori sparisce sotto i 660, i dischi tornano nell'SVG | **che i dischi si distinguessero**: sedici su una riga sola, passo minimo 2,4px, sette coppie sovrapposte |
| il tratto acceso ha opacità 1 contro 0,26 e spessore 2,38 contro 1,50 | **quanto fosse lungo**: 36,8px su un asse da 274, e 1,2px sull'ultimo evento |

**Le quaranta prove di `isola.js` erano tutte verdi**, e lo erano a ragione: verificavano
che il riquadro fosse dove doveva, che lo strato fosse nascosto, che le opacità fossero
quelle scelte. Nessuna guardava il risultato.

Due conseguenze pratiche, e sono quelle da ricordare:

- **quando si sposta un elemento nel DOM, si porta dietro i selettori discendenti del
  posto in cui arriva.** `#k-evsel` è l'unico elemento che si sposta in tutto il file — le
  sole tre `insertBefore` sono le sue — e finiva dentro `#k-crono`, dove `.crono b` e
  `.crono button` lo hanno raggiunto. Le regole della cronologia sono ora sui **figli
  diretti**, e `mob2.js` prende tutte le regole `.crono` dal foglio e verifica che nessuna
  raggiunga qualcosa dentro il riquadro — così vale anche per quelle scritte domani. Se
  un giorno si sposta un secondo elemento, questa è la prima trappola da ricontrollare;
- **una misura di posizione non è una misura di leggibilità.** Dopo aver verificato che
  una cosa sta dove deve, la domanda successiva è sempre se si legge — e quella, in
  questo progetto, la risponde solo un occhio su un browser vero.

### Nell'ordine

1. ~~Gli sforamenti a 380~~ — **chiusi tutti e tre.** L'house effect il 21 agosto con le
   schede sotto la soglia; le quattro tabelle della nota e la data della testata — punti
   15 e 16 — il 22 agosto, con il capo riga e con `flex-wrap`. **A 380 il documento non
   scorre più in orizzontale, con la nota metodologica chiusa e aperta.** Era il
   prerequisito dell'embed: dentro `?embed=1`, in una colonna stretta, un documento che
   scorre in orizzontale peggiora invece di restare com'è.
2. **Modalità `?embed=1`** per l'inserimento in FocusAmerica (punto 1).
3. **Cercare le altre strade doppie.** Ogni valore che raggiunge lo schermo per più di un
   percorso e non ha una prova che li leghi è il prossimo colore di blocco. Vedi sopra.
4. **I 380px su un browser vero.** Nessuno li ha ancora guardati: nella sessione di oggi
   il riquadro del browser non si ridimensionava, e l'invariante 8 — nessun testo negli
   SVG sotto i 5px reali a viewport 380 — è verificata solo alla larghezza disponibile.
5. **La revisione visiva della pagina non è finita.** Restano punti che non convincono, e
   vanno guardati uno per uno in una passata dedicata, nei due temi e a schermo stretto.
   Non è un elenco di difetti noti da spuntare: è **revisione editoriale**, e si fa
   guardando, non misurando. Le prove dicono che il modello non si è rotto; non dicono che
   la pagina si veda. Da fare a mente fresca, con il file aperto davanti, senza fretta.
6. Minore, dal filtro dell'emiciclo: **il ritorno alla vista piena è annunciato con Esc**,
   che al tocco non esiste; e il pulsante «Mostra tutti i seggi» sta sotto la legenda,
   lontano dal punto in cui il dito ha appena premuto. Chi filtra da telefono ha la via
   d'uscita più scomoda delle tre, ed è l'unico che non può usare quella dichiarata.
7. Dal parser Wikipedia, dopo la riparazione del 21 agosto: **24 righe di gennaio-aprile
   hanno una cella unica che copre Ra'am, Hadash–Ta'al e Balad** — la Joint List larga di
   gennaio, una configurazione che non ha contenitore in anagrafica. Il parser le respinge
   dichiarandolo, ed è giusto così: **vanno mappate a mano**, decidendo se aggiungere il
   contenitore a `P{}` (con `dentro` su tutte e tre le componenti, Ra'am compresa) o
   lasciarle fuori. Sessanta rilevazioni circa di storia in più, se si decide di volerle.
8. Sempre dal parser: **le righe-evento arrivano in inglese** («Hadash, Ta'al and Balad
   re-form the Joint List») **in una cronologia che è in italiano.** `unisciEventi` salta
   le date già presenti, quindi oggi non entra niente di nuovo, ma il primo evento inglese
   nuovo si mescolerà alle quattordici voci italiane. Serve una traduzione manuale al
   momento dell'ingresso, o una coda di revisione prima che finiscano in cronologia.
9. **L'altezza uniforme delle righe della tabella dell'analisi non è provabile in jsdom**,
   che non fa layout: dipende dal font, e si vede solo su browser vero. Il 21 agosto la
   colonna «Seggi» è stata dimensionata sul caso peggiore misurato («20–29», 63px a corpo
   22) alle tre larghezze — 66px in base e a 660, 54px sotto i 400 dove il corpo è 18 —
   e le altezze verificate a mano a 1265, 760 e 380px. Se si tocca il corpo, la colonna o
   il font, va rimisurato con il browser, non con le prove.
10. Preesistente, visto durante quella misura: a 380px **il nome «Giudaismo Unito Torah»
    va a capo** nella colonna dei nomi da 104px e la sua riga è alta 95px contro i 78
    delle altre. È la colonna dei nomi, non quella dei seggi: servono o più larghezza a
    scapito della sparkline, o una sigla corta per l'etichetta stretta.
11. **Il simulatore manuale è stato verificato a mano il 21 agosto 2026**, perché tre cose
    sue jsdom non le misura: le altezze delle pillole (34px uniformi a 950, 760 e 380px,
    su 3 e 6 righe), il totale dentro il riempimento nei due stati e nei due temi
    (contrasti 6,35–9,07 dentro, 14,2–16,3 quando passa accanto in `--ink`), e la soglia
    «dentro/accanto» che è misurata sul testo reso più 24px — a 380px con corpo 15 non ha
    zona di collisione con l'etichetta «61 · maggioranza», controllato seggio per seggio
    fra 28 e 46. **Chi tocca corpo, altezza della barra o posizione dell'etichetta
    rimisura col browser**, nei due temi.

    Riverificato sulla pagina pubblicata il 21 agosto 2026, dopo la targhetta
    dell'etichetta della soglia, alle tre larghezze — 935, 760, 380 — nei due temi e con
    le tre scorciatoie del cambiamento, che danno 56, 61 e 68 seggi. Testo sulla targhetta
    4,79 in chiaro e 4,75 in scuro; targhetta contro il riempimento 5,81 e 7,78; totale
    dentro il riempimento 6,35 e 9,07. A 68 seggi l'etichetta cade davvero **a cavallo**
    del bordo del riempimento — 38px sopra a 935, 29,2 a 760, 11,9 a 380 — ed è il caso
    per cui nessun colore condizionato poteva bastare. Divario fra totale ed etichetta
    338,5 · 261,8 · 103px, nessuna collisione. Pulsanti 29px e pillole 34px uniformi,
    nessuno sforamento dentro `sez-7`.

    **L'alone `--wash` del tratto serve da 61 in poi, non da 68**, e non è la stessa
    soglia dell'etichetta. Il tratto sta a 50,83% e 61 seggi riempiono il 50,833%: i due
    bordi si toccano esattamente lì, quindi da 61 in su il tratto è sul riempimento — a
    61 la differenza è sotto il pixel e il verso dipende dall'arrotondamento della barra,
    misurato vero a 935 e falso per un pixel a 380. L'etichetta invece va a cavallo solo
    più in alto, perché sta 7px a destra del tratto. Chi misura l'alone lo misuri a 61,
    non a 68: è lì che il tratto nudo scenderebbe a 2,80 in chiaro e 1,83 in scuro.

    **Due trappole del banco di prova, e vanno lette insieme.** Il riquadro segue
    `prefers-color-scheme` e con «auto» misura scuro anche quando si crede di misurare
    chiaro: il tema va forzato dal selettore. E — peggio, perché non si annuncia — **con
    la pagina non composta le transizioni CSS si congelano a metà, e le geometrie lette in
    quello stato sono false.** Il riempimento `#k-gb` riportava 137,7px per
    `width:56,6667%` di una barra da 324px, e su quel numero le prime misure negavano che
    l'etichetta fosse a cavallo: negavano cioè esattamente il difetto che si stava
    chiudendo. Non è una lettura rumorosa da rifare — è stabile e sbagliata, e ripetuta dà
    lo stesso numero. Il rimedio va messo **prima** di qualunque misura di geometria:

    ```js
    document.head.insertAdjacentHTML('beforeend',
      '<style>#kn26 *{transition:none !important;animation:none !important}</style>');
    ```

### Le due colonne «Seggi»: cosa è chiuso e cosa resta aperto

`SEG` (proiezione: media pesata a 60 giorni → Bader-Ofer) e `med()` (mediana grezza dei
seggi già ripartiti, finestra 7 giorni) sono **due grandezze diverse di proposito**, e
tali restano. `PAR.listaunita` acceso per impostazione predefinita è corretto: Hadash-Ta'al
e Balad si sono fuse davvero, e le rilevazioni con le due liste separate sono dati storici
che `quoteDa()` armonizza sulle quote. **La proiezione non si tocca.**

Chiuso il 20 agosto 2026: il testo di `k-analisi` non rivendica più un primo posto quando
in `SEG` i primi sono appaiati, e `movimenti()` non emette righe per le liste che lo
scenario attivo ha sciolto. `test/suite/mediana.js` lega le due strade — è la stessa
lacuna dei token di blocco chiusa in `f2ae70e`, spostata dal colore all'anagrafica delle
liste. Prima di quel commit `movimenti` e `med` non comparivano in nessuna delle 230 prove.

Resta aperto, in ordine di scadenza:

- **Il rimedio pieno alla mediana — fondere sulle quote anche in `med()` — è ancora da
  decidere.** Oggi le liste sciolte vengono soltanto omesse, e la nota lo dichiara. La
  finestra a 7 giorni fa sì che il problema si risolva da sé quando i sondaggisti
  passeranno alla sigla unita, ma **in una data che non controlliamo**; e l'**8 settembre**,
  con le altre fusioni al deposito delle liste, il caso si moltiplica. Non improvvisare:
  sommare seggi già ripartiti è scorretto, il perché sta nel commento in `quoteDa()`.
- **La colonna mediana non risponde a nessun comando:** ignora `ESCL`, `SW`, `AFF`.
  Misurato: escludendo Direct Polls la proiezione muove Likud 23→22, Yashar 23→24, Lista
  Unita 8→7, e «L'analisi» resta immobile pur avendo due rilevazioni Direct Polls dentro
  la sua finestra di sette giorni. Il lettore che preme un pulsante vede muoversi una
  tabella sola.
- **`k-direz` e `k-analisi` si contraddicono a tre righe di distanza.** Il riquadro dice
  «Blocco Netanyahu 51 −1» (due esecuzioni del modello); la frase sotto dice «guadagna 1
  seggio», perché `db7` fa la differenza fra mediane di blocco. Il riquadro dichiara la
  distinzione, la frase no.
- **Nel punto in cui la differenza si vede — le due colonne «Seggi» affiancate — la pagina
  non spiega nulla.** Le tre note esistenti stanno altrove, e **nessuna nomina la finestra
  a 7 giorni contro quella a 60**, che è la ragione principale per cui i due numeri
  divergono.

### La Lista Unita araba è una relazione fra liste: la causa è chiusa, i consumatori no

**Chiuso il 21 agosto 2026.** La Lista Unita era modellata come una lista fra le altre, ma
è un contenitore che ne fonde due. L'archivio attraversa nel tempo due configurazioni —
ventisette rilevazioni su 165 nominano il contenitore, le altre le componenti, **nessuna
entrambi**, e le due si alternano da gennaio ad agosto. Il passo di imputazione di
`quoteDa()` leggeva quell'assenza come «non rilevata» e accreditava il tetto di 3,00 punti
alla lista mancante, in tutte e due le direzioni: **contenitore e componenti finivano nella
stessa normalizzazione a 99, gli stessi elettori contati due volte.**

Il rimedio, e sono due pezzi:

- **il campo `dentro` in `P{}`** dichiara la parentela nell'anagrafica — `hadash_taal` e
  `balad` dentro `lista_araba`, `yesh_atid` e `bennett26` dentro `byachad`. È l'unico posto
  in cui la fusione è scritta come relazione e non come caso particolare: l'8 settembre
  basta aggiungere il campo alle nuove componenti;
- **la configurazione si deduce per rilevazione**, dal dato, non da una leva globale. Una
  famiglia ha due lati — contenitore contro componenti, non membri paritari, o sparirebbe
  la seconda componente insieme al contenitore — e si risolve nel lato della rilevazione
  più recente che la nomina. Le liste dell'altro lato escono del tutto: niente quota,
  niente imputazione.

Misurato: a scenario acceso **non cambia una cifra** (quattordici quote identiche alla
terza decimale, e la serie storica identica in tutti e 82 i punti). A scenario spento il
blocco arabo passa da 10 a **11** seggi, la coalizione da 53 a **52**, i punti dispersi da
10,01 a **7,13**; la riga fantasma della Lista Unita al 62% sotto soglia sparisce. Come
conseguenza — senza toccarla — **la guardia sui colori duplicati non scatta più**: le due
liste non coesistono più in `QUO`. `test/suite/fusione.js` tiene le due proprietà.

**Restano aperti, e sono tutti la stessa cosa: consumatori che leggono l'anagrafica per id
e non sanno niente della parentela.**

- **`r22`**: il contenitore ha `r22:null` e la colonna «Rispetto al 2022» dice «nuovo»,
  mentre le componenti avevano 5 seggi e 0.
- **`CORR`** letta da `montecarlo()` e **`VETI`** letta da `coalizioni()`: fanno `continue`
  sugli id che non trovano. Oggi non si perde niente perché nessuna coppia è araba, ma una
  fusione futura le cui componenti compaiano lì perde la correlazione **in silenzio**.
- **`armonizza()`** rifà la fusione B'Yachad sui seggi con gli id cablati.
- **`sciolteDalloScenario()`** elenca `['hadash_taal','balad']` a mano invece di leggere
  `dentro`.
- **I preset** di `rChips()` elencano tutte le varianti e funzionano per fortuna.
- **L'invariante generale sulle nove funzioni consumatrici**: in ogni punto della pagina
  deve comparire o il contenitore o le componenti, mai entrambi. Oggi è provato su `QUO`;
  restano `SEG`, `MC.d`, l'emiciclo, le pastiglie, la tabella e le legende.

### Sui colori, prima di tutto il resto: la scala delle bande parte troppo in basso

**Il ΔE2000 mente in fondo alla scala.** La banda 1 sta a L\* 17, quasi nera, e a quella
chiarezza la formula sovrastima la distinguibilità reale: Otzma e Shas sono a **ΔE 12
sulla carta e a occhio sono due neri**. Non è un difetto della misura da correggere con
una soglia, è che la misura lì non descrive quello che si vede.

Misurato, e il risultato dice dove sta la leva: **alzare la banda non compra ΔE, alza L\***.

| Y della banda | ΔE minimo | L\* |
|---|---|---|
| 0,021–0,025 *(oggi)* | 10,1–11,2 | 17 |
| 0,038–0,045 | 11,3–11,4 | 24 |
| 0,055–0,065 | 11,8 | 29 |

Il ΔE si muove di poco più di un punto e mezzo su tutto l'intervallo; L\* passa da 17 a 29.
È L\* che si vede.

**Da valutare: una scala con L0 ≈ 0,04**, che dà bande a **0,040 · 0,103 · 0,185 · 0,293**.
Mantiene i salti fra bande adiacenti ≥ 1,309 e resta sotto il tetto di 0,30 imposto dal
3:1 su `--card`. Le due bande alte superano 0,183, quindi lì il testo sopra il colore
pieno deve passare a `--on-color` scuro invece del bianco — **il token c'è già**, è stato
aggiunto con la tavolozza del 20 agosto.

**È un rifacimento dell'intera scala, non un ritocco.** Tutti e venti i colori cambiano.
Vanno rimisurati con `node test/misura-consegna.mjs`, e `regola.js` deve tornare a legare
tutte e cinque le copie: la regola, `P{}`, `BL{}`, `PAL_SCURO` e i quattro token CSS.
Vale qui la riga generale scritta sopra — sono cinque strade per lo stesso valore, e una
sola prova le tiene insieme.

### La leva rimasta sui verdi arabi

Viene **dopo** il rifacimento della scala, non prima: se le bande si alzano, tutti e venti
i colori si spostano e questa leva va rivalutata su quelli nuovi.

Se dopo lo scambio di banda i verdi restano vicini all'occhio, c'è ancora spazio: il
settore verde è largo **57°**, e fra la coalizione e l'ago della bilancia resta un arco di
**57°** inutilizzato. Allargare il verde lì dentro è la mossa successiva, e non tocca
nessuno degli altri settori.

### I difetti noti che restano

- **Tre sparkline di `k-proj` a opacità 0,55** sotto 3:1. Di codice, non di tavolozza: a
  quell'opacità nessuna tinta arriva a 3. La leva è l'opacità.
- **Il conto dei giorni al voto tronca le ore** invece di contare i giorni di calendario
  (punto 12).
- **Sei suite usano un DOM ridotto** — `aff`, `emi`, `final`, `tema`, `testint`,
  `verifica` — e non possono provare niente che tocchi elementi resi (punto 13 vecchio).

### La cosa più importante

**La verifica visiva non è automatizzabile, e non è un dettaglio.** Tutti i difetti veri
trovati oggi — la stella della bandiera che sconfinava nelle bande, l'occhiello a filo del
bordo sull'ombra, il vuoto di 372px sotto le ipotesi, l'evidenziazione che competeva con
la codifica del riempimento, il verde arabo che si leggeva nero — sono stati trovati
**guardando la pagina**, non dalla suite. Le 611 prove dicono che il modello non si è
rotto; non dicono che la pagina si veda. Dopo ogni push, aprire
<https://angrisanidj.github.io/modello-israele/> e guardarla nei due temi.

---

## Revisione visiva finale: la lista di controllo

Scritta il 22 agosto 2026 per una passata sola, sezione per sezione. Serve a distinguere
**quello che qualcuno ha già guardato reso** da **quello che nessuno ha mai visto**: in due
giorni sono entrate parecchie cose che le prove dichiarano sane e che nessun occhio ha
ancora confermato. Le 611 prove dicono che il modello non si è rotto; non dicono che la
pagina si veda.

Si guarda su <https://angrisanidj.github.io/modello-israele/>, **nei due temi forzati dal
selettore** — con «auto» si misura quello che il sistema decide, non quello che si crede —
e alle tre larghezze di riferimento: **1265**, **760**, **380**.

E prima di misurare qualunque geometria, spegnere le transizioni, o si leggono valori
congelati a metà che sono stabili e falsi:

```js
document.head.insertAdjacentHTML('beforeend',
  '<style>#kn26 *{transition:none !important;animation:none !important}</style>');
```

### Mai visto reso da nessuno — la priorità

| # | Cosa | Dove | Larghezza | Che cosa cercare |
|---|---|---|---|---|
| 1 | **I colori delle venti liste** | emiciclo, legende, pastiglie, tabella per lista | 1265 e 380 | Le liste dello stesso blocco si distinguono a occhio? Il ΔE minimo è **7,88** ed è una misura, non una promessa: la banda 1 sta a L\* 17 e lì la formula sovrastima. **Otzma e Shas** sono il caso peggiore — a 12 di ΔE sulla carta, e forse due neri. Guardare anche il **verde arabo**, che nella banda scura si leggeva nero prima dello scambio |
| 2 | **L'anello di evidenziazione degli istogrammi** | «Quanti seggi per ciascun blocco» | 1265 e 380 | La barra evidenziata si stacca senza competere con la codifica del riempimento. È la costruzione a due tinte: alone `--card` sotto, tratto `--ink` sopra |
| 3 | **L'house effect a schede** | sezione House effect | **380 e 760** (sotto la soglia di 1075) | Le schede: una per istituto, gli scarti da 0,8 in su. Il pulsante escludi/reinserisci accanto al nome. Provare a **escludere un istituto** e guardare la scheda tratteggiata. E a **1265** la tabella, per confronto |
| 4 | **Il simulatore ridisegnato** | «Costruisci una maggioranza» | tutte e tre | Pillole, barra, targhetta del 61. Provare le **tre scorciatoie del cambiamento** — 56, 61 e 68 seggi — e guardare l'etichetta a 68, dove cade a cavallo del bordo del riempimento |
| 5 | **«Chi serve per governare»** | sezione del potere di coalizione | 1265 e 380 | Non è mai stata guardata resa da nessuno |
| 6 | **I marcatori degli eventi** | «Come si è mossa la proiezione» | tutte e tre | Appena spostati dentro l'SVG: il disco deve sembrare **attaccato** alla sua verticale (3,57px a 1265, 1,88 a 380) e le due corsie devono leggersi come un insieme sfalsato, non come due serie |
| 7 | **Il riquadro dell'evento isolato** | idem | **380** e 1265 | A 380 sta dentro l'elenco, sotto la voce premuta. Guardare i tre numeri della terna — erano tre macchie scure — e il pulsante «Torna alla vista piena» in fondo |
| 8 | **Il tratto acceso** | idem | 1265 e 380 | Premere un evento a metà cronologia. Le tre linee attenuate a 0,26 **restano tre**? A 380 sono spesse 1,5px: è l'unica cosa di questo giro su cui la misura non può decidere |

### Già guardato reso, ma non dopo le ultime modifiche

| Cosa | Quando | Perché rifarci un giro |
|---|---|---|
| La targhetta dell'etichetta del 61 | 21 agosto | verificata prima che il simulatore cambiasse di nuovo |
| Le schede dell'house effect | 21 agosto, alle tre larghezze | confermate; qui basta un'occhiata |
| L'apertura da doppio clic (seme BASE) | 21 agosto | invariata, ma è la sola prova che il file sta in piedi da solo |
| La linea della maggioranza nell'emiciclo | 21 agosto | chiusa con l'alone a due tinte |

### Le due domande in sospeso: misurate, e una è un difetto

**Il puntatore sui bersagli trasparenti dei marcatori: sì, cambia forma.** Misurato sulla
pagina pubblicata: `cursor: pointer`, bersaglio 30×30px, focalizzabile da tastiera. Non
c'è niente da riparare.

**L'etichetta accessibile: era un difetto — chiuso il 22 agosto 2026.** Il nome
accessibile del bersaglio era **«6»**, il solo numero: data e fatto stavano in `title`
(«26.04 · Bennett e Lapid fondono le liste in B'Yachad»), che è una *descrizione* —
qualche tecnologia assistiva la annuncia, altre no. Un lettore di schermo sentiva
**«6, pulsante»** e non sapeva di che evento si trattasse.

Ora il bersaglio porta `aria-label` con lo stesso testo del `title`, e il numero dentro
il bottone — che resta, perché è la sola cosa che il bottone contiene — è avvolto in uno
`<span aria-hidden="true">`: senza, il nome sarebbe diventato la somma dei due.

**E la stessa stringa nasce una volta sola.** Data e fatto raggiungevano lo schermo per
tre strade — il `<title>` del disco nell'SVG, il `title` del bersaglio, ora anche il suo
`aria-label` — cioè tre copie dello stesso testo. È la lacuna dei token di blocco
spostata dal colore all'etichetta: adesso c'è una variabile sola, `ETI`, e sei prove in
`test/suite/isola.js` legano le tre strade. Mutate: togliendo l'`aria-label` ne cadono
cinque, togliendo l'`aria-hidden` una, facendo divergere `aria-label` dal `title`
quattro.

**Resta aperta la domanda sui dischi dentro l'SVG sotto i 900**, dove il `<title>` è
l'unica cosa che li descrive e il comando è la voce di cronologia: lì probabilmente va
bene così, ma non l'ha guardato nessuno.

### Come annotare quello che si trova

Un difetto visivo trovato qui vale più di dieci prove verdi, e il modo di scriverlo conta:
**la misura sbagliata è quasi sempre quella che non è stata presa** (vedi «misurare
convince di aver guardato»). Quando qualcosa non convince, annotare *che cosa* si vede, a
quale larghezza e in quale tema, prima di ipotizzare perché.
