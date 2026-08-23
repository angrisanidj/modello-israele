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

## Sette posti, in quest'ordine

| # | dove | che cosa |
|---|---|---|
| 1 | `W_LISTA` in `index.html` | la **grafia di Wikipedia** → l'id. Più grafie per lo stesso id sono normali: `'rzp'`, `'religious zionism'`, `'mafdal-rz'` |
| 2 | `P{}` | l'anagrafica: `n` nome, `l` leader, `c` colore, `b` blocco, `o` ordine, `gov`, `r22` |
| 3 | `P{}` campo `dentro` | **solo** se è una componente di un contenitore già presente |
| 4 | `ART` | **solo** se il nome vuole l'articolo — «il Likud», «i Democratici» |
| 5 | `COLORE.ORDINE[blocco]` | in coda: le assegnate non si spostano |
| 6 | `COLORE.TINTA_ASSEGNATA` | la posizione di tinta, tolleranza 14° |
| 7 | `PRESET.netanyahu` | **niente**: si aggiorna da sé filtrando l'anagrafica. Se ti trovi a scriverlo a mano, fermati |

**`r22: null` non vuol dire zero.** Vuol dire «questa sigla non esisteva nel 2022», e la
colonna «Rispetto al 2022» scrive «nuovo». Per un **contenitore** di liste che nel 2022
c'erano, `null` è la scelta giusta lo stesso: non erano quegli elettori a non aver eletto
nessuno, era la sigla a non esistere.

---

## Il colore, che è l'unico passo con una regola che si difende da sé

```bash
node -e "const C=require('./dati/colore-liste.js');console.log(JSON.stringify(C.capienza(),null,1))"
```

`capienza()` dice, per blocco e per tema, a quante liste la regola satura e quante ne
restano. **Il modello del fallimento è questo, ed è quello da copiare altrove**: al primo
slot oltre la saturazione la regola **avvisa**; dal secondo **fallisce con un errore
esplicito** che nomina il blocco e rimanda alla scala di ripiego. Non restituisce mai un
colore in silenzio — prima lo faceva, e restituiva `--mute`, cioè una lista dipinta come
testo disabilitato.

**Se `COLORE` avvisa o fallisce, l'agente si ferma.** La scala di ripiego è nel §9 di
`regola-colore.md` e si applica **un parametro per volta**: prima `dentro_dic` di quel
blocco meno 0,6, poi `fra_blocchi_dic` delle sue coppie meno 0,5, poi allargare il settore.
`capienza()` restituisce quel percorso nel campo `ripiego`.

Da sapere: **l'ago della bilancia in tema chiaro ha zero slot liberi**. È il blocco che
l'8 settembre si romperà per primo.

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

**3 · Scrivi le sette righe** nell'ordine della tabella qui sopra.

**4 · Verifica.**

```bash
npm run verifica
```

e poi, per il colore:

```bash
node -e "const C=require('./dati/colore-liste.js');console.log(C.diLista('id_nuovo','chiaro'), C.diLista('id_nuovo','scuro'))"
```

**I numeri da guardare**, in quest'ordine:

| numero | dove | che cosa deve dire |
|---|---|---|
| la somma dei seggi | `npm run verifica`, invariante 1 | **120**, sempre |
| `capienza()` del blocco | il comando sopra | slot liberi **≥ 0**, e nessun avviso |
| le colonne ignote | `--prova` | **zero**: se ne resta una, la guardia si richiude stanotte |
| la soglia delle schede dell'house effect | misura su browser | con **quindici** colonne sale a ~1190: la media query va rifatta |

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
