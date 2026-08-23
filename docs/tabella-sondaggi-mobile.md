# La tabella dei sondaggi sotto i 660: tre forme, e le sei domande

Scritto il 23 agosto 2026. **È una proposta: niente di quello che segue è in pagina.** La
metà desktop del punto 2 della coda è applicata — le colonne raggruppate per blocco, i
filetti dell'anagrafica — e questa è l'altra metà.

## Che cosa c'è oggi, misurato

Browser vero, `node .claude/serve.mjs`, viewport 380, tema chiaro forzato dal selettore,
transizioni spente prima di ogni geometria.

| | |
|---|---|
| larghezza della tabella | **1288,9px**, 22 colonne |
| contenitore (`.scroll`, `clientWidth`) | **356px** |
| **quota visibile** | **27,6%** — 932,9px fuori |
| altezza della sezione | **774,4px** |
| altezza dei filtri, prima del primo dato | **97,8px** |
| `max-height` dello scorrevole | 480px |
| righe | **174** (173 rilevazioni + la riga che dichiara l'era pre-fusione) |
| altezza di riga | 33,6px |
| elementi focalizzabili in tutta la sezione | **3** (i due `select` e il campo di ricerca) |

**Il problema vero non è la larghezza, sono le 173 righe**, e va detto prima di tutto perché
tutte e tre le forme si giudicano lì. A 380 la tabella mostra sei colonne su ventidue e
quattordici righe su centosettantatré: per leggere *una* riga si trascina avanti e indietro,
e per trovarne una si scorre dentro un riquadro alto 480px che a sua volta sta dentro una
pagina alta 10.536px. Lo scorrimento annidato è la parte che nessuno racconta e che tutti
subiscono: il dito sul riquadro scorre il riquadro, il dito appena fuori scorre la pagina, e
il confine non è segnato da niente.

**La premessa da abbandonare è che debba restare una tabella.** A 356px una griglia da
ventidue colonne non ci sta: sei colonne da 59px, o ventidue da 16. Non è una questione di
tipografia.

## Che cosa deve continuare a fare

Le funzioni del desktop, tutte:

1. **ricerca libera** su istituto, testata e data;
2. **filtro per istituto** (oggi un `select` con tutti gli istituti);
3. **filtro per periodo** (tutto il 2026 · 30 · 60 · 90 giorni · solo era attuale);
4. **i seggi lista per lista**, venti colonne;
5. **il confronto fra due rilevazioni** — che è la cosa che una tabella permette e un elenco
   di schede no, ed è la ragione per cui questa sezione è una tabella;
6. **i totali di blocco** per riga (Coal., Opp.);
7. **il conteggio del filtro** («N su 173 rilevazioni»);
8. **la dichiarazione dell'era pre-fusione**, che oggi è una riga a tutta larghezza.

E i vincoli del progetto: nessuna dipendenza esterna, la parentela dichiarata col campo
`dentro` rispettata, le due forme **due viste dello stesso dato** con una prova che le leghi
come `house.js` fa per tabella e schede.

---

# Forma A · La riga che si apre

**Una riga per rilevazione, e i seggi dentro.** L'elenco mostra data, istituto e i due
totali di blocco; premendo una riga si apre sotto di essa un pannello con i venti seggi,
raggruppati per blocco con le stesse quattro fasce del desktop. Una riga aperta per volta, o
più d'una — è la scelta che decide il confronto.

È l'idioma del `<details>` che la pagina usa già per l'archivio e per la nota metodologica,
portato dentro l'elenco.

**1 · Come si scorrono 173 righe.** Chiuse, le righe sono alte ~34px: 173 righe fanno
**5.900px**. Non si scorrono — si filtra. Quindi la forma A **non regge senza un limite**: o
mostra le prime N e carica il resto a richiesta, o resta un muro. La proposta è **le prime
30 più un comando «altre 30»**, che a 34px fanno 1.020px, e il comando dice quante ne
restano. Il filtro per periodo, che c'è già, diventa il modo normale di ridurre.

**2 · Dove stanno i seggi, e come si confrontano due sondaggi.** Dentro il pannello, in una
griglia di pastiglie «nome · seggi» a tre colonne, con le quattro fasce di blocco. Il
confronto è la parte debole: **due pannelli aperti sono lontani fra loro almeno quanto è
alto il primo**, cioè ~260px per venti pastiglie a tre colonne. Il confronto si può fare
solo tenendo aperte due righe adiacenti, e adiacenti lo sono solo se il filtro le ha rese
tali. **È la forma che confronta peggio.**

**3 · Ricerca e filtri, e quanto costano prima del primo dato.** Restano dove sono e come
sono: 97,8px, gli stessi di oggi. Non c'è niente da guadagnare e niente da perdere.

**4 · Tastiera.** Una riga chiusa è un comando: **+173 punti di tabulazione** (o +30 col
limite, +1 per «altre 30»). Dentro un pannello aperto le pastiglie non sono comandi, quindi
non aggiungono niente. Con `<details>`/`<summary>` nativi si ha `Invio` e `Spazio` gratis e
lo stato annunciato dal lettore di schermo senza scrivere `aria-expanded`.

**5 · Altezza.** 30 righe chiuse 1.020px + filtri 98 + testata + il comando = **~1.200px**,
contro i 774 di oggi: **+55%**. Con una riga aperta, +260. Con tutte e 173, 5.900 + i
pannelli aperti.

**6 · Che cosa si perde.** *Il confronto fra rilevazioni non adiacenti, che è la ragione per
cui questa sezione è una tabella. E la lettura per colonna: «come si è mossa questa lista
nell'ultimo mese» in tabella è uno sguardo verticale, qui non esiste affatto.*

---

# Forma B · Due colonne fisse e una finestra che scorre

**La tabella resta una tabella, ma si sceglie che cosa guardare.** Data e istituto restano
fissi a sinistra (`position:sticky` sulle prime due celle); a destra scorre una finestra di
**tre o quattro colonne per volta**, e sopra la finestra c'è un selettore di **blocco** —
arabi · opposizione · ago della bilancia · coalizione · totali — che porta la finestra sul
gruppo scelto invece di lasciarla trascinare.

**1 · Come si scorrono 173 righe.** Come oggi, verticalmente dentro `.scroll`, e con lo
stesso difetto: 480px di finestra dentro una pagina di 10.536. **Qui il limite non serve** —
una riga costa 34px e sono già tutte lì — ma lo scorrimento annidato resta, ed è la cosa che
questa forma non risolve. Si può togliere il `max-height` e lasciare che la sezione sia
lunga: 173 × 34 = **5.900px** di sezione, uno scorrimento solo invece di due. È la scelta
onesta, ed è cara.

**2 · Dove stanno i seggi, e come si confrontano due sondaggi.** In tabella, come adesso, ma
tre-quattro colonne per volta. **Il confronto verticale resta intatto** — due rilevazioni
qualsiasi si leggono una sopra l'altra, ed è la cosa che le altre due forme perdono. Il
confronto *orizzontale* — «questa rilevazione, tutte le liste» — richiede quattro passaggi
di finestra.

**3 · Ricerca e filtri.** I tre di oggi (97,8px) più il selettore di blocco. Se è un nastro
di quattro pastiglie va a capo come le altre: **+29px**, totale **~127px** prima del primo
dato. Se è un `<select>`, +36px.

**4 · Tastiera.** +4 o +5 punti (il selettore di blocco). Ma c'è la trappola registrata
nell'house effect: **Chrome rende uno scorrevole raggiungibile col tabulatore solo se non
contiene elementi focalizzabili**, e qui non ne contiene nessuno — quindi la finestra
orizzontale è raggiungibile e si scorre con le frecce. È l'unica delle tre in cui lo
scorrimento è comandabile da tastiera senza aggiungere niente.

**5 · Altezza.** Con `max-height` invariato: **~800px**, cioè quella di oggi più il
selettore. Senza `max-height`, ~6.000px. **È la più economica delle tre**, ed è l'unica il
cui costo dipende da una decisione (annidare o no) e non dalla forma.

**6 · Che cosa si perde.** *La visione d'insieme di una singola rilevazione: per vedere tutte
le liste di una riga servono quattro spostamenti di finestra, e nel frattempo non si vede
più il confronto con la riga sopra. E si perde la promessa che stiamo facendo — «una forma
pensata per il telefono»: questa è la tabella di prima con due appigli, e la premessa da
abbandonare era proprio quella.*

---

# Forma C · La colonna del tempo, una lista per volta

**È la forma che non somiglia a niente di quello che c'è in pagina**, ed è quella che ribalta
la domanda. Le altre due chiedono «quale rilevazione vuoi vedere»; questa chiede **«quale
lista vuoi seguire»**, e mostra il tempo.

Si sceglie una lista — dall'alto, dallo stesso nastro di pastiglie colorate che l'emiciclo e
le legende usano già — e sotto compare **una colonna verticale del tempo**: una riga per
rilevazione, dal più recente in giù, con **data, istituto in breve, e il numero di seggi
che quell'istituto dà a quella lista**, più una **barretta orizzontale lunga quanto il
numero**. Le rilevazioni sono già ordinate per data, quindi la colonna *è* la serie storica
di quella lista letta dai singoli sondaggi — la stessa cosa che il grafico della tendenza
mostra come nuvola di puntini, qui in forma di elenco leggibile e interrogabile.

Il confronto fra due rilevazioni si fa **dentro la colonna**: sono due righe adiacenti, con
la stessa scala, e la differenza si legge come differenza di lunghezza. Il confronto fra due
*liste* si fa cambiando pastiglia, e — questa è la parte che nessun'altra forma dà — si può
**tenerne due accese**, e allora ogni riga porta due barrette affiancate con i due colori
di lista. Due liste, tutte le rilevazioni, una colonna sola.

**1 · Come si scorrono 173 righe.** Verticalmente, senza riquadro annidato: la colonna è la
sezione. Una riga costa ~26px (una cifra, un nome corto, una barretta), quindi 173 righe
fanno **~4.500px**. **Ma qui il taglio ha un senso che nelle altre due non ha**: la domanda
«come si muove questa lista» si risponde con le rilevazioni recenti, e il filtro per periodo
— che esiste già — diventa il comando principale invece di un accessorio. Con «ultimi 30
giorni», che è il filtro naturale di questa forma, le righe sono ~28: **730px**.

**2 · Dove stanno i seggi, e come si confrontano due sondaggi.** I seggi sono *il* contenuto:
uno per riga, con la barretta. Il confronto fra due rilevazioni è a distanza zero — sono
adiacenti — e ha un canale in più della tabella, la lunghezza. **Quello che si perde è il
confronto fra liste diverse nella stessa rilevazione**, che è esattamente il verso opposto
della tabella: qui una riga è una rilevazione vista da una lista, non da tutte. Le due liste
accese insieme lo recuperano a metà, e solo a metà.

**3 · Ricerca e filtri.** I tre di oggi restano, e il nastro delle liste si aggiunge: venti
pastiglie che vanno a capo costano — misurando sul nastro dell'indice, che a 380 è largo
1.891px in una finestra da 358 — **cinque righe a capo, ~150px**, oppure un nastro
orizzontale scorrevole da 29px con la sbirciata garantita, che in questa pagina è già
scritta (`inVista`, `sbircia`). **Con il nastro scorrevole: 97,8 + 29 = ~127px** prima del
primo dato, come la forma B. Con il nastro a capo: 248px, che è troppo.

**4 · Tastiera.** +20 punti di tabulazione (una pastiglia per lista), o +20 con il nastro
scorrevole che si porta in vista da solo — il codice c'è già ed è provato da `indice.js`. Le
righe non sono comandi, quindi non aggiungono niente. **Attenzione al vincolo registrato**:
il nastro dell'indice ha `scroll-margin-top:112px` legato all'altezza delle sue pastiglie, e
un secondo nastro appiccicato non deve entrare in conflitto — questo non è `sticky`, quindi
non lo fa, ma va verificato e non dedotto.

**5 · Altezza.** Con il filtro a 30 giorni: 730 + 127 + testata = **~900px**, cioè +16% su
oggi. Senza filtro: ~4.600px. **È l'unica forma in cui l'altezza dipende da un comando che
il lettore ha in mano** invece che da una decisione di chi la scrive.

**6 · Che cosa si perde.** *La riga come unità. In tabella una riga È una rilevazione, e si
legge «Midgam del 19 agosto vede questo quadro»; qui quella lettura non esiste più — una
rilevazione compare venti volte, una per lista, e non si vede mai intera. Si perdono i
totali di blocco per rilevazione, che sono una somma di venti celle che qui non stanno
insieme. E si perde la possibilità di rispondere a «quanto fa 120 questa riga», che è la
verifica che il piede della sezione promette al lettore.*

---

## Le tre a confronto

| | **A** riga che si apre | **B** colonne fisse + finestra | **C** colonna del tempo |
|---|---|---|---|
| forma nuova per la pagina? | no (è il `<details>`) | no (è la tabella di oggi) | **sì** |
| 173 righe | serve un limite | come oggi, o 5.900px | il filtro diventa il comando |
| confronto fra rilevazioni | **il peggiore** | **il migliore** | ottimo, ma su una lista |
| confronto fra liste | dentro il pannello | quattro finestre | due per volta, con due colori |
| la riga resta un'unità | sì | sì | **no** |
| filtri prima del dato | 98px | ~127px | ~127px |
| punti di tabulazione in più | +30 (o +173) | +5 | +20 |
| altezza contro i 774 di oggi | ~1.200 (+55%) | ~800 (+3%) o ~6.000 | ~900 (+16%) o ~4.600 |
| scorrimento annidato | **tolto** | resta, o costa 5.900px | **tolto** |

**Quello che le tre hanno in comune, e va deciso una volta sola prima di sceglierne una:**

- **Le due forme sono due viste dello stesso dato**, e vanno legate da una prova come
  `house.js` lega tabella e schede: per ogni rilevazione e per ogni lista, il numero
  mostrato nella forma mobile è lo stesso della tabella. È l'idioma già scritto, e senza di
  esso ciascuna forma sarebbe corretta rispetto a sé stessa.
- **La parentela va rispettata**: contenitore e componenti non compaiono mai insieme. La
  tabella oggi lo fa perché mostra le colonne che hanno almeno un seggio; una forma che
  elenchi le liste va costruita sullo stesso insieme e non su `IDS`.
- **L'ordine dei blocchi è quello del desktop**, e viene da `colonneBlocco()`: nessuna forma
  mobile deve riscriverlo, o l'8 settembre le due divergono.
- **Il colore dei valori resta quello della lista**, come nel desktop.

## Una cosa da misurare prima di scegliere, e non è la larghezza

Nessuna delle tre risolve la domanda che non è stata posta: **a che cosa serve questa
sezione su un telefono.** Sul desktop è l'archivio interrogabile — la promessa «tutti i dati
sono qui, e li puoi controllare» — e la sua funzione è soprattutto **dichiarativa**: esiste
perché il lettore sappia che esiste. Se anche su un telefono la sua funzione è quella, la
forma giusta potrebbe essere la più piccola delle tre con l'elenco completo dietro un
comando, invece della più capace.

È una decisione editoriale e non tecnica, e va presa guardando quanti la aprono davvero da
mobile — che oggi non si sa, e per saperlo servirebbe una misura che questa pagina, per
scelta, non fa.
