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
npm test             # estrae il JS e lancia le 2090 prove
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

E `npm run verifica` ha un terzo esito, dal 23 agosto 2026: `··`, per un controllo che in
quel contesto **non si applica** — oggi ce n'è uno solo, il diff del commit notturno, che
fuori dal lavoro notturno non ha niente da giudicare. Stamparlo OK sarebbe il falso verde di
sempre; ometterlo cancellerebbe l'unica traccia che il controllo esiste.

## Il banco di misura su browser vero

Le prove girano in jsdom, che **non fa layout**: larghezze, altezze, contrasti resi e
sovrapposizioni non le vede nessuna delle 1734. Per quelle c'è un server statico da otto
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

- **UN PREDEFINITO CHE DIVENTA UN'IPOTESI SPACCA UNA DOMANDA IN DUE, E LA FUNZIONE CHE
  RISPONDEVA A TUTTE E DUE COMINCIA A TACERE NEL CASO PEGGIORE.**
  Scritto il 27 agosto 2026, il giorno in cui `PAR.inbilico` è nata accesa. È la trappola
  più difficile da vedere di tutte quelle qui elencate, perché **non produce un verde
  sbagliato: produce un silenzio**, e un silenzio somiglia a «non c'è niente da dire».

  `statoLeve()` risponde a **«che cosa ha cambiato il lettore»**: confronta `PAR` con
  `PAR_DEF` e serve a dire a un servizio terzo che i numeri ricevuti non sono quelli che
  troverebbe all'indirizzo. È la domanda giusta **finché il predefinito è il conteggio
  della fonte** — e per mesi lo è stata, perché tutte le leve nascevano spente.
  `ipotesiNeiNumeri()` risponde a **«che cosa c'è dentro questi numeri»**, e la risposta
  non dipende da chi ce l'ha messo.

  Finché nessun predefinito era un'ipotesi le due domande avevano la stessa risposta, ed è
  precisamente la condizione in cui una sola funzione sembra bastare. Dal momento in cui un
  predefinito è diventato un'ipotesi, `statoLeve()` **tace proprio quando l'ipotesi è
  applicata** — perché nessuno ha cambiato niente — cioè tace nel solo caso in cui bisogna
  parlare. Una funzione sola per le due domande direbbe la cosa giusta per la ragione
  sbagliata, e continuerebbe a farlo senza che nessuna prova cada.

  **LA REGOLA CHE VALE OLTRE QUESTO CASO: il giorno in cui un altro predefinito diventa
  un'ipotesi, `ipotesiNeiNumeri()` deve saperlo.** Non `statoLeve()`, che continuerà a
  rispondere correttamente alla sua domanda. Chi accende una leva per difetto deve
  chiedersi se quello che ne esce sia un fatto o un'ipotesi, e se è un'ipotesi aggiungerla
  **là dentro** — è la funzione che alimenta tutto ciò che esce dalla pagina: il testo di
  condivisione, il prompt che va a un servizio terzo, la targa dell'anteprima. Vedi «Quello
  che esce dalla pagina deve portare l'ipotesi con sé».

  E il corollario che rende la regola verificabile: `ipotesiNeiNumeri()` parla **solo
  quando l'ipotesi sposta davvero un numero**. Dichiararne una che non cambia niente
  insegna a saltare la riga proprio prima del giorno in cui conta.

- **IL MISURATORE DI MUTANTI SBAGLIA IN DUE MODI, E TUTTI E DUE PRODUCONO UN VERDE.**
  Scritto il 26 agosto 2026 dopo esserci cascato tre volte in una sessione sola. È la
  trappola peggiore della famiglia, perché **uno strumento che dichiara morti i mutanti è
  peggio di uno che non c'è**: senza, si sa di non aver misurato; con, si crede di aver
  misurato e si va avanti. È «misurare convince di aver guardato» applicato allo strumento
  invece che alla proprietà.

  **1 · `execFileSync` tronca a 1 MB e UCCIDE il figlio.** Il `maxBuffer` predefinito è un
  megabyte, e superarlo non tronca soltanto: termina il processo e fa lanciare la chiamata.
  Una suite che stampa più di così risulta **fallita sempre**, quindi ogni mutante sembra
  morto e il banco dice 16 su 16. Successo con `embed.js`, che stampa 225 righe con i
  dettagli. Si passa `maxBuffer: 64*1024*1024`, e soprattutto si distingue **una suite che
  cade** da **una che esplode**: se il conteggio finale non si trova nell'uscita, il mutante
  non è morto — la suite non è mai arrivata in fondo, ed è un'altra cosa.

  **2 · `String.prototype.replace` sostituisce la PRIMA occorrenza, che può non essere la
  tua.** `sh[k]>=SOGLIA` compare due volte in `index.html` e la prima non è dentro
  `dhondt()`: il mutante veniva applicato a un'altra funzione, le prove restavano verdi, e
  il banco lo dichiarava **vivo**. Cioè il verdetto era esattamente rovesciato — si va a
  cercare l'asserzione che manca per una proprietà che è già coperta. Si usa
  `s.split(x).join(y)` quando la sede è ambigua, oppure si ancora a un contesto che compare
  una volta sola. E davanti a un mutante vivo **la prima cosa da controllare è che sia stato
  applicato dove si crede**: `grep -c` sulla stringa mutata, prima di scrivere una prova.

  **La difesa che vale per tutti e due è la stessa, ed è quella di sempre: un controllo che
  sa fallire.** Il misuratore esegue le suite sull'albero PULITO prima di cominciare e si
  ferma se non sono verdi. Senza quella riga, un banco rotto e un banco che non trova niente
  si scrivono allo stesso modo.

- **Il banco delle mutazioni POSSIEDE `index.html` finché gira, e non lo dice a nessuno.**
  Un misuratore di mutanti legge il file una volta all'avvio, lo tiene in memoria, e per
  ogni mutante scrive la versione guasta, esegue le suite e riscrive la copia buona. Finché
  gira, **il file su disco è suo**: quello che si vede lì non è quello che si sta
  scrivendo, ed è vero anche fra un mutante e l'altro.
  Successo il 23 agosto 2026: un `git checkout index.html` lanciato mentre il banco girava
  ha riportato il file a HEAD, cancellando il lavoro non committato. **Non se n'è accorto
  nessuno per qualche minuto**, perché al mutante successivo il runner ha riscritto la sua
  copia in memoria e tutto è tornato al suo posto — cioè il rimedio è arrivato per caso,
  dallo stesso meccanismo che aveva reso possibile il danno. Se il banco fosse morto in
  quell'istante, il lavoro sarebbe stato perso e basta.
  Due regole, e la seconda è quella che salva davvero: **mentre un banco di mutazioni gira
  non si tocca il file che muta, con nessun comando** — né git, né un editor, né una patch;
  e **quando lo si interrompe a metà, il file resta guasto**, quindi prima di rimettersi a
  lavorare si controllano le sedi di mutazione una per una. La seconda è già servita: il
  runner fermato con `TaskStop` aveva lasciato `f(resta)` al posto di `f(prossime)` nel
  comando dell'elenco, e sarebbe finito in un commit se il controllo non fosse stato fatto.
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
  workflows/aggiorna.yml   lavoro notturno: parser, guardie, commit dei file dati E della
                           sola regione «META DELLO STATO» di index.html, dove sta og:title
  scripts/aggiorna.mjs     le guardie (valuta) e il registro, funzioni pure provate da job.js
  scripts/dafare.mjs       compone dati/da-fare.json e il corpo della issue: funzioni pure
                           provate da dafare.js. Il markdown è una VISTA del JSON, non un
                           secondo elenco
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
  suite/dafare.js     il riepilogo notturno: ogni categoria sul suo caso e NON sul caso
                      buono, il silenzio quando non c'è niente, e la tabella degli accordi
                      invalida come voce che blocca
  suite/meta.js       le meta che legge chi non esegue il JavaScript: i due ripieghi
                      misurati, e il legame fra og:title e titoloCortoOra() su tutte e
                      dodici le celle. Prova anche scriviMeta(), cioè i modi in cui il
                      job deve RIFIUTARSI di toccare index.html
  suite/embed.js      la modalità incorporata: che cosa va via e che cosa resta, nei due
                      versi; la firma; la fascia della memoria; l'avviso dell'altezza; e la
                      nona domanda — la fascia del dopo-voto dentro l'embed, con l'orologio
                      congelato dopo il voto
  suite/tabella.js    l'archivio dei sondaggi nelle sue DUE forme. Desktop: colonne
                      raggruppate per blocco, i filetti dove il blocco cambia, e le 2805
                      celle confrontate una per una con l'archivio — un riordino che sposta
                      i valori non si vede a occhio. Sotto i 660: l'elenco che si apre, il
                      limite a 50 provato sulla PROPRIETÀ per cui è 50, il contatore a tre
                      numeri letto come lo leggerebbe un lettore, e le due forme legate
                      valore per valore e nello stesso ordine
  suite/direzione.js  «a parametri identici»: che ogni leva arrivi a tutti e due i termini
                      del confronto, che la frase esca dalla proprietà invece di starle
                      accanto, e che la lettura «com'era» resti in serieModello()
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
  stato-job.json      i conteggi di ieri, riferimento delle guardie del lavoro notturno.
                      Riscritto a OGNI notte riuscita, anche a mani vuote: prima solo
                      quando arrivavano rilevazioni, e k-upd dichiarava il falso
  da-fare.json        il riepilogo notturno, leggibile da una macchina: il conto in testa,
                      le voci con il testo originale e COSA SERVE PER CHIUDERLE. Esiste
                      sempre, anche vuoto — un file che manca è ambiguo
docs/
  stato-testi-titolo.md  i dodici testi decisi e le due correzioni che mancano
  regola-colore.md    la specifica dei colori: bande, settori, punti, distanze
  pubblicare.md       note di lavoro
  richiesta-design-consegna-5.md  i vincoli in ORDINE, non in parallelo: vedi in fondo
  richiesta-design-consegna-6.md  i tre punti dopo la verifica della consegna 5
  accettazione-consegna-6.md      che cosa si accetta, e le quattro righe rimaste
  forme-del-titolo.md             le nove celle dell h1 con le frequenze: si scrivono i testi da lì
  testi-quattro-blocchi.md        verdetto, pastiglie, istogrammi, simulatore: condizione,
                      grandezze disponibili e che cosa la frase deve dire — i quattro
                      blocchi che l anagrafica dei testi non copre ancora
  tabella-sondaggi-mobile.md  le tre forme proposte per la sezione 11 sotto i 660, con le
                      sei risposte per ciascuna e i numeri misurati a 380. La forma A è
                      stata applicata; le altre due restano scritte con la ragione per cui
                      non lo sono — e la terza è scartata per la promessa dei 120, non per
                      la forma
  aggiungere-un-apparentamento.md  il contratto per la sera del 16 ottobre: i campi, il
                      percorso, i dodici modi di sbagliare la riga e che cosa dice ciascuno,
                      e i passi di giudizio marcati
  tradurre-una-voce-evento.md      il contratto della cronologia: i due file, il legame che
                      e la data, e perche' la data si ferma dove il testo passa
  mappare-una-lista-nuova.md       il contratto dell 8 settembre: i sette posti nell ordine
                      giusto, il colore che avvisa e poi fallisce, i numeri da guardare
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

## Il confine dell'agente

Scritto il 23 agosto 2026, prima che l'agente esista, perché è il genere di regola che si
scrive prima o non si scrive più. Dal giorno in cui un agente prepara il lavoro del
mattino, **queste righe valgono per lui come le invarianti valgono per il codice.**

**La regola generale: l'agente prepara, una persona conferma, per tutto ciò che sposta un
numero.** Preparare vuol dire portare il diff, le fonti e la misura di che cosa cambia;
confermare vuol dire scrivere, o dire di scrivere.

### Categoria per categoria, perché non si deduce

| categoria | l'agente | perché |
|---|---|---|
| **accordi di eccedenza** | prepara il diff e **si ferma** | una riga sposta un seggio, e il seggio attraversa il confine fra i blocchi in venticinque stati di swing su venticinque |
| **mappature di lista** | prepara il diff e **si ferma** | id, blocco e `dentro` decidono chi entra nel riparto e chi conta due volte |
| **testo di una voce-evento** | può **proporre e applicare** | la prosa italiana non entra in nessun calcolo: la cronologia è un elenco di frasi |
| **data di una voce-evento** | **si ferma** | vedi qui sotto |

**La terza riga e la quarta sembrano la stessa cosa e non lo sono, ed è la ragione per cui
questa tabella esiste.** Verrebbe da dire che gli eventi non spostano numeri: sono frasi in
una cronologia, e infatti il testo si può cambiare senza che nulla si muova. **La data no.**
La data colloca il marcatore sull'asse della tendenza — dove cade il disco, quale
rilevazione gli sta accanto — e soprattutto decide la **terna dei trenta giorni** del
riquadro dell'evento isolato: «nei 30 giorni successivi: Netanyahu 51, opposizione 47,
arabi 11». Spostare una data di un giorno cambia tre numeri pubblicati, e li cambia in un
riquadro che il lettore apre premendo, cioè credendo di aver chiesto un dettaglio e non un
altro calcolo. Testo e data stanno nello stesso oggetto e sono due categorie di rischio
diverse.

E una regola che discende dalle prime due: **l'agente non sceglie mai fra `proposto` e
`depositato`, e non sceglie mai un id per un nome inglese.** Sono i due punti in cui una
notizia va interpretata, e interpretare è la cosa che una persona fa meglio e più
lentamente. I contratti in `docs/` li marcano con ⚖️.

### Davanti a un rosso, un agente non modifica mai una prova

**Se `npm run verifica` fallisce dopo una sua modifica, l'agente si ferma e chiede. Anche
quando il rosso è legittimo.**

Non è prudenza generica: è la difesa contro l'unico modo davvero pericoloso di sbagliare in
questo progetto. Una prova che cade dice una cosa sola — «quello che credevi non è vero» —
e ci sono due modi di farla tornare verde: capire, oppure cambiare l'attesa. Il secondo
costa dieci secondi, funziona sempre, e cancella l'unica misura che il progetto ha di sé
stesso. Un agente sbaglia più in fretta di una persona, e un banco verde per costruzione
non si distingue da un banco verde per merito **finché non lo guarda qualcuno**, che è
esattamente la cosa che non succede la sera prima di una pubblicazione.

Il rosso legittimo esiste — un'attesa può diventare obsoleta di proposito — e allora si
aggiorna **nello stesso commit, spiegando perché nel messaggio**. Ma la decisione che
un'attesa è obsoleta è una decisione, non una riparazione: la prende una persona.

Il caso è già capitato, e non a un agente: fino al 23 agosto 2026 aggiungere un accordo
legittimo faceva cadere **nove asserzioni** in `apparentamenti.js`, e la mossa sbagliata
era lì a portata di mano. Quelle attese ora derivano dalla tabella e non cadono più — la
tentazione è stata tolta invece che vietata, che è sempre la riparazione migliore — ma la
regola vale lo stesso, perché la prossima volta la tentazione arriverà da un'altra parte.

**Il corollario**: nessun commit e nessun push senza che una persona l'abbia chiesto in
quel messaggio. Vale già per me, vale per l'agente, e vale doppio perché il file è pubblico
e collegato a un giornale.

## Il lavoro notturno non è puntuale, e chi se ne accorge non può stare dentro il job

Scritto il 28 agosto 2026, la mattina in cui il job **non è partito affatto**. Sono quattro
voci pronte da eseguire: le prime tre non sono state applicate, la quarta è una regola che
vale da subito. Stanno insieme perché rispondono alla stessa domanda in due metà — *quando
gira* e *chi lo dice se non gira* — e la seconda metà è quella che non si risolve dove
verrebbe da cercarla.

**Il fatto da cui discende tutto: le esecuzioni programmate di GitHub sono dichiaratamente
*best-effort*.** Vengono accodate e, sotto carico, slittano o saltano, e **non esiste nessun
parametro che le renda puntuali** — non è una configurazione da trovare, è il contratto del
servizio. Due giorni consecutivi lo hanno mostrato: il **27 agosto è slittata di undici
ore** (cron 03:30 UTC, partita alle 14:28), il **28 non è mai nata**. Storicamente il tick
cade fra le 04:06 e le 04:21 UTC, cioè già con mezz'ora abbondante di ritardo strutturale.

### 1 · Più tentativi in una finestra invece di uno solo — NON APPLICATA

Ogni tick è best-effort **in modo indipendente**: se se ne pianificano parecchi, la
probabilità che *nessuno* parta crolla. Il cron smette di essere un istante e diventa una
finestra, che per un archivio notturno è la garanzia che serve davvero — «entro le sette»
invece di «alle 3:30, forse».

```yaml
on:
  schedule:
    - cron: '23,53 3-6 * * *'   # otto tentativi fra le 03:23 e le 06:53 UTC
  workflow_dispatch:
```

**I minuti sono dispari apposta, e costa zero.** `:00` e `:30` sono gli orari che pianificano
tutti, quindi sono quelli con la coda più lunga; un minuto dispari slitta mediamente meno.
Da solo non risolve niente, ma è gratis e va preso.

**Serve la guardia in testa al job**, o sette notti su otto si rifà il lavoro già fatto:
esce subito se `dati/stato-job.json` porta già la data di oggi. È il file giusto perché il
job lo riscrive **a ogni notte riuscita, anche a mani vuote** — quindi «c'è la data di oggi»
vuol dire «stanotte è già andata», non «stanotte ha trovato qualcosa».

Due cose che rendono la mossa sicura e che ci sono già, quindi non vanno aggiunte:

- **`concurrency: aggiorna-archivio` è già dichiarato**, quindi due tick non si accavallano
  mai: il secondo aspetta o viene sostituito. Senza, otto tick sarebbero otto parser in
  parallelo sullo stesso archivio;
- **le esecuzioni a vuoto durano pochi secondi** e il repository è pubblico, dove i minuti di
  Actions non si pagano. Il costo reale è sette righe in più nell'elenco delle esecuzioni.

**Quello che questa via NON dà, e va saputo prima di sceglierla**: non dà l'orario esatto.
Se un giorno servisse l'orario esatto, l'unica strada è un innesco esterno che chiami
`workflow_dispatch` — un dispatch è accodato subito, come un push, e **non passa dalla coda
best-effort**. Ma sposta il punto di fallimento su una macchina che dev'essere accesa, ed è
il motivo per cui non è questa la via scelta.

### 2 · Il problema che resta aperto: un run mai nato non ha nessun canale interno

**È la quarta volta in questo progetto che l'allarme muore insieme alla cosa di cui deve
avvisare, e la prima in cui non c'è nessun difetto da riparare.** Le tre volte precedenti
c'era: il workflow reso invalido dal JavaScript dentro il `run: |`, che falliva in zero
secondi portandosi via anche il riepilogo; la suite che moriva a metà e veniva contata
verde; il `git pull --rebase` nudo il cui errore era ingoiato dal ramo di ripiego. Qui no:
basta che GitHub salti il tick.

**La issue del riepilogo vive DENTRO il job.** Se il job non nasce, tace — e tace **in modo
indistinguibile da una notte andata bene**, perché il silenzio è anche il segnale voluto
quando non c'è niente da fare (`niente da fare e nessuna issue aperta: silenzio`). Non c'è
nessuna riga da aggiungere al workflow che chiuda questo: un passo può parlare solo se il
job che lo contiene esiste.

**E un workflow SEPARATO con uno `schedule` suo avrebbe esattamente lo stesso difetto,
quindi non è la via.** Sarebbe un secondo best-effort messo a sorvegliare il primo, cioè lo
stesso meccanismo che può saltare, sorvegliato da sé stesso. Il giorno in cui GitHub è sotto
carico i due tick saltano insieme — e il guardiano tace nello stesso momento in cui il
guardato tace, che è il caso peggiore possibile. **Chi controlla deve stare fuori
dall'infrastruttura che controlla**, o non sta controllando niente.

### 3 · La via che regge: una Cloud Routine di Claude Code — NON APPLICATA

Girano sull'infrastruttura di Anthropic, quindi **anche a macchina chiusa**, e si innescano
in tre modi: programmato, HTTP, o **webhook di GitHub**. È la sola cosa a disposizione che
soddisfi il requisito del punto 2, cioè stare fuori da GitHub.

**Limiti, come noti il 28 agosto 2026** — vanno riverificati prima di scrivere la routine,
perché sono una misura con una data e non un fatto: **cinque esecuzioni al giorno su Pro,
quindici su Max**. Da cui la conseguenza pratica: **una guardia giornaliera ci sta
comodamente, una oraria no.**

**IL CONFINE, CHE È LA PARTE CHE CONTA: la routine NON va usata come scheduler.** Farle
lanciare il job all'ora giusta sostituirebbe un servizio best-effort con un altro fornitore
— cioè **la stessa classe di rischio**, spostata, con in più un limite giornaliero stretto e
una seconda infrastruttura da tenere allineata. Sarebbe la strada doppia di sempre applicata
all'orologio.

Va usata come **la guardia che GitHub non può dare**, ed è un compito diverso:

- legge `dati/stato-job.json` — che è servito da Pages, quindi non serve nemmeno il
  repository;
- **se la data non è di oggi**, lancia il `workflow_dispatch` e lo **segnala**. Il dispatch è
  la conseguenza di una constatazione, non un timer;
- **se il job è partito ed è fallito**, legge il log e dice **a quale passo e perché** —
  che è la cosa che stamattina è costata il tempo di leggerlo a mano.

La differenza fra le due letture è tutta qui: uno scheduler afferma «adesso», una guardia
constata «non è successo». La seconda è vera anche quando la routine stessa slitta di
un'ora, la prima no.

### 4 · E il confine sull'agente, che non si confonde con questo

La regola dell'agente resta **quella scritta in «Il confine dell'agente»** e non è
scalfita da niente di quanto sopra: **prepara il lavoro che richiede giudizio** — mappature
di lista, accordi di eccedenza, traduzioni delle voci-evento — e per quelle si ferma al
diff.

Quello che si aggiunge è una sola riga, e serve perché il punto 3 non la faccia sembrare
un'altra cosa: **l'agente può lanciare un `workflow_dispatch` come CONSEGUENZA DI UNA
DECISIONE, non come sostituto di un timer.** «Ho constatato che l'archivio è fermo da due
giorni, quindi lo faccio partire» è dentro il confine; «lo faccio partire ogni mattina alle
sette» è fuori, ed è fuori per la stessa ragione del punto 3 — un agente che gira a
orologio è uno scheduler, con tutti i difetti di uno scheduler e nessuna delle sue garanzie.

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

## L'esportazione PNG: la geometria è una scelta del codice, il carattere no

Applicata il 24 agosto 2026. Le decisioni erano già prese nel punto 7 — quattro disegni e
non undici sezioni, `Blob` e non data URI, `fillRect` col fondo del tema prima di disegnare,
la targa sopra e il piede sotto, un pulsante per disegno con l'`aria-label` che nomina il
grafico — e sono state **rilette, non ricostruite a memoria**. Quello che è cambiato sono i
numeri.

### L'inventario del punto 7 era vecchio di due giorni, e va detto prima di usarlo

Un inventario è una **misura con una data**, non un fatto. Rifatto prima di scrivere una
riga:

| | punto 7 (22 agosto) | **misurato il 24 agosto** |
|---|---|---|
| `#k-hist` / `#k-hist2` | 460×**210** | 460×**234** |
| `#k-emi` | 430×232 | 430×232 (invariato) |
| `#k-trend` | 520×331 | **900×336** a desktop |
| `<text>` senza `font-family` | 45 su 67 | 47 su 71 |
| `var(--` nei quattro disegni | 0 | 0 |
| `foreignObject`, `currentColor`, `url(...)` | 0 | 0 |

Gli istogrammi sono cresciuti di 24 unità il giorno in cui **le due fasce sono diventate
margini del disegno**; la tendenza è quasi raddoppiata quando il viewBox desktop si è
separato da quello stretto. Se le targhe fossero state calcolate sui numeri del punto 7, la
tendenza avrebbe avuto una targa larga 520 su un disegno largo 900.

**Da cui la regola scritta nel codice: la geometria non si scrive, si legge dal `viewBox`
del disegno reso.** È l'unica che non invecchia.

### Le quattro targhe e i due K, rifatti sulla geometria vera

| disegno | viewBox | targa | piede | tela finale | K |
|---|---|---|---|---|---|
| `#k-hist` | 460×234 | 44 | 30 | **1380×924** | 3 |
| `#k-hist2` | 460×234 | 44 | 30 | **1380×924** | 3 |
| `#k-emi` | 430×232 | 44 | — | **1290×828** | 3 |
| `#k-trend` | 900×336 | 44 | 30 | **1800×820** | 2 |

L'emiciclo non ha piede perché **la legenda ce l'ha dentro il disegno**; gli altri tre ce
l'hanno in HTML e la targa gliela ridisegna. La tendenza sta a **K=2** e non a 3 perché a 3
uscirebbe 2700px di lato lungo, che non serve a niente: 1800 è già oltre qualunque uso
editoriale.

### La geometria è sempre quella desktop, anche esportando da un telefono

**Il precedente sul carattere non si estende, ed è la decisione che vale oltre questo
caso.** Sul carattere si accetta la pila della macchina che esporta: un font vero come data
URI sono centinaia di KB e violerebbe la regola del file unico. Sulla geometria no — *il
carattere è una cosa che la macchina impone, la geometria è una cosa che il codice sceglie*
— e un PNG che finisce nell'articolo di qualcun altro non deve avere l'asse diradato e i
mesi alternati perché chi l'ha esportato era su un telefono.

Il meccanismo è `FORZA_LARGO`, che scavalca `stretto()` — la **strada unica** per la query
dei 660, che prima era scritta in cinque punti. Si accende, si ridisegna **quel disegno
soltanto**, si serializza, si rispegne: fra l'accensione e lo spegnimento il browser non
dipinge, perché è tutto dentro lo stesso compito sincrono. Il lettore non vede niente
lampeggiare.

**E `fasceIst(FS)` esiste per questo**: le due fasce degli istogrammi erano calcolate dentro
`istogramma()`, e la targa avrebbe dovuto rifarne il conto per sapere dove finisce il
disegno. Due strade per lo stesso numero, nate insieme alla funzionalità — quindi una
funzione sola, chiamata dai due.

### Le opacità: la prova è scritta dal verso che conta

L'attributo `opacity=".28"` sulla nuvola dei sondaggi contro il `.07` calcolato era
annotato come *la* trappola. Misurandola, **il caso famoso non è il caso peggiore**.

Nello stato predefinito attributo e calcolato coincidono su tutti e quattro i disegni —
**zero divergenze** — quindi l'attributo non è inerte: è il valore vero finché non si accende
uno stato. Negli stati interattivi, con le transizioni spente:

| stato | elementi che divergono | **di cui senza nessun attributo** |
|---|---|---|
| emiciclo filtrato | 126 | **126** |
| tendenza con una serie sola | 523 | 4 |
| tendenza con un evento isolato | 542 | 23 |

Un elemento **senza** attributo uscirebbe a opacità **piena**: il filtro dell'emiciclo non
sarebbe sbagliato di un fattore quattro, **sparirebbe del tutto dal PNG**. Un errore di
quattro volte si vede; uno stato che scompare no.

**Da cui la forma della prova, che non nomina nessun elemento**: dopo la stampa, nessun
elemento della copia esce a un'opacità diversa da quella calcolata sulla pagina. Vale per la
nuvola, per i 126, per i 23 e per quello che qualcuno aggiunge domani. *Provare che la
nuvola esce a `.07` sarebbe stato provare l'istanza; questa prova la forma.*

**L'attributo resta dov'è.** Toglierlo sarebbe una riparazione che ne rompe un'altra in
silenzio: in SVG un attributo di presentazione perde contro qualunque dichiarazione CSS, ma
è il valore vero quando il CSS non dice niente.

**E le transizioni vanno spente PRIMA di leggere.** Con quelle vive `getComputedStyle`
restituisce il valore **animato**, che a inizio transizione è ancora quello di prima: in
questa stessa sessione ha prodotto **zero divergenze** per `solo-*` e numeri sbagliati per
l'emiciclo filtrato — misure stabili e false, la trappola 2 del banco.

### La riga dell'evento è misurata, non troncata a occhio

Nello stato isolato la targa porta la riga dell'evento, che è l'unica cosa che rende
l'isolato un'immagine pubblicabile. Il primo taglio era **a 150 caratteri**, e tagliava una
riga che ci stava: 170 caratteri misurano **808,9 unità su 868 disponibili**. Adesso c'è
`tagliaA()`, che monta una sonda `<text>` dentro l'SVG, misura la larghezza vera e taglia
**all'ultimo spazio** che ci sta. Un carattere non è una larghezza, e la pila del foglio
non è quella della macchina che esporta.

### Come si prova senza una tela

`toDataURL` in jsdom non esiste, quindi il modulo è tagliato dove la prova può entrare:
**`svgEsportabile(id)` compone e restituisce il testo dell'SVG**, e `esportaPNG(id)` è il
guscio che lo rasterizza. Le 74 asserzioni di `test/suite/png.js` stanno tutte sul primo.

**E la geometria desktop si prova come UGUAGLIANZA, non come numero.** Asserire «la tendenza
esce 900 larga» sarebbe scrivere in una prova la costante che il codice ha appena smesso di
scrivere. La prova compone due volte — a finestra larga e a finestra stretta — e verifica
che i due `viewBox` siano **identici**: è la proprietà che si vuole, e non invecchia quando
il disegno cambia.

### Due cose che restano decise e non si riaprono

- **Il PNG non esiste dentro `?embed=1`**, e il pulsante non c'è affatto. Dentro un iframe
  con `sandbox` senza `allow-downloads` un `<a download>` **non solleva niente e non fa
  niente**: il fallimento è silenzioso, e un pulsante che tace è peggio di un pulsante che
  manca. Vedi «Le nove risposte dell'embed», risposta 4.
- **Il tetto del gzip non si alza a occhio.** L'esportazione ha portato il file da 169,5 a
  **170,1 KB** contro i 179 del tetto: **non lo sfonda**, quindi non c'è niente da rifare.
  Il giorno in cui lo sfondasse, il tetto si rifà con i quattro addendi scritti nel commento
  accanto alla regola — non si alza.

## I pulsanti di copia: stessa grammatica del PNG, epistemologia diversa

Applicati il 24 agosto 2026. I due blocchi di codice di «Incorpora questo modello» si
copiavano solo a mano, e su un telefono selezionare quattro righe di codice dentro un
riquadro che scorre è quasi impossibile.

### Nascono come regola, e i blocchi della pagina sono due

Un ciclo su `pre.cod`, non due pulsanti scritti nel markup. Cercati in tutta la pagina, i
blocchi di codice sono **due** — il codice dell'iframe e lo script dell'altezza — e gli
altri `code` sono **in linea dentro una frase** («python3 -m http.server» nella diagnostica):
un pulsante accanto a tre parole in mezzo a un periodo sarebbe rumore. Il giorno in cui se
ne aggiunge un terzo, il pulsante c'è già, e la prova verifica **la regola** — ogni blocco ne
ha uno — invece del numero di oggi.

Il pezzo editoriale sta **nel markup accanto al blocco**, `data-copia="il codice
dell'iframe"`, come `ab` sta nell'anagrafica: scriverlo nel JavaScript sarebbe una seconda
anagrafica dei blocchi, e resterebbe indietro alla prima aggiunta.

### Che cosa finisce negli appunti, misurato

Il blocco **va a capo per stare nella colonna**: a 380, quattro righe di sorgente rese in
**193,8px**, cioè circa undici righe. Copiare «quello che si vede» darebbe un codice spezzato
in punti che dipendono dalla larghezza della finestra di chi copia.

Si usa **`textContent`**, che per specifica ignora il layout. Misurato: `innerText` oggi
risponde **identico** — quattro righe in tutti e due i blocchi — perché con
`white-space:pre-wrap` questo browser non mette gli a-capo morbidi nell'albero. **Due strade
che oggi concordano sono precisamente la condizione in cui la scelta sbagliata non si vede**,
e `innerText` è definito in funzione della resa. Quindi la prova sul valore non basta e il
legame si prova **nel sorgente**, come per `colonneBlocco()` e `og:title`.

**E il pulsante sta fuori dal `pre`**: dentro, la sua etichetta finirebbe in `textContent` e
verrebbe copiata insieme al codice.

### «Copiato» è legittimo, e «Immagine pronta» no: la differenza è misurata

Stessa grammatica dello scarico del PNG — il riscontro sta **sul comando**, non in `#k-msg`
a migliaia di pixel — ma l'epistemologia è diversa, ed è la ragione per cui le parole non
sono le stesse:

| | lo scarico del PNG | la copia |
|---|---|---|
| che cosa restituisce il comando | `a.click()` → `undefined` | `writeText` → una promessa |
| eventi di esito | **nessuno**: `ondownload`, `ondownloadend`, `ondownloaderror` assenti | la promessa si risolve **solo** a copia avvenuta; `execCommand` dà un booleano |
| quindi la parola | «Immagine pronta» — l'unica cosa verificata | **«Copiato»** — un fatto riferito, non una promessa |

La prova lo dichiara: `«Copiato»` sta **nel ramo in cui il browser ha confermato**, e se un
giorno comparisse un ramo che non sa dire niente, quell'asserzione andrebbe rifatta come
quella del PNG.

### Il ripiego scatta sul fatto, e sono tre rami

`navigator.clipboard` non esiste fuori da un contesto sicuro, e chi apre `index.html` con un
doppio clic è esattamente lì. **Non si guarda `location.protocol`** — sarebbe la stessa forma
dello sniffing dello user agent — si prova a scrivere e si guarda la risposta, che è quello
che `tipoMemoria()` fa da sempre per la memoria. Misurati su browser vero:

| | ripiego usato | riscontro |
|---|---|---|
| l'API c'è e riesce | — | «Copiato» |
| l'API non c'è | `execCommand` una volta | «Copiato» |
| l'API c'è ma **respinge** | `execCommand` una volta | «Copiato» |
| non riesce nemmeno quella | — | **«Selezionato: copialo tu»**, e il blocco viene selezionato — 239 caratteri, tutto il codice |

**Dove non si può copiare, si seleziona.** Un pulsante che fallisce e basta lascia il lettore
senza niente da fare; selezionando il blocco resta a un ⌘C di distanza, e la parola glielo
dice. È la stessa scelta del ripiego del PNG.

### Tre cose che il banco ha imposto

**1 · `window.navigator` e non il `navigator` nudo.** È la stessa lezione di
`window.location` già pagata dall'embed: il globale nudo esiste anche fuori da un browser —
Node ne ha uno suo — quindi una prova che sostituisce la finestra non lo intercetta. La prima
stesura lo usava, e tre asserzioni leggevano **`null`** negli appunti: la suite provava il
ripiego credendo di provare la strada moderna.

**2 · La regola del foglio va DOPO `.lnk`.** `.cpy` porta anche `.lnk`, i due selettori
hanno la stessa specificità, e a parità vince **l'ordine di sorgente**: scritta accanto a
`.cod` — novecento righe più su — avrebbe perso `margin-left` e `padding` in silenzio. È la
trappola 4 del banco vista dal lato del foglio invece che da quello della prova, e adesso
c'è un'asserzione che confronta le due posizioni.

**3 · Un'asserzione che esplode invece di cadere**, per la quarta volta in questo progetto:
la richiamata dei 2,6 secondi si chiamava senza verificare che ci fosse, e il mutante che la
toglieva faceva **morire la suite** invece di farla fallire. Adesso c'è la guardia.

Diciassette mutazioni, tutte morte. `embed.js` da 70 a 96 asserzioni, banco a **1987**.

### Il tetto del gzip è a 0,8 KB

**Da sapere prima di scrivere qualunque altra cosa**: dopo questo giro il file compresso
misura **178,2 KB contro i 179 del tetto**. Non è sfondato, quindi non c'è niente da rifare
adesso — ma il margine è **ottocento byte**, e le tre cose in coda (embed compatto, card
social, `og:image`) lo sfondano tutte e tre. Il tetto si rifà con i quattro addendi scritti
nel commento accanto alla regola, **non si alza a occhio**, e la potatura delle 60
rilevazioni pre-fusione da `BASE` — 16,3 KB di caratteri — resta la strada da guardare per
prima.

## L'archivio, tre punti: la sigla era una regola, il terzo totale, e il confine

Applicati il 24 agosto 2026. Il primo è il più istruttivo dei tre, perché la segnalazione
riguardava una lista e il difetto era di tutte.

### 1 · L'intestazione «I» non era dei Democratici: era della regola

Le sigle delle colonne uscivano da `nm(i).split(/[ –]/)[0].slice(0,8)` — la prima parola
tagliata a otto. Applicata a **tutte e venti** le liste dell'anagrafica sbagliava in **tre
modi diversi**, non in uno:

| nome | reso | come sbagliava |
|---|---|---|
| **I Democratici** | **«I»** | prende l'**articolo** per nome |
| **Giudaismo Unito Torah** | **«Giudaism»** | taglia **dentro** la parola |
| Lista Unita araba | «Lista» | prima parola **generica** |
| Casa Sionista | «Casa» | idem |
| Blu e Bianco | «Blu» | idem |

Le altre dodici reggevano, e **nessuna coppia collideva — ma per fortuna**: la regola non lo
garantisce, e l'8 settembre una lista nuova può scontrarsi con una che c'è.

**E la stessa regola era scritta in due tabelle**: anche l'house effect intitolava «I».

**Il fatto era già dichiarato in pagina, e la sigla non lo usava.** `ART` dice
`democratici:'i'` da sempre, e `nmA()` toglie l'articolo dal nome prima di metterci il
proprio — la logica esisteva, dentro `nmA`, e la sigla se la rispondeva per conto suo. È la
strada doppia di sempre, con la particolarità che una delle due strade era in pagina da
prima. Adesso c'è `senzaArt(i)`, chiamata da tutte e due.

Tre mosse, in ordine di quanto costano:

1. l'articolo lo toglie `senzaArt()`;
2. **non si taglia più dentro la parola**: una colonna un pixel più larga si legge, una
   parola mozzata no;
3. il campo **`ab`** nell'anagrafica per le sigle che una regola non può indovinare — oggi
   `Dem` e `UTJ`. È lì che stanno i fatti di una lista, accanto a blocco, ordine, colore e
   `dentro`.

**Costo: negativo.** La tabella si restringe da **1288,9 a 1262,9px**, perché «UTJ» costa
cinque caratteri meno di «Giudaism».

**Due mutazioni hanno trovato una prova che non poteva cadere**, ed è il caso già visto:
togliere `ab` o svuotarlo lasciava passare tutto, perché il ripiego dà «Democratici» e
«Giudaismo» — parole intere, uniche, non articoli. Passava ogni proprietà che la prova
verificava, e falliva la sola cosa che l'autore aveva chiesto.

**E una terza ha trovato un ramo irraggiungibile**: `senzaArt()` dentro `sigla()` oggi non
si esercita, perché l'unica lista col nome che comincia per articolo dichiara `ab`. Il caso
esisterà l'8 settembre, quando una lista entra senza che nessuno pensi alla sua sigla — che
è esattamente il momento in cui la prova deve già esserci. La prova lo esercita su una lista
**sintetica**, «Il Movimento Nuovo», che nell'anagrafica non c'è.

### 2 · Il terzo totale, e il quarto che è dichiarato e non mostrato

`blocchi()` restituisce **quattro** totali e la riga ne mostrava **due**. Misurato
sull'archivio, 173 rilevazioni:

| blocco | righe con almeno un seggio | media per riga | massimo |
|---|---|---|---|
| arabi | **173 su 173** | 10,6 | 15 |
| opposizione | 173 su 173 | 55,1 | 62 |
| coalizione | 173 su 173 | 54,0 | 66 |
| **ago della bilancia** | **15 su 173** | **0,35** | 5 |

| totali mostrati | righe che chiudono a 120 |
|---|---|
| due, come prima | **0 su 173** |
| **tre** (applicato) | **158 su 173** |
| quattro | 173 su 173 |

**IL QUARTO È DICHIARATO E NON MOSTRATO, e la ragione non è la larghezza.** L'ago della
bilancia **non è un blocco pubblicato**: è la nostra categoria per le liste che non stanno
con nessuno dei due campi. Gli istituti israeliani pubblicano il blocco Netanyahu e quello
del cambiamento, e spesso a parte i partiti arabi; **nessuno pubblica un quarto campo**.
Metterlo in fondo alla riga affermerebbe che lo pubblicano, che è falso. La larghezza lo
conferma soltanto: il terzo totale costa **+50,9px** e il quarto altri **+41,1**, su una
tabella che a 1265 già scorre di 185.

*Questa è la decisione che fra un mese sembrerebbe arbitraria, ed è per questo che sta
scritta qui e nel commento accanto a `blocchi()`.*

**Il piede faceva due affermazioni in una**, e la seconda era falsa in tutte e 173 le righe:

> ~~ogni riga chiude a 120 seggi e riproduce il totale di blocco pubblicato~~

La prima metà riguarda le **celle** ed è sempre vera — misurato, le liste sommano 120 in
**173 righe su 173**. La seconda riguarda i totali in fondo. Il lettore però legge la frase
come una cosa sola e la verifica sui numeri in fondo, che è dove guarda. Adesso sono due:

> Le liste di ogni riga sommano 120 seggi. I tre totali in fondo sono i blocchi che gli
> istituti pubblicano: quando una lista fuori dai due campi ottiene seggi, la loro somma è
> minore di 120.

**«Fuori dai due campi» e non «ago della bilancia»**: quella è la nostra etichetta, e lì si
sta spiegando che cosa fa il pubblicato.

Il terzo totale è anche nel sommario dell'elenco sotto i 660 — **gli stessi tre e nello
stesso ordine** — e `tabella.js` li lega numero per numero. Misurato a 380: il sommario
resta su **una riga**, 44px, `<u>` largo 63,8, sforamento zero, documento +39px.

### 3 · Il confine, e perché un segno da solo non bastava

Fra le colonne delle liste e i totali cambia la **natura del dato**, e lì non c'era niente:
le due celle dei totali non portavano nemmeno una classe.

**La misura che ha deciso la forma**: a 1265 le colonne dei totali stanno a x **1199** e
**1248** dentro una finestra da **1116**, cioè **sono già fuori dall'area visibile**. Un
segno grafico su una colonna che non si vede senza scorrere non ripara niente.

Quindi **intestazione di gruppo** — «Seggi per lista» e «Totali di blocco», che è la prima
cosa che si incontra scorrendo e dice a parole che cosa sta arrivando — **più il filetto a
due tinte più spesso** nel corpo della tabella, che l'accompagna.

Il filetto forte è `inset 2px var(--ink2), inset 3px var(--card)` contro l'`inset 1px
var(--hair), inset 2px var(--card)` dei blocchi: **cambia la tinta e non solo lo spessore**,
perché due grigi a spessore diverso su tredici colonne non si distinguono. L'alone `--card`
resta — quinto uso dell'idioma — o sopra un fondo della scala divergente il filetto
sparirebbe.

**Il fondo `--wash` sulle celle dei totali è stato scartato**, per due ragioni: sarebbe
colore su colore dove i valori sono già colorati per blocco, ed entrerebbe in conflitto con
la scala divergente il giorno in cui qualcuno colorasse anche i totali.

### Che cosa hanno imposto le prove

**Quattro asserzioni sono cadute insieme al primo giro, e nessuna riguardava il difetto**:
`tabella.js` prendeva **tutte** le `thead th`, e con la fila di gruppo ne contava sedici in
più, quindi nessuna riga di dato corrispondeva più al conto delle colonne. Adesso la fila
delle intestazioni si **nomina** — `thead tr:last-child` — qualunque sia il numero di file
sopra.

**E il numero dei totali non è scritto nella prova**: si legge dal `colspan`
dell'intestazione di gruppo, che è la stessa cella che lo dichiara al lettore. Con
`cel.length - 2` e `- 1` cablati, aggiungere un totale a una vista sola sarebbe passato —
le due posizioni avrebbero continuato a puntare a due celle, solo alle celle sbagliate.

**E i totali si verificano dentro la riga**, non contro `SOND` per indice: l'ordine di
render non è l'ordine dell'archivio, e la prima stesura confrontava la riga 0 con la
rilevazione 0 leggendo 52/57/11 contro 66/44/10. Una prova che dà per scontato che i due
ordini coincidano **misura l'ordinamento credendo di misurare i totali**.

`tabella.js` da 88 a 183 asserzioni. **Ventuno mutazioni fra i tre punti, tutte morte**:
sette sulla sigla, quattordici su totali, gruppo, filetto e piede.

## La forma compatta dell'embed: una figura, e la soglia che non è scritta

Applicata il 24 agosto 2026. Chi incorpora in un articolo vuole **una figura**, non undici
sezioni. `?embed=sintesi` porta l'emiciclo, la riga di sintesi, le quattro probabilità in
forma corta e la firma con le due date.

| pezzo | 380 | 600 |
|---|---|---|
| emiciclo | 209 | 327,7 |
| riga di sintesi | 18 | 18 |
| probabilità corte | 17 | 17 |
| firma e le due date | 36 | 18 |
| **totale** | **419** | **502** |

Contro i **18.270px** della pagina intera. Sopra i 600 non cresce più: l'emiciclo ha
`max-width:600px`.

### Due misure hanno cambiato il progetto rispetto alla proposta

**Le probabilità corte esistevano già.** `#k-sprobs` è scritto da `rProbs()` dallo **stesso
array `items`** nello stesso passaggio della forma piena: **17px**, contro i 150,8 stimati
per una griglia a quattro colonne e i **665,1** della forma piena. Non serviva la leva che
avevo proposto — serviva accorgersi che la strada c'era.

**La prosa è l'unico pezzo che cresce quando la colonna si stringe**: il verdetto passa da
306,8 a **485,7** andando da 600 a 380, mentre ogni altro pezzo si dimezza. In un riquadro
stretto la prosa è il materiale sbagliato, ed è controintuitivo perché sembra il più
leggero. Da lì la riga corta invece del verdetto.

### La forma la sceglie il valore, non un secondo parametro

`?embed=1` è la forma intera ed è **identica a prima** — chi l'ha già incollata in un
articolo deve continuare a vedere quello che vedeva, e questo viene prima di tutto.
`?embed=sintesi` è la compatta. Un secondo parametro permetterebbe di scrivere
`?embed=0&sintesi=1`, che è uno stato che non vuol dire niente e che qualcuno prima o poi
scriverà. E le forme sono **dichiarate in un elenco**: un valore che non c'è non è un embed,
esattamente come prima.

### La riduzione non ha una soglia scritta

Scrivere «sotto i 320px si tolgono le probabilità» vorrebbe dire mettere in una costante un
numero che dipende da quanto sono alti oggi l'emiciclo, la firma e le due date — lo stesso
errore del punto 7 dell'esportazione, dove le targhe erano calcolate su un viewBox vecchio
di due giorni. Si **misura**: si compone la forma A, si guarda se ci sta in
`window.innerHeight` — che dentro un iframe *è* l'altezza del riquadro — e se non ci sta si
tolgono le probabilità, che è il pezzo più sacrificabile.

Verificato: a **380×460** resta A (419px), a **380×360** passa a C (**401px**). Se non ci sta
nemmeno C non resta niente da togliere, e il riquadro scorre come fa oggi.

Non lampeggia: misura e potatura stanno nello stesso compito sincrono, e il browser non
dipinge in mezzo — è l'argomento di `FORZA_LARGO`.

### Si pota, non si sposta — e dopo l'ULTIMO render

**Nessun elemento cambia genitore**: si tiene la catena degli antenati dei pezzi dichiarati e
si toglie il resto. Spostarli li farebbe atterrare sotto selettori discendenti che non
conoscono, ed è la trappola di `#k-evsel`.

E la potatura sta **dopo l'ultimo render**, non dentro `applicaEmbed()`: là il render non è
ancora passato, e potando prima `rEmi()` non trova la legenda che gli serve — **il render
muore a metà e l'emiciclo resta vuoto, senza un errore in console**. Successo alla prima
stesura. I render sono due — uno sul seme `BASE` e uno sui dati veri — e potare dopo il primo
congelerebbe la pagina sui numeri del seme.

### La riga di sintesi è la frase dell'h1, e la coda si è separata

`TIT_CODA` — « · Knesset 2026» — serve alla linguetta del browser e alla scheda di
condivisione, dove il titolo va riconosciuto fuori dalla pagina. Dentro il riquadro sarebbe
la **terza volta** che si legge «Knesset 2026» in trecento pixel, perché la firma lo dice
già. Da qui `fraseCorta()` separata da `titoloCorto()`: **una frase, quattro consumatori** —
`document.title`, `og:title`, la riga della sintesi e il verdetto delle card.

### Che cosa ha imposto il banco

- **la sintesi si monta per ultima** nelle prove: `potaSintesi()` cerca i pezzi con la
  scorciatoia dell'app, che risolve `document` **al momento della chiamata** sul globale,
  mentre la catena degli antenati parte dall'`R` della sua chiusura. Montandola per prima e
  chiamando `finiSintesi()` dopo aver costruito altre due pagine, i pezzi si cercavano nel
  documento dell'ultima: **otto asserzioni cadute su un difetto che non c'era**;
- **`window.navigator` e non il `navigator` nudo**, che è la stessa lezione di
  `window.location`: il globale nudo esiste anche fuori da un browser — Node ne ha uno suo —
  e tre asserzioni leggevano `null` negli appunti;
- **due asserzioni fragili corrette**: una cercava `<p class="firma">` alla lettera e si è
  rotta quando il paragrafo ha preso un id; l'altra prendeva 200 caratteri dopo
  `$('k-sprobs').innerHTML` e ci trovava dentro **l'istruzione successiva** — una finestra di
  caratteri non è un confine sintattico.

**«Aggiorna i sondaggi» è uscito dall'embed**, e la ragione che viene prima è di chi ospita:
quel comando fa partire una richiesta a **Wikipedia** dalla pagina di qualcun altro, che non
l'ha chiesta e non lo sa. E c'è l'altra metà: misurato, fa `salva()` e `render()`, e
`memSet()` **cattura l'eccezione invece di lanciare** — quindi dove lo storage è bloccato il
salvataggio fallisce in silenzio e la vista si aggiorna lo stesso. Il lettore vede numeri che
svaniscono al primo ricaricamento, **tre righe sotto una fascia che dichiara «qui non si
salva niente»**. Va via la **cella**, non il solo pulsante: la frase che lo spiega resterebbe
a descrivere un comando che non c'è.

**Il tema resta**, benché abbia la stessa forma — scrive in memoria e il salvataggio
fallisce allo stesso modo. La differenza è **che cosa** fallisce: il tema si applica subito e
a non sopravvivere è solo la memoria della scelta; l'aggiornamento prometteva di integrare
l'archivio, e l'archivio tornava quello di prima. *Uno fallisce sulla comodità, l'altro sulla
cosa che promette.*

### La barra di scorrimento: diagnosticata, e non c'era niente da riparare

| | `scrollHeight` | `clientHeight` | sfora |
|---|---|---|---|
| completa a 600×900 | **15.462** | 900 | +14.562 |
| compatta a 600×520 | 520 | 520 | **0** |
| compatta a 380×520 | 520 | 520 | **0** |

Nella compatta **non c'è nessuna barra**, e la barra orizzontale non compare mai. Nella
completa è il **caso 1** — la barra è onesta, e nasconderla renderebbe irraggiungibili
quattordicimila pixel. La forma completa è per costruzione un contenuto che scorre: chi vuole
un riquadro in un articolo usa la sintesi, che è esattamente perché esiste.

E la barra in questo browser è **in sovrimpressione**: `innerWidth − clientWidth = 0`, non
occupa spazio. Una comparsa al passaggio non servirebbe a niente su un telefono, dove il
passaggio non esiste — e togliendola resterebbe senza segnale un caso in cui c'è davvero
dell'altro sotto.

---

## L'immagine Open Graph: il carattere non entra nell'SVG, e la tavolozza veniva prima

Applicata il 24 agosto 2026. La genera `.github/scripts/anteprima.mjs`, sta in
`dati/anteprima.png`, e `twitter:card` è passata a `summary_large_image` **nello stesso
commit in cui la prima immagine è stata pubblicata davvero**: dichiararla prima sarebbe stata
una promessa che nessun file mantiene.

### La domanda del carattere si è dissolta invece di trovare risposta

Provato installando resvg, con un controllo che sa fallire:

| prova | esito |
|---|---|
| `@font-face` con data URI dentro l'SVG | **A e B identici byte per byte** → resvg lo **ignora** |
| woff / woff2 passati a `fontFiles` | identici a nessun font → ignorati |
| **TTF** passato a `fontFiles` | **A ≠ B** → **usato davvero** |

resvg non vuole il font *dentro* l'SVG: lo vuole come **file passato al rasterizzatore**.
Quindi il carattere non entra mai nell'SVG, e nell'SVG non entrerebbe comunque nel file
servito, che riceve solo pixel. **La regola del file unico non morde**: `index.html`
guadagna quattro righe di meta.

I pesi, per il giorno in cui servissero: Inter latin 600 intero 23,9 KB in woff2, il
sottoinsieme dei 28 glifi dell'emiciclo **3,40 KB** (14,2%), 17,1 KB in TTF. Siccome vive nel
repository e non nella pagina, **il sottoinsieme non serve**: si spedisce il TTF intero e c'è
un pezzo mobile in meno. I due file stanno in `.github/font/`, sono Inter con licenza SIL
OFL, e pesano 686 KB in tutto.

**E i numeri grandi vanno nella sans, non in un serif sostitutivo.** In pagina sono
`Georgia,serif`, ma Georgia è un font Microsoft e non si può spedire in un repository
pubblico: **la scelta non era fra Georgia e un altro serif — era fra un sostituto e la
coerenza**. Un serif «vicino a Georgia» somiglia senza esserlo, e la differenza si nota solo
nei casi in cui stona.

### Ma prima del rasterizzatore c'era la tavolozza, ed era una terza tavolozza

`leggiTema()` legge le variabili CSS con `getComputedStyle` e cade su `C_FALL` quando non
può — cioè in jsdom, cioè **nelle prove e nel lavoro notturno**. Misurato token per token:

| token | in pagina, chiaro | nel ripiego |
|---|---|---|
| `--coal` | `#143EDB` | `#1D4E89` |
| `--oppo` | `#78002D` | `#0E8388` |
| `--arab` | `#007B4C` | `#3E7A4A` |

**14 valori su 16 divergevano**, e `--oppo` era di un'altra **tinta**. L'`og:image` sarebbe
uscita in colori che nessun lettore vede — l'opposizione verde acqua — e sarebbe stata la
prima cosa che si incontra condividendo il link. È la strada doppia del colore di blocco
ricomparsa dalla porta più difficile da guardare: quella di chi non ha un motore di stile.

**Nessuna prova se ne accorgeva, e non perché fossero deboli: nessuna guardava la tavolozza
in jsdom.** Il legame andava **aggiunto**, non riparato — ed è la risposta alla domanda
«quante asserzioni cambiano valore»: **zero**. Adesso i valori sono quelli veri, sono **due
tabelle** perché la pagina ha due temi, e `struttura.mjs` li confronta con le variabili del
foglio. Quattro mutazioni, quattro morte.

**E il fondo della targa è lo stesso tema dell'SVG**, non una scelta a parte: con la targa
scura e la tavolozza chiara «MAGGIORANZA 61» usciva nero su nero. È la lezione del `fillRect`
col fondo del tema — il fondo e i colori sono una decisione sola.

**Il tema è chiaro, e scelto invece che ereditato.** Le anteprime compaiono dentro le
interfacce dei social, che sono chiare o scure a seconda dell'app e dell'ora, quindi un tema
giusto non esiste; il chiaro regge meglio su fondo bianco, che è il caso più frequente, e
soprattutto **una scelta dichiarata vale più di un default di jsdom**.

### Il resto, misurato

| | |
|---|---|
| rasterizzatore | `@resvg/resvg-js`, **4,4 MB** installato, **34 ms** — l'unico dei tre che non porta in CI un motore di rendering intero per disegnare centoventi cerchi |
| PNG | **1200×630, 74 KB** |
| cornice | testata 96, piede 40, area 1120×494, scala 2,276, inchiostro reso **880×494** |
| ogni notte | 64 PNG × 74 KB = **4,7 MB** nella storia di git, accettati: un'anteprima senza data invecchia in silenzio |

**L'inchiostro è già centrato in orizzontale** — 21,6 unità vuote a sinistra e 21,7 a destra
— e **non lo è in verticale**: 0,4 sopra e 14,6 sotto. La nota che stava nella coda diceva il
contrario perché guardava un margine solo.

**Il confronto dei byte prima di scrivere**: senza, il job committerebbe un'immagine anche
quando gira a vuoto, e un commit che non cambia niente rende invisibile quello che cambia
qualcosa. È la ragione per cui `scriviMeta()` è idempotente.

**Le due guardie**, e la seconda è quella che conta: la prima coglie il buffer vuoto, la
seconda **la tela uniforme** — un PNG grande e tutto di un colore, che è esattamente quello
che produce un rasterizzatore che non trova i font o sbaglia il viewBox. Se una scatta non si
scrive niente: **un og:image vecchio è meglio di un og:image vuoto**.

**Le quattro meta stanno FUORI dalla regione del job**, e me ne sono accorto perché il
controllo strutturale è diventato rosso: il job riscrive il **file**, non quelle righe, che
sono costanti come `og:url`. L'eccezione resta la più stretta che si potesse dare — `og:title`
e basta. Da sapere: gli aggregatori mettono in cache per indirizzo, e l'indirizzo non cambia
mai; se un giorno pesa, il rimedio è un indirizzo con la data, che però riporterebbe quella
riga dentro la regione del job.

---

## Le card e la condivisione: una targa sola, e il comando che non c'è

Applicate il 24 agosto 2026. **Sono la stessa macchina del PNG**, e la mossa che le tiene
insieme è una: **`targaPNG()` prende l'altezza come parametro invece che come risultato.**
Nell'esportazione l'altezza si ricava dal disegno; in una card è imposta dal formato e il
disegno si scala in quello che resta. Sono la stessa targa vista dai due versi, e tenerne due
sarebbe la strada doppia che diverge al primo ritocco.

### Quello che ha deciso la forma, misurato

- **`navigator.share` e `canShare` sono `undefined` su desktop**, con `isSecureContext` vero.
  Non è un'API che rifiuta i file: **è un'API che non esiste**, e il ramo senza comando è il
  caso **normale**, non il limite;
- **i link di intent non allegano niente**: `twitter.com/intent/tweet` prende `text` e `url`,
  `facebook.com/sharer` prende `u`, `t.me/share` prende `url` e `text`. Nessun parametro per
  un file. **Su desktop la condivisione dipende da `og:image`, non dalle card** — ed è la
  ragione per cui l'anteprima veniva prima;
- **Instagram non ha né l'una né l'altra**: si scarica la card e si carica a mano, ed è la
  ragione per cui l'indirizzo dev'essere dentro l'immagine;
- **in griglia su Instagram non si legge niente**: una miniatura è larga **161px**, cioè un
  corpo da 30 rende **4,0px**. Quello che identifica il modello lì è la forma dell'emiciclo
  coi tre colori, non una parola.

### I quattro formati, e la regola sola

| formato | tela | inchiostro reso | avanza |
|---|---|---|---|
| X | 1200×675 | 943×529 | 0 |
| Facebook e Telegram | 1200×630 | 880×494 | 0 |
| **Instagram quadrata** | 1080×1080 | 1000×561 | **286px** |
| **Instagram verticale** | 1080×1350 | 1000×561 | **498px** |

L'emiciclo è largo e piatto (386,7 × 217), quindi nei formati larghi la larghezza si
esaurisce prima dell'altezza. La regola è una: **si riempie lo spazio che avanza con i pezzi
che esistono già** — la riga di sintesi e i tre totali di blocco, cioè gli stessi due della
forma compatta dell'embed. **Quinto consumatore di `fraseCorta()`, non un testo nuovo.** E
serve proprio dove non c'è un link: Instagram non ne ammette.

### Il comando non c'è dove l'API non c'è

Un comando che apre un foglio di condivisione senza poter allegare l'immagine **prometterebbe
una cosa che non fa**. Il ramo guarda la **capacità** — `canShare({files})` con un file vero
— non il nome del browser: la stessa grammatica di `'download' in a` e di
`navigator.clipboard`.

`share()` restituisce una promessa, quindi l'esito è **conoscibile**, come per la copia e a
differenza dello scarico. Ma con una distinzione che l'esportazione non aveva: **annullare non
è un errore**. Se il lettore chiude il foglio la promessa viene rifiutata con `AbortError`, e
allora non si dice niente — dichiarare un fallimento dove qualcuno ha cambiato idea è dire il
falso sul suo gesto.

**Il testo che accompagna non porta l'indirizzo**: `text` e `url` sono due parametri separati
in tutti e tre gli intent, e ripeterlo lo farebbe comparire due volte nel messaggio
pubblicato. I giorni al voto vengono da `ggCal()`, la stessa del conto alla rovescia — e
l'inventario di `giorni.js` è passato da dodici a **tredici** chiamate, perché la cosa contata
è cresciuta, non perché la regola sia cambiata.

### Il mutante che ha trovato un caso, non un difetto

Delle quattordici mutazioni ne moriva una sola in meno: togliere la guardia
`!nav.share || !nav.canShare` non faceva cadere niente, perché il `try/catch` copre già l'API
assente. **Guardando perché sopravviveva è saltato fuori il caso che la guardia esiste per
cogliere e che nessuna prova esercitava**: un browser che dichiara `canShare` ma **non ha
`share`**. Lì il `try/catch` non serve — `canShare` non lancia, risponde `true` — quindi il
comando comparirebbe e premendolo chiamerebbe una funzione che non esiste. È una **capacità
dichiarata per un'azione che manca**, e adesso è nell'elenco dei casi provati.

### La targa, e i due testi che non si conoscevano

Sulla riga del titolo ci sono **due testi** — titolo a sinistra, firma a destra — e nessuno
dei due sapeva quanto occupasse l'altro. Misurato in unità di viewBox:

| disegno | titolo + firma | spazio | esito |
|---|---|---|---|
| Blocco Netanyahu | 386,9 | 428 | ci sta per 41,1 |
| Opposizione sionista | 404,8 | 428 | ci sta per 23,2 |
| **Proiezione dei 120 seggi** | **430,9** | **398** | **sovrappone di 32,9** |
| Il modello giorno per giorno | 459,8 | 868 | larghissimo |

**Si rompeva uno solo, e gli altri due lo mancavano per 41 e 23 unità**: erano a un titolo più
lungo dal romperlo. Quindi la regola è **della targa**, non dell'emiciclo: si misura con la
sonda e, se i due non ci stanno, **la firma scende su una riga sua** — la targa cresce di 16
unità. Non si accorcia né la firma né il titolo: sono le due cose per cui la targa esiste.
Dove non si può misurare — jsdom, che non fa layout — `largoA()` restituisce 0 e non si
cambia niente: **non si decide su una misura che non si ha**.

### E una cosa che il banco ha imposto due volte

Togliendo un blocco duplicato ho **tagliato la coda di `embed.js`** — il conteggio e l'uscita
diversa da zero. La suite contava lo stesso, perché il banco legge lo stdout, ma chi
l'avesse lanciata da sola avrebbe visto verde con asserzioni fallite. **È il difetto di
`v5.js`, rifatto da me.** Rimessa e verificata: esce 1 quando qualcosa cade.

### E due difetti che ha trovato l'occhio, non il banco

**1 · La didascalia degli istogrammi finiva nell'emiciclo.** `targaPNG` usava `piede` per
**due cose**: la bandiera «questo disegno ha una didascalia» e l'altezza della fascia bassa.
Nel ramo della cornice l'altezza sovrascriveva la bandiera, e la targa dell'emiciclo — che è
la **A**, senza didascalia — si metteva a scrivere quella degli istogrammi: «la fascia chiara
è l'intervallo… il triangolo è la stima puntuale», sopra i seggi, a parlare di due cose che
nell'emiciclo non esistono. **Due significati sulla stessa variabile è il difetto, non il
valore**: adesso sono due.

**2 · La testata era nel sistema di coordinate sbagliato.** Le posizioni erano assolute —
`x="16"`, `y="19"`, `font-size="11"` — e funzionavano perché nell'esportazione **la tela
coincide con la larghezza del disegno**. Sulla prima card la tela è diventata 1200 e le stesse
costanti hanno prodotto tre righe da 11px accatastate nell'angolo, con la data a **x 414**
invece che al bordo destro.

Non era una strada doppia: era **una strada sola con l'unità di misura sbagliata**, ed è la
terza volta che questo file incontra la stessa forma — l'house effect in ordine di blocco «per
fortuna», l'ordine del pannello che coincide finché nessuna lista dell'ago della bilancia ha
seggi, e adesso `CW` uguale a `W` finché non esiste una card.

Adesso le quote stanno **in un posto solo** e si scalano: `1` nell'esportazione, `CW/PNG_RIF`
in una card. Verificato nei due versi che il rimedio chiedeva:

| | |
|---|---|
| i viewBox dell'esportazione | **identici**: 460×308, 460×308, 430×292, 900×410 |
| la firma dell'emiciclo | **scende ancora**, perché lì il titolo sfora davvero di 32,9 unità |
| la firma degli altri tre | resta al bordo destro, come prima |

**E la resa ha trovato quello che i numeri non avevano trovato.** Con le quote giuste la firma
si sovrapponeva ancora al titolo *nella card generata dal job*, perché il mio commento diceva
«dove non si può misurare non si cambia niente» — vero nel browser, dove la sonda c'è, **falso
nel lavoro notturno, che non ne ha**. Là `largoA()` restituisce 0, la somma è 0, e non
decidere **era** una decisione: quella sbagliata.

Adesso si stima per eccesso, con i rapporti **misurati** e arrotondati in su: **0,433 corpi per
carattere** per la firma e **0,533** per il titolo in grassetto, usati come 0,48 e 0,56.
Sovrastimare costa una riga, sottostimare fa sovrapporre — lo stesso argomento di `ETIW`
nell'etichetta dei 61. E non si sovrastima *troppo*: con 0,55 e 0,60 gli istogrammi mandavano
la firma sotto mentre nel browser resta in riga, cioè **la stima diceva una cosa diversa dalla
misura sullo stesso disegno**.

### L'indice leggeva i comandi montati negli h2

«**4La prossima Knesset Scarica PNG**» e «Scarica PNG**Condividi**» — due `textContent`
adiacenti concatenati senza spazio. La causa: `costruisciIndice()` prendeva l'intero
`textContent` dell'h2 e **sottraeva la stringa dell'`<em>`**, cioè un'esclusione per nome che
esisteva già. Togliere anche «Scarica PNG» sarebbe stata la stessa riparazione, e il comando
successivo sarebbe ricomparso.

**Non era cosmetico**: quella stringa è anche il nome accessibile del collegamento, quindi un
lettore di schermo diceva «La prossima Knesset Scarica PNG Condividi, collegamento».

La regola è strutturale: **il titolo è il testo che l'h2 contiene direttamente**, e tutto
quello che là dentro è un *elemento* non ne fa parte. Cercata la forma, gli altri testi
derivati sono a posto: gli `aria-label` dei pulsanti e la targa del PNG prendono sezione e
titolo da `PNG_DISEGNI`, che è una costante dichiarata, non dall'h2.

**E la prova copre il caso generale**: monta un comando che oggi non esiste dentro un h2 e
pretende che non compaia in nessuna voce.

### Sette mutazioni su dieci sopravvissute al primo giro

Dicevano una cosa sola: **le prove esercitavano la targa dell'esportazione, dove la tela
coincide col disegno**, quindi tutto ciò che distingue i due sistemi di coordinate era
invisibile — e dell'indice non c'era nessuna prova. Colmati i due buchi, `png.js` è passata da
155 a 161 asserzioni.

---

## La consegna del PNG: tre difetti, e nessuno era la rasterizzazione

Trovati il 24 agosto 2026 perché l'autore ha detto «a 380 lo scarico PNG non funziona».
La diagnosi è arrivata prima della riparazione, ed è servita: **la causa non era nessuna
delle tre che venivano in mente.**

### Quello che il banco ha detto, e che ha escluso le ipotesi facili

A 380, tema chiaro forzato dal selettore, transizioni spente, per tutti e quattro i disegni:

| tappa | `k-hist` | `k-hist2` | `k-emi` | `k-trend` |
|---|---|---|---|---|
| pulsante reso e dentro la finestra | sì | sì | sì | sì |
| il click arriva a `#kn26` in fase 3 | sì | sì | sì | sì |
| ridisegno a geometria **desktop** | 460×**308** | 460×308 | 430×276 | **900**×410 |
| blob SVG | 5.606 B | 5.609 B | 15.819 B | 63.582 B |
| `img load` | sì | sì | sì | sì |
| `toDataURL` | 1380×924 · 141,3 KB | 1380×924 · 145,2 KB | 1290×828 · 243,6 KB | 1800×820 · 315,7 KB |
| `a.click()` | col nome del file | idem | idem | idem |

**Zero errori in console**, e la tela **non è vuota**: campionati 1.481 pixel del PNG della
tendenza, **76 colori distinti**. Il pulsante c'era, la geometria desktop funzionava, la
rasterizzazione pure. Le tre ipotesi ovvie erano tutte e tre false.

**E due delle prime misure erano stabili e false**, il che vale più del risultato: le sonde
catturavano l'array della traccia **per riferimento** mentre io lo riassegnavo, e il
`MutationObserver` veniva scollegato **prima che la sua microtask scattasse**. Le due misure
insieme dicevano «il gestore non parte affatto» — una diagnosi coerente, verosimile e
sbagliata, che avrebbe portato a riparare il gestore. Rifatte con il riferimento risolto a
ogni chiamata e con `takeRecords()`. È la trappola 2 del banco in una veste nuova: lì il
browser restituiva un valore congelato, qui era la sonda a guardare l'oggetto sbagliato.

### 1 · Il riscontro parlava dove nessuno guarda

`msg()` scrive in `#k-msg`, che è `position:static` e sta a **1654px** nel documento. I
quattro comandi stanno a 3195, 3637, 6634 e 12687, in una pagina alta **18.177**:

| pulsante | distanza del riscontro |
|---|---|
| Blocco Netanyahu | **1.541px sopra** |
| Opposizione sionista | 1.983px |
| Emiciclo | 4.980px |
| Tendenza | **11.033px** |

Dopo il click `#k-msg` conteneva «Immagine scaricata.» con classe `msg show ok`, e nessuno
l'ha mai letto. **Non era un comando muto: era un comando che parla dove nessuno guarda, e
dal lato del lettore le due cose sono indistinguibili.** Valeva anche per l'errore, che è la
metà che serviva di più.

Non è specifico dei 380 — a 1265 il messaggio è ugualmente fuori vista — ma a 380 pesa due
volte, perché la pagina è alta 18.177 invece di ~10.500.

Il riscontro sta adesso **sul pulsante**: la parola cambia per 2,6 secondi e torna.
`#k-msg` resta e continua a portare l'errore per esteso — **qui la conferma, là la
diagnosi**. Il pulsante si **ricerca** per `data-png` invece di tenerne il riferimento, in
tutti e due i momenti: fra il click e la risposta può esserci stato un render, ed è la
lezione di `#k-house`.

### 2 · Non si può sapere se lo scaricamento è partito

Misurato, e decide la forma di tutto il resto:

| | |
|---|---|
| `a.click()` restituisce | `undefined` — nessun segnale |
| `ondownload` / `ondownloadend` / `ondownloaderror` | **assenti tutti e tre** |
| `'download' in a` | `true` — ma è una **capacità dichiarata**, non un esito |

Da cui due strati, e vanno tenuti distinti perché sono due cose diverse:

- **dove il fatto è noto** — l'attributo non è dichiarato: lo scaricamento non parte per
  definizione, quindi si apre l'immagine e si dice di tenerla premuta. **Il ramo scatta sul
  fatto, non sull'identità**: niente sniffing dello user agent, che sbaglia sempre e
  invecchia a ogni versione. `'download' in a` è una capacità, non un nome;
- **dove il fatto non è conoscibile** — l'attributo c'è, il click parte, l'esito è muto: la
  parola dichiara **quello che si è verificato**, cioè che l'immagine esiste.

**«Immagine pronta» e non «Scaricato».** Le quattro parole sono «Non riuscita», «Immagine
pronta», «Aperta: tienila premuta» e «Bloccata dal browser», e **nessuna promette che il
file sia stato salvato**. L'unico caso in cui la pagina può dire con certezza che è andata
male è il terzo: `window.open` restituisce `null`, e quello si sa.

### 3 · L'ancora era staccata e portava un data: da 141-316 KB

Misurato: `document.contains(a)` era **`false`**, e `a.href` era il risultato di
`toDataURL`. Chromium tollera tutte e due le cose — è per questo che sul banco funzionava —
ed è la combinazione che regge peggio altrove. Adesso l'ancora sta nel documento e l'href è
un `blob:` prodotto da `canvas.toBlob`, che toglie anche **il 33% del base64**: la tendenza
da 315,7 KB a circa 237.

**Il confine di quello che è misurato va detto**: su questo banco **non c'è Safari**, quindi
la fragilità dell'accoppiata staccata + `data:` è *nota e non misurata* qui. Quello che è
misurato è che la forma nuova regge dove reggeva la vecchia.

E l'URL **non si revoca dentro il gestore**: il browser deve poterlo leggere dopo. Un minuto
è abbondante e non trattiene niente di grosso.

### 4 · Il bersaglio era 71,9 × 12px

Area **863px²**, corpo 9,5, appoggiato al bordo destro. Portato a **44px**, e non aspettando
la voce 8 della coda: **era il comando che stava fallendo, e ripararne il riscontro
lasciandolo impossibile da centrare non avrebbe riparato niente.**

Cresce l'area, non la scritta: il corpo resta 9,5px e i 44 arrivano dall'imbottitura, con un
margine negativo che tiene il bordo ottico dov'era.

**E non tocca l'ancoraggio**, verificato e non dedotto: questi pulsanti stanno nell'h2 delle
sezioni e nelle due didascalie degli istogrammi, non nella fascia dell'indice. `.idx` resta
46,3 e `.idx.on` 97,4 contro i 112 dello `scroll-margin-top`. Le h2 passano da 35 a 44px —
9px per due sezioni — e le due didascalie non si muovono, perché erano già più alte di 44.

### Quello che le mutazioni hanno trovato nelle prove

**Due asserzioni su tre non potevano cadere**, ed è il caso più istruttivo di questo giro.

La prima elencava a mano le tre parole del riscontro e verificava che nessuna promettesse il
salvataggio: verificava **tre stringhe che aveva scritto lei**, quindi il mutante che porta
la parola del codice a «Scaricato» restava vivo. Adesso le parole si **estraggono dal
sorgente** di `esportaPNG` e la proprietà è sulle parole vere.

La seconda chiamava `rispostaPNG` direttamente, senza mai guardare **il punto in cui viene
chiamata**: il mutante che rimette `msg()` al posto suo restava vivo. La callback non è
esercitabile in jsdom, che non ha una tela, quindi il legame si prova **dove sta** — nel
sorgente — come per `og:title` e il job.

E una mutazione era **equivalente**: spegnere `toBlob` fa cadere sul ripiego, che produce
comunque un blob. Non era un mutante vivo, era una mutazione che non toccava la proprietà.
Rifatta mettendo un `data:` direttamente nell'ancora.

**E il banco ha lasciato il file guasto.** Il runner è morto in timeout durante la nona
mutazione, e `index.html` è rimasto con «Aperta: tienila premuta» sostituito da «Immagine
pronta». È la trappola già scritta — *quando lo si interrompe a metà, il file resta guasto* —
e questa volta **l'ha colta una prova**: «i quattro esiti dicono quattro cose diverse»,
scritta un quarto d'ora prima proprio per quel mutante. Le quattordici sedi sono state
ricontrollate una per una.

## Il calendario in flex: una griglia mostra il proprio fondo, e la forma è ricomparsa

Applicato il 24 agosto 2026. **È la seconda volta che questo difetto compare**, e la prima
era stata chiusa due giorni prima nella barra dei comandi: da lì viene il rimedio, che non
è stato inventato ma riusato.

### Il difetto, misurato

`#k-calend` era una griglia a **sei tracce fisse** con **sette tappe**. La settima apre una
riga nuova e le altre cinque tracce restano scoperte — e sotto non c'è la pagina, c'è il
**fondo del contenitore**, che qui è `--hair` perché **è così che sono disegnati i filetti
fra le schede**: fondo grigio sul contenitore, `gap:1px`, fondo `--card` sui figli. Il
filetto è il contenitore visto attraverso un varco di un pixel.

Misurato a 1265 con le transizioni spente: un rettangolo grigio di **892,5 × 169,5px**,
cioè **5,03 colonne** vuote sotto l'ultima riga.

**Non è un difetto di larghezza e non si vede in nessuna misura di sforamento.** Il
documento non scorre, niente esce dalla finestra, tutte le prove erano verdi ed erano verdi
a ragione: nessuna guardava che cosa ci fosse dove non c'è una cella.

### Tre condizioni, e serve che ci siano tutte e tre

1. il contenitore è una griglia a tracce di numero **fisso** — `repeat(N,…)`, non `auto-fit`
   né `auto-fill`, che le tracce vuote le collassano;
2. il suo fondo è **visibile e diverso** da quello dei figli;
3. i figli **non sono un multiplo** delle colonne.

Dove manca la seconda, una traccia scoperta mostra la pagina e non si vede niente — ed è il
caso di quasi tutte le griglie di questo file. **È la ragione per cui il difetto è raro e
per cui, quando c'è, è invisibile a chi cerca sforamenti.**

### Il rimedio è quello della barra dei comandi, e non riaccorda i numeri

**Il precedente è `.cmd` → `.cb`, chiuso il 22 agosto 2026 in `6478f35`**, ed è
letteralmente lo stesso idioma: `display:flex; flex-wrap:wrap; gap:1px; background:
var(--hair)` sul contenitore, `flex:1 1 <base>` e `background:var(--card)` sui figli. Lì
erano due tracce fisse con tre celle e il buco misurava 557,5 × 119,5px.

*(Correzione a una cosa che avevo detto prima di guardare: avevo affermato che un
precedente grid→flex nella barra dei comandi non esisteva. Esiste: avevo cercato `.pgb`,
che è un'altra cosa. Il precedente è `.cmd`/`.cb`, e l'attesa che lo fissa sta in `v7.js`,
tre righe sopra quelle del calendario.)*

**La mossa non è «riaccordare le colonne al numero di tappe»: è cambiare meccanismo.** Il
flex non ha tracce, quindi **non esiste una posizione scoperta per nessun numero di celle**.
L'ultima riga si spartisce quello che resta, e `flex-grow:1` glielo fa occupare tutto.

```css
#kn26 .cal{display:flex;flex-wrap:wrap;gap:1px;background:var(--hair);}
#kn26 .cal>div{flex:1 1 calc(100%/6 - 1px);}
@media(max-width:1000px){#kn26 .cal>div{flex-basis:calc(100%/3 - 1px);}}
@media(max-width:660px) {#kn26 .cal>div{flex-basis:calc(100%/2 - 1px);}}
@media(max-width:400px) {#kn26 .cal>div{flex-basis:100%;}}
```

**E qui conta più che nella barra dei comandi, perché le tappe cambiano.** Sono sette
adesso, due passano dopo il 27 ottobre, e ognuna aggiunta o tolta sposta il resto: una
griglia andrebbe riaccordata a ogni cambio, e nessuno se ne ricorderebbe. Il flex non ha
niente da riaccordare — e questo è il motivo per cui la prova **non asserisce che le tappe
siano sette**, ma che il numero non compaia da nessuna parte nel foglio.

**Due dettagli che sembrano cosmesi e non lo sono.** La base è `calc(100%/6 - 1px)` e non
`100%/6`: il gap prende un pixel fra le celle, e senza la sottrazione l'ultima di ogni riga
scenderebbe a capo da sola. E i **filetti sopravvivono al cambio perché non erano della
griglia**: sono il gap più il fondo, e il gap in flex si comporta identico.

### Verificato su browser, con le tappe che non ci sono

Cinque, sei, sette e otto tappe — le due in più costruite a mano — a **1265, 760, 500 e
380**, con le transizioni spente:

| | prima | dopo |
|---|---|---|
| 1265 · 7 tappe in 6 colonne | **892,5 × 169,5px scoperti** | **zero** |
| 1265 · 8 tappe | 743,8 × 169,5 | zero |
| 1265 · 5 tappe | 1042,9 × 169,5 | zero |
| 760 · 7 tappe (3 per riga) | 337,5 × 169,5 | zero |
| 380 · 7 tappe (2 per riga) | 162,5 × 152 | zero |
| varco del filetto, ovunque | 1px | **1px** |

A sei tappe esatte il buco non c'era né prima né dopo: è il caso che avrebbe fatto dire
«va bene così» a chi guardasse un giorno solo.

### Cercata la forma, non l'istanza

È la lezione di `nmA()`, e qui ha trovato qualcosa. Setacciando **tutte** le regole del
foglio per le tre condizioni insieme, le griglie a tracce fisse **col fondo visibile** sono
**due**:

| | colonne | figli | resto | |
|---|---|---|---|---|
| `#k-calend` | 6 | 7 | **5** | riparata |
| `#k-probs` | 4 | 4 | **0** | **latente** |

Le quattro probabilità — coalizione, opposizione, arabi, stallo — sono **strutturali**, non
un elenco che cresce: oggi il resto è zero e il buco non c'è. Ma la forma è la stessa, e il
buco comparirebbe il giorno in cui diventassero tre o cinque. **È dichiarata in
`test/suite/griglie.js` con la sua ragione, e se ne compare una terza la prova cade e chiede
di guardarla**: è l'inventario di `opacita.js` applicato al layout — non un divieto, un
elenco con un perché.

Le altre griglie del file usano `auto-fit`, che le tracce vuote le collassa, oppure non
hanno un fondo proprio. `.guida` è l'unica che ha lo stesso fondo e lo stesso gap del
calendario ed è **salva per l'`auto-fit`**: una mutazione che gliela porta a `repeat(3,…)`
fa cadere la prova.

`test/suite/griglie.js`, 15 asserzioni. **Mutata dodici volte, dodici mutanti morti**: il
ritorno alla griglia, le celle che non crescono, la base senza la sottrazione del gap, il
fondo tolto, il gap tolto, il fondo delle celle tolto, le tre fasce di larghezza una per
una, il `flex-wrap` tolto, una seconda griglia della stessa forma non dichiarata, il numero
di colonne di `.probs` cambiato in silenzio, e un `nth-child` che rimette una regola di
posizione nel calendario.

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

## «A parametri identici» era falso per una leva su sei

Trovato misurando, il 23 agosto 2026, mentre si scriveva la struttura dei testi dei quattro
blocchi. Il riquadro della direzione afferma:

> Questo riquadro confronta due esecuzioni complete del modello **a parametri identici**:
> isola il movimento della proiezione da quello dei singoli sondaggi.

**Non era vero con la leva degli apparentamenti accesa.** `PREC` girava con
`dhondt(qp, taglio)`, cioè valutando gli accordi **alla data del taglio**: un accordo
annunciato il 22 agosto non esisteva il 16, quindi entrava nel termine di oggi e non in
quello di paragone. Il lettore premeva un pulsante e la pagina gli attribuiva alla
settimana un movimento che aveva causato lui — **−1 al blocco Netanyahu**, e non l'aveva
fatto nessun sondaggio.

**Le altre cinque leve non avevano il difetto, e la ragione è strutturale**: swing,
affluenza, esclusione di istituti, «solo ultimi 7 giorni» e Lista Unita vivono nelle
variabili che `attiviAl()` e `quoteDa()` leggono, quindi arrivano a tutti e due i termini
da sé. **Gli accordi sono l'unico parametro ancorato a una DATA invece che allo stato**, ed
è per questo che sono l'unico a sbagliare. Verificate una per una prima di toccare il
codice, non dedotte:

| leva | muove la proiezione | muove il termine di paragone |
|---|---|---|
| swing +4 · affluenza −20 · escludi Direct · Lista Unita | sì | sì |
| solo ultimi 7 giorni | no (oggi) | sì |
| **apparentamenti** | **sì** | **NO** ← |

### Il rimedio, e la lettura che resta

`PREC` usa `null` al posto di `taglio`: **i parametri sono quelli di adesso**. Ed è l'unica
uscita che rende vera la frase che il riquadro già scrive — le altre due (dichiarare la
causa, o nascondere il riquadro) lasciavano in piedi un confronto fra cose diverse.

**La lettura «com'era» non sparisce: sta in `serieModello()`**, che passa la data di ogni
punto, ed è **l'unica cosa nella pagina che dipende da essa**. Le due domande sono diverse
— «che cosa diceva il modello quel giorno» e «di quanto si è mosso a parità di parametri» —
e da oggi ciascuna ha la sua chiamata invece di condividerne una sbagliata per una delle
due. `test/suite/direzione.js` tiene la separazione: un accordo datato in mezzo
all'archivio non muove **nessun** punto anteriore, e muove quelli successivi.

**Ma le due letture si vedono insieme, e divergevano in silenzio.** Con l'accordo acceso
l'ultimo punto della linea vale 51 e la proiezione in cima 50: la serie non lo comprende
perché è stato annunciato **dopo l'ultima rilevazione**, quindi non c'è nessun punto in cui
possa comparire. È corretto e nessuna parola lo diceva. Adesso c'è `notaSerie()`, che
scrive la spiegazione **solo quando la differenza esiste davvero e solo se ci sono accordi
in vigore** — una divergenza di altra origine vorrebbe un'altra diagnosi, e attribuirla
agli accordi sarebbe una frase falsa scritta con sicurezza.

### La frase esce dalla proprietà, non le sta accanto

`firmaRiparto(cp)` = i parametri del lettore (`firmaPar()`, che era già la chiave della
cache della serie e adesso è una funzione sola) **più le coppie che sono entrate davvero
in quel riparto**. `PREC` porta la sua firma; il riquadro scrive «a parametri identici»
**solo se coincide** con quella del riparto di oggi, e altrimenti dichiara che non
coincidono. Il ramo alternativo col codice di oggi non si vede mai — ma è quello che rende
la prima frase un'affermazione invece di una decorazione, e la prova lo esercita
guastando la firma.

Le coppie stanno nella firma del **riparto** e non in quella dei parametri perché non sono
una leva sola: la leva governa i soli annunciati, i depositati entrano comunque, e una
coppia con una lista sotto soglia si scioglie. Due riparti possono ricevere accordi diversi
**a leve identiche**, e in quel caso la frase deve dirlo.

`test/suite/direzione.js`, 41 asserzioni, **nove mutanti e nove morti**: il ritorno alla
data del taglio, `dhondt` senza le coppie passate, il Monte Carlo del paragone lasciato
indietro, la frase scritta senza guardare la proprietà, la firma senza le coppie, la serie
storica portata ai parametri di adesso, la nota della tendenza spenta, la nota che dà la
colpa a un accordo che non c'è, e la chiave della cache senza gli accordi.

### E due difetti del banco, trovati dalle prove di questa riparazione

**La cache della serie non conosceva gli accordi.** `serieModello()` si ricalcola quando la
chiave cambia, e la chiave era archivio più parametri del lettore: un accordo **depositato**
— che entra senza toccare nessuna leva — lasciava servita la serie di prima. In pagina non
si vede, perché la tabella cambia solo quando si modifica il file; è una cache che
rispondeva giusto per una ragione che non è la sua, e l'ha trovata una prova che aggiungeva
un accordo a mano.

**Una suite che muore A METÀ contava verde**, ed è il buco rimasto aperto dopo v5.js. Il
banco dichiara fallita una suite con **zero** asserzioni; con qualche OK già stampato e
nessun KO, invece, il conteggio non aveva niente da dire. È successo il 23 agosto: la suite
nuova moriva al 23 ottobre — `PREC` è `null` quando la finestra dei sette giorni si svuota —
e `npm run spazzola` rispondeva **«tutte in piedi»**, cioè taceva proprio nel caso che
esiste per trovare. Adesso `esegui.mjs` e `spazzola.mjs` guardano anche il codice d'uscita:
morire dopo N asserzioni è una caduta come le altre. E `direzione.js` ribasa l'archivio con
`frescura.js`, che è il rimedio già scritto per le sei suite del punto 13.

## Il messaggio dell'aggiornamento: due difetti che nessuna prova poteva vedere

Trovati a occhio, riparati il 23 agosto 2026. Stavano nel messaggio del pulsante «Aggiorna
i sondaggi», cioè **dentro il gestore, dietro una chiamata di rete**: l'unico modo di
leggerli era premere e guardare. Adesso il testo esce da `msgAggiorna(out,nuove,ev)`, una
funzione pura che la suite esamina senza rete — è la stessa mossa fatta per le guardie del
lavoro notturno.

**1 · «e è stata ignorata».** La congiunzione era una costante e il seguito un ramo, e chi
ha scritto il ramo guardava il numero, non la lettera: al singolare usciva «e è», che in
italiano non si scrive. C'è `ed(s)`, che prende la frase e sceglie la congiunzione — la
stessa famiglia di `acc()` e di `inPc()`, cioè una regola di lingua che dipende da una cosa
nota solo a tempo di esecuzione.

**2 · Il conto delle categorie non tornava davanti al lettore, e l'aritmetica era giusta.**
Misurato sulla pagina vera, eseguendo il parser vero: **33 righe scartate**, e il messaggio
stampava **9, 6, 3 e 24** — che sommano 42. Nessuna riga era contata due volte e nessuna
mancava: **il 9 delle incoerenze della fonte È il 6 della somma più il 3 del blocco**, e
33 = 9 + 24. Ma la scomposizione proseguiva l'elenco con le stesse virgole delle altre
voci, e a dire che era una scomposizione c'era **solo il grassetto** — un segnale troppo
debole per reggere un'aritmetica che il lettore rifà.

Rimedio, e la regola che ne esce: **fuori dalle parentesi ogni numero della frase è un
numero di righe, e quelli sommano il totale dichiarato.** La scomposizione sta dietro un
«di cui», dentro le parentesi; con una causa sola la causa si dice **senza numero**, perché
«5 (di cui 5 …)» fa rifare un conto già fatto; e dentro le parentesi finisce anche il
**120** dei seggi, che è una soglia e non un conto. In più c'è un **residuo**: `contate`
tiene la somma delle voci, e quel che avanza diventa una voce sua — senza, un `tipo` nuovo
aggiunto al parser toglierebbe righe dalla somma in silenzio.

La prova è scritta sulla proprietà del **lettore**, non su quella del codice: si prende la
frase, si tolgono le parentesi, si sommano i numeri rimasti. Mutata sette volte — la
congiunzione costante, `ed()` che sceglie sempre «e», la scomposizione rimessa in fila nei
due rami, il residuo tolto, le due incoerenze non sommate — e nessun mutante è
sopravvissuto. Quello della scomposizione a due cause riproduce esattamente il difetto di
partenza: `9 + 6 + 120 + 3 + 24 = 162`.

## Le meta testuali, e la regola del job riscritta invece che aggirata

Applicate il 23 agosto 2026. Sono la prima voce della coda perché sono quello che serve
perché la pagina si possa mandare in giro: finora, condividendone il link, non usciva
niente.

### Che cosa prendeva un aggregatore, misurato e non dedotto

Facebook, X, WhatsApp, Slack e il primo passo di Googlebot leggono il **file servito**: non
aspettano il render e non eseguono niente. Il `<head>` aveva soltanto `charset`, `viewport`,
`title`, due favicon in data URI e `theme-color` — **zero `og:`, zero `twitter:`, nessuna
`description`, nessun `canonical`** — quindi ognuno ripiegava sul corpo. Costruito il DOM
con jsdom senza eseguire gli script, i ripieghi sono **due, e sbagliati tutti e due**:

| ripiego | che cosa esce |
|---|---|
| **A** · testo del corpo così com'è | `#kn26{ --paper:#F7F8FA; --card:#FFFFFF; --wash:#F1F5FC; …` — **il foglio di stile**, perché in questo file sta dentro il `body`: è la trappola 4 del banco che si presenta da un'altra porta |
| **B** · testo senza foglio e script | «Israele · Modello previsionale **AutoChiaroScuro** — La proiezione dei 120 seggi della 26ª Knesset… — **Il modello non è ancora partito.** Questa pagina calcola tutto nel browser: senza JavaScript restano solo i titoli e i trattini…» |

Il punto 6 della coda vecchia diceva che uno scraper avrebbe preso l'avviso di avvio.
**Era vero a metà**: lo prende solo chi toglie prima il foglio, e prima dell'avviso incontra
le tre parole del selettore del tema attaccate fra loro. Chi non toglie il foglio prende il
CSS. La descrizione esplicita chiude tutti e due i casi, perché quando c'è nessun
aggregatore va a cercare il ripiego — ed è la proprietà che `test/suite/meta.js` asserisce:
la description **non è** nessuno dei due.

### Che cosa è stato scritto

`description` e `og:description` portano la stessa stringa, fissa. **Fissa è una scelta e
non una dimenticanza**: dice che cosa fa il modello, non che cosa dice oggi, quindi è vera
il giorno in cui è scritta e il giorno dopo il voto. È l'invariante 10 ottenuta **non
calcolando** invece che calcolando — l'unico caso in cui quella regola si soddisfa così, e
vale la pena saperlo perché il riflesso sarebbe l'opposto.

Nel markup non c'è modo di scrivere una stringa una volta sola, quindi le due copie le lega
un controllo: `test/struttura.mjs` verifica che `description` e `og:description` siano
identiche, e che il `canonical` e `og:url` siano lo stesso indirizzo. È l'idioma dei token
di blocco applicato al `<head>`.

**`twitter:card` è `summary` e non `summary_large_image`**, e la ragione è che `og:image`
non c'è: la targa grande senza immagine si degrada in una scheda con un riquadro vuoto.
Diventa `summary_large_image` **nello stesso commit** in cui il lavoro notturno comincia a
generare l'immagine. La prova asserisce che oggi `og:image` **non** ci sia: dichiararla
senza generarla sarebbe una promessa che nessun file mantiene.

### og:title lo scrive il job, e viene dalla stessa funzione dell'h1

`og:title` deve dire lo stato del modello — è la stessa domanda a cui risponde l'h1 — ma un
aggregatore non esegue niente: **un og:title scritto dal render sarebbe invisibile proprio a
chi lo cerca.** Quindi lo scrive la notte, dentro `index.html`, con l'archivio appena
aggiornato.

E viene da `titoloCortoOra()`, che è la riga con cui `rTitolo()` scrive `document.title`.
Non è un vezzo: **la seconda strada passa per un altro processo**, un modulo Node che nessun
render esercita, dove una divergenza non la vedrebbe nessuno. Se un giorno `rTitolo()`
cambiasse il modo di scegliere la forma, la scheda di condivisione resterebbe indietro in
silenzio. `test/suite/meta.js` lega le due strade su **tutte e dodici le celle** del titolo
— non sulla sola che l'archivio di oggi produce, che sarebbe un legame provato sul caso che
c'è — e legge il **sorgente del job** per pretendere che il titolo esca da
`titoloCortoOra()` e che `formaTitolo`, `titoloCorto`, `cellaTitolo` e le tabelle dei testi
non compaiano affatto. È il controllo strutturale applicato alla lingua.

**Il `<title>` statico resta neutro, e non è un'incoerenza.** «Knesset 2026 — Modello
previsionale» non afferma nessun risultato, per la stessa ragione per cui l'h1 del markup
non ne afferma: lo leggono chi apre il file da disco, chi arriva prima della prima notte e
chiunque lo trovi con il job fermo, e a nessuno dei tre può essere diventato falso. Lo
stesso valore sta dentro i marcatori come **ripiego** di `og:title`, e la notte lo sostituisce.

### `og:title` HA UN CARATTERE DI MARGINE, e la risposta è quasi certamente no

Misurato il 27 agosto 2026, cercando dove far entrare la dichiarazione dell'ipotesi:

| | |
|---|---|
| il tetto | **60 caratteri**, coda « · Knesset 2026» compresa (15) |
| il titolo più lungo, su tutte le celle e tutti i valori di `[X]` | **58** |
| **margine** | **1 carattere** |

**Qualunque cosa si voglia aggiungere lì va misurata PRIMA, e la risposta è quasi certamente
no.** Non c'è spazio per una clausola, per un inciso, per una sigla: nemmeno per «·».

E il tetto non è arbitrario, che è la ragione per cui non si alza. È il `<title>`: finisce
nella linguetta del browser, dove oltre i sessanta caratteri viene troncato con i puntini, e
nella scheda di condivisione, dove la parte tagliata è la coda — cioè « · Knesset 2026»,
l'unica cosa che dice di che paese si parla. Un titolo che perde quella coda diventa
«Maggioranza solo con i partiti arabi», che è una frase su nessun luogo.

**Il numero lo tiene già una prova**: `test/suite/titolo.js` verifica il tetto su ogni cella
e ogni valore di `[X]` fino a tre cifre, e in più asserisce che **il tetto morde davvero** —
che almeno un titolo ci arrivi vicino. Senza quella seconda asserzione la prima passerebbe
anche il giorno in cui tutti i testi si accorciassero, e non coglierebbe un testo allungato
domani.

Quando è servito dichiarare un'ipotesi, quel margine ha deciso da solo dove NON poteva
andare: la dichiarazione è finita nel testo di condivisione e nella targa dell'anteprima.
Vedi «Quello che esce dalla pagina deve portare l'ipotesi con sé».

### La forma corta non può dire più della lunga

Trovato il 28 agosto 2026 guardando l'anteprima di un link, non il codice — e cercando la
classe invece dell'istanza sono venuti fuori **tre difetti dove se ne cercava uno**, di due
famiglie diverse.

**È peggio di una svista, per dove vive.** La forma corta è quella che **esce** dalla pagina
— la scheda di Telegram, quella di WhatsApp, il risultato di ricerca — cioè finisce
precisamente dove nessuno può confrontarla con la lunga. La lunga la corregge un lettore che
ha la pagina davanti; la corta la legge chi ha solo quella.

**Le due non possono essere identiche, e non è quello il vincolo.** Il tetto lascia **45
caratteri** alla frase — 60 meno i 15 della coda « · Knesset 2026» — e la lunga di `f3` ne usa
76. Il taglio ha il permesso di togliere il numero, la frequenza, le subordinate. **Non ha il
permesso di cambiare la posizione né di alzare la scala.**

E una cosa da sapere prima di misurare: **il tetto si verifica con `[X]` a TRE cifre**, non a
due. Un blocco arriva a 120, e quella cifra in più ha deciso da sola metà delle risposte qui
sotto.

#### Famiglia 1 · la corta perde il modale della lunga — CHIUSA

| | forma lunga | forma corta | |
|---|---|---|---|
| **PRIMA/f3** | «potrebbero essere decisivi» | ~~«Maggioranza solo con i partiti arabi»~~ → **«I partiti arabi potrebbero essere decisivi»** (42 · 57) | **riparata** |
| **DOPO/f3** | «potevano essere decisivi» | ~~«Vigilia: serve l'appoggio dei partiti arabi»~~ → **«Vigilia: i partiti arabi potevano decidere»** (42 · 57) | **riparata** |

La seconda non l'aveva vista nessuno: l'ha trovata l'asserzione al primo giro.

**E non si è potuta riparare copiando la prima**: il parallelo diretto — «Vigilia: i partiti
arabi potevano essere decisivi» — misura **49 caratteri, 64 con la coda, e sfora**. Le due
alternative che stavano nel tetto sono state **scartate con la loro ragione**, e le ragioni
valgono oltre il caso: «Vigilia: gli arabi potevano essere decisivi» (43 · 58) dice **«gli
arabi»**, che è una designazione **etnica** dove «i partiti arabi» è **politica**, e la pagina
tiene quella distinzione dappertutto; «I partiti arabi potevano essere decisivi» (40 · 55)
rompe il **«Vigilia:»** con cui aprono tutte e dodici le forme dell'era.

**L'inventario `SCIVOLATE_NOTE` è tornato vuoto**, e resta la struttura senza la voce: è
l'idioma di `opacita.js` che funziona fino in fondo — la voce dichiarata è stata tolta perché
il difetto è stato chiuso, e la prova lo pretende.

#### Famiglia 2 · la corta AFFERMA più della lunga — CHIUSA

**`f4` non perdeva nessun modale e sbagliava lo stesso, anzi peggio.** La lunga dice «nessun
blocco ha la maggioranza… **a decidere sono le liste dell’ago della bilancia**»; la corta
diceva «Nessuna maggioranza **possibile**: stallo pieno». Ma una maggioranza **è** possibile —
con l’ago della bilancia, cioè con la cosa che la lunga afferma. **La corta negava quello che
la lunga dichiara**: non una sfumatura persa, una contraddizione. E dal 28 agosto non era più
un caso di scuola: l’ago della bilancia ha **cinque seggi**.

| | corta nuova | car. | con coda |
|---|---|---|---|
| **PRIMA/f4** | «Decidono le liste dell’ago della bilancia» | 41 | **56** |
| **DOPO/f4** | «Vigilia: decidevano le liste dell’ago» | 37 | **52** |

Dicono **chi decide invece di negare**, e sono quasi verbatim dalla lunga.

**Due scarti con la loro ragione, e valgono oltre il caso.** «Nessun blocco ha i numeri:
decide l’ago» (54) sta nel tetto ed è stata scartata perché **«l’ago» senza «della bilancia»
è un termine tecnico che fuori contesto nessuno riconosce** — e la corta vive precisamente
fuori contesto. Nella forma DOPO invece «dell’ago» resta, perché lì il parallelo con la PRIMA
basta a disambiguare: **«Vigilia: decidevano le liste dell’ago della bilancia» misura 52
caratteri e 67 con la coda, e sfora.**

#### Famiglia 3 · il qualificatore che sparisce — DUE su sei chiuse

Sei celle lasciavano cadere **«senza i partiti arabi»**: `f2`, `f6o`, `f7o`, nelle due ere. È
la clausola che distingue quella cella da `f5o3` e da `f3`, cioè l’intera questione politica
del paese. **«Da sola» dice la stessa cosa e costa 8 caratteri invece di 21**, perché nel
modello l’alternativa è una sola.

**Non entra come inserimento in nessuna delle sei** — misurato con `[X]` a **tre cifre**, che
è il caso che il tetto deve reggere. Due entrano barattandola con « seggi»:

| | corta nuova | con coda | |
|---|---|---|---|
| **PRIMA/f2** | «Maggioranza all’opposizione da sola: 120» | **55** | applicata |
| **PRIMA/f7o** | «Opposizione oltre la soglia da sola: 120» | **55** | applicata |
| PRIMA/f6o | non ha « seggi» da barattare | 62 | **aperta** |
| DOPO/f2 · f6o · f7o | | 66 · 66 · 66 | **aperte** |

**Il baratto è voluto e va saputo**: i sei caratteri di « seggi» il lettore li ricava dal
contesto — il titolo di una pagina che conta seggi — mentre ventun caratteri di clausola
politica non si ricavano da niente.

**Le quattro aperte non hanno una prova, ed è dichiarato**: togliere un qualificatore non è
affermare di più, quindi nessuna delle due asserzioni le coglie. Verificato mutando —
rimettere `f2` come stava lascia il banco verde. Sta scritto qui, e la mutazione che
sopravvive è **prevista**, non un buco scoperto dopo.

#### Le prove: due classi, e nessuna nomina una stringa

Asserire che `f3` dice «potrebbero» sarebbe provare la stringa appena scritta. Le due
proprietà sono meccaniche e valgono anche per le celle scritte domani:

1. **il modale sopravvive** — se la lunga porta `potrebbe/potrebbero/poteva/potevano`, la
   corta ne porta uno;
2. **la corta non alza la scala** — un elenco chiuso di parole che rendono una proposizione
   assoluta (`solo`, `possibile`, `sempre`, `mai`, `unico`, `certo`, `sicuro`) non può
   comparire nella corta se non compare nella lunga.

La seconda è **grossolana di proposito**: non legge l’italiano, guarda un elenco. Coglie i due
casi veri di questo file senza pretendere di capire la frase.

**E CONFRONTA PAROLE INTERE, non sottostringhe — una scelta che un mutante ha dovuto
insegnarmi.** Avevo scritto che serviva per non accendere «da sola», ed **era sbagliato**:
«solo» non è sottostringa di «sola», s-o-l-a contro s-o-l-o, quindi quel caso non distingue
le due strategie e il mutante a sottostringa **sopravviveva**. Il caso vero è una parola
dell’elenco **nascosta dentro un’altra** — «comunicata» contiene «unica» — e adesso è
l’autotest che uccide quel mutante. La difesa scritta a ragionamento era plausibile, coerente
e falsa: l’ha smentita la mutazione, non la rilettura.

**Il limite è dichiarato**: nessuna delle due coglie la **perdita** di un qualificatore, cioè
la famiglia 3. Una corta che lascia cadere «senza i partiti arabi» passa, perché toglie
invece di aggiungere.

**I due inventari sono tornati vuoti**, ed è l’idioma di `opacita.js` che gira per intero:
una voce **non dichiarata** fa cadere, una voce dichiarata **già risolta** fa cadere anche
lei — così chi ripara è costretto a togliere la riga invece di lasciarci una scusa — e le
quattro celle riparate hanno fatto togliere le loro righe.

**E il controllo che sa fallire è diverso per le due, e la differenza conta.** Per il modale è
una proprietà del corpus: «almeno una lunga porta un modale», e resta vera dopo la
riparazione. Per la scala **non poteva esserlo**: «almeno una cella la esercita» sarebbe
caduta *per la riparazione* invece che per un difetto, appena f4 è stata sistemata. Lì il
rilevatore si prova su **casi costruiti** — sa accendersi, sa stare zitto, confronta parole
intere — così la garanzia non dipende dal corpus e resta valida il giorno in cui il corpus è
pulito. *Una guardia che si spegne quando il codice guarisce non è una guardia.*

**Quindici mutazioni fra i tre giri, quattordici morte e una viva per progetto**: le quattro
celle che tornano al testo vecchio, le voci tolte dai due inventari, le celle «riparate» con
la voce lasciata, i modali tolti da tutte le lunghe, l’elenco delle assolute svuotato, il
confronto portato a sottostringa. **La viva è `f2` che riperde «da sola»**: è la famiglia 3,
che per costruzione nessuna prova copre, ed è verificata come tale invece che sperata.

### La regola del job: riscritta, non aggirata

Fino al 23 agosto 2026 il lavoro notturno **toccava solo `dati/`**, e quella regola era
anche il segnale d'allarme: un commit notturno su `index.html` era per definizione
un'anomalia. Scrivere `og:title` la rompe, quindi la regola è stata riscritta con
l'eccezione più stretta che si potesse dare — e il segnale con lei.

- **Una regione delimitata**, fra `<!-- ══ META DELLO STATO · INIZIO` e
  `<!-- ══ META DELLO STATO · FINE ══ -->`. Dentro può stare **solo un elenco dichiarato**:
  oggi `og:title` e basta. `test/struttura.mjs` verifica che i marcatori ci siano una volta
  sola e nell'ordine giusto, e che la regione non contenga nient'altro — se un giorno ci
  finisse dell'altro, l'eccezione smetterebbe di essere stretta senza che nessuno l'abbia
  riaperta.
- **`scriviMeta(html, titolo)` è pura e sa rifiutarsi.** Marcatore mancante, marcatori
  invertiti, commento non chiuso prima della fine: restituisce `null` e il job si ferma,
  invece di indovinare dove metterlo. La parte che conta non è che scriva — è che **non**
  scriva quando la regione non c'è più. Ed è **idempotente**: riscrivere lo stesso titolo
  non cambia un byte, o il job committerebbe ogni notte una riga identica e un commit che
  non cambia niente rende invisibile quello che cambia qualcosa.
- **Il segnale nuovo è una prova, non una dichiarazione.** Con `LAVORO_NOTTURNO=1` —
  impostato dal workflow e solo lì — `struttura.mjs` legge `git diff --unified=0` di
  `index.html` e fallisce se una riga cambiata cade **fuori** dalla regione. Fuori dal job
  il controllo non si applica, e allora **stampa che non si applica**: c'è un terzo esito,
  `··`, perché un controllo saltato in silenzio è un controllo che non c'è.
  Verificato in un repository usa-e-getta, nei quattro versi: niente cambiato → OK; solo
  `og:title` cambiato → OK; una riga toccata fuori → **KO con uscita 1**; una riga tolta
  fuori → **KO**.
- **Le meta si scrivono DOPO le guardie**, insieme agli altri file. Una guardia che scatta
  esce senza scrivere niente, ed è il contratto di tutto il resto: un `og:title` aggiornato
  su un archivio respinto direbbe il contrario di quello che la pagina calcola.

### Due difetti trovati scrivendo, e il secondo è del banco

**1 · Un tag di apertura dentro un commento HTML sposta l'inizio del blocco di script.**
La prima stesura del commento nel `<head>` nominava i due elementi con i loro tag, angolari
compresi. Un commento il browser non lo legge — ma `test/estrai.mjs` e `test/struttura.mjs`
cercano i blocchi di script con un'espressione regolare **sul file**, non sull'albero, e
quel `<script>` scritto per spiegazione ha portato l'inizio del blocco 107 KB indietro:
l'intero `<head>` è finito dentro «il JavaScript», e il controllo degli URL assoluti ha
dichiarato estraneo il `canonical` che avevo appena scritto. **Dentro un commento di questo
file i nomi dei tag si scrivono a parole.** Un tag di *chiusura* sarebbe stato peggio:
quello spezza il blocco anche per il browser.

**2 · Il terzo esito mancava a `struttura.mjs`.** Il file aveva due colonne, OK e KO, e un
controllo che non si applica in un certo contesto non è né l'uno né l'altro: stamparlo OK
sarebbe stato il falso verde di sempre, ometterlo avrebbe cancellato l'unica traccia che il
controllo esiste. Adesso c'è `na()`, che stampa `··` e non conta in nessuna delle due
colonne.

**Mutata quattordici volte, quattordici morti**: la description tolta, `og:description`
divergente, il canonical verso un altro indirizzo, `twitter:card` promosso senza immagine,
`og:type` sbagliato, il marcatore di chiusura rinominato, una meta estranea infilata nella
regione, `titoloCortoOra()` che dimentica `votoPassato()`, che perde la coda, il render che
scrive un titolo suo, il job che ricompone il titolo per conto suo, `scriviMeta()` che non
protegge le virgolette, che scrive coi marcatori mancanti, e che riscrive anche il commento.

**E una di quelle quattordici è morta soltanto con l'orologio avanti.** Il mutante che
spegne `votoPassato()` dentro `titoloCortoOra()` è **invisibile oggi** — prima del voto
`votoPassato()` vale già `false`, quindi la mutazione non cambia niente — e muore con il
calendario al 20 novembre. Non è una debolezza della prova: è l'invariante 10 vista dalla
parte della mutazione, e l'unico modo di saperlo è spazzolare. **Una mutazione va provata
anche nel futuro in cui il codice che tocca comincia a contare.**

---

## La tabella dei sondaggi: l'ordine è dei blocchi, e la fonte è l'anagrafica

Applicato il 23 agosto 2026, metà desktop del punto 2 della coda.

Le ventidue colonne seguivano l'ordine di Wikipedia — `P[i].o` — e quell'ordine **mescola**.
Misurato sull'anagrafica di oggi: i venti id danno **cinque gruppi contigui per quattro
blocchi**, perché Yisrael Beitenu è dichiarato «opposizione» e sta a `o=13`, cioè **dopo**
le quattro liste dell'ago della bilancia. La domanda che un lettore fa a quella tabella —
«questo istituto dove vede il blocco» — si risponde leggendo una fascia, e una fascia
spezzata non si legge.

Adesso le colonne passano da `colonneBlocco()`, con i **filetti a due tinte** dove il blocco
cambia: lo stesso idioma dell'house effect, e la **stessa dichiarazione** nel foglio, non una
copia.

### Tre cose che questa mossa ha imposto, e nessuna era prevista

**1 · Nemmeno l'ordine dei blocchi è scritto.** Non c'è l'elenco dei quattro: l'ordine
**fra** i blocchi è quello in cui l'anagrafica li presenta, cioè il **minimo `o`** di
ciascuno, e oggi dà arabi · opposizione · ago della bilancia · coalizione, che è la lettura
da sinistra a destra che la pagina usa dappertutto. Un elenco scritto qui sarebbe la copia
che l'8 settembre resta indietro.

**2 · Il minimo si calcola su `IDS` intero, non sulle colonne passate.** Le due tabelle
filtrano in modo diverso — l'archivio tiene le liste con almeno un seggio in una
rilevazione, l'house effect quelle con almeno tre rilevazioni — e se l'ordine dei blocchi
dipendesse dal filtro le due potrebbero disporli in modo diverso. **L'ordine dei blocchi è
una proprietà dell'anagrafica, non dei dati del giorno.**

Questo l'ha trovato una mutazione, e vale la pena dire come. Scambiando `IDS` con `ids`
dentro `colonneBlocco()`, **nessuna prova cadeva**: il sottoinsieme che avevo scelto per la
prova — un id ogni due — non distingue le due strade. Il caso che le separa è quello vero
dell'8 settembre: un filtro che di un blocco tenga **solo** la lista che sta dopo un altro
blocco nell'anagrafica. Oggi è Yisrael Beitenu; col minimo calcolato sul filtro,
l'opposizione scivolerebbe dopo l'ago della bilancia e le due tabelle disporrebbero i
blocchi in due ordini diversi. La prova adesso **cerca** quella lista nell'anagrafica invece
di nominarla — scriverne il nome sarebbe la costante che l'8 settembre resta indietro.

**3 · L'house effect era in ordine di blocco PER FORTUNA, e nessuno lo sapeva.** Il commento
nel foglio diceva «le colonne erano già in ordine di blocco». È vero **solo perché le quattro
liste dell'ago della bilancia non arrivano a tre rilevazioni**, quindi non compaiono e
Beitenu non taglia niente. Il giorno in cui una di quelle quattro arriva a tre, quella
tabella disegnerebbe un filetto **in mezzo all'opposizione** — nel lavoro notturno, cioè
dove nessuno guarda. Da oggi chiama `colonneBlocco()` anche lei: una funzione sola, e la
correttezza per costruzione invece che per coincidenza.

Anche questo l'ha trovato una mutazione. Togliendo `colonneBlocco()` da `rHouse()` **niente
cadeva**, perché oggi le due strade danno lo stesso risultato: la prova diceva «una strada
sola» guardando un caso in cui le due coincidono. Il legame si prova dove sta, cioè nel
sorgente — `var cols=colonneBlocco(` in tutte e due — come per `og:title` e il job.

### Che cosa NON è stato toccato, e come lo si sa

**Il colore dei valori resta quello della lista**: qui cambia l'ordine, non la codifica.

**Il parser e l'esportazione non si sono accorti di niente**, e lo si sa per misura e non
per deduzione. Il parser mappa le colonne di Wikipedia **per nome**, con `W_LISTA`, e non
nomina né `colonneBlocco` né `IDS`; l'esportazione serializza `SOND`, che è un elenco di
oggetti indicizzati per id, e ridisegnare le due tabelle **non cambia un byte** di quello
che produce. Se l'ordine delle colonne e quello dei dati coincidevano, era per caso: adesso
**divergono davvero**, e la prova lo asserisce prima di provare il resto.

**E la cosa che un riordino rompe davvero è che i valori si spostino di colonna**, un difetto
che non si vede — una tabella coi numeri sotto la colonna sbagliata si legge benissimo e
dice il falso. `test/suite/tabella.js` confronta **tutte e 2805 le celle** con `s.seggi[id]`
dell'archivio, riga per riga e per id, non per posizione. La mutazione che riordina le
intestazioni ma non le celle muore lì.

**Mutata otto volte, otto morti**: `colonneBlocco()` che non riordina, che perde l'ordine
dentro il blocco, che prende il minimo dal filtro, le intestazioni riordinate e le celle no,
i filetti su posizioni cablate, il filetto solo sull'intestazione, la classe `sondtab` tolta,
e l'house effect che torna a filtrare per conto suo.

---

## L'archivio sotto i 660: l'elenco che si apre, e la forma scartata

Applicato il 23 agosto 2026, seconda metà del punto 2 della coda. Le tre forme proposte e le
sei risposte per ciascuna stanno in [docs/tabella-sondaggi-mobile.md](docs/tabella-sondaggi-mobile.md);
qui c'è quello che è stato scelto e perché.

A 380 la tabella era larga **1288,9px in un contenitore da 356**: il 27,6% visibile, e per
leggere una riga si trascinava avanti e indietro dentro un riquadro alto 480px che a sua
volta stava dentro una pagina alta 10.536. Adesso sotto i 660 c'è un elenco: una riga per
rilevazione, e premendola si aprono i seggi.

### La forma A, e il limite a 50

**Il sommario porta data, istituto e i due totali di blocco; il pannello porta testata,
campione e i seggi.** La divisione non è di comodo: insieme fanno **esattamente la riga
della tabella**, ed è la proprietà che tiene in piedi la promessa scritta nel piede della
sezione — «ogni riga chiude a 120 seggi e riproduce il totale di blocco pubblicato».

**Il limite è 50, e il numero non viene dai pixel.** Misurate le righe che ciascun filtro
lascia: gli otto istituti danno 3 · 8 · 11 · 25 · 29 · 29 · 33 · 42, i cinque periodi 32 ·
62 · 84 · 111 · 173. Su **tredici stati di filtro** il limite non morde in 3 su 13 a venti,
6 su 13 a trenta, **9 su 13 a cinquanta**.

Cinquanta è il primo che lascia in pace la maggioranza dei filtri, e sotto quel numero il
lettore incontra **due troncamenti in fila**: filtra per avere meno righe, e ne trova
comunque meno di quante ne ha chieste. Un limite che scatta dopo un filtro non è un limite,
è un secondo filtro che nessuno ha chiesto. **Due troncamenti in fila sono peggio di una
sezione lunga**, e la sezione lunga è il prezzo: **da 774,4px a 2.567,4**, e 2.738,4 con un
pannello aperto.

La prova non asserisce il 50 come numero magico: asserisce **la proprietà da cui è stato
scelto** — che lasci intatta la maggioranza degli stati di filtro — applicando i filtri uno
per uno e contando. Se l'archivio cresce e la proprietà smette di valere, cade.

E **ogni filtro riazzera il limite**: chi ha premuto «altre 50» tre volte e poi filtra sta
facendo una domanda nuova. Sta nel gestore e non in `rTab()`, perché `rTab()` ridisegna anche
quando non è cambiato nessun filtro — al render, quando arriva un sondaggio nuovo — e lì il
limite non va toccato.

### Perché la forma per lista è stata scartata, e non per la forma

La terza proposta — una **colonna del tempo**, una lista per volta, con le rilevazioni in
verticale — era l'unica che non somigliava a niente in pagina, e non duplicava nessun
calcolo: i suoi numeri sono le celle dell'archivio, le stesse che i puntini della tendenza
sommano per blocco. **Non c'era una seconda strada di calcolo, quindi non c'era niente che
potesse divergere.**

**È stata scartata perché in quella forma una rilevazione non compare mai intera.** Compare
undici volte, una per lista, in undici colonne che il lettore non vede mai insieme: **il 120
non si può contare**, e i totali di blocco per riga non stanno da nessuna parte. La promessa
del piede — «ogni riga chiude a 120 seggi e riproduce il totale di blocco pubblicato» —
diventa inverificabile. Non si perde una comodità di lettura: si perde la verificabilità che
la sezione dichiara al lettore, e l'archivio esiste perché chi legge possa controllare.

**Quello che quella forma ha trovato resta, ed è annotato fra le cose minori**: nessuna
sezione della pagina mostra la serie storica di una singola lista dai sondaggi grezzi.

### Il pannello dell'elenco: i metadati, l'ordine, e la coincidenza che scade l'8 settembre

Applicato il 23 agosto 2026, guardando l'elenco reso a 380.

**I metadati sono usciti dalle pastiglie.** «testata Canale 12» e «campione 502» erano due
pastiglie identiche alle undici dei seggi — stessa forma, stesso flusso, stesso a-capo —
quindi si leggevano come un elenco unico di tredici cose dello stesso genere, quando sono due
categorie. L'unico canale che le distingueva era il colore, e **il colore da solo non separa
un flusso**. Adesso sono il sottotitolo del pannello: «Maariv · 501 intervistati», testo
semplice sopra i seggi, senza nessuna superficie in più.

**Costo misurato, e la stima era sbagliata**: si diceva che fosse l'unica delle tre vie a
costare negativo, e **non lo è**. Il pannello si accorcia di 30,8px (171,1 → 140,3) ma il
sottotitolo ne occupa 24,9, e mediato sulle cinquanta righe l'apertura costa **+0,9px per
riga: neutro**. Le due pastiglie tolte stavano su una riga d'a-capo loro, e quella riga il
sottotitolo se la riprende quasi tutta. La mossa si difende sulla lettura, non sull'altezza.

**La frase si compone come una frase, non come un elenco di etichette.** «testata: Maariv,
campione: 501» avrebbe conservato le etichette, che servivano solo a disambiguare due
pastiglie identiche: in una riga sola il nome di una testata e un numero di intervistati si
riconoscono da soli. E l'accordo passa da `acc()`, come dappertutto.

Da questo è cambiato **come la prova legge i metadati, non che cosa asserisce**: resta «il
pannello dice gli stessi valori della riga», ma i due valori si cercano **contenuti nella
frase** invece che uguali a una cella. Pretendere l'uguaglianza vorrebbe dire ricopiare qui
la punteggiatura del sottotitolo, e la prova cadrebbe alla prima virgola spostata — cioè
proprio sulla cosa che non deve provare. C'è anche il verso opposto: se le etichette
«testata» e «campione» ricomparissero fra le pastiglie, la prova cade.

#### L'ordine è già quello delle colonne, e oggi non si vede

Il pannello elenca le liste con `colonneBlocco()`, la stessa funzione della tabella, e
`tabella.js` lo asserisce riga per riga — la mutazione che sostituisce `cols` con `IDS` muore.

**Ma oggi i due ordini COINCIDONO, e coincidono per una ragione che scade.** Le uniche liste
che li distinguono sono quelle dell'ago della bilancia, e **nessuna ha seggi**: non compaiono
nel pannello, e senza di loro l'ordine dell'anagrafica è già l'ordine di blocco — Yisrael
Beitenu compreso, perché il pannello lo mette con l'opposizione da dove sta.

Quindi **guardare il pannello non dice se la funzione giusta sia stata usata**: dice la stessa
cosa in tutti e due i casi. L'8 settembre, se una lista dell'ago della bilancia prende seggi,
i due ordini divergono — e allora si vede. È lo stesso genere di coincidenza dell'house
effect, che era in ordine di blocco «per fortuna» finché quelle quattro liste non arrivavano
a tre rilevazioni: **due volte la stessa lista assente ha nascosto due volte la stessa
domanda.**

#### La prominenza del valore: metà applicata, metà misurata e scartata

Il valore è il dato, e nel pannello stava allo stesso corpo del nome: 11,5 contro 11,5,
prominenza 1:1. Le due metà della mossa costano in modo completamente diverso, e la
differenza è che **l'altezza della pastiglia la detta il testo più alto**.

**Applicata: il nome a 10,5px, il valore fermo a 11,5.** Costo misurato: **zero, a ogni
livello** — pastiglia 25,81 prima e dopo, pannello 140,3, riga aperta 210,2, sezione con
cinquanta righe aperte 11.319,8, identici. La prominenza passa a **1,10:1**. È poco, ed è
gratis.

**Scartata: il valore a 15px.** Farebbe crescere la pastiglia di **5,5px**, cioè +28,5px per
pannello e **+12,6% sulla sezione** con tutto aperto (11.319,8 → 12.742). In cambio il
rapporto fra le larghezze d'inchiostro nel caso peggiore passerebbe da 17,55 a 12,28.

**E il rapporto fra larghezze non è la grandezza giusta**, che è la ragione per cui la
seconda metà non vale il prezzo. Confronta un nome da ventun caratteri — «Giudaismo Unito
Torah» — con una cifra sola: perché il numero fosse largo un quarto del nome dovrebbe stare
a **46px**. Nessun corpo ragionevole lo porta dove sembrava potesse andare, e la stima di
«4,4» che era circolata era sbagliata di un fattore tre. Quello che si può muovere è la
**prominenza**, e quella si è mossa quanto si poteva muovere gratis.

#### Rendere visibile il blocco anche nel pannello: da valutare dopo la pubblicazione

Il filetto `sep` c'è ed è provato, ma in un elenco che va a capo cade a inizio riga e si legge
come un segno vagante: non è il canale giusto qui. Le due vie misurate, e nessuna delle due
si applica adesso:

- **una riga d'intestazione per blocco** — quattro righe da ~17px, cioè **+68px per pannello,
  il +40%**. Legge benissimo e costa troppo;
- **il bordo della pastiglia col token del blocco** — costo **zero** in altezza, e riusa i
  quattro token già in pagina. Ma è **colore su colore in un punto dove il valore è già
  colorato per lista**, quindi prima di proporlo davvero va misurato che cosa succede al
  contrasto e alla dicromazia — che è la misura che la tavolozza pretende ogni volta che una
  tinta entra da qualche parte.

### I due difetti chiusi qui accanto, trovati misurando

**1 · Con zero risultati la tabella taceva.** Misurato: una ricerca senza esiti lasciava un
riquadro alto **31,7px** con la sola intestazione e nessuna parola. Il contatore accanto ai
filtri diceva «0 su 173», quindi non era muto — **ma il posto in cui il lettore guarda è la
tabella**. È il caso «archivio degenere» della verifica a scenari, prodotto da una ricerca
invece che da un archivio vuoto. Adesso c'è un messaggio, al posto delle due forme e non
dentro una delle due, e dice **quante rilevazioni contiene l'archivio**: così il lettore sa
che il vuoto è del filtro e non dei dati.

**2 · Il contatore dice tre numeri quando il limite morde.** «50 di 62 che corrispondono, su
173», nella forma già pagata dal messaggio dell'aggiornamento: ogni numero della frase è un
numero di **righe**, e il lettore deve poter rifare il conto. La prova è scritta sulla
proprietà del lettore — si prende la frase, si estraggono i numeri, e si pretende che siano
quelli che si vedono, quelli che corrispondono e quelli che ci sono, in quest'ordine.

**E il quarto caso l'ha trovato il browser, non il ragionamento.** La prima stesura aveva tre
rami e senza nessun filtro scriveva «**50 di 173 che corrispondono, su 173**»: «che
corrispondono» a che cosa, se non è stato chiesto niente? **Un numero ripetuto due volte
nella stessa frase è il segnale che una delle due volte non vuol dire niente.** I casi sono
quattro: nessun filtro e nessun limite («173 rilevazioni»), filtro senza limite («62 su 173
rilevazioni»), limite senza filtro («50 di 173 rilevazioni»), tutti e due («50 di 62 che
corrispondono, su 173»).

**Il contatore ha due forme nel DOM e le sceglie il foglio**, non `matchMedia`: la pagina non
si ridisegna al ridimensionamento, quindi un contatore scelto dal JavaScript resterebbe a
dire il numero dell'altra larghezza appena si gira il telefono. È l'idioma del sommario di
testata, e `tabella.js` lega le due forme numero per numero.

### Due trappole nella stessa ora, ed è la stessa trappola

Sono le più istruttive di questo giro, perché **nessuna delle due ha fallito: hanno
risposto**, con numeri quattro volte più grandi e zero errori in console.

**1 · Il nome di classe corto.** L'elenco era `.sl` / `.slv`, e **`.sl` esiste già in questo
foglio**: è la riga dei cursori, che porta `display:flex` e `.sl b{min-width:36px}`. Il
`<details>` di ogni riga è diventato un contenitore flessibile, il pannello dei seggi un
elemento flessibile schiacciato a **26px di larghezza**, e le tredici pastiglie sono finite
una per riga: il pannello misurava **524,4px invece di 136**. Rinominati in `.sondr` /
`.sondv` / `.sondera`: **due lettere non bastano a dichiarare un componente.**

**2 · L'elemento vestito globalmente.** Il foglio veste `<details>` e `<summary>` per tutta
la pagina — la nota metodologica, la guida dei comandi e il modulo dell'archivio sono tutti
`details` — con `border`, `background`, `box-shadow`, `margin-top:20px`, e per `summary`
padding 15/20, maiuscoletto spaziato e un «+» in `--acc` da 20px. **Cinquanta righe
dell'elenco sono cinquanta `details`**: hanno preso venti pixel di margine ciascuna, e
l'elenco misurava **3.372px contro i 2.344 dei suoi figli** — mille pixel che non erano di
nessuno. Il componente adesso si spoglia per intero di quello che eredita, e in un posto
solo.

**È la stessa famiglia della trappola dei selettori discendenti già registrata per
`#k-evsel`**, vista da due lati: là un elemento si spostava e prendeva quello che il posto
nuovo gli metteva addosso, qui un elemento nasce e prende quello che il **nome** e il **tag**
gli mettono addosso. In un file unico con un foglio solo, lo spazio dei nomi delle classi e
quello degli elementi sono globali, e un componente nuovo va spogliato prima di essere
vestito.

### La definizione degli apparentamenti, e dove sta

**«Accordo» da solo non dice niente a un lettore italiano**: il meccanismo dei voti in
eccedenza nel nostro sistema non esiste in quella forma. La pagina lo nominava in **sette
punti** — etichetta del pulsante, nota dei comandi, riga di esito, guida, calendario, nota
metodologica, punto 3 del riparto — e **non lo definiva da nessuna parte**.

La definizione è nella **guida dei comandi**, alla voce «Apparentamenti annunciati», e
soltanto lì. Tre ragioni, in ordine di peso:

1. **La nota metodologica è prosa generata.** `notaApparentamenti()` compone una stringa con
   rami su data e stato, e una definizione non dipende da nessuno dei due: è una costante, e
   metterla dentro una funzione che compone prosa condizionale è la forma che poi diverge.
2. **La guida è il punto di bisogno**: ci si arriva perché si è visto il pulsante e non si è
   capito. La nota sta in fondo, dentro un `<details>` chiuso intitolato «Nota metodologica,
   limiti e fonti», che chi vuole sapere cosa vuol dire un comando non apre.
3. **La voce aveva già mezza spiegazione** — diceva il meccanismo — quindi completarla non
   aggiunge un'ottava occorrenza.

E la definizione viene **prima** del meccanismo: dice da dove viene il seggio, che è la cosa
che rende l'istituto comprensibile a chi non ce l'ha nel proprio sistema; il meccanismo
risponde a una domanda che il lettore si fa dopo.

**Il titolo della voce era «Apparentamenti proposti»**, cioè la parola scartata lo stesso
giorno per l'etichetta del pulsante: «annunciato» è il fatto verificabile — c'è una data e
una fonte — mentre «proposto» dice anche chi ha proposto a chi, che nell'offerta unilaterale
di Abbas non è simmetrico. La voce era rimasta indietro, e adesso dice «Apparentamenti
annunciati».

**`notaApparentamenti()` rimanda invece di ripetere, e c'è la prova che le lega.** Le due
strade esistevano già prima di oggi: la nota apriva ricopiando il meccanismo che la guida
descrive. Finché dicevano la stessa cosa non si vedeva; il giorno in cui una delle due si è
arricchita — oggi — l'altra sarebbe rimasta indietro in silenzio. La prova è in **due versi**,
come tutte quelle sulle strade doppie: la definizione c'è dove deve e **non** c'è dove non
deve. Una sola delle due asserzioni non basterebbe — la prima passa anche se la nota la
ricopia, la seconda passa anche se la definizione non esiste affatto. E una terza pretende
che la nota **rimandi**: togliere una copia senza lasciare la strada è peggio che tenerne due.

## Le nove risposte dell'embed

Applicato il 23 agosto 2026. **Le domande erano state poste a voce e non erano mai finite in
questo file**: sono state riscritte e risposte una per una, e stanno qui perché non dipendano
da nessuna conversazione. Le prove sono in `test/suite/embed.js`.

Il vincolo che le governa tutte: **`?embed=1` è pubblica, non è per FocusAmerica.** Chiunque
deve poterla incorporare su un sito che non controlliamo — larghezza, tema, CMS, dominio — e
l'attribuzione è una **firma personale**: chi incorpora incorpora un lavoro firmato da una
persona, non un prodotto della testata.

### Prima di tutto: le due cose misurate, perché tre risposte dipendono da quelle

Un ospite vero su `localhost:8788` che inquadra la pagina, con il controllo che sa fallire
nella stessa pagina — un iframe verso `https://github.com/`, che **deve** produrre
`frame-ancestors 'none'`, e lo produce:

| | misurato in Chrome, 23 agosto 2026 |
|---|---|
| `sandbox="allow-scripts"` (origine opaca) | **`localStorage.setItem` lancia `SecurityError`** |
| `sandbox="allow-scripts allow-same-origin allow-downloads"` | scrive |
| **`<a download>.click()` in sandbox senza `allow-downloads`** | **nessuna eccezione, e non scarica** |

**Non è un caso Safari: è la condizione normale dell'embed.** Il record dice che Fanpage e
FocusAmerica incorporano in sandbox, e lì lo storage è bloccato in Chrome come altrove;
Safari aggiunge il caso *senza* sandbox, che su questo banco non si può provare — non c'è
Safari, e va detto invece di dedurlo.

E la pagina **lo sapeva già**: `tipoMemoria()` non deduce, prova a scrivere davvero e cattura
l'eccezione. Ma lo **diceva dentro `#k-datapanel`**, un `<details>` chiuso per impostazione
predefinita. Un avviso in un cassetto non è un avviso.

### 1 · Che cosa sparisce

Il **modulo archivio** — importa, esporta, inserimento manuale, diagnostica — e la sezione
**«incorpora»**. Il primo è l'attrezzo dell'autore e scrive in una memoria che nell'embed non
c'è; la seconda perché offrire il codice dell'embed dentro l'embed non vuol dire niente.

**Non sparisce nient'altro: tutto quello che si legge resta**, comprese la guida dei comandi
e la nota metodologica.

E **si toglie dal DOM, non si nasconde col foglio**. Un elemento a `display:none` resta
nell'albero: i suoi comandi restano nell'ordine di tabulazione di qualche browser, qualche
lettore di schermo lo annuncia, e chi cerca lo trova. **Quello che l'embed non offre non deve
esistere, non deve essere invisibile.** L'elenco è una costante sola, `VIA_NELL_EMBED`, e la
prova lo esercita nei due versi: quello che va via non c'è nell'embed **e c'è** nella pagina
intera — una metà sola passerebbe anche con un embed che toglie tutto.

### 2 · L'altezza

**Fissa, con scorrimento interno, più un avviso facoltativo per l'ospite.** L'iframe ha
l'altezza che gli dà chi incorpora e la pagina scorre dentro: funziona anche dove il CMS
toglie lo script dell'ospite, che è la maggior parte dei posti in cui questa pagina finirà.
**Se l'altezza dipendesse dal messaggio, l'embed si taglierebbe proprio dove l'ospite è più
povero.**

Il messaggio si manda lo stesso, per chi sa usarlo: `{kn26:'altezza', px}` a ogni render, e
tre righe nel frammento da copiare. Misurato su un ospite vero: arrivano **due** messaggi —
7.026 px e poi 18.380 — perché il render gira prima e dopo che l'archivio arrivi, e a 380 di
larghezza la pagina è alta diciottomila pixel. Un ospite che si ridimensiona lo fa due volte,
ed è corretto.

### 3 · Il selettore del tema

**Resta.** §6 della verifica a scenari lo dà già per acquisito: «il tema segue il selettore,
non l'ospite». Un riquadro che ereditasse il fondo di un sito che non conosce non saprebbe
che contrasti sta producendo.

### 4 · L'esportazione PNG dentro l'embed

**Non c'è, e la ragione è quella misurata.** Dentro una sandbox senza `allow-downloads` un
`<a download>` **non solleva niente**: `click()` ritorna e non succede nulla. **Un comando che
finge di funzionare è peggio di un comando assente** — chi lo preme non impara niente, e non
ha modo di capire se il difetto è suo, dell'ospite o nostro. E non possiamo pretendere
`allow-downloads` da un ospite che non controlliamo.

La regola è **provata adesso che il codice del PNG non c'è ancora**: in modalità incorporata
nessun elemento reso porta l'attributo `download`. Quando il PNG arriverà, quella prova sarà
già lì ad aspettarlo.

### 5 · La memoria

**Si dichiara in chiaro, e non solo nell'embed.** La fascia `#k-mem` compare quando il
browser non consente di salvare — dentro un iframe di terza parte, in navigazione privata,
con i dati dei siti bloccati — e nell'embed porta il collegamento alla pagina intera.

**Il difetto non era dell'embed: l'embed lo rendeva soltanto pubblico**, quindi la
riparazione vale per tutte e due. Ed è **una strada sola**: il paragrafo in `--neg` è uscito
da `rDiag()`, che adesso dice il **fatto** («salvato in: nessuna») mentre la fascia dice che
cosa comporta. Due copie dello stesso avvertimento a schermi di distanza sarebbero divergute
alla prima riscrittura.

Il filetto della fascia è `--inc` e non `--neg`: **qui non è successo niente di sbagliato**.
Un iframe di terza parte che non concede lo storage è la condizione normale, non un guasto, e
dipingerla come un errore direbbe al lettore una cosa falsa sul suo browser.

### 6 · Che cosa È l'attribuzione

**Non si può rendere impossibile toglierla, e fingere il contrario sarebbe una promessa che
nessun codice mantiene**: chi copia il file fa quello che vuole. Quello che si può fare è che
toglierla significhi **biforcare il file** — e chi biforca perde gli aggiornamenti notturni,
che sono la ragione per cui questa pagina vale la pena di essere incorporata.

Quindi: la firma è una **costante**, la scrive il render, e il markup ne porta una copia per
chi ha il JavaScript spento — una firma solo renderizzata sparirebbe proprio per il lettore
che ha meno di tutti. Le due sono legate da una prova. Nell'embed la firma porta anche la via
d'uscita verso la pagina intera: è il posto in cui il lettore capisce di che cosa sta
guardando un pezzo.

**Niente FocusAmerica**, e la prova lo asserisce: nessuna testata compare nella firma, in
nessuna delle due forme.

### 7 · La freschezza

`cache-control: max-age=600` permette a un embed di mostrare una copia vecchia **fino a dieci
minuti**, quindi la data va detta da dentro. Restano tutte e due: **l'ultima verifica
riuscita** (`#k-upd`) e **l'ultimo sondaggio** (`#k-fresh`), che sono due grandezze diverse e
lo sono anche nell'embed.

### 8 · Il frammento da copiare

**Nella pagina intera, non nell'embed**, in un `<details>` accanto alla firma. È **testo
statico dentro `<code>`**, non markup: chi copia deve poter copiare anche a JavaScript
spento, e un iframe vero lì dentro sarebbe una risorsa esterna in un file che si dichiara
autonomo.

Da questo è venuta una precisazione al controllo strutturale: **il codice dentro `<code>` non
è markup, è testo.** Il primo giro dichiarava il frammento una risorsa esterna — è la stessa
distinzione già fatta per l'href di un'ancora e per il `canonical`, cioè fra quello che il
browser **scarica** e quello che sta scritto in pagina.

### 9 · Che cosa vede chi ha incorporato, dopo il 27 ottobre

**È la sola condizione in cui l'embed direbbe qualcosa di falso senza che nessun difetto sia
stato introdotto.** Un iframe messo in un articolo di settembre e letto a novembre mostrerebbe
una proiezione a elezioni avvenute — e nessuno se ne accorgerebbe, perché la pagina
funzionerebbe perfettamente.

La fascia del dopo-voto esiste già: quello che è stato fatto è **provare che l'embed non la
nasconda**, con l'orologio congelato a tre giorni dal voto e la data letta da `VOTO` invece
che scritta nella prova. E c'è il verso che a una prova di questo tipo manca sempre: **che
`k-postvoto` non sia nell'elenco di quello che l'embed toglie, né possa finirci per svista.**
Non basta che oggi non ci sia — quell'elenco è una costante, e una costante si allunga.

La fascia dice **esattamente** quello che dice la pagina intera: una frase sola per le due
forme. E trenta giorni prima del voto c'è ed è spenta, perché il testo si scrive sempre e a
comparire è solo la classe.

### Due cose che il banco ha imposto, e valgono oltre l'embed

**`window.location` e non il `location` nudo.** Il globale nudo esiste solo dentro un
browser: `EMBED` letto da lì è sempre `false` in jsdom, cioè la suite proverebbe la pagina
intera credendo di provare l'embed. È la stessa forma di `contesto()`, che `window.location`
lo usava già.

**In jsdom `localStorage` e `parent` sono GETTER, e assegnarli non fallisce: non fa niente.**
La prima stesura di `embed.js` credeva di aver rotto lo storage e misurava una pagina sana —
cioè dichiarava provata una cosa che non aveva mai esercitato. Si sovrascrivono con
`Object.defineProperty`.

**E quello che dipende dai globali si legge SUBITO, non dopo.** Ogni pagina montata
sovrascrive `global.window` e `global.document`, e le funzioni dell'app li risolvono al
momento della chiamata: chiedere `contesto()` alla prima pagina dopo aver montato la seconda
risponde sulla seconda. Vale anche per l'orologio — `votoPassato()` chiamato dopo aver
scongelato risponde su oggi, non sul giorno in cui la pagina è stata resa. È la stessa
famiglia del riferimento preso prima di un `click()` su `#k-house`: **un valore letto dopo
che il mondo si è mosso.**

## Dove stava il concetto degli apparentamenti, e dove mancava la definizione

Censito il 23 agosto 2026 su richiesta dell'autore, e **chiuso lo stesso giorno**: la
definizione è nella guida dei comandi, la nota metodologica rimanda, e una prova in due
versi lega le due strade — vedi «La definizione degli apparentamenti, e dove sta».
Questo è l'inventario da cui si è partiti, e resta perché dice **in quanti punti** la
pagina nomina una cosa che non definiva: sette. Se un giorno se ne aggiunge un ottavo, la
domanda da farsi è la stessa.

Il punto è giusto e non è una sfumatura: **«accordo» da solo non dice niente a un lettore
italiano**, perché il meccanismo dei voti in eccedenza nel nostro sistema non esiste in
quella forma. La pagina usa «accordi di apparentamento» e «accordi di eccedenza» come se
fossero noti, e da nessuna parte dice che cosa siano.

### Le sette occorrenze

| dove | che cosa dice oggi | definisce? |
|---|---|---|
| **etichetta del pulsante**, `#k-app` (`rApp`) | «Aggiungi *N* accordi annunciati» | no — e non deve: è un comando |
| **nota dei comandi** sotto le pastiglie, `.pgn` nel markup | «…o quali **accordi di apparentamento** entrano nel riparto» | **no, ed è la prima volta che la parola compare** |
| **riga di esito**, `#k-appriga` (`rApp`) | «Nessun **accordo di eccedenza** è ancora depositato…» | no: dice lo stato, non il meccanismo |
| **guida «Come si usano i comandi»**, voce *Apparentamenti proposti* | «Due liste apparentate si presentano al riparto come una lista sola e si dividono poi i seggi fra loro: è l'accordo di eccedenza previsto da Bader-Ofer…» | **quasi** — dice il *come*, non il *perché*: manca la frase sui voti che non bastano a eleggere un seggio |
| **calendario**, tappa del 16 ottobre | «Ultimo giorno per depositare gli apparentamenti — *heskem odafim* — presso la Commissione elettorale centrale» | no |
| **nota metodologica**, `notaApparentamenti()` | ripete il *come* della guida, poi il termine, poi lo stato | **quasi**, e ripete la guida |
| **nota del riparto**, punto 3 di `rFoot` | «col metodo Bader-Ofer, cioè il d'Hondt in uso in Israele» | no |

### Il posto giusto è la guida dei comandi, e la ragione è dove si arriva

La voce **«Apparentamenti proposti»** dentro `<details id="k-guida">` è l'unico punto in
cui il lettore sta già chiedendo che cosa vuol dire un comando: ci arriva perché ha visto il
pulsante e non ha capito. È anche il testo che **già** contiene il tentativo di
spiegazione — quindi non si aggiunge un'ottava occorrenza, si completa quella che c'è.

**Che cosa manca a quella frase, esattamente.** Dice «due liste apparentate si presentano al
riparto come una lista sola», cioè il **meccanismo**; non dice **da dove viene il seggio** —
che è la cosa che rende l'istituto comprensibile a chi non ce l'ha nel proprio sistema: i
voti che non bastano a eleggere un seggio, invece di andare persi, si sommano fra due liste
che si sono accordate prima del voto, e il seggio in più va a quella con il resto maggiore.
Una o due frasi, in testa alla voce, prima del meccanismo.

**E la nota metodologica ripete la guida**, il che oggi è tollerabile — sono due contesti
diversi e chi legge la nota può non aver aperto la guida — ma diventa una strada doppia nel
momento in cui una delle due porta la definizione e l'altra no. Da decidere insieme al testo:
o la definizione sta in tutte e due (e allora è una costante da legare), o la nota rimanda
alla guida.

**Il titolo della voce va cambiato insieme al testo**: dice «Apparentamenti **proposti**»,
che è la parola scartata il 23 agosto per l'etichetta del pulsante — «annunciato» è il fatto
verificabile, «proposto» dice anche chi ha proposto a chi, e nell'offerta unilaterale di
Abbas non è simmetrico. La voce della guida è rimasta indietro.

## L'etichetta del pulsante degli accordi andava a capo, e solo con UN accordo

Misurato su browser vero il 23 agosto 2026, a 380px, tema chiaro forzato dal selettore e
transizioni spente. **Applicata il 23 agosto 2026**: «Aggiungi / Togli N apparentamento/i»,
con `acc()` per il plurale. Quello che segue è la misura che l'ha decisa, e le sei
formulazioni scartate restano perché il numero che conta — il plurale più corto del
singolare — non si ritrova ragionandoci.

Il contenitore del gruppo vale **318px**, il `gap` è 7px, e le altre tre pastiglie misurano
127,5 · 129,9 · 116,6. La soglia esatta perché la quarta stia in fondo alla seconda riga —
misurata allargando una stringa finché non cade — è **191,1px**.

### La misura, e il fatto che nessuno si aspetta

| formulazione | 1 accordo | 4-5 accordi | righe (1 / 4) |
|---|---|---|---|
| **«Aggiungi 1 accordo annunciato»** *(oggi)* | **195,4** | 188,0 | **3** / 2 |
| «Togli 1 accordo annunciato» *(oggi, premuto)* | 171,9 | 164,5 | 2 / 2 |
| «Apparentamenti annunciati» | 174,2 | 174,2 | 2 / 2 |
| «1 accordo annunciato» | 142,4 | 134,9 | 2 / 2 |
| «+1 accordo annunciato» | 150,5 | 143,0 | 2 / 2 |
| «Con 1 accordo» | 103,1 | 99,3 | 2 / 2 |
| «Aggiungi 1 apparentamento» | 178,9 | 175,2 | 2 / 2 |
| «Aggiungi 1 accordo» | 131,8 | 128,0 | 2 / 2 |

**Il plurale è più CORTO del singolare**: 188,0 contro 195,4, sette punti e mezzo in meno,
perché «accordi annunciati» scambia due `o` per due `i` e la `i` è più stretta. Quindi
**il difetto esiste soltanto con UN accordo — cioè esattamente oggi — e si chiude da sé al
secondo.** A metà ottobre, con quattro o cinque, la riga starebbe comunque.

E **il margine è di 4,3px**: 195,4 contro 191,1. Non è una scritta lunga, è una scritta che
manca il posto per quattro pixel.

### Il difetto che nessuno aveva visto, ed è peggio dell'a capo

**Il gruppo passa da 3 righe a 2 quando lo si preme, e torna a 3 quando lo si ripreme.**
«Aggiungi 1 accordo annunciato» sta a 195,4 e va a capo; «Togli 1 accordo annunciato» sta a
171,9 e rientra. Il pannello si accorcia di **36px sotto il dito**, e tutto quello che sta
sotto — la riga di esito, i parametri del modello — salta su e poi giù a ogni pressione.
L'a capo si nota; il salto si subisce.

Questo esclude da solo ogni formulazione in cui i due stati hanno larghezze che cadono ai
due lati della soglia, ed è un vincolo che i due dichiarati dall'autore non contenevano.

### La risposta alla domanda: sì, ce n'è più d'una che regge tutto

I vincoli sono tre — il numero, la larghezza, e il cambio di testo come unico riscontro,
visto che il pulsante non ha `aria-pressed` per scelta (il nome dichiara l'azione, e
`aria-pressed` direbbe il contrario di quello che si legge).

| candidata | numero | riscontro | 1 accordo | 4 accordi | margine sulla soglia |
|---|---|---|---|---|---|
| **«Aggiungi / Togli 1 apparentamento»** | sì | il verbo | 178,9 / 155,4 | 175,2 / 151,7 | **+12,2px** |
| **«Aggiungi / Togli 1 accordo»** | sì | il verbo | 131,8 / 108,3 | 128,0 / 104,5 | +59,3px |
| «+1 / −1 accordo annunciato» | sì | il segno | 150,5 / 150,5 | 143,0 / 143,0 | +40,6px, e **larghezza identica nei due stati** |
| «Aggiungi / Togli 1 annunciato» | sì | il verbo | 149,3 / 125,8 | 145,6 / 122,1 | +41,8px |
| «Apparentamenti annunciati» | **no** | — | 174,2 | 174,2 | +16,9px |
| «1 accordo annunciato» | sì | **nessuno** | 142,4 | 142,4 | +48,7px |

Le ultime due cadono sui vincoli dichiarati: la penultima non porta il numero, l'ultima non
cambia fra premuto e non premuto e quindi non dà nessun riscontro.

**Quello che si perde, e va scelto sapendolo.** Tutte le candidate che reggono, tranne la
terza, lasciano cadere **«annunciato»** — che è il canale che dice **fatto o ipotesi**, cioè
la cosa che questo file dichiara di non voler accorciare per prima. Le tre uscite sono:

- **«Aggiungi / Togli 1 apparentamento»** tiene il verbo e il numero, porta la parola del
  concetto invece di «accordo» — che da solo non dice niente a un lettore italiano, ed è il
  punto 4 dell'autore — e perde «annunciato». Margine 12,2px: il più stretto dei tre, ma
  regge anche a 4-5 accordi, dove la parola si accorcia.
- **«+1 / −1 accordo annunciato»** tiene tutto, compreso «annunciato», e ha la proprietà che
  nessun'altra ha: **la stessa larghezza nei due stati**, quindi il salto di 36px non può
  ripresentarsi nemmeno se un giorno la soglia si muove. Il prezzo è che il riscontro
  diventa un **segno** invece di un verbo, cioè un canale più debole di quello che l'house
  effect e questo pulsante hanno scelto — e la grammatica dell'azione andrebbe abbandonata
  in un punto solo, che è la cosa che questo progetto chiama strada doppia.
- **«Aggiungi / Togli 1 accordo»**, la più corta che tiene verbo e numero: 59,3px di
  margine, e «annunciato» finisce dove sta già, cioè nella riga di esito subito sotto —
  che oggi scrive «1 annunciato e non ancora depositato, quindi fuori dal riparto: Ra'am e
  Lista Unita araba». È l'uscita che l'autore ha dichiarato di preferire se nessuna reggesse
  tutto, e regge anche il numero.

**Nessuna delle sette cambia niente a 1265**, dove il contenitore vale 1076 e le quattro
pastiglie stanno su una riga sola in tutti i casi: la scelta si decide interamente a 380.

### Scelta: «Aggiungi / Togli N apparentamento/i»

Tiene il verbo — la grammatica dell'azione, la stessa di «Escludi / Includi» dell'house
effect, e quindi niente `aria-pressed` — tiene il numero, e porta la **parola del concetto**
invece di «accordo», che da solo non dice niente a un lettore italiano. Il plurale passa da
`acc()`, come il calendario, il margine di coalizione e le altre: scriverlo a mano è la
strada che in questo progetto ha già prodotto «1 giorni».

**«Annunciato» non si perde: scende nella riga di esito**, che lo scrive per esteso con i
nomi e la data — «1 annunciato e non ancora depositato, quindi fuori dal riparto: Ra'am e
Lista Unita araba, 22 agosto 2026». Al pulsante restano l'azione e il numero, che sono le
due cose che devono stare in un comando; il canale che dice fatto-o-ipotesi resta, e resta
nel punto in cui c'è spazio per dirlo per intero invece che in una parola.

**Nove asserzioni di `apparentamenti.js` sono state aggiornate nello stesso commit**, ed è
il caso previsto: l'attesa è diventata obsoleta di proposito, la decisione l'ha presa una
persona, e la ragione sta nel messaggio del commit. Quello che le prove verificano non è
cambiato — la forma dell'etichetta, il numero che viene da `contoApp()` e non dalla
tabella, il singolare e il plurale, il nome accessibile che comincia col testo visibile, le
due preposizioni — è cambiata solo la stringa attesa.

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

## L'emiciclo delle maggioranze possibili: l'ordine, i vuoti, la coda — e il colore che NON segue la leva

Applicato il 27 agosto 2026. Quattro cose che sono una sola: l'arco smette di essere un
disegno dello spettro politico e diventa un disegno delle maggioranze.

### La linea dei 61 non si muove: si muove quello che ci sta sotto

`a61` è il punto medio fra il 60° e il 61° seggio contando dall'angolo, quindi con 120 seggi
**cade sempre al centro dell'arco**. Misurato nei due ordini: x = 214,50 in tutti e due. Non
è la linea a spostarsi — è l'ordine dei blocchi a decidere che cosa il lettore ci trova.

Da qui `ARCO_ORD = opposizione · arabi · ago della bilancia · coalizione`: i due gruppi
decisivi al centro, **ciascuno accanto al campo con cui potrebbe stare**. Gli arabi non fanno
accordi con Netanyahu e al massimo appoggiano l'opposizione; l'ago della bilancia oggi è una
lista di destra che parla di un governo di destra ampio.

**E funziona per costruzione, non per la configurazione di oggi.** Enumerate tutte le
**302.621** partizioni dei 120 seggi in quattro gruppi, classificate per che cosa il lettore
trova a sinistra della linea:

| | ordine vecchio | questo |
|---|---|---|
| un campo in testa taglia sé stesso: governa da solo | 0,6% | 12,5% |
| l'altro campo governa da solo | 11,9% | 11,9% |
| un gruppo decisivo accanto al suo campo | 35,1% | **70,8%** |
| bordo fra due gruppi | 2,4% | 2,4% |
| **UN CAMPO TAGLIATO A METÀ: si conta** | **49,0%** | **1,8%** |
| **→ si legge** | **50,0%** | **97,6%** |

Nella scatola plausibile — arabi 8-16, ago 0-12, campi 35-70 — il caso «si conta» passa da
**57,9% a ZERO** e la lettura da 42,1% al **100%**. Il residuo dell'1,8% sul totale richiede
un campo a **zero** seggi. Sui 25 stati dello swing: la linea cade nel gruppo arabo in 18, su
un bordo in 2, dentro l'ago in 1 — che è lo specchio — e dentro l'opposizione in 4, dove
governa da sola. Con l'ordine vecchio: **24 su 25 tagliava l'opposizione** con i 12 arabi a
sinistra, sempre a offset 48. Costo del cambio: **zero**, il corpo dei totali resta 28.

**L'ordine era scritto a mano in QUATTRO posti**, tre d'accordo e la legenda con un ordine
suo — «coalizione, opposizione, incerto, arabo», né l'arco né il suo specchio, e nessuna riga
lo dichiarava. Adesso è una costante sola, e la legenda **segue l'arco** perché ne è la
chiave. Il criterio distingue le due convenzioni che convivono nel file: la **prosa** elenca
i blocchi come li nomina il testo (verdetto, targa delle card, evento isolato), il **disegno**
e tutto ciò che ne è la chiave seguono l'arco.
E il commento di `colonneBlocco()` non afferma più che quell'ordine è «la lettura che la
pagina usa dappertutto»: le tabelle lo ricavano dall'anagrafica, l'arco lo sceglie, e per mesi
i due hanno coinciso soltanto per come l'anagrafica presentava le liste.

### I vuoti sono un angolo, non un posto in coda

I posti vuoti si inserivano nella sequenza **lineare** dei 120 seggi, che poi veniva
distribuita sulle cinque file ordinando i posti per **angolo**: un vuoto cancellava un seggio
in **una** fila. Misurato sulla pagina resa — replica della geometria verificata contro l'SVG
vero, 120 seggi su 120, scarto massimo 0,005 unità — con tre blocchi il vuoto c'era in **due
coppie fila×confine su dieci**. La fila esterna sembrava uniforme perché lì il confine non
c'era affatto.

**Alzare `VUOTI` non riparava**: con 2 i buchi si spostavano su altre file, con 5 restavano
una fila senza confine e una con un buco triplo. La leva non era il numero.

Adesso i seggi per fila sommano 120, `ripartiFile()` li divide fra i segmenti con i totali
esatti **nelle due direzioni**, e ogni fila mette un vuoto fra due segmenti che in quella fila
ci sono. Ogni confine di ogni fila è largo esattamente **2,00 volte il passo** — mai 1,00
(confine invisibile), mai 3× o 4× (buco doppio). Il passo scende del 7-9%.
Scartato l'arrotondamento cumulativo nelle due direzioni, che è più elegante e va
**negativo**: coi gruppi 50/12/2/56 dà una cella a −1.

**Il prezzo dichiarato**: l'ordine globale per angolo non è più esattamente quello dei gruppi
— una fila il cui confine cade un posto più in là mette un suo seggio dopo il primo del gruppo
successivo di un'altra fila. Su 25 stati il gruppo in cui cade la linea coincide con
l'aritmetica in **24**; l'unico scarto è a swing +6, dove il conto dice «un seggio dentro
l'ago» e il disegno mette la linea sulla cucitura. L'invariante non si muove: la linea separa
sempre 60 e 60.

### La coda separata, e IL COLORE CHE NON SEGUE LA LEVA

Con la leva accesa «Popolo d'Israele» conta nel blocco Netanyahu e resta ocra: quattro
pastiglie di un'altra tinta dentro un gruppo di blu, e che siano contate lo diceva solo il
totale. **La proposta ovvia è far seguire il colore alla leva. È stata misurata e scartata, e
questa è la sezione da leggere prima di riproporla.**

1. **LA LEVA È UN'IPOTESI, E RIDIPINGERE LA LISTA LA FA SEMBRARE UN FATTO.** Il pulsante è
   l'unica cosa che dichiara il condizionale; un colore che cambia direbbe «questa lista è di
   quel blocco», che è più di quanto la leva affermi.
2. **IL COLORE PORTA GIÀ IL BLOCCO, attraverso il settore di tinta**, e i quattro settori sono
   disgiunti per regola. Misurate le tinte OKLCH delle venti liste: arabi **142°–191°**,
   coalizione **227°–304°**, ago della bilancia **61°–103°**, opposizione **343°–40°**.
   «Popolo d'Israele» sta a **66,9°**, cioè **160°** dal bordo più vicino del settore della
   coalizione. Farlo seguire la leva vorrebbe dire **o** dargli il *token* di blocco — che
   nessuna lista ha, e che in legenda direbbe «questa lista è il blocco» — **o** inventargli un
   blu del settore giusto, e `PAL_SCURO` è indicizzato sull'esadecimale **chiaro**: la chiave
   non ci sarebbe e `cp()` cadrebbe su `schiarisci(hex, 0,40)`. Misurato con un blu di prova:
   in scuro darebbe `rgb(127,159,236)`, che sta a **1,08** da `--coal` e **1,15** dal Likud. Un
   colore inventato in silenzio, indistinguibile dai suoi vicini — il difetto già pagato
   mappando Amcha, dove *un posto dimenticato non lasciava un buco ma produceva un colore*.
3. **Costerebbe tredici sedi divise in due famiglie**: emiciclo, legenda, pastiglie ed
   etichette del simulatore e tag delle coalizioni dovrebbero seguirla; sparkline, archivio ed
   elenco stretto no, perché lì il blocco non è una dimensione del disegno. Una sede che
   continuasse a leggere `P[i].c` divergerebbe in silenzio.

**E l'anello è stato misurato e scartato anche lui**: nel colore del blocco sta a **1,36** in
chiaro e **1,33** in scuro sul pieno ocra, cioè non si stacca. A due tinte regge (`--card` sul
pieno 5,61 e 9,95) ma vuole 2,5 unità di raggio, e a 380 lascerebbe la pastiglia a **4,4px** o
i seggi a **1,06px** l'uno dall'altro.

**Quello che il disegno dice adesso**: la lista spostata va **in coda al suo blocco** e un
vuoto **più stretto** di quello fra i blocchi la separa — dentro il conteggio del blocco, non
dentro il blocco. Due vuoti uguali direbbero «un quarto blocco» mentre la riga sotto ne conta
tre, che è la stessa forma dell'arco che ne contava tre su quattro.

**La coda è forzata, non ereditata.** Oggi «Popolo d'Israele» sarebbe ultima comunque, perché
l'ordinamento dentro il blocco è per seggi decrescenti e ne ha meno di tutte: **è la quarta
volta in questo progetto che una proprietà regge per coincidenza** — l'house effect in ordine
di blocco, l'ordine del pannello dell'archivio, la targa dove tela e disegno coincidevano — e
la prova la esercita dando alla lista spostata più seggi di qualcuna del blocco che la ospita.

**Il prezzo, misurato a 380 dove morde**: il confine fra blocchi passa a due posti *solo* se
esiste un vuoto interno da cui distinguerlo, quindi il passo minimo scende da 17,25 a
**15,53** unità e l'aria fra due pastiglie da **4,89 a 3,59px**, il 27% in meno — su un
diametro di 8,19px restano il 44% di stacco. Il confine a **tre** posti è stato misurato e
scartato: l'aria scenderebbe a 2,52px. **E lo paga solo chi preme**: a leva spenta non c'è
nessun segmento interno, quindi nessun confine si allarga e il disegno è quello di prima —
verificato, i passi restano identici a tre e a quattro blocchi.

**La vista PER BLOCCO resta com'è**, ed è giusto: lì i seggi sono già del colore del blocco in
cui sono **contati** — con la leva accesa sono 53 pastiglie blu, nessuna ocra. È la vista che
dice il conteggio, non quella che dice chi è chi.

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

## I quattro blocchi: l'arco che ne contava tre, e la leva che riclassifica

Applicato il 27 agosto 2026. `blocchi()` restituisce **quattro** totali da sempre — e quasi
nessun consumatore ne pubblicava quattro. È la stessa forma dei totali dell'archivio, che
erano due e dovevano essere tre, con una differenza che la rende peggiore: **nell'archivio i
seggi che mancano dalla somma non si vedono; nell'emiciclo sì.** Lì sono disegnati,
colorati, e la legenda li nomina.

### La diagnosi, e perché il difetto non si vedeva

Nella proiezione di oggi l'ago della bilancia ha **zero seggi in tutti e 25 gli stati dello
swing**: «Casa Sionista» sta a **2,760** di quota contro una soglia di 3,25 — mezzo punto —
e le altre quattro liste del blocco non compaiono nemmeno fra le quote. Ogni somma faceva
120 perché il quarto addendo era zero, e nessuna misura sull'archivio del giorno poteva dire
niente. Le misure che seguono sono su un archivio in cui quattro seggi passano dal Likud a
una di quelle liste.

**Ma una parte del difetto era già visibile, e la diagnosi l'aveva mancata**: la nuvola dei
sondaggi della sezione 9 scartava dei punti veri. **Quindici rilevazioni di `BASE` danno
quattro seggi a Casa Sionista** — è un dato d'archivio, non un'ipotesi. L'ha trovato il
banco e non l'occhio: la quarta serie ha cominciato a disegnarsi da sola nelle prove, e tre
attese che dicevano «tre linee» sono cadute.

| chi pubblica dei totali di blocco | ne diceva | |
|---|---|---|
| `k-verdetto` · riga di esito degli accordi · `formaTitolo()` · le quattro probabilità | **quattro** | ✓ |
| **archivio `#k-tab`**, due forme | tre | ✓ **dichiarato** nel piede |
| **emiciclo**, i totali dentro l'arco | tre → **111 su 120** | ✗ |
| **`og:image`** — `anteprima.mjs` prende `#k-emi svg` alla lettera | gli stessi 111 | ✗ |
| **`testoCondivisione()`** — X, Facebook, Telegram | «i **120** seggi» e ne elencava 111 | ✗ |
| **`promptAI()`** — va a un servizio terzo | «su 120 totali», 111 | ✗ |
| **`serieModello()`, nuvola e legenda** della tendenza | tre linee che sommano 111 sotto la riga del 61 | ✗ |
| **riquadro dell'evento isolato** | «Netanyahu 50 · Opposizione 51 · Arabi 13» = 114 | ✗ |
| **targa delle card social**, composizione B | tre voci a passo fisso `CW*0,30` | ✗ |
| `k-deck` · `rDirezione` | due | ✗ |
| `rSwNota` · istogrammi e didascalie | due **per costruzione** | ✓ |

**E il codice diceva già che era un difetto**: `rEmi()` dichiarava
`sigla={…, incerto:'incerti'}` e tre righe sotto il `trio` era cablato a tre chiavi. La voce
era scritta e **irraggiungibile**.

### La riga dei totali: la leva è la quota, non il corpo

Il vuoto dell'arco è un semicerchio, quindi si allarga verso la base. Quattro sigle chiedono
**165,9 unità** di solo inchiostro — «opposizione» da sola ne vale 57 e «arabi» 25,9 — e a
spaziatura **uniforme**, i 58 di prima, il corpo massimo crolla a **15,0**. Dimensionando
ogni slot sulla **propria** sigla si risale, e da lì a decidere è l'altezza:

| quota / varco | oggi, tre blocchi | quattro blocchi |
|---|---|---|
| **y180 / 5** — dov'era | 31 | **17** |
| y196 / 4 | 31 | 23–29 |
| y200 / 5 | 31 | 26,5 |
| y204 / 3 | 31 | 31 — varco troppo stretto fra le sigle |
| **y204 / 4** — applicato | **31** | **29 · 29 · 29** |
| y208 / 4 | 31 | 29 |

`y204/4` è l'unica combinazione che dia lo **stesso** corpo su tre configurazioni a quattro
blocchi diverse — 4, 9 e 11 seggi all'ago della bilancia, che danno tre disposizioni di
seggi diverse: il numero non deve cambiare grandezza a seconda di dove capitano i seggi.
Costa il **6%** — 40,5px invece di 43,3 a 1265, 22,0 invece di 23,5 a 380 — e **zero
altezza**, perché le sigle finiscono a y221, dentro le 14,6 unità che il viewBox aveva già
libere sotto l'arco. Con tre blocchi il corpo resta **31**: a stringersi è solo il giorno in
cui un quarto blocco entra in Knesset.

**L'alternativa era portarli fuori dall'arco**, ed è misurata: viewBox da 232 a **264**, cioè
**+32 unità, il +13,8%**, che sono +44,7px a 1265 e +24,3 a 380 — e lascerebbe il vuoto
vuoto. Non serve pagarla.

**Il corpo si ricava dai seggi VERI, non da un modello dell'arco.** Trattandolo come una
curva continua il massimo scende a 15,5: i seggi sono **discreti**, e fra l'uno e l'altro c'è
aria che quel modello non vede. È la regola dell'esportazione PNG applicata qui — la
geometria non si scrive, si legge dal disegno reso.

### La leva: `IN_BILICO`, una sola per tutte le righe

`bloccoDi(i)` cambia il campo in cui un seggio viene **contato**. Non cambia l'anagrafica,
non cambia un colore, non tocca `PAL_SCURO`. **Misurato**: a leva accesa i totali passano da
47·49·15·9 a 56·49·15·0 e **nessuna lista cambia di un seggio**, perché `dhondt()` e
`ripartoVeloce()` non leggono il blocco di nessuna lista — l'unica `.b` che `dhondt` nomina è
il secondo membro di una coppia di apparentamento.

**La regola che ne esce, e vale per chi aggiunge un consumatore domani: le funzioni che
calcolano QUOTE leggono l'anagrafica, quelle che CONTANO SEGGI leggono la leva.**

| | legge | perché |
|---|---|---|
| `applicaSwing()`, `puntiPer()`, `dir[]` del Monte Carlo | **`P[i].b`** | lo swing è una **misura storica**, tarata su 2020-21-22, e in quelle elezioni queste liste non esistevano |
| `isCo/isOp/isAr` del Monte Carlo | `bloccoDi()` | lì la domanda è «chi arriva a 61», che è la domanda della leva |
| `blocchi()`, emiciclo, `rProj` | `bloccoDi()` | contano seggi |
| **archivio `#k-tab`** | `blocchi(s.seggi, **true**)` | quelle colonne riproducono la **fonte**, e un istituto non conosce le nostre ipotesi |

La leva dice «se governasse con Netanyahu il blocco avrebbe N seggi», non «i suoi elettori si
comportano come i suoi». **E la differenza non è teorica**: misurato, con la leva dentro lo
swing, a swing −4 la lista passava da 9 seggi a 8 e Otzma da 7 a 8, e a swing +4 il blocco
arrivava a **61 esatti** per uno spostamento di voti che nessun sondaggio ha rilevato.

**LA LEVA NON DEVE ARRIVARE ALLA GUARDIA «Gov.» DEL PARSER NOTTURNO.** Quella guardia valida
la colonna di Wikipedia contro `PRESET.netanyahu`, e la fonte non conta queste liste lì
dentro: se la leva la raggiungesse, **ogni notte con la leva accesa il job respingerebbe
righe valide** dichiarando «blocco discordante» — nel lavoro notturno, cioè dove nessuno
guarda, con l'archivio fermo finché qualcuno se ne accorge. `PRESET.netanyahu` resta il
filtro su `P[i].b`, e `blocchi.js` legge il **sorgente** del parser per pretendere che non
nomini mai `bloccoDi`.

**È un meccanismo, non un caso.** Una leva per lista sarebbe ingestibile l'8 settembre:
questa ne governa tutte le righe dichiarate insieme, come `PAR.apparentamenti` governa tutti
gli accordi annunciati, e la riga di esito dice quali ha applicato, quali no e perché. Il
caso specifico avrebbe risparmiato una riga di tabella in cambio di un id cablato, cioè la
copia che l'8 settembre resta indietro.

**L'etichetta ha la stessa larghezza in tutti e quattro gli stati**, ed è una proprietà
cercata: «Assegna» e «Riporta» hanno sette lettere, «lista» e «liste» ne hanno cinque. È la
cosa che al comando degli accordi è costata un difetto — il pannello si accorciava di 36px
**sotto il dito** e tutto quello che stava sotto saltava su e giù a ogni pressione.

**Oggi il pulsante non c'è**, e la riga tace: «Popolo d'Israele» non ha seggi, quindi la leva
muoverebbe zero. Un comando che finge di funzionare è peggio di un comando assente.

### Tre difetti trovati dal banco, e nessuno era quello che si stava riparando

1. **`if(!urto)` su un valore in virgola mobile.** Una scatola che sfiora un seggio
   restituisce `8,9e−15` invece di 0, che è **vero**: la bisezione continuava a stringere e
   il corpo usciva **18 invece di 27,5** — il doppio del prezzo, senza che niente lo dicesse.
   Adesso c'è `TOT_ARIA`, mezza unità di distanza richiesta: 0,38px a 380, e toglie il
   problema numerico e quello estetico insieme.
2. **La chiave della cache della serie era `SOND.length`.** Un archivio **diverso della
   stessa lunghezza** lasciava servita la serie di prima. Non si vede finché l'archivio
   cresce e basta, cioè finché lo tocca solo il lavoro notturno — ma il modulo dell'autore
   importa e corregge le rilevazioni a mano, e lì il numero di righe può non muoversi mentre
   i seggi si muovono. **E la prima impronta scritta per ripararla aveva una collisione**:
   pesava ogni lista per la lunghezza del suo id, e `likud` e `amcha` hanno tutte e due
   cinque lettere, quindi spostare seggi fra le due non la muoveva. Trovata dalla prova, non
   dall'attenzione.
3. **Bianco su `--inc` sta a 3,78.** La pastiglia finale della tendenza scrive in
   `--on-color` sul colore della serie, e `--inc` in tema chiaro è `#B57600`: il difetto non
   esisteva finché la quarta serie non veniva disegnata, ed è comparso nello stesso commit
   che l'ha aggiunta. **Il rimedio non è un'eccezione per `--inc`**: `inchiostroSu()` chiede
   il contrasto invece di darlo per scontato, e sugli otto casi — quattro token per due temi
   — il migliore dei due inchiostri sta a **4,72** nel peggiore. Il giorno in cui la
   tavolozza si muove, risponde da sé.

### La prova che mancava

`test/suite/blocchi.js`, 53 asserzioni. **In tutto il banco non esisteva un'asserzione che
legasse i totali al 120**, ed è la ragione per cui il difetto è arrivato fin qui: `emi.js`
non nomina mai `incerto`, e ogni consumatore era corretto rispetto a sé stesso — la forma
contro cui questo file mette in guardia da quando i token di blocco sono stati divergenti per
tre commit.

La prova non guarda un elenco di posti, guarda una **proprietà**: «ogni vista che pubblica
dei totali di blocco li pubblica tutti» vale anche per la vista che qualcuno aggiunge domani.
E niente è scritto sull'archivio del giorno: la fixture sposta i seggi lì dentro, perché sui
numeri di oggi la prova sarebbe verde **per assenza del caso**.

**E quattro attese che dicevano «tre» sono state riscritte sulla proprietà invece che sul
numero** — `graf.js`, `mob2.js`, `isola.js` e il ruolino di `PAR_DEF` in `apparentamenti.js`.
Un «3» in quelle prove avrebbe detto «difetto» dove c'era una riparazione, ed è esattamente
l'attesa che si fa tornare verde senza guardare.

### La leva nasce ACCESA, e questo cambia il verbo e la riga

Deciso dall'autore il 27 agosto 2026, poche ore dopo aver applicato la leva spenta. Il
cambio è di una cifra in `PAR_DEF`, ma sposta due cose che vanno guardate insieme.

**Perché accesa.** Le altre due leve di ipotesi partono spente perché aggiungono un'ipotesi
a un conteggio che senza di loro è quello della fonte. Qui è il contrario: la domanda «e se
governasse con Netanyahu?» è quella che un lettore si fa comunque davanti a una lista che
non sta con nessuno dei due campi, e partire dallo stato in cui non è posta lo lascia
davanti a un conteggio che **non dichiara la propria ipotesi**. È lo stato non dichiarato
contro cui il simulatore accende «Blocco Netanyahu» all'apertura invece di partire da una
selezione vuota.

**IL PREZZO VA SAPUTO, ed è scritto accanto alla costante: il conteggio predefinito non è
quello della fonte.** Wikipedia non conta queste liste nel totale «Gov.», e la pagina sì.
L'anagrafica resta invariata — in `P{}` restano dove la fonte le mette — e la guardia «Gov.»
del parser notturno continua a leggere quella, che adesso conta doppio: con la leva accesa
per difetto, una leva che la raggiungesse farebbe respingere righe valide **ogni notte**.

**Il verbo si rovescia.** Con la leva accesa il primo verbo che il lettore incontra è quello
che **toglie**, non quello che aggiunge:

| stato | etichetta |
|---|---|
| **acceso — il difetto** | **Togli 1 lista dal blocco** |
| spento | Conta 1 lista nel blocco |

È la grammatica di «Escludi / Includi» dell'house effect: il nome dice l'azione, il cambio
di nome **è** il riscontro, quindi niente `aria-pressed`. E «Riporta 1 lista in bilico», che
era l'etichetta del giorno prima, diceva dove va e **non da dove viene**.
Le due etichette hanno la **stessa lunghezza**, ed è cercato: «Togli» e «Conta» hanno cinque
lettere, «dal» e «nel» tre, «lista» e «liste» cinque. Non cambia larghezza né premendo né
quando il numero passa da uno a due — è la cosa che al comando degli accordi è costata 36px
di salto sotto il dito.

**La riga di esito dichiara lo stato ACCESO, non solo quello spento**, e lo dichiara nel
primo periodo: quella frase la legge chi non ha toccato niente.

> **Il conteggio parte da un'ipotesi**, non da un fatto: **Popolo d'Israele con Blocco
> Netanyahu**, contata nel blocco con cui governerebbe mentre la fonte la tiene fuori dai
> due campi. **4 seggi** si spostano fra i blocchi: Blocco Netanyahu 47 → 51 · Ago della
> bilancia 4 → 0. Il pulsante la riporta dove la mette la fonte.

L'ultima frase non è cortesia: «ipotesi» senza il comando per toglierla è una parola sola.

**E `statoLeve()` la dichiara quando è SPENTA**, perché il confronto è con `PAR_DEF` e non
con lo zero — così il prompt che va al servizio terzo segue il difetto anche se un giorno
cambia.

**Il comando compare quando comincia a spostare qualcosa, e non prima.** Oggi «Popolo
d'Israele» non ha seggi in nessuna rilevazione, quindi la leva — benché accesa — muove zero
e il pulsante non c'è. Dal primo sondaggio che la porta sopra soglia il conteggio cambia da
solo, perché la leva è già accesa: il pulsante deve comparire **in quel render**, o il
lettore si troverebbe davanti a un'ipotesi applicata senza il comando per toglierla. La
prova non indovina il punto, lo **cerca**: «al primo seggio» sarebbe falso, perché un seggio
per rilevazione vale una quota dello 0,8% contro una soglia di 3,25.

### Quello che esce dalla pagina deve portare l'ipotesi con sé

Chiuso il 27 agosto 2026, subito dopo aver acceso la leva. È la stessa famiglia del
riquadro dell'evento isolato: **un numero che esce dal suo contesto.** La riga di esito
dichiara l'ipotesi a chi è sulla pagina; chi riceve il link su WhatsApp, chi vede la card
su Facebook e il servizio terzo che riceve il prompt non hanno modo di saperlo.

**LA DOMANDA NON È QUELLA DI `statoLeve()`, ed è la cosa che non si deduce.** `statoLeve()`
confronta con `PAR_DEF` e risponde «che cosa ha cambiato il lettore»: serviva a dire a un
servizio terzo che i numeri ricevuti non sono quelli che troverebbe all'indirizzo, ed è la
domanda giusta finché il predefinito è il conteggio della fonte. **Da quando la leva nasce
accesa non lo è più**: quando l'ipotesi è applicata `statoLeve()` **tace**, perché nessuno
ha cambiato niente — cioè tace esattamente nel caso in cui bisogna parlare. Una funzione
sola per le due domande direbbe la cosa giusta per la ragione sbagliata.

Da qui `ipotesiNeiNumeri()`, che risponde a «che cosa c'è dentro questi numeri» e non
dipende da chi ce l'ha messo. **Una stringa, tre consumatori** — la frase di condivisione,
il prompt, la targa dell'anteprima — che è l'idioma di `fraseCorta()`.

**Parla solo quando l'ipotesi sposta davvero qualcosa.** Oggi restituisce stringa vuota, e
niente di quello che esce dalla pagina cambia: la frase compare dal primo sondaggio che fa
entrare una lista in bilico, insieme al pulsante. Dichiarare un'ipotesi che non muove nessun
numero insegnerebbe a saltare la riga proprio prima del giorno in cui conta.

### I canali si dividono, e insieme si coprono

| canale | che cosa passa | chi lo dichiara |
|---|---|---|
| X · Telegram · WhatsApp · Threads | testo **e** indirizzo | `testoCondivisione()` |
| Facebook · LinkedIn | **solo** l'indirizzo | la targa dell'`og:image` |
| il prompt a un servizio terzo | testo | `promptAI()` |
| `og:title` | — | **non può** |

**`og:title` non può, ed è misurato: il titolo più lungo sta a 58 caratteri su 59
disponibili.** Un carattere di margine, e il tetto non è arbitrario — è il `<title>` che
finisce nella linguetta del browser e nella card. Qualunque clausola lo sfonda. Ma la
copertura non ha buchi lo stesso: dove il titolo arriva da solo, senza testo e senza
immagine, non arriva nemmeno un numero — le card che mostrano solo il titolo mostrano anche
la descrizione, e il titolo senza l'immagine è il caso che non esiste.

**L'alternativa era che il job scrivesse i totali senza la leva**, ed è stata scartata: la
card direbbe numeri **diversi** da quelli che si trovano cliccando, cioè una terza lettura
degli stessi dati. L'anteprima deve dire quello che la pagina dice.

### La targa: la terza riga è gratis, e il piede non poteva portarla

| | misurato |
|---|---|
| banda della testata | **96 unità**, e ne usa **63** (titolo a corpo 30, base a y=56) |
| la riga nuova | corpo 18, base a **y=84** → fondo a 88,5, **7,5 unità di margine** |
| costo per il disegno | **zero**: la testata è un margine della **tela**, non del disegno |
| il piede a corpo 18 | regge **113 caratteri** e ne usa già **82** (firma, indirizzo, data) |
| la forma **lunga** | **142 caratteri** → nel piede sforerebbe, nella testata pure |
| la forma **corta** | **86 caratteri** su 100 disponibili ✓ |

Da cui **due forme e una funzione**, che è la struttura di `testoCondivisione(conIndirizzo)`
e di `titoloCorto()`/`fraseCorta()`.

**E la forma corta mette l'essenziale DAVANTI**: apre con «Ipotesi del modello», non ci
arriva in fondo. Il taglio della targa avviene in coda — stima per eccesso a 0,62 em, come
`inchiostro()` — quindi quello che sopravvive a un taglio dev'essere la parte che **avverte**,
non quella che dettaglia. Se un giorno la frase cambiasse ordine, quel taglio diventerebbe
una censura dell'avvertimento, ed è scritto accanto alla funzione che taglia.

### Tre mutanti sopravvissuti, e uno era codice mio di troppo

- **`!c.mossi` era irraggiungibile.** `filtraBilico()` scarta già le righe la cui lista non
  ha seggi, quindi una riga che entra ne ha per definizione e `mossi` non può essere zero.
  Una guardia che nessuna mutazione fa cadere è codice che nessuna prova esercita: tolta.
- **Due asserzioni sulla targa erano vaghe.** Cercavano `spia.ipotesiNeiNumeri` senza gli
  argomenti, quindi il mutante che passa la forma **lunga** — 142 caratteri su una riga che
  ne regge 100, cioè una frase troncata proprio dove sta l'avvertimento — restava vivo. E
  non c'era niente che dicesse che la riga viene **disegnata**: spegnerla non faceva cadere
  nulla. Adesso l'ancora comprende `(true)` e la presenza del `<text>`.

---

## La condivisione: lo stesso elenco due volte, e il glifo che non si leggeva

Applicato il 27 agosto 2026.

### Sopra i 1380 il blocco in fondo se ne va

La colonna a sinistra e il gruppo «Condividi» in fondo sono la stessa cosa montata due
volte — è dichiarato nel codice da quando esistono, e nascono dalla stessa `cerchioRete()`.
Finché la colonna era una comodità in più il doppione si pagava con `aria-hidden` e
`tabindex="-1"`: sette comandi duplicati avrebbero portato l'elenco da sette a quattordici,
tutti con lo stesso nome accessibile a coppie.

Adesso, sopra i 1380, **il gruppo in fondo sparisce** e la colonna resta l'unica copia. Da
cui la conseguenza che non si deduce e che va scritta: **la colonna non è più
`aria-hidden`**, e i suoi comandi sono tornati nell'ordine di tabulazione. Nasconderla
adesso vorrebbe dire che a quella larghezza, per chi usa la tastiera o un lettore di
schermo, la condivisione **non esiste**.

**Il doppione non si ripresenta, e non serve nessuna guardia**: a ciascuna larghezza uno dei
due gruppi è `display:none`, e un elemento non visualizzato esce da sé dall'albero di
accessibilità e dall'ordine di tabulazione. Misurato sulla pagina viva: a **1440** colonna
`flex` con sette cerchi e gruppo in fondo `none`; a **1265** colonna `none` e gruppo in
fondo `block` con sette cerchi, sforamento orizzontale zero.

**Non si nasconde col JavaScript**, e non è un dettaglio: la pagina non si ridisegna al
ridimensionamento, quindi una scelta presa dal codice resterebbe quella della larghezza di
partenza appena si allarga la finestra. È l'idioma del contatore dell'archivio e del
sommario di testata — due forme nel DOM, e a scegliere è il foglio.

**L'elenco di ciò che sparisce è una costante sola**, `VIA_SOPRA_COLONNA`, come
`VIA_NELL_EMBED`. La classe che il foglio spegne la mette **quella costante** e non il
modello della stringa: scritta a mano nell'HTML sarebbe la seconda strada, e a divergere
basterebbe un id aggiunto alla costante e dimenticato lassù.

### La copia del collegamento entra nella colonna, e l'id diventa un attributo

Era esclusa con una ragione scritta — «un'azione fuori dall'ordine di tabulazione è
irraggiungibile per chi non usa il mouse» — e **quella ragione è caduta insieme al
`tabindex`**. Adesso è il settimo cerchio in tutti e due i posti.

Da cui una cosa piccola e necessaria: il cerchio porta **`data-copia="link"` e non un id**.
Due elementi con lo stesso id non sollevano niente e fanno rispondere `getElementById` al
primo dei due — e il riscontro (il glifo che diventa una spunta) finirebbe sul cerchio
sbagliato.

### I glifi: quello che non si leggeva era Threads, e non alla misura grande

**I quattro segni dei modelli non erano PNG in base64**: lo sono nel modello Germania, ed è
esattamente la ragione per cui erano già stati ridisegnati qui. Sono stati rifatti lo stesso,
sul riferimento fornito dall'autore, e con essi cambia la loro **natura**: da «segni
evocativi nostri» a marchi **nominativi** ridisegnati, cioè la stessa categoria dei sei della
riga sopra e con la stessa giustificazione. L'esagono con le corde era un cubo e adesso è un
nodo; la stella e la raggiera sono passate dal tratto al **pieno**, perché è così che sono i
marchi.

**Threads è l'unico rifatto per un altro motivo, e il motivo è la misura.** Il tracciato di
prima tentava di riprodurre il marchio vero: ingrandito passava, e **alla misura in cui vive
— 20px dentro il cerchio da 44 — era una macchia**, con una coda che usciva in basso a
sinistra e un occhiello staccato. È «misurare convince di aver guardato» applicato a un
segno: nessuna prova guarda un tracciato, e in jsdom un path sbagliato non fa **nessun
rumore**.

**Come si sono guardati.** Rasterizzati con **resvg** — che il banco ha già per l'anteprima
`og:image` — e messi tutti insieme in un foglio di contatto, ciascuno due volte: grande, e a
20px dentro un cerchio da 44. Provate quattro forme del gancio e due pesi; la prima tornata,
un anello con lo stelo, leggeva come una **«d» minuscola** accanto a X e a «f». L'anello con
la spirale interna è l'unica che a 20px resta un segno.

**A tratto e non pieno, ed è l'eccezione della riga**: un segno pieno di quella forma a 20px
si chiude su sé stesso e diventa un disco con due buchi. Il tratto a 2,8 tiene il peso dei
marchi pieni accanto — la gamba della «f» e le aste di «in» misurano quanto lui.

---

### Venti mutazioni, e i tre che sono sopravvissuti al primo giro

Tutti e venti morti alla fine, ma **tre erano vivi al primo giro** e ciascuno diceva una cosa
diversa. Vale la pena tenerli, perché nessuno dei tre era un difetto del codice: erano buchi
delle prove, e due si sarebbero potuti scoprire solo mutando.

**1 · L'ANCORA DELLA PROVA ERA DOPPIA, ed è la trappola della prima occorrenza vista dal
lato sbagliato.** L'asserzione «la guardia Gov non nomina bloccoDi» cercava
`PRESET.netanyahu.forEach`, che in questo file compare **due volte**: nella guardia del
parser e nell'inizializzazione di `COAL`. `indexOf` trovava la seconda, quindi la prova
esaminava un pezzo di file a duemila caratteri di distanza da quello che credeva di
guardare — e il mutante che porta la guardia a leggere la leva restava **vivo**, cioè la
protezione che vale il lavoro notturno non era protetta da niente. Questo progetto aveva già
pagato la prima occorrenza nel *misuratore* di mutanti; qui era nella *prova*. L'ancora
adesso è il messaggio della guardia — unico, e la prova lo verifica prima di usarlo — e la
regione esaminata è tutta la funzione che lo contiene.

**2 · Un mutante può essere invisibile perché i dati non lo esercitano mai.** Il ramo che
spegne la quarta serie quando non ha niente da dire non si esercita con l'archivio del
progetto, e la ragione è quel dato: **quindici rilevazioni di `BASE` danno seggi a Casa
Sionista**, quindi la nuvola dei sondaggi ha sempre dei punti dell'ago della bilancia anche
quando la proiezione non gliene assegna nessuno. Serviva la fixture **opposta** — l'ago
della bilancia tolto da ogni riga e i seggi rimessi al Likud, così ogni riga chiude ancora a
120 — e senza quella il mutante che disegna sempre quattro serie sarebbe rimasto vivo per
sempre.

**3 · Una prova che verifica «non si sovrappongono» non coglie «si toccano».** Il mutante che
riporta `TOT_ARIA` a zero sopravviveva perché l'asserzione misurava la sovrapposizione con
la stessa geometria senza margine. Adesso il pavimento si **legge dal sorgente** invece di
essere ricopiato — una costante ricopiata in una prova è la strada doppia di sempre, e per
giunta quella che decide se la prova morde.

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

### Lo stato al 27 agosto 2026, sera

Ultimo commit spinto: **`a89deed`**. Banco a **2330**, struttura pulita, spazzola pulita.
Il tetto del gzip è stato **rifatto** — non alzato — e sta a **287 KB** contro 223,7 di file.

**Che cosa è entrato oggi**, in tre commit. Il giro dei **quattro blocchi**: l'emiciclo che ne
contava tre su quattro, i nove consumatori che perdevano il quarto, la leva `IN_BILICO`, e
`test/suite/blocchi.js` — la prova che legava i totali al 120 e che non esisteva. Poi la
**dichiarazione dell'ipotesi** in tutto ciò che esce dalla pagina. Poi cinque riparazioni
indipendenti: l'aria dei totali, il vuoto fra i gruppi, i quattro conti scritti a mano, la
parità del workflow col battito che ne discende, e i glifi presi da Simple Icons.

**Il lavoro notturno è tornato a girare, e va letto con attenzione.** Il cron delle 03:30
del 27 agosto è partito alle **14:28 UTC** — in ritardo di undici ore, non assente: le
esecuzioni programmate di GitHub sono a sforzo migliore, e questo è il modo in cui slittano.
È arrivato in fondo: `stato-job.json` dice **27 agosto, 161 valide**. Ma
**`dati/da-fare.json` è rimasto al 25**, perché quel run usava il workflow di prima: il
difetto dell'`--autostash` si è ripetuto sotto osservazione, ed è la conferma migliore che
la diagnosi fosse giusta. La riparazione è spinta e vale dalla prossima notte — **la prima
cosa da guardare domani è che `da-fare.json` si sia mosso.**

### Le quattro cose decise oggi che dal codice non si deducono

**1 · `statoLeve()` e `ipotesiNeiNumeri()` sono due domande diverse, e lo sono diventate
oggi.** La prima risponde a «che cosa ha cambiato il lettore» — confronta con `PAR_DEF` — ed
è la domanda giusta finché il predefinito è il conteggio della fonte. La seconda risponde a
«che cosa c'è dentro questi numeri», e la risposta non dipende da chi ce l'ha messa.
Da quando `PAR.inbilico` nasce accesa le due divergono **nel caso peggiore**: quando
l'ipotesi è applicata `statoLeve()` tace, perché nessuno ha cambiato niente.
**Il giorno in cui un altro predefinito diventa un'ipotesi, `ipotesiNeiNumeri()` deve
saperlo** — non `statoLeve()`, che continuerà a rispondere correttamente alla sua domanda.
Vedi la trappola omonima e «Quello che esce dalla pagina deve portare l'ipotesi con sé».

**2 · `og:title` ha UN CARATTERE di margine: 58 su 59.** Qualunque cosa si voglia aggiungere
lì va misurata prima, e la risposta è quasi certamente no. Non c'è spazio per una clausola,
per un inciso, per una sigla: nemmeno per «·». È il motivo per cui la dichiarazione
dell'ipotesi è finita nel testo di condivisione e nella targa dell'anteprima.

**3 · I glifi si prendono da una fonte con licenza, non si ridisegnano.** Tre giri di
ridisegno a occhio in un giorno, tre fallimenti — il gancio somigliava a una «d» minuscola,
poi a un uncino in un cerchio; il nodo a un ingranaggio. Un marchio non si ricostruisce a
memoria: **o si prende il file, o si disegna una cosa che NON pretende di essere quel
marchio.** Nove vengono da Simple Icons; tre sono nostri e dichiarati uno per uno in
`embed.js` con la ragione, ChatGPT compreso — che è nostro perché Simple Icons non ha
l'icona di OpenAI, e l'assenza è del repository, non della ricerca.

**4 · `PAR.inbilico` nasce ACCESA e l'anagrafica non si tocca.** In `P{}` «Popolo d'Israele»
resta ago della bilancia, perché è lì che la mette la fonte. La regola che ne discende, e
che vale per chi aggiunge un consumatore domani: **le funzioni che calcolano QUOTE leggono
l'anagrafica — `applicaSwing()`, `puntiPer()`, `dir[]` del Monte Carlo, l'affluenza araba —
quelle che CONTANO SEGGI leggono la leva.** E la leva non deve raggiungere la guardia «Gov.»
del parser notturno, o ogni notte respingerebbe righe valide dove nessuno guarda.

### Il parser e le due convenzioni: diagnosticato il 27 agosto, NON applicato

Wikipedia usa due notazioni per le liste sotto soglia, **nella stessa schermata**. Il
sospetto di partenza era che il parser leggesse `(1,8%)` come 1,8 seggi; misurato, è
**rovesciato**.

- **`(N%)` è già gestito**, parentesi comprese: l'espressione ammette `(`, `<`, `~`, `≈`, e
  `wClean` toglie le note a piè di pagina prima, quindi anche `(1,4%)[o]` — 5 celle in pagina
  — arriva pulita. **1075 celle** di questa forma, tutte lette.
- **`(N)` nella colonna di una lista è ILLEGGIBILE e scarta la riga.** L'espressione dei
  seggi vuole un intero nudo, `/^(\d+)$/`, quindi `(3)` non è né percentuale né seggi:
  `ok=false`, motivo «valore non interpretabile». Misurato sulla fonte vera: **34 righe
  scartate — 24 ambigue, 6 somma, 3 blocco, UNA illeggibile**, ed è **Maagar Mochot del 26
  agosto**. Una riga sola, non parecchie. Ma la forma tornerà: `(N)` compare in 5 celle,
  tutte in quella riga.
- **Che cosa vuol dire `(N)`, dalla riga vera**: `21 | 16 | (3) | 9 | (1) | …` — **i numeri
  nudi sommano già 120**, e i cinque fra parentesi sono in più. Quindi `(N)` dice esattamente
  quello che dice `(N%)`: la lista è sotto soglia e prende **zero** seggi, e N è quanti ne
  prenderebbe se passasse. È un condizionale, non un'assegnazione.
- **N NON VA USATO, e le due strade sbagliate sono entrambe silenziose.** Metterlo in `sotto`
  sarebbe un errore di unità — quella mappa contiene **percentuali**, e 3 verrebbe letto come
  3%, spostando `ws` e quindi `q`. Convertirlo (3/120 ≈ 2,5%) sarebbe una **stima**, non un
  dato: i voti di una lista esclusa non stanno nel monte valido, quindi «tre seggi» viene da
  un'altra aritmetica. La lettura giusta è **«sotto soglia, zero seggi»** e basta: la riga
  entra e quella lista cade sul ripiego `DISP`, come ogni sondaggio che non dichiara le
  percentuali.
- **E la percentuale dichiarata `invD()` la usa GIÀ**, in due modi, tutti e due in
  `quoteDa()`: `q = 100 − max(ws, DISP)` restringe il monte con le percentuali vere invece
  del ripiego, e `sh = Object.assign({}, s._q, sotto)` mette la percentuale dichiarata come
  quota **così com'è**. Non la stima. Il che rende la riga persa più cara di quanto sembri:
  se ne vanno i seggi *e* le quote dichiarate.
- **La stessa forma in altre due colonne fallisce IN SILENZIO**, ed è peggio:

  | colonna | `(N)` | conseguenza |
  |---|---|---|
  | **lista** | `(3)` | riga **scartata**, e lo dichiara |
  | **Gov.** | `(46)` | `gov=null` → **la guardia del blocco non si esegue** |
  | **campione** | `(552)` | `campione` assente → **il peso per numerosità decade al ripiego** |

  Oggi nessuna delle due seconde forme compare. La riga che scarta è rumorosa; queste due
  non lasciano traccia da nessuna parte.

### Due buchi noti nel banco, dichiarati invece che taciuti

- **`VUOTI` non è provato**: nessuna asserzione guarda il vuoto fra i gruppi, e il mutante
  che lo riporta a 3 resta vivo. È il difetto riparato oggi, senza la prova che lo tenga.
- **I due mutanti di `TOT_ARIA` sono equivalenti**, e va detto per iscritto perché un
  mutante vivo si legge come una prova mancante: con il tetto del corpo a 28 è il **tetto**
  a mordere, non il vincolo dell'aria, quindi portare `ARIA` a 0,5 o a 0 non cambia il
  disegno. Il vincolo diventa vincolante solo se la riga cresce — un quinto blocco, sigle
  più lunghe — e per esercitarlo servirebbe una fixture di quella forma. Finché non c'è,
  **l'aria è garantita dal tetto e non dal vincolo**, e questa riga è l'unica cosa che lo
  dice.

#### Che cosa era entrato nella prima metà della giornata

Ultimo commit spinto: **`9682011`**, CI e Pages verdi. Banco a **2311**, struttura pulita,
spazzola pulita.

**LA LEVA C'È MA IL COMANDO NON SI VEDE, ED È GIUSTO COSÌ.** Misurato il 27 agosto:
`IN_BILICO` ha una riga sola, `amcha → coalizione`, e «Popolo d'Israele» **non compare
nemmeno fra le quote** — zero seggi in tutte e 175 le rilevazioni. La leva è accesa e muove
zero, quindi il pulsante non è reso e la riga di esito tace: la pagina di oggi è identica a
prima. Il pulsante compare da sé dal primo sondaggio che la porta sopra soglia — misurato,
bastano **due seggi per rilevazione** perché ne prenda cinque nella proiezione.

E una cosa che serve sapere prima di aspettarsi che la leva conti: **la lista dell'ago della
bilancia più vicina alla soglia NON è quella che la leva nomina.** «Casa Sionista» sta a
**2,809** e le mancano 0,441 punti; Amcha è assente. Se Casa Sionista entrasse domani, il
quarto blocco comparirebbe in pagina — arco, tendenza, riquadro dell'evento — ma **la leva
non si muoverebbe**, perché nessuna riga di `IN_BILICO` la nomina. Aggiungercela è una
decisione sul blocco di una lista, cioè quella che il confine dell'agente riserva a una
persona: si fa se e quando la fonte dice che quella lista starebbe con un campo.

**Per esercitare la leva senza aspettare un sondaggio** si usa il modulo dell'archivio, che
esiste per questo: `Esporta JSON` → si danno dei seggi ad Amcha in un po' di rilevazioni →
`Importa JSON`. Dalla console non si può: tutto sta dentro una funzione anonima e `PAR` non
è globale.

È entrato il giro dei **quattro
blocchi** — vedi la sezione omonima: l'emiciclo che ne contava tre su quattro, i nove
consumatori che perdevano il quarto, la leva `IN_BILICO` che riclassifica senza ricalcolare,
e `test/suite/blocchi.js`, che è la prova che legava i totali al 120 e che non esisteva.
Con essa tre difetti che non c'entravano con la riparazione: il confronto in virgola mobile
con lo zero esatto, la chiave della cache della serie fatta sul **numero di righe**, e bianco
su `--inc` a 3,78.

Poi, nello stesso giro: la leva **accesa per difetto** col verbo rovesciato e la riga di
esito che dichiara l'ipotesi a chi non tocca niente; la **condivisione** che sopra i 1380
smette di essere lo stesso elenco due volte, con la colonna che torna nell'albero di
accessibilità e prende la copia del collegamento; e i **glifi** — i quattro marchi dei
modelli rifatti sul riferimento dell'autore, e il gancio di Threads ridisegnato perché alla
misura in cui vive era una macchia. Mutazioni: **20 su 20** nel primo giro e **13 su 13**
nel secondo, **8 su 8** nel terzo — quello che chiude `og:title`, `og:image`,
`testoCondivisione()` e `promptAI()`, cioè tutto quello che esce dalla pagina.

### Lo stato al 26 agosto 2026

Ultimo commit spinto: **`765b8b2`**. Banco a **2226**, spazzola pulita. Il lavoro notturno
gira: la notte del 26 è arrivata in fondo — parser, guardie, verifica, commit, push,
spazzolata, riepilogo — e l'archivio pubblicato è a **175 rilevazioni**, l'ultima del 24
agosto.

**Che cosa è entrato negli ultimi due giorni.** La condivisione a glifi con la colonna
fissa sopra i 1380 e le cinque schede dell'IA col riquadro che mostra il prompt; la suite
`riparto.js`; l'asserzione del simulatore riscritta per la finestra del deposito; la
mappatura di **Amcha Israel**, che è la prova di regia dell'8 settembre eseguita sul caso
vero; e tre riparazioni del lavoro notturno che lo tenevano fermo.

#### Amcha Israel: dov'è finita, e il numero che chiude la domanda di Channel 12

**Resta l'ago della bilancia, e non è una deduzione politica: lo dice la fonte.** Il totale
«Gov.» che Wikipedia pubblica **non conta Amcha dentro**, su tutte e tre le righe in cui
quel totale c'è. La decisione l'ha confermata l'autore il 26 agosto, dopo che gliel'avevo
riportata: il blocco sposta seggi fra i campi nel grafico pubblicato, quindi non si cambia
senza una persona.

**E il modello non si muove di un seggio.** Misurato sull'archivio pubblicato di 175
rilevazioni, il 26 agosto 2026:

| | |
|---|---|
| rilevazioni che danno seggi ad Amcha | **0** |
| rilevazioni che la nominano sotto soglia | **0** |
| quota di Amcha nella proiezione | **assente** |
| quota del Sionismo Religioso | **4,105** contro una soglia di 3,25 → **5 seggi, sopra** |
| i tre totali di blocco | **Netanyahu 51 · opposizione 57 · arabi 12** |

**Sono gli stessi tre di prima della mappatura.** Le quattro rilevazioni che nominano la
lista le danno `(1,5%)`, `(0,9%)`, `(0,6%)` e `>1,5%` — fra parentesi, cioè la convenzione
di Wikipedia per sotto soglia — e nelle stesse righe il Sionismo Religioso sta a 5 e 6
seggi. **Il caso composto di cui parla Channel 12 — una che cade mentre un'altra entra —
NON si sta verificando nei dati: è ancora ipotetico.** `riparto.js` lo prova lo stesso,
perché prova il meccanismo e non i sondaggi di oggi, ed è precisamente per questo che una
fixture sintetica era la scelta giusta.

**E una cosa da sapere prima di stupirsi che Amcha non compaia nemmeno fra le quote sotto
soglia: MAPPARE UNA LISTA NON RIANALIZZA L'ARCHIVIO.** La riga Lazar del 20 agosto è in
archivio e porta quattro quote sotto soglia, ma non quella di Amcha: è stata analizzata
prima che la mappatura esistesse, e `unisci()` scarta le rilevazioni `simile()` a una già
presente invece di riscriverle. È il comportamento voluto — l'archivio è un deposito, non
una vista ricalcolabile — ma vuol dire che **la mappatura vale per le righe analizzate da
lì in avanti**, e le vecchie restano nella forma che avevano. Il giorno in cui servisse il
contrario, la strada è reimportare, non aspettare.

#### Le tre cose imparate mappando, che dal codice non si deducono

Sono uscite dalla prova di regia e sono il suo prodotto più utile: nessuna delle tre si
trova leggendo il contratto o le funzioni.

**1 · Un posto dimenticato non lascia un buco: produce un colore.** `PAL_SCURO` non era fra
i sette posti del contratto, e la lista non è rimasta senza colore scuro — `schiarisci()`
gliene ha inventato uno che la regola non conosce, e il colore inventato passa in pagina
finché qualcuno non misura il contrasto. L'hanno colto `regola.js` e, di conseguenza, due
asserzioni di `opacita.js` a **2,69** contro un pavimento di 3. La forma generale: davanti
a un dato mancante questo codice quasi sempre **ripiega**, e un ripiego silenzioso è
peggio di un errore perché sembra funzionare.

**2 · La scala di ripiego del colore ripinge le liste già assegnate, e `PAL_SCURO` è
indicizzato sull'esadecimale CHIARO.** Abbassare `dentro_dic` di un blocco non aggiunge uno
slot in coda: risolve daccapo l'assegnazione dell'intero blocco. `unity_erdan` è passata da
`#683E00` a `#6D3B00` e `israel_first` da `#625000` a `#674F00` — e siccome la chiave di
`PAL_SCURO` è il colore chiaro, muovere un colore **ne rompe la chiave** e la lista perde
il tema scuro in silenzio. «In coda: le assegnate non si spostano» vale per
`COLORE.ORDINE`, **non** per i vincoli, e il contratto diceva solo la prima metà.

**3 · Davanti a una grafia si guarda la COLONNA in cui compare, non le occorrenze della
parola nella pagina.** Avevo escluso «Winter» da `W_LISTA` con una ragione buona — nella
tabella degli scenari è l'etichetta di un aggregato, «Winter parties and Reservists-B&W»,
e una grafia mappata male conta voti per la lista sbagliata in silenzio mentre una che
manca ferma il job rumorosamente. Il ragionamento sul rischio asimmetrico regge; il fatto
su cui poggiava era falso: **«Winter party», al singolare, compare come colonna in una
tabella di SEGGI**. Avevo cercato la parola nel markup, visto il plurale, e concluso
sull'insieme invece che sulla stringa esatta.

### DUE IMMAGINI DELLA STESSA PAGINA CON NUMERI DIVERSI — CHIUSA il 28 agosto 2026

**Era la cosa peggiore che un modello previsionale possa fare**, ed era **due difetti
diversi con lo stesso sintomo**, scoperti a ventiquattr'ore di distanza. Vale la pena
tenerli distinti, perché il primo era nel nostro codice e il secondo non lo è — e la
conclusione del secondo è **l'opposto** di quella che questo file dava per scontata.

**Primo: l'immagine era vecchia davvero, e nessuno la generava.** `og:image` era dichiarata
dal 24 agosto e il passo che la produce **non esisteva**: `anteprima.mjs` era scritto,
provato, con le sue guardie, e non lo chiamava nessuno. Poi il passo è stato aggiunto e
**andava verde senza fare niente**, perché la guardia del punto d'ingresso componeva
`'file:///'` a mano e funzionava solo su Windows. Chiuso con `pathToFileURL` — vedi «Far
riconoscere all'anteprima il proprio punto d'ingresso anche fuori da Windows». Questa metà
era la **causa 1** delle due che il testo di ieri elencava.

**Secondo, ed è la metà che decide: quando il file era finalmente giusto, WhatsApp mostrava
i numeri del 28 e Telegram quelli del 24.** Stesso indirizzo, stesso file, due piattaforme
che dicono cose diverse — quindi il PNG pubblicato è corretto e **il rimedio non è nel
codice**.

#### L'IMPRONTA NELL'INDIRIZZO NON SERVE, e la ragione è quella misura

Il testo di ieri diceva: *«se è la 2, la via è un'impronta nell'indirizzo»*. **È sbagliato**,
e si vede proprio dal caso che avrebbe dovuto confermarlo.

Telegram aveva in cache **la scheda intera** — titolo, descrizione e immagine — e WhatsApp
no. Il file era **lo stesso per tutti e due**. Quindi il problema non è *quale indirizzo ha
l'immagine*: è **quando l'aggregatore rilegge la pagina**. E un aggregatore che non rilegge
la pagina **non vede nemmeno un `og:image` nuovo**, perché quell'indirizzo sta dentro la
pagina che non ha riletto. L'impronta risolverebbe un problema di secondo ordine — la pagina
riletta e l'immagine no — al prezzo di **riaprire l'eccezione più stretta del progetto**, la
regione fra i marcatori «META DELLO STATO», che oggi ammette solo `og:title`.

**E `og:title` lo conferma**: se la scheda è in cache, il titolo lo è con lei. Una scheda
vecchia non è un'immagine vecchia sotto una frase fresca — è **tutto vecchio insieme**, che
è esattamente ciò che ci si aspetta da una cache di scheda e non da una cache di immagine.

#### La condizione per riaprirla, riscritta perché quella di prima si è verificata e dice il contrario

Nel commit del 27 agosto era scritto: *«se ne riparla se si vede una scheda vecchia dopo
qualche notte di job che rigenera davvero»*. **Quella condizione si è verificata il giorno
dopo, la scheda vecchia c'era — e la causa non era quella che l'impronta risolve.** Lasciata
com'era, porterebbe a riaprire la regione dei marcatori per niente, che è il costo più alto
del progetto pagato per il problema sbagliato.

**La condizione giusta è un'altra, ed è più stretta**: si riapre **solo** se si osserva un
aggregatore che ha **riletto la pagina** — titolo o descrizione nuovi — **e continua a
servire l'immagine vecchia**. Quello è il solo caso che un'impronta chiude. Finché titolo e
immagine invecchiano *insieme*, la cache è della scheda e l'indirizzo dell'immagine non
c'entra.

#### La riga che vale per tutte e quattro le piattaforme

**Un messaggio già inviato tiene la sua anteprima per sempre.** Svuotare la cache agisce solo
sulle condivisioni **successive**: la conversazione in cui il difetto è comparso resta com'è,
e nessun intervento su questo repository la cambierà mai. Chi verifica una riparazione deve
mandare il link **in una chat nuova**, o misura il passato.

#### Lo strumento pubblico ce l'ha solo Telegram

`@WebpageBot`, verificato il 28 agosto 2026 ed è ancora quello: `/start` la prima volta, poi
si incolla l'indirizzo, **fino a dieci per volta**. Forza i crawler di Telegram a rileggere
le meta. Le altre tre non offrono niente di equivalente a chiunque.

### Nell'ordine, quando si riprende

**PRIMA DI TUTTO, E SONO TRE VOCI PRONTE: «Il lavoro notturno non è puntuale, e chi se ne
accorge non può stare dentro il job».** Scritte il 28 agosto 2026, la mattina in cui il job
non è partito affatto — dopo lo slittamento di undici ore del 27. Nessuna delle tre è
applicata, e tutte e tre hanno già dentro quello che serve per eseguirle senza rifare il
ragionamento: il cron a più tentativi in una finestra con la guardia su `stato-job.json`; il
motivo per cui un workflow separato NON è la via; e la Cloud Routine usata come guardia e
mai come scheduler. Vanno prima perché riguardano la sola cosa che pubblica da sola tutti i
giorni, e perché stamattina il difetto è stato trovato da una persona che si è accorta del
silenzio — che è esattamente il controllo che non si può programmare.


**Prima di tutto la voce già scritta in coda a questo file: «Winter party» è mappata, ma
va guardato se la fonte usa anche `'winter'` nudo come intestazione di colonna di una
tabella di seggi.** È la domanda a cui non avevo risposto.

**E una revisione visiva in sospeso, dal 27 agosto 2026, che è dell'autore.** Due cose
sono cambiate a schermo e nessun occhio le ha ancora viste — i numeri tornano, ma è
layout, e in questo progetto il layout lo dice solo un browser:

- **i totali dell'emiciclo sono scesi di 24 unità**, da y 180/197 a **y 204/221**, il corpo
  è **28 in tutte le configurazioni** — costante, non più 29 o 31 a seconda di dove capitano
  i seggi — e la sigla è scesa da 8,5 a **7,5**, che a 380 rende **5,69px** contro un
  pavimento di 5: è il testo più piccolo della pagina, con 0,69px di margine. Da guardare nei
  due temi e alle due larghezze, e la sigla è la cosa da guardare per prima;
- **il vuoto fra i gruppi** è passato da tre posti a uno: con tre blocchi non cambia un
  pixel, con quattro i salti passano da 1/2/2 a 1/1/1;
- **i glifi**: nove marchi vengono ora dai file di Simple Icons. Guardati rasterizzati a
  20px dentro il cerchio da 44 e affiancati agli altri, ma non ancora **in pagina**;
- **la colonna di condivisione sopra i 1380** ha sette cerchi e il gruppo gemello in fondo
  non c'è più. Misurato: a 1440 colonna `flex` e gruppo `none`, a 1265 il contrario,
  sforamento orizzontale zero.

Poi, in quest'ordine:

1. **L'anteprima e la card che dicono numeri diversi**, segnalata a fine giornata e **non
   ancora diagnosticata**: vedi la sezione qui sopra. Va per prima perché è l'unica cosa
   che il lettore vede SBAGLIATA — due immagini della stessa pagina con numeri diversi
   nella stessa conversazione — e perché il primo controllo che separa le due cause costa
   dieci secondi.
2. **Il parser e le due convenzioni**, che è la sola voce con un difetto VIVO nel codice: una riga
   valida può finire fra le scartate, e due colonne falliscono in silenzio. La diagnosi è
   chiusa e sta qui sopra — «Il parser e le due convenzioni» — con la misura, la semantica di
   `(N)` letta dalla riga vera, e la ragione per cui N **non** va usato. Resta da scrivere:
   leggere `(N)` come «sotto soglia, zero seggi», e decidere che cosa fare delle due colonne
   mute. Va prima delle card, perché è l'unica voce della coda che perde dati.
3. **Le card social.** La proposta è chiusa e misurata — quattro formati, la regola sola
   («si riempie lo spazio che avanza con i pezzi che esistono già»), `targaPNG()` che
   prende l'altezza come parametro, il quinto consumatore di `fraseCorta()` — e il codice
   non è scritto. Vedi «Le card e la condivisione: una targa sola, e il comando che non
   c'è», che porta le tele e gli inchiostri resi.
4. **I 44px dei bersagli, con `scroll-margin-top` RICALCOLATO NELLO STESSO COMMIT.** Oggi i
   bersagli sotto i 44 sono 76 su 99 e il pezzo grosso è l'house effect, 20px di altezza,
   il 37% del costo. L'accoppiamento non si riscopre rompendolo: alzare le sole voci
   dell'indice porta `.idx.on` da 97,4 a 113,4, cioè **oltre i 112** dello
   `scroll-margin-top` sotto i 660, e la fascia coprirebbe la sezione appena raggiunta da
   un'ancora. I due numeri sono di sotto i 660 e vanno rimisurati lì: a desktop sono 78,5 e
   92, e confrontarli è l'errore che ho già fatto il 25 agosto.
5. **La prova di regia del 16 ottobre**, sul modello di quella appena fatta per le liste —
   che è il punto: **non si simula, si esegue.** Quel giorno il comando degli accordi
   sparisce, la riga di esito cambia ramo e gli annunciati mai depositati smettono di
   contare. Con l'orologio congelato al 15, al 16 e al 17 si guarda che le tre schermate
   dicano tre cose coerenti e che il calendario dica «oggi» il 16 e «passato» il 17. Le
   prove lo verificano; nessuno l'ha ancora **guardato**. La mappatura di Amcha è costata
   venticinque minuti e ha trovato due posti che il contratto non aveva: qui il contratto è
   `docs/aggiungere-un-apparentamento.md`, e non è mai stato percorso.
5-bis. **LO SCENARIO DELLA SOGLIA, e non è più ipotetico.** Misurato il 28 agosto 2026
   sull'archivio di quella mattina, 163 rilevazioni valide. È il complemento di
   `riparto.js`: quella prova **il meccanismo**, questo lo **mostra al lettore**. Va prima
   della verifica a scenari perché la configurazione che Channel 12 descriveva — una che
   cade mentre un'altra entra — fino al 27 agosto era un caso di prova e dal 28 è la
   proiezione pubblicata.

   **PRIMA CORREZIONE, E CAMBIA LO SCENARIO: le due liste NON stanno nello stesso blocco.**
   Verrebbe da dire «due liste del blocco Netanyahu vicine alla soglia», ed è falso da
   quando `PAR.inbilico` nasce **spenta**: con il conteggio della fonte, Popolo d'Israele è
   **ago della bilancia**, non coalizione. Lo diventa solo se il lettore accende la leva.
   Ed è la ragione per cui lo scenario è interessante invece che aritmetico.

   | lista | quota | distanza dal 3,25% | seggi oggi | blocco (leva spenta) |
   |---|---|---|---|---|
   | **Sionismo Religioso** | 3,568 | **+0,318** | 4 | coalizione |
   | **Popolo d'Israele** | 3,782 | **+0,532** | 5 | **ago della bilancia** |
   | *Casa Sionista, per confronto* | 2,413 | −0,837 | 0 | ago della bilancia |

   Sono le due più vicine alla soglia **da sopra**, e mezzo punto è meno dell'errore che il
   modello dichiara. Casa Sionista sta nella riga per la ragione opposta: è la prima che
   potrebbe **entrare**, e uno scenario che guarda solo chi esce ne racconta metà.

   ### I quattro casi, con la leva SPENTA (il difetto)

   | | coal. | oppos. | arabi | ago | maggioranza |
   |---|---|---|---|---|---|
   | entrambe dentro *(oggi)* | 48 | 55 | 12 | 5 | opposizione + arabi |
   | solo Popolo d'Israele | 46 | 57 | 12 | 5 | opposizione + arabi |
   | solo Sionismo Religioso | **51** | 57 | 12 | 0 | opposizione + arabi |
   | nessuna delle due | 48 | **60** | 12 | 0 | opposizione + arabi |

   **In tutti e quattro i casi la maggioranza è la stessa, e questa è la prima cosa che il
   riquadro deve dire.** Nessuno arriva a 61 da solo: la coalizione tocca al massimo 51, e
   l'opposizione ha bisogno degli arabi in tutte e quattro. Lo scenario **non cambia chi può
   governare, cambia il margine** — e scriverlo come se ribaltasse il risultato sarebbe la
   cosa disonesta più facile da fare con questi numeri.

   ### Dove vanno i seggi che si liberano — è qui la notizia

   | chi cade | seggi | restano nel campo | **attraversano** |
   |---|---|---|---|
   | Sionismo Religioso (4) | Shas +1, UTJ +1 | **2** | B'Yachad +1, Yashar +1 → **2** |
   | Popolo d'Israele (5) | — *(non è in un campo)* | **0** | Likud +1, Shas +1, UTJ +1, B'Yachad +1, Yashar +1 → **5** |
   | tutte e due (9) | | | Likud +2, Shas +1, UTJ +1 → coal. **+4**; B'Yachad +1, Beitenu +1, Yashar +3 → oppos. **+5** |

   **E LA PAGINA OGGI AFFERMA IL CONTRARIO.** `#k-soglianota` scrive già, in prosa: *«Ogni
   lista che non supera la soglia disperde i propri voti e li consegna di fatto ai partiti
   più grandi dello stesso campo»*. Misurato, è falso in tutti e due i casi: **metà** dei
   seggi del Sionismo Religioso finisce all'opposizione, e **tutti e cinque** quelli di
   Popolo d'Israele entrano in un campo da fuori. La frase è vera del 2022, che infatti cita,
   e non della proiezione di oggi. **Va riscritta nello stesso intervento**, o il riquadro
   nuovo contraddice il paragrafo che gli sta accanto.

   ### E LA DIREZIONE SI ROVESCIA CON LA LEVA, che è il fatto più difficile da raccontare

   | | coal. | oppos. | arabi | ago |
   |---|---|---|---|---|
   | entrambe dentro *(oggi)* | **53** | 55 | 12 | 0 |
   | solo Popolo d'Israele | 51 | 57 | 12 | 0 |
   | solo Sionismo Religioso | 51 | 57 | 12 | 0 |
   | nessuna delle due | 48 | 60 | 12 | 0 |

   Con la leva **spenta**, se Popolo d'Israele cade la coalizione va **48 → 51: guadagna
   tre seggi**. Con la leva **accesa**, la stessa caduta la porta **53 → 51: ne perde due**.
   *Lo stesso evento muove la coalizione nelle due direzioni opposte a seconda della lettura*,
   e non è un difetto: a leva spenta quei cinque seggi non erano suoi e ne recupera tre
   dalla dispersione, a leva accesa li contava già e ne perde due. **Il riquadro deve dire
   quale delle due letture sta mostrando**, o pubblica un numero con il segno sbagliato per
   metà dei lettori. È la stessa regola di «Quello che esce dalla pagina deve portare
   l'ipotesi con sé», applicata a un riquadro invece che a una condivisione.

   ### Il mediano del quarto blocco: costa il 5,5%, ed è già mezzo calcolato

   Oggi si può scrivere «sta fra X e Y in 8 simulazioni su 10» per **due blocchi su
   quattro**: `montecarlo()` conserva `res.coal` e `res.oppz` e basta — misurato, coal **49
   [42–55]**, oppz **56 [50–62]**.

   **Il totale arabo è GIÀ calcolato a ogni simulazione**: `ba` esiste e serve alla riga
   `if(bo+ba>=61)res.vA++`, semplicemente non viene conservato. E il quarto blocco non va
   calcolato affatto — è `120 − bc − bo − ba`, cioè **zero lavoro nel ciclo caldo**, perché
   l'invariante 1 garantisce la somma.

   | | misurato il 28 agosto 2026 |
   |---|---|
   | `montecarlo()` così com'è | **110 ms** (SIM = 20.000, 15 liste) |
   | due copie e due ordinamenti in più | **+6 ms, il +5,5%** |
   | memoria transitoria | 2 × `Int32Array(20000)` = **156 KB** |

   Serve **anche quella degli arabi**, e non è un di più: senza, la frase «opposizione +
   arabi» — che è la maggioranza in tutti e quattro i casi — resta l'unica affermazione della
   pagina di cui non si può dare la forbice. Due blocchi su quattro con la banda e due senza
   è esattamente l'asimmetria che l'emiciclo ha appena finito di chiudere.

   ### Dove va: NON una dodicesima sezione

   **`#k-soglianota`, in coda a `rProj()`, sezione 2 «Proiezione per lista».** È già il posto
   dove la pagina parla della soglia, e ci arriva con **la metà del lavoro già fatta**:
   `MC.sotto[i]/MC.n` è pubblicato lì — «Sul filo del 3,25% ci sono … (N% di probabilità di
   restare fuori)» — cioè la pagina dice già **quanto è probabile** e non dice **che cosa
   succede se capita**. Il riquadro è la seconda metà di una frase che c'è già.

   Le tre alternative, scartate con la ragione:

   - **il simulatore** compone coalizioni a partire dai seggi **dati**: risponde a «chi
     governa con chi», non a «e se i seggi fossero altri». Sono due controfattuali di
     natura diversa, e metterli nello stesso comando li farebbe leggere come uno solo;
   - **la nota metodologica** spiega il **meccanismo** della soglia, sta in fondo dentro un
     `<details>` chiuso, ed è prosa generata: un numero vivo lì dentro è la strada doppia che
     diverge al primo ritocco;
   - **le pastiglie** danno le probabilità dei quattro esiti di governo, non quelle di lista.

   E soprattutto **non una sezione nuova**: sarebbe la dodicesima, con un indice che sotto i
   660 è già largo 1891px in una finestra da 358.

6. **La verifica a scenari**, le sei tabelle in fondo a questo file. Ha due righe nuove
   dalla prova di regia: la lista mappata che non ha ancora seggi, e la caduta sotto soglia
   mentre un'altra entra.
7. **L'agente del mattino.** Viene ultimo perché ogni cosa sopra è una procedura che gli si
   può delegare o un difetto che gli farebbe sbagliare più in fretta. Il terreno è pronto —
   `dati/da-fare.json` con il conto in testa, i tre contratti in `docs/` coi passi di
   giudizio marcati, le convalide, e il confine scritto in questo file — e adesso c'è anche
   la misura di quanto costa un giro: **venticinque minuti e quattro asserzioni cadute**,
   con due posti mancanti trovati dal banco e non dall'attenzione.

### Lo stato al 24 agosto 2026

Scritto per ripartire senza la conversazione. Ultimo commit spinto: **`02e4247`**, CI e
Pages verdi. Sul banco di oggi le prove sono **2090**, e le suite nuove degli ultimi due
giorni sono cinque: `meta.js`, `tabella.js`, `embed.js`, `png.js` e `griglie.js`.

**Non ancora committati**: l'esportazione PNG dei quattro disegni e il calendario in flex.
Vedi le due sezioni omonime.

### Lo stato al 23 agosto 2026, sera

**E l'ordine di marcia è cambiato**: la coda è stata riscritta per pubblicare prima, e la
revisione visiva è uscita dalla coda perché è fatta. Vedi «Nell'ordine, quando si
riprende».

**Che cosa è entrato nella seconda metà della giornata.** Le **meta testuali** —
`description` fissa, `og:description`, `og:url`, `og:type`, `og:locale`, `twitter:card` e il
`canonical` — e **og:title generato dal lavoro notturno** dalla stessa funzione dell'h1,
perché un aggregatore legge il file servito e non esegue niente. Con quello, **la regola
«il job tocca solo dati/» è stata riscritta**: adesso può riscrivere una regione delimitata
di `index.html`, e il segnale d'allarme che quella regola era è diventato una prova che
legge il diff. E la **tabella dei sondaggi raggruppata per blocco**, con `colonneBlocco()`
chiamata anche dall'house effect — che era in ordine di blocco per fortuna, e adesso lo è
per costruzione.

**Che cosa è entrato oggi**, in cinque commit. Gli **apparentamenti** con il loro termine —
il **16 ottobre**, non l'8 settembre, e per tre commit il file diceva il contrario — e il
comando che dice quanti accordi applica e in che stato. Il **confronto a parametri
identici**, che con la leva accesa non lo era. Il **conto delle categorie** nel messaggio
dell'aggiornamento, che davanti al lettore faceva 42 su 33 dichiarate. Le **convalide**
della tabella degli accordi e le prove che non cadono più quando la tabella cresce.
`dati/da-fare.json`, il riepilogo notturno. **`nmA()` che pretende la preposizione.** E il
**confine dell'agente**, che è la cosa che non si deduce da nessun codice.

#### Le cinque cose decise oggi che il codice non dice

Stanno tutte nelle loro sezioni; qui ci sono perché chi riapre il progetto le deve trovare
prima di toccare qualcosa.

**1 · Il confine dell'agente** — sezione «Il confine dell'agente». L'agente **prepara e una
persona conferma** per tutto ciò che sposta un numero: accordi e mappature di lista si
fermano al diff; il **testo** di una voce-evento lo può applicare; la **data** di una voce
no. La terza riga è quella che non si deduce: sembra che gli eventi non spostino numeri, e
il testo infatti non ne sposta, ma **la data colloca il marcatore sull'asse della tendenza
e decide la terna dei trenta giorni** del riquadro isolato — «nei 30 giorni successivi:
Netanyahu 51, opposizione 47, arabi 11». Un giorno di differenza cambia tre numeri
pubblicati.

**2 · Davanti a un rosso, un agente non modifica mai una prova.** Se `npm run verifica`
fallisce dopo una sua modifica, si ferma e chiede — **anche quando il rosso è legittimo**.
Far tornare verde un'attesa costa dieci secondi e cancella l'unica misura che il progetto
ha di sé stesso. Che un'attesa sia diventata obsoleta è una decisione, non una riparazione.

**3 · La trappola dell'orologio nelle fixture.** Da metà di `test/suite/apparentamenti.js`
in poi **l'orologio è congelato alla vigilia del 16 ottobre**: lì `giorniFa(3)` non è
agosto, è il **12 ottobre**. Una fixture datata «tre giorni fa» dentro una suite congelata
**non fallisce: misura un'altra cosa**. Le date delle fixture si scelgono rispetto a quello
che la prova interroga, non rispetto a oggi. È scritto in tutti e tre i contratti di
`docs/` perché un agente ne legge uno solo.

**4 · Due domande aperte su chi è il primo partito.** `MC.primo` esiste, è un campo di
`MC`, e oggi lo usa **solo** `k-verdetto`; il titolo lo potrebbe leggere senza nessun
lavoro, perché `datiTitolo(fo,mc)` riceve già `mc`.
  · **Se sia una forma del titolo a sé o una frase dentro le forme esistenti.** Il dato per
  decidere: su ~55 giorni d'archivio la gara è **stretta in 26 (47%)** — il primo sotto il
  65% delle simulazioni — mentre le due letture **discordano solo nel 7%** (4 giorni,
  l'ultimo il 19 agosto). Quindi la notizia frequente non è «la proiezione dice il
  contrario», è «il primo partito è un lancio di moneta su un seggio di margine».
  · **Se le due letture possano contraddirsi a schermo.** `k-verdetto` confronta le
  simulazioni con la proiezione; `k-analisi` confronta la **mediana grezza a sette giorni**
  con la proiezione e ha già la frase «La proiezione del modello ribalta tuttavia
  l'ordine». Sono due domande diverse su chi è primo, in due riquadri vicini, e nessuno ha
  verificato che non possano dire il contrario l'una dell'altra nello stesso schermo.

**5-bis · Il JavaScript non si scrive dentro il YAML.** Due frammenti multiriga dentro un
blocco `run: |` hanno reso `.github/workflows/aggiorna.yml` **illeggibile a GitHub**:
esecuzione fallita in **zero secondi**, nome del workflow non riconosciuto, e il lavoro
notturno non sarebbe partito — cioè sarebbe morto anche il riepilogo che avrebbe dovuto
dirlo. Adesso il codice sta in `.github/scripts/riepilogo.mjs` e **`struttura.mjs` carica i
workflow con un parser YAML**: quel file lo scrive una persona a mano e nessuna prova lo
leggeva. Costa una `devDependency` — `js-yaml` — e vale, perché quel file pubblica ogni
notte.

**5 · Il caso V4 è vivo oggi.** Il riquadro della direzione mostra **seggi fermi** e
l'opposizione che passa dal **16% al 21%**, +5,1 punti. Il ramo che lo riconosce c'è —
classe `psmossa` e gli attributi con blocco e numeri — la frase no: si scrive lì.

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
- **`npm run spazzola` dopo ogni modifica a un'àncora temporale**, ed è nel lavoro notturno
  dopo il push. Trova la famiglia di difetti che nessun'altra cosa trova: una prova che
  darà per scontato un archivio fresco il 23 ottobre, cioè quando la pagina conta di più.
- **Il YAML dei workflow è provato**: `struttura.mjs` lo carica. Non scrivere JavaScript
  multiriga dentro `run: |` — l'ha già reso invalido una volta, e un workflow invalido
  fallisce in zero secondi portandosi via anche il canale che avvisa.
- **E la trappola che non è del banco ma delle fixture**: da metà di `apparentamenti.js`
  l'orologio è congelato alla vigilia del **16 ottobre**, quindi lì `giorniFa(3)` è il 12
  ottobre. Una data di fixture si sceglie rispetto a quello che la prova interroga.

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
- **le due frasi del deposito** hanno il ramo condizionale su `depositoPassato()`;
- **gli accordi di eccedenza**: il termine del 16 ottobre ricavato da `VOTO`, il comando che
  dice quanti ne applica e in che stato, la riga di esito coi depositati e l'effetto in
  blocchi, lo stato `ritirato`, e le **convalide** che fermano una riga sbagliata e
  rendono rosso il banco;
- **il confronto della direzione a parametri identici**, con la firma che lega la frase alla
  proprietà, e `notaSerie()` che dichiara quando la fine della linea e la testata divergono;
- **il messaggio dell'aggiornamento** con il conto che torna e l'elisione, tirato fuori dal
  gestore in `msgAggiorna()`;
- **`dati/da-fare.json`** e la issue unica del mattino, con la regola del silenzio;
- **`nmA()`** che pretende la preposizione, con il controllo strutturale che cerca la classe.

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
- **Restano senza prosa**: verdetto, pastiglie, istogrammi, simulatore. La struttura per
  scriverli — condizione, grandezze disponibili, che cosa la frase deve dire — è in
  [docs/testi-quattro-blocchi.md](docs/testi-quattro-blocchi.md), scritta il 23 agosto
  2026. Nel **verdetto** la frase deve dire **da quando** si confronta (`PREC.taglio` e
  `PREC.data` sono due campi distinti); negli **istogrammi** «quanti seggi mancano» si dice
  da `61 − q(MC.coal, .50)`, la mediana, **non** da `blocchi(SEG)`.

  **La cosa che veniva prima dei testi è chiusa**: il riquadro della direzione confrontava
  due esecuzioni con parametri diversi appena la leva degli apparentamenti era accesa, e
  adesso `PREC` gira con i parametri di adesso. Vedi «A parametri identici era falso per
  una leva su sei» qui sopra. Quello che resta per chi scrive: a leva accesa il riquadro
  dice **−1 al blocco Netanyahu e +1 all'opposizione**, ed è vero — la settimana ha
  spostato il seggio dell'accordo da un blocco all'altro.

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

**I due numeri sono di SOTTO I 660, e vanno letti così.** Il 25 agosto 2026 li ho
«corretti» misurando la pagina a 1440 e trovando 78,5 e 92: erano misure di un altro
stato, non una deriva. Le regole sono due, e ci sono tutte e due nel foglio — desktop
`section{scroll-margin-top:92px}` con `.idx` alta **78,5**, e dentro `@media(max-width:660px)`
`scroll-margin-top:112px` con `.idx` alta **46,3** e `.idx.on` **97,4**. Rimisurati a 380 lo
stesso giorno: **46,3 e 112 esatti**. Nessun commit ha toccato l'accoppiamento in silenzio.
Chi rimisura lo faccia alla larghezza a cui il numero appartiene.

**I 44px dei bersagli e `scroll-margin-top:112px` sono legati.** Portare tutti i bersagli
a 44px costa **520px** sull'intero documento, cioè il **3,19%** — ma alzare le sole voci
dell'indice costa 16px sul nastro, che portano `.idx` da 46,3 a 62,3 e **`.idx.on` da 97,4
a 113,4: oltre i 112 dello `scroll-margin-top`**, cioè la fascia coprirebbe di 1,4px la
sezione appena raggiunta da un'ancora. È esattamente il difetto chiuso togliendo la barra
di scorrimento. **I due vanno mossi nello stesso commit, con la costante ricalcolata.**

Il pezzo grosso è uno solo: i pulsanti «Escludi» dell'house effect, **20px** di altezza,
il 37% del costo totale. Oggi i bersagli sotto i 44 sono **76 su 99**.

### La coda del 23 agosto, superata — la traccia di che cosa era già stato chiuso

**L'ordine di marcia vero è quello del 26 agosto, più in alto.** Questa sezione resta
perché dice che cosa è stato fatto e in che ordine, con le ragioni: le prime quattro voci
sono chiuse e portano ciascuna la misura che le ha decise. Chi riprende legge quella
sopra; chi vuole sapere perché una cosa è come è, legge questa.

**Riscritta il 23 agosto 2026, e l'ordine è cambiato per una ragione sola: pubblicare
prima.** Le prime quattro voci sono quello che serve perché la pagina si possa mandare in
giro — un titolo e una descrizione che reggano in una scheda di condivisione, la tabella
dei sondaggi leggibile su un telefono, l'embed, il PNG. Tutto il resto viene dopo la
pubblicazione, e non perché conti meno: perché non la blocca.

**La revisione visiva è uscita dalla coda: è fatta.** La lista di controllo resta più
sotto come traccia di che cosa è stato guardato e a quali larghezze, ma non è più una cosa
da fare.

#### Prima della pubblicazione

1. ~~**`description` e `og:title` — le meta testuali**~~ — **FATTO il 23 agosto 2026.**
   Vedi «Le meta testuali» qui sotto. Restano fuori l'immagine e le meta che ne dipendono:
   quelle sono la voce 4 del dopo.
2. **La tabella dei sondaggi** (`#k-tab`, sezione 11), in due metà.
   · **Desktop: FATTO il 23 agosto 2026** — le colonne raggruppate per blocco, con i
     filetti a due tinte dell'house effect e i confini dettati dall'anagrafica. Vedi «La
     tabella dei sondaggi: l'ordine è dei blocchi».
   · **Sotto i 660: FATTO il 23 agosto 2026** — la forma A col limite a 50. Vedi
     «L'archivio sotto i 660: l'elenco che si apre, e la forma scartata». La sezione passa
     da 774,4px a 2.567,4, ed è il prezzo accettato: due troncamenti in fila sono peggio di
     una sezione lunga. Quello che segue è la premessa da cui si è partiti, e resta perché
     i suoi numeri servono a leggere la scelta.
   · Oggi la tabella era larga 1288,9px in un contenitore da
     326 dentro `.scroll`: si vede il 25%, e per leggere una riga bisogna trascinare avanti
     e indietro. Servono le stesse funzioni del desktop — ricerca, filtro per istituto,
     filtro per periodo, i seggi lista per lista — in una forma pensata per il telefono, e
     non nella stessa forma compressa. La premessa da abbandonare è che debba restare una
     tabella: a 326px una griglia da ventidue colonne non ci sta. Le tre proposte sono in
     [docs/tabella-sondaggi-mobile.md](docs/tabella-sondaggi-mobile.md), ciascuna con le sei
     risposte — come si scorrono 173 righe, dove stanno i seggi e come si confrontano due
     sondaggi, dove stanno ricerca e filtri e quanto costano prima del primo dato, come si
     opera da tastiera, quanto pesa in altezza contro i 774px di oggi, e che cosa si perde.
3. ~~**Modalità `?embed=1`**~~ — **FATTA il 23 agosto 2026.** Le nove decisioni che la
   definiscono, e le misure da cui vengono, stanno in «Le nove risposte dell'embed». Quello
   che resta è guardarla resa dentro un ospite vero: la riga 6 della verifica a scenari.
4. ~~**Esportazione PNG dei quattro disegni**~~ — **FATTA il 24 agosto 2026.** Vedi
   «L'esportazione PNG: la geometria è una scelta del codice, il carattere no». Le decisioni
   del punto 7 erano ancora buone; la geometria no, ed è stata rifatta. Le card per i social
   sono la voce 8 del dopo, e usano la stessa macchina.

#### Dopo la pubblicazione

5. **Le due prove di regia**, che sono prove generali e non si improvvisano la sera stessa.
   · **L'8 settembre**, il deposito delle liste: è il giorno in cui quasi tutto quello che
     è annotato qui viene esercitato insieme. Liste nuove, fusioni e scissioni tutte
     insieme, il parser che apre una issue con le colonne da mappare, `COLORE.capienza()` e
     la scala di ripiego per l'ago della bilancia (che in tema chiaro ha **zero slot
     liberi**), la soglia delle schede dell'house effect che sale a ~1190 con quindici
     colonne, i veti che cambiano sotto, `PRESET.netanyahu` che si aggiorna da sé, `dentro`
     per le componenti nuove, e le 24 righe di gennaio-aprile che aspettano una mappatura a
     mano. **E adesso anche i filetti della tabella dei sondaggi**, che si spostano da soli
     se l'anagrafica è giusta e non si spostano affatto se non lo è.
   · **Il 16 ottobre**, il termine degli accordi di eccedenza: quel giorno il comando
     sparisce, la riga di esito cambia ramo e gli annunciati mai depositati smettono di
     contare. Con l'orologio congelato al 15, al 16 e al 17 si guarda che le tre schermate
     dicano tre cose coerenti, e che il calendario dica «oggi» il 16 e «passato» il 17. Le
     prove lo verificano; nessuno l'ha ancora **guardato**.
6. **La verifica a scenari** (le sei tabelle in fondo a questo file). *Era elencata due
   volte, come «scenari» e come «verifica a scenari»: l'autore ha confermato il 23 agosto
   2026 che sono la stessa cosa, e la voce doppia è stata tolta.*
7. **Le meta Open Graph con l'immagine generata dal job.** Le meta testuali ci sono già; qui
   c'è la parte che costa. Serve un rasterizzatore in CI — il job gira su Node, non in un
   browser — e i pezzi sono quelli dell'esportazione PNG: serializzare l'SVG dell'emiciclo,
   iniettare `xmlns`, `width`, `height` e `font-family`, rasterizzare, committare il file.
   **Lo standard è 1200×630**, rapporto 1,9048; l'emiciclo ha viewBox `0 0 430 232`, cioè
   1,8534 — quasi identico, ma a piena altezza entra in **1168×630** e non resta niente per
   la targa. Con la targa, misurato: disegno largo **1000 → alto 540, restano 90**; **900 →
   486, restano 144**; **860 → 464, restano 166**. L'inchiostro vero è 386,7×217 dentro un viewBox da 430×232,
   con **21,6 unità vuote a sinistra e 21,7 a destra**: rimisurato il 24 agosto 2026, **è
   già centrato in orizzontale**, e la riga che stava qui diceva il contrario perché
   guardava un margine solo. In VERTICALE non lo è — 0,4 sopra e 14,6 sotto — ed è lì che
   serve la ricentratura. Misurato con la cornice: testata 96, piede 40, area del disegno
   1120×494, scala 2,276, inchiostro reso 880×494.
   **La decisione già presa: non la bandiera israeliana.** È l'immagine del paese, non del
   modello, e in un'anteprima si legge come una presa di posizione. L'emiciclo dice
   «proiezione parlamentare» e porta il numero che conta — dentro il suo viewBox ci sono già
   «MAGGIORANZA 61» e i tre totali di blocco.
   **E la strada per scriverla è già aperta**: dal 23 agosto il job ha il permesso di
   toccare `index.html` dentro i due marcatori, quindi `og:image` è una riga in più
   nell'elenco ammesso e non una regola da riscrivere daccapo. `twitter:card` passa a
   `summary_large_image` **nello stesso commit**: oggi è `summary` proprio perché
   l'immagine non c'è, e la prova lo dichiara.
8. **I 44px dei bersagli**, in un giro suo e con `scroll-margin-top` ricalcolato nello
   stesso commit. **I quattro comandi dell'esportazione PNG sono già a 44**, portati lì il
   24 agosto 2026 insieme alla riparazione della consegna: erano 71,9 × 12px, cioè il
   comando che stava fallendo, e non aveva senso ripararne il riscontro lasciandolo
   impossibile da centrare. Restano gli altri, e il pezzo grosso è sempre l'house effect: vedi «Un accoppiamento da non riscoprire rompendolo». Alzare le sole voci
   dell'indice porta `.idx.on` da 97,4 a 113,4, cioè **oltre i 112** dello
   `scroll-margin-top`: la fascia coprirebbe la sezione appena raggiunta da un'ancora.
9. **Un inventario delle funzionalità con i numeri veri**, per i post di lancio. **Non i
    post — quelli li scrive l'autore — ma il materiale**: cosa fa il modello e come, quante
    simulazioni Monte Carlo, quante rilevazioni in archivio e quante nella finestra, il
    banco di prova sulle tre elezioni con l'errore per istantanea, l'aggiornamento notturno
    e che cosa fanno le sue guardie, l'incorporabilità. Va compilato **alla fine**, quando i
    numeri sono quelli definitivi: un inventario scritto adesso invecchierebbe prima di
    essere usato.
10. **L'agente del mattino.** Il terreno è pronto: `dati/da-fare.json` con il conto in testa
    e il «che cosa serve per chiudere» voce per voce, i tre contratti in `docs/` coi passi
    di giudizio marcati, le convalide che fanno fallire forte una riga sbagliata, e **il
    confine** scritto in questo file. Quello che manca è l'agente. Viene ultimo perché ogni
    cosa sopra è una procedura che gli si può delegare o un difetto che gli farebbe
    sbagliare più in fretta.

#### Fuori dalla coda, ma da decidere

- ~~La definizione di «apparentamento» non c'è da nessuna parte in pagina~~ — **scritta
  dall'autore e applicata il 23 agosto 2026**, in testa alla voce «Apparentamenti
  annunciati» della guida dei comandi, che è la sorgente unica: la nota metodologica
  rimanda invece di ripetere, e una prova in due versi lega le due strade. Vedi «La
  definizione degli apparentamenti, e dove sta».
- ~~L'etichetta del pulsante degli accordi va a capo a 380~~ — **applicata il 23 agosto
  2026**: «Aggiungi / Togli N apparentamento/i», con `acc()` per il plurale. Le misure e le
  sei formulazioni scartate restano nella sezione, perché il numero che ha deciso — il
  plurale più corto del singolare — non si ritrova ragionandoci.

**DA FARE PER PRIMA COSA — «Winter party» va mappato come `amcha`.** Deciso dall'autore
il 26 agosto 2026 guardando il messaggio dell'aggiornamento, che dice: «in una tabella di
SEGGI compaiono colonne non riconosciute (Winter party)».

**Ed è la correzione di una mia decisione sbagliata, quindi va letta insieme al perché.**
Mappando Amcha Israel lo stesso giorno avevo mappato cinque grafie — `amcha israel`,
`amcha yisrael`, `amcha`, `party of ofer winter`, `people of israel` — e avevo escluso
«Winter» con questa ragione scritta nel commento: nella tabella degli scenari è
l'etichetta di un aggregato, «Winter parties and Reservists-B&W», e una grafia mappata
male conta voti per la lista sbagliata in silenzio mentre una che manca ferma il job
rumorosamente.

Il ragionamento sul rischio asimmetrico resta buono; **il fatto su cui poggiava era
falso**. «Winter party» — al singolare, con «party» attaccato — non è l'aggregato: compare
come colonna in una tabella di **seggi**, cioè è quella lista lì. Avevo guardato le
occorrenze della parola «Winter» nel markup e visto l'aggregato al plurale, e ho concluso
sull'insieme invece che sulla stringa esatta. **La cosa da non ripetere è quella**:
davanti a una grafia si guarda la colonna in cui compare, non le occorrenze della parola
nella pagina.

Quindi in `W_LISTA` va aggiunto `'winter party':'amcha'`, e prima di scriverlo si guarda
se la fonte usa anche `'winter'` nudo come **intestazione di colonna di una tabella di
seggi** — che è la domanda a cui non avevo risposto. Finché non è mappata, ogni notte in
cui quella colonna compare la guardia si chiude e l'archivio resta fermo.

**E le cose minori, quando capitano sotto mano:**

- **Cercare le altre strade doppie.** Ogni valore che raggiunge lo schermo per più di un
  percorso e non ha una prova che li leghi è il prossimo colore di blocco. In questo
  giro ne sono cadute due — la composizione del blocco Netanyahu (**quattro** copie, una
  nel parser notturno) e il calendario elettorale — e una si è rivelata **non** essere
  tale: la numerazione delle sezioni ha due meccanismi ma una sorgente sola.
- **LA CASELLA VUOTA TROVATA IL 23 AGOSTO 2026: nessuna sezione mostra la serie storica di
  una singola LISTA dai sondaggi grezzi.** Misurato: la sezione 9 disegna **tre serie, e
  sono BLOCCHI** — Blocco Netanyahu, Opposizione sionista, Partiti arabi — e i 519 puntini
  sono 173 rilevazioni × 3 blocchi, cioè anche i singoli sondaggi lì sono aggregati; nel
  grafico della tendenza non esiste nessuna lista, e la voce di legenda che si isola isola
  un blocco. Le sparkline di `k-proj` sono la forbice dell'80%, cinque elementi, non una
  serie; `k-movers` dà **due numeri** — 7 GG e 30 GG — e solo per le dieci liste che si
  sono mosse.
  **Il posto per riempirla è la legenda della sezione 9**, dando ai tre blocchi la
  possibilità di isolare una lista: NON l'archivio, che è la sezione in cui una rilevazione
  deve potersi vedere intera. È la ragione per cui la forma per lista è stata scartata
  dalla sezione 11, e la casella che quella forma aveva trovato resta buona lo stesso.
- **Il blocco reso visibile nel pannello dell'elenco dei sondaggi**, che oggi non lo è: il
  filetto `sep` non funziona in un elenco che va a capo. Le due vie sono misurate —
  intestazione per blocco a +68px per pannello (+40%), o bordo della pastiglia col token
  del blocco a costo zero ma colore su colore dove il valore è già colorato per lista.
  **Da valutare dopo la pubblicazione**, e la seconda va misurata su contrasto e dicromazia
  prima di essere proposta. Vedi «Il pannello dell'elenco».
- **Il campo `esito`** in archivio (punto 8-bis): senza, dopo il voto la pagina può
  parlare solo della propria stima, e l'ottava istantanea che sposterebbe il 2,7 non
  esiste.
- Minore, dal filtro dell'emiciclo: la via d'uscita al tocco.
- Dal parser Wikipedia: **24 righe di gennaio-aprile** con una cella unica che copre
  Ra'am, Hadash–Ta'al e Balad. Il parser le respinge dichiarandolo: vanno mappate a mano.
- Sempre dal parser: **le righe-evento arrivano in inglese** in una cronologia italiana.
- **L'altezza uniforme delle righe della tabella dell'analisi** non è provabile in jsdom:
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
**guardando la pagina**, non dalla suite. Le 1734 prove dicono che il modello non si è
rotto; non dicono che la pagina si veda. Dopo ogni push, aprire
<https://angrisanidj.github.io/modello-israele/> e guardarla nei due temi.

---

## Revisione visiva finale: la lista di controllo — FATTA

**La passata è stata fatta, e dal 23 agosto 2026 questa lista non è più una cosa da fare:
è la traccia di che cosa è stato guardato, a quali larghezze e in quale tema.** Resta qui
per due ragioni. La prima è che dice che cosa è già stato visto, e quindi che cosa NON va
riguardato quando si tocca qualcosa lì accanto. La seconda è che la sua ultima sezione —
quella su come si annota un difetto visivo — vale ogni volta che se ne trova uno, e i
difetti visivi si trovano ancora: sono la famiglia che nessuna delle 1734 prove vede.

Quello che entra in pagina DOPO questa passata non è coperto: l'embed e l'esportazione PNG
disegnano attorno ai grafici e vanno guardati quando ci saranno, e la forma nuova della
tabella dei sondaggi sotto i 660 va guardata per intera — è l'unica sezione che questa
lista dichiarava di non aver mai esaminato.

Scritta il 22 agosto 2026 per una passata sola, sezione per sezione. Serve a distinguere
**quello che qualcuno ha già guardato reso** da **quello che nessuno ha mai visto**: in due
giorni sono entrate parecchie cose che le prove dichiarano sane e che nessun occhio ha
ancora confermato. Le 1734 prove dicono che il modello non si è rotto; non dicono che la
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
| **una lista MAPPATA che non ha ancora seggi** — la finestra fra il deposito e il primo sondaggio che la nomina | è nell'anagrafica e in `PRESET`, non ha pastiglia, e «Blocco Netanyahu» riproduce lo stesso la selezione di apertura ristretta a chi ha seggi | la scorciatoia che non riproduce più l'apertura, o l'apertura che seleziona una lista senza pastiglia |
| **una del blocco cade sotto soglia MENTRE un'altra entra** — lo scenario di Channel 12 | i seggi fanno 120, la caduta resta fuori, il blocco perde seggi NETTI: entrare non compensa cadere | il blocco che torna dov'era, cioè la quota persa travasata dentro il campo |

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

### Rifatto il 24 agosto 2026, e due delle quattro misure erano cambiate

Il margine era sceso a **ottocento byte** — 178,2 su 179 — e la prima cosa applicata
l'avrebbe sfondato a metà lavoro. Rifatto col metodo di sempre, non alzato a occhio:

| | |
|---|---|
| il file compresso adesso | **178,2 KB** |
| **+ l'archivio da qui al voto** | **0,8 KB** — 64 giorni a 1,03 rilevazioni al giorno fanno 66, più le 8 dell'allineamento pendente di `BASE`, a **10 byte** di gzip ciascuna |
| **+ quello che resta da scrivere** | **35 KB** — embed compatto, card social, `og:image`, i 44px dei bersagli, il campo `esito`: cinque interventi a 7 KB, cioè la mediana misurata di **3,49** arrotondata al doppio, com'era stato fatto la volta scorsa (2,9 → 6) |
| **+ un commit grosso di riserva** | **8,4 KB**, il più pesante dei tredici misurati |
| | **= 222,4 → tetto a 223 KB**, arrotondato al KB superiore |

La crescita misurata per commit, sugli ultimi tredici: 0,74 · 1,25 · 2,45 · 2,49 · 2,81 ·
2,83 · 3,49 · 4,03 · 4,98 · 5,41 · 5,73 · 6,24 · 8,37 KB.

**IL COSTO DI UNA RILEVAZIONE È SCESO DA 91 BYTE A 10**, e non è un errore di allora: `BASE`
è passata a 165 elementi e il dizionario del gzip è ormai **saturo** della loro struttura,
quindi ogni rilevazione in più costa quasi niente. L'addendo dell'archivio passa da 6,1 KB a
0,8. È il caso esemplare in cui **riportare il numero di ieri avrebbe gonfiato il tetto per
una ragione che non esiste più**: un addendo si rimisura, non si ricopia.

E `og:image`, dei cinque interventi, vive quasi tutto in `.github/scripts/` e non in
`index.html`: 7 KB per lui sono abbondanti. Si tengono lo stesso, perché **un tetto che
sottostima ferma il lavoro a metà**, che è precisamente la cosa da cui questo numero difende.

### La potatura di BASE NON è la strada, ed è la misura che l'ha stabilito

Il testo qui sotto diceva che era **la prima strada da guardare** prima di alzare il tetto.
Era vero quando il numero che si aveva in mano erano i **caratteri**. Misurata in gzip il 24
agosto 2026, non lo è più:

| | caratteri | gzip |
|---|---|---|
| `BASE` intera, 165 rilevazioni | 50,0 KB | — |
| togliendo le **69** di gennaio-aprile | 28,9 KB (**−21,1**) | 178,2 → **176,4 KB (−1,84)** |
| in percentuale del file | −4,0% dei caratteri | **−1,0% del compresso** |

**Vale 1,84 KB, cioè meno di un commit medio**, e sono proprio le rilevazioni che il
dizionario comprime meglio: ventuno KB di caratteri diventano meno di due di gzip. Il prezzo
è invariato ed è vero — chi apre `index.html` da disco vedrebbe la serie storica cominciare
il **7 maggio** e la tendenza perdere quattro mesi — ma adesso si sa che cosa si comprerebbe,
e non vale la spesa.

**La terza strada è la sola grande, e resta l'ultima**: i commenti valgono **92,7 KB di
gzip, il 52%** del file compresso — molto più del 35% dei caratteri che era annotato qui.
Non si prende lo stesso, e non per sentimentalismo: sono la memoria delle trappole già
pagate, e questo file ne ha pagate parecchie due volte. Ma il numero va saputo: **se un
giorno servisse davvero spazio, è lì che sta, non in `BASE`.**

### La potatura di BASE: il testo di prima, e perché non vale più

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
