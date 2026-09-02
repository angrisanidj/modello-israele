# Mappare una lista nuova — contratto

È la procedura dell'**8 settembre**, il giorno del deposito delle liste, ed è quella che
ferma il lavoro notturno finché non è fatta: quando il parser trova una colonna che
l'anagrafica non conosce, la guardia si chiude e l'archivio resta all'ultimo giorno buono.
È il comportamento voluto — meglio un archivio fermo che una lista contata come un'altra —
ma vuol dire che finché non mappi, la pagina non si aggiorna.

**Chi può fare che cosa** (il confine sta in CLAUDE.md, «Il confine dell'agente»):

| passo | chi |
|---|---|
| riconoscere quale colonna è nuova | l'agente |
| **decidere l'id, il nome, il blocco, il leader** | ⚖️ **GIUDIZIO — l'agente prepara il diff e si ferma** |
| **decidere se è una componente di una fusione** (`dentro`) | ⚖️ **GIUDIZIO — si ferma** |
| assegnare il colore | l'agente esegue la regola, ma se `COLORE` avvisa **si ferma** |

Ogni passo di questa procedura sposta seggi: una lista nuova entra nel riparto.

---

## Otto posti, in quest'ordine

| # | dove | che cosa |
|---|---|---|
| 1 | `W_LISTA` in `index.html` | la **grafia di Wikipedia** → l'id. Più grafie per lo stesso id sono normali: `'rzp'`, `'religious zionism'`, `'mafdal-rz'` |
| 2 | `P{}` | l'anagrafica: `n` nome, `l` leader, `c` colore, `b` blocco, `o` ordine, `gov`, `r22`, e **`ab`** la sigla delle colonne — **solo** se quella automatica non va: `sigla()` prende la prima parola senza tagliarla, quindi «I Democratici» darebbe «Democratici» e «Giudaismo Unito Torah» darebbe «Giudaismo». Da qui `Dem` e `UTJ` |
| 3 | `P{}` campo `dentro` | **solo** se è una componente di un contenitore già presente |
| 4 | `ART` | **solo** se il nome vuole l'articolo — «il Likud», «i Democratici» |
| 5 | `COLORE.ORDINE[blocco]` | in coda: le assegnate non si spostano |
| 6 | `COLORE.TINTA_ASSEGNATA` | la posizione di tinta, tolleranza 14° |
| 7 | `PRESET.netanyahu` | **niente**: si aggiorna da sé filtrando l'anagrafica. Se ti trovi a scriverlo a mano, fermati |
| **8** | **`PAL_SCURO` in `index.html`** | **la coppia `"chiaro":"scuro"`. Senza, la lista non ha colore nel tema scuro e `schiarisci()` ne inventa uno che la regola non conosce** |

**L'OTTAVO POSTO L'HA TROVATO LA PROVA DI REGIA, il 26 agosto 2026.** Il contratto ne
elencava sette, e sette non bastano: mappando «Popolo d'Israele» di Ofer Winter e lanciando
il banco sono cadute **quattro asserzioni in tre suite**, e tutte e quattro discendevano da
`PAL_SCURO`. Prima `regola.js` — «regola `#95BFFF` / pagina (assente da PAL_SCURO)» — e poi,
per conseguenza, due asserzioni di `opacita.js`, perché il colore inventato dal ripiego
misurava **2,69 di contrasto** sulla sparkline contro il pavimento di 3. Cioè un posto
dimenticato non lascia un buco: **produce un colore**, e il colore sbagliato passa in
pagina fino a che qualcuno non misura il contrasto.

**E IL CAMPO `c` SI LEGGE DALLA REGOLA E SI RICOPIA, NON SI SCEGLIE.** È la riga che
mancava, ed è quella su cui ho sbagliato per primo. Il contratto diceva «assegnare il
colore: l'agente esegue la regola», che si può leggere come «scegli un colore coerente». Non
è quello: il colore è **l'uscita** di `COLORE.diLista(id, tema)`, e `regola.js` verifica che
la pagina non ne diverga di un byte.

Mappando Winter avevo scritto `c:"#2E5FD6"` — un blu di coalizione, plausibile, vicino a
quelli che ci sono. La regola dava **`#5E30F0`**. Sono due colori diversi, tutti e due
«ragionevoli» a occhio, e a distinguerli non è il gusto: è che il secondo rispetta le
distanze dichiarate dentro il settore e il primo no. **Un colore plausibile è esattamente
ciò che questa regola esiste per non far scegliere.**

```bash
# il colore si CHIEDE, nei due temi, e si ricopia in P{} e in PAL_SCURO
node -e "const C=require('./dati/colore-liste.js');const CO=C.COLORE||C;CO.azzeraAvvisi();console.log('chiaro',CO.diLista('id_nuovo','chiaro'),'scuro',CO.diLista('id_nuovo','scuro'),'| avvisi:',CO.avvisi().length?CO.avvisi():'nessuno')"

Il primo va nel campo `c` di `P{}`; il secondo è il valore della coppia in `PAL_SCURO`, con
il primo per chiave. Fatti i due, `regola.js` torna verde da sola: se non torna verde, uno
dei due è stato ricopiato male, ed è l'unico modo in cui questo passo può fallire.

**`r22: null` non vuol dire zero.** Vuol dire «questa sigla non esisteva nel 2022», e la
colonna «Rispetto al 2022» scrive «nuovo». Per un **contenitore** di liste che nel 2022
c'erano, `null` è la scelta giusta lo stesso: non erano quegli elettori a non aver eletto
nessuno, era la sigla a non esistere.

---

## Il colore, che è l'unico passo con una regola che si difende da sé

```bash
node -e "const C=require('./dati/colore-liste.js');console.log(JSON.stringify(C.capienza(),null,1))"
```

**L'AGO DELLA BILANCIA È PIENO, IN TUTTI E DUE I TEMI, E L'HA RIEMPITO LA PROVA DI REGIA.**
Rimisurato il 1º settembre 2026 con `capienza()`:

| blocco | liberi in chiaro | liberi in scuro |
|---|---|---|
| blocco Netanyahu | 5 | 2 |
| opposizione sionista | 5 | 3 |
| liste arabe | 1 | 1 |
| **ago della bilancia** | **0** | **0** |

Il 26 agosto quel blocco aveva 0 slot liberi in chiaro e 1 in scuro. Mappando «Popolo
d'Israele» — che è finito in **`b:"incerto"`**, l'ago della bilancia, e non nella coalizione,
perché è lì che lo mette Wikipedia — il quinto slot è stato occupato e adesso **è saturo in
tutti e due i temi**.

**Quindi la scala di ripiego del §9 non è più il caso improbabile: è quello che scatta alla
prossima lista lì dentro.** Non «se un giorno servisse»: la prima lista nuova fuori dai due
campi la fa scattare, e l'8 settembre è il giorno in cui le liste nuove arrivano tutte
insieme.

**E non l'ha mai vista resa nessuno.** Resta scritta nel §9 di `regola-colore.md` e resta
non collaudata — la si esercita la sera in cui serve, che è un fatto da sapere prima, non una
lacuna da chiudere a tavolino. Quello che si sa è come si applica: **un parametro per volta**,
prima `dentro_dic` di quel blocco meno 0,6, poi `fra_blocchi_dic` delle sue coppie meno 0,5,
poi allargare il settore; e `capienza()` restituisce quel percorso nel campo `ripiego`.

**Per gli altri tre blocchi la scala NON serve**, ed è la risposta alla domanda che questa
sezione esiste per porre: coalizione e opposizione hanno cinque slot liberi in chiaro, le
liste arabe uno. Il blocco che si rompe per primo è uno solo, ed è già rotto.

`capienza()` dice, per blocco e per tema, a quante liste la regola satura e quante ne
restano. **Il modello del fallimento è questo, ed è quello da copiare altrove**: al primo
slot oltre la saturazione la regola **avvisa**; dal secondo **fallisce con un errore
esplicito** che nomina il blocco e rimanda alla scala di ripiego. Non restituisce mai un
colore in silenzio — prima lo faceva, e restituiva `--mute`.

**E DAL 30 AGOSTO 2026 IL COLORE DEL PRIMO SLOT NON È PIÙ `--mute`: È `--ink2`**, `#33435A`
in chiaro e `#A3B3C8` in scuro. La ragione non è il contrasto — `--mute` ce l'aveva, 5,24 e
5,10 — **è che `--mute` è il colore del testo attenuato, e la pagina lo usa altrove per dire
«esclusa»**: una lista dipinta così non si legge come «senza colore assegnato», si legge come
**spenta**, cioè disattivata, che è uno stato che quella lista non ha.

`--ink2` sta sulla stessa tinta — 257,5° contro 259,1° — ma più scuro e più presente, ed è
l'inchiostro secondario **normale**, quello dei nomi di lista nelle schede dell'house effect.
Una pastiglia slate dice «la regola ha finito i colori». Misurato contro tutte e ventuno le
liste dell'anagrafica: contrasto 10,04 e 8,39 su `--card`, e la lista più vicina sta a ΔOKLab
10,3 e 10,7 — mentre `--acc` sarebbe stato a 6,0 da `--coal` e si sarebbe letto come
coalizione. **È scritta qui perché è la ragione che impedisce di tornare indietro**: chi
vedesse una pastiglia slate e la trovasse poco espressiva rimetterebbe `--mute` in dieci
secondi.

**Se `COLORE` avvisa o fallisce, l'agente si ferma.** Il percorso della scala è scritto qui
sopra, e `capienza()` lo restituisce nel campo `ripiego`.

---

## Il percorso

**1 · Guarda che cosa il parser non ha riconosciuto.** `dati/da-fare.json`, voce
`colonne-ignote`, oppure:

```bash
node .github/scripts/aggiorna.mjs --prova
```

che esegue tutto senza scrivere niente e stampa il riepilogo.

**2 · Decidi id, nome, blocco, leader.** ⚖️ **GIUDIZIO.** Un nome inglese non dice il
blocco: «Zionist Home» sta nell'opposizione o nell'ago della bilancia a seconda di chi la
guida e di che cosa ha dichiarato. Questa è la decisione che l'agente **prepara** — con le
fonti — e che una persona conferma.

**3 · Scrivi le OTTO righe** nell'ordine della tabella qui sopra.

> ⚠️ **SONO OTTO, NON SETTE.** Questa riga ha detto «sette» fino al 1º settembre 2026, e la
> tabella sopra ne elencava otto dal 26 agosto: chi legge questo passo alle undici di sera
> esegue il numero che ci trova, non risale a contare le righe. L'ottavo è `PAL_SCURO`, ed è
> quello che non lascia un buco ma **produce un colore**.

**4 · Verifica.**

```bash
npm run verifica
```

e poi, per il colore:

```bash
node -e "const C=require('./dati/colore-liste.js');const CO=C.COLORE||C;CO.azzeraAvvisi();console.log('chiaro',CO.diLista('id_nuovo','chiaro'),'scuro',CO.diLista('id_nuovo','scuro'),'| avvisi:',CO.avvisi().length?CO.avvisi():'nessuno')"
```

**E STAMPA GLI AVVISI, non solo il colore.** Fino al 30 agosto 2026 questo comando
stampava i due esadecimali e basta, e `COLORE.avvisi()` era letto **in un posto solo in
tutto il repository**: la prova che dimostra che l'avviso esiste, su uno slot sintetico.
Chi seguiva il contratto vedeva due colori plausibili e proseguiva — anche quando uno dei
due era `--mute`, cioè il grigio del testo attenuato. Da oggi `npm run verifica` cade da
sé se l'anagrafica manda un blocco oltre la saturazione, e questo comando lo dice prima.

**I numeri da guardare**, in quest'ordine:

| numero | dove | che cosa deve dire |
|---|---|---|
| la somma dei seggi | `npm run verifica`, invariante 1 | **120**, sempre |
| `capienza()` del blocco | il comando sopra | slot liberi **≥ 0**, e nessun avviso |
| le colonne ignote | `--prova` | **zero**: se ne resta una, la guardia si richiude stanotte |
| la soglia delle schede dell'house effect | misura su browser | con **quindici** colonne sale a **1127**, e il minimo di oggi è **912,2**. Il ~1190 che stava qui era una stima, rifatta sul browser il 31 agosto 2026 |

**E il confine vero non è la soglia: sta fra SEDICI e DICIASSETTE colonne.** A diciassette il
minimo della tabella supera il contenitore **a qualunque larghezza**, perché `max-width:1180`
lo blocca a 1070 — lì le schede non sono più un rimedio per gli schermi stretti, diventano
l'unica forma possibile e la soglia va **tolta** invece che alzata. Costo misurato: **43,5px
per colonna**, e la soglia si ricava come `minimo + 17 + 110`, cioè la barra più larga e la
gronda. Con undici liste in aula e 13 colonne servono **quattro liste nuove** per arrivarci.

**5 · Rilancia il job a mano** (`workflow_dispatch`) o aspetta la notte: riprende da solo,
non c'è nessun interruttore da ricordare.

---

## Se sbagli

| errore | che cosa succede |
|---|---|
| id in `W_LISTA` che non esiste in `P{}` | la lista sparisce dai calcoli **in silenzio**: nessuna guardia la vede |
| blocco sbagliato | i totali di blocco cambiano, e la guardia `DELTA_BLOCCO` può fermare il job — se il movimento supera 6 seggi |
| `dentro` mancante su una componente | contenitore e componenti coesistono: **gli stessi elettori contati due volte** |
| `dentro` messo dove non serve | la lista sparisce dal riparto quando l'altra configurazione vince |
| colore oltre la saturazione | `COLORE` avvisa al primo, **fallisce** dal secondo |
| `ART` dimenticato | «di Lista Nuova» invece di «della Lista Nuova» — lo prende `struttura.mjs` solo se la preposizione è scritta a mano, non se manca l'articolo |

---

## Le prove, e la trappola dell'orologio

Se aggiungi o modifichi una prova, **le date delle fixture si scelgono rispetto a quello
che la prova chiede, non rispetto a oggi**. Diverse suite congelano l'orologio — in
`apparentamenti.js` da metà file in poi è la **vigilia del 16 ottobre** — e lì `giorniFa(3)`
non è agosto, è il 12 ottobre. Una fixture datata «tre giorni fa» dentro una suite
congelata **sbaglia in silenzio**: non fallisce, misura un'altra cosa. Se la prova
interroga una data fissa, la fixture va datata rispetto a **quella**.

E `npm run spazzola` esegue tutto il banco con l'orologio portato avanti: va rilanciata
dopo ogni modifica a una data.

---

## Cose che vedrai, e che sono normali

Non stanno in nessun passo perché non c'è niente da fare: sorprendono, e senza queste due
righe si passa mezz'ora a cercare un difetto che non c'è.

**1 · Mappare una lista NON rianalizza l'archivio.** Le rilevazioni già dentro restano cieche
sulla lista nuova: sono state analizzate prima che la mappatura esistesse, e `unisci()` scarta
le righe `simile()` a una già presente invece di riscriverle. **La mappatura vale per le righe
analizzate da lì in avanti**, e le vecchie restano nella forma che avevano.

È il comportamento voluto — l'archivio è un deposito, non una vista ricalcolabile — ma vuol
dire che la sera dell'8 settembre la lista nuova comparirà **solo nelle rilevazioni nuove**, e
che una colonna che resta vuota per giorni non è un difetto della mappatura. Verificato
mappando Amcha il 26 agosto: quattro rilevazioni già in archivio la nominavano sotto soglia, e
nessuna delle quattro ha acquisito il dato. Se un giorno servisse il contrario, la strada è
**reimportare**, non aspettare.

**2 · Una lista sopravvive nel modello finché un istituto ne dichiara la percentuale, anche
senza darle un seggio.** Wikipedia scrive `(1,4%)` per una lista sotto soglia: quel valore
entra in `s.sotto`, e `quoteDa()` lo mette come quota — `sh = Object.assign({}, s._q, sotto)` —
quindi la lista ha una quota vera nel riparto pur avendo zero seggi, e può tornare sopra
soglia senza che nessuno la rimappi.

**Da cui: una lista che sembra sparita può restare**, e una che non compare fra i seggi può
comparire fra le quote. Non è un residuo da ripulire: è il solo modo in cui il modello vede
una lista sul filo prima che elegga qualcuno, ed è quello che alimenta «Sul filo del 3,25%
ci sono…» e lo scenario della soglia.
