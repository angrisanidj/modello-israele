# Tradurre una voce-evento — contratto

Il lavoro notturno legge le righe-evento della tabella di Wikipedia e le deposita in
`dati/eventi-grezzi.json` con `"stato": "nuovo"`. Sono **citazioni inglesi non curate** e
non entrano da sole in pagina: la cronologia pubblicata, `EVENTI` dentro `index.html`, è
solo italiana e si scrive a mano. È già successo il contrario — due voci inglesi in pagina
fra le quattordici italiane — ed è la ragione per cui la porta è una sola.

**Chi può fare che cosa** (il confine sta in CLAUDE.md, «Il confine dell'agente»):

| passo | chi |
|---|---|
| tradurre il **testo** | l'agente propone e applica |
| decidere se la voce **merita** la cronologia | **GIUDIZIO — l'agente si ferma** |
| toccare la **data** | **l'agente si ferma sempre**: la data sposta un numero |

**Perché la data è diversa dal testo.** Sembra che gli eventi non spostino numeri, e non è
vero: la data colloca il marcatore sull'asse della tendenza e decide la **terna dei trenta
giorni** del riquadro isolato — «nei 30 giorni successivi: Netanyahu 51, opposizione 47,
arabi 11». Spostarla di un giorno cambia tre numeri pubblicati.

---

## I due file, e il legame fra loro

| file | che cosa contiene | chiave |
|---|---|---|
| `dati/eventi-grezzi.json` | il **registro**: ogni voce vista, con stato | `chiave` = data + testo normalizzato |
| `index.html`, `var EVENTI=[` | la **cronologia pubblicata**, solo italiana | la `data` |

Il registro non conosce la riga italiana e la riga italiana non conosce il registro: **il
legame è la data**, e lo tiene una prova (`eventireg.js`, «ogni voce marcata tradotta ha
davvero una voce italiana in cronologia alla sua data»). Se i due divergono, `npm run
verifica` è rosso.

Gli stati sono tre e solo tre: `nuovo`, `tradotto`, `scartato`. Una voce lavorata **non si
cancella**: cambia stato.

---

## Il percorso

**1 · Trova le voci.**

```bash
node -e "require('./dati/eventi-grezzi.json').filter(x=>x.stato==='nuovo').forEach(x=>console.log(x.data,'·',x.testo))"
```

Oppure leggi `dati/da-fare.json`, voce `eventi-da-tradurre`: porta le stesse righe, con la
chiave.

**2 · Per ciascuna, decidi.** ⚖️ **GIUDIZIO**

Entra in cronologia un fatto che **muove i numeri o li spiega**: fusioni, scissioni,
primarie che cambiano un capolista, scadenze di legge, guerre. Non entrano le notizie di
giornata che il modello non vede. Nel dubbio: `scartato` è reversibile, la cronologia
pubblicata no.

**3a · Se la scarti**: porta `"stato"` a `"scartato"` in `dati/eventi-grezzi.json`. Fine.

**3b · Se la traduci**: due modifiche, in quest'ordine.

- in `index.html`, dentro `var EVENTI=[`, aggiungi la riga **nella posizione cronologica
  giusta** (l'elenco è ordinato per data):
  ```js
   {data:"2026-08-22",testo:"Abbas propone alla Lista Unita un accordo di eccedenza"},
  ```
  La `data` è **quella del registro**, copiata, non riletta dalla notizia. ⚖️ Il **testo**
  è tuo: italiano piano, presente storico, senza virgolette e senza fonte — la fonte sta
  nel registro.
- in `dati/eventi-grezzi.json`, porta quella voce a `"stato": "tradotto"`.

**4 · Verifica.**

```bash
npm run verifica
```

`eventireg.js` controlla: chiavi uniche, ogni chiave ricalcolabile, stati nel vocabolario,
e **ogni `tradotto` con la sua riga italiana alla stessa data**. `crono.js` controlla che
la cronologia resa abbia una voce per ogni evento.

**Il numero da guardare**: `EVENTI` e le voci `tradotto` devono essere lo stesso numero.

```bash
node -e "const r=require('./dati/eventi-grezzi.json');const h=require('fs').readFileSync('index.html','utf8');const b=h.slice(h.indexOf('var EVENTI=['));console.log('tradotte',r.filter(x=>x.stato==='tradotto').length,'· in pagina',(b.slice(0,b.indexOf(']')).match(/data:\"/g)||[]).length)"
```

---

## Se sbagli

| errore | che cosa succede |
|---|---|
| testo italiano con parole inglesi | `eventireg.js` cade: cerca ` the `, ` and `, `conducts`, `chosen` |
| `tradotto` senza riga in pagina | `eventireg.js` cade |
| riga in pagina senza voce nel registro | **non cade**: il controllo è in un verso solo |
| data diversa fra registro e pagina | `eventireg.js` cade (il legame è la data) |
| chiave modificata a mano | `eventireg.js` cade: la chiave si ricalcola dai due campi |

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
