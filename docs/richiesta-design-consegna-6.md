# Richiesta per la consegna 6 — Knesset 2026

Scritta il 22 agosto 2026, dopo aver verificato la consegna 5. Stesso schema dell'altra
volta: **i punti sono in ordine, non in parallelo.** Quando due non stanno insieme cede
quello più in basso, e vogliamo saperlo scritto.

Sono tre, non sette. Più una domanda che è nostra e una cosa che dichiariamo di non aver
verificato.

---

## Quello che non torna indietro

**La forma è quella giusta, e questa volta l'abbiamo verificata invece di crederle.**

- **I file generati sono davvero generati.** Abbiamo confrontato ogni valore con il ritorno
  della regola: **48 valori** in `tokens-colore.css` — venti liste per due temi più i quattro
  token di blocco — e **40 righe** in `palette-partiti.md`. **Zero scarti.** E la regola è
  deterministica fra due chiamate. È la lacuna della consegna 3, chiusa.
- **La capienza è sette**, in tutti e quattro i blocchi e in tutti e due i temi, senza
  saturare. Le nove liste che non avevano colore ce l'hanno: venti su venti.
- **I contrasti tengono col margine**, e i vostri numeri si riproducono esatti con la nostra
  colorimetria: testo sopra il colore **4,71 / 4,73**, su `--card` **3,58 / 4,35**, su
  `--paper` **3,37 / 4,73**, su `--wash` **3,28 / 4,05**. Nessuna lista sotto 4,65 né sotto
  3,15. Il margine non è speso da nessuna parte, come dite.
- **Il caso peggiore l'avete dichiarato prima che lo trovassimo noi**: la configurazione
  pre-fusione, opposizione a sei liste, minimo **7,2 in chiaro e 8,7 in scuro**, coppia
  `democratici`/`bennett26`. Riprodotto esatto. È la differenza fra una consegna che si
  difende e una che si spiega.
- **Le superfici sono intatte** (`knesset-theme.css` ha lo stesso sha256 della consegna 4),
  e sull'anello avete accolto la misura: 2px sui marchi da 14px in su, **niente anello sui
  seggi**.

Il resto di questo documento riguarda tre cose, e nessuna delle tre rimette in discussione
quanto sopra.

---

## 1 · La tinta annotata dev'essere quella misurata sull'esadecimale

**Vince sugli altri due**, perché è l'unico punto in cui la consegna dice qualcosa di falso
su sé stessa, e perché ripararlo ripara anche il resto.

Gli esadecimali sono giusti — l'abbiamo appena scritto. **Le tinte scritte accanto no.**
Misurate in OKLCH sull'esadecimale consegnato: **32 scostamenti su 40 superano i 5°, il
massimo è 29,8°.**

| | dichiarata | misurata | scarto |
|---|---|---|---|
| `--inc` chiaro `#E05800` | 72,5° | **43,3°** | 29,2° |
| Casa Sionista chiaro `#E06000` | 76° | **46,2°** | 29,8° |
| `--oppo` chiaro `#DC0336` | 1° | **20,9°** | 19,9° |
| Blu e Bianco chiaro `#C70052` | 349° | **8,9°** | 19,9° |
| I Democratici chiaro `#FF11A3` | 340° | **352,0°** | 12,0° |
| Ra'am chiaro `#007026` | 157° | **147,1°** | 9,9° |

**La causa è nel codice.** `colore(y, H, cap)` costruisce il colore da luminanza, tinta e
croma e restituisce `clamp(ok)`: il ritaglio in sRGB **ruota la tinta**, e la regola annota
quella richiesta invece di quella ottenuta. Lo si vede dal contro-esempio: il Likud sta
dentro il gamut e la sua tinta è esatta, 265,8° contro 265 dichiarati. Più il croma è alto,
più ruota.

**Il rimedio è una riga: `hex → OKLCH` a valle di `clamp()`**, e la tinta annotata diventa
quella misurata.

### Perché chiude anche il controllo di settore

Con la tinta letta a valle, il controllo comincerebbe a vedere `casa_sionista` a **46,2°**
invece che a 76°, e si accorgerebbe da solo di quello che abbiamo dovuto trovare noi:

- `casa_sionista` **46,2°** e `economico` **40,2°** stanno **sotto il pavimento di 58°**
  del settore dell'ago della bilancia;
- quindi «*archi reali 226°–304°, 340°–40°, 142°–192°, 58°–105°*» non regge: l'arco reale
  dell'ago della bilancia in chiaro è **40°–94°**;
- e il varco fra opposizione e ago della bilancia passa da 18° dichiarati a **12,2° reali**.

Va detto che **non rompe il pavimento del §2**: la coppia fra blocchi più stretta è
`byachad`/`economico` a ΔE **17,4**, sopra 11. È un errore di dichiarazione, non di
funzionamento — ma il settore disgiunto è la parte portante del §2, e oggi è scritto
sbagliato.

### E perché lo mettiamo per primo

**È la stessa forma del difetto della consegna 3, salita di un livello.** Là erano colori
tarati a mano con una regola scritta addosso; qui è una regola vera, la cui **descrizione
diverge dalla propria uscita**. Non si vede nei colori: si vede in ogni affermazione che la
consegna fa *sui* colori — i settori, le famiglie, le identità del §3 qui sotto. Una regola
che non sa che cosa ha prodotto non è verificabile da chi la riceve, ed è precisamente ciò
per cui abbiamo chiesto una regola.

---

## 2 · Il §1 dicromatico è ceduto, e non è dichiarato

Il §1 della richiesta chiedeva **due numeri, 15,6 e 4,2**, e diceva che vince su tutto. La
tavolozza chiusa li teneva tutti e due. Misurato da noi sulla stessa configurazione di
sedici liste coesistenti:

| | oggi | **revisione 5** | bersaglio §1 |
|---|---|---|---|
| ΔE dentro il blocco, chiaro | 7,9 | **12,0** | 15,6 |
| idem, scuro | 7,9 | **14,7** | 14,7 |
| **per un dicromate, chiaro** | 0,94 | **0,80** | 4,2 |
| **per un dicromate, scuro** | 1,37 | **0,39** | 4,5 |

**Il nominale sale, ed è un guadagno vero.** Il dicromatico scende **sotto il valore di
oggi**, in tutti e due i temi, e in scuro di **tre volte e mezzo**.

La coppia peggiore è `casa_sionista` / `unity_erdan` in tema scuro: **ΔE nominale 27,6, per
un protanope 0,39.** Due colori lontanissimi sulla carta e indistinguibili all'occhio che il
§1 metteva davanti a tutto.

**Ci serve sapere se è una cessione voluta.**

- **Se lo è**, va scritta al §5 e confrontata con ciò che il §1 chiedeva — perché il §1
  chiedeva anche il 4,2, non solo il 15,6.
- **Se non lo è**, è il difetto principale della consegna.

La tabella del vostro §3 lo lascia leggere: l'ago della bilancia in chiaro sta a **0,2** per
un dicromate già a cinque liste. Ma il §5, che è la sezione delle cessioni, **non lo nomina
mai.** La richiesta metteva il §1 sopra tutto e chiedeva, per ogni vincolo che non fosse
stato possibile tenere, **quale ha ceduto e di quanto, scritto e non dedotto da noi
misurando**. Il §2 lo avete dichiarato così, con i numeri. Questo no.

---

## 3 · Le due identità sono perdute tutte e due

La risposta dice: «*È il meccanismo che tiene il Likud azzurro-blu a 265°, i Democratici
rossi a 28° e Ra'am verde a 157°*». Misurato sull'esadecimale consegnato: Likud **265,8°**
tiene, Ra'am è a **147,1°** e non 157°, e **I Democratici escono a 352,0°** — `#FF11A3`, che
è magenta, non rosso.

**E si sono scambiati con Yisrael Beitenu**, che esce a **358,1°**, cioè rosso. Il giro
scorso avevamo perso il viola di Beitenu e tenuto il rosso dei Democratici; adesso sono
andati tutti e due, e ciascuno porta la tinta che era dell'altro. In tema scuro le due
distano **0,5° di tinta** (`#EE0B96` e `#FFCCE0`): restano distinguibili solo per chiarezza.

**Il meccanismo non è una garanzia.** `TINTA_STORICA` entra solo a parità di distanza entro
0,5, e in pratica non morde quasi mai: **diciassette liste su venti** si scostano dalla
propria tinta storica di oltre 6°, alcune di 50. Va benissimo come regola di spareggio —
**non va presentato come ciò che tiene le identità**, che è il posto in cui sta adesso, il
secondo della risposta.

Quindi: **o le identità si dichiarano perdute**, e allora lo diciamo noi in nota
metodologica, **o il meccanismo cambia** — un vincolo, non uno spareggio. Non chiediamo la
seconda: chiediamo che sia detto quale delle due.

---

## Una domanda che è nostra, non vostra: il criterio dell'anello

L'anello adesso dice una cosa, ed è la scelta giusta. Ma **il criterio non è derivabile dai
nostri dati**, e la differenza va decisa prima che finisca in legenda.

Dichiarate **otto** liste «senza seggi nella Knesset uscente». Nella nostra anagrafica il
campo `r22` è nullo per **dieci**: le due in più sono **`sionismo_rel` e `otzma`**, che nel
2022 correvano su una lista comune e hanno avuto seggi, ma non seggi *propri*.

Non è un errore vostro. È che «senza seggi» può voler dire **«senza seggi propri»** — e
allora sono dieci — oppure **«senza seggi affatto»** — e allora sono otto. Decidiamo noi, e
vi diciamo quale: serve perché altrimenti la legenda dirà una frase falsa per **due liste su
venti**, e sarebbe falsa in modo invisibile.

---

## Una cosa che dichiariamo di non aver verificato

Il tetto del §5 — «*il tetto del volume disponibile, misurato per ricottura ignorando ogni
vincolo fra blocchi, è 11,3 in chiaro nella coalizione e 13,0 fra le liste arabe*» — è
l'argomento su cui poggia tutta la risposta al §1: è la ragione per cui il 15,6 sarebbe
irraggiungibile.

**Non l'abbiamo riprodotto**, e lo diciamo invece di lasciarlo credere. Verificarlo non
vuol dire misurare la vostra uscita — quello lo abbiamo fatto — ma rifare la vostra
ottimizzazione, che è un'altra cosa e non ci compete. **È l'unica affermazione portante di
questa consegna che resta sulla vostra parola**, e va bene così: ma sappiate che lo
sappiamo, e che se il §2 qui sopra dice «cessione voluta» quel numero diventa la
giustificazione, e allora vorremo il metodo insieme al risultato.

---

## Che cosa ci aspettiamo indietro

1. la **tinta annotata letta a valle di `clamp()`**, e il controllo di settore rifatto su
   quella;
2. la **risposta sul §1 dicromatico**: cessione voluta e dichiarata, oppure difetto da
   riparare;
3. le **due identità**: dichiarate perdute, oppure il meccanismo cambiato;
4. se il §1 è una cessione voluta, il **metodo** con cui è stato misurato il tetto di 11,3 e
   13,0.

Il resto della consegna 5 sta in piedi, e non chiediamo di rifarlo.
