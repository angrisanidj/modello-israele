# La regola del colore — Knesset 2026

Non una tavolozza: una funzione. Il colore di una lista dipende da tre cose — **blocco**,
**slot** dentro il blocco, **tema** — e da nient'altro. Il codice eseguibile è
[`dati/colore-liste.js`](../dati/colore-liste.js); questo documento è la specifica che
quel codice implementa. L'8 settembre, quando le liste si chiudono, il colore di una lista
nuova si ricava chiamando la funzione, non scegliendolo a mano.

La regola arriva da Design, revisione 4. Da allora sono cambiate quattro cose, tutte
misurate e tutte dentro i vincoli già verificati: l'**obiettivo** della scelta dei punti,
che è diventato a cascata (§4); la **posizione** dei settori di tinta, ridistribuita per
dare respiro ai confini fra famiglie (§2); l'**ancora della coalizione**, riportata verso
il blu bandiera; e lo **scambio fra la prima e la seconda banda**, che ha portato il blu
nella banda più scura e il verde nella seconda (§1). **Gli intervalli delle bande, le
larghezze dei settori e le famiglie non sono mai stati toccati.**

Due proprietà da cui dipende il resto:

- **Stabile.** Dare un colore a una lista nuova non sposta i colori già assegnati.
- **Verificabile.** Ogni vincolo è una disuguaglianza misurabile sul risultato.
  `node test/misura-consegna.mjs` rifà l'intero conto sul rendering vero, non sui token.

---

## 1. Bande di luminanza

Il blocco è detto dalla **luminanza**, non dalla tinta: è la sola proprietà che
sopravvive alla stampa in bianco e nero, alla fotocopia e al daltonismo.

| Banda | Blocco | Chiaro (L) | Scuro (L) |
|---|---|---|---|
| 1 | coalizione (Netanyahu) | 0,0176 – 0,0229 | 0,2046 – 0,2248 |
| 2 | arabo | 0,0456 – 0,0608 | 0,3098 – 0,3673 |
| 3 | ago della bilancia | 0,0951 – 0,0979 | 0,4964 – 0,5072 |
| 4 | opposizione sionista | 0,1438 – 0,1747 | 0,6795 – 0,7961 |

Bordi adiacenti a **≥ 1,309** in forma WCAG `(L₁+0,05)/(L₂+0,05)`, misurati fra i bordi e
non fra i centri. Il margine sopra 1,30 non è decorativo: assorbe l'arrotondamento a 8 bit,
che può mangiare fino a 0,009 di salto. Sui colori effettivamente consegnati il salto
minimo misurato è **1,3020**.

L'ordine delle bande non è semantico ma strutturale: tiene verde e verdeazzurro — che
distano appena 50° — in bande non adiacenti.

**Perché il blu sta nella banda più scura e il verde nella seconda.** Non è una scelta di
ΔE, è di significato. La luminanza pesa 0,7152 sul verde e 0,0722 sul blu: un verde saturo
è intrinsecamente chiaro, un blu saturo intrinsecamente scuro. Nella banda 1 il verde
arrivava a croma 0,070 e `--arab` era `#202E00`, che non si legge come verde ma come nero —
e il verde per le liste arabe è una convenzione a cui non si rinuncia. Il blu quella banda
la regge, perché è naturalmente scuro: `--coal` è `#00226E`, croma 0,137.

Il prezzo, accettato e misurato: il blocco della coalizione scende da 15,1 a **12,4** e la
distanza fra blocchi diversi da 16,5 a **13,5**. Entrambe restano sopra soglia. In cambio
il blocco arabo sale da 8,7 a **14,0**.

## 2. Famiglie di tinta

Un settore per blocco, disgiunti, angoli **OKLCH**. Attenzione: in HSL gli stessi colori
cadono 40–50° più in basso. Sono due spazi diversi e confrontare gli angoli dell'uno con i
settori dell'altro non significa niente.

| Blocco | Settore | Ampiezza | Posti |
|---|---|---|---|
| arabo — verde | 116° – 173° | 57° | 4 |
| opposizione — verdeazzurro | 186° – 236° | 50° | 6 |
| coalizione — blu → indaco | 251° – 341° | 90° | 6 |
| ago della bilancia — sabbia → ambra | 38° – 102° | 64° | 4 |

**Separazioni fra settori adiacenti**: 14° · 13° · 15° · 57°, minimo **13°**. Prima erano
23° · 4° · 4° · 68°, minimo 4°: arabo e opposizione, e opposizione e coalizione, erano
separate da una frontiera che di fatto non c'era. Le larghezze non sono cambiate, sono
cambiate le posizioni: i 99° liberi stavano tutti nell'arco magenta-rosso, dove non abita
nessuna famiglia, e ora sono distribuiti sui tre confini che contano. Il quarto resta
grande per la stessa ragione: fra l'indaco e la sabbia non c'è nessuno.

**L'ancora della coalizione è stata riportata verso il blu bandiera.** Stava a 241,6°,
cioè ventun gradi sotto il blu della bandiera `#0038B8` (262,9°) e verso il ciano: era la
tinta meno blu del suo settore. Ora sta a **262,2°**, e il croma passa da 0,092 a 0,137.
Il vincolo d'ancora serve a impedire che `--coal` diventi magenta, non a congelare un
valore: qui il riancoraggio avvicina il token alla sua famiglia, non lo allontana.

I punti non si appoggiano mai al bordo: la tinta realizzata slitta fino a 0,75° con
l'arrotondamento, e un punto sul bordo uscirebbe dal settore.

## 3. I punti

Per ogni slot una terna **(tinta, posizione nella banda 0–1, croma massimo)**. Il croma
dichiarato è un tetto: la costruzione lo abbassa finché il colore non rientra nel gamut
sRGB alla luminanza richiesta. La lightness OKLCH si risolve per bisezione fino alla
luminanza relativa voluta.

I punti sono scelti massimizzando il **ΔE2000 minimo fra liste coesistenti**, sul peggiore
dei due temi, con due vincoli che non sono negoziabili:

- **Pavimento di croma OKLCH a 0,0424.** Senza, l'ottimo porta il croma a zero e produce
  grigi. Un grigio ha un angolo di tinta che non significa niente, quindi il controllo sui
  settori non se ne accorgerebbe: il pavimento è ciò che fa mordere quel controllo. Il
  valore è il croma minimo effettivo della revisione 4, quindi non è una regressione.
- **Ancore di blocco.** Lo slot 0 di ogni banda è il token di blocco (`--coal`, `--oppo`,
  `--arab`, `--inc`): tinta entro ±6° dall'ancora della famiglia e croma non inferiore al
  pavimento. Senza, `--coal` finiva magenta e `--oppo` grigio-verdazzurro.

  Per la **coalizione** il pavimento dell'ancora è **0,12**, non 0,0424: nella banda più
  scura quello generale lasciava passare un `#1D2A40`, che si legge grigio e non blu — lo
  stesso difetto per cui il verde è stato tolto da quella banda. Pretendere l'ancora satura
  non costa niente: il blocco passa da 11,85 a **12,40** e la distanza fra blocchi da 12,62
  a **13,47**, perché il vincolo spinge la ricerca in un bacino migliore.

I valori nel file sono già arrotondati alla griglia su cui sono stati misurati. L'ottimo è
affilato: arrotondare dopo aver misurato costa fino a 0,8 di ΔE.

## 4. Distanze misurate

ΔE2000 minimo fra liste **coesistenti dello stesso blocco**, peggiore dei due temi:

| Blocco | Posti | Consegna 4 | Riposizionato | **A cascata** |
|---|---|---|---|---|
| arabo | 4 | 5,8 | 7,97 | **13,97** |
| coalizione | 6 | 6,3 | 13,16 | **12,40** |
| ago della bilancia | 4 | 6,9 | 14,52 | **14,52** |
| opposizione | 6 | 3,7 | 7,88 | **7,88** |

**L'obiettivo è a cascata, non globale.** Massimizzare il minimo su tutti i blocchi
insieme è sbagliato: appena il blocco più vincolato inchioda il minimo, l'ottimizzatore
smette di spingere gli altri, che restano fermi al valore di quello. Si massimizza invece
un blocco per volta, dal più vincolato al meno, tenendo fissi quelli già risolti e
imponendo ΔE ≥ 11 verso di loro.

Conseguenza da conoscere: **l'ultimo blocco della cascata non è libero come il primo.**
La sua configurazione di partenza è valida finché anche i precedenti sono fermi; una volta
che si sono spostati può violare il ΔE ≥ 11 verso di loro. Chi viene per ultimo eredita i
vincoli di tutti, quindi in coda va messo il blocco con più margine.

Fra blocchi diversi il minimo è **13,47**, contro una soglia di 11. Ogni colore supera 3:1
su `--card` e `--paper` con margine (minimo 4,381), e il testo `--on-color` supera 4,5:1
su ogni colore (minimo 4,656 in chiaro, 4,782 in scuro). Salto minimo fra i colori
consegnati: 1,302.

**Perché la soglia interna è 7,5 e non 8** — la spiegazione lunga sta in
[`CLAUDE.md`](../CLAUDE.md). In breve: il vincolo che morde è la larghezza delle bande,
fissata dai salti ≥ 1,309 e dai soffitti di contrasto. Sull'opposizione a sei liste il
massimo raggiungibile è 8,0; a cinque è 8,9; allargando le bande fuori specifica 11,6.

## 5. Coesistenza

Alcune liste sono configurazioni alternative e non compaiono mai insieme. Condividono lo
slot, e quindi il colore:

- **B'Yachad** oppure **Yesh Atid + Bennett 2026**
- **Lista Unita araba** oppure **Hadash–Ta'al + Balad**

È corretto per costruzione, e va rilevato se le alternative dovessero comparire insieme:
`index.html` ha una guardia che, se due liste accese nello stesso render ricevono lo stesso
esadecimale, lo scrive in pagina invece di lasciarlo passare.

Configurazione al 20 agosto 2026: l'opposizione ha **cinque** liste accese — B'Yachad,
I Democratici, Blu e Bianco, Yashar, Yisrael Beitenu. Yesh Atid e Bennett 2026 sono spente
dalla fusione del 26 aprile.

## 6. Colore del testo sopra i colori pieni

Un solo token, `--on-color`: `#FFFFFF` in chiaro, `#070D18` in scuro. In tema scuro il
bianco è irraggiungibile — su un verdeazzurro di blocco servirebbe una luminanza del testo
superiore a 1 — quindi il testo diventa scuro e i colori di blocco restano saturi.

## 7. Oltre la capienza

Il primo slot supplementare cade a mezzeria fra due punti esistenti: colore **distinto**,
distanza ridotta, e la funzione registra un avviso leggibile con `COLORE.avvisi()`. Dal
secondo in poi `di()` **solleva un errore esplicito**: la lista in eccesso va accorpata in
«altre liste» o resa a tratteggio. Un colore che nessuno sa leggere è peggio di una lista
senza colore proprio.

## 8. Deposito delle liste

- **Cambio di blocco**: il colore non cambia a campagna aperta, si congela al deposito.
  Prima del deposito, la lista prende il primo slot libero della banda nuova.
- **Fusione**: la nuova lista prende lo slot della maggiore per seggi nell'ultima
  proiezione in cui esistevano entrambe. Lo slot liberato non si riusa fino al voto.
- **Scissione**: tiene lo slot chi conserva la sigla; l'altra prende il primo slot libero.
  Se nessuna conserva la sigla, lo slot si libera ed entrambe ne prendono uno nuovo.

## 9. Assegnazione attuale

Derivata dalla regola, **non autoritativa**: la fonte è la funzione. Che questa tabella e
`index.html` non divergano è verificato da `test/suite/regola.js` a ogni `npm test`.

| Blocco | Slot | Lista | Chiaro | Scuro |
|---|---|---|---|---|
| arabo | 0 | Hadash–Ta’al → Lista Unita | `#374100` | `#8AA20A` |
|  | 1 | Ra’am | `#005220` | `#49B867` |
|  | 2 | Balad | `#214238` | `#7B9F92` |
|  | 3 | *libero* | `#064B42` | `#16B29E` |
| coalizione | 0 | Likud | `#00226E` | `#3A7CFE` |
|  | 1 | Shas | `#392231` | `#967A8C` |
|  | 2 | Giudaismo Unito Torah | `#43006D` | `#AB59F6` |
|  | 3 | Sionismo Religioso | `#51003F` | `#E42BB9` |
|  | 4 | Otzma Yehudit | `#1F243B` | `#767D99` |
|  | 5 | *libero* | `#2E0C64` | `#846FCB` |
| ago | 0 | Casa Sionista | `#8E4107` | `#FFA673` |
|  | 1 | Unità | `#6F5147` | `#D7B5AA` |
|  | 2 | Israel First | `#5D593D` | `#C2BE9F` |
|  | 3 | Partito Economico | `#745200` | `#F4B10D` |
| opposizione | 0 | Yesh Atid → B’Yachad | `#018279` | `#3FFFF0` |
|  | 1 | I Democratici | `#517B83` | `#C1EFF8` |
|  | 2 | Blu e Bianco | `#42736E` | `#AEE2DB` |
|  | 3 | Yisrael Beitenu | `#017390` | `#92E2FF` |
|  | 4 | Yashar | `#506E80` | `#BBDCF1` |
|  | 5 | Bennett 2026 | `#007C85` | `#8BEFF9` |

Token di blocco = slot 0 di ciascuna banda.
