# Accettazione della consegna 6 — Knesset 2026

22 agosto 2026. **Questa non è una richiesta: è un'accettazione.** I tre punti della
richiesta per la consegna 6 sono chiusi, e la tavolozza si applica.

Quello che segue sono quattro righe da sistemare e un prezzo che accettiamo sapendolo.
Nessuna delle quattro rimanda indietro la consegna e nessuna va rifatta prima
dell'applicazione: sono cose da scrivere, non da ricalcolare.

---

## I tre punti, verificati con la nostra colorimetria

**1 · La tinta annotata.** Quaranta annotazioni in `palette-partiti.md` e otto nei token di
blocco, confrontate con la tinta misurata in OKLCH sull'esadecimale consegnato: **scarto
massimo 0,05°**, contro l'1,45° che dichiarate. Croma, scarto massimo **0,0005**. E il
settore non è più un'affermazione sulla regola ma un filtro dentro la regola: **nessuna
lista cade fuori dal proprio settore**, in nessuno dei due temi, e gli archi reali
coincidono con la vostra tabella.

**2 · Il §1 dicromatico.** Sui dodici colori in aula: nominale **15,1** in chiaro e **11,8**
in scuro, dicromatico **5,71** in chiaro — i vostri numeri, riprodotti. La coppia che
avevamo segnalato, `casa_sionista` / `unity_erdan` in tema scuro, passa da **0,39 a 10,86**.

**3 · Le identità.** Il meccanismo è un vincolo con tolleranza, non uno spareggio, e sedici
identità su venti sono dichiarate perdute con la ragione di ciascuna. I Democratici escono a
**39,9°** e **31,0°**, Yisrael Beitenu a **343,0°** e **340,1°**: distano **57,0°** e
**50,9°**, ΔE **47,0** e **37,7**. Non si scambiano più.

E abbiamo verificato la cosa che solo noi potevamo verificare: i colori storici che citate —
`#c0392b`, `#1b4a8f`, `#1f7a4d`, `#3f8047`, `#6b4fa0`, `#d98a1f` — **sono davvero i nostri**,
rimossi da `index.html` dal commit `05cc303`. Siete andati a prendere la tavolozza di prima
del 20 agosto invece di quella corrente, ed è il riferimento giusto: sulla tavolozza attuale
lo stesso criterio darebbe 3 tenute, 7 grigie e 10 di un altro blocco, e sarebbe una misura
sulla cosa sbagliata.

---

## Tre cose fatte meglio di quanto avevamo chiesto

Le scriviamo perché sono il motivo per cui questa consegna si accetta, e perché sono
esattamente ciò che mancava alle quattro precedenti.

**Avete trovato la causa vera al posto di quella che avevamo indicato noi.** Avevamo scritto
«è il `clamp()`, e il rimedio è leggere la tinta a valle». Era la trasformata: `oklch()`
restituiva RGB lineare trattato come sRGB. La nostra diagnosi spiegava il sintomo e sarebbe
bastata a nascondere il difetto invece di chiuderlo — avremmo avuto etichette corrette su
colori sbagliati. E il contro-esempio che avevamo portato come prova, il Likud esatto, lo
avete girato dall'altro verso: era esatto perché in quella zona l'errore della trasferenza è
minimo, non perché stesse dentro il gamut. **Chi riceve una diagnosi e la corregge invece di
eseguirla sta facendo il lavoro, non il compito.**

**Avete chiamato difetto un difetto.** Il §1 dicromatico poteva essere presentato come una
cessione al §5 — la richiesta l'avrebbe accettata, perché l'ordine era dichiarato e una
cessione dichiarata è legittima. Avete scritto invece: «*non lo avevamo dichiarato perché non
lo avevamo visto — non c'è una lettura migliore di questa*». È la differenza fra una consegna
che si difende e una che si spiega, ed è quella che rende verificabile tutto il resto.

**Avete consegnato il tetto come file eseguibile invece che come numero.** Avevamo scritto
che era «l'unica affermazione portante che resta sulla vostra parola». Adesso `tetto.mjs` gira
da noi, è deterministico — verificato, due esecuzioni danno lo stesso identico output — e la
prima cosa che ha prodotto è stata **la smentita del vostro stesso argomento della consegna
5**. Un metodo che confuta chi lo consegna vale più di dieci tabelle che lo confermano.

---

## Le quattro righe

### 1 · Dichiarate il §3-bis

I quattro token di blocco sono cambiati — in chiaro da `#0033EF #DC0336 #004418 #E05800` a
`#143EDB #78002D #007B4C #B57600` — e **la risposta non li nomina mai.** Nella consegna 5
c'era una tabella contro il nostro pavimento; qui è sparita, proprio nel giro in cui i colori
si sono mossi.

Il miglioramento è grosso, e va detto per primo: **la distanza nominale fra i quattro passa
da 20,97 a 35,07** in chiaro, e **il minimo sui tre blocchi in aula da 8,35 a 13,24.**

Ma quattro righe restano sotto il pavimento:

| | chiaro | scuro |
|---|---|---|
| su `--card` | 3,78 **↓0,92** | 4,36 **↓0,33** |
| testo sopra il colore | 4,72 ✔ | 4,74 **↓0,35** |
| distanza nominale | 35,07 ✔ | 39,45 ✔ |
| deuteranopia | 13,24 ✔ | 13,25 ↓0,05 |
| protanopia | 12,64 ✔ | 18,64 ✔ |
| scala di grigi | 8,61 ✔ | 9,05 ✔ |
| tre in aula, tutte le viste | 13,24 **↓2,66** | 13,25 **↓9,85** |

**Vanno scritte, non dedotte da noi misurando.** È la stessa forma del §1 del giro scorso,
molto attenuata: non chiediamo di cambiare i token, chiediamo la riga che dice quanto hanno
ceduto e perché.

### 2 · Misurate il pavimento dicromatico con tutte e due le matrici

`utj` / `sionismo_rel` in tema scuro sta a **3,88** con Viénot-Brettel-Mollon, contro il
**5,0** che misurate voi con Machado 2009 — e contro il **4,5** che vi siete dati come
pavimento.

Non lo trattiamo come un difetto della tavolozza, perché è il metodo. Ma finora i due metodi
**concordavano entro mezzo punto su deuteranopia e protanopia** — divergevano solo sulla
tritanopia, e lo avevamo scritto. Qui la distanza è 1,1, ed è la prima volta.

**È il numero su cui poggia tutto il §1.** Un pavimento che dipende dalla matrice non è un
pavimento: va misurato con entrambe e dichiarato con il peggiore dei due, o va dichiarato
quale delle due lo definisce e perché.

*(Minore, per completezza: `unity_erdan` / `israel_first` in chiaro sta a 2,91 contro il
pavimento di 3,0 dell'ago della bilancia. Nove centesimi: rumore, non lo contiamo.)*

### 3 · Rigenerate la tabella del §4

Non è quella che `tetto.mjs` stampa oggi. A sette liste, tema chiaro:

| blocco | il §4 dice | il file stampa |
|---|---|---|
| coalizione | 15,7 | **16,5** |
| opposizione | 16,7 | **17,3** |
| liste arabe | 13,4 | **13,7** |
| ago della bilancia | 11,7 | **11,8** |

**La conclusione non cambia** — il 15,6 a sette liste è raggiungibile in coalizione e
opposizione, non fra le liste arabe né nell'ago della bilancia — e tutte le differenze vanno
nella direzione che **rafforza** il vostro argomento. Ma la tabella viene da un'esecuzione
diversa dal file consegnato, e adesso che il metodo è verificabile la tabella deve essere la
sua uscita, non un ricordo di com'era.

### 4 · L'anello lo decidiamo noi: sette, non otto

Avete scelto «nessun seggio» invece di «nessun seggio proprio», e la ragione — la frase che
finisce in legenda dev'essere vera senza che il lettore sappia quale lista era comune nel 2022
— è buona e la teniamo.

Ma applicata fino in fondo toglie una lista anche dall'altra parte. **`lista_araba` va
esclusa per la stessa ragione di `sionismo_rel` e `otzma`**: la Lista Unita araba è il
contenitore di `hadash_taal`, che nel 2022 aveva **cinque seggi**. Se Sionismo Religioso e
Otzma siedono perché sedevano su lista comune, allora la Lista Unita siede per identico
motivo.

Che `r22` sia `null` per il contenitore è una proprietà della nostra anagrafica, non un
fatto sul Parlamento: `null` lì vuol dire «questa sigla non esisteva nel 2022», non «questi
elettori non hanno eletto nessuno». **La coerenza del criterio vale più della lettera di
`r22`**, e la lettera va corretta da noi.

Le sette: `balad`, `bennett26`, `casa_sionista`, `economico`, `israel_first`, `unity_erdan`,
`yashar`.

---

## Il prezzo — e qui il numero era sbagliato, ma l'errore è di misura, non di tavolozza

Nella prima stesura di questo documento avevamo scritto che accettavamo «opposizione a zero
slot liberi in tutti e due i temi». **Non è vero, e ce ne siamo accorti applicando.** Lo
correggiamo qui invece di lasciarlo passare, perché è esattamente il genere di numero che
poi si cita per due anni.

`capienza()` chiama `palette(tema, 7)` e riporta «liberi» come *riempiti − in anagrafica*.
Ma 7 è il **tetto chiesto**, non la saturazione: un blocco che riempie sette slot su sette
risulta pieno anche quando ne reggerebbe dodici. Facendo crescere il tetto finché il blocco
smette di riempirsi:

| blocco | satura a (chiaro) | in anagrafica | liberi | satura a (scuro) | liberi |
|---|---|---|---|---|---|
| blocco Netanyahu | 10 | 5 | 5 | 6 | 1 |
| opposizione sionista | **12** | 7 | **5** | 12 | 5 |
| liste arabe | 5 | 4 | 1 | 6 | 2 |
| **ago della bilancia** | **4** | 4 | **0** | 6 | 2 |

**Il blocco davvero pieno è uno solo: l'ago della bilancia in tema chiaro.** L'opposizione
ha cinque slot liberi, non zero. Il §9 va rifatto su questi numeri, e la frase «se l'8
settembre si deposita una lista in più nell'opposizione la regola non ha uno slot da darle»
va tolta: ne ha cinque.

Resta vero, e lo accettiamo, che **l'ago della bilancia in chiaro non ha margine.** Se lì
nasce una quinta lista si scende la scala di ripiego del §9, un parametro per volta.

**E c'è una seconda cosa, che abbiamo riparato nella nostra copia della regola.** Oltre la
saturazione `di()` restituiva `#626D7E` — cioè `--mute`, il colore del testo attenuato —
**senza avviso e senza errore**. La sera del deposito una quinta lista centrista avrebbe
preso un grigio identico al testo disabilitato, e nessuno se ne sarebbe accorto fino a
guardare la pagina. Nella nostra copia il primo slot oltre la saturazione avvisa, e dal
secondo in poi la regola solleva un errore che nomina il blocco e rimanda al §9. Era una
proprietà che la nostra suite provava già sulla regola precedente: la consegna l'ha persa
per strada, e ve lo segnaliamo perché la riprendiate voi nella vostra.

Le due correzioni sono in `dati/colore-liste.js` da parte nostra, marcate nel commento.
Non toccano un solo colore.

**Una richiesta sola su questo, ed è di forma, non di contenuto: la scala di ripiego deve
trovarsi senza cercarla.** La sera del deposito delle liste chi la userà avrà poco tempo e
nessuna memoria di questa conversazione. Oggi il §9 di `regola-colore.md` c'è ed è scritto
bene, ma ci si arriva solo se già si sa che esiste. Chiediamo che **il punto in cui la regola
fallisce dica dove andare**: quando `capienza()` restituisce zero slot liberi per un blocco,
il valore che torna deve nominare il §9 e la sua prima mossa. Un rimedio che esiste e non si
trova, quel giorno lì, è un rimedio che non esiste.

---

## Che cosa facciamo adesso

Applichiamo. Da parte nostra vuol dire rifare le cinque strade che portano il colore allo
schermo — la regola, l'anagrafica, la mappa dei blocchi, la tavolozza scura e i quattro token
CSS — e la prova che le tiene insieme, che è l'unica ragione per cui ce ne siamo accorti la
prima volta.

Le quattro righe qui sopra non ci bloccano: sono cose da scrivere nella prossima revisione
dei documenti, non nei colori. L'anello lo correggiamo noi.
