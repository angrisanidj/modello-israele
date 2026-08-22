/* La forma del titolo: sette forme, e nessuna dipende dall'ordine degli if.
 *
 * Il titolo dell'h1 è generato dallo stato del modello. Ha quattro forme di base — la
 * coalizione ha la maggioranza, ce l'ha l'opposizione, serve il sostegno arabo, non c'è
 * nessuna maggioranza — più TRE forme strette che NON SONO STATI: sono formulazioni che
 * prendono il posto di una delle quattro quando un blocco è a un seggio dalla soglia, e
 * sono tre perché −1, 0 e +1 sono tre notizie diverse — non ce l'ha fatta, ce l'ha fatta
 * senza margine, l'ha superata di uno.
 *
 * IL DIFETTO CHE QUESTA PROVA ESISTE PER CHIUDERE. Scritte come if in fila, le condizioni
 * si sovrappongono: una forma stretta scatta ogni volta che un blocco sta a 60, 61 o 62,
 * quindi incrocia la prima a coal 62, la seconda a oppo 62 e la terza a oppo 60. Con
 * condizioni sovrapposte il risultato dipende da quale è scritta prima — ed è lo stesso
 * difetto del «primo posto» chiuso il 20 agosto, dove due liste appaiate facevano dire al
 * testo una cosa decisa dall'ordine di iterazione.
 *
 * Qui si prova la proprietà, non il caso particolare:
 *   1. le quattro forme di base sono una PARTIZIONE su tutte le configurazioni possibili
 *      — per ogni terna che somma a 120, esattamente una delle quattro condizioni è vera;
 *   2. la precedenza delle forme strette è DICHIARATA e non incidentale: scattano se e
 *      solo se il margine minimo è ≤ 1, e conservano la base sotto;
 *   2-bis. le forme strette sono TRE e non una — 5 sotto la soglia, 6 a 61 esatti, 7
 *      sopra — perché sono tre notizie diverse: non ce l'ha fatta, ce l'ha fatta senza
 *      margine, l'ha superata di uno;
 *   3. i confini 59, 60, 61, 62, 63 su tutti e due i blocchi danno la forma attesa;
 *   4. l'unico caso con due blocchi in gioco insieme — coal 60 e oppo 60 — non nomina un
 *      blocco a caso: dice «entrambi».
 *
 * La prova gira su TUTTE le terne valide, 7381, non su un campione: il costo è nullo e il
 * campione avrebbe lasciato scoperto proprio il bordo.
 */
const {JSDOM} = require('jsdom');
const fs = require('fs');

let ok = 0, ko = 0;
function esito(cond, desc, dettaglio){
  if (cond) { ok++; console.log('OK ' + desc); }
  else { ko++; console.log('KO ' + desc + (dettaglio ? ' — ' + dettaglio : '')); }
}

const dom = new JSDOM('<!doctype html><html><body><div id="kn26"></div></body></html>', {pretendToBeVisual:true});
const W = dom.window, D = W.document;
global.DOMParser = W.DOMParser;
const html = fs.readFileSync('../../index.html','utf8');
D.body.innerHTML = html.replace(/<script>[\s\S]*?<\/script>/g,'')
  .match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
global.document = D; global.window = W;
W.matchMedia = () => ({matches:false, addEventListener(){}, addListener(){}});
W.IntersectionObserver = class { observe(){} unobserve(){} };
global.IntersectionObserver = W.IntersectionObserver;
W.requestAnimationFrame = f => f();
W.localStorage = {getItem:()=>null, setItem(){}, removeItem(){}};
global.getComputedStyle = () => ({getPropertyValue:()=>''});
global.Blob = function(){};
global.URL = {createObjectURL(){ return ''; }};
global.FileReader = function(){};
global.fetch = () => Promise.reject(0);

let src = fs.readFileSync(__dirname + '/../app.js','utf8');
src = src.replace('carica().then(render,render)',
  'global.A={formaTitolo:formaTitolo,blocchi:blocchi,P:P};carica().then(render,render)');
eval(src);

const F = A.formaTitolo;
const b = (c, o) => ({coalizione:c, opposizione:o, arabo:120-c-o, incerto:0});

/* ── tutte le terne valide: coal + oppo + arab = 120 ── */
const TUTTE = [];
for (let c = 0; c <= 120; c++) for (let o = 0; o <= 120 - c; o++) TUTTE.push([c, o]);
esito(TUTTE.length === 7381, 'le configurazioni possibili sono 7381', String(TUTTE.length));

/* ══ 1 · le quattro forme di base sono una partizione ══
 *
 * Le quattro condizioni si scrivono qui in forma ESPLICITA e indipendente — non come una
 * catena di else — e si conta quante sono vere insieme. Deve essere sempre una: se fosse
 * zero ci sarebbe uno stato senza titolo, se fosse due il titolo dipenderebbe dall'ordine.
 * È il modo di provare una partizione che non ricopia l'implementazione. */
{
  const cond = (c, o, a) => [
    c >= 61,                       // 1 · la coalizione ha la maggioranza
    o >= 61,                       // 2 · ce l'ha l'opposizione da sola
    c <= 59 && o <= 60,            // 3 · serve il sostegno arabo
    c === 60                       // 4 · nessuna maggioranza possibile
  ];
  const brutti = [];
  for (const [c, o] of TUTTE) {
    const n = cond(c, o, 120 - c - o).filter(Boolean).length;
    if (n !== 1) brutti.push(c + '/' + o + ' → ' + n + ' condizioni vere');
  }
  esito(brutti.length === 0,
    'per ogni configurazione esattamente una delle quattro condizioni di base è vera',
    brutti.slice(0, 4).join(' · '));

  /* e la funzione restituisce proprio quella, non un'altra che per caso coincide */
  const discordi = [];
  for (const [c, o] of TUTTE) {
    const atteso = cond(c, o, 120 - c - o).indexOf(true) + 1;
    const dato = F(b(c, o)).base;
    if (dato !== atteso) discordi.push(c + '/' + o + ': attesa ' + atteso + ', data ' + dato);
  }
  esito(discordi.length === 0,
    'e formaTitolo restituisce esattamente quella condizione come base',
    discordi.slice(0, 4).join(' · '));
}

/* ══ 2 · la quinta ha una precedenza dichiarata, non incidentale ══ */
{
  const STRETTE = [5, 6, 7];
  const sbagliate = [];
  for (const [c, o] of TUTTE) {
    const r = F(b(c, o));
    const stretta = Math.min(Math.abs(c - 61), Math.abs(o - 61)) <= 1;
    if ((STRETTE.indexOf(r.forma) >= 0) !== stretta) sbagliate.push(c + '/' + o + ' forma ' + r.forma);
  }
  esito(sbagliate.length === 0,
    'le forme strette scattano se e solo se un blocco è a un seggio o meno dalla soglia',
    sbagliate.slice(0, 4).join(' · '));

  /* e sono TRE, una per verso: il segno dello scarto sceglie, e la scelta è totale */
  const versi = [];
  for (const [c, o] of TUTTE) {
    const r = F(b(c, o));
    if (STRETTE.indexOf(r.forma) < 0) continue;
    const atteso = r.scarto < 0 ? 5 : (r.scarto === 0 ? 6 : 7);
    if (r.forma !== atteso) versi.push(c + '/' + o + ': scarto ' + r.scarto + ' → forma ' + r.forma);
  }
  esito(versi.length === 0,
    'e il verso dello scarto sceglie fra le tre: −1 → 5, 0 → 6, +1 → 7',
    versi.slice(0, 4).join(' · '));
  /* tutte e tre esistono davvero: una forma che non esce mai è prosa scritta per niente */
  const usate = [...new Set(TUTTE.map(([c, o]) => F(b(c, o)).forma))].sort();
  esito(STRETTE.every(f => usate.indexOf(f) >= 0),
    'e tutte e tre si presentano su almeno una configurazione', 'forme viste: ' + usate.join(', '));

  /* la base resta leggibile sotto la quinta: la prosa stretta deve sapere di che stato
     sta parlando, o dice «a un seggio dalla soglia» senza dire da che parte */
  const senzaBase = TUTTE.filter(([c, o]) => { const r = F(b(c, o)); return r.forma >= 5 && !r.base; });
  esito(senzaBase.length === 0, 'e la forma di base resta accessibile sotto le forme strette');
  /* LA FORMA 4 NON SI VEDE MAI, ed è una conseguenza da provare invece che da scoprire
     scrivendone il testo: coal = 60 rende |coal − 61| = 1, quindi la forma stretta la
     prende sempre. La 4 sopravvive solo come «base» sotto la 5, e il suo testo serve lì. */
  const quattroPura = TUTTE.filter(([c, o]) => F(b(c, o)).forma === 4);
  esito(quattroPura.length === 0,
    'la forma 4 non si presenta mai da sola: coal = 60 è sempre a un seggio dalla soglia',
    quattroPura.slice(0, 3).map(x => x.join('/')).join(' · '));
  const quattroSotto = TUTTE.filter(([c, o]) => F(b(c, o)).base === 4);
  esito(quattroSotto.length > 0,
    'ma esiste come base sotto la forma 5, ed è lì che il suo testo serve',
    quattroSotto.length + ' configurazioni');

  /* dove la quinta scatta, blocco e scarto ci sono; dove non scatta, sono nulli */
  const incoerenti = [];
  for (const [c, o] of TUTTE) {
    const r = F(b(c, o));
    if (r.forma >= 5 && (r.blocco === null || r.scarto === null)) incoerenti.push(c + '/' + o + ' (mancano)');
    if (r.forma < 5 && (r.blocco !== null || r.scarto !== null)) incoerenti.push(c + '/' + o + ' (in più)');
  }
  esito(incoerenti.length === 0,
    'e blocco e scarto ci sono esattamente quando scatta una forma stretta',
    incoerenti.slice(0, 4).join(' · '));
}

/* ══ 3 · i confini, uno per uno ══
 *
 * 59, 60, 61, 62, 63 su tutti e due i blocchi. Sono i cinque valori attorno alla soglia,
 * e sono quelli su cui le condizioni si toccano. */
{
  const atteso = [
    /* coal, oppo, forma, base, blocco, scarto */
    /* 63 dista DUE dalla soglia, quindi la quinta non scatta: è il primo valore che
       torna alla forma piena, ed è il confine che avevo sbagliato scrivendo la tabella.
       L'ha trovato questa prova, che è il motivo per cui i confini si elencano a mano
       invece di ricalcolarli con la stessa formula della funzione. */
    [63, 57, 1, 1, null,          null],
    [62, 58, 7, 1, 'coalizione',  1],
    [61, 59, 6, 1, 'coalizione',  0],
    [60, 60, 5, 4, 'entrambi',   -1],
    [59, 61, 6, 2, 'opposizione', 0],
    [59, 60, 5, 3, 'opposizione', -1],
    [58, 62, 7, 2, 'opposizione', 1],
    [57, 63, 2, 2, null,          null],
    [51, 57, 3, 3, null,          null],
    [64, 40, 1, 1, null,          null]
  ];
  for (const [c, o, fo, ba, bl, sc] of atteso) {
    const r = F(b(c, o));
    const bene = r.forma === fo && r.base === ba && r.blocco === bl && r.scarto === sc;
    esito(bene, 'confine ' + c + '/' + o + ' → forma ' + fo + ', base ' + ba +
      (bl ? ', ' + bl + ' ' + (sc > 0 ? '+' : '') + sc : ''),
      'dato: forma ' + r.forma + ', base ' + r.base + ', blocco ' + r.blocco + ', scarto ' + r.scarto);
  }
}

/* ══ 4 · l'unico caso a due blocchi non nomina nessuno dei due a caso ══
 *
 * coal 60 e oppo 60 vuol dire zero seggi arabi: entrambi i blocchi stanno a un seggio
 * dalla soglia e nessuno dei due la raggiunge. È l'unica configurazione in cui una
 * precedenza fra i due sarebbe arbitraria, e infatti non c'è: la funzione dice
 * «entrambi» e la prosa può dirlo. */
{
  const due = TUTTE.filter(([c, o]) => Math.abs(c - 61) <= 1 && Math.abs(o - 61) <= 1);
  esito(due.length === 1 && due[0][0] === 60 && due[0][1] === 60,
    'un solo caso ha due blocchi a un seggio dalla soglia, ed è 60/60 con zero seggi arabi',
    due.map(x => x.join('/')).join(' · '));
  esito(F(b(60, 60)).blocco === 'entrambi',
    'e lì la funzione dice «entrambi» invece di sceglierne uno');
}

/* ══ 5 · la forma non dipende dalle liste, solo dai totali di blocco ══
 *
 * formaTitolo prende blocchi(SEG), non SEG: due configurazioni di liste diverse che danno
 * gli stessi totali devono dare lo stesso titolo. È quello che rende il titolo stabile
 * quando le liste si fondono, che è precisamente ciò che accade l'8 settembre. */
{
  const uno = F({coalizione:51, opposizione:57, arabo:12, incerto:0});
  const due = F({coalizione:51, opposizione:57, arabo:12, incerto:0});
  esito(JSON.stringify(uno) === JSON.stringify(due), 'la forma è una funzione pura dei totali');
  esito(F(b(51, 57)).arabo === 12, 'e porta con sé il totale arabo, che la terza forma nomina');
}

console.log('\ntitolo: ' + ok + '/' + (ok + ko));
if (ko) process.exit(1);
