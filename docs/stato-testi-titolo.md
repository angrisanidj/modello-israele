# I testi del titolo: dodici decisi, due correzioni da fare

Scritto il 22 agosto 2026, a fine sessione. Serve a chi riprende senza la conversazione in
cui si è deciso.

**I dodici testi delle forme del titolo sono decisi.** La tabella delle celle e delle
frequenze che li ha guidati è in [forme-del-titolo.md](forme-del-titolo.md); la funzione
è `formaTitolo()` in `index.html`, provata da `test/suite/titolo.js` su tutte e 7381 le
configurazioni possibili.

**Mancano due correzioni, e sono dell'autore.** Finché non arrivano, i testi non vanno in
pagina: non è una svista da riparare in fretta, sono due distinzioni che il titolo deve
saper fare e che oggi non fa.

---

## 1 · I due casi della coalizione a 60

Il titolo tratta **60 seggi** come un caso solo. Non lo è, e la differenza è quella che
un lettore vuole sapere per prima:

- **60 e nessun altro arriva a 61** — è lo stallo pieno: nessuno governa, e la trattativa
  riparte da zero;
- **60 mentre l'opposizione ne ha 61 o più** — non è stallo: è una maggioranza
  alternativa che esiste, e la coalizione uscente è *fuori* per un seggio.

Sono due notizie diverse scritte con lo stesso numero. Il titolo deve distinguerle, e la
distinzione va scritta nella frase, non lasciata al lettore che conta i seggi
nell'emiciclo.

**Nota per chi implementa**: la condizione esiste già come dato — `blocchi(SEG)` porta i
tre totali — quindi è una diramazione in `formaTitolo()`, non un calcolo nuovo. Quando si
aggiunge, `test/suite/titolo.js` va esteso: le 7381 configurazioni comprendono già tutti
e due i casi, ma oggi cadono nella stessa cella.

---

## 2 · La probabilità della configurazione descritta, non quella complessiva

Quando il titolo porta una probabilità, oggi porta **quella complessiva**. Deve portare
**quella della configurazione che sta descrivendo**.

La differenza, con i numeri del 22 agosto 2026: la pagina dice che l'opposizione ha il
**21%** di arrivare a 61 e il blocco Netanyahu il **2%**, ma la configurazione più
probabile in assoluto è il **75%** in cui *serve il sostegno dei partiti arabi*. Un titolo
che descrive lo scenario dell'opposizione e gli attacca il 21% dice una cosa vera; un
titolo che descrive lo stesso scenario e gli attacca la probabilità di qualcos'altro dice
una cosa falsa con un numero giusto — che è la forma di errore peggiore, perché il numero
regge al controllo.

**Nota per chi implementa**: le quattro probabilità stanno già separate in `MC` — sono le
stesse che alimentano le quattro pastiglie in cima. Il titolo deve prendere quella della
cella in cui si trova, e la prova deve legarle: **per ogni forma, la probabilità citata
dev'essere quella della sua cella**. È la stessa forma di prova usata per le due strade
del colore di blocco e per la selezione di apertura del simulatore.

---

## Cosa succede finché non arrivano

L'`<h1>` in pagina resta il testo statico nel markup, e il `<title>` resta la stringa
fissa a riga 6. Nessuno dei due passa ancora da `formaTitolo()`: il codice c'è, la prosa
no. **Il `<title>` dovrà diventare la forma corta della stessa funzione, sotto i 60
caratteri**, o titolo della pagina e titolo del pezzo diranno due cose diverse — che è la
solita strada doppia, spostata dalla grafica alla lingua.
