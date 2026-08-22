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
npm test             # estrae il JS e lancia le 814 prove
npm run verifica     # prove + controlli strutturali
```

`npm test` rigenera `test/app.js` da `index.html`. Non modificare `test/app.js` a mano: è un
prodotto, viene sovrascritto.

**Nessuna modifica a `index.html` è finita finché `npm run verifica` non passa per intero.**

## Il banco di misura su browser vero

Le prove girano in jsdom, che **non fa layout**: larghezze, altezze, contrasti resi e
sovrapposizioni non le vede nessuna delle 814. Per quelle c'è un server statico da otto
righe, `.claude/serve.mjs`, dichiarato in `.claude/launch.json` come configurazione
`misure`. **È sotto controllo di versione apposta: chi apre il progetto domani lo trova
invece di rimontarlo.** Non è una dipendenza del modello — `index.html` resta un file
autonomo che si apre con un doppio clic — è un attrezzo del banco.

```bash
node .claude/serve.mjs      # http://localhost:8788, serve la cartella così com'è
```

Serve la radice, quindi `dati/archivio.json` si carica con il fetch relativo e si misura
**la pagina vera**, non il seme BASE. Con questo sono state prese le misure che la suite
non può prendere: la larghezza minima della tabella dell'house effect (941,8px, poi 939,3
col comando nuovo), l'altezza delle schede a 380 (1225,4 → 1317,9), il diametro reso del
seggio dell'emiciclo (15,07px a 1265 e 8,19 a 380).

**Tre trappole del banco, e la terza è la più cattiva.**

1. **Il riquadro segue `prefers-color-scheme`.** Con il tema su «auto» si misura quello
   che decide il sistema, non quello che si crede di misurare: capita di credere di essere
   in chiaro e leggere i numeri dello scuro. Il tema va **forzato dal selettore** —
   `document.getElementById('kn26').className = 'chiaro'` — prima di ogni misura, e
   riletto da `getComputedStyle(...).getPropertyValue('--card')` per conferma.
2. **Con la pagina non composta le transizioni CSS si congelano a metà**, e le geometrie
   lette in quello stato sono **stabili e false**: ripetere la lettura dà lo stesso numero
   sbagliato. È così che le prime misure sul simulatore negavano esattamente il difetto
   che si stava chiudendo. Il rimedio va messo **prima** di qualunque misura di geometria:
   ```js
   document.head.insertAdjacentHTML('beforeend',
     '<style>#kn26 *{transition:none !important;animation:none !important}</style>');
   ```
3. **Un clone misurato fuori da `#kn26` non eredita niente.** Tutte le regole del foglio
   sono `#kn26 …`, quindi corpo, `font-size`, `padding` e `white-space:nowrap` non si
   applicano. Misurato: la larghezza minima della tabella dava **701,7px** col clone
   appeso al `body` e **941,8** appeso a `#kn26`. Il clone va dentro `#kn26`, e la
   conferma che la misura è buona è che riproduca un numero già noto.

E una del DOM, non del banco: **`$('k-house').innerHTML` viene riscritto per intero a ogni
`render()`**, quindi un riferimento preso prima di un `click()` è morto subito dopo. Due
misure di fila sullo stesso elemento vanno rifatte con una query nuova, o la seconda non
tocca la pagina e lo stato resta acceso senza che nessuno se ne accorga.

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
9. **L'opacità non è un canale.** Può ridurre l'enfasi, ma non può essere l'unico portatore
   di una distinzione, e non si applica a testo che in quello stato va letto. Ogni
   `opacity` sotto 1 che raggiunge del testo deve comparire nell'inventario di
   `test/suite/opacita.js` con una ragione scritta: la prova risolve quali elementi
   ciascuna regola raggiunge davvero, e cade se ne compare una non dichiarata — anche
   scritta domani. Il numero che regge l'invariante: perché `--mute` arrivi a 4,5 servirebbe
   **α ≥ 0,93**, e a 0,93 l'attenuazione non si vede più. Vedi il punto 17.
10. **Niente tempo scritto a mano.** Nessun valore, scadenza o formula temporale sta nel
    testo come costante quando può essere ricavato **dai dati o dalla data corrente**:
    né il conto dei giorni, né «mancano due mesi», né «l'8 settembre si depositano le
    liste» al presente quando l'8 settembre è passato, né «tre volte l'errore dell'ultima
    settimana» quando quel rapporto è calcolabile dal banco di prova.
    La ragione è che questa pagina **resta pubblicata dopo il 27 ottobre 2026**, e ogni
    costante temporale scritta a mano diventa falsa in una data che nessuno ha segnato in
    calendario. Un numero sbagliato si nota; una frase al presente che parla di un futuro
    già passato no — continua a leggersi bene, e mente.
    Vale per il titolo, per il sommario, per la nota metodologica e per il calendario.
    Se una grandezza non è ricavabile, va scritta **una volta sola** in una costante con
    accanto la data in cui è stata misurata, e non ripetuta nella prosa.

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
- **Riscrivere a mano una regola di lingua invece di chiamarla.** L'accordo singolare
  o plurale era scritto tre volte — `seg()`, il margine della coalizione, il calendario —
  e **la terza copia sbagliava**: «1 giorni». Si vedeva un giorno per tappa, sei giorni in
  tutta la campagna, e uno dei sei è la vigilia del voto. Ora c'è `acc(n, singolare,
  plurale)` e le tre strade passano di lì. È la regola generale del progetto applicata
  alla lingua: tre copie corrette oggi divergono domani, e divergono in silenzio.
- **Misurare un clone fuori da `#kn26`.** Per leggere la larghezza *minima* di una tabella
  si clona e si mette in un contenitore da 1px. Ma se il clone finisce in `document.body`
  non eredita niente: tutte le regole del foglio sono `#kn26 …`, quindi corpo, `font-size`,
  `padding` e `white-space:nowrap` non si applicano. Misurato il 22 agosto 2026: il clone
  fuori dava **701,7px**, dentro `#kn26` dà **941,8** — cioè esattamente il numero
  registrato qui. Il clone va appeso a `#kn26`, non al `body`, e la conferma che la misura
  è buona è che riproduca un numero già noto.
- **Agganciare una regola a un residuo di stile invece che allo stato.** Il pulsante
  dell'istituto escluso era colorato da `#kn26 tr[style] .mini`, cioè dalla PRESENZA
  dell'attributo di stile in linea — che conteneva l'`opacity:.42`. Togliendo l'opacità,
  la regola ha smesso di raggiungere qualunque cosa e il pulsante è tornato grigio: una
  riparazione che ne rompeva un'altra **in silenzio**. E nessuna prova se ne accorgeva,
  perché per impostazione predefinita **non c'è nessun istituto escluso** e lo stato non
  esiste nel DOM finché qualcuno non preme. Due lezioni: un selettore dichiara lo stato con
  una classe, mai deducendolo da un effetto collaterale; e **una prova su uno stato
  interattivo deve accendere quello stato**, o passa a vuoto e sembra verde.

## Struttura

```
index.html            il modello, pubblicato così com'è come GitHub Pages
.claude/
  serve.mjs           server statico per le misure su browser: node .claude/serve.mjs
  launch.json         la configurazione «misure», porta 8788
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
  richiesta-design-consegna-5.md  i vincoli in ORDINE, non in parallelo: vedi in fondo
  richiesta-design-consegna-6.md  i tre punti dopo la verifica della consegna 5
  accettazione-consegna-6.md      che cosa si accetta, e le quattro righe rimaste
  forme-del-titolo.md             le nove celle dell h1 con le frequenze: si scrivono i testi da lì
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

1. **Modalità `?embed=1`.** Non è per FocusAmerica: è pubblica, e chiunque deve poterla
   incorporare su un sito che non controlliamo — larghezza, tema, CMS, dominio.

   **L'incorporabilità tecnica è verificata, il 22 agosto 2026, e non per deduzione.** Un
   server locale su `http://localhost:8787` — un'origine vera e diversa, non `file:` né
   `data:`, che hanno origine opaca e non direbbero niente — ha inquadrato
   `angrisanidj.github.io` in tre modi: iframe semplice, `sandbox="allow-scripts"` e
   `sandbox="allow-scripts allow-same-origin"`. **Tutti e tre caricano, nessuno produce un
   errore in console.** Le intestazioni lo confermano: **nessun `X-Frame-Options`, nessun
   `Content-Security-Policy`**, e `access-control-allow-origin: *`.

   **Con un controllo che sa fallire**, che è la parte che rende la prova una prova: nella
   stessa pagina un quarto iframe verso `https://github.com/` produce
   «*Framing 'https://github.com/' violates … frame-ancestors 'none'*». Il canale di
   rilevazione funziona, e i nostri tre non lo accendono.

   E `dati/archivio.json` risponde **200 con 172 voci in 4ms a una richiesta cross-origin
   da un'origine terza**: anche l'iframe con la sola `allow-scripts`, che ha origine
   opaca, riesce a caricare l'archivio. Da mettere in conto: `cache-control: max-age=600`,
   cioè un embed può mostrare una copia vecchia fino a dieci minuti.

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
7. **Esportazione PNG dei grafici — VIENE DOPO LA REVISIONE VISIVA, non prima.** Deciso il
   22 agosto 2026. Non cambia come si legge la pagina: aggiunge quattro pulsanti e produce
   file. La revisione, invece, può dare da riparare cose che cambiano l'aspetto dei
   grafici — e l'esportazione disegna una targa attorno a quei grafici, con i loro colori e
   la loro geometria. Scriverla prima significherebbe scriverla due volte.

   Il vincolo annotato il 21 agosto — i marcatori
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
8-bis. **I risultati veri del 27 ottobre non entrano da nessuna parte, e senza di loro il
   titolo generato dopo il voto può parlare solo dell'ultima proiezione, al passato.**
   Serve un campo in `dati/archivio.json` — un oggetto `esito` accanto alle rilevazioni,
   con i seggi per lista come li certifica la commissione elettorale il 4 novembre, e la
   data di quella certificazione. Da lì discendono tre cose che oggi non si possono dire:
   il confronto fra proiezione e risultato, l'ottava istantanea del banco di prova — che
   entrerebbe in `BT[]` e sposterebbe il rapporto di 2,7 — e le quattro varianti del
   titolo che raccontano com'è andata invece di come la si vedeva. Finché quel campo non
   c'è, dopo il voto la pagina resta onesta solo se parla al passato della propria stima.
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
12. ~~Il conto dei giorni al voto tronca le ore~~ — **chiuso il 22 agosto 2026**, insieme
    alle sei tappe del calendario, che condividevano `gg()` e quindi il difetto.

    Il rimedio è in due funzioni nuove accanto a `gg()`, che resta invariata:
    `giornoUTC(d)` prende i componenti **locali** di un istante — l'oggi del lettore è
    quello del suo calendario, non quello di Greenwich — e li rimonta a mezzanotte **UTC**,
    dove l'ora legale non esiste; `ggCal(a,b)` sottrae lì, e la differenza è un multiplo
    esatto di 86.400.000. Due sole chiamate: il conto alla rovescia e le sei tappe.

    **`gg()` non è stata toccata, ed è giusto così**: fra due date dell'archivio, che
    nascono tutte da `new Date('AAAA-MM-GG')` cioè da mezzanotte UTC, la differenza è già
    esatta e l'arrotondamento non fa niente. `test/suite/giorni.js` lo dichiara e lo
    prova, così nessuno «ripara» anche quelle.

    **Il banco di prova impone `TZ=Europe/Rome` prima di qualunque `Date`**, e non è un
    dettaglio: con `TZ=UTC` — che è quello che la CI userebbe — il difetto **non si
    manifesta affatto**, e una suite che girasse solo lì direbbe che va tutto bene. Le
    trentasei prove stanno a cavallo del **25 ottobre**, dove il fuso passa da UTC+2 a
    UTC+1: verificato che ci passi davvero, o metà delle prove non misurerebbe niente.

    Mutata in tre modi, e il terzo è quello che valeva la pena scrivere:
    rimettendo `gg()` nel conto alla rovescia cadono 2 prove; rimettendolo nel calendario
    ne cadono 6, fra cui «la mattina dice 1 giorno e la sera dice oggi»; e facendo usare a
    `giornoUTC()` i getter **UTC** invece di quelli locali — l'errore più facile da
    commettere riscrivendola — ne cadono 6, fra cui tutti i casi di ottobre.

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
    | `gg(new Date(), VOTO)` — il conto alla rovescia | istante locale contro mezzanotte **locale** | **riparato**: usa `ggCal` |
    | `gg(oggi, new Date(x.d+'T00:00:00'))` — le tappe del calendario | idem, per ognuna delle sei | **riparato**: usa `ggCal` |
    | la finestra a 7 giorni della mediana | `getTime()-7*864e5` su una data letta come UTC e riformattata con `toISOString` | **sano**: non tocca mai l'ora locale |
    | le altre sei chiamate di `gg()` — finestre a 60 e 7 giorni, peso per recenza, filtro dell'archivio, grappolo di istituto | due date dell'archivio, tutte mezzanotte UTC | **sane**: la differenza è già esatta, e vanno lasciate stare |

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
17. ~~Le righe degli istituti esclusi stanno a `opacity:.42`~~ — **chiuso il 22 agosto
    2026, e la frase che diceva «la leva è l'opacità» era sbagliata.**

    **La leva non è l'opacità: è non usarla sul testo.** Ecco il numero che lo dimostra.
    L'alfa minima perché ciascun token arrivi a 4,5 sul proprio fondo:

    | token | chiaro | scuro |
    |---|---|---|
    | `--ink` | 0,59 | 0,49 |
    | `--ink2` | 0,72 | 0,68 |
    | `--acc` | 0,70 | 0,83 |
    | `--neg` | 0,82 | 0,68 |
    | **`--mute`** | **0,93** | **0,92** |

    Una riga attenuata contiene tutti questi token insieme, quindi comanda il peggiore:
    **`--mute` vuole α ≥ 0,93, e a 0,93 l'attenuazione non si vede più.** Non esiste
    un'alfa che attenui e lasci leggere — «alzare l'opacità» non è una riparazione, è una
    contraddizione.

    **E non era un difetto, erano sette.** Cercate tutte le opacità della pagina e
    misurate sul contrasto vero, sulla pagina pubblicata, nei due temi. Nessuno l'aveva
    mai fatto:

    | dove | α | testo peggiore | scuro | chiaro |
    |---|---|---|---|---|
    | riga dell'istituto escluso, `#k-house` | .42 | «Canale 14», `--mute` | **1,92** | **1,79** |
    | numero dell'indice, `.idx a i` | .55 | il numero, `--mute` | 2,45 | **1,81** |
    | coalizione bloccata, `.co.ko` | .5 | «seggi», `--mute` | 2,08 | **1,97** |
    | rilevazione pre-fusione, `#k-tab` | .62 | una cifra, `--mute` | 2,47 | 2,37 |
    | veto disattivato, `.veto.off` | .38 | il nome della coppia, `--ink` | 3,21 | **2,42** |
    | voce spenta della legenda, `.leg.lint b.spenta` | .35 | il nome della serie | — | — |
    | tappa passata del calendario, `.cal>div.past` | .42 | la descrizione | — | — |

    **La distinzione che decide la riparazione è che cosa DICE l'opacità.** Dove dice uno
    **stato** (tutte queste), è binaria e c'è già un altro canale che lo dice: si toglie
    l'opacità e parla quello. Dove è una **codifica** — la sparkline, il filtro
    dell'emiciclo — toglierla perde informazione, e serve un canale sostitutivo.

    **Cinque riparate**, ciascuna col canale che aveva già:

    | dove | il canale che parla adesso |
    |---|---|
    | istituto escluso | il **barrato sul nome** (la grammatica dei veti) più il pulsante `--neg`. Il barrato sta sul nome e **lascia intatti i numeri**, che sono quelli su cui si decide se reinserirlo |
    | veto disattivato | il `line-through` che c'era già, più `aria-pressed` |
    | coalizione bloccata | l'intestazione dice **«Bloccata»**, la riga in fondo dice quale veto, il fondo è `--wash` |
    | rilevazione pre-fusione | la **riga di separazione** che dichiara l'era e che sono escluse dal modello |
    | tappa passata | al posto del conto alla rovescia c'è la parola **«passato»** |

    **Le due che erano rimaste in sospeso sono chiuse anche loro**, e in tutti e due i
    casi la misura ha scartato il candidato più ovvio:

    - **`.idx a i`, il numero della sezione.** Il candidato era `font-weight:400` contro
      il 700 della pastiglia. **Misurato: non regge.** Su una cifra a 11px la differenza
      resa fra 700 e 400 è **0,38px su 6,47, il 5,9%** — non è una distinzione, è rumore.
      Ma la domanda giusta era un'altra: **il numero non ha bisogno di essere attenuato.**
      Non è subordinato all'etichetta, ne fa parte, e a separarlo bastano la posizione e i
      5px di margine che c'erano già. Tolta l'opacità sta a 4,93 in chiaro e 5,54 in scuro.
    - **`.leg.lint b.spenta`, la voce spenta della legenda.** Pastiglia vuota col solo
      bordo, che è la grammatica giusta — la legenda dichiara un **colore**, e il barrato
      avrebbe detto un'esclusione. Il bordo regge: **4,30** il minimo sulle tre serie, nei
      due temi e su tutti e due i fondi possibili. Ma da sola è un segnale **più debole**
      dell'opacità: su 9×9px un bordo da 2 toglie il **31%** dell'inchiostro dove l'alfa
      .35 ne toglieva il **65%**. Per questo si accompagna al nome in `--mute`, che è un
      colore e non un'alfa (5,24 e 5,10). Il valore resta in `--ink`: è un numero.
      **Scartato dopo averlo misurato**: marcare invece la voce *accesa* col fondo
      `--wash`. `--wash` contro `--card` sta a **1,09** in chiaro e **1,07** in scuro —
      la marcatura non si vedrebbe. Va bene come risposta al puntatore, che è transitoria e
      ha il dito sopra; non va bene come stato.

    Il colore della serie arriva alla pastiglia come proprietà `--c`, così la regola dello
    spento può svuotarla senza conoscerlo, e con `box-shadow:inset` invece di `border`,
    o il riquadro crescerebbe di 4px.

    **L'inventario di `test/suite/opacita.js` è tornato a zero voci pendenti**, e il
    numero è scritto nella prova: chi ne aggiunge una deve alzarlo.

    **Due sono esenti, con la ragione scritta**: `.btn:disabled`, perché WCAG 1.4.3
    esenta il testo dei comandi inattivi; e `#k-emi.filtra text[data-g]`, dove l'opacità
    È il filtro e in quello stato quelle etichette non vanno lette.

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

### La direzione: una scala divergente sul fondo, e perché oro e viola

Applicata il 22 agosto 2026. **Non ancora guardata resa da nessuno**: è la prima voce
della revisione visiva.

Il segno da solo si legge, ma su 88 celle scandirlo è faticoso. Il primo tentativo — un
**trattino di lunghezza fissa** spostato a sinistra o a destra del centro della cella —
è stato scritto, guardato e **buttato**, e il modo in cui falliva vale più della regola
che l'ha sostituito: lungo 6px, alto 2, stava **sotto** il numero, e i valori sotto 0,1
scrivono `—` **dentro** la cella. Due segni orizzontali della stessa famiglia a tredici
pixel di distanza. Le prove erano tutte verdi, ed erano verdi a ragione: verificavano che
il trattino fosse speculare, fuori flusso, della stessa larghezza dalle due parti.
Nessuna guardava se si distinguesse da quello che c'era già. È ancora **«misurare
convince di aver guardato»**.

**Una coppia di tinte contrapposte non era la risposta, e la ragione dell'ultima volta
resta vera**: due tinte opposte dicono **due categorie**, mentre qui c'è una grandezza
continua che attraversa lo zero, e +0,3 e −0,3 devono somigliarsi. Ma una **divergente
non è due categorie**: è un continuo che passa per un **neutro**, e i valori vicini allo
zero finiscono entrambi accanto al neutro, cioè adiacenti. È l'obiezione risolta, non
ignorata. Il neutro è il fondo della cella — `--card` — così le celle che non contano
sembrano non toccate: sono **42 su 88**.

#### L'azzurro è occupato due volte, e da qui vengono l'oro e il viola

Non «nella tavolozza non restano tinte libere», che è una conseguenza. **Le superfici
neutre della pagina sono già il blu della coalizione**: `--wash` chiaro sta a H
**261,8°**, `--card` scuro a **263,4°** con croma 0,034, `--coal` a **262,2°**,
`--acc` a **262,9°**. Un gradino azzurro in chiaro verrebbe `#E5EDFD`, che dista
**ΔE 3,91 da `--wash`** — cioè **meno** di quanto `--wash` disti da `--card` (4,08).
Non sarebbe un colore: sarebbe la superficie secondaria della pagina.

Tolto l'azzurro, **il cerchio è pieno**: `--oppo` 186°, `--pos` 155°, `--arab` 119°,
`--inc` 49°, `--neg` 25°. **Non esiste nessun diametro libero** — ogni coppia di tinte
opposte ha almeno un capo addosso a un significato. Restano due archi larghi: 262°→385°
(123° di viola-magenta) e 50°→119° (69° di oro). Da lì le estremità: **oro 85°**
l'eccesso, **viola 303°** il difetto. Caldo/freddo è l'unica convenzione che non porta
dentro un giudizio, ed è la PuOr di ColorBrewer ruotata via dal blu.

Provato anche **318°**, che sulla ruota ha margini più bilanciati, e **scartato su
misura**: lì la tritanopia scende da ΔE 5,48 a 3,23 e deuteranopia/protanopia da 93-96%
a 86-92%.

#### I quattro gradini

Costruzione: **pari L e pari ΔE2000 dal grigio di quella L** (bersagli 7 e 15), così i
due lati hanno la stessa chiarezza e la stessa colorosità.

| gradino | chiaro | `--ink` | scuro | `--ink` |
|---|---|---|---|---|
| **−** ≥1,5 | `#DED1F4` | 12,34 | `#443955` | **9,11** |
| **−** 0,8–1,5 | `#EFEAF7` | 15,09 | `#2D2932` | 12,12 |
| neutro <0,8 | `--card` | 17,82 | `--card` | 15,25 |
| **+** 0,8–1,5 | `#F4ECDD` | 15,18 | `#302A1F` | 12,11 |
| **+** ≥1,5 | `#EAD6AD` | 12,49 | `#4C3D1C` | **8,98** |

Il minimo è **8,98** contro un pavimento di 4,5. Costo: **zero** in larghezza e **zero**
in verticale — un fondo non occupa spazio, e i 13px di `padding-bottom` del trattino
tornano indietro, 28,8px in tutto. **La soglia dei 1075 non si muove di un pixel.**

#### Tre cose misurate, dichiarate perché non si scoprano dopo

1. **La scala grigia collassa, e collassa del tutto.** In bianco e nero la direzione
   sparisce: ΔE **0,14** e **0,31** in chiaro, **0,03** e **0,32** in scuro — `#F4ECDD`
   e `#EFEAF7` diventano lo stesso grigio. È accettabile perché il **segno resta scritto
   nella cella**, e perché quel che sopravvive è corretto: la **magnitudine resta intera**
   (ΔE 3,74 e 4,60 in chiaro, 6,17 e 6,53 in scuro). La divergente diventa una
   **sequenziale**, non un pasticcio.
2. **La dicromazia regge dove pesa.** Deuteranopia e protanopia conservano il **93-96%**
   della distanza fra i due versi (ΔE 12,1-12,8 al gradino 1, 28,3-29,4 al gradino 2). La
   tritanopia la taglia al 36-40% — è la sua linea di confusione — ma resta ΔE 5,1 e
   10,9, sopra 3. E «la cella è toccata?» regge anche lì: il peggiore è −1 in scuro per un
   protanope, **ΔE 7,25** dal neutro.
3. **I canali.** Il fondo dice direzione e peso; la cifra dice il valore; il segno dice la
   direzione ed è l'unico che regge il grigio. **Via l'attenuazione `--mute` sotto 0,8**:
   diceva «questa non conta» nella *stessa modalità* in cui adesso lo dice il neutro, ed
   era il duplicato vero — toglierla porta 42 celle da **5,24 a 17,82** in chiaro. **Il
   grassetto da 1,5 resta**: è tipografico e non cromatico, quindi non è una quarta copia
   dello stesso canale; sopravvive al grigio e alla **stampa**, dove i browser scartano i
   `background-color`; e soprattutto **le schede lo usano già** — è l'unico canale di
   magnitudine che le due forme condividono.

E **nessuna soglia nuova**: `grad()` chiama `forte()` e `grosso()`, le stesse due che
decidono l'ingresso nella scheda e il grassetto. Da qui il grassetto può stare sulle
classi `.p2`/`.m2` nel foglio invece che in linea, e la cella perde **tutto** lo stile
in linea: una classe sola.

#### Le schede prendono la scala, e la pastiglia neutra le dà il centro

La prima risposta era «le schede restano invariate», ed era **mezza sbagliata**. Vale la
pena tenere tutte e due le metà, perché la metà sbagliata è la solita: un fatto
verificabile che nessuno aveva verificato.

**La metà giusta.** Dentro una scheda entrano **solo** gli scarti da 0,8 in su — è il
filtro che la definisce. Quindi le voci neutre lì sarebbero **zero**: 46 su 46 colorate, e
una divergente senza centro non è più una divergente, sono due tinte contrapposte su due
categorie. Cioè esattamente la cosa scartata.

**La metà sbagliata.** Era scritto che il fondo della scheda è `--wash`, quindi servirebbe
una seconda serie di tinte. **La scheda sta su `--wash`, ma la pastiglia del valore sta su
`--card`** — `getComputedStyle` sulla pagina resa dice `rgb(15,23,39)`, cioè `--card`. Le
due forme usano le stesse quattro tinte e lo stesso neutro: **una strada sola, non due.**

**Il rimedio è la pastiglia neutra in coda**: «altre 4 · sotto 0,8». In coda perché
l'elenco è ordinato per grandezza decrescente e lo zero ne è la continuazione naturale.

Costo misurato su browser a 380px, con le tre vie a confronto:

| via | `.hsch` | costo | che ne è del filtro |
|---|---|---|---|
| prima | 1225,4px | — | è il filtro |
| soglia via, tutte le voci | 1780,1px | **+45%** | sparisce: la scheda diventa la tabella impilata |
| soglia a 0,1 | 1749,3px | +43% | quasi identico: solo **2 celle su 88** stanno sotto 0,1 |
| **pastiglia neutra** | **1317,9px** | **+7,5%** | intatto |

E la pastiglia dice due cose che la scheda non diceva: **quante liste quell'istituto
tratta come tutti gli altri** — la sua taratura, da 2 a 8 su 11 — e che il filtro esiste.
Prima, una scheda con tre voci non diceva se le altre otto fossero omesse o inesistenti.

**Il bordo della pastiglia del gradino 1 è il gradino 2 del suo stesso lato**, ed è la
stessa trappola del filetto: `--hair` sopra un gradino 1 sta a 1,06 e 1,05 in chiaro e a
**1,00 e 1,00** in scuro. E lì il bordo serve davvero, perché il riempimento non delimita —
una pastiglia `p1` sul fondo `--wash` della scheda sta a **1,07**, cioè quanto la neutra
(1,09). Col gradino 2 il bordo risale a **1,22** in chiaro e **1,33–1,35** in scuro, sopra
l'1,24/1,26 che ha sulla pastiglia neutra, e dice la stessa cosa del riempimento invece di
una cosa in più. Sui gradini 2 resta `--hair`: lì delimita il riempimento (1,30 e 1,32 in
chiaro, 1,56 e 1,58 in scuro).

**Una misura che ha smentito l'ipotesi**, e va tenuta perché eviterebbe di rifarla: si
pensava che l'ordinamento per grandezza spezzasse le fasce di colore. Falso — corse di
segno concorde **3,38 in tabella contro 3,13 in scheda**: la scheda ne ha *meno*, perché
gli scarti grandi tendono a condividere il segno. Quel che la scheda non ha è il
**raggruppamento per blocco**, che in tabella vale l'**85% di concordanza media** ed è ciò
che fa leggere una riga come una fascia. Per questo le schede non portano i filetti: lì i
blocchi non sono raggruppati, quindi non c'è confine da segnare.

#### Il comando dice l'azione, e «Includi» è una misura

Il pulsante diceva «incluso», cioè lo **stato** — già detto dal barrato sul nome e dal
pulsante in `--neg` — e non diceva a nessuno che cosa sarebbe successo premendolo. E otto
pulsanti con lo stesso nome accessibile sono indistinguibili in un elenco di comandi: è la
lezione dei quattro «Scarica PNG» e dei bersagli dei marcatori.

**«Includi» e non «Reinserisci», e la ragione è un numero.** La tabella ha 941,8px di
minimo contro un contenitore che alla soglia dei 1075 vale 948: 6,2px di margine.

| testo | larghezza minima | effetto sulla soglia |
|---|---|---|
| `incluso` / `escluso` | 941,8 | — |
| `Escludi` / **`Reinserisci`** | **959,3** | +17,5px: la soglia andrebbe rifatta a ~1090 |
| `Escludi` / **`Includi`** *(applicato)* | **939,3** | −2,5px: il margine sale a **8,7** |

`aria-label` e `title` sono **la stessa stringa, nata una volta sola** — «Escludi Direct
Polls dal modello» — ed è l'idioma di `ETI` nei marcatori. Il testo visibile è la prima
parola del nome accessibile, come chiede WCAG 2.5.3: chi comanda a voce dice «Escludi».

**Niente `aria-pressed` qui**: quando il nome dichiara l'azione, direbbe il contrario di
quello che si legge, e il cambio di nome dopo la pressione **è** il riscontro. La
scorciatoia nelle ipotesi è il caso opposto — etichetta fissa «Escludi Direct Polls» —
quindi lì `aria-pressed` è la grammatica giusta e ora ce l'ha. Stessa famiglia di comandi,
due grammatiche, e la differenza è se il nome dice l'azione o la cosa.

Due cose che allo schermo sono dette da un segno e a un lettore di schermo non arrivavano:
**`(escluso)` nascosto** accanto al nome barrato — `text-decoration:line-through` non viene
annunciato da quasi nessun lettore, quindi lo stato esisteva solo dentro il nome del
pulsante — e **la regione viva `#k-housel`**, fissa nel markup perché `#k-house` viene
riscritto per intero e una regione sostituita in blocco non annuncia in modo affidabile.
Si aggiorna nel gestore del clic e non in `rHouse`, così al primo render resta muta.

E uno spazio fra `<em>` e `<s>` dentro le pastiglie: in un contenitore flessibile non si
vede — la larghezza resta 95,4px — ma senza, un lettore di schermo leggeva «Likud+6,2» e
«altre 4sotto 0,8».

#### Due trappole trovate misurando, non dopo

- **Il fondo colorato spegne i filetti fra i blocchi.** Il contrasto di luminanza di
  `--hair` sopra i cinque fondi: 1,24 sul neutro, ma **1,06 e 1,05** sui gradini 1 in
  chiaro e **1,00 e 1,00** in scuro — la stessa identica luminanza del fondo, su 27
  celle. Sarebbe una riparazione che ne rompe un'altra **in silenzio**, come il pulsante
  dell'istituto escluso. Rimedio: **filetto a due tinte**, `inset 1px 0 0 var(--hair),
  inset 2px 0 0 var(--card)` — quarto uso dell'idioma dell'alone. Su ogni fondo almeno
  una delle due si stacca: il minimo del migliore dei due è **1,17** in chiaro e **1,26**
  in scuro, contro l'1,24 e 1,26 che il filetto ha sul neutro. Restano due ombre interne,
  quindi la larghezza minima resta 941,8 esatti. **`--hair` va scritto per primo**: nel
  `box-shadow` la prima ombra sta sopra.
- **Il passaggio del puntatore verrebbe coperto.** `tbody tr:hover` mette un fondo sulla
  **riga**; i fondi della scala stanno sulle **celle** e ci vanno sopra: su 46 celle di 88
  il passaggio non lascerebbe traccia e la riga si accenderebbe a strisce. Qui cambia
  canale: **due filetti orizzontali** in `--ink2` invece di una velatura, che per
  seguire una riga su tredici colonne funziona anche meglio (10,04 in chiaro, 8,39 in
  scuro sul neutro, minimo 4,94 sul gradino 2 scuro). La cella di confine ha bisogno
  della **regola combinata**, o il filetto verticale del blocco viene cancellato:
  `box-shadow` è la stessa proprietà.

#### Le due varianti tenute pronte, misurate e NON applicate

Si scambiano i quattro token e basta. Stanno anche nel commento accanto alla regola.

**B · viola più staccato, solo tema scuro.** In scuro la carta *è* blu, quindi il viola
parte già dentro di essa: ΔE dalla carta **8,87 e 15,60** contro **18,07 e 28,46**
dell'oro. È l'unica asimmetria residua, e non è riparabile senza prezzo. Portando il
viola a metà strada — `--sc-m1:#322146; --sc-m2:#540E8B;` — il ΔE dalla carta diventa
13,57 e 21,96, `--ink` resta a 12,40 e 9,86, la dicromazia sale (deuteranopia 22,5 e
44,1). **Il prezzo**: la colorosità smette di essere pari — ΔE dal grigio 18,6 e 27,9
contro i 7,0 e 15,0 dell'oro — cioè si scambia l'asimmetria della distanza con
l'asimmetria della saturazione. Portandolo fino in fondo l'oro diventerebbe `#2B2B2B`,
un grigio esatto: quello no.

**C · più decisa**, se le tinte risultano timide. Il pavimento di 4,5 lascia scendere
fino a **L 0,600** in chiaro e salire fino a **L 0,532** in scuro; i gradini 2 stanno a
0,882 e 0,368.

```css
/* chiaro */ --sc-p1:#EBDEC4; --sc-p2:#E7B643; --sc-m1:#E4DBF2; --sc-m2:#CEAAFF;
/* scuro  */ --sc-p1:#3B321D; --sc-p2:#694E00; --sc-m1:#362F40; --sc-m2:#653596;
```

Contrasto di `--ink`: 13,39 · 9,48 · 13,34 · 9,18 in chiaro, 10,77 · 6,64 · 10,92 ·
7,14 in scuro — minimo **6,64**, ancora sopra 4,5. In grigio la direzione comincia appena
a trapelare (ΔE 0,78 e 1,59 al gradino 2) e la magnitudine raddoppia il passo.

Se una delle due viene scelta, va rimisurato tutto: `test/suite/house.js` prova i
contrasti e la pari luminanza dei gradini speculari, e i numeri scritti qui e nel
commento vanno rifatti, non ritoccati.

## Le sparkline: la geometria al posto dell'alfa, e l'alone

Misurato e **applicato il 22 agosto 2026**.

La sparkline di `k-proj` ha tre marcatori: la barra della forbice (α .30, spessore 3), i
due estremi (α .55, spessore 1,2) e il disco della mediana (pieno, r 4,2). L'alfa era la
codifica: più debole vuol dire più periferico.

**Che a opacità piena barra ed estremi si distinguano, è vero — e non per lo spessore.**
Misurato sul reso a 1265, dove l'SVG è 620×16 con `preserveAspectRatio="none"`, cioè
fattore x 3,1 e fattore y 1:

| marcatore | com'è reso davvero |
|---|---|
| barra | orizzontale, **3px** di spessore, 160,7px di lunghezza |
| estremi | verticali, **3,72px** di spessore (1,2 × 3,1: l'allungamento li ingrassa), alti 8px, **sporgono 2,5px** sopra e sotto la barra |
| mediana | **ellisse 26 × 8,4px** — non un cerchio: lo stiramento la deforma |

Quindi gli estremi sono **più spessi** della barra, non più sottili: lo spessore non li
ordinava, lo faceva solo l'alfa. Ma si distinguono lo stesso, per **orientamento** e per
**sporgenza**, ed è la figura standard della barra d'errore. **Nessuna tinta serve lì.**

**Il problema è un altro, e non era stato previsto: il disco contro la barra.**

| | minimo | sotto 3:1 |
|---|---|---|
| oggi, disco pieno contro barra al 30% (chiaro) | **3,12** | 0 su 21 |
| oggi, in scuro | **2,97** | 1 su 21 |
| **a opacità piena, disco contro barra** | **1,00** | **21 su 21** — stesso colore |
| con un alone `--card` fra i due (chiaro) | **4,66** | 0 su 21 |
| idem in scuro | **4,41** | 0 su 21 |

A opacità piena disco e barra diventano **lo stesso colore**, e a separarli resterebbero
5,4px di estensione verticale. Sarebbe chiudere un difetto aprendone un altro.

**Applicato: alone `--card` sotto il disco**, quarto uso dello stesso idioma nel file —
la linea della maggioranza nell'emiciclo, l'anello degli istogrammi, il tratto del
simulatore. **Non aggiunge nessun token**: `--card` è il fondo. Minimo 4,41.

È un cerchio in più nell'SVG, r 5,4 contro i 4,2 del disco, disegnato **prima** del disco
perché nell'SVG l'ordine è la pila. `test/suite/opacita.js` verifica che sia sotto, che
sia concentrico e che sia più largo — un alone scentrato o sopra è un errore che a occhio
si vede subito e in una prova di posizione no.

**Resta da guardare a occhio**, ed è nella lista della revisione: la barra al 30% era anche
quello che rendeva il disco un centro. A opacità piena l'intervallo è un'asta piena con una
lente in mezzo, ed è la figura giusta — ma è una figura diversa da quella di ieri.

## Calendario

| Data | Cosa |
|---|---|
| 8 settembre 2026 | Deposito delle liste: la mappa dei partiti si chiude |
| 6 ottobre 2026 | Comincia la propaganda televisiva |
| 23 ottobre 2026 | Silenzio demoscopico: ultimi sondaggi pubblicabili |
| **27 ottobre 2026** | **Voto** |
| 4 novembre 2026 | Risultati ufficiali |

---

## La tavolozza: la regola della consegna 6, e che cosa è costata

Applicata il 22 agosto 2026. Sostituisce per intero la tavolozza generativa del 20 agosto
— bande di luminanza, settori stretti, ΔE minimo 7,88 — e con essa tutte le sezioni che
questo file dedicava a quella: la soglia interna di 7,5, l'obiettivo a cascata, i due
limiti, la scala delle bande che partiva troppo in basso. **Non valgono più.** Se servono
per capire come ci si è arrivati stanno nella storia di git e in `docs/`.

La sorgente è `dati/colore-liste.js`. Non è una tavolozza con una regola scritta addosso:
i venti colori di lista e i quattro token di blocco sono **l'uscita** di
`COLORE.diLista(id, tema)` e `COLORE.token(blocco, tema)`, e `test/suite/regola.js`
verifica che la pagina non ne diverga — 63 asserzioni.

### Com'è fatta

Quattro **settori di tinta disgiunti**, uno per blocco; per ogni tema le **finestre di
luminanza** che i contrasti ammettono, ricavate dalle superfici e non scelte; dentro
settore × finestra una griglia dichiarata (3° di tinta, 1,5 di L\*); e un'**assegnazione
per inserimento a distanza massima**, dove la lista *k* prende il punto più lontano da
quelli già assegnati nel suo blocco fra quelli che rispettano i pavimenti verso gli altri.

| blocco | settore | arco reale chiaro | arco reale scuro |
|---|---|---|---|
| liste arabe | 142°–192° | 142,0°–190,8° | 142,0°–189,9° |
| blocco Netanyahu | 226°–304° | 226,5°–303,8° | 229,0°–303,9° |
| opposizione sionista | 340°–40° | 342,9°–39,9° | 340,1°–38,4° |
| ago della bilancia | 58°–105° | 67,2°–103,1° | 58,0°–103,2° |

Il settore non è un'affermazione sulla regola, è un **filtro dentro** la regola: un
candidato la cui tinta *misurata* cade fuori viene scartato dal dominio. È la differenza
che ha chiuso il difetto della revisione 5, dove le tinte annotate divergevano dalle tinte
consegnate fino a 29,8° perché `oklch()` non applicava la funzione di trasferimento sRGB e
il file annotava l'intenzione invece del risultato.

### I numeri, misurati da noi sull'esadecimale che sta in pagina

| | chiaro | scuro |
|---|---|---|
| testo sopra il colore, minimo | **4,74** | **4,73** |
| colore su `--card` / `--paper`, minimo | **3,36** | **4,36** |
| ΔE dentro il blocco, sedici liste coesistenti | 9,3 | 11,4 |
| idem, per un dicromate | **2,91** | **3,55** |
| ΔE dentro il blocco, gli undici in aula | **15,7** | **12,7** |
| idem, per un dicromate | **5,71** | **5,47** |
| ΔE fra blocchi | 15,0 | 13,8 |
| idem, per un dicromate | 6,97 | 5,68 |

Il confronto che conta, sulla stessa configurazione: **dentro il blocco si passa da 7,9 a
15,7** in chiaro e da 7,9 a 12,7 in scuro, e **per un dicromate da 0,94 e 1,37 a 5,71 e
5,47.** Era il difetto dichiarato da mesi — «dentro lo stesso blocco 0,86 per un dicromate»
— ed è chiuso.

**Il pavimento dicromatico dentro il blocco è un vincolo della regola**, non un esito:
4,2 in chiaro e 4,5 in scuro nei tre blocchi in aula, **3,0 e 3,3 nell'ago della bilancia**,
dove la famiglia ocra non ha varianza protanopica. Il valore più basso è per blocco ed è
dichiarato: con 4,2 uniforme l'ago della bilancia terrebbe tre liste e Israel First
resterebbe senza colore.

### Il tetto della finestra scura è 0,650, ed è nostro

La consegna lo metteva a **0,7200**, e il difetto che ne usciva era più grande di quello che
sembrava guardando una lista sola.

A 0,7200 la finestra arriva a **L\* 88**, dove il gamut sRGB non ha quasi più croma da dare.
I due colori più alti uscivano a croma **0,053** e **0,057** — cioè quasi bianchi — e non
erano due liste qualsiasi: `otzma` con 8 seggi e **`yashar` con 24, il primo partito**.
Insieme **32 seggi su 120, il 27% della camera, contro ZERO seggi sotto croma 0,08 in tema
chiaro**. E stavano sui **due lati opposti della soglia dei 61**: la zona più luminosa
dell'emiciclo scavalcava esattamente la riga che il grafico esiste per mostrare.

Nessuna prova cadeva, perché i due erano separati per bene — ΔE 25,8, e 23,4 per un
protanope. Era un difetto editoriale, non di conformità, e si vedeva solo contando quanti
seggi porta ciascun livello di croma. **Il conto che lo rivela è «quanta camera è dipinta»,
non «i colori sono distinti».**

Abbassando il tetto a **0,650**:

| | 0,7200 | **0,6500** |
|---|---|---|
| seggi sotto croma 0,08 | 32 | **8** |
| croma minima | 0,053 | 0,067 |
| Yashar | `#FFD0C1` C 0,057 | **`#FF9A7D` C 0,128** |
| ΔE dentro il blocco, scuro | 11,8 | **12,7** |
| **dicromate dentro il blocco** | **3,88** | **5,47** |
| ΔE fra blocchi, scuro | 17,4 | 15,9 |
| slot liberi in scuro (c/o/a/i) | 1/5/2/2 | 2/3/1/1 |

**Il tema chiaro non è toccato**, e il pavimento dicromatico sale sopra il 4,5 dichiarato —
il che chiude da sé una discrepanza che ci portavamo dietro: a 0,7200 la coppia
`utj`/`sionismo_rel` misurava **5,0 con le matrici di Machado** della consegna e **3,88 con
quelle di Viénot** di questa suite, cioè il vincolo teneva o non teneva a seconda del
metodo. A 0,650 tiene con tutti e due, e la domanda «quale matrice definisce il pavimento»
smette di essere urgente — resta però vera in generale: **un pavimento che dipende dalla
matrice non è un pavimento.**

**Sotto 0,600 non si scende**: l'ago della bilancia va a −1 slot e una lista resta senza
colore. Il residuo accettato è `otzma` a croma 0,067 con 8 seggi.

### Che cosa è stato ceduto, e va saputo prima di riaprire la partita

**Le bande di luminanza non esistono più.** In scala di grigi il ΔE minimo fra liste di
blocchi diversi è **0,0** in tutti e due i temi. Era una cessione autorizzata, in cambio
della distinguibilità dentro il blocco, e la contropartita è che **a livello di blocco il
grigio regge**: i quattro token stanno a ΔE 8,61 in chiaro e 9,05 in scuro. Se il colore di
lista smette di dire il blocco in bianco e nero, il colore di blocco continua a dirlo — ed
è per questo che quel numero è un invariante e non un dato.

**Sedici identità storiche su venti sono perdute, con la ragione di ciascuna.** Quattro si
tengono — Likud, I Democratici, Ra'am, Lista Unita araba — perché il loro colore storico è
cromatico e cade dentro il settore del proprio blocco. Cinque non avevano una tinta (erano
grigi: Shas, UTJ, Unità, Israel First, Partito Economico) e undici avevano una tinta che
appartiene all'arco di un altro blocco. **Yisrael Beitenu** era viola a 297,5°, cioè nel
settore della coalizione: sta a 343°, il bordo magenta, che è il punto legale più vicino.
L'elenco misurato è in `tinta-storica.md` nella cartella della consegna.

### I quattro token di blocco non sono più lo slot 0

Fino al 20 agosto `--coal`, `--oppo`, `--arab` e `--inc` erano `di(blocco, 0)`: il
capolista faceva anche da colore del blocco. Adesso sono **un'uscita a sé** della regola,
`COLORE.token()`, perché devono rispettare fra loro distanze e contrasti che il capolista
non può garantire — lo slot 0 è scelto per stare lontano dalle *altre liste del suo blocco*,
non dagli *altri tre token*.

Contro il pavimento di prima, misurato:

| | chiaro | scuro |
|---|---|---|
| su `--card` | 3,78 (era 4,70) | 4,36 (era 4,69) |
| testo sopra | 4,72 ✔ | 4,74 (era 5,09) |
| distanza nominale fra i quattro | **35,07** ✔ | **39,45** ✔ |
| deuteranopia | 13,24 ✔ | 13,25 ≈ |
| protanopia | **12,64** (era 5,7) | **18,64** ✔ |
| scala di grigi | **8,61** (era 6,1) | **9,05** ✔ |
| i tre in aula, tutte le viste | 13,24 (era 15,9) | 13,25 (era 23,1) |

Protanopia e scala di grigi migliorano molto; contrasto su `--card` e distanza fra i tre
in aula scendono. **È una regressione dichiarata qui e non altrove**: la consegna 6 non
nomina mai i token di blocco, benché li abbia cambiati.

### L'8 settembre, e la capienza vera

```js
COLORE.capienza();                              // saturazione per blocco e tema
COLORE.ORDINE.opposizione.push('lista_nuova');  // in coda: le assegnate non si spostano
COLORE.TINTA_ASSEGNATA.lista_nuova = 12;        // posizione di tinta, tolleranza 14°
COLORE.diLista('lista_nuova', 'chiaro');
```

| blocco | satura a (chiaro) | in anagrafica | liberi | satura a (scuro) | liberi |
|---|---|---|---|---|---|
| blocco Netanyahu | 10 | 5 | 5 | 7 | 2 |
| opposizione sionista | 12 | 7 | 5 | 10 | 3 |
| liste arabe | 5 | 4 | **1** | 5 | 1 |
| **ago della bilancia** | **4** | 4 | **0** | 5 | 1 |

**Due difetti della consegna riparati da noi, e sono nel nostro file, non nel loro.**

1. **`capienza()` misurava il tetto che le si chiedeva, non la saturazione.** Chiamava
   `palette(tema, 7)` e riportava «liberi» come riempiti − in anagrafica: un blocco che
   riempiva sette slot su sette risultava pieno anche quando ne reggeva dodici. Il §9 della
   consegna dichiarava «opposizione a zero slot liberi in tutti e due i temi» e **non è
   vero**: l'opposizione satura a 12 e ne ha cinque liberi. Il blocco davvero pieno è uno
   solo, **l'ago della bilancia in tema chiaro**. È un numero giusto per la domanda
   sbagliata, ed è la forma di difetto peggiore perché non si vede: la funzione risponde.
2. **Oltre la saturazione la regola restituiva `#626D7E` in silenzio** — cioè `--mute`, il
   colore del testo attenuato. Una lista dipinta come testo disabilitato, senza un avviso,
   la sera del deposito. Adesso il primo slot oltre la saturazione **avvisa**, e dal secondo
   in poi la regola **fallisce con un errore esplicito** che nomina il blocco e rimanda alla
   scala di ripiego. È la proprietà che `regola.js` provava già sulla regola vecchia, e che
   la consegna aveva lasciato cadere.

**Se l'ago della bilancia deve accogliere una quinta lista**, la scala di ripiego è nel §9
di `regola-colore.md` della consegna, un parametro per volta: prima `dentro_dic` di quel
blocco meno 0,6, poi `fra_blocchi_dic` delle sue coppie meno 0,5, poi allargare il settore.
`capienza()` restituisce quel percorso nel campo `ripiego`: **il punto in cui la regola
fallisce dice dove andare**, perché quella sera nessuno avrà tempo di cercarlo.

### Quello che non è stato applicato

Il **secondo canale** — l'anello sui marchi da 14px in su, per le liste che non siedono
nella Knesset uscente — **non è in pagina**. È una modifica al disegno, non alla tavolozza,
e va fatta a parte. Quando si farà: **sono sette liste, non otto.** `lista_araba` va
esclusa per la stessa ragione per cui la consegna esclude `sionismo_rel` e `otzma` — è il
contenitore di `hadash_taal`, che nel 2022 aveva cinque seggi. Che `r22` sia `null` per un
contenitore vuol dire «questa sigla non esisteva nel 2022», non «questi elettori non hanno
eletto nessuno», e la coerenza del criterio vale più della lettera del campo.

## Difetti noti, di codice e non di tavolozza

Nessuna scelta di colore li risolve: dipendono da come il modello disegna.

1. ~~Le sparkline di `k-proj`~~ — **chiuse il 22 agosto 2026**, e per la cronaca erano
   peggio di come erano scritte qui. Non «tre»:
   misurato su tutte e ventuno le liste nei due temi, sotto 3:1 stanno **12 su 21** in
   chiaro e **9 su 21** in scuro agli estremi della forbice (α .55), e **21 su 21 in tutti
   e due i temi** sulla barra (α .30) — che è l'elemento che porta l'intervallo, cioè
   quello che il lettore deve vedere, e che non era mai stato contato.
   **A α = 1 tutte e ventuno reggono 3:1 in tutti e due i temi**: la tavolozza non c'entra
   niente. La leva non era l'opacità e non era il colore: era **smettere di usare l'alfa
   come codifica** e affidare la distinzione alla geometria, che c'era già. Vedi «Le
   sparkline: la geometria al posto dell'alfa, e l'alone» più sotto.
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

### Lo stato al 22 agosto 2026, sera

Scritto per ripartire senza la conversazione. Ultimo commit spinto: **`14c9b0b`**.

**Pubblicato e verde** — CI e Pages passate, 863 prove:

- **la tavolozza della consegna 6**, generativa, in `dati/colore-liste.js`. Cinque strade
  aggiornate — `P{}`, `PAL_SCURO`, `BL{}`, i quattro token CSS — e `regola.js` che le lega
  con 63 asserzioni. Dentro il blocco 15,7 in chiaro e 12,7 in scuro, per un dicromate
  5,71 e 5,47. Il tetto della finestra scura è **0,650 e non 0,7200**, ed è nostro: vedi
  «Il tetto della finestra scura è 0,650, ed è nostro»;
- **la scala divergente dell'house effect**, tabella e schede, col comando «Escludi /
  Includi», il `(escluso)` nascosto e la regione viva del ricalcolo;
- **il banco di prova come dato**: `BT[]`, e da lì rendono la tabella e i tre numeri —
  4,5, 1,7 e il rapporto **2,7**, che prima era «tre volte» scritto a mano;
- **il lede dell'house effect** e la frase del comando, nel markup;
- **`formaTitolo()`** con le sette forme, e `test/suite/titolo.js` che le prova su tutte e
  7381 le configurazioni;
- **l'ancora del confronto a sette giorni** parte da oggi e non dall'ultimo sondaggio, e
  `PREC` porta due date distinte;
- **l'invariante 10**, «niente tempo scritto a mano».

**Fermo, in attesa dei testi dell'autore.** Il codice c'è, la prosa no:

- **l'h1 e il `<title>`**, nove celle raggiungibili: la tabella delle frequenze è in
  `docs/forme-del-titolo.md` e serve proprio a scrivere quei testi. Il `<title>` oggi è
  ancora una stringa fissa nel markup, riga 6, e deve diventare la forma corta della
  stessa funzione, sotto i 60 caratteri;
- **sommario, verdetto, pastiglie, istogrammi, simulatore**: la struttura — quale
  grandezza in quale frase, con le condizioni — è quella concordata; i testi mancano.
  Due cose sono già decise e vanno rispettate quando si scrivono: nel **verdetto** la
  frase deve dire **da quando** si confronta, e adesso `PREC.taglio` e `PREC.data` sono
  due campi distinti; negli **istogrammi** «quanti seggi mancano» si dice da
  `61 − q(MC.coal, .50)`, la mediana, **non** da `blocchi(SEG)`;
- **la nota metodologica**: restano le due frasi sul deposito dell'8 settembre, che oggi
  sono al presente e diventano false il 9. Il resto della nota è già calcolato;
- **la firma**: `Daniele Angrisani · Modello previsionale Knesset 2026 · @putino`, con
  `@putino` su `https://x.com/putino`, senza FocusAmerica — è un modello personale, non
  della testata. Se viene generata dal JavaScript il controllo strutturale la lascia
  passare ed elenca il collegamento: è stato reso più preciso apposta. **Per l'embed**:
  chi incorpora incorpora un lavoro personale, e il testo che accompagna il frammento da
  copiare va scritto di conseguenza, o un editor attribuisce alla testata una cosa che la
  testata non firma.

**Il mobile: quattro cose che l'autore deve ancora dire.** Non sono state enunciate, e
non vanno indovinate. Quello che il progetto ha già annotato su quel fronte, e che
probabilmente le tocca:

- **i 380px su un browser vero**: adesso si possono guardare, il banco c'è (vedi «Il banco
  di misura su browser vero»). L'invariante 8 — nessun testo negli SVG sotto i 5px reali a
  380 — è verificata solo alla larghezza disponibile, non a 380;
- **la via d'uscita dal filtro dell'emiciclo al tocco**: il ritorno alla vista piena è
  annunciato con Esc, che al tocco non esiste, e il pulsante «Mostra tutti i seggi» sta
  sotto la legenda, lontano dal punto in cui il dito ha appena premuto;
- **«Giudaismo Unito Torah» va a capo** a 380 nella colonna dei nomi da 104px, e la sua
  riga è alta 95px contro i 78 delle altre;
- **i dischi dei marcatori sotto i 900px**, dove il `<title>` è l'unica cosa che li
  descrive e il comando è la voce di cronologia: scelta da provare con un lettore di
  schermo vero, non da stabilire ragionando.

**E prima di misurare qualunque cosa su browser**: il server è `.claude/serve.mjs`, è
sotto controllo di versione apposta, e le sue **tre trappole** stanno in «Il banco di
misura su browser vero» — il tema che segue `prefers-color-scheme`, le transizioni
congelate che danno geometrie stabili e false, e il clone misurato fuori da `#kn26` che
non eredita nessuna regola del foglio. Più una del DOM: `#k-house` viene riscritto a ogni
render, quindi un riferimento preso prima di un `click()` è morto subito dopo.

### Nell'ordine, quando si riprende

1. **I testi**, che sbloccano tutto il resto: h1, `<title>`, i cinque blocchi, le due
   frasi sul deposito. Da `docs/forme-del-titolo.md`.
2. **Le quattro cose sul mobile**, appena l'autore le dice.
3. **La revisione visiva della tavolozza nuova**: non l'ha ancora vista nessuno. La prima
   riga della lista di controllo dice dove guardare — l'ago della bilancia, che ha il
   pavimento dicromatico più basso, e in scuro `otzma` `#BCD2FF`, l'unica rimasta quasi
   bianca.
4. **Modalità `?embed=1`** (punto 1 di «Ancora da fare»).
5. **Cercare le altre strade doppie.** Ogni valore che raggiunge lo schermo per più di un
   percorso e non ha una prova che li leghi è il prossimo colore di blocco.
6. **Il campo `esito`** in archivio (punto 8-bis): senza, dopo il voto la pagina può
   parlare solo della propria stima, e l'ottava istantanea che sposterebbe il 2,7 non
   esiste.
7. Minore, dal filtro dell'emiciclo: vedi il mobile qui sopra.
8. Dal parser Wikipedia: **24 righe di gennaio-aprile** hanno una cella unica che copre
   Ra'am, Hadash–Ta'al e Balad — la Joint List larga di gennaio, che non ha contenitore in
   anagrafica. Il parser le respinge dichiarandolo: vanno mappate a mano.
9. Sempre dal parser: **le righe-evento arrivano in inglese** in una cronologia italiana.
   `unisciEventi` salta le date già presenti, quindi oggi non entra niente di nuovo, ma il
   primo evento inglese nuovo si mescolerà alle voci italiane.
10. **L'altezza uniforme delle righe della tabella dell'analisi** non è provabile in jsdom:
   dipende dal font e si vede solo su browser vero. Se si tocca il corpo, la colonna o il
   font, va rimisurato col browser.

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

### Sui colori: la partita è chiusa, e non da qui

Le due voci che stavano qui — «la scala delle bande parte troppo in basso» e «la leva
rimasta sui verdi arabi» — riguardavano la tavolozza del 20 agosto, che non esiste più.
Le bande di luminanza non ci sono, i settori sono altri, e il pavimento di 7,5 dentro il
blocco è stato superato: si sta a 15,1 in chiaro sui dodici in aula. Vedi «La tavolozza:
la regola della consegna 6».

### I difetti noti che restano

- ~~Le sparkline di `k-proj`~~ — chiuse il 22 agosto 2026: opacità piena e alone `--card`
  sotto il disco. Minimo 4,66 in chiaro e 4,41 in scuro sulle ventuno liste.
- **Il conto dei giorni al voto tronca le ore** invece di contare i giorni di calendario
  (punto 12).
- **Sei suite usano un DOM ridotto** — `aff`, `emi`, `final`, `tema`, `testint`,
  `verifica` — e non possono provare niente che tocchi elementi resi (punto 13 vecchio).

### La cosa più importante

**La verifica visiva non è automatizzabile, e non è un dettaglio.** Tutti i difetti veri
trovati oggi — la stella della bandiera che sconfinava nelle bande, l'occhiello a filo del
bordo sull'ombra, il vuoto di 372px sotto le ipotesi, l'evidenziazione che competeva con
la codifica del riempimento, il verde arabo che si leggeva nero — sono stati trovati
**guardando la pagina**, non dalla suite. Le 814 prove dicono che il modello non si è
rotto; non dicono che la pagina si veda. Dopo ogni push, aprire
<https://angrisanidj.github.io/modello-israele/> e guardarla nei due temi.

---

## Revisione visiva finale: la lista di controllo

Scritta il 22 agosto 2026 per una passata sola, sezione per sezione. Serve a distinguere
**quello che qualcuno ha già guardato reso** da **quello che nessuno ha mai visto**: in due
giorni sono entrate parecchie cose che le prove dichiarano sane e che nessun occhio ha
ancora confermato. Le 814 prove dicono che il modello non si è rotto; non dicono che la
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
| 1 | **La tavolozza nuova, tutte e venti le liste** | emiciclo, legende, pastiglie, tabella per lista | 1265 e 380, nei due temi | **Nessuno l'ha mai vista resa**: è la tavolozza della consegna 6, applicata il 22 agosto. Le liste dello stesso blocco si distinguono? Il ΔE dentro il blocco è **15,7** sugli undici in aula (era 7,9) e **5,71** per un dicromate (era 0,94), ma sull'ago della bilancia scende a 9,3 e **2,91** — e quelle quattro liste stanno solo in tabella, col nome accanto. Guardare per prima cosa **l'ago della bilancia**, che è il blocco col pavimento più basso, e in **scuro** `otzma` `#BCD2FF`, l'unica rimasta quasi bianca — croma 0,067, 8 seggi — dopo che il tetto della finestra è stato abbassato a 0,650. E il **verde arabo**, che deve restare verde: sta a 142°–191° |
| 2 | **L'anello di evidenziazione degli istogrammi** | «Quanti seggi per ciascun blocco» | 1265 e 380 | La barra evidenziata si stacca senza competere con la codifica del riempimento. È la costruzione a due tinte: alone `--card` sotto, tratto `--ink` sopra |
| 3 | **L'house effect a schede** | sezione House effect | **380 e 760** (sotto la soglia di 1075) | Le schede: una per istituto, gli scarti da 0,8 in su. Il pulsante escludi/reinserisci accanto al nome. Provare a **escludere un istituto** e guardare la scheda tratteggiata. E a **1265** la tabella, per confronto |
| 4 | **Il simulatore ridisegnato** | «Costruisci una maggioranza» | tutte e tre | Pillole, barra, targhetta del 61. Provare le **tre scorciatoie del cambiamento** — 56, 61 e 68 seggi — e guardare l'etichetta a 68, dove cade a cavallo del bordo del riempimento |
| 5 | **«Chi serve per governare»** | sezione del potere di coalizione | 1265 e 380 | Non è mai stata guardata resa da nessuno |
| 6 | **I marcatori degli eventi** | «Come si è mossa la proiezione» | tutte e tre | Appena spostati dentro l'SVG: il disco deve sembrare **attaccato** alla sua verticale (3,57px a 1265, 1,88 a 380) e le due corsie devono leggersi come un insieme sfalsato, non come due serie |
| 7 | **Il riquadro dell'evento isolato** | idem | **380** e 1265 | A 380 sta dentro l'elenco, sotto la voce premuta. Guardare i tre numeri della terna — erano tre macchie scure — e il pulsante «Torna alla vista piena» in fondo |
| 8 | **Il tratto acceso** | idem | 1265 e 380 | Premere un evento a metà cronologia. Le tre linee attenuate a 0,26 **restano tre**? A 380 sono spesse 1,5px: è l'unica cosa di questo giro su cui la misura non può decidere |
| 10 | **La scala divergente dell'house effect** — *la più nuova, e una decisione editoriale, non tecnica* | tabella House effect | **1265**, nei due temi | Oro per l'eccesso, viola per il difetto, quattro gradini più il neutro. Tre domande, in quest'ordine: **(a)** la tabella si legge come una misura o come una tabella colorata? È il colore di una tabella pubblica, e la scelta è editoriale. **(b)** In **tema scuro** il lato − pende? La carta è blu, quindi il viola parte già dentro di essa — ΔE dalla carta 8,87/15,60 contro 18,07/28,46 dell'oro. Se pende, c'è la **variante B** pronta. **(c)** Le tinte sono timide? C'è la **variante C**. Le due varianti stanno nel commento accanto alla regola e in «La direzione: una scala divergente sul fondo». E guardare i **filetti fra i blocchi** sopra le celle colorate, e il **passaggio del puntatore**, che adesso è a filetti orizzontali |
| 9 | **Il fondo attorno alla pagina** | tutta la pagina, ai lati | **1385 e oltre** | Il `<body>` porta `style="margin:0;background:#e8e6e0"` scritto a mano, e `#kn26` ha `max-width:1180px`. A 1385 restano **103px per lato**, e il fondo non cambia col tema: misurato, in **tema scuro** sono 103px di beige contro `#070D18`. In chiaro è più sottile ma sbagliato lo stesso, `#e8e6e0` contro `#F7F8FA`. Da guardare a schermo largo nei due temi |

### Già guardato reso, ma non dopo le ultime modifiche

| Cosa | Quando | Perché rifarci un giro |
|---|---|---|
| La targhetta dell'etichetta del 61 | 21 agosto | verificata prima che il simulatore cambiasse di nuovo |
| Le schede dell'house effect | 21 agosto, alle tre larghezze | confermate; qui basta un'occhiata |
| L'apertura da doppio clic (seme BASE) | 21 agosto | invariata, ma è la sola prova che il file sta in piedi da solo |
| La linea della maggioranza nell'emiciclo | 21 agosto | chiusa con l'alone a due tinte |

### «Aggiornato al» non dice quello che sembra

Trovato il 22 agosto 2026 preparando l'embed, e non è un difetto dell'embed: è un difetto
della pagina che l'embed renderebbe pubblico.

```js
var u = SOND.map(function(s){return s.data;}).sort().pop();
$('k-upd').textContent   = 'aggiornato al ' + dl(u);
$('k-fresh').innerHTML   = 'ultimo sondaggio <b>' + dl(u) + '</b>';
```

`u` è **la data dell'ultimo sondaggio in archivio**, non la data dell'ultimo
aggiornamento riuscito. Quindi «aggiornato al 20 agosto» vuol dire «l'ultimo sondaggio è
del 20 agosto», che è un'altra cosa. **Se il lavoro notturno si ferma dietro una guardia —
colonne ignote l'8 settembre, per esempio — quella data si congela e la pagina non dice
niente.** Un lettore non può distinguere «ha girato stanotte e non c'era niente di nuovo»
da «è fermo da dieci giorni».

**Il dato per ripararlo c'è già, ed è pubblicato.** `dati/stato-job.json` porta
`"data": "2026-08-21"`, e quando una guardia ferma il job quel file **non viene
aggiornato**: è esattamente ciò che rende lo stallo misurabile. Verificato il 22 agosto che
sia raggiungibile dalla pagina: `200`, `access-control-allow-origin: *`,
`cache-control: max-age=600`. Oggi la pagina fa `fetch` del solo `archivio.json`.

**E la stessa ancora sbagliata è in un secondo punto**, che è la solita strada doppia:
`finestra()` prende come riferimento `t0 = new Date(l[0].data)`, cioè di nuovo il
sondaggio più recente, e il sottotitolo della sezione 2 scrive «**N rilevazioni pubblicate
negli ultimi 7 giorni**». Con l'archivio fresco le due date coincidono e la frase è vera;
col job fermo, o dopo il voto, dice una cosa falsa sul presente. Misurato al 5 novembre
2026: «7 rilevazioni pubblicate negli ultimi 7 giorni», con l'ultimo sondaggio del 19
agosto.

Le due grandezze sono diverse e vanno dette tutte e due: **la data dell'ultimo sondaggio**
e **la data dell'ultima verifica riuscita**. Vale per la pagina e, dentro l'embed, è la
differenza fra un dato fresco e un dato fermo nell'articolo di qualcun altro.

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
