# La regola del colore — Knesset 2026

Non una tavolozza: una funzione. Il colore di una lista dipende da tre cose — **blocco**,
**slot** dentro il blocco, **tema** — e da nient'altro. Il codice eseguibile è
[`dati/colore-liste.js`](../dati/colore-liste.js); questo documento è la specifica che
quel codice implementa. L'8 settembre, quando le liste si chiudono, il colore di una lista
nuova si ricava chiamando la funzione, non scegliendolo a mano.

La regola arriva da Design, revisione 4. La revisione 5 — quella applicata — cambia
**solo la scelta dei punti** dentro confini già verificati: bande, settori di tinta,
famiglie e ordine delle bande sono quelli consegnati.

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
| 1 | arabo | 0,0176 – 0,0229 | 0,2046 – 0,2248 |
| 2 | coalizione (Netanyahu) | 0,0456 – 0,0608 | 0,3098 – 0,3673 |
| 3 | ago della bilancia | 0,0951 – 0,0979 | 0,4964 – 0,5072 |
| 4 | opposizione sionista | 0,1438 – 0,1747 | 0,6795 – 0,7961 |

Bordi adiacenti a **≥ 1,309** in forma WCAG `(L₁+0,05)/(L₂+0,05)`, misurati fra i bordi e
non fra i centri. Il margine sopra 1,30 non è decorativo: assorbe l'arrotondamento a 8 bit,
che può mangiare fino a 0,009 di salto. Sui colori effettivamente consegnati il salto
minimo misurato è **1,3020**.

L'ordine delle bande non è semantico ma strutturale: è l'unica sequenza che tiene verde e
verdeazzurro — che distano appena 50° — in bande non adiacenti.

## 2. Famiglie di tinta

Un settore per blocco, disgiunti, angoli **OKLCH**. Attenzione: in HSL gli stessi colori
cadono 40–50° più in basso. Sono due spazi diversi e confrontare gli angoli dell'uno con i
settori dell'altro non significa niente.

| Blocco | Settore | Ampiezza | Posti |
|---|---|---|---|
| arabo — verde | 125° – 182° | 57° | 4 |
| opposizione — verdeazzurro | 186° – 236° | 50° | 6 |
| coalizione — blu → indaco | 240° – 330° | 90° | 6 |
| ago della bilancia — sabbia → ambra | 38° – 102° | 64° | 4 |

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
  `--arab`, `--inc`): tinta entro ±6° dal valore della revisione 4 e croma non inferiore a
  quello. Senza, `--coal` finiva magenta e `--oppo` grigio-verdazzurro.

I valori nel file sono già arrotondati alla griglia su cui sono stati misurati. L'ottimo è
affilato: arrotondare dopo aver misurato costa fino a 0,8 di ΔE.

## 4. Distanze misurate

ΔE2000 minimo fra liste **coesistenti dello stesso blocco**, peggiore dei due temi:

| Blocco | Posti | Consegna 4 | Riposizionato |
|---|---|---|---|
| arabo | 4 | 5,8 | **7,97** |
| coalizione | 6 | 6,3 | **13,16** |
| ago della bilancia | 4 | 6,9 | **14,52** |
| opposizione | 6 | 3,7 | **7,88** |

Fra blocchi diversi il minimo è **14,9**, contro una soglia di 11. Ogni colore supera 3:1
su `--card` e `--paper` con margine (minimo 4,381), e il testo `--on-color` supera 4,5:1
su ogni colore (minimo 4,656 in chiaro, 5,068 in scuro).

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
| arabo | 0 | Hadash–Ta'al → Lista Unita | `#202E00` | `#698E05` |
| | 1 | Ra'am | `#00320C` | `#099736` |
| | 2 | Balad | `#1B2E1B` | `#728871` |
| | 3 | *libero* | `#002E27` | `#08917F` |
| coalizione | 0 | Likud | `#004A72` | `#12ACFE` |
| | 1 | Shas | `#80007E` | `#FE62FA` |
| | 2 | Giudaismo Unito Torah | `#41445D` | `#9DA2BF` |
| | 3 | Sionismo Religioso | `#523250` | `#B28CAF` |
| | 4 | Otzma Yehudit | `#1704E7` | `#7AA0FF` |
| | 5 | *libero* | `#452B81` | `#9E89E9` |
| ago | 0 | Casa Sionista | `#8E4107` | `#FFA673` |
| | 1 | Unità | `#6F5147` | `#D7B5AA` |
| | 2 | Israel First | `#5D593D` | `#C2BE9F` |
| | 3 | Partito Economico | `#745200` | `#F4B10E` |
| opposizione | 0 | Yesh Atid → B'Yachad | `#018279` | `#3FFFF0` |
| | 1 | I Democratici | `#517B83` | `#C1EFF8` |
| | 2 | Blu e Bianco | `#42736E` | `#AEE2DB` |
| | 3 | Yisrael Beitenu | `#017390` | `#92E2FF` |
| | 4 | Yashar | `#506E80` | `#BBDCF1` |
| | 5 | Bennett 2026 | `#007C85` | `#8BEFF9` |

Token di blocco = slot 0 di ciascuna banda.
