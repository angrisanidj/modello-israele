# I quattro blocchi senza prosa — condizione, grandezze, che cosa la frase deve dire

Scritto il 23 agosto 2026. I testi del titolo sono stati applicati il 22; restano **senza
prosa dettata dall'autore** quattro blocchi: il **verdetto**, le **pastiglie**, gli
**istogrammi** e il **simulatore**. Oggi ciascuno ha una frase generata, scritta da chi
scriveva il codice: funziona, dice cose vere, e non è la voce del giornale.

Questo file serve a scriverla senza riderivare niente. Per ogni blocco: **in quali
condizioni si trova**, **quali grandezze sono già calcolate e a che prezzo**, e **che cosa
la frase deve dire** in ciascuna condizione. È la stessa forma di
[forme-del-titolo.md](forme-del-titolo.md).

**Va letto insieme a una cosa che il 22 agosto non c'era**: la leva degli apparentamenti.
Verdetto e pastiglie adesso possono muoversi **perché il lettore ha premuto un pulsante**,
non perché sia arrivato un sondaggio — e in un punto lo fanno in modo asimmetrico. Sta nel
§1, ed è la cosa più importante del file.

---

## 0 · Le grandezze, e i loro tranelli

Tutte disponibili al momento in cui le quattro frasi si scrivono. Il prezzo è già pagato:
nessuna di queste chiede un giro in più sulle 20.000 simulazioni.

| grandezza | che cos'è | il tranello |
|---|---|---|
| `SEG` · `blocchi(SEG)` | la proiezione, per lista e per blocco | somma **sempre** 120 su **quattro** blocchi: c'è l'ago della bilancia, e quando prende seggi «opposizione + arabi» può non arrivare a 61. **Dal 28 agosto ne prende cinque**: non è più un caso di scuola |
| `MC.vC` `MC.vO` `MC.vA` `MC.st` su `MC.n` | i quattro esiti delle simulazioni | sono una **partizione**: sommano `MC.n`. Le percentuali in pagina passano da `pctInteri()`, che le arrotonda a interi che fanno 100 |
| `MC.coal` · `MC.oppz` | i seggi di blocco simulati, **già ordinati** | ordinati ciascuno per conto suo: `MC.coal[s]` e `MC.oppz[s]` **non sono la stessa simulazione**, e sommarli non ha senso |
| `q(arr, p)` | il quantile | `q(...,.10)`/`q(...,.90)` è la banda dell'80% che la pagina già dichiara |
| `freqEsatta(arr, x)` | quante simulazioni danno **esattamente** x seggi | doppia bisezione, **0,036 ms**: è quella che alimenta `[P]` nel titolo. Non aggiungere un istogramma nel ciclo, sarebbe una seconda strada |
| `MC.primo` | per lista, in quante simulazioni è primo partito | al 30 agosto Yashar 56,2% contro Likud 43,8%: **è una gara, e la proiezione centrale la vince l'altro** |
| `MC.d` · `MC.sotto` | distribuzione per lista, e quante volte sotto soglia | la sola sorgente per «rischia lo sbarramento» |
| `PREC` | la proiezione di sette giorni fa: `{seg, n, taglio, data, mc}` | **`taglio` e `data` sono due campi distinti**, vedi §1 |
| `SOGLIE.coalizione` · `SOGLIE.opposizione` | punti di swing che servono per toccare 61 | `null` vuol dire «più di 12 punti», cioè fuori scala: non è zero |
| `ORIZZONTE` · `GIORNI` | distanza voto-ultima rilevazione · giorni al voto | al 30 agosto 61 e 58, e **divergono**: dal 28 ottobre `GIORNI` è 0 e `ORIZZONTE` resta fermo. Nessuna frase sull'incertezza deve usare `GIORNI` |
| `L.length` · `SOND.length` | rilevazioni nel modello · in archivio | 45 su 182 al 30 agosto: la finestra è 60 giorni e 45 rilevazioni al massimo |
| `JOB` → `#k-upd` · `#k-fresh` | ultima **verifica riuscita** · ultimo **sondaggio** | due date diverse, con due soglie: `GAP_VERIFICA` 2 giorni, `GAP_SONDAGGI` 7. Se il registro manca, la testata **dichiara di non sapere** invece di ripiegare |
| `contoApp(sopraSoglia())` | `{dep, ann, oltre, termine, scarti}` | quanti accordi sono depositati, quanti solo annunciati, e se il termine del **16 ottobre** è passato |
| `COALS` · `vietato()` | coalizioni possibili e veti | il simulatore ci legge i conflitti |
| `acc()` `inPc()` `seg()` `ed()` `f()` `dl()` `pc()` `frazione()`/`FRAZ` | le regole di lingua | singolare/plurale, «nell'8,5%», «1 seggio», «ed è» — **si chiamano, non si riscrivono**: è la regola pagata tre volte |

**E una regola che vale per tutte e quattro le frasi**: niente tempo scritto a mano
(invariante 10), e nessun valore che arrivi allo schermo per due strade senza una prova che
le leghi.

---

## 1 · Il verdetto — `#k-verdetto` e `#k-direz`

Due elementi vicini che raccontano due cose diverse: **dove siamo** (`k-verdetto`, prosa
sotto le pastiglie) e **come ci siamo mossi** (`k-direz`, il riquadro «La direzione del
modello»).

### La cosa da sistemare prima delle parole — CHIUSA il 23 agosto 2026

Era: con la leva degli apparentamenti accesa il riquadro attribuiva ai sondaggi un
movimento causato dal lettore, perché `PREC` girava con `dhondt(qp, taglio)` e un accordo
annunciato dopo il taglio entrava in un solo termine. **Adesso `PREC` gira con i parametri
di adesso**, e la frase «a parametri identici» si scrive solo se le due firme coincidono.
La storia sta in CLAUDE.md, «A parametri identici era falso per una leva su sei».

**Quello che resta e che riguarda le parole**: con l'accordo acceso il riquadro non dice
più «invariato», dice **−1 al blocco Netanyahu e +1 all'opposizione**, e adesso è vero —
la settimana ha spostato il seggio dell'accordo da un blocco all'altro. La frase deve
poter reggere un movimento di questo tipo, che non è un errore ma non è nemmeno un
sondaggio nuovo.

E **la fine della linea della tendenza resta indietro rispetto alla testata** quando un
accordo è annunciato dopo l'ultima rilevazione: 51 contro 50, perché la serie ricalcola
ogni punto con gli accordi noti a quel giorno. Lo dichiara `notaSerie()`, sotto il
grafico. Se la prosa del verdetto nomina la linea, deve sapere che le due letture sono
diverse **di proposito**.

### Le condizioni, e che cosa la frase deve dire

| # | condizione | grandezze | che cosa la frase deve dire |
|---|---|---|---|
| V1 | `PREC` esiste e nessun blocco si muove | `blocchi(SEG)` = `blocchi(PREC.seg)` | che la settimana **non ha cambiato niente**, e che è un'informazione: sette giorni di sondaggi che confermano |
| V2 | un blocco si muove di 1-2 seggi | i due `blocchi()`, `mossi[]` | che cosa si è mosso e **quanto pesa**: uno o due seggi sono dentro l'errore dichiarato (1,7 nell'ultima settimana, 4,5 a due mesi) |
| V3 | un blocco attraversa 61 | i due `blocchi()`, `MC.vC`/`MC.vO` | che la settimana ha cambiato **il verdetto**, non i numeri: è l'unica volta in cui il movimento è la notizia |
| V4 | le probabilità si muovono più dei seggi | `MC.vX/MC.n` contro `PREC.mc.vX/PREC.mc.n` | che i seggi possono stare fermi mentre la probabilità si sposta — succede quando la proiezione si avvicina alla soglia senza attraversarla |
| V5 | `PREC` non esiste | — | che **non c'è niente da confrontare**, e perché: meno di sette giorni di archivio, o una settimana senza rilevazioni. Oggi il ramo esiste già e va bene |
| V6 | **il movimento ha una causa che non sono i sondaggi** | `contoApp()`, `blocchi(PREC.seg)` | che cosa l'ha prodotto: la frase deve nominare la causa, o attribuisce a sette giorni di sondaggi una cosa che i sondaggi non hanno fatto |
| V7 | dopo il voto | `GIORNI` = 0, `#k-postvoto` | la frase parla **al passato della propria stima** e non del risultato, che il modello non ha (punto 8-bis) |

**V6 non è più solo la leva, e questa riga è stata riscritta il 30 agosto 2026.** Era «leva
degli apparentamenti accesa», cioè un caso solo: il lettore preme e i numeri si muovono. Ma
la classe è più larga — **il riquadro confronta due esecuzioni del modello, e fra le due può
essere cambiato qualcosa che non è un sondaggio** — e il secondo caso è **vivo adesso**:

> `#k-direz` oggi dice **Blocco Netanyahu 49 −2 · Opposizione sionista 54 −3 · Ago della
> bilancia 5 +5**, e la causa non è una leva: è **Popolo d'Israele che ha attraversato la
> soglia il 28 agosto**. Un blocco è passato da zero a esistere, e gli altri due hanno perso
> i seggi che quella lista ha preso.

**Sono due cause con la stessa firma e conseguenze diverse per la prosa.** La leva è
reversibile e la governa il lettore: la frase può dire «se togli l'ipotesi torna com'era».
L'attraversamento della soglia no — è un fatto dei dati, e la frase deve dirlo come una
notizia, non come un'ipotesi. **Una frase scritta per la sola leva direbbe la cosa sbagliata
proprio nel caso che oggi si vede in pagina.**

E c'è un terzo caso della stessa classe, che oggi non si vede ma esiste: **una lista che cade
sotto soglia** fra le due esecuzioni. Lì i seggi si ridistribuiscono fra tutte le liste
rimaste — è la meccanica che `#k-soglianota` adesso spiega — e il riquadro mostrerebbe più
blocchi che si muovono insieme senza che nessun istituto abbia pubblicato niente di nuovo.

**Le due date di `PREC`, che è l'altra cosa da non sbagliare.** `PREC.taglio` è **il
confine**: oggi meno sette giorni, sempre, e non dipende dai dati. `PREC.data` è **l'ultimo
sondaggio che cade dentro** il vecchio insieme. Oggi coincidono — 16 agosto tutt'e due —
e la frase «la proiezione di sette giorni fa era costruita su 45 rilevazioni, l'ultima del
16 agosto» è vera per caso. **Divergono appena non esce nessun sondaggio il giorno del
taglio**, e allora il confronto è con una proiezione più vecchia di sette giorni: è quella
la data che il lettore deve leggere, con il taglio accanto se le due si separano.

### Che cosa c'è adesso

`k-verdetto` (in `rProb`) dice: proiezione centrale dei due blocchi, banda dell'80% di
ciascuno, primo partito con la sua frequenza, lo scenario prevalente, e i punti di swing
che servirebbero a ciascun blocco per arrivare a 61. È molto, ed è tutto vero; quello che
manca è una gerarchia — oggi le cinque cose pesano uguale.

---

## 2 · Le pastiglie — `#k-probs` e `#k-sprobs`

Quattro riquadri con un titolo, una percentuale, una barra e una riga di spiegazione. La
riga di spiegazione è il testo da scrivere: oggi dice **chi compone il blocco**, e potrebbe
dire **che cosa significherebbe**.

Le quattro sono una **partizione** delle simulazioni, e questo vincola la prosa: non
possono sovrapporsi, non possono lasciare buchi, e le quattro percentuali fanno 100 per
costruzione (`pctInteri`). Al 30 agosto valgono **1 · 15 · 77 · 7**, ed erano 2 · 21 · 75 · 2 il giorno in cui questo file è stato scritto: **la quarta è più che triplicata**, perché l'ago della bilancia ha preso cinque seggi e quei cinque mancano a «opposizione + arabi».

| # | pastiglia | condizione | che cosa la riga deve dire |
|---|---|---|---|
| P1 | Maggioranza al blocco Netanyahu | `coal ≥ 61` | che è **il governo uscente che si conferma**, e con chi: cinque liste, e la coalizione esiste già |
| P2 | Maggioranza all'opposizione sionista | `oppo ≥ 61` **senza** arabi | che è la coalizione del 2021 senza il pezzo che l'ha fatta cadere: quattro liste che non hanno mai governato insieme in questa forma |
| P3 | Maggioranza solo con i partiti arabi | `oppo + arabi ≥ 61`, `oppo < 61` | che **non è una coalizione, è una condizione**: l'appoggio arabo può essere esterno, e nessun leader del centro l'ha accettato apertamente. È il caso più probabile oggi, ed è quello che la stampa italiana capisce peggio |
| P4 | Nessuna maggioranza possibile | nemmeno `oppo + arabi` arriva a 61 | che i seggi mancanti sono **dell'ago della bilancia**, e che l'esito è una quarta elezione. Non dire «stallo» senza dire di chi sono i seggi che mancano |

**Tre cose da sapere prima di scriverle.**

- **Una pastiglia sopra il 50% non è una previsione.** P3 oggi vale il 75%: la frase deve
  reggere il fatto che il caso più probabile è **l'assenza di un vincitore**.
- **Le quattro si muovono con la leva degli apparentamenti**: a leva accesa oggi diventano
  1,7 · 19,4 · **77,0** · 1,8. Non cambia la lettura, ma cambia il numero che il lettore
  vede accanto a una frase che non nomina la leva.
- **La forma corta esiste**: `#k-sprobs` scrive «Netanyahu 2%» in testata. Sono **due
  strade per lo stesso dato** — è l'idioma delle schede dell'house effect — e se la prosa
  cambia il modo di nominare i quattro casi, i due nomi vanno cambiati insieme.

---

## 3 · Gli istogrammi — `#k-cap1` e `#k-cap2`

Due didascalie sotto i due istogrammi di blocco. Oggi dicono: che cos'è la distribuzione,
che cosa è in evidenza, dove sta il triangolo della proiezione centrale, dove la mediana, e
— quando i due valori divergono — **perché** divergono (soglia e d'Hondt non sono lineari).
Quella spiegazione è la parte migliore delle quattro frasi esistenti e va tenuta.

| # | condizione | grandezze | che cosa la frase deve dire |
|---|---|---|---|
| I1 | proiezione centrale = mediana simulata | `blocchi(SEG)`, `q(MC.coal,.50)` | che il grafico e il numero grosso dicono la stessa cosa |
| I2 | divergono | le due, più la ragione | quello che dice già: la mediana degli esiti non è l'esito calcolato sulla media. È l'unica frase del modello che spiega un meccanismo, e vale la pena tenerla in italiano piano |
| I3 | il blocco è lontano da 61 | `q(.10)`, `q(.90)`, `MC.vC/vO` | **quanti seggi mancano**, e mancano rispetto alla **mediana simulata** — `61 − q(MC.coal,.50)` — non rispetto a `blocchi(SEG)`: è la stessa grandezza che l'istogramma disegna |
| I4 | il blocco è a ridosso di 61 | `freqEsatta(MC.coal, 60)` e `(…, 61)` | che **un seggio decide**, con la frequenza dei due valori accanto: è il caso in cui l'istogramma serve davvero |
| I5 | la banda dell'80% attraversa 61 | `q(.10) < 61 ≤ q(.90)` | che l'incertezza **contiene tutt'e due gli esiti**, e che non è un pareggio: la probabilità sta scritta nella pastiglia sopra |
| I6 | swing o affluenza attivi | `SW`, `AFF` | che quello che si sta guardando è **uno scenario**, non la proiezione. Oggi lo dice `#k-simn` in un angolo |

**Il vincolo che la didascalia non può violare**: il disegno ha ora due fasce di margine e
il testo non entra più nell'area delle barre. Una didascalia più lunga di due righe a 380px
rimangia i 44px di verticale guadagnati in agosto — si misura, non si stima.

---

## 4 · Il simulatore — `#k-gnote`

La riga sotto la barra di «Costruisci una maggioranza». È l'unico dei quattro blocchi in
cui **il lettore ha fatto qualcosa**, e la frase deve rispondere a lui, non descrivere il
modello.

| # | condizione | grandezze | che cosa la frase deve dire |
|---|---|---|---|
| S1 | nessuna lista selezionata | `tot = 0` | che cosa fare, in una riga. Oggi: «Seleziona le liste per comporre una maggioranza» |
| S2 | `tot ≥ 61`, nessun veto | `tot`, `tot − 60` | che la maggioranza **c'è**, e con quanto margine — un seggio di margine e undici sono due notizie diverse |
| S3 | `tot < 61` | `61 − tot` | quanti **ne mancano**, e da quale lista potrebbero arrivare: `SEG` ordinato dice quale singola lista chiuderebbe il conto |
| S4 | veti violati | `vietato(a,b)` | **quale** veto e **chi** l'ha dichiarato: un veto è un fatto con una fonte, come un apparentamento. Oggi la riga li elenca senza dire da dove vengono |
| S5 | selezione con liste arabe senza `gov` | `P[i].b === 'arabo' && !P[i].gov` | quello che dice già: la maggioranza reggerebbe **solo con appoggio esterno**. È la distinzione che P3 introduce, e qui torna sul caso concreto |
| S6 | la selezione è una scorciatoia | `PRESET`, confronto degli insiemi | che quella composizione **ha un nome** — «è il blocco Netanyahu» — e che il nome vale finché la selezione è quella: la scorciatoia si accende e si spegne da sé |
| S7 | leva apparentamenti accesa | `SEG` con gli accordi | i numeri sulle pastiglie del simulatore sono i seggi **di quello scenario**: se la frase cita un totale, cita quello |

**Due cose che la frase non deve fare.** Non deve **giudicare** una coalizione plausibile o
implausibile: il modello conta i seggi, i veti li dichiarano i partiti. E non deve
contraddire la barra — verde e «sotto quota 61» insieme è il difetto che la verifica a
scenari cerca apposta.

---

## Come si chiude

Un blocco è fatto quando **ogni riga della sua tabella ha un testo**, i testi passano dalle
regole di lingua invece di riscriverle, e una prova lega ogni numero citato alla grandezza
da cui viene — come `titolo.js` fa con `[P]`. Prima di scrivere: il §1 chiede una decisione
sul confronto a leva accesa, e va presa dall'autore, non dal codice.
