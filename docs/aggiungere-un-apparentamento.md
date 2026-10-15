# Aggiungere un accordo di eccedenza — contratto

Scritto il 23 agosto 2026, per la sera del **16 ottobre**, che è il termine. Il quadro
storico dice che il grosso arriva a ridosso: nel 2022 **tutti e quattro** gli accordi
furono firmati nell'ultima settimana utile, nel 2021 tre su sei dopo il deposito delle
liste. Quattro righe da inserire in una sera, di fretta, sono lo scenario normale.

**Riscritto il 15 ottobre 2026, dopo la prova di regia del 14**, che lo ha eseguito per la
prima volta con l'orologio congelato al 15, al 16 e al 17. Il contratto di prima non diceva
come si porta a `depositato` una riga che c'è già — che è il caso della sera del 16, con
cinque accordi firmati in tabella — e seguito alla lettera **avrebbe fermato il lavoro
notturno dal 17**. Le sezioni nuove sono la prima («La sera del 16») e le ultime due («Che
cosa si muove dopo» e «Che cosa ha trovato la regia»).

**Chi può fare che cosa** (il confine sta in CLAUDE.md, «Il confine dell'agente»):

| passo | chi |
|---|---|
| leggere la notizia e proporre la riga | l'agente |
| **decidere fra `proposto` e `depositato`** | ⚖️ **GIUDIZIO — l'agente prepara il diff e si ferma** |
| scrivere la riga in `index.html` | **conferma di una persona**: sposta un seggio |

**Perché `proposto` e `depositato` sono un giudizio e non una lettura.** Una notizia dice
«hanno firmato», «hanno annunciato», «hanno depositato», «hanno raggiunto un'intesa»:
formule che in italiano si somigliano e nel modello sono due mondi. Un depositato entra nel
riparto sempre; un firmato solo con la leva, e **muore il 16 ottobre**. Il modello non può
dedurlo dal verbo. **Firmare non è depositare**: l'accordo vale solo se è depositato presso
la Commissione elettorale centrale entro il termine.

**E tre cose misurate, non temute:**

> **1 · Una riga sbagliata PARLA.** Diciassette modi di sbagliarla, provati uno per uno:
> ognuno ferma la riga, la dichiara nella fascia rossa e rende **rosso `npm run verifica`**.
> Vedi «Se sbagli».
>
> **2 · Una riga GIUSTA non fa cadere il banco — dal 14 ottobre 2026 anche quando è
> depositata.** Fino a quel giorno no: con tutti gli accordi portati a `depositato` cadevano
> cinque asserzioni che pretendevano di trovarne di firmati in tabella, o che scambiavano la
> data del deposito per una costante. Riscritte in `00dfc27`. Misurato: con i cinque
> depositati il 16, `apparentamenti.js` è verde al 16 e al 17, `direzione.js` pure, e il banco
> intero spazzolato a quelle due date non ha cadute. Vedi «Le prove».
>
> **3 · Con la leva accesa — il predefinito — portare a `depositato` un accordo già firmato
> non cambia i numeri in pagina.** Erano già nel riparto, per ipotesi. Cambia che cosa sono:
> da ipotesi a fatti. Misurato sull'archivio del 15 ottobre: blocchi 53 · 50 · 13 · 4 prima
> e dopo. Vedi «Che cosa si muove dopo».

---

## La sera del 16: portare a `depositato` una riga che c'è

È il caso normale: l'accordo è in tabella da quando è stato firmato, con `stato:'proposto'`,
e quella sera arriva la notizia che è stato depositato. **La riga non si riscrive e non se
ne aggiunge una seconda: si cambiano due cose in quella che c'è.**

```js
// prima
 {a:'shas', b:'utj', data:'2026-10-11', stato:'proposto',
  fonte:"Shas and United Torah Judaism sign a surplus-vote agreement"},
// dopo
 {a:'shas', b:'utj', data:'2026-10-11', deposito:'2026-10-16', stato:'depositato',
  fonte:"Shas and United Torah Judaism sign a surplus-vote agreement; deposito: <fonte>"},
```

1. **`stato` passa da `'proposto'` a `'depositato'`.** ⚖️ È il passo di giudizio: solo se la
   fonte dice che l'accordo è stato **depositato**, non firmato né annunciato di nuovo.
2. **Si aggiunge `deposito`**, il giorno del deposito, nella forma `'AAAA-MM-GG'`.
3. **`data` NON SI TOCCA.** Resta il giorno dell'annuncio. È la cosa da non sbagliare, e la
   ragione è misurata: con una data sola la serie storica veniva riscritta — vedi «Che cosa
   ha trovato la regia».
4. **`fonte`**: si aggiunge in coda da dove viene il deposito. Non entra in nessun calcolo,
   ma chi rilegge fra un mese deve poterlo verificare senza cercarlo.

**Se il deposito di un accordo non è confermato, la riga resta `proposto`.** Il 17 muore da
sola, ed è quello che deve succedere a un accordo non depositato: non serve toccarla. Meglio
un accordo vero che muore il 17 che un accordo falso che resta nel riparto fino al voto.

**Se l'accordo depositato non era in tabella**, si aggiunge una riga nuova con le due date:
`data` il giorno in cui è stato annunciato o firmato — se si sa — oppure lo stesso giorno del
deposito, e `deposito`.

**Se si scrive dopo mezzanotte, il 17**, `deposito:'2026-10-16'` è ancora valido: è la data
del fatto, non quella in cui la si scrive. Ma fra mezzanotte e il push la pagina mostra gli
accordi come scaduti, quindi meglio prima.

---

## I campi

```js
var APPARENTAMENTI=[
 {a:'raam', b:'lista_araba', data:'2026-09-12', deposito:'2026-10-16', stato:'depositato',
  fonte:"…"}
];
```

| campo | forma | letto da | obbligatorio |
|---|---|---|---|
| `a` `b` | id di lista, esattamente come in `P{}` | il riparto, il Monte Carlo, l'etichetta | **sì** |
| `data` | `'AAAA-MM-GG'`, il giorno dell'**annuncio** | la serie storica: da qui l'accordo conta **per ipotesi** | **sì** |
| `deposito` | `'AAAA-MM-GG'`, il giorno del **deposito**, non dopo il termine | la serie storica: da qui l'accordo conta **sempre** | **sì con `depositato`, vietato con gli altri stati** |
| `stato` | `'proposto'` · `'depositato'` · `'ritirato'` | tutto | **sì**, e alla lettera |
| `fonte` | testo libero: chi l'ha dichiarato, dove | **nessuno** | no, ma scrivila |
| `fine` | `'AAAA-MM-GG'`, il giorno del ritiro | `coppieAl()` | solo con `stato:'ritirato'` |

**Le due date fanno due mestieri, e nessuna retroagisce.** Dalla `data` l'accordo conta per
ipotesi — con la leva accesa, e fino al termine; dal `deposito` conta sempre, con la leva
accesa o spenta, anche dopo il termine. Prima della `data` non esiste. È `depositatoAl()` a
deciderlo, alla data che la serie storica chiede: una proiezione di settembre non vede un
deposito di ottobre.

**`fonte` non compare in pagina**, ed è deliberato: è la stessa forma dei veti — un accordo
è un **fatto dichiarato**, e chi lo rilegge fra un mese deve sapere da dove viene senza
cercarlo.

**`stato` decide tutto:**

- `depositato` + `deposito` → entra nel riparto **sempre dal giorno del deposito**, e resta
  anche dopo il termine;
- `proposto` → entra **solo** con la leva accesa, e **solo fino al 16 ottobre**;
- `ritirato` + `fine` → vale come firmato fino a `fine`, poi non esiste più.

---

## Il percorso

**1 · Apri `index.html`, cerca `var APPARENTAMENTI=[`** (verso riga 2981). Per un accordo
già in tabella segui «La sera del 16»; per uno nuovo aggiungi una riga. L'ordine non conta:
i depositati vengono comunque prima, e la regola è scritta in `coppieAl()`.

**2 · Controlla gli id contro l'anagrafica.** Nella stessa pagina, `var P={` — gli id sono
quelli, con l'underscore: `sionismo_rel`, `lista_araba`, `rzp_zehut`. Un id inventato **non**
dà errore di sintassi: lo prende la convalida, caso 1.

```bash
for i in raam lista_araba; do if grep -qE "^ *$i *:\{" index.html; then echo "$i  c'è"; else echo "$i  NON ESISTE"; fi; done
```

**3 · Rigenera ed esegui la suite degli accordi**, che è la prima a cadere:

```bash
node test/estrai.mjs && cd test/suite && node apparentamenti.js
```

Deve finire con tutte le asserzioni verdi. Il numero «quanto vale oggi l'accordo …» gira in
jsdom sul **seme `BASE`**, non sull'archivio pubblicato: serve a vedere che il meccanismo
gira, non a sapere quanto vale l'accordo.

**4 · Guarda la pagina vera**, che è l'unico posto dove i numeri sono quelli giusti:

```bash
node .claude/serve.mjs
```

e su `http://localhost:8788` leggi, sotto le ipotesi, la **riga di esito**. La sera del 16,
con i cinque depositati, deve dire così — è il testo misurato sull'archivio del 15:

> 5 accordi depositati, sempre nel riparto: Lista Unita araba e Ra'am; B'Yachad e Yisrael
> Beitenu; Yashar e I Democratici; Likud e Sionismo Religioso–Zehut; Shas e Giudaismo Unito
> Torah. Non ce n'è nessuno firmato in attesa di deposito. Il termine per depositarli è oggi,
> 16 ottobre 2026: da domani gli accordi firmati e non depositati non contano più.

E **il pulsante «Togli N apparentamenti» sparisce**: non resta niente da applicare per
ipotesi. Se un accordo è rimasto firmato, la riga lo elenca fra i firmati e il pulsante resta,
col numero di quelli. Se compare la **fascia rossa**, una riga è sbagliata: vedi «Se sbagli».

**5 · Verifica.**

```bash
npm run verifica
```

Deve essere **verde**. Se è rosso, la tabella ha una riga sbagliata e il messaggio dice
quale e perché: **non toccare le prove** — vedi «Le prove». Dura circa 25 minuti.

**6 · Commit e push**, con la fonte nel messaggio. Il file è pubblico e collegato a un
giornale. Il push fa partire il job: vedi «Che cosa si muove dopo» per quello che cambia e
quando.

---

## Che cosa si muove dopo

**In pagina, subito.** Con la leva accesa — il predefinito — i blocchi non cambiano: gli
accordi firmati erano già nel riparto per ipotesi. Cambiano:

| | prima del deposito | dopo |
|---|---|---|
| il pulsante | «Togli 5 apparentamenti» | **non c'è** |
| la riga di esito | «5 accordi firmati e non depositati, applicati per ipotesi … È un'ipotesi, non un fatto» | «5 accordi depositati, sempre nel riparto …» |
| `ipotesiNeiNumeri()` — testo di condivisione, prompt, targa | dice anche «Sono applicati 5 accordi di eccedenza firmati e non ancora depositati» | **la clausola sugli accordi sparisce**: sono un fatto |
| la serie storica | — | **identica**: nessun punto anteriore al deposito cambia |

Con la leva spenta i blocchi **possono** cambiare: lì gli accordi entrano solo dal deposito.
Sull'archivio del 15 non cambiano, perché i cinque insieme spostano un seggio dentro lo stesso
blocco; su un altro archivio potrebbero.

**In `dati/stato-job.json`, dalla notte successiva.** Il registro tiene i blocchi della
fonte **senza gli accordi non depositati** — è il cancello della guardia `DELTA_BLOCCO`, che
non deve poter scattare per una leva. Quindi un deposito **entra** in quei numeri: è un fatto,
non una leva, e il registro lo deve vedere. Sull'archivio del 15 restano **49 · 50 · 13 · 8**
prima e dopo, perché il seggio si sposta dentro un blocco; su un altro archivio potrebbero
muoversi di uno o due, molto sotto la soglia di 6. Il campo `ipotesi` accanto perde la
clausola sugli accordi la stessa notte.

**L'anteprima resta indietro finché il job non gira.** `og:title` e `og:image` — la targa
con la riga dell'ipotesi — non li scrive la pagina: li scrive il job `meta` del workflow
`aggiorna`, che parte a ogni push su `main`. Quindi:

- dopo il push, la targa vecchia — «5 apparentamenti firmati e non depositati nel riparto»
  — resta in giro finché il job non ha girato. Di solito sono minuti; GitHub non lo
  garantisce;
- si controlla nella scheda Actions: l'esecuzione «Aggiorna archivio» del push, job `meta`
  verde, e un commit «Aggiornare le meta dello stato dal render di adesso». Se il job dice
  «niente da pubblicare» (uscita 3) e la targa doveva cambiare, qualcosa non va;
- `og:title` sull'archivio del 15 **non cambia**: «I partiti arabi potrebbero essere
  decisivi» con gli accordi firmati e depositati;
- **il job calcola la data in UTC**: fra mezzanotte e le due di Roma del 17 crede che sia
  ancora il 16. Conta solo per un push fatto in quella finestra;
- **un messaggio già inviato tiene la sua anteprima per sempre**: per vedere quella nuova si
  manda il link in una conversazione nuova.

**E il 17, da sola, senza nessun commit:** la riga di esito passa al passato, la nota
metodologica pure, e gli accordi rimasti firmati smettono di contare — con la leva accesa
i blocchi possono cambiare quel giorno. Anche questo arriva all'anteprima solo quando il job
gira: la notte del 17, o al primo push.

---

## Se sbagli

Diciassette modi, provati uno per uno: i primi dodici il 23 agosto 2026, gli ultimi cinque —
quelli del campo `deposito` — il 14 ottobre.

| # | errore | che cosa dice |
|---|---|---|
| 1 | id che non esiste (`raamm`) | «**«raamm» non è in P{}**: nessuna lista ha questo id» |
| 2 | lista vera ma sotto soglia | la riga è valida, l'accordo si scioglie e la riga di esito lo dice |
| 3 | `data` nel futuro | «la data «2027-08-22» **è nel futuro**» |
| 4 | `stato` scritto male (`depositatp`) | «**lo stato «depositatp» non esiste**: sono ammessi solo proposto, depositato, ritirato» |
| 5 | `stato` con la maiuscola | idem 4 |
| 6 | campo `data` mancante | «**manca il campo «data»**» |
| 7 | la stessa lista due volte | «**«raam» è apparentata con sé stessa**» |
| 8 | campo `b` mancante | «**manca il campo «b»**» |
| 9 | due accordi sulla stessa lista | dichiarato, e il depositato vince sul firmato |
| 10 | `ritirato` senza `fine` | «**stato «ritirato» senza il campo «fine»**» |
| 11 | ritiro prima dell'annuncio | «**il ritiro precede l'annuncio**» |
| 12 | `depositato` con una `fine` | «**un accordo depositato non può avere una data di ritiro**» |
| 13 | **`depositato` senza `deposito`** | «**stato «depositato» senza il campo «deposito»**: manca il giorno in cui è stato depositato» |
| 14 | `deposito` su una riga `proposto` | «**il campo «deposito» vale solo con stato «depositato»**» |
| 15 | `deposito` malformato (`16-10-2026`) | «la data di deposito «16-10-2026» **non è nella forma AAAA-MM-GG**» |
| 16 | **le due date scambiate**: `deposito` prima della `data` | «**il deposito precede l'annuncio**» |
| 17 | **il mese sbagliato: `deposito:'2026-11-16'`** | «il deposito («2026-11-16») **è dopo il termine del 16 ottobre 2026**: dopo il termine non si deposita» |

Il 13 è l'errore più probabile la sera del 16 — si cambia lo stato e ci si dimentica del
campo — e il 17 è il refuso più probabile. **Il deposito non si confronta con oggi**, ed è
voluto: le prove valutano la tabella a date passate, e lì un deposito successivo non è un
errore ma un accordo non ancora depositato. La conseguenza: una riga scritta **prima** del
deposito, con una data di deposito futura ma non oltre il termine, non dà errore — l'accordo
resta firmato fino a quel giorno, e da quel giorno conta sempre. La sera del 16 il caso non
esiste: l'unica data valida è il 16 stesso.

**Che cosa vuol dire «parla», in tre punti.** La riga sbagliata (1) **non entra da nessuna
parte** — riparto, Monte Carlo, conto dell'etichetta; (2) la pagina la dichiara con la
**fascia rossa**, che nomina riga e campo; (3) **`npm run verifica` è rosso** finché la
tabella non torna valida. Il terzo è quello che conta: il banco è il cancello del lavoro
notturno, quindi con una riga sbagliata **non si pubblica**, e se fosse già pubblicata **la
notte dopo l'archivio si fermerebbe**. Meglio un archivio fermo di un seggio spostato per un
errore di battitura — ma se succede la sera del 16, va riparato prima di dormire.

E i motivi sono **gli stessi** che finiscono in `dati/da-fare.json` e nella issue del
mattino: `erroriRiga()` è l'unica formulazione.

---

## Le prove

**Non cadono con una riga giusta, in nessuno dei tre stati.** Le prove sul **meccanismo**
installano la tabella che serve — quelle sui firmati usano `PROVA_FIRMATI`, la tabella
pubblicata con ogni riga riportata a `proposto` — e quelle sulla **tabella pubblicata**
derivano l'attesa da `A.APP`, da `contoApp()` e da `depositatoAl()`. `apparentamenti.js`
prova esplicitamente zero, uno e tre accordi in ciascuno dei tre stati, e il giorno del
termine con l'orologio congelato.

**Se una prova cade dopo la tua modifica, non toccarla: fermati e chiedi.** Vale anche
quando il rosso è legittimo — è la regola generale in CLAUDE.md, «Il confine dell'agente».

### La trappola dell'orologio

Se aggiungi o modifichi una prova, **le date delle fixture si scelgono rispetto a quello
che la prova chiede, non rispetto a oggi**. In `apparentamenti.js` gran parte del file gira
con l'orologio congelato alla **vigilia del 16 ottobre**: lì `giorniFa(3)` non è oggi meno
tre, è il 12 ottobre. E **un `deposito` in una fixture va datato prima del termine**, o dal 17
la convalida 17 lo ferma: si usa una data fissa ricavata dal termine — `gMeno(k)` in
`apparentamenti.js`, `primaDelTermine(k)` in `direzione.js` — e non «ieri».

E `npm run spazzola` esegue tutto il banco con l'orologio portato avanti: va rilanciata
dopo ogni modifica a una data.

---

## Che cosa ha trovato la regia

La prova di regia del 14 ottobre 2026, A con i cinque accordi lasciati firmati e B con i
cinque depositati il 16, all'orologio del 15, del 16 e del 17. Restano scritte qui perché
sono i modi in cui questo contratto, seguito alla lettera, sbagliava.

1. **Il lavoro notturno si sarebbe fermato dal 17.** Con i cinque depositati
   `apparentamenti.js` cadeva con cinque asserzioni su righe giuste; `npm run verifica` è il
   cancello del job. Chiuso in `00dfc27`.
2. **Una data sola riscriveva sedici punti della serie storica.** Con `data` = giorno del
   deposito cambiavano 16 punti fra il 10 settembre e il 12 ottobre a leva accesa, cioè nella
   vista predefinita; con `data` = giorno dell'annuncio ne cambiavano 16 a leva spenta. Da qui
   il campo `deposito`. Chiuso in `00dfc27`.
3. **Il 16 la riga di esito non nominava il termine**, con la leva accesa. Adesso dice «Il
   termine per depositarli è oggi … da domani gli accordi firmati e non depositati non contano
   più».
4. **Dal 17 la nota metodologica parlava al futuro** — «gli accordi saranno tutti noti», «si
   firmano fino al 16 ottobre» — e con i cinque depositati chiudeva con «non ne risulta firmato
   nessuno». Adesso ha tre rami: prima del termine, fra il termine e il silenzio, dopo.
5. **La nota della tendenza diceva «firmati dopo l'ultima rilevazione»** di accordi firmati
   prima e depositati dopo. Adesso il verbo segue la ragione: firmati, o depositati.
6. **L'anteprima resta indietro** finché il job non gira, e il job calcola in UTC: vedi
   «Che cosa si muove dopo». Non è un difetto: è come funziona, e va saputo quella sera.

---

## E se Wikipedia lo dicesse da sé? No

Verificato il 23 agosto 2026 sulle pagine dei sondaggi del **2020, 2021, 2022 e 2026**:
`surplus`, `vote-sharing`, `odafim` compaiono in **zero righe di tabella e zero paragrafi**.
Gli accordi stanno **nell'articolo principale dell'elezione**, in una sezione «Surplus-vote
agreements» che è prosa più una tabella di coppie **senza date**. Le firme di settembre e
ottobre 2026 sono arrivate dalle righe-evento della cronologia — «sign a surplus-vote
agreement» — e il **deposito** potrebbe non arrivare da nessuna parte: va cercato.

Quindi il percorso di questo file **è l'unico percorso**, e non c'è un secondo canale da
cui aspettarsi una conferma.
