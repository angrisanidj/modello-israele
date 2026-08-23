# Aggiungere un accordo di eccedenza — contratto

Scritto il 23 agosto 2026, per la sera del **16 ottobre**, che è il termine. Il quadro
storico dice che il grosso arriva a ridosso: nel 2022 **tutti e quattro** gli accordi
furono firmati nell'ultima settimana utile, nel 2021 tre su sei dopo il deposito delle
liste. Quattro righe da inserire in una sera, di fretta, sono lo scenario normale.

**Chi può fare che cosa** (il confine sta in CLAUDE.md, «Il confine dell'agente»):

| passo | chi |
|---|---|
| leggere la notizia e proporre la riga | l'agente |
| **decidere fra `proposto` e `depositato`** | ⚖️ **GIUDIZIO — l'agente prepara il diff e si ferma** |
| scrivere la riga in `index.html` | **conferma di una persona**: sposta un seggio |

**Perché `proposto` e `depositato` sono un giudizio e non una lettura.** Una notizia dice
«hanno firmato», «hanno annunciato», «hanno raggiunto un'intesa»: tre formule che in
italiano si somigliano e nel modello sono due mondi. Un depositato entra nel riparto
sempre; un annunciato solo con la leva, e **muore il 16 ottobre**. Il modello non può
dedurlo dal verbo.

**E due cose misurate, non temute:**

> **1 · Una riga sbagliata adesso PARLA.** Prima, su nove modi di sbagliarla, tre passavano
> in silenzio e due cambiavano significato senza dirlo. Dal 23 agosto 2026 ognuno dei nove
> ferma la riga, la dichiara nella fascia rossa e rende **rosso `npm run verifica`**. Vedi
> «Se sbagli».
>
> **2 · Una riga GIUSTA non fa più cadere il banco.** Le prove erano scritte sul contenuto
> di quel giorno: un secondo accordo annunciato faceva cadere 9 asserzioni, il primo
> depositato 11. Adesso derivano dalla tabella e reggono a zero, uno e tre accordi in
> ciascuno stato — misurato. Vedi «Le prove».

---

## I campi

```js
var APPARENTAMENTI=[
 {a:'raam', b:'lista_araba', data:'2026-08-22', stato:'proposto',
  fonte:"Mansour Abbas propone alla Lista Unita un accordo di cooperazione…"}
];
```

| campo | forma | letto da | obbligatorio |
|---|---|---|---|
| `a` `b` | id di lista, esattamente come in `P{}` | il riparto, il Monte Carlo, l'etichetta | **sì** |
| `data` | `'AAAA-MM-GG'`, il giorno dell'**annuncio** o del **deposito** | la serie storica, che non deve retroagire | **sì** (senza, vedi caso 6) |
| `stato` | `'proposto'` · `'depositato'` · `'ritirato'` | tutto | **sì**, e alla lettera |
| `fonte` | testo libero: chi l'ha dichiarato, dove | **nessuno** | no, ma scrivila |
| `fine` | `'AAAA-MM-GG'`, il giorno del ritiro | `coppieAl()` | solo con `stato:'ritirato'` |

**`fonte` non compare in pagina**, ed è deliberato: è la stessa forma dei veti — un accordo
è un **fatto dichiarato**, e chi lo rilegge fra un mese deve sapere da dove viene senza
cercarlo. Non scriverla è l'unico campo che non rompe niente e che ti farà perdere tempo.

**`stato` decide tutto:**

- `depositato` → entra nel riparto **sempre**, e resta anche dopo il termine;
- `proposto` → entra **solo** con la leva accesa, e **solo fino al 16 ottobre**;
- `ritirato` + `fine` → vale come annunciato fino a `fine`, poi non esiste più.

---

## Il percorso, la sera del 16 ottobre

**1 · Apri `index.html`, cerca `var APPARENTAMENTI=[`** (verso riga 1926). Aggiungi una
riga per accordo. L'ordine non conta: i depositati vengono comunque prima, e la regola è
scritta in `coppieAl()`.

**2 · Controlla gli id contro l'anagrafica.** Nella stessa pagina, `var P={` — gli id sono
quelli, con l'underscore: `sionismo_rel`, `lista_araba`, `israel_first`. Un id inventato
**non** dà errore: vedi il caso 1.

```bash
for i in raam lista_araba; do if grep -qE "^ *$i *:\{" index.html; then echo "$i  c'è"; else echo "$i  NON ESISTE"; fi; done
```

**3 · Rigenera ed esegui la suite degli accordi**, che è la prima a cadere:

```bash
node test/estrai.mjs && cd test/suite && node apparentamenti.js
```

**Attenzione al numero che stampa in fondo**, «quanto vale oggi l'accordo …»: quella misura
gira in jsdom, che **non fa rete**, quindi è sul **seme `BASE`** dentro il file e **non**
sull'archivio pubblicato. I due danno risposte diverse — il 23 agosto la coppia araba
valeva **zero** seggi sul seme e **uno** sull'archivio vero. Serve a vedere che il
meccanismo gira, non a sapere quanto vale l'accordo.

**4 · Guarda la pagina vera**, che è l'unico posto dove il numero è quello giusto — il
server serve la cartella, quindi `dati/archivio.json` si carica davvero:

```bash
node .claude/serve.mjs
```

e su `http://localhost:8788` leggi, sotto le ipotesi: **quanti accordi depositati**, quanti
annunciati, **quali scartati e perché**, e l'effetto in seggi e in blocchi. La riga di esito
è il posto in cui un errore di battitura si vede, quando si vede.

**5 · Verifica.**

```bash
npm run verifica
```

Deve essere **verde**. Se è rosso, la tabella ha una riga sbagliata e il messaggio dice
quale e perché: **non toccare le prove** — vedi «Le prove».

**6 · Commit**, con la fonte nel messaggio. Il file è pubblico e collegato a un giornale:
un accordo in più sposta un seggio, e il seggio attraversa il confine fra i blocchi in
tutti e venticinque gli stati dello swing.

---

## Se sbagli

Nove modi, provati uno per uno il 23 agosto 2026 — prima e dopo le convalide.

| # | errore | prima | adesso |
|---|---|---|---|
| 1 | id che non esiste (`raamm`) | «raamm non è sopra la soglia»: motivo sbagliato | «**«raamm» non è in P{}**: nessuna lista ha questo id» |
| 2 | lista vera ma sotto soglia | dichiarato, ed era giusto | invariato: la riga è valida, l'accordo si scioglie e la riga di esito lo dice |
| 3 | data nel futuro | **silenzio totale** | «la data «2027-08-22» **è nel futuro**» |
| 4 | `stato` scritto male (`depositatp`) | diventava **annunciato** senza dirlo | «**lo stato «depositatp» non esiste**: sono ammessi solo proposto, depositato, ritirato» |
| 5 | `stato` con la maiuscola | idem 4 | idem 4 |
| 6 | campo `data` mancante | **silenzio**: entrava come depositato senza data | «**manca il campo «data»**» |
| 7 | la stessa lista due volte | «entrava» e valeva zero | «**«raam» è apparentata con sé stessa**» |
| 8 | campo `b` mancante | scriveva «undefined» | «**manca il campo «b»**» |
| 9 | due accordi sulla stessa lista | dichiarato, ed era giusto | invariato, e il depositato vince sull'annunciato |
| 10 | `ritirato` senza `fine` | valeva «mai vissuto», in silenzio | «**stato «ritirato» senza il campo «fine»**» |
| 11 | ritiro prima dell'annuncio | nessun controllo | «**il ritiro precede l'annuncio**» |
| 12 | `depositato` con una `fine` | veniva onorata | «**un accordo depositato non può avere una data di ritiro**» |

**Che cosa vuol dire «adesso parla», in tre punti.** La riga sbagliata (1) **non entra da
nessuna parte** — riparto, Monte Carlo, conto dell'etichetta; (2) la pagina la dichiara con
la **fascia rossa**, che nomina riga e campo; (3) **`npm run verifica` è rosso** finché la
tabella non torna valida. Il terzo è quello che conta: il banco è il cancello del lavoro
notturno, quindi con una riga sbagliata **non si pubblica**. Meglio un archivio fermo di un
seggio spostato per un errore di battitura.

E i motivi sono **gli stessi** che finiscono in `dati/da-fare.json` e nella issue del
mattino: `erroriRiga()` è l'unica formulazione.

---

## Le prove

**Non cadono più.** Misurato aggiungendo una riga vera alla tabella:

| che cosa aggiungi | prima | adesso |
|---|---|---|
| un secondo accordo **annunciato** | 9 asserzioni, suite morta | **zero** |
| il primo accordo **depositato** | 11 asserzioni, suite morta | **zero** |

Il metodo: le prove sul **meccanismo** installano la tabella che serve, quelle sulla
**tabella pubblicata** derivano l'attesa da `A.APP` e da `contoApp()`. E `apparentamenti.js`
prova esplicitamente **zero, uno e tre accordi in ciascuno dei tre stati** — nove
combinazioni, sette controlli ciascuna.

**Se una prova cade dopo la tua modifica, non toccarla: fermati e chiedi.** Vale anche
quando il rosso è legittimo — è la regola generale in CLAUDE.md, «Il confine dell'agente».

### La trappola dell'orologio

Se aggiungi o modifichi una prova, **le date delle fixture si scelgono rispetto a quello
che la prova chiede, non rispetto a oggi**. In `apparentamenti.js` da metà file in poi
l'orologio è congelato alla **vigilia del 16 ottobre**: lì `giorniFa(3)` non è agosto, è il
12 ottobre. Una fixture datata «tre giorni fa» dentro una suite congelata **sbaglia in
silenzio** — non fallisce, misura un'altra cosa. Se la prova interroga una data fissa, la
fixture va datata rispetto a **quella**.

E `npm run spazzola` esegue tutto il banco con l'orologio portato avanti: va rilanciata
dopo ogni modifica a una data.

---

## E se Wikipedia lo dicesse da sé? No

Verificato il 23 agosto 2026 sulle pagine dei sondaggi del **2020, 2021, 2022 e 2026**:
`surplus`, `vote-sharing`, `odafim` compaiono in **zero righe di tabella e zero paragrafi**.
Le righe-evento di quelle pagine parlano di fusioni, scissioni, primarie, scadenze — non di
accordi di eccedenza. Gli accordi stanno **nell'articolo principale dell'elezione**, in una
sezione «Surplus-vote agreements» che è prosa più una tabella di coppie **senza date**.

Quindi il percorso di questo file **è l'unico percorso**, e non c'è un secondo canale da
cui aspettarsi una conferma.
