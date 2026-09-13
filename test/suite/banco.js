/* ══════════════════════════════════════════════════════════════════════════════════
 * IL BANCO DI PROVA STORICO, E LA PROVA CHE NON ESISTEVA
 *
 * `dati/backtest.js` riusa le funzioni vere del modello estraendole dal sorgente, e
 * `dati/report.js` ci costruisce sopra le cifre che la nota metodologica pubblica. Dal 23
 * agosto 2026 — commit 724bd4d, quello degli apparentamenti — NON GIRAVANO PIÙ: `invD` è
 * passato sotto `ripartoSoglia` → `divisori` e `dhondt` sotto `coppieRiparto`, mentre
 * l'estrazione ne prendeva due sole. Ventuno giorni di silenzio, e nessuna prova cadeva
 * PERCHÉ NESSUNA PROVA LO ESEGUIVA: in tutto `test/` quel file non era nominato.
 *
 * È LA TERZA VOLTA IN QUESTO PROGETTO CHE UNO STRUMENTO DI MISURA INTERROGA UN CODICE CHE
 * NON ESISTE PIÙ. Le altre due: `--prova` che leggeva il `test/app.js` di ieri e rispondeva
 * «Niente da fare» su una modifica appena scritta; e le sei suite verdi su un `app.js`
 * rimasto indietro. La forma è sempre quella — lo strumento non fallisce, RISPONDE — ed è
 * la ragione per cui questa suite non si accontenta di far girare il banco: lega
 * l'estrazione al sorgente da cui estrae.
 *
 * QUINDI LA PROPRIETÀ NON È «I NOMI ESISTONO», È «LA CHIUSURA È COMPLETA». Asserire che
 * `dhondt` e `invD` si trovino coglierebbe una rinomina e mancherebbe esattamente il
 * difetto vero, che è una dipendenza NUOVA: `invD` c'era e si trovava benissimo, chiamava
 * una funzione che nessuno estraeva. Qui si prende il corpo di ogni funzione estratta, si
 * guardano le funzioni che chiama, e si pretende che ciascuna sia estratta, dichiarata
 * come volutamente esclusa, o definita dal banco. Vale per la dipendenza che qualcuno
 * aggiunge domani.
 * ══════════════════════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

let ok = 0, ko = 0;
function esito(cond, desc, dettaglio){
  if (cond) { ok++; console.log(' OK  ' + desc); }
  else { ko++; console.log(' KO  ' + desc + (dettaglio ? ' — ' + dettaglio : '')); }
}

const RADICE = path.join(__dirname, '..', '..');
const HTML = fs.readFileSync(path.join(RADICE, 'index.html'), 'utf8');
const SRC  = fs.readFileSync(path.join(RADICE, 'dati', 'backtest.js'), 'utf8');
const blocchi = [...HTML.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const APP = blocchi[blocchi.length - 1];

/* ══ 1 · L'ELENCO È DICHIARATO, e si legge da lì invece di essere ricopiato qui ══
 * Un elenco scritto nella prova sarebbe la seconda copia che resta indietro alla prima
 * aggiunta: è la strada doppia che questo progetto ha già pagato con i token di blocco. */
const mEl = SRC.match(/const\s+ESTRATTE\s*=\s*\[([^\]]*)\]/);
esito(!!mEl, 'il banco dichiara l elenco delle funzioni che estrae (ESTRATTE)');
const ESTRATTE = mEl ? mEl[1].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean) : [];
esito(ESTRATTE.length >= 2, 'e l elenco non è vuoto (' + ESTRATTE.length + ': ' + ESTRATTE.join(', ') + ')');

/* ══ 2 · OGNI FUNZIONE ESTRATTA ESISTE DAVVERO IN index.html ══
 * È l'asserzione che coglie la RINOMINA. Da sola non basta — vedi il punto 4 — ma è la
 * metà che cade il giorno in cui qualcuno chiama `dhondt` in un altro modo. */
ESTRATTE.forEach(n => {
  esito(APP.indexOf('function ' + n + '(') >= 0,
    'la funzione «' + n + '» esiste in index.html', 'estratta ma non trovata: rinominata?');
});

/* ══ 3 · E L'ORDINE REGGE: una funzione è estratta prima di chi la chiama ══
 * `eval` dichiara, quindi l'ordine conterebbe poco per le function declaration — ma
 * l'elenco è anche la documentazione della catena, e un ordine sbagliato la rende
 * illeggibile proprio a chi la deve estendere. */
function corpoDi(nome, sorgente){
  const i = sorgente.indexOf('function ' + nome + '(');
  if (i < 0) return '';
  let d = 0, j = sorgente.indexOf('{', i);
  for (let k = j; k < sorgente.length; k++){
    if (sorgente[k] === '{') d++;
    else if (sorgente[k] === '}'){ d--; if (!d){ j = k; break; } }
  }
  return sorgente.slice(i, j + 1);
}

/* ══ 4 · LA CHIUSURA DELLE DIPENDENZE — è questa la prova che mancava ══
 * Le funzioni chiamate da una funzione estratta devono essere risolte. Le chiamate su un
 * oggetto (`x.forEach(`) non contano, e nemmeno le funzioni dichiarate dentro il corpo
 * stesso — `invD` definisce `fit` e la chiama. */
const PAROLE = new Set(['if','for','while','switch','catch','return','function','typeof',
  'new','delete','void','do','else','in','of','instanceof']);
const BUILTIN = new Set(['Math','Object','Array','String','Number','JSON','Date','Boolean',
  'isNaN','parseFloat','parseInt','console','Set','Map','RegExp','Error']);

/* L'INVENTARIO DI CIÒ CHE NON SI ESTRAE, CON LA RAGIONE — l'idioma di opacita.js.
 * Una funzione può restare fuori solo se il banco non percorre mai il ramo che la chiama,
 * e quella condizione non si dichiara soltanto: la prova il punto 6, che esegue il banco.
 * Se il ramo venisse percorso, l'esecuzione morirebbe con un ReferenceError. */
const NON_ESTRATTE = {
  coppieRiparto: 'ramo mai percorso: il banco passa sempre cp=[] a dhondt, perché nel 2020-22 ' +
                 'non c erano apparentamenti e quelli del 2026 non devono entrare in un riparto storico'
};

const definiteNelBanco = new Set([...SRC.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(m => m[1]));
const nonRisolte = [];
ESTRATTE.forEach(n => {
  const corpo = corpoDi(n, APP);
  const interne = new Set([...corpo.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(m => m[1]));
  const chiamate = [...corpo.matchAll(/(\.?)\b([A-Za-z_$][\w$]*)\s*\(/g)]
    .filter(m => !m[1])                       /* non è un metodo di un oggetto */
    .map(m => m[2])
    .filter(x => !PAROLE.has(x) && !BUILTIN.has(x) && !interne.has(x) && x !== n);
  [...new Set(chiamate)].forEach(c => {
    const risolta = ESTRATTE.includes(c) || definiteNelBanco.has(c) || NON_ESTRATTE[c];
    if (!risolta) nonRisolte.push(n + ' chiama ' + c);
  });
});
esito(nonRisolte.length === 0,
  'ogni funzione chiamata da una estratta è risolta: estratta, dichiarata fuori, o definita dal banco',
  nonRisolte.join(' · '));

/* e il verso che manca sempre: una voce dell inventario che non serve più va TOLTA, o
 * l inventario diventa una scusa invece di una guardia. */
const tutteLeChiamate = new Set();
ESTRATTE.forEach(n => {
  const corpo = corpoDi(n, APP);
  [...corpo.matchAll(/(\.?)\b([A-Za-z_$][\w$]*)\s*\(/g)].filter(m => !m[1]).forEach(m => tutteLeChiamate.add(m[2]));
});
Object.keys(NON_ESTRATTE).forEach(k => {
  esito(tutteLeChiamate.has(k),
    'la voce «' + k + '» dell inventario è ancora esercitata da una funzione estratta',
    'nessuna la chiama più: va tolta dall inventario');
  esito(/\S/.test(NON_ESTRATTE[k]), 'e porta una ragione scritta');
});

/* ══ 5 · IL SORGENTE SI LEGGE DA index.html, NON DA UN PRODOTTO ══
 * `test/app.js` è rigenerato da estrai.mjs: leggerlo vuol dire misurare quello che
 * qualcuno ha estratto l ultima volta, che può non essere il file pubblicato. E il
 * percorso è risolto su __dirname, o il banco dipende dalla cartella da cui lo si lancia —
 * la trappola a orologeria di ogni script di misura di questo progetto. */
esito(/readFileSync\(\s*path\.join\(__dirname/.test(SRC),
  'il banco risolve il sorgente su __dirname, non sulla cartella corrente');
esito(/index\.html/.test(SRC) && !/readFileSync\(\s*['"]app\.js['"]/.test(SRC),
  'e lo legge da index.html invece che dal prodotto app.js');

/* ══ 6 · IL CONTROLLO CHE SA FALLIRE: il banco GIRA e dice quello che la pagina pubblica ══
 * Senza questo, tutte le asserzioni di sopra potrebbero essere verdi su uno strumento che
 * non parte — che è esattamente lo stato in cui il file è rimasto per ventuno giorni.
 * E i valori attesi si leggono da BT in index.html invece di essere ricopiati qui: sono i
 * numeri che la pagina PUBBLICA, quindi il legame è fra il banco e ciò che il lettore vede. */
let proietta = null, erroreCaricamento = null;
try { proietta = require(path.join(RADICE, 'dati', 'backtest.js')).proietta; }
catch(e){ erroreCaricamento = e.message; }
esito(typeof proietta === 'function', 'dati/backtest.js si carica ed espone proietta()', erroreCaricamento);

const BT = [...HTML.matchAll(/\{e:'([^']+)',\s*g:\s*(\d+),\s*m:\s*(\d+),\s*r:\s*(\d+)\}/g)]
  .map(m => ({e: m[1], g: +m[2], m: +m[3], r: +m[4]}));
esito(BT.length === 7, 'le sette istantanee di BT si leggono da index.html (' + BT.length + ')');

if (proietta && BT.length){
  const ST = require(path.join(RADICE, 'dati', 'storico.js'));
  /* SIM basso apposta: i seggi escono da dhondt() sulle quote medie e non dipendono dal
     Monte Carlo — quello serve solo agli intervalli, che qui non si guardano. */
  let coincidono = 0, divergenze = [];
  Object.keys(ST).forEach(k => {
    const caso = ST[k];
    /* L APPAIAMENTO È SU ANNO E GIORNI, NON SUL NOME: BT chiama «ultima settimana» le tre
       istantanee che storico.js chiama «finale», quindi un confronto sulle etichette ne
       perdeva tre in silenzio — contava 4 su 7 e sembrava una divergenza del banco. Anno e
       distanza dal voto sono dati, e coincidono per costruzione. */
    const atteso = BT.find(b => b.g === caso.giorni && b.e.slice(0, 4) === k.slice(0, 4));
    if (!atteso) return;
    let seg;
    try { seg = proietta(caso, 200).SEG; } catch(e){ divergenze.push(k + ': ' + e.message); return; }
    const somma = caso.blocco.reduce((a, x) => a + (seg[x] || 0), 0);
    if (somma === atteso.m) coincidono++;
    else divergenze.push(k + ': banco ' + somma + ' contro BT ' + atteso.m);
  });
  esito(divergenze.length === 0 && coincidono === BT.length,
    'il banco riproduce tutte e sette le istantanee che la pagina pubblica (' + coincidono + '/' + BT.length + ')',
    divergenze.join(' · '));
}

console.log('\n' + ok + '/' + (ok + ko));
if (ko) process.exit(1);
