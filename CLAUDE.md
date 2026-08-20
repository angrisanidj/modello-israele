# Modello previsionale Knesset 2026

Modello statistico per le elezioni della 26ª Knesset del **27 ottobre 2026**, pubblicato su
<https://angrisanidj.github.io/modello-israele/>. Autore: Daniele Angrisani (FocusAmerica).

Tutto il testo rivolto al lettore è **in italiano**. Anche i commenti nel codice sono in italiano.

---

## Regola prima: il file è uno solo

`index.html` è un file **autonomo**: HTML, CSS e JavaScript in un unico documento, nessuna
dipendenza esterna, nessuna chiamata di rete all'infuori dell'API di Wikipedia. Deve poter essere
salvato su disco, aperto con un doppio clic e funzionare. Deve poter essere incorporato in una
pagina di Fanpage o FocusAmerica senza portarsi dietro nulla.

Non introdurre bundler, framework, npm a runtime, font remoti, CDN. `devDependencies` serve solo
alle prove.

## Come si lavora

```bash
npm install          # solo la prima volta: installa jsdom per le prove
npm test             # estrae il JS e lancia le 239 prove
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
  wikiparser.js       prove del parser della tabella Wikipedia
  fixture.js          tabella Wikipedia di riferimento per le prove
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

1. Modalità `?embed=1` per l'inserimento in FocusAmerica
2. Accordi di apparentamento (dall'8 settembre, valgono 1-2 seggi)
3. Liste nuove e scissioni fino all'8 settembre (mappatura manuale, il parser avvisa)
4. Incertezza sulla configurazione delle liste nel Monte Carlo
5. Affluenza haredi (nessuna leva, ha oscillato meno di quella araba)
6. Storico delle proiezioni salvate su disco invece che ricalcolate
7. Esportazione PNG dei grafici
8. Aggiornamento automatico programmato, con avviso se l'archivio è vecchio
9. Accessibilità: navigazione da tastiera, ruoli ARIA
10. **Prova su browser veri.** Tutto è verificato in jsdom, che non fa layout. I difetti veri
    segnalati finora — testo nero su fondo nero, anteprima senza JavaScript, didascalia sopra i
    seggi — erano tutti di quel tipo e nessuna prova automatica li avrebbe visti.
11. Settembre 2019 ricalcolato riga per riga (oggi è dato di seconda mano, da titoli di stampa)
12. **Il conto dei giorni al voto tronca le ore invece di contare i giorni di calendario.**
    Il 20 agosto la pagina dice «67 giorni», ma dal 20 agosto al 27 ottobre sono 68 giorni di
    calendario. Il lettore confronta col calendario, non con le ore: il conto va fatto sulle
    date a mezzanotte, non sulla differenza di millisecondi troncata.
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
14. **La tabella dell'archivio dei sondaggi sfora.** È larga 942px dentro un `div` con
    `overflow-x:visible`, quindi spinge l'intero documento oltre la finestra e il corpo della
    pagina scorre in orizzontale. Difetto preesistente alla tavolozza, misurato su browser
    vero: serve un contenitore che scorra per conto suo.

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
2. **La linea della maggioranza in `k-emi`**, disegnata in `--ink` sopra un seggio pieno.
   In tema chiaro il riordino delle bande l'ha portata sopra soglia; in tema scuro sta a
   **1,22**, il valore peggiore mai misurato, perché `--ink` è quasi bianco e i seggi
   dell'opposizione sono la banda più chiara. Serve un contorno, o un colore proprio per
   quella linea.

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

### Nell'ordine

1. **La tabella dell'archivio dei sondaggi che sfora** (punto 13 delle cose da fare).
   Prima dell'embed, non dopo: dentro `?embed=1`, in una colonna stretta, una tabella che
   spinge il documento oltre la finestra peggiora invece di restare com'è.
2. **Modalità `?embed=1`** per l'inserimento in FocusAmerica (punto 1).
3. **Cercare le altre strade doppie.** Ogni valore che raggiunge lo schermo per più di un
   percorso e non ha una prova che li leghi è il prossimo colore di blocco. Vedi sopra.
4. **I 380px su un browser vero.** Nessuno li ha ancora guardati: nella sessione di oggi
   il riquadro del browser non si ridimensionava, e l'invariante 8 — nessun testo negli
   SVG sotto i 5px reali a viewport 380 — è verificata solo alla larghezza disponibile.

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
- Minore: l'ultimo avvenimento della cronologia entra in `k-analisi` con l'iniziale forzata
  a minuscola, e su un nome proprio produce «hadash, Ta'al e Balad firmano l'accordo».

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
- **La linea della maggioranza in `k-emi`**, in tema scuro a **1,22**. Stessa natura:
  `--ink` quasi bianco sopra un seggio pieno. Serve un contorno o un colore proprio.
- **Il conto dei giorni al voto tronca le ore** invece di contare i giorni di calendario
  (punto 12).
- **Sei suite usano un DOM ridotto** — `aff`, `emi`, `final`, `tema`, `testint`,
  `verifica` — e non possono provare niente che tocchi elementi resi (punto 13 vecchio).

### La cosa più importante

**La verifica visiva non è automatizzabile, e non è un dettaglio.** Tutti i difetti veri
trovati oggi — la stella della bandiera che sconfinava nelle bande, l'occhiello a filo del
bordo sull'ombra, il vuoto di 372px sotto le ipotesi, l'evidenziazione che competeva con
la codifica del riempimento, il verde arabo che si leggeva nero — sono stati trovati
**guardando la pagina**, non dalla suite. Le 239 prove dicono che il modello non si è
rotto; non dicono che la pagina si veda. Dopo ogni push, aprire
<https://angrisanidj.github.io/modello-israele/> e guardarla nei due temi.
