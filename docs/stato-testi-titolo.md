# I testi del titolo: applicati, e le due correzioni che hanno cambiato forma

Riscritto il 22 agosto 2026, quando i testi sono andati in pagina. La versione precedente
di questo file diceva «i dodici testi sono decisi, mancano due correzioni dell'autore»: le
correzioni sono arrivate, sono state applicate, e **tutte e due hanno dato un risultato
diverso da quello che si aspettava chi le aveva chieste**. È la parte che vale la pena
tenere.

La funzione è `formaTitolo()` in `index.html`; i testi stanno in `TIT_PRIMA`, `TIT_DOPO`,
`TIT_CORTO_PRIMA` e `TIT_CORTO_DOPO`; la scelta della cella in `cellaTitolo()`. Le prove
sono in `test/suite/titolo.js`, 61 asserzioni su **302.621 configurazioni**, e in
`test/suite/date.js` per il tempo verbale.

---

## 1 · I due casi della coalizione a 60 non sono due: sono uno

La richiesta diceva: «60 e nessun altro arriva a 61» è lo stallo pieno, «60 mentre
l'opposizione ne ha 61 o più» è una maggioranza alternativa che esiste, e il titolo deve
distinguerli.

**Il secondo caso è aritmeticamente impossibile.** La coalizione a 60 lascia esattamente
60 seggi a *tutti gli altri messi insieme* — opposizione, arabi e ago della bilancia — e
nessuna loro somma può arrivare a 61. Verificato per esaurimento su tutte le 302.621
configurazioni: zero. La coalizione a 60 è sempre e solo stallo pieno.

**Ma la distinzione che si chiedeva esiste davvero, e sta sull'altro blocco.**
L'opposizione a 60 sì che ha due casi, e sono esattamente le due notizie opposte:

| | frequenza sul Monte Carlo del 22 agosto |
|---|---|
| opposizione a 60 **con almeno un seggio arabo** → la maggioranza alternativa esiste | **5,57%** |
| opposizione a 60 **senza nessun seggio arabo** → non ce l'ha nessuno | 0% oggi, possibile |

## 2 · E c'era un terzo caso che nessuno aveva chiesto, più frequente di tre già scritti

La partizione delle quattro forme di base era scritta su **tre** blocchi: coalizione,
opposizione, arabi. I blocchi sono **quattro** — c'è l'ago della bilancia — e quando prende
seggi la partizione si rompe in un punto solo, sempre lo stesso:

> nessun blocco ha la maggioranza, **e nemmeno opposizione più arabi ci arrivano**, perché
> i seggi che mancano sono dell'ago della bilancia.

Prima della riparazione quella configurazione cadeva nella cella 3 e il titolo diceva «i
partiti arabi sono decisivi», che lì è **falso**. Misurato: **1,45% delle simulazioni**,
cioè più di tre celle per cui una prosa a sé era stata scritta senza discutere (0,84%,
0,69%, 0,56%).

Da qui la base 4 corretta — «nessuna maggioranza possibile» invece di «coalizione a 60» —
e **tre celle nuove**: `f4`, `f5o4` e `f5e`. I loro sei testi (tre prima del voto, tre
dopo) sono **gli unici sei su quarantotto che non ha dettato l'autore** e vanno riletti.

## 3 · [P] è la frequenza della configurazione descritta

Applicato come chiesto: `[P]` è la frequenza con cui il blocco nominato fa **esattamente**
[X] seggi, non la probabilità che raggiunga la maggioranza. Le due divergono di quasi il
doppio — al 22 agosto la pastiglia dell'opposizione vale il 14,9%, la frequenza del suo
valore centrale l'8,5%.

**Non è costato nessun passaggio in più sulle simulazioni.** `montecarlo()` restituisce già
`res.coal` e `res.oppz` ordinati, quindi il conteggio è una doppia bisezione: **0,036 ms per
chiamata** su 20.000 elementi, e il titolo ne fa una. Un istogramma accumulato nel ciclo
sarebbe stato una seconda strada per lo stesso numero.

**Una cosa da sapere se si rileggono i testi.** Due frasi attaccano `[P]` a una
proposizione più larga della configurazione: «nel [P]% delle simulazioni nessun campo ha i
numeri per governare» e «nel [P]% delle simulazioni le serve l'appoggio dei partiti arabi».
Con la regola applicata quei numeri valgono **1,3%** e **5,6%** — la frequenza di quella
esatta configurazione — mentre le due proposizioni, prese per sé, sono vere nel **2,7%** e
nell'**80%** dei casi. Sono affermazioni vere ma parziali. Se si preferisce la lettura larga
basta cambiare `datiTitolo()` in un punto solo, e `titolo.js` cade subito: la prova lega il
numero alla cella apposta.

## 4 · L'articolo davanti alla percentuale

«nel 5%», «nell'8,5%», «nello 0,3%»: in italiano dipende dalla **parola** con cui il numero
si legge, non dalla cifra. Ventiquattro testi con la regola ricopiata a mano sarebbero
ventiquattro occasioni di sbagliarla, come le tre copie di «1 giorni». C'è `inPc()`, e una
prova con dodici casi.

## 5 · Il `<title>`

È la forma corta della stessa funzione, con la coda «· Knesset 2026» — l'unica cosa che
dice di che paese si parla — e sta **sotto i 60 caratteri** su tutte le configurazioni,
`[X]` a tre cifre compreso. La prova misura la lunghezza su ogni cella e ogni valore di
`[X]`, e verifica che il `<title>` esca dallo **stesso stato** dell'h1: quella riga prima
era `D.title === undefined || true`, cioè non diceva niente, e un mutante che faceva uscire
il `<title>` da un altro stato passava.

## 6 · L'h1 statico non afferma più un risultato

Nel markup resta il ripiego per chi apre il file senza JavaScript. Prima diceva «Nessun
blocco ha la maggioranza», che è un risultato: vero il giorno in cui è stato scritto e
falso in una data che nessuno ha segnato in calendario. Adesso descrive la pagina, non lo
stato del modello.
