# Modello previsionale Knesset 2026

Modello statistico per le elezioni della 26ª Knesset del **27 ottobre 2026**, pubblicato su
<https://angrisanidj.github.io/modello-israele/>. Autore: Daniele Angrisani (FocusAmerica).

Tutto il testo rivolto al lettore è **in italiano**. Anche i commenti nel codice sono in italiano.

---

## Regola prima: il file è uno solo

`index.html` è un file **autonomo**: HTML, CSS e JavaScript in un unico documento, nessuna
dipendenza esterna, nessuna chiamata di rete all'infuori dell'API di Wikipedia. Deve poter essere
salvato su disco, aperto con un doppio clic e funzionare. Deve poter essere incorporato in una
pagina di Fanpage o FocusAmerica senza portarsi dietro nulla.

Non introdurre bundler, framework, npm a runtime, font remoti, CDN. `devDependencies` serve solo
alle prove.

## Come si lavora

```bash
npm install          # solo la prima volta: installa jsdom per le prove
npm test             # estrae il JS e lancia le 189 prove
npm run verifica     # prove + controlli strutturali
```

`npm test` rigenera `test/app.js` da `index.html`. Non modificare `test/app.js` a mano: è un
prodotto, viene sovrascritto.

**Nessuna modifica a `index.html` è finita finché `npm run verifica` non passa per intero.**

## Invarianti che non si toccano

Sono verificate dalle prove. Se una salta, il difetto è nel codice, non nella prova — a meno che
l'attesa non sia diventata obsoleta di proposito, e allora si aggiorna la prova *nello stesso
commit* spiegando perché nel messaggio.

1. **La somma dei seggi fa sempre 120.** Con qualunque swing, esclusione di istituti, affluenza.
2. **La soglia della maggioranza separa esattamente 60 seggi** nell'emiciclo, in entrambe le viste.
3. **Nessuna funzione JavaScript definita due volte.** È già successo due volte con tagli
   sbagliati: una copia vecchia sovrascrive quella nuova e il difetto è invisibile.
4. **Nessun `id` usato dal JavaScript che manchi nel markup.**
5. **Nessuna risorsa esterna** oltre all'API di Wikipedia.
6. **L'avviso di avvio** (`#k-boot`) resta nel markup, visibile per impostazione predefinita, e
   viene rimosso dal JavaScript al primo render riuscito. Serve a chi apre il file in anteprima.
7. **Contrasto leggibile** nei due temi, chiaro e scuro.
8. **Su schermo stretto** (viewport 380 px) nessun testo negli SVG scende sotto i 5 px reali.

## Trappole già incontrate, da non ripetere

- **Tagliare il file usando come confine una funzione che sta *prima***: duplica un blocco e la
  versione vecchia vince. Prima di un taglio, verificare che l'indice di fine sia maggiore di
  quello di inizio.
- **Stub di prova che creano gli elementi mancanti su richiesta**: nascondono patch non applicate.
  Le prove usano un DOM jsdom vero, costruito da `index.html`. Non tornare a stub permissivi.
- **Patch a catena in un unico script che si interrompe a metà**: se un ancoraggio non viene
  trovato, lo script muore e le modifiche precedenti non vengono scritte. Applicare le patch in
  modo indipendente e riferire quali non sono andate a segno.
- **Sostituzioni automatiche di nomi**: rinominare «Coalizione uscente» in «Blocco Netanyahu» ha
  prodotto sei errori di concordanza («alla blocco», «La blocco»). Dopo una sostituzione, elencare
  le parole che precedono l'espressione e controllarle.
- **Ricostruire angoli da coordinate SVG arrotondate**: le prove sull'emiciclo leggono coordinate a
  due decimali. Non ridurre la precisione.

## Struttura

```
index.html            il modello, pubblicato così com'è come GitHub Pages
test/
  estrai.mjs          estrae il JS da index.html in test/app.js
  esegui.mjs          lancia tutta la suite e riassume
  struttura.mjs       controlli strutturali sul file
  suite/*.js          le prove, una per area
  misura-consegna.mjs misuratore di tavolozza, a mano: node test/misura-consegna.mjs
dati/
  colore-liste.js     la regola generativa dei colori di lista
  storico.js          sondaggi delle elezioni 2020, 2021, 2022 (banco di prova)
  backtest.js         riapplica il motore alle elezioni passate
  corr.js             misura le correlazioni fra liste sull'archivio
  prefus.js           analisi della fusione B'Yachad del 26 aprile
  wikiparser.js       prove del parser della tabella Wikipedia
  fixture.js          tabella Wikipedia di riferimento per le prove
docs/
  regola-colore.md    la specifica dei colori: bande, settori, punti, distanze
  pubblicare.md       note di lavoro
```

## Il modello in breve

Per ogni sondaggio si invertono i seggi in quote di voto (D'Hondt inverso), si fa una media pesata
per recenza (dimezzamento ogni 7 giorni), numerosità del campione e grappolo di istituto, si
normalizza a 99 e si riparte con Bader-Ofer/D'Hondt sopra la soglia del 3,25%. Poi 20.000
simulazioni Monte Carlo con scosse per lista, per blocco, accoppiate fra liste affini e maggiorate
in zona soglia.

Finestra: 60 giorni, massimo 45 rilevazioni. Direct Polls pesa la metà (sopravvaluta il Likud di
6,2 seggi su 39 rilevazioni).

### Cosa il modello NON fa, di proposito

- **Non corregge la distorsione storica dei sondaggi.** Nel 2020, 2021 e 2022 hanno sottostimato il
  blocco di Netanyahu; nel settembre 2019 lo hanno sopravvalutato di 4,5 seggi. Gli istituti
  ricalibrano dopo ogni elezione, quindi gli errori passati non sono informativi sul prossimo. I
  pulsanti sotto il cursore dello swing *interrogano* quell'ipotesi, non la applicano.
- **Non modella i cambi di lista.** Il banco di prova mostra che a distanza dal voto è la fonte di
  errore dominante — nel 2020 le fusioni di Yamina ed Emet, nel 2021 il Sionismo Religioso sotto
  soglia poi fuso con Otzma, nel 2022 la spaccatura della Lista Unita. Le liste si chiudono l'**8
  settembre 2026**.

### Come si è comportato sulle elezioni vere

| Istantanea | Giorni al voto | Modello | Reale | Errore |
|---|---|---|---|---|
| 2020 | 62 | 54 | 58 | +4 |
| 2021 | 58 | 47 | 52 | +5 |
| 2022 | 49 | 59 | 64 | +5 |
| 2022 | 38 | 60 | 64 | +4 |
| 2020 | 3 | 57 | 58 | +1 |
| 2021 | 4 | 51 | 52 | +1 |
| 2022 | 4 | 61 | 64 | +3 |

Sette su sette dentro l'intervallo dell'80%. Gli intervalli sulle singole liste sono però
ottimistici: coprono il 73% dei casi, non l'80%. È dichiarato nella nota metodologica.

## Pubblicazione

`index.html` è la pagina servita da GitHub Pages. Un commit su `main` la aggiorna.

**Non fare commit senza che l'utente lo abbia chiesto esplicitamente in quel messaggio.** Il file
è pubblico e collegato a un giornale: ogni push è una pubblicazione. Prima di ogni commit:

```bash
npm run verifica     # deve passare per intero
```

Messaggi di commit in italiano, all'infinito, con il perché e non solo il cosa.

## Ancora da fare

1. Modalità `?embed=1` per l'inserimento in FocusAmerica
2. Accordi di apparentamento (dall'8 settembre, valgono 1-2 seggi)
3. Liste nuove e scissioni fino all'8 settembre (mappatura manuale, il parser avvisa)
4. Incertezza sulla configurazione delle liste nel Monte Carlo
5. Affluenza haredi (nessuna leva, ha oscillato meno di quella araba)
6. Storico delle proiezioni salvate su disco invece che ricalcolate
7. Esportazione PNG dei grafici
8. Aggiornamento automatico programmato, con avviso se l'archivio è vecchio
9. Accessibilità: navigazione da tastiera, ruoli ARIA
10. **Prova su browser veri.** Tutto è verificato in jsdom, che non fa layout. I difetti veri
    segnalati finora — testo nero su fondo nero, anteprima senza JavaScript, didascalia sopra i
    seggi — erano tutti di quel tipo e nessuna prova automatica li avrebbe visti.
11. Settembre 2019 ricalcolato riga per riga (oggi è dato di seconda mano, da titoli di stampa)

## Calendario

| Data | Cosa |
|---|---|
| 8 settembre 2026 | Deposito delle liste: la mappa dei partiti si chiude |
| 6 ottobre 2026 | Comincia la propaganda televisiva |
| 23 ottobre 2026 | Silenzio demoscopico: ultimi sondaggi pubblicabili |
| **27 ottobre 2026** | **Voto** |
| 4 novembre 2026 | Risultati ufficiali |

---

## La tavolozza: perché la soglia interna è 7,5 e non 8

Applicata il 20 agosto 2026. I colori delle liste non sono più scritti a mano
nell'anagrafica: vengono da una regola generativa — quattro bande di luminanza (una per
blocco), un settore di tinta disgiunto per blocco, e per ogni slot una terna
*tinta · posizione nella banda · croma*.

**Il vincolo che morde è la larghezza delle bande, non la scelta dei punti.** Le bande
sono fissate da due cose che non si possono allentare: i salti fra bande adiacenti devono
stare a ≥ 1,309 in forma WCAG `(L₁+0,05)/(L₂+0,05)`, e i soffitti di contrasto impongono
il tetto in tema chiaro e il pavimento in tema scuro. Quel che resta è un intervallo
stretto, e dentro un settore di 50° con sei liste il ΔE2000 minimo non arriva a 8.

Misurato, sull'opposizione sionista:

| Configurazione | ΔE2000 minimo |
|---|---|
| sei liste accese | **8,0** |
| cinque liste accese | **8,9** |
| bande allargate, fuori specifica | **11,6** |

Il riposizionamento degli slot vale molto — porta l'opposizione da 3,7 a 7,9 e la
coalizione da 6,3 a 13,2 — ma 9,7 non è raggiungibile senza allargare le bande, e
allargarle farebbe cadere il vincolo dei salti. La soglia di 8 era ricavata da una misura
su un solo tema e con varianza sottostimata: **si corregge l'ingresso, non si aggiusta il
risultato.** Da qui 7,5.

Non riaprire la partita senza rimisurare: `node test/misura-consegna.mjs` rifà tutto il
conto, e `MUTA=settori` verifica che il controllo sulle famiglie di tinta sappia fallire.

**Due vincoli aggiunti che non sono negoziabili.** Massimizzare il ΔE senza di essi
distrugge la famiglia di tinta: l'ottimo porta il croma a zero e produce grigi — e un
grigio ha un angolo di tinta che non significa niente, quindi il controllo sui settori non
se ne accorge. Perciò: pavimento di croma OKLCH a 0,0424 (il minimo della consegna
precedente, quindi nessuna regressione) e ancore di blocco vincolate, tinta entro ±6° e
croma non inferiore a quello della consegna precedente.

## Difetti noti, di codice e non di tavolozza

Nessuna scelta di colore li risolve: dipendono da come il modello disegna.

1. **Tre sparkline di `k-proj` a opacità 0,55** stanno sotto 3:1 contro il fondo. Un
   tratto al 55% su fondo pieno non arriva a 3 con nessuna tinta ragionevole: il massimo
   ottenibile a α = 0,55 richiede una tinta piena con luminanza ≤ 0,048. La leva è
   l'opacità, non il colore.
2. **La linea della maggioranza in `k-emi`**, disegnata in `--ink` sopra un seggio pieno.
   In tema chiaro il riordino delle bande l'ha portata sopra soglia; in tema scuro sta a
   **1,22**, il valore peggiore mai misurato, perché `--ink` è quasi bianco e i seggi
   dell'opposizione sono la banda più chiara. Serve un contorno, o un colore proprio per
   quella linea.
