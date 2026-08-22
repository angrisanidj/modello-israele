# Le forme del titolo — quale frase esce quando

> **Aggiornato il 22 agosto 2026, e questo file è superato in due punti.** Le nove celle
> qui sotto sono contate su TRE blocchi: coalizione, opposizione, arabi. I blocchi sono
> quattro — c'è l'ago della bilancia — e sullo spazio vero, 302.621 configurazioni invece
> di 7381, le celle sono **dodici**. In particolare «la forma 4 pura non compare mai» e «la
> coalizione a 60 sono due casi» sono **falsi**: la 4 compare nell'1,45% delle simulazioni,
> e la coalizione a 60 è un caso solo. La versione buona è in
> [stato-testi-titolo.md](stato-testi-titolo.md); qui restano le frequenze che hanno
> guidato la scrittura dei testi, che valgono ancora.

Scritto il 22 agosto 2026. Serve a scrivere i testi dell'h1 sapendo **quale frase compare
in quale situazione e quanto spesso**, senza riderivare le frequenze.

La funzione è `formaTitolo(blocchi(SEG))` in `index.html`, provata da
`test/suite/titolo.js` su **tutte e 7381** le configurazioni possibili — non su un
campione. Le frequenze qui sotto vengono da **20.000 simulazioni Monte Carlo** sulla
proiezione del 22 agosto 2026 (coalizione 51, opposizione 57, arabi 12).

---

## Come si sceglie la forma

Due passaggi separati, e la separazione è il punto.

**1 · Le quattro forme di base sono una partizione**, e discende dall'invariante 1 — la
somma fa sempre 120:

| base | condizione | perché esclude le altre |
|---|---|---|
| **1** | `coal ≥ 61` | se la coalizione ha 61, nessun altro può averne 61 |
| **4** | `coal = 60` | opposizione più arabi fanno 60: nessuna somma arriva a 61 |
| **2** | `coal ≤ 59` e `oppo ≥ 61` | l'opposizione ce la fa da sola |
| **3** | `coal ≤ 59` e `oppo ≤ 60` | opposizione più arabi ≥ 61, ma l'opposizione da sola no |

È una catena, non un elenco: per ogni configurazione **esattamente una** è vera. La prova
lo verifica riscrivendo le quattro condizioni in forma indipendente e contandole, invece
di ricopiare l'implementazione.

**2 · Tre forme strette prendono il posto della base** quando un blocco è a un seggio o
meno dalla soglia, cioè quando `min(|coal−61|, |oppo−61|) ≤ 1`:

| forma | `scarto` | che cosa è successo |
|---|---|---|
| **5** | −1 | il blocco si ferma a un seggio: **non** ce l'ha fatta |
| **6** | 0 | 61 esatti: ce l'ha fatta, **senza margine** |
| **7** | +1 | 62: la supera di uno |

La `base` resta accessibile sotto, perché la stessa distanza dalla soglia significa cose
diverse a seconda di chi la tocca.

---

## Le nove celle raggiungibili, con quanto pesano

| forma | base | blocco | frequenza | che cosa la frase deve dire |
|---|---|---|---|---|
| **3** | 3 | — | **79,8%** | nessuno dei due campi basta a sé stesso |
| **5** | 3 | opposizione | **5,3%** | l'opposizione si ferma a uno dal farcela **senza gli arabi** |
| **6** | 2 | opposizione | **4,3%** | l'opposizione ha 61: maggioranza minima, senza margine |
| **2** | 2 | — | **3,5%** | maggioranza all'opposizione, senza gli arabi |
| **7** | 2 | opposizione | **3,2%** | l'opposizione supera la soglia di uno |
| **5** | **4** | coalizione | **1,3%** | la coalizione si ferma a uno, e **nessuno** ha la maggioranza |
| **6** | 1 | coalizione | **1,1%** | la coalizione ha 61: maggioranza minima |
| **1** | 1 | — | **0,9%** | maggioranza alla coalizione |
| **7** | 1 | coalizione | **0,6%** | la coalizione supera la soglia di uno |

*(Le frequenze oscillano di un paio di decimi fra due esecuzioni: il Monte Carlo non ha
seme fisso. Gli ordini di grandezza sono stabili.)*

### Le due righe della forma 5 sono due notizie opposte

Stessa distanza dalla soglia, significato rovesciato — e sono i due testi **da non
fondere**:

- **opposizione a 60** (base 3): l'opposizione è a un seggio dal governare **senza i
  partiti arabi**. Il fatto è che le serve ancora qualcuno.
- **coalizione a 60** (base 4): la coalizione è a un seggio, e siccome opposizione più
  arabi fanno esattamente 60, **nessuna combinazione arriva a 61**. Il fatto è lo stallo
  completo.

### Le tre celle sotto l'1,5%

`5·coalizione` (1,3%), `6·coalizione` (1,1%), `7·coalizione` (0,6%) valgono insieme il
**3%**. Se serve risparmiare prosa, sono queste tre a poter condividere una formulazione
parametrica sul segno dello scarto. Le prime cinque righe della tabella no: valgono il 96%
e ciascuna dice una cosa che le altre non dicono.

---

## Due cose che non vanno scritte

**La forma 4 pura non compare mai.** `coal = 60` rende `|coal − 61| = 1`, quindi la forma
stretta la prende sempre: zero volte su 7381 configurazioni e zero su 20.000 simulazioni.
Il testo della base 4 serve **solo** dentro la forma 5, e va scritto lì.

**Il caso 60/60 non ha bisogno di una forma sua.** È l'unica configurazione con due
blocchi a un seggio dalla soglia, e richiede **esattamente zero seggi arabi**: il modello
produce zero seggi arabi nell'1,3% delle simulazioni, ma mai insieme a `coal = 60` — zero
volte su 20.000. La funzione restituisce `blocco: 'entrambi'` invece di sceglierne uno a
caso; basta che la frase della forma 5 possa nominare due blocchi se capita.

---

## Le grandezze disponibili nella frase

Da `formaTitolo()`: `forma`, `base`, `blocco`, `scarto`, `coalizione`, `opposizione`,
`arabo`.

Da altrove: `MC.vC/vO/vA/st ÷ MC.n` — le quattro probabilità, che **sommano a 100** —
e `ggOggi()`, i giorni al voto, che in un titolo ha senso solo sotto i 30.

**Un avvertimento sulla probabilità.** Il titolo segue il **valore centrale**, non la
probabilità modale, perché il sommario due righe sotto dice gli stessi numeri e un titolo
che seguisse un'altra grandezza contraddirebbe il testo che ha accanto. Le due possono
divergere: valore centrale a 61 con probabilità al 40%. Quando succede, è la forma 6 —
maggioranza minima — e la probabilità va detta **nella frase**, o il titolo afferma con
sicurezza una cosa che il modello dà per incerta.

## Il `<title>`

Stessa funzione, forma corta, **sotto i 60 caratteri**: è quello che sopravvive nelle
condivisioni, ed è la ragione per cui non può essere una stringa fissa mentre l'h1 è
generato — sarebbero due strade per lo stesso valore, e quella che si vede fuori dalla
pagina è la seconda.

## Dopo il 27 ottobre

Le stesse forme, al passato, e **il soggetto non è la Knesset: è il modello.** «Il modello
dava…», non «la coalizione ha…». Finché non esiste il campo `esito` in
`dati/archivio.json` — punto 8-bis in `CLAUDE.md` — la pagina non conosce il risultato
vero e può parlare solo della propria stima.
