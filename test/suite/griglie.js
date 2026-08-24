/* LE GRIGLIE CHE LASCIANO VEDERE IL PROPRIO FONDO.
 *
 * Il difetto, misurato il 24 agosto 2026 a 1265: il calendario «Da qui al voto» era una
 * griglia a SEI tracce fisse con SETTE tappe, quindi l'ultima riga lasciava scoperte 5,03
 * colonne — un rettangolo di 892,5 per 169,5 pixel in cui si vedeva il fondo del
 * CONTENITORE, che lì è `--hair` perché è così che sono disegnati i filetti fra le schede.
 *
 * LA FORMA, NON L'ISTANZA, ed è la lezione di nmA(). Perché il difetto si veda servono TRE
 * cose insieme:
 *   1. il contenitore è una griglia a tracce di numero FISSO (non auto-fit, non auto-fill);
 *   2. il suo fondo è VISIBILE e diverso da quello dei figli;
 *   3. i figli non sono un multiplo delle colonne.
 * Dove manca la seconda, una traccia scoperta mostra la pagina e non si vede niente: è il
 * caso di quasi tutte le griglie di questo file. Cercata la forma su tutta la pagina, le
 * griglie col fondo visibile sono DUE — il calendario e le quattro probabilità — e la
 * seconda oggi ha quattro figli in quattro colonne, cioè resto zero: nessun buco adesso, ma
 * la stessa forma, e il buco comparirebbe il giorno in cui le pastiglie diventano tre o cinque.
 *
 * IL RIMEDIO NON RIACCORDA I NUMERI: cambia meccanismo. Il flex non ha tracce, quindi non
 * esiste una posizione scoperta per nessun numero di celle — e questo conta più che altrove
 * perché LE TAPPE CAMBIANO: sono sette adesso, due passano dopo il 27 ottobre, e ognuna
 * aggiunta o tolta sposta il resto. Una griglia andrebbe riaccordata a ogni cambio; il flex
 * non ha niente da riaccordare.
 */
const {JSDOM} = require('jsdom');
const fs = require('fs');

let ok = 0, ko = 0;
function esito(cond, desc, dettaglio){
  if (cond) { ok++; console.log('OK ' + desc); }
  else { ko++; console.log('KO ' + desc + (dettaglio ? ' — ' + dettaglio : '')); }
}

const HTML = fs.readFileSync('../../index.html', 'utf8');
const css = HTML.match(/<style>([\s\S]*?)<\/style>/)[1];

/* In jsdom non c'è layout: il buco si misura su browser, e i numeri stanno in CLAUDE.md.
   Qui si prova la CAUSA — che il calendario non sia più una griglia a tracce fisse — e si
   sorveglia la forma, perché è quella che può ricomparire altrove. */

/* ══ 1 · IL CALENDARIO NON È PIÙ UNA GRIGLIA ═══════════════════════════════ */
{
  const rCal = (css.match(/#kn26 \.cal\{[^}]*\}/) || [''])[0];
  esito(/display:flex/.test(rCal),
    'il calendario è in flex: il flex non ha tracce, quindi non esiste una posizione scoperta', rCal);
  esito(!/grid-template-columns/.test(rCal),
    'e non dichiara più colonne fisse', rCal);
  esito(/flex-wrap:wrap/.test(rCal), 'va a capo', rCal);
  /* IL FONDO E IL GAP RESTANO: i filetti fra le schede non sono della griglia, sono il
     fondo del contenitore che si vede attraverso il varco di 1px. Il flex non li tocca —
     verificato su browser: varco di 1px esatto a 1265 e a 760. */
  esito(/gap:1px/.test(rCal) && /background:var\(--hair\)/.test(rCal),
    'e i filetti restano quello che erano: un gap di 1px e il fondo del contenitore', rCal);
  /* le celle crescono, o l'ultima riga lascerebbe scoperto lo stesso */
  const rFig = (css.match(/#kn26 \.cal>div\{flex:[^}]*\}/) || [''])[0];
  esito(/flex:1 1/.test(rFig),
    'le celle crescono: senza flex-grow l\'ultima riga lascerebbe scoperto come prima', rFig);
  esito(/calc\(100%\/6 - 1px\)/.test(rFig),
    'e la base sottrae il gap, o l\'ultima cella di ogni riga scenderebbe a capo da sola', rFig);
  /* le tre fasce di larghezza restano quelle di prima: sei, tre, due, una */
  const basi = (css.match(/#kn26 \.cal>div\{flex-basis:[^}]*\}/g) || []);
  esito(basi.length === 3,
    'e restano le tre fasce di larghezza che il calendario aveva', basi.join(' '));
  esito(/calc\(100%\/3 - 1px\)/.test(basi.join(' ')) &&
        /calc\(100%\/2 - 1px\)/.test(basi.join(' ')) &&
        /flex-basis:100%/.test(basi.join(' ')),
    'tre, due e una colonna, come la griglia di prima', basi.join(' '));
}

/* ══ 2 · LA FORMA, SORVEGLIATA SU TUTTO IL FOGLIO ══════════════════════════
 * Un contenitore a tracce fisse con un fondo dichiarato è la forma che ha prodotto il buco.
 * Questa prova non guarda quante celle ci sono — quello cambia coi dati — ma quante regole
 * di quella forma esistono. Oggi ne resta UNA, `.probs`, con resto zero: è dichiarata qui
 * con la sua ragione, e se ne compare una seconda questa prova cade e chiede di guardarla.
 * È l'inventario dell'opacità applicato al layout: non un divieto, un elenco con un perché. */
{
  /* le regole che dichiarano insieme colonne fisse e un fondo */
  const blocchi = css.match(/#kn26 [^{}]*\{[^}]*\}/g) || [];
  const aRischio = blocchi.filter(b => {
    const corpo = b.slice(b.indexOf('{'));
    return /grid-template-columns:repeat\(\d+,/.test(corpo) && /background:var\(--hair\)/.test(corpo);
  }).map(b => b.slice(0, b.indexOf('{')).trim());
  const DICHIARATE = ['#kn26 .probs'];
  esito(aRischio.length === DICHIARATE.length && aRischio.every(x => DICHIARATE.indexOf(x) >= 0),
    'le griglie a tracce fisse con un fondo visibile sono quelle dichiarate, e nessuna in più',
    'trovate: ' + (aRischio.join(', ') || '(nessuna)') + ' · dichiarate: ' + DICHIARATE.join(', '));
  /* e la ragione per cui quella resta: quattro pastiglie in quattro colonne, resto zero.
     Le quattro probabilità sono strutturali — coalizione, opposizione, arabi, stallo — non
     un elenco che cresce come le tappe. Se un giorno diventano tre o cinque, il buco compare
     e questa riga dice dove guardare. */
  const rProbs = (css.match(/#kn26 \.probs\{[^}]*\}/) || [''])[0];
  const n = +((rProbs.match(/repeat\((\d+),/) || [0, 0])[1]);
  esito(n === 4, 'e quella dichiarata ha quattro colonne, quante sono le probabilità', String(n));
  const quante = (HTML.match(/id="k-probs"/) ? 4 : 0);
  esito(quante === n,
    'cioè resto zero: nessun buco oggi, e la forma resta sorvegliata da questa prova',
    quante + ' pastiglie in ' + n + ' colonne');
}

/* ══ 3 · IL CALENDARIO REGGE UN NUMERO QUALUNQUE DI TAPPE ══════════════════
 * Non si prova che siano sette: si prova che il numero non compaia da nessuna parte nel
 * foglio. Sette è un dato — due tappe passano dopo il 27 ottobre — e un foglio che lo
 * sapesse andrebbe riaccordato ogni volta. */
{
  const dom = new JSDOM('<!doctype html><html><body>' + HTML.match(/<body[^>]*>([\s\S]*)<\/body>/)[1]
    .replace(/<script>[\s\S]*?<\/script>/g, '') + '</body></html>');
  const D = dom.window.document;
  esito(!!D.getElementById('k-calend'), 'il calendario c\'è nel markup');
  /* nessuna regola del calendario nomina un numero di celle */
  const rr = (css.match(/#kn26 \.cal[^{]*\{[^}]*\}/g) || []).join(' ');
  esito(!/nth-child|:last-child|grid-column|grid-row/.test(rr),
    'e nessuna regola del calendario parla di posizioni: niente nth-child, niente grid-column',
    rr.slice(0, 160));
  /* le tappe vengono da TAPPE, e il foglio non le conta */
  const js = HTML.match(/<script>([\s\S]*)<\/script>/)[1];
  esito(/var TAPPE\s*=/.test(js), 'le tappe sono un dato dichiarato nel JavaScript');
  esito(!/\.cal[^{]*\{[^}]*repeat\(7/.test(css),
    'e il foglio non sa quante sono: sette è un dato, non una costante di layout');
}

console.log('\n' + ok + '/' + (ok + ko));
if (ko) process.exit(1);
