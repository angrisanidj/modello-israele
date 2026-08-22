# Richiesta per la consegna 5 — Knesset 2026

Scritta il 22 agosto 2026. **Non è un elenco di obblighi paritari.** Le tre consegne
precedenti ne hanno ricevuto uno, e ogni volta che due vincoli non stavano insieme avete
scelto voi quale sacrificare — in silenzio, e in modo diverso ogni volta. Qui i vincoli
sono **in ordine**, e l'ordine è la parte più importante del documento: quando due si
contraddicono, cede quello più in basso, e vogliamo saperlo scritto.

Prima però va sciolto un nodo che blocca tutto il resto.

---

## 0 · Nella cartella ci sono due consegne, e si contraddicono

`C:\Progetti\tema-nuovo-israele-rivisto`, tutti i file datati **22 agosto 2026, 09:45:08**.

| | **A · la regola** | **B · la tavolozza chiusa** |
|---|---|---|
| file | `colore-liste.js`, `regola-colore.md`, `knesset-theme.css`, `RISPOSTA-REVISIONE.md` | `tokens-colore.css`, `palette-partiti.md`, `RIEPILOGO-PALETTE.md`, `screenshot/` |
| forma | regola generativa, «revisione 4» | elenco chiuso di 26 esadecimali |
| coalizione | **blu → indaco**, settore 240°–330°, `--coal` `#043F69` | **blu → viola**, 228°–324°, `#014CD6` |
| opposizione | **verdeazzurro**, 186°–236°, `--oppo` `#037772` | **rosso → arancio**, 2°–56°, `#6E0224` |
| incerto | sabbia → ambra, 38°–102° | giallo → ocra, 64°–94° |
| secondo canale | nessuno | quattro pattern (pieno, anello, punto, tratteggio) |

`RISPOSTA-REVISIONE.md` descrive la A e non nomina mai la B; `RIEPILOGO-PALETTE.md`
descrive la B e non nomina mai la A. **Nessuno dei due dichiara che l'altro esiste**, e
gli screenshot mostrano la B.

**Prima domanda: quale delle due è la consegna?** Finché non lo sappiamo, ogni misura che
facciamo può essere sull'oggetto sbagliato.

---

## Che cosa chiediamo

**Una tavolozza costruita su una regola generativa che raggiunga la separazione dentro il
blocco della versione chiusa.**

Non i colori chiusi con una regola scritta addosso: **la regola prima, i colori che ne
discendono.** E lo diciamo perché è già successo — alla consegna 3 è arrivata una regola
scritta a posteriori su colori tarati a mano, e l'abbiamo scoperto verificandola, non
leggendola.

Che qui non sia traducibile lo abbiamo misurato, non supposto: le tinte della tavolozza
chiusa **non stanno su un reticolo** (coalizione a 230°, 257°, 266°, 286°, 310° — passi di
27, 9, 20, 24) e le luminanze **non formano bande** (in tema chiaro Y va da 0,040 a 0,263
nella coalizione e da 0,032 a 0,221 nell'opposizione: si sovrappongono tutte). Riesprimerla
come regola vorrebbe dire inventare la regola e spostare i colori perché ci ricadano, cioè
una consegna nuova.

### La ragione è operativa, non estetica

**L'8 settembre 2026 si depositano le liste.** Quella sera dobbiamo poter derivare da soli
il colore di una lista che non esiste ancora. Con una tavolozza chiusa siamo fermi.

E non è un problema futuro: **oggi nove liste su venti non hanno colore** nella tavolozza
chiusa.

| blocco | liste in anagrafica | con colore proprio | posti nella tavolozza | scoperte |
|---|---|---|---|---|
| coalizione | 5 | 5 | 5 | — |
| opposizione | 7 | **4** | 4 | `yesh_atid`, `bennett26`, `blue_white` |
| arabo | 4 | **2** | 2 | `hadash_taal`, `balad` |
| incerto | 4 | **0** | 2 slot generici | tutte e quattro |

`hadash_taal` e `balad` non sono liste ipotetiche: l'archivio le nomina in **138
rilevazioni su 165**.

### Il collaudo della regola: sette liste per blocco, non cinque

L'8 settembre l'opposizione può crescere, ed è già il blocco più stretto. Come nelle
consegne precedenti, **dichiarate il ΔE2000 garantito a cinque, sei e sette liste
coesistenti nella stessa banda**, nei due temi. Una regola che regge a cinque e cede a sette
non ci serve, perché è a sette che verrà usata.

---

## Che cosa non è in discussione: le superfici e i token di testo

**Tutto quello che non è colore di lista o di blocco resta com'è nella consegna 4.** Sedici
token: `--card`, `--paper`, `--wash`, `--hair`, `--hair2`, `--ink`, `--ink2`, `--mute`,
`--rule`, `--on-color`, `--acc`, `--acc-hi`, `--accw`, `--flag`, `--pos`, `--neg`.

Non è una preferenza, è la condizione che rende leggibili i numeri di questo documento:
**ogni contrasto qui dentro è misurato contro quelle superfici.** Se arrivano superfici
nuove — un `--card` diverso, un `--paper` diverso, un `--on-color` diverso — **tutti i
contrasti si spostano e la misura va rifatta da capo**, compresi quelli con cui giudichiamo
la tavolozza chiusa e quelli del pavimento qui sotto. Non è un aggiustamento: è un altro
documento.

Se ritenete che debbano cambiare, **ditelo esplicitamente e separatamente**, non insieme ai
colori di lista. Le superfici si discutono prima, e i colori si misurano dopo, contro
quelle nuove.

Una nota su `--acc` e `--flag`, che sono il blu della bandiera: valgono la stessa regola, e
in più sono l'unico blu della pagina che significa «stato attivo» invece che «blocco». Il
loro angolo di tinta è 262,9°, cioè dentro il settore che una delle due consegne assegna
alla coalizione: se le famiglie si riassegnano, va detto come si tiene distinto il blu del
comando da quello del blocco.

---

## I vincoli, in ordine di priorità

Quando due non stanno insieme, **cede quello più in basso, e va scritto quale e di quanto.**

### 1 · Liste distinguibili dentro lo stesso blocco — vince su tutto

È la priorità perché è il difetto che i lettori esterni segnalano: **non riconoscono i
partiti** nella tavolozza attuale. Conta più del resto.

Il bersaglio è quello che la vostra tavolozza chiusa raggiunge già, misurato da noi sulle
stesse undici liste:

| | oggi | **tavolozza chiusa** |
|---|---|---|
| ΔE2000 minimo dentro il blocco, chiaro | 8,1 | **15,6** |
| idem, scuro | 7,9 | **14,7** |
| minimo per un dicromate, chiaro | 2,1 | **4,2** |
| idem, scuro | **0,86–1,4** | **4,5** |

Quel raddoppio è la cosa che vogliamo tenere.

### 2 · Il blocco resta leggibile dal colore

Quattro famiglie di tinta **disgiunte**, e **ΔE2000 ≥ 11 fra liste di blocchi diversi**.
La tavolozza chiusa lo rispetta già: 22,2 in chiaro, 22,8 in scuro, con archi reali
coalizione 227°–310°, opposizione 6°–56°, arabo 156°–179°, incerto 67°–90°.

**Questo punto non cede.** In particolare non cede per un dicromate: la chiusa tiene ΔE
**9,9** in chiaro e **7,6** in scuro fra blocchi diversi, e quello è il pavimento.

### 3 · Contrasti

Nei due temi, a opacità piena:

- **ogni testo sopra un colore ≥ 4,50 con 0,15 di margine**, cioè **≥ 4,65**;
- **ogni colore ≥ 3:1 su `--card`**, e con lo stesso margine **≥ 3,15**.

**La tavolozza chiusa non ci arriva, e i numeri non sono quelli dichiarati.** Misurati da
noi prendendo per ogni colore il migliore fra `--on-color` e `--on-color-inv`:

| | dichiarato | misurato | dove |
|---|---|---|---|
| testo sopra il colore | 4,65 | **4,54** | `democratici` scuro `#CB4F72` |
| | | 4,55 | `sionismo_rel` scuro `#5674DB` |
| | | 4,59 | `byachad` chiaro `#CE6304` |
| colore su `--card` | 3,35 | **3,36** | `shas` chiaro `#0197C7` |
| colore su `--paper` | 3,35 | **3,16** | idem |
| token di blocco su `--card` | — | **3,35** | `--inc` chiaro `#AE8710` |

Sopra 4,50 e sopra 3,00, ma sotto il margine. Va corretto.

### 3-bis · I quattro token di blocco, che non sono un dettaglio della vista per lista

`--coal`, `--oppo`, `--arab`, `--inc` sono lo **slot 0 di ogni blocco**, e se le famiglie
si riassegnano cambiano anche loro. Non è una conseguenza secondaria: quei quattro colori
compaiono in **otto punti della pagina**, e solo uno è la vista per lista.

1. l'**emiciclo nella vista per blocco**, seggio per seggio;
2. i **totali di blocco** al centro dell'emiciclo, che sono testo colorato;
3. le **legende di blocco**, sotto l'emiciclo e nel simulatore;
4. le **quattro barre di probabilità** — maggioranza Netanyahu, maggioranza opposizione,
   maggioranza solo con i partiti arabi, stallo;
5. i **due istogrammi** «Quanti seggi per ciascun blocco» e le pastiglie delle loro testate;
6. le **pastiglie di blocco** accanto a ogni lista nelle tabelle della proiezione e dei
   movimenti;
7. due **colonne del backtest**;
8. il **tratteggio dei marcatori** nel grafico della tendenza, che usa `--inc`.

**Devono rispettare gli stessi contrasti del punto 3** — testo sopra il colore ≥ 4,65,
colore ≥ 3,15 su `--card` — **e restare distinguibili fra loro**, perché la vista per
blocco oggi funziona e non deve regredire.

#### Il pavimento: i numeri di oggi

Contrasti (`--oppo` chiaro e `--coal` scuro sono i due minimi):

| | `--card` | `--paper` | `--wash` | testo sopra |
|---|---|---|---|---|
| **chiaro**, minimo | **4,70** (`--oppo` `#018279`) | 4,42 | 4,30 | **4,70** |
| **scuro**, minimo | **4,69** (`--coal` `#3A7CFE`) | 5,09 | 4,36 | **5,09** |

Distanza fra i quattro, sulle sei coppie:

| | nominale | deuteranopia | protanopia | tritanopia | scala di grigi |
|---|---|---|---|---|---|
| **chiaro**, minimo | **31,1** | 12,4 | **5,7** | 15,9 | **6,1** |
| **scuro**, minimo | **38,2** | 13,3 | **11,9** | 23,1 | **7,4** |

E limitandosi ai **tre blocchi che stanno davvero in aula** — `incerto` oggi non ha seggi —
il minimo su tutte e quattro le visioni è **15,9** in chiaro e **23,1** in scuro.

Due letture oneste di questa tabella, perché non venga usata come un bastone:

- il **5,7** in chiaro è `arabo`/`incerto` in protanopia, ed è **già oggi** il punto debole.
  Non chiediamo di migliorarlo, chiediamo di non peggiorarlo — ed è esattamente la stessa
  coppia che la vostra tavolozza chiusa dichiara a 6,6. Su quel numero siete già avanti;
- la **scala di grigi a 6,1 e 7,4** è invece qualcosa che oggi c'è e che il punto 5
  autorizza a perdere sulle **liste**. Sui **token di blocco** chiediamo di tenerla, perché
  è la vista per blocco a essere l'ultima linea: se il colore di lista smette di dire il
  blocco in bianco e nero, il colore di blocco deve continuare a dirlo.

### 4 · Il verde per le liste arabe

**Non negoziabile.** La chiusa lo rispetta (`#317C53` a H 156,5°, `#07463C` a 178,6°) e non
ricade nel difetto della consegna precedente, dove `--arab` `#202E00` aveva luminanza 0,0226
e si leggeva nero invece che verde.

### 5 · Le bande di luminanza cedono

Se separare le liste dentro il blocco richiede di abbandonare le bande, **si abbandonano.**

Accettiamo, sapendo cosa accettiamo: nella tavolozza chiusa, in scala di grigi, il ΔE
minimo fra liste di **blocchi diversi** è **0,4** in chiaro e **0,0** in scuro — `likud` e
`yashar` diventano lo stesso identico grigio — con **7 e 6 coppie su 38** sotto ΔE 3.
Oggi quel minimo è 6,0 e 7,4, con zero coppie sotto 3.

Due precisazioni che fanno parte della decisione:

- **a livello di blocco il grigio regge ancora** (token di blocco a ΔE ≥ 8,7 in chiaro): a
  cedere è la vista **per lista**, dove il colore è l'unico portatore;
- **questo punto cede, il punto 2 no.** Il blocco può smettere di leggersi in bianco e nero;
  **non** può smettere di leggersi per un dicromate.

---

## Gli altri rilievi

Ciascuno col numero misurato. Non sono vincoli nuovi: sono cose da sistemare o da dichiarare
nella prossima consegna.

### 1 · La regola non passa, e lo dite voi stessi

`test/misura-consegna.mjs` su `colore-liste.js`:

```
NON PASSA  ΔE2000 ≥ 7,5 fra liste coesistenti dello stesso blocco
           78 coppie · minimo 3,7 (blue_white/beitenu, chiaro) · 20 coppie sotto soglia
NON PASSA  una famiglia di tinta per blocco, nessun grigio
           bennett26/scuro respinto, croma 0,0424
[1]        cinque colori fuori dalla banda dichiarata, in tema scuro
```

**3,7 contro i 7,88 di oggi**: presa così, la regola è una regressione sulla proprietà che
questo progetto misura da tre consegne. `RISPOSTA-REVISIONE.md` lo dichiara e chiede una
decisione sull'opposizione a sei liste — la risposta è che quella decisione è **il punto 1**
qui sopra, e la soluzione non è ridurre la capienza né mettere il tratteggio sulla quinta e
sesta lista: è una regola diversa.

### 2 · Il tratto dell'anello non è dichiarato

Il pattern «anello» c'è, ma **nessun file dice quanto è spesso il tratto**, ed è tutto il
problema, perché il nostro seggio è piccolo. Misurato su browser sulla pagina vera: il
seggio è `r = 5,4` in un `viewBox` da 430, reso **15,07px di diametro a 1265px** e
**8,19px a 380px**.

| tratto | reso a 1265 | reso a 380 | inchiostro rimasto |
|---|---|---|---|
| 1,2 unità | 1,67px | **0,91px — sotto il pixel** | 40% |
| 1,5 unità | 2,09px | 1,14px | 48% |
| 2,0 unità | 2,79px | 1,52px | 60% |

E il contrasto. Il tratto in sé conserva il contrasto del pieno (≥ 3,36), ma quello che
l'occhio vede su un disco da 8px è il colore **mescolato al fondo in proporzione
all'inchiostro che resta**:

| | tratto 1,5 | tratto 2,0 | i pieni, per confronto |
|---|---|---|---|
| chiaro | **1,76** (`altri A`) | 2,08 | 3,36 |
| scuro | **1,84** (`democratici`) | 2,25 | 4,19 |

Sotto 3 in ogni caso. E da mettere in conto: **col filtro dell'emiciclo attivo i seggi non
selezionati vanno a `opacity: .22`** — un anello a 0,22 su otto pixel non è più niente.

Serve la larghezza del tratto, e la verifica che a 380px regga.

### 3 · I pattern non dicono niente al lettore

Sono assegnati per rompere le quindici coppie che il daltonismo avvicina, e come
disambiguatori funzionano. Ma:

- **per blocco l'assegnazione è muta**: coalizione `[pieno pieno pieno anello anello]`,
  opposizione `[anello anello pieno pieno]`, arabo `[pieno anello]`, incerto
  `[pieno anello]`. Non c'è nessuna regola che il lettore possa dedurre, e **un anello
  accanto a un pieno chiede di essere interpretato**. Nell'emiciclo per lista si vedono
  sei serie vuote su tredici: è la prima domanda che un lettore si fa, e la risposta è «non
  vuol dire niente»;
- **il quarto pattern non lo usa nessuno**: pieno 6, anello 6, punto 1, **tratteggio 0**.

O il pattern porta un significato che il lettore può leggere, o va dichiarato in legenda che
non ne porta.

### 4 · Yisrael Beitenu ha perso il viola

Era un'identità dichiarata. Nella tavolozza chiusa è `#712F17` a **H 39,6°** in chiaro e
`#FED0C3` a **36,3°** in scuro — un marrone e un rosa-pesca, dentro la famiglia
rosso→arancio dell'opposizione.

**Non è una taratura, è una conseguenza strutturale**: il viola è stato dato alla coalizione
(`utj` 286°, `otzma` 310°), quindi per Yisrael Beitenu non ne restava. Se l'identità va
mantenuta, la scelta da rifare è l'assegnazione delle famiglie, non il singolo colore.

*(«I Democratici rossi» invece regge: `#6A0026` a H 10,3° e `#CB4F72` a 5,8°.)*

---

## Come misuriamo, così potete rifarlo voi

- `node test/misura-consegna.mjs <cartella>` — contrasti, ΔE dentro e fra i blocchi, salti
  fra bande, i cinque vincoli di non regressione, e la verifica che i colori consegnati
  ricadano davvero nella regola dichiarata;
- `node test/misura-consegna.mjs <cartella> --colori` — dicromazia sulle coppie coesistenti;
- le simulazioni usano le matrici di **Viénot, Brettel e Mollon** su RGB lineare. Voi usate
  **Machado 2009**: sui blocchi i due metodi coincidono a meno di mezzo punto (il vostro
  17,8 in chiaro lo riproduciamo esatto, il 14,6 in scuro ci dà 14,1), quindi la differenza
  non spiega nessuno degli scarti segnalati qui sopra.

## Che cosa ci aspettiamo indietro

1. **quale delle due consegne è la consegna** (§0);
2. **una regola generativa** e i colori che ne discendono, non il contrario;
3. il **ΔE garantito a cinque, sei e sette liste** per blocco, nei due temi;
4. i **quattro token di blocco** che ne discendono, con contrasti e distanze reciproche
   misurati contro il pavimento del §3-bis;
5. per ogni vincolo che non è stato possibile tenere, **quale ha ceduto e di quanto** —
   scritto, non dedotto da noi misurando;
6. la **larghezza del tratto** dell'anello, se il secondo canale resta;
7. se ritenete che le **superfici** debbano cambiare, ditelo **separatamente e prima**: con
   superfici nuove ogni numero di questo documento va rimisurato.
