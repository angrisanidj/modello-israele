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
npm test             # estrae il JS e lancia le 1293 prove
npm run verifica     # prove + controlli strutturali
npm run spazzola     # rilancia il banco con l'orologio al 23 ottobre: dice quali prove
                     #   danno per scontato un archivio fresco. Da rifare dopo ogni
                     #   modifica a un'àncora temporale — vedi l'invariante 10
```

`npm test` rigenera `test/app.js` da `index.html`. Non modificare `test/app.js` a mano: è un
prodotto, viene sovrascritto.

**Ogni suite esce con codice diverso da zero se un'asserzione cade**, e non è sempre stato
vero. Fino al 22 agosto 2026 quattordici suite finivano con un `forEach` che stampava
`KO` e usciva con **zero**: il banco le contava lo stesso, perché `esegui.mjs` legge lo
stdout, ma era una salvezza per caso — di una riga sola e in un altro file. Chi lanciava
una suite da sola vedeva uscita zero con asserzioni fallite, e qualunque strumento che
guardasse il codice d'uscita la dava per verde: è successo davvero a un misuratore di
mutanti, che li dava tutti vivi. Il verdetto adesso passa da `test/esito.js`, che sta
fuori da `suite/` come `css.js` per non finire nell'elenco delle prove.

E tre modi in cui una prova può essere **verde senza provare niente**, tutti trovati in
questo progetto: una suite che **muore** alla prima riga e conta 0/0 (v5.js, per un id
sparito dal markup — ora `esegui.mjs` la dichiara fallita); un'asserzione scritta come
`console.log(" OK  …", condizione)`, che stampa OK **sempre** e appende il verdetto come
secondo argomento (aff.js, due su due); e un'asserzione tautologica —
`esito(D.title === undefined || true, …)` — che non può cadere.

**Nessuna modifica a `index.html` è finita finché `npm run verifica` non passa per intero.**

## Il banco di misura su browser vero

Le prove girano in jsdom, che **non fa layout**: larghezze, altezze, contrasti resi e
sovrapposizioni non le vede nessuna delle 1293. Per quelle c'è un server statico da otto
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

**Cinque trappole del banco, e la terza è la più cattiva.**

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
4. **Un `<style>` iniettato in `<head>` non ha effetto.** Il foglio del modello sta
   **dentro il `body`** — apre a riga 146 e chiude appena prima della bandiera — quindi a
   parità di specificità vince per **ordine di sorgente**, e una regola di prova messa in
   testa perde in silenzio. Scoperta il 22 agosto 2026 misurando le pastiglie dei
   parametri: le prime misure del nastro orizzontale erano **identiche a quelle di
   partenza** — 187px, 2/3/2 righe — e sembravano dire che `flex-wrap:nowrap` non
   cambiasse niente. Non era vero: la regola non era mai stata applicata. È la forma di
   difetto peggiore perché **non fallisce, risponde** — e risponde il numero di prima,
   che è esattamente quello che ci si aspetta di leggere quando si crede che una cosa non
   funzioni. Il foglio di prova va appeso a `document.body`, oppure ogni dichiarazione
   porta `!important` (che è il motivo per cui lo spegnimento delle transizioni della
   trappola 2 funziona anche dalla testa).
5. **In una scheda che non è in primo piano l'`IntersectionObserver` non scatta.** Il
   riquadro del browser tiene le schede aperte e le pilota anche da dietro, ma lì Chrome
   sospende le notifiche di intersezione: l'indice non accende nessuna voce, `scrollLeft`
   resta a zero e la pagina sembra rotta. Verificato il 22 agosto 2026 con un osservatore
   di controllo montato a mano sulle stesse sezioni e con lo stesso `rootMargin`: **zero
   notifiche** a scheda dietro, tutte e undici appena portata davanti. Riguarda l'indice,
   la comparsa progressiva delle sezioni e qualunque cosa si appoggi a quell'API. Prima di
   misurare l'indice, **portare la scheda in primo piano**.

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
   **Cinque è un pavimento, non un obiettivo, e va saputo**: l'etichetta «61 =
   maggioranza» degli istogrammi stava a **7,09px** — dentro l'invariante, e illeggibile.
   Chiusa il 22 agosto 2026 portandola a 10,98; `soglia.js` chiede **almeno 9px reali**
   per quella. Vedi «La soglia dei 61 negli istogrammi».
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

    **E vale anche nelle prove: una data letterale in una fixture è una costante
    temporale, e vale finché non vale più.** Scritto il 23 agosto 2026, dopo che
    `mediana.js` è caduta al primo giorno in cui il calendario è girato. Le sue quattro
    rilevazioni «recenti» erano datate 16–19 agosto, e reggevano solo perché
    `finestra()` si ancorava alla rilevazione più recente: la finestra dei sette giorni
    le conteneva sempre, a qualunque data si eseguisse la suite. Spostata l'ancora a
    oggi, il 23 agosto le quattro erano diventate tre e la mediana cadeva su un valore
    solo invece che fra due. Non era un difetto del modello: era una fixture che dava per
    scontato di essere eseguita ad agosto.
    La forma buona è `giorniFa(k)`, che costruisce le date **da oggi**: la fixture
    dichiara «quattro rilevazioni dentro la finestra e due fuori» invece di «quattro
    rilevazioni del 16, 17, 18 e 19 agosto», che è la stessa cosa solo finché è agosto.
    Una data letterale resta legittima quando è **il fatto che si prova** — l'8 settembre
    del deposito, il 27 ottobre del voto, l'orologio congelato di `deposito.js` e
    `date.js` — e non quando è soltanto un modo di dire «adesso».

    **Come si verifica, invece di ragionarci.** Il banco si esegue con l'orologio spostato
    avanti e si guarda che cosa cade:

    ```bash
    npm run spazzola
    ```

    che esegue **tutto** il banco con l'orologio portato al 23 ottobre — il silenzio
    demoscopico, il primo giorno in cui la finestra dei sette giorni si svuota da sola — e
    dice che cosa cade. Altre date si passano come argomenti:
    `npm run spazzola 2026-11-20 2027-02-01`. Una prova sola, a mano, si esegue così, e
    il `cd` non è facoltativo perché le suite leggono `../../index.html`:

    ```bash
    cd test/suite && FINTO_OGGI=2027-02-01 TZ=Europe/Rome node --require ../orologio.cjs mediana.js
    ```

    dove `orologio.cjs` è cinque righe che sostituiscono `Date` prima che la suite parta.
    **Va rifatta dopo ogni modifica a un'àncora temporale**, ed è il solo strumento che
    trova questa famiglia: il grep delle date letterali, da solo, guarda dalla parte
    sbagliata — vedi qui sotto.
    Spazzolando 23 agosto · 15 settembre · 15 e 28 ottobre · 20 novembre · 1º febbraio,
    **nessuna delle fixture con date letterali è stagionale**: le date d'archivio non
    scadono perché `attiviAl()` àncora la finestra dei 60 giorni alla rilevazione più
    recente, non a oggi. **La stagionalità sta altrove**, ed è la cosa che il conteggio
    delle date letterali non avrebbe mai trovato: vedi «Le sei suite che scadono con la
    finestra vuota» in fondo.

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
  spazzola.mjs        rilancia tutto il banco con l'orologio portato avanti: npm run spazzola
  struttura.mjs       controlli strutturali sul file, compresi i due sulle composizioni
  css.js              il foglio letto come dato: quali regole sono attive a una data
                      larghezza. Sta FUORI da suite/ perché è una libreria, non una prova.
                      Toglie i commenti PRIMA di analizzare: senza, il selettore di una
                      regola commentata comprendeva il commento e prop() non la trovava
                      mai — la regola c'era e la prova riceveva «non dichiarata»
  esito.js            stampa un blocco di controlli e fa fallire il processo se uno cade
  orologio.cjs        congela l'orologio a FINTO_OGGI: si carica con node --require e serve
                      a spazzolare le prove nel futuro
  suite/*.js          le prove, una per area
  suite/apparentamenti.js  gli accordi di eccedenza: il riparto senza coppie identico a
                      prima, le due strade che concordano, la soglia individuale
  suite/date.js       le due date, l'orizzonte congelato, la fascia del dopo-voto e il
                      sommario a una riga: rende la pagina con l'orologio fermo e il
                      registro del lavoro notturno finto
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
  stato-testi-titolo.md  i dodici testi decisi e le due correzioni che mancano
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

**L'ultima voce di questo elenco non sta qui: è «La verifica a scenari», in fondo al
file.** Va eseguita quando tutto il resto è chiuso — dopo l'esportazione PNG e dopo
l'embed — perché prova le combinazioni che la suite non copre: le prove esercitano una
leva alla volta, quella lista le esercita insieme.

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
2. ~~Accordi di apparentamento~~ — **IMPLEMENTATI IL 23 AGOSTO 2026, e nati spenti.**
   `APPARENTAMENTI` sta nell'anagrafica: coppie di id, con la **data** dell'annuncio e lo
   **stato**. I depositati entrano sempre nel riparto; gli annunciati solo con la leva
   `PAR.apparentamenti`, che si comporta come `PAR.listaunita` e mostra il controfattuale.
   Oggi non c'è nessun depositato, quindi **a leva spenta ogni numero in pagina è identico
   a prima**, ed è la prima cosa che `test/suite/apparentamenti.js` verifica invece di
   darla per scontata.

   **IL TERMINE È IL 16 OTTOBRE, NON L'8 SETTEMBRE**, e questo punto ha detto il contrario
   per tre commit — «si cambia uno stato l'8 settembre» era falso due volte: la data è
   un'altra, e quello che l'8 settembre si può fare è soltanto portare a `depositato` gli
   accordi già firmati, che storicamente sono pochi. Vedi il Calendario qui sopra per la
   verifica sui tre cicli e per il rapporto col silenzio demoscopico.

   **QUANTI NE ARRIVERANNO, dalle tre campagne del banco**: 3 nel 2020, 6 nel 2021, 4 nel
   2022 fra le liste che contano — **il totale sta fra 3 e 6**, con 8-13 liste sopra
   soglia (oggi 11). **La coda è la parte grossa**: nel 2021 tre dei sei sono stati
   firmati dopo il deposito delle liste e uno a quindici giorni dal voto (Shas + UTJ, 8
   marzo); nel 2022 **tutti e quattro nell'ultima settimana utile**, a ridosso del termine
   del 21 ottobre. Alla distanza di oggi dal voto — 65 giorni — il 2021 ne aveva
   annunciati **2 su 6** e il 2022 **0 su 4**: da qui all'8 settembre aspettarsene **zero,
   uno, al massimo due**, e il grosso fra fine settembre e il 16 ottobre. Una tabella
   quasi vuota a settembre non è un'anagrafica finita, ed è scritto anche nel commento
   accanto a `APPARENTAMENTI` perché è la lettura sbagliata più facile da fare.

   **UN ANNUNCIATO CHE NON DIVENTA DEPOSITATO MUORE, e nel 2022 è stato il caso normale
   per le liste arabe**: Balad rifiutò Hadash–Ta'al, Ra'am non provò, e le trattative
   annunciate finirono in niente mentre la stampa lo raccontava come un vantaggio per il
   blocco di Netanyahu. I modi di morire sono due e sono tutti e due implementati:
   `stato:'ritirato'` con il campo `fine` — la data del ritiro, che serve alla serie
   storica per non riscrivere il passato — e il **termine**, che li spegne tutti insieme.
   Dopo il 16 ottobre `coppieAl()` non li restituisce più, con la leva accesa o spenta:
   **dopo il termine un accordo non depositato non è un'ipotesi, è una cosa che non è
   successa**, e il comando sparisce invece di promettere un controfattuale che non c'è.
   `dhondt()` e `ripartoVeloce()` sono stati toccati nello stesso commit, e una prova li
   confronta su 300 vettori di quote generati: erano la strada doppia che sarebbe nata
   insieme alla funzionalità.
   **Una terza strada c'era già e va lasciata separata**: `invD()` inverte i seggi
   PUBBLICATI da un sondaggio, che un istituto calcola senza apparentamenti perché non può
   conoscerli. Usa `ripartoSoglia()`, il riparto senza accordi, e invertire con una mappa
   diversa da quella che ha prodotto i numeri darebbe quote sbagliate in silenzio.

   **QUANTO VALE OGGI, e la risposta è cambiata in ventiquattro ore.** Il 22 agosto la
   coppia Ra'am + Lista Unita valeva **zero seggi**. Misurata il 23 sull'archivio
   pubblicato, con una rilevazione in più: **Likud 23 → 22, Lista Unita araba 7 → 8**,
   cioè blocco Netanyahu **51 → 50** e partiti arabi **12 → 13**. Il seggio attraversa il
   confine fra i blocchi, che è il caso in cui conta. Non è una correzione della misura di
   ieri: è il margine del 120° seggio — **0,0035 di divisore** il 23 agosto, fra il 23°
   seggio del Likud a 0,7525 e l'8° di Shas a 0,7490 — che si vede in azione, e la ragione
   per cui questo punto era il secondo della coda.

   **E non è più un caso limite: spazzolando lo swing da −6 a +6 a mezzo punto, la coppia
   vale un seggio in 25 stati su 25, e in 25 su 25 il seggio viene da un altro blocco.**
   Il 22 agosto valeva in 4 stati su 25. Il perché è strutturale e va saputo prima di
   rimisurarlo: lo swing sposta punti fra coalizione e opposizione e **non tocca le quote
   arabe**, quindi la coppia resta sempre nella stessa posizione rispetto al taglio; cambia
   solo *chi paga* — la coalizione in 11 stati (Likud cinque volte, poi Shas, UTJ, Otzma,
   Sionismo Religioso), l'opposizione nei 14 restanti (Yashar sette volte, B'Yachad,
   Democratici, Beitenu). I tre divisori che lo spiegano: il prossimo seggio di Ra'am
   starebbe a **0,6899** e quello della Lista Unita a **0,7188** — tutti e due sotto il
   taglio — mentre sommate le quote fanno 9,89 e il 13° seggio della lista virtuale sta a
   **0,7608**, che batte il Likud. Poi il 13 si divide 5 e 8.

   Quello che segue è l'analisi che ha portato all'implementazione, e resta perché i suoi
   numeri servono a leggere la tabella.

   **Non «dall'8 settembre»: il primo è
   stato proposto il 22 agosto 2026**, quando Abbas ha offerto alla Lista Unita araba un
   accordo di cooperazione e di condivisione dei voti in eccesso. Il primo caso concreto
   è arrivato con **quindici giorni di anticipo sul deposito**, e questo cambia il modo
   di costruire la tabella: **la mappa degli apparentamenti si costruisce mano a mano che
   vengono annunciati, non tutta insieme l'8 settembre.** Ogni annuncio è una riga in
   più, e le righe arrivano una alla volta da qui al deposito.

   **Cosa fa il modello oggi.** `dhondt(sh)` — riga ~1779 — filtra le liste sopra il
   3,25% e poi assegna 120 seggi uno alla volta col metodo dei divisori, **trattando ogni
   lista come non apparentata**. È Bader-Ofer nella sua parte di riparto, senza la parte
   degli apparentamenti: l'emendamento Bader-Ofer ha fatto due cose insieme — sostituire
   i resti più alti col metodo d'Hondt *e* introdurre l'accordo di eccedenza — e il
   modello ne implementa una sola. Lo stesso vale per `ripartoVeloce()`, la versione a
   bisezione usata nelle 20.000 simulazioni.

   **Come funziona l'accordo, e perché l'implementazione è piccola.** Due liste
   apparentate si presentano al riparto **come una lista sola** con la somma delle quote;
   i seggi che la lista virtuale ottiene si dividono poi **fra le due** con lo stesso
   d'Hondt applicato alla sola coppia. La soglia del 3,25% resta **individuale**:
   l'apparentamento non aiuta nessuno a superarla. Sono due passaggi, non un algoritmo
   nuovo — e `dhondt()` si riusa per tutti e due.

   **Costo, misurato scrivendo la variante e verificandola:** una tabella
   `APPARENTAMENTI` letta dall'anagrafica come `PRESET` e `TAPPE` — coppie di id, non
   liste cablate, o è la strada doppia di sempre alla prima coppia che cambia — più una
   funzione da una ventina di righe che raggruppa, riparte e ridivide. **Verificato che
   senza coppie riproduca esattamente il riparto di oggi**: è il primo controllo da
   scrivere, e da lì la prova cresce. Va toccato anche `ripartoVeloce()`, o proiezione e
   Monte Carlo direbbero due cose diverse: è una strada doppia che nasce insieme alla
   funzionalità, e va legata da subito.

   **Quanto varrebbe oggi, con l'archivio del 22 agosto 2026.** La risposta è
   controintuitiva e va scritta perché non si rifaccia il conto:

   **La coppia della notizia — Ra'am + Lista Unita araba — oggi vale ZERO seggi.**
   Nessun seggio si muove, i blocchi restano 51 / 56 / 13. Il perché sta in tre numeri:

   | | quota | seggi | divisore del seggio successivo |
   |---|---|---|---|
   | Ra'am | 4,23 | 5 | 0,7043 |
   | Lista Unita araba | 6,01 | 8 | 0,6675 |
   | **sommate** | **10,23** | **13** | **0,7310** |
   | *serve per entrare fra i 120* | | | **0,7478** |

   La coppia arriva a 0,7310 contro una soglia di 0,7478: **manca**. Sommare i resti non
   basta quando nessuna delle due è vicina al confine.

   **Ma il confine è sottilissimo, ed è lì la notizia vera.** L'ultimo seggio assegnato è
   il decimo di Yisrael Beitenu, con divisore **0,7478**; il primo non assegnato è il
   ventiquattresimo di Yashar, a **0,7466**. **Distanza: 0,0012, cioè 0,012 punti
   percentuali di quota.** Con un margine così, quasi ogni apparentamento sposta un
   seggio, e lo sposta quasi sempre da Beitenu.

   **Le altre coppie plausibili, oggi:**

   | coppia | effetto | blocchi |
   |---|---|---|
   | Likud + Sionismo Religioso | Likud 23→24, Beitenu 10→9 | coalizione **51→52** |
   | Shas + Giudaismo Unito Torah | Shas 7→8, Beitenu 10→9 | coalizione **51→52** |
   | Sionismo Religioso + Otzma | SR 5→6, Beitenu 10→9 | coalizione **51→52** |
   | Yashar + B'Yachad | Yashar 23→24, Beitenu 10→9 | invariati (stesso blocco) |
   | I Democratici + Beitenu | niente si muove | — |
   | B'Yachad + I Democratici | niente si muove | — |

   **Tre coppie del blocco Netanyahu valgono un seggio ciascuna, e lo prendono tutte
   dalla stessa lista: Yisrael Beitenu.** Non sono cumulabili — il seggio di confine è
   uno solo — ma dicono dove sta la fragilità.

   **E non è un caso di oggi.** Spazzolando lo swing da −6 a +6 a mezzo punto, 25 stati:

   | coppia | vale un seggio in | e il seggio viene da un altro blocco |
   |---|---|---|
   | Shas + UTJ | **14 stati su 25 (56%)** | 7 volte su 14 |
   | Sionismo Rel. + Otzma | 10 su 25 (40%) | 7 su 10 |
   | Yashar + B'Yachad | 9 su 25 (36%) | 8 su 9 |
   | Likud + Sionismo Rel. | 6 su 25 (24%) | 5 su 6 |
   | **Ra'am + Lista Unita** | **4 su 25 (16%)** | **4 su 4** |

   La coppia araba è quella che vale **meno spesso** — ma **quando vale, il seggio viene
   sempre da un altro blocco**: quattro volte su quattro. È esattamente il caso in cui un
   seggio conta, e il modello oggi non lo vede.

   **IL BANCO DI PROVA, e questa è la parte che decide.** La misura di oggi dice quanto
   vale su *una* configurazione; il banco dice quanto vale **in generale**. Rifatto il
   22 agosto 2026 sulle sette istantanee di `dati/storico.js`, provando **tutte** le
   coppie possibili fra le liste sopra soglia — 362 coppie in tutto:

   | istantanea | gg | liste | margine del 120° | coppie che valgono un seggio |
   |---|---|---|---|---|
   | 2020 · finale | 3 | 8 | 0,0077 | **20 su 28 (71%)** |
   | 2020 · due mesi | 62 | 9 | **0,0012** | 23 su 36 (64%) |
   | 2021 · due mesi | 58 | 11 | 0,0017 | 27 su 55 (49%) |
   | 2021 · finale | 4 | 13 | 0,0047 | 48 su 78 (62%) |
   | 2022 · sette settimane | 49 | 11 | **0,0202** | 14 su 55 (25%) |
   | 2022 · cinque settimane | 38 | 11 | 0,0069 | 32 su 55 (58%) |
   | 2022 · finale | 4 | 11 | 0,0178 | 10 su 55 (18%) |

   **Su 362 coppie possibili, 174 spostano un seggio: il 48%. E in 112 casi su 174 — il
   64% — il seggio viene dall'ALTRO blocco**, cioè cambia il conto che il grafico esiste
   per mostrare.

   Il margine del 120° seggio, sulle sette istantanee: **minimo 0,0012, mediano 0,0069,
   massimo 0,0202**. Quello di oggi è **0,0012** — il più stretto mai registrato dal
   banco, pari a **0,012 punti percentuali di quota**. Non è un caso limite: è il caso
   normale, e oggi siamo all'estremo.

   E una cosa che il banco mostra e la misura di oggi no: **le coppie che contano non
   sono quelle che ci si aspetta.** Nelle istantanee del 2021 e del 2022 la coppia che
   sposta il seggio è quasi sempre una qualunque dentro il blocco del cambiamento, e il
   seggio lo toglie al **Likud** — `ya+jl`, `ya+yb`, `ya+labor`, `ya+rzp` danno tutte lo
   stesso risultato. Non conta *chi* si apparenta: conta che **qualcuno** lo faccia
   dall'altra parte del confine.

   ### Le due conclusioni

   Fin qui i dati. Queste due sono quello che i dati dicono, e sono la ragione per cui
   questo punto sta al secondo posto della coda invece che fra le cose da valutare.

   **1 · Vale più della metà dell'errore residuo, nel momento in cui il modello è più
   letto.** Il banco dichiara **4,5 seggi** di errore a due mesi dal voto e **1,7
   nell'ultima settimana** sul totale di blocco. Un apparentamento ne vale **uno**: nella
   settimana in cui l'errore è 1,7 e la pagina viene letta di più, quell'uno è **più della
   metà di quel che resta da sbagliare**. E il margine del 120° seggio **oggi è 0,0012**,
   il più stretto delle sette istantanee del banco — cioè non stiamo guardando un caso
   medio, stiamo guardando l'estremo. **Non è una raffinatezza: è la stessa grandezza
   dell'incertezza che il modello dichiara**, e sarebbe una fonte di errore nota lasciata
   fuori mentre se ne dichiarano di più piccole.

   **2 · Vanno implementati tutti o nessuno.** Mapparne metà **rende il divario
   sistematico invece che casuale**, ed è peggio che non mapparne nessuno: oggi il modello
   sbaglia in modo simmetrico rispetto agli apparentamenti, perché non ne vede nessuno;
   con metà della mappa sbaglierebbe **sempre nella stessa direzione**, quella dei blocchi
   le cui coppie sono state annotate. Un errore casuale si dichiara nell'intervallo, uno
   sistematico no — e il banco misura il primo, non il secondo. Da cui anche la regola
   pratica: **se al 16 ottobre la mappa è incompleta, si pubblica senza apparentamenti e
   lo si dichiara**, non con quelli che si sono trovati. (La data qui diceva 8 settembre:
   è il termine delle liste, non quello degli accordi, e la regola vale al **secondo**.)

   **Corollario, e non è un dettaglio di implementazione: `dhondt()` e
   `ripartoVeloce()` vanno toccati nello stesso commit.** Il primo fa la proiezione, il
   secondo le 20.000 simulazioni; toccarne uno solo farebbe dire due cose diverse alla
   stessa pagina — la proiezione con gli apparentamenti e le probabilità senza. È la
   strada doppia di sempre, e qui **nasce insieme alla funzionalità**: va legata da una
   prova nello stesso commit che la introduce, non dopo.

   **Da sapere prima di implementare**: un apparentamento non è un dato di sondaggio ma
   un **fatto dichiarato**, con una data e una fonte, come i veti. Va nell'anagrafica con
   la data dell'annuncio, perché la serie storica del modello ricalcola il passato: una
   coppia annunciata il 22 agosto non deve retroagire su una proiezione di luglio.
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

    **Il conto è arrivato una seconda volta il 23 agosto 2026**, e questa volta senza
    guardie. Lo stub non aveva `setAttribute` **affatto**: la prima riga di pagina che ha
    scritto un attributo su un elemento reso — l'`aria-label` del comando degli accordi di
    eccedenza — ha fatto morire **tutte e sei** le suite alla prima chiamata, con zero
    asserzioni ciascuna. Rimedio scelto: **l'attrito è stato messo nello stub, non nella
    pagina**. Niente guardia d'uscita in `rApp()` — sarebbe stata la stessa riparazione
    sbagliata di allora — e invece un `attr:{}` vero con `setAttribute` / `getAttribute` /
    `removeAttribute` e `hidden` nelle sei copie. Lo stub deve poter *fare finta* di essere
    un elemento; non deve mentire su **che cosa un elemento sa fare**.

    E la copia dello stub è essa stessa una strada sestupla: sei `El()` quasi identici, e
    la modifica di oggi è stata applicata a mano sei volte.
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

**E gli altri tre pulsanti delle ipotesi non ce l'avevano**, benché siano lo stesso caso:
«Solo ultimi 7 giorni», «Lista Unita araba» e la scorciatoia dell'house effect hanno
l'etichetta **fissa**, quindi a schermo lo stato lo dice la classe `.on` e a un lettore di
schermo non lo diceva **niente** — una leva accesa e una spenta si annunciavano identiche.
Chiuso il 23 agosto 2026 in `rTesta()`, con l'esclusione esplicita del quarto, il comando
degli accordi di eccedenza, che è dell'altra grammatica. La regola è **scritta**, non
dedotta: `if(b.id!=='k-app')`.

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

## L'indice sotto i 660: la voce accesa, la barra tolta, la sbirciata

Applicato il 22 agosto 2026. Sotto i 660 la fascia dell'indice è un nastro orizzontale
(`flex-wrap:nowrap; overflow-x:auto`): a 380 è largo **1891px in una finestra da 358**,
cioè il **18,9% visibile** e 1533 fuori.

### La voce accesa non veniva mai portata in vista

`scrollLeft` restava **zero per sempre**, perché niente lo muoveva: dalla terza sezione in
poi la pastiglia accesa stava fra x 276 e x 1713. **L'indice segnalava dove sei su un
nastro che non lo mostrava**, e su undici punti di scorrimento campionati otto avevano la
voce attiva fuori schermo.

Rimedio: `inVista(nav, a)` centra la voce accesa muovendo `nav.scrollLeft` **a mano, non
con `scrollIntoView`** — quello scorre tutti gli antenati scorrevoli, documento compreso,
e con la fascia appiccicata a `top:0` una voce tagliata dal bordo farebbe scorrere la
pagina: l'indice combatterebbe contro il dito. Verificato su otto passi che attraversano
un cambio di sezione: `scrollY` chiesto e ottenuto coincidono otto volte su otto.

La posizione si ricava dai **rettangoli resi più lo `scrollLeft` corrente**, non da
`offsetLeft` — quello si misura dall'antenato posizionato, che qui è la fascia stessa,
`position:sticky` contando come posizionata.

Sopra i 660 il nastro va a capo e non scorre: `inVista` esce alla prima guardia, e
`indice.js` lo prova **contando le scritture** di `scrollLeft`, non il valore finale —
col solo valore il serraggio riporterebbe comunque a zero e la guardia potrebbe sparire
senza che nessuno se ne accorga.

### La barra di scorrimento tolta, e non è cosmesi

**A riposo, in questo browser, la barra non si vedeva già**: è in sovrimpressione,
`offsetHeight − clientHeight = 0` anche forzando `scrollbar-width:auto`. Il problema è
dove le barre sono classiche, e il conto è questo:

| | nav | `.idx` | `.idx.on` | contro `scroll-margin-top:112px` |
|---|---|---|---|---|
| barra in sovrimpressione | 33,3 | 51,3 | 102,4 | ✔ |
| **barra classica da 11px** | 44,3 | 62,3 | **113,5** | ✘ **sfora di 1,5px** |
| **senza barra e senza `padding-bottom:5px`** | **28,3** | **46,3** | **97,4** | ✔ e −5px per schermata |

Quei 5px di `padding-bottom` esistevano **per la barra** — il commento nel foglio lo
diceva — e se ne sono andati con lei. Togliere la barra rende l'altezza **indipendente
dalla piattaforma**, che è quello che serve a una costante come `scroll-margin-top`.
Nessun modo di scorrere si perde: il dito trascina, la rotella scorre, il fuoco porta il
nastro da solo (misurato: fuoco sull'undicesima voce, `scrollLeft` 0 → 1533).

### La sbirciata garantita, al posto della sfumatura

Tolta la barra, il segnale che il nastro continua è **la pastiglia tagliata al bordo**, e
regge quasi sempre. Misurato sulle undici posizioni di riposo, cioè venti bordi: una
pastiglia tagliata si vede in **20 su 20**, il **testo** tagliato in **19 su 20**, con un
minimo di 31,6px. Il ventesimo cade: alla sezione 3 il bordo sinistro finiva dentro
l'imbottitura di coda della prima voce — **6,6px di niente** — mentre la seconda restava
intera, così il nastro sembrava cominciare lì.

Rimedio: se a un bordo dove c'è ancora nastro si vede meno di **18px di testo**, lo
scorrimento si sposta quel tanto che basta. **Costo: zero pixel, zero colori, nessun
comando, nessun ascoltatore.** Cambia **una sola posizione su undici** — la terza, da 175
a 153 — e sul browser mostra esattamente 18px del testo precedente.

**Il vincolo che la rende sicura**: la voce attiva non dev'essere **mai** scoperta. È
serrata fra le due posizioni estreme che la tengono intera, e se non c'è spazio la
sbirciata si rinuncia — meglio nessun segnale che perdere la voce che il lettore cerca.
Lo slittamento disponibile vale `(finestra − larghezza della pastiglia)/2`, cioè fra 47,2
e 135,6px, e ne servono 22.

**La sfumatura è stata scartata, e non per il difetto che sembrava.** Una `mask-image`
sfuma verso il **trasparente**, quindi non conosce nessun fondo e non ne servono due per i
due temi: quel problema non c'era. Restavano gli altri due, e sono decisivi — servirebbe
un ascoltatore di `scroll` più due classi per accenderla solo dal lato giusto, e
soprattutto **attenua del testo**, che è la famiglia dell'invariante 9. Non essendo
`opacity` non comparirebbe da sola nell'inventario di `test/suite/opacita.js`:
**nascerebbe con un buco**.

### Due cose che la prova ha imposto al codice

- **Le guardie sugli estremi sono state tolte** perché ridondanti: oltre la fine del
  nastro non esistono voci, quindi la ricerca del candidato non trova niente e lo
  scorrimento non si muove. Una guardia che nessuna mutazione fa cadere è codice che
  nessuna prova esercita.
- **La misura del testo al bordo ha perso il parametro di verso.** La prima stesura
  prendeva un `verso` e lo usava per scegliere fra coda e testa: **invertirlo non faceva
  cadere nessuna prova**. Riscritta come «la parte della scatola d'inchiostro che cade
  dentro la finestra», vale identica ai due bordi e non c'è più niente da invertire. *Una
  forma che non si può sbagliare vale più di una prova che coglie l'errore.*

E una asserzione scritta e tolta: «dove il bordo resta debole è perché il serraggio lo
vietava» **cadeva** in una finestra da 240 sulle sezioni 5, 6 e 9 — non per un difetto, ma
perché lì i due bordi entrano in **conflitto**: scoprire a sinistra ricopre a destra. Il
vincolo che si pretende è quello di sicurezza, e basta quello.

## La soglia dei 61 negli istogrammi: tre mosse che sono un blocco solo

Applicate il 22 agosto 2026. Sono tre e vanno insieme, perché **la terza da sola
peggiora la seconda**. La prova è `test/suite/soglia.js`, 31 asserzioni.

### 1 · Il dominio può escludere la soglia che il grafico esiste per mostrare

È il difetto grosso, e non era registrato da nessuna parte. `mn` e `mx` uscivano dai
**soli quantili simulati** — `q(arr,.002)-1` e `q(arr,.998)+1` — quindi quando un blocco
crolla la soglia esce dal tratto disegnato:

| swing | dominio della coalizione | x61 | che si vedeva |
|---|---|---|---|
| −6 | 30–57 | **504,4** su un viewBox largo 460 | **niente**: né linea né etichetta |
| −5 | 30–59 | **471,1** | niente |
| −4 | 30–60 | 456 | la linea a quattro unità dal bordo, l'etichetta già tutta fuori |

**Non è un difetto della resa stretta.** Il viewBox è fisso, quindi a 1265 succede
identico: si nota meno perché tutto è più grande. E non lo diceva niente — il grafico
perdeva in silenzio la cosa per cui esiste.

Rimedio: `mn ≤ 60` e `mx ≥ 62`, **non 61 e 61**, così la soglia ha sempre almeno un
cestello per parte e si legge l'attraversamento invece di un bordo. Costa qualche
cestello vuoto agli estremi — a swing −6 si passa da 28 a 33 cestelli e la barra si
stringe del 15% — e i cestelli vuoti erano **già previsti**: il contorno
dell'evidenziazione ha un'altezza minima apposta, scritta per un altro motivo.

### 2 · L'etichetta si ribalta, e il ribaltamento è dimostrabile

Era sempre a destra della linea, e il bordo del viewBox la tagliava (`svg:root` ha
`overflow:hidden`). Misurato: **nello stato predefinito, 12 render su 12** — di 0,2
unità in cinque e di 12,4 (8,8px a 380, circa due caratteri) negli altri sette, perché
il dominio oscilla fra `mx=65` e `mx=66` **fra un Monte Carlo e l'altro**. Sullo swing,
9 stati su 26, fino a 136 unità, cioè zero per cento visibile.

`ETIW` è la larghezza **dichiarata**: 12 unità per unità di corpo. Misurata su undici
famiglie — la pila del foglio dà 8,57, Times 7,68, Georgia e Tahoma 9,30, Verdana 10,30
— quindi 12 sta il 17% sopra la più larga vista e il 40% sopra quella che la pagina usa.
**Sovrastimare non costa niente**: fa ribaltare un po' prima del necessario, mai troppo
tardi.

**La sicurezza è algebrica, non statistica.** Perché il ribaltamento serva, `x61`
dev'essere oltre `W−6−ETIW`; e lì a sinistra restano `W−12−ETIW` unità. A corpo 15,5
sono 262 contro le 186 che servono. Il caso «non ci sta da nessuna parte» **non esiste
finché `ETIW ≤ (W−12)/2 = 224`**, e siamo sotto del 17%. La garanzia **non** è «a
sinistra ci sta sempre» — a swing −6 l'opposizione ha `x61` a 159,4 e a sinistra non ci
starebbe — ma «**quando a destra non ci sta, a sinistra sì**». È l'unica implicazione
che serve, ed è quella che la prova asserisce.

### 3 · Il corpo scala sotto i 660, come già faceva la tendenza

Il viewBox è fisso e l'SVG scala al contenitore: a 380 il reso è 326px, fattore
**0,7087**, quindi un `font-size` 10 rende **7,09px reali**. `#k-trend` aveva già
`MOB`/`FS`; `istogramma()` era l'unico dei quattro disegni senza. Con `FS=1,55`
l'etichetta rende **10,98px**, i numeri d'asse 10,98, la didascalia 11,55.

**L'invariante 8 — niente sotto i 5px a 380 — passava a 7,09.** È «misurare convince di
aver guardato» un'altra volta: la proprietà scelta era vera e non copriva quella che
serviva.

E **da sola questa mossa peggiora la 2**: a corpo 15,5 l'etichetta passa da 85,7 a 132,7
unità e il taglio sale **da 14 stati su 26 a 20**. I due numeri sono nella prova, che
gira lo spazzolamento a tutti e due i corpi apposta.

### 4 · Le due fasce, e l'alone che è vissuto un giorno

**L'alone `--card` è esistito per un giorno solo, ed è la storia più istruttiva di
questo blocco.** Difetto trovato misurando: l'etichetta sta **dentro** l'area delle barre
e di norma sta **a destra** della linea, cioè sopra quelle a opacità piena. Su 50 stati,
in **8** finiva sopra barre piene, dove `--ink` sta a **1,56** in chiaro sull'opposizione
e **2,04** in scuro sulla coalizione. L'alone chiudeva quel contrasto — e non chiudeva
niente altro.

**Perché non bastava, e il numero lo dice.** Misurato con l'inchiostro vero sugli stessi
50 stati: l'etichetta si sovrapponeva **a delle barre in 33** e **alla fascia dell'80% in
48**. Il contrasto era il sintomo più acuto del 18%; la sovrapposizione era il 96%.
L'alone era il rimedio al sintomo.

**Rimedio alla causa: le due fasce come margini del disegno.**

| | prima | **desktop** | **sotto i 660** |
|---|---|---|---|
| `T`, fascia alta | 16 | **32** | **42** |
| `PH`, area del disegno | 152 | **152** | **152** |
| `B`, fascia bassa | 42 | **50** | **78** |
| `H` del viewBox | 210 | **234** | **272** |

**`PH` non cambia mai, ed è la parte che va difesa**: la variante a `H` fissa avrebbe
pagato i margini coi dati — a 380 la barra più alta sarebbe scesa da 107,7 a **67,3px**
resi. Le fasce scalano col corpo, il disegno no. Il triangolo della stima puntuale è una
forma, non un testo: non scala, e ha una riga sua dentro la fascia alta.

**È la stessa mossa dei marcatori della tendenza**: i dischi sono entrati nell'SVG e la
crescita se l'è presa il margine, non il grafico. E trasforma sei numeri sciolti — `y=24`,
`y=14`, `y=16`, `H−B+15`, `+24`, `+38` — in quote **derivate** da `T`, `PH`, `B`.

**Chiude anche una collisione latente che nessuno aveva mai vista**: il triangolo della
stima puntuale stava a `y 2..10` e l'etichetta a `12,57..33,73`, cioè a **2,5 unità**, e
alla **stessa x quando la stima puntuale vale 61** — il caso più interessante. Non è mai
avvenuta; ora sono due righe dichiarate e una prova le tiene separate.

**L'alone è stato tolto**, e la prova che lo chiedeva è stata sostituita da quella forte:
**nessun testo si sovrappone a una barra né alla fascia dell'80% né al triangolo**. Vale
per qualunque testo, anche uno aggiunto domani. Verificato prima di applicare le fasce che
fallisse: **43 su 50 sulle barre e 50 su 50 sulla fascia** con la scatola stimata per
eccesso che la prova usa (33 e 48 con l'inchiostro vero misurato su browser).

### La didascalia cominciava dentro il disegno e finiva sul bordo

Stesso difetto, altra estremità, e i numeri sono quelli che hanno deciso `B`:

| | 380 | 760 | 1265 |
|---|---|---|---|
| scala dell'80% → cima della didascalia, **prima** | **1,42px** | 8,79 | 6,81 |
| altezza dell'inchiostro della didascalia | 11,55 | 10,00 | 11,35 |
| rapporto | **0,12** | 0,88 | 0,60 |
| fondo della didascalia → bordo del viewBox, **prima** | **0,00px** | 2,93 | 2,27 |
| | | | |
| scala → didascalia, **dopo** | **13,47** | **17,58** | **13,62** |
| fondo → bordo, **dopo** | **4,11** | 5,86 | 4,54 |
| asse → cima dei numeri, **dopo** | **8,72** (era 2,83) | 11,72 | 9,08 |

**La regola che ha deciso i numeri**, e vale a tutte e due le larghezze: *fra il disegno e
la didascalia ci dev'essere almeno l'altezza dell'inchiostro della didascalia stessa*.
`soglia.js` prova quella, non i numeri — così se il corpo cambia la regola resta.

Costo in altezza reso: **+44,0px per grafico a 380** (148,8 → 192,8), +35,2 a 760
(307,7 → 342,9), +27,2 a 1265 (238,3 → 265,5). A 380 sono +88px sulla sezione 1, cioè il
**+4,2%** di quella sezione e lo **0,5% della pagina**.

### Un serraggio scritto, misurato e tolto

La didascalia dell'80% scala anche lei, e a corpo 16,3 misura 260 unità con la pila del
foglio e 309 nel caso peggiore: sembrava servire un serraggio del centro dentro il
viewBox. **Misurato: non morde in nessuno dei 26 stati** — il centro della fascia resta
fra 182,1 e 237,6, con 27,5 unità di margine nel caso peggiore e 52,1 con la larghezza
vera. Era codice che nessuna prova poteva esercitare, cioè la cosa contro cui questo file
mette in guardia. **Tolto, e al suo posto c'è una prova che misura quel margine**: se un
giorno una distribuzione spinge la fascia di lato, cade e si vede. Il serraggio l'avrebbe
nascosta.

### Misurato su browser dopo, che è la parte che la suite non dice

A **380**, sui 26 stati dello swing: zero senza il cestello dei 61, zero con la linea
fuori, **zero sforamenti**. L'etichetta va a sinistra 18 volte e a destra 8 — le usa
tutte e due. A swing −6 il dominio della coalizione è **30–62** e la linea si vede, dove
prima non c'era. A **760** il corpo resta 10 (14,65px resi) e lo sforamento è zero in
tutti e 26 gli stati: **il ribaltamento ripara anche lì**, perché il taglio non era mai
stato un difetto del mobile.

## Il comando degli accordi: quanti ne applica, e se è un fatto o un'ipotesi

Applicato il 23 agosto 2026, insieme al termine del 16 ottobre. Il pulsante diceva
**«Apparentamenti proposti»**: la cosa, non l'azione, e soprattutto non diceva a chi lo
premeva se stesse guardando un fatto o un'ipotesi.

### L'etichetta

Grammatica dell'azione, la stessa di «Escludi / Includi» nell'house effect: il nome dice
che cosa succede premendo, **il cambio di nome è il riscontro**, e quindi **niente
`aria-pressed`** — direbbe il contrario di quello che si legge.

| stato | testo visibile |
|---|---|
| leva spenta, 1 annunciato | **Aggiungi 1 accordo annunciato** |
| leva accesa | **Togli 1 accordo annunciato** |
| 3 annunciati | **Aggiungi 3 accordi annunciati** |
| 0 annunciati, o termine passato | il pulsante **non c'è** |

**«Annunciato» e non «proposto»**: è il fatto verificabile — c'è una data e una fonte —
mentre «proposto» dice anche chi ha proposto a chi, che nell'offerta unilaterale di Abbas
del 22 agosto non è simmetrico.

**IL NUMERO VIENE DA `contoApp()`, NON DA `APPARENTAMENTI.length`.** `filtraRiparto()`
scarta due categorie — un accordo con una lista sotto soglia, e il secondo accordo che
riusa una lista già impegnata — quindi i due numeri divergono il primo giorno in cui una
lista scende sotto soglia: l'etichetta direbbe due e il riparto ne applicherebbe uno. Il
conto esce dallo stesso filtro che fa il riparto, chiesto **due volte**, senza l'ipotesi e
con, perché l'etichetta deve dire che cosa cambierebbe anche a leva spenta. Gli scartati
sono dichiarati **con la ragione** nella riga di esito, e la ragione nasce dentro il
filtro: raccoglierla altrove sarebbe la strada doppia di sempre.

**Il nome accessibile COMINCIA col testo visibile, per costruzione e non per attenzione.**
WCAG 2.5.3 chiede che il nome accessibile *contenga* l'etichetta che si legge, o chi
comanda a voce dice quello che vede e non succede niente. Nell'house effect la cosa era
gratis — l'etichetta è una parola sola, «Escludi» — qui l'etichetta è una frase, e
concatenarla (`eti = testo + ' al riparto: ' + quali`) è l'unico modo che non si può
sbagliare riscrivendo. `aria-label` e `title` sono la stessa stringa, nata una volta sola:
idioma di `ETI`.

**E i due versi hanno due preposizioni**: si aggiunge **al** riparto e si toglie **dal**
riparto. La prima stesura le aveva scambiate — «Aggiungi dal riparto» — e nessuna prova
poteva accorgersene finché non è stata scritta quella che confronta i due versi.

### La riga di esito

Non è la didascalia del pulsante: **dice i depositati, che nessun comando governa** perché
sono già dentro ogni numero della pagina, accesa o spenta la leva. Tre regimi, generati.

| quando | che cosa dice |
|---|---|
| oggi, leva spenta | «Nessun accordo di eccedenza è ancora depositato: il riparto non ne applica nessuno. 1 annunciato e non ancora depositato, quindi fuori: … Il termine è il 16 ottobre 2026, **non il deposito delle liste**.» |
| oggi, leva accesa | «… applicato per ipotesi: Ra'am e Lista Unita araba. **Vale 1 seggio**, e lo sposta fra i blocchi: **Blocco Netanyahu 51 → 50 · Partiti arabi 12 → 13**. È un'ipotesi, non un fatto.» |
| dall'8 settembre | «N accordi depositati, sempre nel riparto: … M annunciati e non ancora depositati, quindi fuori.» |
| dal 16 ottobre | «Il termine è passato il 16 ottobre: … Gli accordi annunciati e mai depositati non contano più.» — e la leva sparisce |

**Nomina i blocchi, non solo i seggi**, e la ragione è una misura: l'unico accordo in
tabella oggi sposta un seggio **da un blocco all'altro in tutti e venticinque** gli stati
dello swing. «Un seggio» sarebbe vero e depotenziato.

**L'effetto si misura chiedendo lo stesso riparto senza gli annunciati**: `dhondt()` ha
preso un terzo argomento facoltativo con le coppie già filtrate, così la riga non ha un
secondo modo di contare i seggi. Un array vuoto è legittimo e vale «nessun accordo» — in
JavaScript un array vuoto è vero, quindi `if(!cp)` non lo confonde con «non passato».

### Misurato su browser vero, il 23 agosto 2026

| | 380 | 1265 |
|---|---|---|
| etichetta, larghezza | **195,4px** (era 163,1: **+32,3**) | 195,4 |
| nastro delle ipotesi | 2 righe → **3**, 65 → **101px** | resta **1 riga**, 29px |
| riga di esito, altezza | **103,5px** | 34,5px |
| sforamento del documento | **zero** | zero |
| contrasto della riga (`--mute`) | **5,24** chiaro · **5,10** scuro | idem |
| contrasto dell'etichetta | 10,04 · 8,39 | idem |

Costo complessivo a 380: **+139,5px** nel pannello delle ipotesi, tutti sotto la piega dei
comandi e nessuno sui grafici. **Se un giorno pesassero**, la cosa da accorciare è la riga
e non l'etichetta: l'etichetta è il canale che dice fatto-o-ipotesi.

**Provato premendo, sulla pagina vera**: etichetta, nome accessibile e riga cambiano
insieme, il sommario passa a «blocco Netanyahu 50», e ripremendo tutto torna identico.
Zero errori in console.

### La prova, e le due cose che ha imposto

`test/suite/apparentamenti.js` è passata da 46 a 120 asserzioni. Due scelte che valgono
oltre questo caso:

- **non si asserisce una misura.** Quanto valga l'accordo dipende dall'archivio del giorno
  — oggi uno, il 22 agosto zero, e sul seme `BASE` che gira in jsdom **zero** — quindi la
  prova rifà il conto e verifica che la riga dica **quello**. Scritto «vale un seggio»
  sarebbe caduto alla prima rilevazione nuova, dicendo «difetto» dove c'era un sondaggio in
  più. E siccome il seme non esercita il ramo che si muove, la prova **cerca** una coppia
  che sposti un seggio invece di sceglierne una a caso: quale sia dipende dall'archivio;
- **il termine si prova con `al`, non con l'orologio.** `coppieAl(data, true)` valuta a una
  data qualunque — è la stessa che usa la serie storica — quindi le prove sul 16 e sul 17
  ottobre non dipendono dal giorno in cui girano, e il confine si prova esatto: il giorno
  del termine l'accordo vale ancora, il giorno dopo no. Per la pagina **resa** non basta:
  lì l'orologio si congela, alla vigilia del termine e al giorno dopo, e le due date
  escono da `termineApp()`.

**E `npm run spazzola` ha trovato la stagionalità che avevo appena scritto.** La prima
stesura di queste prove dava per scontato di essere eseguita **prima del 16 ottobre**:
accendeva la leva e pretendeva che l'accordo entrasse nel riparto. Con l'orologio al 23
ottobre — la data predefinita dello spazzolamento — cadeva, e cadeva **avendo ragione il
codice**. È l'invariante 10 nella forma meno riconoscibile: non una data letterale in una
fixture, ma un `null` che vuol dire «adesso». Provate le sei date 9 settembre · 16 e 17 e
23 ottobre · 20 novembre · 1º febbraio: zero cadute.

**Mutata, undici volte, e tutti e undici i mutanti sono morti**: il termine portato al
deposito delle liste (11 asserzioni), la leva che ignora il termine (2), i depositati che
non vengono prima nel filtro (1), il numero dell'etichetta preso da `APPARENTAMENTI.length`
(1), il nome accessibile che non comincia col testo visibile (2), le due preposizioni
scambiate (1), l'`aria-pressed` tolto agli altri tre pulsanti (3), il ritiro che non spegne
niente (2), il comando che resta dopo il termine (1), `dhondt()` che ignora le coppie
passate (1), gli scarti senza ragione (1).

E la mutazione ha trovato **un difetto nelle prove stesse**: due asserzioni cercavano
«vale N seggi» in minuscolo, e dopo che la frase è diventata una proposizione a sé — «Vale
1 seggio» — erano verdi soltanto perché il seme di prova prendeva l'altro ramo. Sono
ancorate alla maiuscola nessuna delle due, adesso.

## Calendario

| Data | Cosa |
|---|---|
| 8 settembre 2026 | Deposito delle liste: la mappa dei partiti si chiude |
| 6 ottobre 2026 | Comincia la propaganda televisiva |
| **16 ottobre 2026** | **Termine per gli accordi di eccedenza** — undici giorni prima del voto |
| 23 ottobre 2026 | Silenzio demoscopico: ultimi sondaggi pubblicabili |
| **27 ottobre 2026** | **Voto** |
| 4 novembre 2026 | Risultati ufficiali |

**Le due date non sono la stessa, e per tre commit il modello ha detto che lo erano.** L'8
settembre si chiudono le **liste**; gli accordi di eccedenza si depositano fino
all'**undicesimo giorno prima del voto**, trentotto giorni dopo. Verificato su tre cicli:
2019 il 6 settembre per il voto del 17, 2021 il 12 marzo per il 23, 2022 il venerdì
precedente il 1º novembre. La data non è scritta a mano da nessuna parte — `termineApp()`
è `VOTO` meno `TERMINE_APP_GG` — e da lì escono la riga del calendario, la leva e la nota.

E **cade sette giorni prima del silenzio demoscopico**: nell'ultima settimana di campagna
gli accordi saranno tutti noti e non arriveranno più sondaggi. È un fatto che riguarda come
si legge la proiezione in quei giorni — l'unica cosa che può ancora muovere i numeri è un
apparentamento — ed è scritto nella nota metodologica.

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

### Lo stato al 23 agosto 2026, sera

Scritto per ripartire senza la conversazione. Ultimo commit spinto: **`55b0b87`**, CI e
Pages verdi. Sul banco di oggi le prove sono **1293**.

**Quello che è entrato il 23 agosto**, dopo gli apparentamenti: il **termine del 16
ottobre** — che non è l'8 settembre, e la nota diceva il contrario — con la sua riga di
calendario ricavata da `VOTO`; il **comando degli accordi** che dice quanti ne applica e in
che stato, con la riga di esito che dichiara i depositati e l'effetto in blocchi; lo stato
`ritirato` per un annunciato che muore; `aria-pressed` sui tre pulsanti delle ipotesi a
etichetta fissa, che non l'avevano; e gli **attributi veri nello stub delle sei suite** del
punto 13, che senza morivano tutte alla prima riga di pagina che scriveva un `aria-label`.

#### Prima di toccare qualunque cosa

- **Il banco su browser vero è `.claude/serve.mjs`**, sotto controllo di versione apposta:
  `node .claude/serve.mjs` serve la radice su `http://localhost:8788`, quindi
  `dati/archivio.json` si carica col fetch relativo e si misura **la pagina vera**, non il
  seme BASE. In `.claude/launch.json` è la configurazione `misure`.
- **Le sue cinque trappole** stanno in «Il banco di misura su browser vero», e non sono
  aneddoti: il tema che segue `prefers-color-scheme` se non lo si forza dal selettore; le
  transizioni congelate che danno geometrie **stabili e false**; il clone misurato fuori
  da `#kn26` che non eredita nessuna regola; un `<style>` iniettato in `<head>` che **non
  ha effetto**, perché il foglio del modello sta nel `body` e vince per ordine di
  sorgente; e l'`IntersectionObserver` che **non scatta in una scheda non in primo piano**
  — l'indice non accende niente e sembra rotto.
- Più una del DOM: `#k-house` e `#k-veti` vengono riscritti per intero a ogni render,
  quindi un riferimento preso prima di un `click()` è morto subito dopo.
- **`npm run verifica` deve passare per intero prima di ogni commit**, e nessun commit
  senza che l'autore lo chieda in quel messaggio.

#### Pubblicato e verde

Oltre a quanto già elencato più sopra (tavolozza della consegna 6, scala divergente
dell'house effect, banco di prova come dato, `formaTitolo()`, invariante 10):

- **l'indice porta in vista la voce accesa** e non ha più la barra di scorrimento: sotto i
  660 il nastro è largo 1891px in una finestra da 358, e `scrollLeft` restava a zero per
  sempre. C'è la **sbirciata garantita**: a un bordo dove c'è ancora nastro si vedono
  almeno 18px di testo vicino, senza mai scoprire la voce attiva;
- **la soglia dei 61 negli istogrammi**: dominio bloccato attorno a 61, etichetta che si
  ribalta, corpo scalato sotto i 660, e le **due fasce come margini del disegno** —
  l'etichetta non sta più dentro l'area delle barre;
- **la tabella dell'analisi** sotto i 660 ha quattro colonne vere invece di una orfana;
- **i veti** hanno la riga della spiegazione sopra le pastiglie, e non si svuota più;
- **il simulatore** apre con la scorciatoia accesa, e la composizione del blocco Netanyahu
  ha **una sola sorgente**, il filtro sull'anagrafica;
- **la tendenza** dirada asse e mesi sotto i 660;
- **l'archivio è un `<details>`** attaccato al modulo che apre;
- **le due frasi del deposito** hanno il ramo condizionale su `depositoPassato()`.

#### I testi dell'autore, applicati il 22 agosto 2026

Erano il punto 1 della coda e bloccavano il resto. La storia sta in
`docs/stato-testi-titolo.md`; qui c'è quello che serve a chi tocca il codice.

- **L'h1 e il `<title>` escono dalla stessa funzione**, `testoTitolo()` e
  `titoloCorto()`, dallo stesso `formaTitolo(blocchi(SEG))`. Le celle sono **dodici**, i
  testi **quarantotto** — lungo e corto, prima e dopo il voto. Il `<title>` sta sotto i
  60 caratteri con la coda «· Knesset 2026», e la prova lo misura su ogni cella e ogni
  valore di `[X]`, tre cifre comprese.
- **L'h1 del markup è un ripiego per chi apre il file senza JavaScript**, e per questo non
  afferma nessun risultato: sarebbe l'unica cosa che quel lettore legge, e sarebbe vera
  soltanto il giorno in cui è stata scritta.
- **`[P]` SEGUE LA FRASE, non la cella**, e la sorgente è dichiarata in `TIT_FONTE_P`.
  In sei celle su dodici la frase parla della configurazione e `[P]` è la frequenza con
  cui il blocco nominato fa **esattamente** `[X]` seggi. Nelle altre quattro la frase
  enuncia una proposizione più larga, ed è quella che il lettore legge attaccata al
  numero: `f5c`, `f5o4` e `f5e` dicono «nessun campo ha i numeri per governare» e
  prendono `[P]` dallo **stallo** (`MC.st`), `f5o3` dice «le serve l'appoggio dei partiti
  arabi» e lo prende dallo **scenario arabo** (`MC.vA`). Sono le stesse variabili delle
  quattro pastiglie in cima, non copie ricalcolate.
  Il numero che spiega perché: con la frequenza della configurazione `f5o4` e `f5e`
  direbbero **zero** accanto a una frase che afferma lo stallo — un numero che smentisce
  la frase che ha di fianco, e il lettore le vede insieme.
  Costo della frequenza esatta: zero. `res.coal` e `res.oppz` sono già ordinati, quindi è
  una doppia bisezione, 0,036 ms per chiamata su 20.000 elementi. **Non aggiungere un
  istogramma nel ciclo**: sarebbe una seconda strada per lo stesso numero.
- **La firma**: `Daniele Angrisani · Modello previsionale Knesset 2026 · @putino`, con
  `@putino` su `https://x.com/putino`, **senza FocusAmerica — è un modello personale**.
  Il 22 agosto era passata alla variante con la testata e il 23 è tornata a questa: la
  forma buona è questa, e la ragione non è grafica.
  **Per l'embed**: chi incorpora incorpora un lavoro firmato da una persona, non un
  prodotto della testata, e il testo che accompagnerà il frammento da copiare va scritto
  di conseguenza — è la differenza fra «il modello di FocusAmerica» e «il modello di
  Daniele Angrisani», e la seconda è quella vera.
  Contrasti misurati sulla pagina resa: testo **4,93** in chiaro e **5,54** in scuro,
  collegamento **8,75** e **6,45**.
  Il controllo strutturale adesso **elenca i collegamenti esterni del markup**, non solo
  quelli generati dal JavaScript: la riga diceva «nessuno» mentre in pagina ce n'erano
  due. Non era un falso verde — nessuna asserzione era violata — ma era una riga che si
  legge come un inventario e non lo era. La lista bianca delle CHIAMATE DI RETE resta
  Wikipedia e basta: un href non carica niente e non entra lì.
- **Il sommario è a una riga sotto i 660**, ed è la partita delle due date sciolta: vedi
  «Le due date» qui sotto.
- **Restano senza prosa**: verdetto, pastiglie, istogrammi, simulatore. Nel **verdetto** la
  frase deve dire **da quando** si confronta (`PREC.taglio` e `PREC.data` sono due campi
  distinti); negli **istogrammi** «quanti seggi mancano» si dice da `61 − q(MC.coal, .50)`,
  la mediana, **non** da `blocchi(SEG)`.

#### Le due correzioni hanno dato un risultato diverso da quello che si chiedeva

È la parte da non riscoprire.

**«La coalizione a 60 sono due casi» — no, è uno.** coal = 60 lascia esattamente 60 seggi a
tutti gli altri messi insieme, quindi nessuna loro somma arriva a 61: la coalizione a 60 è
sempre e solo stallo pieno. Verificato per esaurimento sulle 302.621 configurazioni.
**La distinzione che si chiedeva esiste, ma sta sull'altro blocco**: l'opposizione a 60 con
almeno un seggio arabo (5,57% delle simulazioni) contro l'opposizione a 60 senza (0% oggi,
possibile).

**E c'era un terzo caso che nessuno aveva chiesto.** La partizione delle quattro forme di
base era scritta su TRE blocchi. Sono quattro: c'è l'ago della bilancia, e quando prende
seggi esiste la configurazione in cui **nemmeno opposizione più arabi arrivano a 61**. Lì
il titolo diceva «i partiti arabi sono decisivi», che è falso. Misurato: **1,45% delle
simulazioni**, più di tre celle per cui era stata scritta una prosa a sé (0,84%, 0,69%,
0,56%). Da qui la base 4 corretta — «nessuna maggioranza possibile» invece di «coalizione a
60» — e tre celle nuove: `f4`, `f5o4`, `f5e`. **I loro sei testi sono gli unici sei su
quarantotto non dettati dall'autore**, e vanno riletti.

**Una cosa da sapere se si rileggono i testi.** Due frasi attaccano `[P]` a una proposizione
più larga della configurazione: «nel [P]% delle simulazioni nessun campo ha i numeri per
governare» e «nel [P]% delle simulazioni le serve l'appoggio dei partiti arabi». Con la
regola applicata quei numeri valgono 1,3% e 5,6%, mentre le due proposizioni prese per sé
sono vere nel 2,7% e nell'80% dei casi: affermazioni vere ma parziali. Se si preferisce la
lettura larga si cambia `datiTitolo()` in un punto solo, e `titolo.js` cade subito.

#### Le due date, l'orizzonte e la fascia del dopo-voto

- **`k-upd` è l'ultima VERIFICA riuscita**, letta da `dati/stato-job.json`, che il lavoro
  notturno riscrive solo quando arriva in fondo: se una guardia lo ferma, quel file non
  viene toccato, ed è ciò che rende lo stallo misurabile. **`k-fresh` è l'ultimo
  SONDAGGIO.** Le due divergenze si dichiarano, con due soglie scritte una volta sola:
  `GAP_VERIFICA` = 2 giorni (il job gira ogni notte) e `GAP_SONDAGGI` = 7 (in finestra
  escono più di due rilevazioni a settimana, quindi sette giorni di silenzio sono un fatto
  e non un guasto). Senza il registro — doppio clic da disco — la testata **dichiara** di
  non sapere, invece di ripiegare in silenzio sulla data del sondaggio.
- **`ORIZZONTE` non è `GIORNI`.** Il conto alla rovescia serve alla testata e il 28 ottobre
  vale zero; l'orizzonte è la distanza fra il voto e la **rilevazione più recente**, e a
  zero giorni il Monte Carlo stringerebbe gli intervalli al minimo attorno a una proiezione
  che nessuno ha più ricalcolato — falsa precisione che **cresce mentre il dato invecchia**.
  Una regola sola, senza rami: prima del voto le due differiscono dei giorni fra l'ultimo
  sondaggio e oggi (due, il 22 agosto 2026), dopo l'orizzonte resta fermo. La banda dell'80%
  del blocco misura 12 seggi il 22 agosto e 12 il 10 novembre.
- **La fascia `#k-postvoto`** compare dal 28 ottobre e dice che la pagina non mostra
  risultati elettorali. Il testo si scrive **sempre**, a comparire è solo la classe: così il
  giorno in cui si vede non è il giorno in cui viene scritto per la prima volta. La data del
  voto viene da `VOTO`, che adesso è l'**unica** sorgente — anche il calendario e il banco
  di prova la prendono da lì, ed erano due copie in più.
- **Il sommario a una riga sotto i 660.** Misurato a 375px: le tre voci chiedevano 706,3px
  di testo dentro 353, cioè quattro righe e 70px. In forma corta 321,9px su **una riga**,
  15,5px, con 31 di margine. Sopra i 660 non cambia niente. Sono **due forme dello stesso
  dato** — l'idioma delle schede dell'house effect — e `date.js` le lega numero per numero.

#### Un accoppiamento da non riscoprire rompendolo

**I 44px dei bersagli e `scroll-margin-top:112px` sono legati.** Portare tutti i bersagli
a 44px costa **520px** sull'intero documento, cioè il **3,19%** — ma alzare le sole voci
dell'indice costa 16px sul nastro, che portano `.idx` da 46,3 a 62,3 e **`.idx.on` da 97,4
a 113,4: oltre i 112 dello `scroll-margin-top`**, cioè la fascia coprirebbe di 1,4px la
sezione appena raggiunta da un'ancora. È esattamente il difetto chiuso togliendo la barra
di scorrimento. **I due vanno mossi nello stesso commit, con la costante ricalcolata.**

Il pezzo grosso è uno solo: i pulsanti «Escludi» dell'house effect, **20px** di altezza,
il 37% del costo totale. Oggi i bersagli sotto i 44 sono **76 su 99**.

### Nell'ordine, quando si riprende

1. ~~I testi~~ — **applicati il 22 agosto 2026**: h1, `<title>`, le due frasi del
   deposito, il lede dell'house effect, la firma, la nota metodologica calcolata e le due
   date. Vedi «I testi dell'autore, applicati il 22 agosto 2026» qui sopra.
   **Restano senza prosa** verdetto, pastiglie, istogrammi e simulatore, e restano da
   rileggere i **sei testi delle tre celle nuove** del titolo, che sono gli unici non
   dettati dall'autore.
2. ~~Gli apparentamenti~~ — **fatti il 23 agosto 2026**, e il giorno stesso corretti: il
   termine **non** è l'8 settembre ma il **16 ottobre**, undici giorni prima del voto.
   Vedi il punto 2 di «Ancora da fare» e «Il comando degli accordi». Resta da riempire la
   tabella mano a mano che gli accordi vengono annunciati — **il grosso arriverà fra fine
   settembre e il 16 ottobre**, non l'8 settembre — e da portare a `depositato` quelli
   firmati. Quello che segue è la misura che li aveva messi al secondo posto.

   ~~Sale qui perché **non è più
   ipotetico**: il 22 agosto 2026 Abbas ha proposto alla Lista Unita araba un accordo di
   eccedenza, quindici giorni prima del deposito. Il modello oggi tratta ogni lista come
   NON apparentata, e il confine del 120° seggio è a **0,0012 di divisore**: quasi ogni
   apparentamento ne sposta uno, e quasi sempre lo toglie a Yisrael Beitenu.
   **Il banco di prova dice che non è un caso limite**: sulle sette istantanee storiche,
   **174 coppie su 362 spostano un seggio (48%), e nel 64% dei casi il seggio viene
   dall'altro blocco**. Vale **uno** su un errore dichiarato di **1,7 seggi nell'ultima
   settimana**: più della metà dell'incertezza residua, nel momento in cui la notizia si
   scrive. La misura completa — le coppie, le percentuali, e il perché quella araba oggi
   vale zero — sta nel punto 2 di «Ancora da fare». **La tabella si riempie mano a mano
   che gli accordi vengono annunciati**, non tutta insieme l'8 settembre.
3. **La tabella dei sondaggi** (`#k-tab`, sezione 11): è la sola sezione che non è stata
   guardata in questo giro. Ventidue colonne dentro `.scroll`, larga 1288,9px, che non
   sfora perché scorre da sé — ma **a 380 il 74% resta fuori**, e nessuno ha misurato che
   cosa si legga davvero: quali colonne servono su un telefono, se la data e l'istituto
   debbano restare fissi mentre le liste scorrono, e se le 173 righe abbiano bisogno di un
   limite o di un caricamento progressivo.
4. **La revisione visiva della tavolozza nuova**: non l'ha ancora vista nessuna persona.
   La prima riga della lista di controllo dice dove guardare — l'ago della bilancia, che
   ha il pavimento dicromatico più basso, e in scuro `otzma` `#BCD2FF`.
5. **Le quattro cose sul mobile**, appena l'autore le dice. Una delle quattro —
   «Giudaismo Unito Torah» che va a capo — **è caduta da sé** con la tabella dell'analisi.
6. **Modalità `?embed=1`** (punto 1 di «Ancora da fare»). L'incorporabilità tecnica è già
   verificata; quel che manca è la modalità.
7. **Esportazione PNG dei quattro disegni** (punto 7): inventario fatto, decisioni prese,
   codice non scritto. **Viene dopo la revisione visiva**, non prima.
8. **Le meta Open Graph per l'anteprima nelle condivisioni.** Oggi la pagina **non ne ha
   nessuna**: condividendo il link su Facebook, X o WhatsApp non esce nessuna immagine.
   Servono `og:title`, `og:description`, `og:image`, `og:url`, `twitter:card` e le
   varianti. Sta **dopo il PNG** perché ne riusa i pezzi, e prima della verifica a
   scenari.

   **Una decisione già presa: non la bandiera israeliana.** È l'immagine del paese, non
   del modello, e in un'anteprima si legge come una presa di posizione. **L'emiciclo dice
   «proiezione parlamentare» e porta il numero che conta** — dentro il suo viewBox ci sono
   già «MAGGIORANZA 61» e i tre totali di blocco.

   **Quattro punti da diagnosticare quando ci si arriva**, e i primi numeri sono già presi
   il 22 agosto 2026:

   1. **Cosa esce oggi.** Il `<head>` ha solo `charset`, `viewport`, `title`, due favicon
      in data URI e `theme-color`: **zero `og:`, zero `twitter:`, nessuna
      `description`, nessun `canonical`, nessun `<img>` nel markup.** Un aggregatore
      costruirebbe il titolo dal `<title>` e per il resto pescherebbe dal corpo — che
      senza JavaScript comincia con l'h1 statico e poi con **l'avviso di avvio**: «Il
      modello non è ancora partito. Questa pagina calcola tutto nel browser…». È il primo
      paragrafo che uno scraper trova, ed è quanto di peggio potrebbe finire in
      un'anteprima.
   2. **L'immagine dev'essere un file statico.** Le anteprime **non eseguono
      JavaScript**: né l'SVG reso né un PNG generato al volo servono a niente, e nemmeno
      un `og:image` che punti a una rotta dinamica. **La genera il lavoro notturno**
      insieme all'archivio, con gli stessi pezzi dell'esportazione PNG — serializzare
      l'SVG, iniettare `xmlns`, `width`, `height` e `font-family`, rasterizzare. Il job
      oggi tocca **solo `dati/`** e committa tre file; aggiungerne un quarto è dentro le
      sue guardie, ma va deciso: serve un rasterizzatore in CI (il job gira su Node, non
      in un browser), e va misurato cosa costa in tempo e in peso del repository.
   3. **Le dimensioni.** Lo standard è **1200×630**, rapporto 1,9048. L'emiciclo ha
      viewBox `0 0 430 232`, rapporto **1,8534** — quasi identico. A piena altezza entra
      in **1168×630** con 16px di margine per lato e **zero** in verticale: nessuno spazio
      per la targa. Con la targa, misurato: disegno largo **1000 → alto 540, restano 90**;
      **900 → 486, restano 144**; **860 → 464, restano 166**. L'inchiostro vero è
      386,7×217 con 21,6 unità di margine vuoto a sinistra, quindi c'è un po' di
      ricentratura da fare prima di incorniciare.
   4. **Titolo e descrizione: generati o fissi.** Se devono seguire lo stato del modello
      come l'h1, **non possono cambiare a ogni render** — un aggregatore legge il file
      servito, non la pagina calcolata. Quindi **li scrive il job**, nello stesso passaggio
      dell'immagine, e diventano il primo caso in cui il lavoro notturno tocca
      `index.html`: oggi è escluso per principio — «ogni commit del job su quel file
      sarebbe per definizione un'anomalia» — e quella regola andrebbe riscritta con
      un'eccezione stretta e provata, oppure le meta vanno in un frammento a parte.
      **È la decisione che pesa di più delle quattro.**
9. **I 44px dei bersagli**, in un giro suo e con `scroll-margin-top` ricalcolato nello
   stesso commit: vedi «Un accoppiamento da non riscoprire rompendolo» qui sopra.
10. **La prova di regia per l'8 settembre.** Il deposito delle liste è il giorno in cui
   quasi tutte le cose annotate qui vengono esercitate insieme, e **non si improvvisa la
   sera stessa**: va provato prima, su una copia dell'archivio. Cosa succede quando
   arrivano liste nuove, fusioni e scissioni tutte insieme — il parser che apre una issue
   con le colonne da mappare, `COLORE.capienza()` e la scala di ripiego per l'ago della
   bilancia (che in tema chiaro ha **zero slot liberi**), la soglia delle schede
   dell'house effect che sale a ~1190 con quindici colonne, i veti che cambiano sotto,
   `PRESET.netanyahu` che si aggiorna da sé, `dentro` per le componenti nuove, e le 24
   righe di gennaio-aprile che aspettano una mappatura a mano. La riga «scenari di lista»
   della verifica a scenari è la lista di controllo; questa è la **prova generale**.

   **E una seconda prova di regia, più piccola, per il 16 ottobre**: il termine degli
   accordi di eccedenza. Quel giorno il comando sparisce, la riga di esito cambia ramo e
   gli annunciati mai depositati smettono di contare — con l'orologio congelato al 15, al
   16 e al 17 si guarda che le tre schermate dicano tre cose coerenti, e che il calendario
   dica «oggi» il 16 e «passato» il 17. Le prove lo verificano; nessuno l'ha ancora
   **guardato**.
11. **La verifica a scenari** (in fondo al file): l'ultima cosa prima di pubblicare.
12. **Un inventario delle funzionalità con i numeri veri**, per i post di lancio.
    **Non i post — quelli li scrive l'autore — ma il materiale**: cosa fa il modello e
    come, quante simulazioni Monte Carlo, quante rilevazioni in archivio e quante nella
    finestra, il banco di prova sulle tre elezioni con l'errore per istantanea,
    l'aggiornamento notturno e che cosa fanno le sue guardie, l'incorporabilità.
    Va compilato **alla fine**, quando i numeri sono quelli definitivi: un inventario
    scritto adesso invecchierebbe prima di essere usato.
13. **Cercare le altre strade doppie.** Ogni valore che raggiunge lo schermo per più di un
    percorso e non ha una prova che li leghi è il prossimo colore di blocco. In questo
    giro ne sono cadute due — la composizione del blocco Netanyahu (**quattro** copie, una
    nel parser notturno) e il calendario elettorale — e una si è rivelata **non** essere
    tale: la numerazione delle sezioni ha due meccanismi ma una sorgente sola.
14. **Il campo `esito`** in archivio (punto 8-bis): senza, dopo il voto la pagina può
    parlare solo della propria stima, e l'ottava istantanea che sposterebbe il 2,7 non
    esiste.
15. Minore, dal filtro dell'emiciclo: la via d'uscita al tocco.
16. Dal parser Wikipedia: **24 righe di gennaio-aprile** con una cella unica che copre
    Ra'am, Hadash–Ta'al e Balad. Il parser le respinge dichiarandolo: vanno mappate a mano.
17. Sempre dal parser: **le righe-evento arrivano in inglese** in una cronologia italiana.
18. **L'altezza uniforme delle righe della tabella dell'analisi** non è provabile in jsdom:
    se si tocca il corpo, la colonna o il font, va rimisurata col browser.

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
**guardando la pagina**, non dalla suite. Le 1293 prove dicono che il modello non si è
rotto; non dicono che la pagina si veda. Dopo ogni push, aprire
<https://angrisanidj.github.io/modello-israele/> e guardarla nei due temi.

---

## Revisione visiva finale: la lista di controllo

Scritta il 22 agosto 2026 per una passata sola, sezione per sezione. Serve a distinguere
**quello che qualcuno ha già guardato reso** da **quello che nessuno ha mai visto**: in due
giorni sono entrate parecchie cose che le prove dichiarano sane e che nessun occhio ha
ancora confermato. Le 1293 prove dicono che il modello non si è rotto; non dicono che la
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

### «Aggiornato al» non dice quello che sembra — CHIUSO A METÀ

Trovato il 22 agosto 2026 preparando l'embed, e non è un difetto dell'embed: è un difetto
della pagina che l'embed renderebbe pubblico.

**La prima metà è chiusa lo stesso giorno**: `k-upd` legge `dati/stato-job.json` e dice
l'ultima verifica riuscita, `k-fresh` dice l'ultimo sondaggio, e le due divergenze si
dichiarano — vedi «Le due date, l'orizzonte e la fascia del dopo-voto». **La seconda no**:
`finestra()` prende ancora come riferimento `t0 = new Date(l[0].data)`, cioè di nuovo il
sondaggio più recente, e il sottotitolo della sezione 2 continua a poter scrivere «N
rilevazioni pubblicate negli ultimi 7 giorni» contando da un'ancora che non è oggi. È la
stessa famiglia, ed è l'unico pezzo rimasto: quello che segue lo descrive per intero.

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

---

# La verifica a scenari: l'ultima cosa prima di pubblicare

**Va eseguita dopo l'esportazione PNG e dopo l'embed**, cioè quando non resta altro da
aggiungere. Non è una ripetizione della suite e non è la revisione visiva: **le prove
esercitano una leva alla volta, e qui si esercitano insieme.** Ogni difetto di questa
famiglia trovato finora — la colonna orfana dell'analisi, il dominio degli istogrammi che
escludeva la soglia, la riga dei veti cancellata dal `pointerleave` — stava in una
*combinazione*, non in un comando.

È una lista **da eseguire**, non un promemoria: ogni riga dice che cosa deve succedere e
che cosa sarebbe un difetto. Quello che si trova si annota come dice «Come annotare quello
che si trova»: che cosa si vede, a quale larghezza, in quale tema, prima di ipotizzare
perché.

## 1 · Comandi combinati — insieme, non uno per volta

Ogni riga si prova a **380 e a 1265**, nei due temi.

| combinazione | deve succedere | sarebbe un difetto |
|---|---|---|
| swing **−6** + affluenza **42%** + Direct Polls escluso + Lista Unita **spenta** | i seggi fanno 120; l'emiciclo separa esattamente 60; la linea del 61 è dentro il disegno degli istogrammi; le liste sciolte sono dichiarate dalla nota | una somma diversa da 120; la soglia fuori dal viewBox; una lista che sparisce dalla tabella senza che nessuno lo dica; una serie della tendenza piatta a zero |
| swing **+6** + affluenza **69%** + tutti gli istituti esclusi tranne uno | il modello calcola su una rilevazione sola o dichiara che non può; l'house effect mostra schede vuote invece di numeri inventati | uno scarto calcolato sulla media di sé stesso; NaN in una cella; un istituto confrontato con niente |
| **tutti** gli istituti esclusi | un messaggio esplicito, non una pagina vuota | grafici disegnati su zero rilevazioni; un errore in console che ferma il render |
| swing agli estremi + le tre scorciatoie del simulatore + due veti disattivati | la riga di esito concorda con la barra; i veti violati sono elencati; la scorciatoia accesa è quella giusta o nessuna | la barra verde con la riga che dice «sotto quota 61»; una scorciatoia accesa su una selezione che non è la sua |
| affluenza agli estremi **mentre** l'emiciclo è filtrato su una lista | il filtro sopravvive al ricalcolo, o si spegne dichiarandolo | il filtro acceso su una lista che non ha più seggi |
| «Solo ultimi 7 giorni» con la finestra vuota | la pagina dice che non ci sono rilevazioni in finestra | una media su zero elementi; la proiezione di ieri presentata come di oggi |

## 2 · Le date, con l'orologio congelato

Si rende la pagina con `TZ=Europe/Rome` e la data forzata — il banco di `deposito.js` e
`giorni.js` mostra come. **Con `TZ=UTC` metà di questi casi non si manifesta.**

| data | deve succedere | sarebbe un difetto |
|---|---|---|
| **7 settembre** | il deposito è futuro in tutte e tre le sedi: calendario, nota metodologica, limiti | una delle tre che ne parla già al passato |
| **8 settembre**, il giorno stesso | il calendario dice «oggi», la prosa parla ancora al futuro | «passato» il giorno stesso; il conto alla rovescia che scatta a mezzogiorno |
| **9 settembre** | il calendario dice «passato», le due frasi sono al passato, e **nessuna delle due è identica al 7** | una frase al futuro; il segnaposto ancora al suo posto invece della prosa dell'autore |
| **25 ottobre**, cambio d'ora | il conto alla rovescia è lo stesso alle 9 e alle 23 | un giorno di scarto a seconda dell'ora in cui si apre |
| **26 ottobre** | «1 giorno», non «1 giorni» | l'accordo sbagliato, che `acc()` esiste per evitare |
| **27 ottobre** | «oggi»; titolo e sommario non parlano del voto al futuro | «mancano 0 giorni»; una frase che invita a seguire una campagna in corso |
| **28 ottobre** | la pagina parla al passato della propria stima, e **non** del risultato, che non ha | un risultato inventato; un conto alla rovescia negativo |
| **4 e 10 novembre** | tutte le tappe passate; le due frasi del deposito ancora al passato | un ramo che «scade» e torna al futuro |
| **job fermo da 3, 10, 30 giorni** — `dati/stato-job.json` vecchio, archivio invariato | la pagina distingue la data dell'ultimo sondaggio da quella dell'ultima verifica riuscita | «aggiornato al …» che si congela e non dice nulla: è il difetto già registrato in «Aggiornato al non dice quello che sembra» |

## 3 · Scenari di lista — l'8 settembre in prova

| scenario | deve succedere | sarebbe un difetto |
|---|---|---|
| una **fusione che si scioglie**: `dentro` tolto da due componenti | contenitore e componenti non compaiono mai insieme, in nessuna delle nove funzioni consumatrici | gli stessi elettori contati due volte; la somma che non fa 120 |
| una **lista nuova** in anagrafica **senza** posizione di tinta | `COLORE` avvisa al primo slot oltre la saturazione e **fallisce con un errore esplicito** dal secondo | il colore `--mute` restituito in silenzio, cioè una lista dipinta come testo disabilitato |
| **due liste che chiedono lo stesso slot** di tinta | la guardia sui colori duplicati scatta | due liste indistinguibili nell'emiciclo, e nessuno che lo dica |
| una lista nuova nel **blocco Netanyahu** | `PRESET.netanyahu` la include da sé, e il parser di Wikipedia valida la colonna «Gov» con lei dentro | il preset aggiornato e la partenza no; il parser che respinge righe valide per «blocco discordante» |
| **quindici colonne** nell'house effect | la soglia delle schede va rimisurata: con tredici era 1075, con quindici sale a ~1190 | la tabella che ricompare e sfora, cioè il difetto che le schede esistono per chiudere |
| una lista che **perde tutti i seggi** | sparisce da pastiglie e scorciatoie senza rompere il confronto degli insiemi | una scorciatoia che non si accende più mai |

## 4 · Archivio degenere

| archivio | deve succedere | sarebbe un difetto |
|---|---|---|
| **azzerato**, nessun sondaggio | l'avviso di avvio resta, o un messaggio dice che non c'è niente da calcolare | grafici vuoti disegnati come se fossero dati; divisioni per zero |
| **un solo sondaggio** | proiezione e mediana coincidono; l'intervallo dell'80% è degenere e la pagina lo dichiara | un intervallo di ampiezza zero presentato come misura; l'house effect che confronta l'unico istituto con sé stesso |
| **due sondaggi dello stesso istituto** | il grappolo di istituto non azzera il peso di entrambi | peso totale zero, cioè NaN dappertutto |
| **ultimo sondaggio vecchio di due mesi** | la finestra a 60 giorni è vuota o quasi e la pagina lo dice; il sottotitolo della sezione 2 **non** scrive «N rilevazioni negli ultimi 7 giorni» contando da un'ancora sbagliata | la frase falsa sul presente già registrata in «Aggiornato al non dice quello che sembra» |
| **importato da un file estraneo**: JSON valido, liste ignote | il modulo respinge dichiarando quali colonne non riconosce | liste ignote accettate in silenzio; un archivio sostituito senza conferma |

## 5 · Tre larghezze × due temi × undici sezioni

**Questa è la revisione visiva vera**, e va fatta per intero: **sessantasei schermate**.
A **380 · 760 · 1265**, in **chiaro e scuro forzati dal selettore** — con «auto» si misura
quello che decide il sistema. Transizioni spente prima di ogni misura di geometria.

Per ogni sezione, tre domande in quest'ordine: **si legge?** (contrasto e corpo reso);
**sta dentro?** (nessuno sforamento orizzontale del documento); **dice la stessa cosa dei
numeri?** (la prosa generata e il grafico non si contraddicono).

Sarebbe un difetto: un testo sotto 4,5 di contrasto; un corpo reso sotto i 9px negli SVG;
un documento che scorre in orizzontale a 380; una didascalia che nomina un valore diverso
da quello disegnato sopra; un elemento che a 760 sta e a 1265 no, o viceversa.

## 6 · L'embed dentro un iframe cross-origin

Nei tre casi già misurati il 22 agosto 2026 — iframe semplice, `sandbox="allow-scripts"`,
`sandbox="allow-scripts allow-same-origin"` — da un'**origine vera e diversa**, non
`file:` né `data:`, che hanno origine opaca e non direbbero niente. Con il controllo che
sa fallire nella stessa pagina: un quarto iframe verso `https://github.com/`, che **deve**
produrre l'errore `frame-ancestors`. Se non lo produce, il canale di rilevazione non
funziona e i tre verdi non valgono niente.

| caso | deve succedere | sarebbe un difetto |
|---|---|---|
| tutti e tre | la pagina carica, nessun errore in console, `dati/archivio.json` risponde 200 | un errore di CSP o di CORS; l'archivio che non si carica e il seme BASE che passa per dato fresco senza dirlo |
| dentro `sandbox` senza `allow-downloads` | il pulsante di esportazione PNG **non c'è**, oppure dichiara che lì non funziona | un pulsante che non scarica niente e non lo dice |
| larghezza dell'ospite 320, 380, 900, 1400 | nessuno sforamento orizzontale dentro il riquadro | il documento dell'ospite che scorre per colpa nostra |
| tema dell'ospite chiaro e scuro | il tema segue il selettore, non l'ospite | il riquadro che eredita un fondo che non conosce |
| **`cache-control: max-age=600`** | si sa che un embed può mostrare una copia vecchia fino a dieci minuti | crederla fresca e annunciarla come tale |

## Come si chiude

La verifica a scenari è fatta quando **ogni riga di queste sei tabelle è stata eseguita e
annotata**, non quando «sembra a posto». Quello che si trova va scritto nella forma della
sezione «Come annotare quello che si trova»; quello che si ripara va provato con una prova
nuova, e la prova va **mutata**, o non si sa se coglierebbe il difetto una seconda volta.

---

## Le sei suite che scadevano con la finestra vuota — CHIUSE

Trovate il 23 agosto 2026 cercando le fixture stagionali, e non erano quello che si
cercava. Il conteggio delle date letterali nelle prove dà dieci file: spazzolando
l'orologio **nessuno di quei dieci cade**. Cadevano sei suite che di date letterali non
ne hanno nessuna — `colonne`, `crono`, `graf`, `v4`, e `final` e `verifica` che
sollevavano alla prima riga con **zero asserzioni**.

**Una causa sola, e l'aveva creata la riparazione del giorno prima.** Da quando
`finestra()` si ancora a oggi invece che all'ultimo sondaggio, la finestra dei sette
giorni **può essere vuota**: la tabella dell'analisi si svuota — dichiarandolo, ed è
giusto così — e `PREC` non esiste, perché il taglio a sette giorni non lascia fuori
niente. Le sei leggevano righe che non c'erano più.

**E non era un problema di ottobre.** Bastano sette giorni senza una rilevazione nuova: il
silenzio demoscopico del 23 ottobre — quattro giorni prima del voto — o il primo giorno in
cui il lavoro notturno si ferma. E il cancello del job è proprio `npm run verifica`, che
gira *prima* del commit: il job si sarebbe fermato da solo nella settimana in cui la
pagina conta di più, senza che niente fosse rotto.

### Come sono state chiuse, e il difetto vero che c'era sotto

**Un difetto della PAGINA, non delle prove.** `final.js` e `verifica.js` non cadevano:
sollevavano leggendo `k-deck`, il sommario di testata, che non era mai stato scritto. Il
sommario stava **dentro `rAnalisi()`**, dopo il ramo di uscita: a finestra vuota la
funzione usciva prima, e la testata restava senza sommario. Parla della proiezione — i
seggi dei due blocchi, quante rilevazioni, quante simulazioni — che ha una finestra di
sessanta giorni, non di sette. Adesso è `rSommario()`, chiamato dal render.

**Le prove: si ribasa l'archivio, non si scrive una fixture.** `test/frescura.js` sposta
tutte le date della stessa quantità — rilevazioni **e** cronologia — così che la più
recente cada oggi. Niente di relativo cambia: distanze, pesi per recenza, grappolo di
istituto, era pre-fusione restano identici, e cambia solo il rapporto con oggi, che è
l'assunzione che quelle suite facevano in silenzio. Una fixture sintetica avrebbe
cambiato quello che provano — la forma delle colonne, il testo della cronologia, il
grafico — mentre `mediana.js` la fixture ce l'ha di diritto, perché prova il meccanismo
della mediana e non un archivio.

**Due attese sono cambiate perché erano scritte su date assolute**, e in tutti e due i
casi la proprietà giusta era un'altra e non invecchia:

| era | è |
|---|---|
| «la serie parte da gennaio» | «la serie copre anche l'era pre-fusione»: il confronto è fra due date d'archivio |
| «countdown sticky» cerca la parola *giorni* | «o quanto manca, o che si è votato»: dopo il 27 ottobre la fascia dice «voto concluso», e ha ragione |

**Lo strumento resta, e adesso gira da solo**: `npm run spazzola` rilancia tutto il banco
con l'orologio al 23 ottobre e dice che cosa cade. Va rifatto a mano dopo ogni modifica a
un'àncora temporale, e dal 23 agosto 2026 **sta nel lavoro notturno**, dopo il push: i
quattro minuti che costa non si notano in un job che gira una volta al giorno, ed è
l'unico posto che se ne accorge PRIMA del giorno in cui scatta.

**Non ferma il commit dell'archivio, e sta dopo il push apposta.** Una prova che cadrà fra
due mesi non è una ragione per non pubblicare i sondaggi di stanotte: il passo cattura
l'esito invece di propagarlo, e quando cade **apre una issue** come per le colonne di
lista non riconosciute — titolo fisso, così non se ne accumula una per notte.

## Il tetto sta sul gzip, e prima contava la cosa sbagliata

Cambiato il 23 agosto 2026, il giorno in cui il vecchio tetto è stato sfondato **mentre il
file compresso era a un terzo di esso**.

`struttura.mjs` diceva `html.length < 400*1024`, cioè contava i CARATTERI. Contava male
per due ragioni, e la seconda è quella che importa:

- un carattere non è un byte: con gli accenti e i trattini tipografici di questo file 400
  KB di caratteri sono **403 KB su disco**, e i due numeri divergono man mano che la prosa
  cresce;
- soprattutto, **nessuno scarica i caratteri**. Pages serve gzip, e il file che il lettore
  riceve pesa **132 KB** contro i 400 del conteggio. Il tetto aveva un margine del 200%
  rispetto alla grandezza che l'invariante voleva proteggere — «deve poter essere salvato,
  aperto con un doppio clic, incorporato altrove» — e nel frattempo **fermava il lavoro
  notturno**, perché `npm run verifica` è il suo cancello.

### Il numero, ricavato

| | |
|---|---|
| il file compresso adesso | **131,7 KB** (livello 9) · 132,1 al livello predefinito |
| **+ l'archivio da qui al voto** | **6,1 KB** — 91 byte di gzip per rilevazione, misurati a parità di formattazione, per le 61 che a 0,94 al giorno separano oggi dal 27 ottobre, più le 8 dell'allineamento pendente di `BASE` |
| **+ quello che resta da scrivere** | **30 KB** — embed, esportazione PNG, meta Open Graph, i 44px dei bersagli, il campo `esito`: cinque interventi alla mediana misurata di 2,9 KB di gzip per commit, arrotondata per eccesso a 6 |
| **+ un commit grosso di riserva** | **10,4 KB**, il più pesante degli ultimi otto |
| | **= 178,6 → tetto a 179 KB**, arrotondato al KB superiore |

La crescita misurata per commit, in gzip, sugli ultimi otto: 0,2 · 1,3 · 1,8 · 6,0 · 6,0 ·
10,4 · 4,0 · 0,7 KB. Il numero non è tondo perché non è stato scelto: è la somma di quattro
addendi che si possono rifare, ed è scritta nel commento accanto alla regola.

**Il controllo stampa tutti e due i numeri** — gzip e caratteri — così il secondo resta
visibile senza essere il cancello.

### La potatura di BASE resta disponibile, e non è stata fatta

Se un giorno il tetto del gzip venisse toccato, la strada da guardare **prima** di alzarlo
di nuovo è togliere da `BASE` le **60 rilevazioni pre-fusione** di gennaio-aprile: valgono
**16,3 KB di caratteri**, e si perdono **solo in modalità di ripiego** — chi apre la pagina
da Pages carica `dati/archivio.json`, che le ha tutte.

**Non è stata fatta, e la ragione è un prezzo vero**: chi apre `index.html` con un doppio
clic vedrebbe la serie storica cominciare a maggio e la tendenza perdere quattro mesi. Col
tetto sul gzip quel prezzo non serve pagarlo. Resta annotata qui perché il giorno in cui
servisse, la misura c'è già.

La terza strada — accorciare i commenti, 144,6 KB in 389 blocchi, il 35% del file — resta
l'ultima, e non per sentimentalismo: sono la memoria delle trappole già pagate, e questo
file ne ha pagate parecchie due volte.
