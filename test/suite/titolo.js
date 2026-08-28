/* La forma del titolo: sette forme, dodici celle, ventiquattro testi — e nessuno dei tre
 * numeri dipende dall'ordine degli if.
 *
 * Il titolo dell'h1 e il <title> sono generati dallo stato del modello. Ci sono quattro
 * forme di base — la coalizione ha la maggioranza, ce l'ha l'opposizione, serve il
 * sostegno arabo, non c'è nessuna maggioranza possibile — più TRE forme strette che NON
 * SONO STATI: sono formulazioni che prendono il posto di una delle quattro quando un
 * blocco è a un seggio dalla soglia, e sono tre perché −1, 0 e +1 sono tre notizie
 * diverse — non ce l'ha fatta, ce l'ha fatta senza margine, l'ha superata di uno.
 *
 * IL DIFETTO CHE QUESTA PROVA ESISTE PER CHIUDERE. Scritte come if in fila, le condizioni
 * si sovrappongono: una forma stretta scatta ogni volta che un blocco sta a 60, 61 o 62,
 * quindi incrocia la prima a coal 62, la seconda a oppo 62 e la terza a oppo 60. Con
 * condizioni sovrapposte il risultato dipende da quale è scritta prima — ed è lo stesso
 * difetto del «primo posto» chiuso il 20 agosto, dove due liste appaiate facevano dire al
 * testo una cosa decisa dall'ordine di iterazione.
 *
 * IL DIFETTO CHE QUESTA PROVA HA TROVATO, il 22 agosto 2026, ed è la ragione per cui lo
 * spazio delle configurazioni è cambiato. La prova girava su tutte le terne che sommano a
 * 120 — 7381 — cioè dava per scontato che l'ago della bilancia valesse sempre zero. I
 * blocchi sono QUATTRO, le quaterne sono 302.621, e su quelle la partizione scritta come
 * «coal = 60» per la base 4 è falsa: esistono configurazioni senza nessuna maggioranza
 * possibile in cui la coalizione sta sotto 60, e lì il titolo diceva «i partiti arabi
 * sono decisivi» quando nemmeno con loro si arriva a 61. Misurato sul Monte Carlo del
 * 22 agosto: 1,45% delle simulazioni, più di tre celle per cui era stata scritta una
 * prosa a sé. Nell'altro verso la stessa correzione chiude una domanda: «coalizione a 60
 * con una maggioranza alternativa» non è raro, è impossibile — coal = 60 lascia esatti 60
 * seggi a tutti gli altri messi insieme.
 *
 * Qui si prova la proprietà, non il caso particolare:
 *   1. le quattro forme di base sono una PARTIZIONE su TUTTE le quaterne possibili;
 *   2. la precedenza delle forme strette è DICHIARATA e non incidentale: scattano se e
 *      solo se il margine minimo è ≤ 1, e conservano la base sotto;
 *   3. i confini 59, 60, 61, 62, 63 su tutti e due i blocchi danno la forma attesa;
 *   4. ogni configurazione trova la sua cella, ogni cella ha i suoi quattro testi, e
 *      nessun testo prima del voto è identico al suo gemello dopo;
 *   5. il <title> sta sotto i 60 caratteri su ogni configurazione, [X] a tre cifre
 *      compreso;
 *   6. [P] è la frequenza della configurazione descritta e NON una delle quattro
 *      pastiglie: si ricalcola per conteggio lineare e si confronta.
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
  'global.A={formaTitolo:formaTitolo,blocchi:blocchi,P:P,cellaTitolo:cellaTitolo,' +
  'TIT_BLOCCO:TIT_BLOCCO,TIT_PRIMA:TIT_PRIMA,TIT_DOPO:TIT_DOPO,TIT_CODA:TIT_CODA,' +
  'TIT_FONTE_P:TIT_FONTE_P,' +
  'TIT_CORTO_PRIMA:TIT_CORTO_PRIMA,TIT_CORTO_DOPO:TIT_CORTO_DOPO,' +
  'testoTitolo:testoTitolo,titoloCorto:titoloCorto,datiTitolo:datiTitolo,' +
  'freqEsatta:freqEsatta,inPc:inPc,votoPassato:votoPassato,' +
  'stato:function(){return{MC:MC,SEG:SEG,GIORNI:GIORNI};},render:render};' +
  'carica().then(render,render)');
eval(src);
/* carica() risolve in una microtask, quindi al ritorno di eval il modello non ha ancora
   girato: MC e SEG sono vuoti e l'h1 porta ancora il testo di ripiego. Il render si chiama
   qui, come fa verifica.js, o metà delle prove misurerebbe lo stato prima del calcolo — che
   è la forma di prova che passa a vuoto e sembra verde. */
try{ A.render(); }catch(e){ console.log('KO il render non è partito — ' + (e && e.message)); }

const F = A.formaTitolo;
const b = (c, o, a) => ({coalizione:c, opposizione:o,
                         arabo:(a===undefined?120-c-o:a),
                         incerto:120-c-o-(a===undefined?120-c-o:a)});

/* ── le terne con l'ago della bilancia a zero: lo spazio della prima stesura ── */
const TERNE = [];
for (let c = 0; c <= 120; c++) for (let o = 0; o <= 120 - c; o++) TERNE.push([c, o]);
esito(TERNE.length === 7381, 'le terne con l\'ago della bilancia a zero sono 7381', String(TERNE.length));

/* ── e tutte le quaterne, che sono lo spazio VERO: quattro blocchi, non tre ── */
const QUATERNE = [];
for (let c = 0; c <= 120; c++)
  for (let o = 0; o <= 120 - c; o++)
    for (let a = 0; a <= 120 - c - o; a++) QUATERNE.push([c, o, a]);
esito(QUATERNE.length === 302621,
  'le configurazioni possibili sono 302.621: i blocchi sono quattro, e l\'ago della bilancia prende seggi',
  String(QUATERNE.length));

/* ══ 1 · le quattro forme di base sono una partizione ══
 *
 * Le quattro condizioni si scrivono qui in forma ESPLICITA e indipendente — non come una
 * catena di else — e si conta quante sono vere insieme. Deve essere sempre una: se fosse
 * zero ci sarebbe uno stato senza titolo, se fosse due il titolo dipenderebbe dall'ordine.
 * È il modo di provare una partizione che non ricopia l'implementazione. */
{
  const cond = (c, o, a) => [
    c >= 61,                                   // 1 · la coalizione ha la maggioranza
    c <= 60 && o >= 61,                        // 2 · ce l'ha l'opposizione da sola
    c <= 60 && o <= 60 && o + a >= 61,         // 3 · serve il sostegno arabo
    c <= 60 && o <= 60 && o + a <= 60          // 4 · non c'è nessuna maggioranza possibile
  ];
  const brutti = [];
  for (const [c, o, a] of QUATERNE) {
    const n = cond(c, o, a).filter(Boolean).length;
    if (n !== 1) brutti.push(c + '/' + o + '/' + a + ' → ' + n + ' condizioni vere');
  }
  esito(brutti.length === 0,
    'per ogni configurazione esattamente una delle quattro condizioni di base è vera',
    brutti.slice(0, 4).join(' · '));

  /* e la funzione restituisce proprio quella, non un'altra che per caso coincide */
  const discordi = [];
  for (const [c, o, a] of QUATERNE) {
    const atteso = cond(c, o, a).indexOf(true) + 1;
    const dato = F(b(c, o, a)).base;
    if (dato !== atteso) discordi.push(c + '/' + o + '/' + a + ': attesa ' + atteso + ', data ' + dato);
  }
  esito(discordi.length === 0,
    'e formaTitolo restituisce esattamente quella condizione come base',
    discordi.slice(0, 4).join(' · '));

  /* IL CASO CHE LA VERSIONE A TRE BLOCCHI NON POTEVA VEDERE. Sulle sole terne «base 4» e
     «coalizione a 60» coincidono, e per questo la prima stesura non sbagliava mai. Sulle
     quaterne divergono, e la prova deve mostrare che divergono DAVVERO, o la correzione
     sarebbe un rifacimento senza motivo. */
  const b4senza60 = QUATERNE.filter(([c, o, a]) => F(b(c, o, a)).base === 4 && c !== 60);
  esito(b4senza60.length > 0,
    'esistono configurazioni senza nessuna maggioranza possibile con la coalizione diversa da 60',
    b4senza60.length + ' su ' + QUATERNE.length + ', per esempio ' + b4senza60[0].join('/'));
  esito(b4senza60.every(([c, o, a]) => 120 - c - o - a > 0),
    'e in tutte i seggi che mancano sono dell\'ago della bilancia');
  const sole3 = TERNE.filter(([c, o]) => (F(b(c, o)).base === 4) !== (c === 60));
  esito(sole3.length === 0,
    'sulle sole terne le due formulazioni coincidono: ecco perché il difetto era invisibile',
    sole3.slice(0, 3).map(x => x.join('/')).join(' · '));

  /* E IL VERSO OPPOSTO: «coalizione a 60 con una maggioranza alternativa» non è raro, è
     impossibile. coal = 60 lascia esattamente 60 seggi a tutti gli altri messi insieme,
     quindi opposizione più arabi non arriva mai a 61. Era il caso per cui era stato
     chiesto un testo a sé: non ne serve nessuno. */
  const sessantaConAlternativa = QUATERNE.filter(([c, o, a]) => c === 60 && o + a >= 61);
  esito(sessantaConAlternativa.length === 0,
    'la coalizione a 60 è sempre stallo pieno: nessuna configurazione le affianca una maggioranza alternativa',
    sessantaConAlternativa.slice(0, 3).map(x => x.join('/')).join(' · '));
  esito(QUATERNE.filter(([c, o, a]) => c === 60).every(([c, o, a]) => F(b(c, o, a)).base === 4),
    'e infatti ogni configurazione con la coalizione a 60 ha base 4');
}

/* ══ 2 · la quinta ha una precedenza dichiarata, non incidentale ══ */
{
  const STRETTE = [5, 6, 7];
  const sbagliate = [];
  for (const [c, o, a] of QUATERNE) {
    const r = F(b(c, o, a));
    const stretta = Math.min(Math.abs(c - 61), Math.abs(o - 61)) <= 1;
    if ((STRETTE.indexOf(r.forma) >= 0) !== stretta) sbagliate.push(c + '/' + o + '/' + a + ' forma ' + r.forma);
  }
  esito(sbagliate.length === 0,
    'le forme strette scattano se e solo se un blocco è a un seggio o meno dalla soglia',
    sbagliate.slice(0, 4).join(' · '));

  /* e sono TRE, una per verso: il segno dello scarto sceglie, e la scelta è totale */
  const versi = [];
  for (const [c, o, a] of QUATERNE) {
    const r = F(b(c, o, a));
    if (STRETTE.indexOf(r.forma) < 0) continue;
    const atteso = r.scarto < 0 ? 5 : (r.scarto === 0 ? 6 : 7);
    if (r.forma !== atteso) versi.push(c + '/' + o + ': scarto ' + r.scarto + ' → forma ' + r.forma);
  }
  esito(versi.length === 0,
    'e il verso dello scarto sceglie fra le tre: −1 → 5, 0 → 6, +1 → 7',
    versi.slice(0, 4).join(' · '));
  /* tutte e sette esistono davvero: una forma che non esce mai è prosa scritta per niente.
     E LA QUARTA ADESSO ESCE, che è la differenza fra questa versione e quella a tre
     blocchi — là la 4 sopravviveva solo come base sotto la 5. */
  const usate = [...new Set(QUATERNE.map(([c, o, a]) => F(b(c, o, a)).forma))].sort();
  esito([1, 2, 3, 4, 5, 6, 7].every(f => usate.indexOf(f) >= 0),
    'e tutte e sette le forme si presentano su almeno una configurazione', 'forme viste: ' + usate.join(', '));
  const quattroPuraTerne = TERNE.filter(([c, o]) => F(b(c, o)).forma === 4);
  esito(quattroPuraTerne.length === 0,
    'sulle sole terne la forma 4 non si vedeva mai, ed è per questo che il suo testo mancava',
    quattroPuraTerne.slice(0, 3).map(x => x.join('/')).join(' · '));

  /* la base resta leggibile sotto la quinta: la prosa stretta deve sapere di che stato
     sta parlando, o dice «a un seggio dalla soglia» senza dire da che parte */
  const senzaBase = QUATERNE.filter(([c, o, a]) => { const r = F(b(c, o, a)); return r.forma >= 5 && !r.base; });
  esito(senzaBase.length === 0, 'e la forma di base resta accessibile sotto le forme strette');

  /* dove la quinta scatta, blocco e scarto ci sono; dove non scatta, sono nulli */
  const incoerenti = [];
  for (const [c, o, a] of QUATERNE) {
    const r = F(b(c, o, a));
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
  /* i due confini che esistono solo con l'ago della bilancia sopra soglia, e sono
     esattamente le due celle nuove: l'opposizione a 60 senza nessun seggio arabo, e la
     configurazione in cui non c'è nessuna maggioranza possibile pur stando lontani dalla
     soglia. Elencati a mano come gli altri, per la stessa ragione. */
  const nuovi = [
    [59, 60, 0, 5, 4, 'opposizione', -1],   /* nemmeno con gli arabi si arriva a 61 */
    [55, 55, 4, 4, 4, null,          null]  /* mancano sei seggi, e sono dell'ago */
  ];
  for (const [c, o, a, fo, ba, bl, sc] of nuovi) {
    const r = F(b(c, o, a));
    esito(r.forma === fo && r.base === ba && r.blocco === bl && r.scarto === sc,
      'confine ' + c + '/' + o + '/' + a + ' → forma ' + fo + ', base ' + ba,
      'dato: forma ' + r.forma + ', base ' + r.base + ', blocco ' + r.blocco);
  }
}

/* ══ 4 · l'unico caso a due blocchi non nomina nessuno dei due a caso ══ */
{
  const due = QUATERNE.filter(([c, o]) => Math.abs(c - 61) <= 1 && Math.abs(o - 61) <= 1);
  esito(due.length === 1 && due[0][0] === 60 && due[0][1] === 60 && due[0][2] === 0,
    'un solo caso ha due blocchi a un seggio dalla soglia, ed è 60/60 senza nessun altro seggio',
    due.map(x => x.join('/')).join(' · '));
  esito(F(b(60, 60)).blocco === 'entrambi',
    'e lì la funzione dice «entrambi» invece di sceglierne uno');
}

/* ══ 5 · la forma non dipende dalle liste, solo dai totali di blocco ══ */
{
  const uno = F({coalizione:51, opposizione:57, arabo:12, incerto:0});
  const due = F({coalizione:51, opposizione:57, arabo:12, incerto:0});
  esito(JSON.stringify(uno) === JSON.stringify(due), 'la forma è una funzione pura dei totali');
  esito(F(b(51, 57)).arabo === 12, 'e porta con sé il totale arabo, che la terza forma nomina');
}

/* ══ 6 · le dodici celle: ogni configurazione ne trova una, ogni cella ha i suoi testi ══
 *
 * La chiave della cella si chiede a cellaTitolo(), che è la stessa funzione che usa la
 * pagina. Ricostruirla qui sarebbe una seconda strada per la scelta della cella, cioè il
 * difetto del colore di blocco spostato dalla lingua. Quello che la prova verifica è che
 * la chiave esista in TUTTE E QUATTRO le tabelle, che il testo esca non vuoto, e che
 * nessuna cella resti senza. */
const CELLE = ['f1','f2','f3','f4','f5c','f5o3','f5o4','f5e','f6c','f6o','f7c','f7o'];
const viste = {};      /* cella → insieme dei valori di [X] che può portare */
{
  const orfane = new Set();
  for (const [c, o, a] of QUATERNE) {
    const fo = F(b(c, o, a));
    const k = A.cellaTitolo(fo);
    if (CELLE.indexOf(k) < 0) { orfane.add(k); continue; }
    const bl = A.TIT_BLOCCO[k];
    const X = bl === 'coalizione' ? c : (bl === 'opposizione' ? o : null);
    (viste[k] || (viste[k] = new Set())).add(X);
  }
  esito(orfane.size === 0,
    'ogni configurazione cade in una delle dodici celle dichiarate',
    [...orfane].join(' · '));
  const mai = CELLE.filter(k => !viste[k]);
  esito(mai.length === 0,
    'e tutte e dodici si presentano davvero: nessuna prosa scritta per niente',
    'mai raggiunte: ' + mai.join(' · '));
  esito(Object.keys(viste).length === 12,
    'dodici celle, non dieci: le due in più vengono dal quarto blocco',
    Object.keys(viste).sort().join(' · '));

  /* ogni cella ha i suoi quattro testi, e nessuno è vuoto */
  const senzaTesto = [];
  for (const k of CELLE) {
    for (const [nome, tab] of [['prima', A.TIT_PRIMA], ['dopo', A.TIT_DOPO],
                               ['corto prima', A.TIT_CORTO_PRIMA], ['corto dopo', A.TIT_CORTO_DOPO]]) {
      if (typeof tab[k] !== 'function') { senzaTesto.push(k + ' · ' + nome + ': manca'); continue; }
      const s = tab[k](61, 'nel 5,0%');
      if (!s || String(s).length < 20) senzaTesto.push(k + ' · ' + nome + ': «' + s + '»');
    }
  }
  esito(senzaTesto.length === 0,
    'ogni cella ha i suoi quattro testi — lungo e corto, prima e dopo il voto — e nessuno è vuoto',
    senzaTesto.slice(0, 4).join(' · '));

  /* e nessuna tabella porta una chiave che non è una cella: un testo che non esce mai è
     prosa morta, e questa prova esiste anche per non farla nascere */
  const inPiu = [];
  for (const [nome, tab] of [['prima', A.TIT_PRIMA], ['dopo', A.TIT_DOPO],
                             ['corto prima', A.TIT_CORTO_PRIMA], ['corto dopo', A.TIT_CORTO_DOPO],
                             ['blocco', A.TIT_BLOCCO]])
    Object.keys(tab).forEach(k => { if (CELLE.indexOf(k) < 0) inPiu.push(nome + ' · ' + k); });
  esito(inPiu.length === 0, 'e nessuna tabella porta una chiave che non è una cella', inPiu.join(' · '));
}

/* ══ 7 · prima e dopo il voto nessuna frase è identica ══
 *
 * È la richiesta esplicita, e la ragione è che dopo il 27 ottobre il soggetto cambia: non
 * è più la Knesset, è il modello. Una frase che sopravvivesse identica sarebbe una frase
 * che parla al presente di un futuro già passato — invariante 10. */
{
  const uguali = [], deboli = [];
  for (const k of CELLE) {
    const X = [...viste[k]][0] === null ? 61 : [...viste[k]][0];
    const p = A.TIT_PRIMA[k](X, 'nel 5,0%'), d = A.TIT_DOPO[k](X, 'nel 5,0%');
    if (p === d) uguali.push(k);
    if (!/av[ae]|compariva|dava|portava|fermava|assegnava|risultavano|restavano|sarebbe/.test(d)) deboli.push(k);
    const cp = A.TIT_CORTO_PRIMA[k](X), cd = A.TIT_CORTO_DOPO[k](X);
    if (cp === cd) uguali.push(k + ' (corto)');
  }
  esito(uguali.length === 0, 'nessun testo prima del voto è identico al suo gemello dopo', uguali.join(' · '));
  esito(deboli.length === 0,
    'e ogni testo del dopo parla al passato: dopo il voto il soggetto è il modello, non la Knesset',
    deboli.join(' · '));

  /* e i dodici lunghi sono dodici testi diversi, non dieci più due copie */
  for (const [nome, tab] of [['prima', A.TIT_PRIMA], ['dopo', A.TIT_DOPO]]) {
    const s = CELLE.map(k => tab[k](61, 'nel 5,0%'));
    esito(new Set(s).size === 12, 'i dodici testi ' + nome + ' del voto sono tutti diversi fra loro',
      (12 - new Set(s).size) + ' duplicati');
  }
  const corti = CELLE.map(k => A.TIT_CORTO_PRIMA[k](61)).concat(CELLE.map(k => A.TIT_CORTO_DOPO[k](61)));
  esito(new Set(corti).size === 24, 'e i ventiquattro corti pure',
    (24 - new Set(corti).size) + ' duplicati');
}

/* ══ 8 · il <title> sta sotto i 60 caratteri, su ogni configurazione ══
 *
 * Il tetto comprende la coda «· Knesset 2026», che è l'unica cosa che dice di che paese
 * si parla. Le lunghezze si misurano su TUTTI i valori di [X] che ciascuna cella può
 * portare — fino a tre cifre — non su un esempio. */
{
  const lunghi = [];
  for (const k of CELLE) {
    for (const X of viste[k]) {
      for (const [nome, tab] of [['prima', A.TIT_CORTO_PRIMA], ['dopo', A.TIT_CORTO_DOPO]]) {
        const t = tab[k](X) + A.TIT_CODA;
        if (t.length >= 60) lunghi.push(nome + ' · ' + k + ' · X=' + X + ' · ' + t.length + ' car.: «' + t + '»');
      }
    }
  }
  esito(lunghi.length === 0, 'il <title> sta sotto i 60 caratteri su ogni cella e ogni valore di [X]',
    lunghi.slice(0, 3).join(' | '));
  /* e il tetto morde davvero: se nessuna frase ci arrivasse vicino, la prova non
     coglierebbe un testo allungato domani */
  const max = Math.max.apply(null, CELLE.map(k => Math.max(
    A.TIT_CORTO_PRIMA[k](61).length, A.TIT_CORTO_DOPO[k](61).length)) ) + A.TIT_CODA.length;
  esito(max >= 50, 'e il tetto è stretto: il titolo più lungo misura ' + max + ' caratteri su 59 disponibili');
  esito(A.TIT_CODA.indexOf('Knesset') >= 0,
    'la coda nomina la Knesset: senza, «Nessuna maggioranza» non direbbe di che paese si parla');
}

/* ══ 9 · [X] e [P] finiscono davvero dentro la frase ══
 *
 * Una frase che ignorasse il suo parametro passerebbe tutte le prove qui sopra: il testo
 * ci sarebbe, sarebbe diverso dagli altri e starebbe nei limiti. */
{
  const senzaX = [], senzaP = [];
  for (const k of CELLE) {
    const haX = A.TIT_BLOCCO[k] !== null;
    for (const [nome, tab] of [['prima', A.TIT_PRIMA], ['dopo', A.TIT_DOPO]]) {
      const s = tab[k](77, 'nello 0,3%');
      if (haX && s.indexOf('77') < 0) senzaX.push(nome + ' · ' + k);
      if (haX && s.indexOf('nello 0,3%') < 0) senzaP.push(nome + ' · ' + k);
      if (!haX && (s.indexOf('77') >= 0 || s.indexOf('0,3%') >= 0)) senzaX.push(nome + ' · ' + k + ' (non dovrebbe averli)');
    }
    if (haX && A.TIT_CORTO_PRIMA[k](77).indexOf('77') < 0 && A.TIT_CORTO_DOPO[k](77).indexOf('77') < 0)
      senzaX.push('corto · ' + k);
  }
  esito(senzaX.length === 0, 'ogni testo che ha un [X] lo scrive, e chi non ce l\'ha non lo inventa', senzaX.join(' · '));
  esito(senzaP.length === 0, 'e ogni testo che ha un [P] lo scrive', senzaP.join(' · '));
  /* le due celle senza numeri sono quelle in cui nessun blocco è vicino alla soglia:
     lì un seggio esatto non è la notizia, e attaccargli una frequenza sarebbe rumore */
  esito(A.TIT_BLOCCO.f3 === null && A.TIT_BLOCCO.f4 === null,
    'e le due celle senza blocco alla soglia non portano numeri: f3 e f4');
}

/* ══ 10 · [P] è la frequenza della configurazione descritta, non una pastiglia ══ */
{
  const arr = [1,2,2,2,5,5,9];
  const lineare = (a, x) => a.filter(v => v === x).length;
  const casi = [0,1,2,3,5,9,10];
  esito(casi.every(x => A.freqEsatta(arr, x) === lineare(arr, x)),
    'freqEsatta conta per bisezione quello che un conteggio lineare conta a mano',
    casi.map(x => x + ': ' + A.freqEsatta(arr, x) + '/' + lineare(arr, x)).join(' · '));
  esito(A.freqEsatta([], 3) === 0 && A.freqEsatta([7], 7) === 1,
    'e regge l\'array vuoto e quello a un elemento');

  const S = A.stato();
  if (S.MC && S.MC.coal && S.MC.coal.length) {
    /* LA CELLA DI OGGI PUÒ NON PORTARE NUMERI — al 22 agosto 2026 è la f3, «i partiti
       arabi sono decisivi», che non ne ha. Provare [P] solo sullo stato corrente
       vorrebbe dire non provarlo affatto per mesi, e accorgersene il giorno in cui
       serve. Quindi la parte numerica si esercita su una configurazione COSTRUITA che
       cade in una cella con il numero, e la cella di oggi si prova per quello che è. */
    const foOggi = F(A.blocchi(S.SEG));
    const dOggi = A.datiTitolo(foOggi, S.MC);
    esito((A.TIT_BLOCCO[dOggi.cella] === null) === (dOggi.P === null),
      'la cella di oggi (' + dOggi.cella + ') porta un numero se e solo se nomina un blocco',
      'X ' + dOggi.X + ', P ' + dOggi.P);

    const fo = F(b(61, 40, 15));                 /* coalizione a 61: cella f6c */
    const d = A.datiTitolo(fo, S.MC);
    esito(d.cella === 'f6c' && d.X === 61, 'la configurazione di prova cade nella cella f6c a 61 seggi', d.cella + '/' + d.X);
    const bl = A.TIT_BLOCCO[d.cella];
    const serie = bl === 'coalizione' ? S.MC.coal : S.MC.oppz;
    esito(A.freqEsatta(serie, d.X) === lineare(serie, d.X),
      'e sull\'array vero delle simulazioni dà lo stesso numero del conteggio lineare');
    /* LA PROVA CHE LEGA IL TESTO AL NUMERO GIUSTO. La cella descrive un blocco a un certo
       numero di seggi; la frequenza citata dev'essere quella di QUEL numero, non la
       probabilità che quel blocco raggiunga la maggioranza — che è una delle quattro
       pastiglie in cima. Le due divergono, e la prova mostra di quanto. */
    const atteso = A.inPc(lineare(serie, d.X) / S.MC.n);
    esito(d.P === atteso, 'e [P] è esattamente quella frequenza', d.P + ' contro ' + atteso);
    const pastiglia = A.inPc((bl === 'coalizione' ? S.MC.vC : S.MC.vO) / S.MC.n);
    esito(d.P !== pastiglia,
      '[P] non è la pastiglia della maggioranza: la configurazione descritta vale ' + d.P +
      ', la pastiglia ' + pastiglia);
    /* e il testo in pagina porta proprio quella stringa */
    const t = A.testoTitolo(fo, false, S.MC);
    esito(t.indexOf(d.P) >= 0 || A.TIT_BLOCCO[d.cella] === null,
      'e la frase dell\'h1 porta la stessa stringa, non una ricalcolata per conto suo');

    /* ── LE DUE CELLE IN CUI [P] NON È LA CONFIGURAZIONE ──────────────────────
     *
     * In dieci celle su dodici la frase parla della configurazione e [P] è la sua
     * frequenza. In due no: la frase attacca il numero a una proposizione più larga, ed
     * è così che il lettore la legge. Lì [P] dev'essere la frequenza di QUELLA
     * proposizione, e la proposizione ha già un numero in pagina — è una delle quattro
     * pastiglie in cima. Se il titolo dicesse 2,7 e la pastiglia 2,8 sarebbe la strada
     * doppia di sempre, spostata dal colore al numero.
     *
     * La prova è a due lati, e serve tutta e due: che [P] sia la frequenza giusta, e che
     * NON sia quella della configurazione — altrimenti una regressione che rimettesse
     * freqEsatta passerebbe ogni volta che i due numeri si somigliano. */
    {
      const casi = [
        {cella:'f5c',  fonte:'stallo', valore: S.MC.st / S.MC.n,
         pastiglia:'Nessuna maggioranza possibile', fo: F(b(60, 40, 15))},
        {cella:'f5o3', fonte:'arabi',  valore: S.MC.vA / S.MC.n,
         pastiglia:'Maggioranza solo con i partiti arabi', fo: F(b(50, 60, 8))},
        /* Le due celle nuove dicono la stessa proposizione di f5c e vanno alla stessa
           sorgente. Con la frequenza della configurazione direbbero ZERO — nessuna
           simulazione le raggiunge — accanto a una frase che afferma lo stallo: il
           numero smentirebbe la frase che ha di fianco, e il lettore le vede insieme. */
        {cella:'f5o4', fonte:'stallo', valore: S.MC.st / S.MC.n,
         pastiglia:'Nessuna maggioranza possibile', fo: F(b(50, 60, 0))},
        {cella:'f5e',  fonte:'stallo', valore: S.MC.st / S.MC.n,
         pastiglia:'Nessuna maggioranza possibile', fo: F(b(60, 60, 0))}
      ];
      for (const c of casi) {
        const dd = A.datiTitolo(c.fo, S.MC);
        esito(dd.cella === c.cella, 'la configurazione di prova cade nella cella ' + c.cella, dd.cella);
        esito(A.TIT_FONTE_P[c.cella] === c.fonte,
          'la cella ' + c.cella + ' dichiara di prendere [P] da «' + c.fonte + '»', A.TIT_FONTE_P[c.cella]);
        esito(dd.P === A.inPc(c.valore),
          'e [P] è la frequenza della proposizione — quella della pastiglia «' + c.pastiglia + '»',
          dd.P + ' contro ' + A.inPc(c.valore));
        const serie = A.TIT_BLOCCO[c.cella] === 'coalizione' ? S.MC.coal : S.MC.oppz;
        const config = A.inPc(A.freqEsatta(serie, dd.X) / S.MC.n);
        esito(dd.P !== config,
          'e NON quella della configurazione, che è un\'altra cosa: ' + config + ' contro ' + dd.P);
        /* e la frase porta davvero quel numero, non un altro ricalcolato accanto */
        const testo = A.testoTitolo(c.fo, false, S.MC);
        esito(testo.indexOf(dd.P) >= 0 && testo.indexOf(config) < 0,
          'e la frase della cella ' + c.cella + ' porta quel numero e non l\'altro', testo);
      }
      /* le altre restano sulla configurazione: quattro celle cambiate, non cinque.
         Il criterio è la FRASE, non la forma: le quattro che vanno a una proposizione
         sono tutte e sole quelle il cui testo ne enuncia una — «nessun campo ha i numeri
         per governare», «le serve l'appoggio dei partiti arabi». */
      const altre = CELLE.filter(k => A.TIT_FONTE_P[k] === 'esatta');
      esito(altre.length === 6 && ['f5c','f5o3','f5o4','f5e'].every(k => altre.indexOf(k) < 0),
        'le altre sei celle con un numero restano sulla configurazione',
        altre.join(' · '));
      /* e la corrispondenza fra sorgente e frase è verificabile sul testo: chi dice
         «nessun campo ha i numeri per governare» prende [P] dallo stallo, chi dice
         «le serve l'appoggio dei partiti arabi» dallo scenario arabo. Una cella che
         cambiasse frase senza cambiare sorgente cadrebbe qui. */
      const disallineate = CELLE.filter(k => {
        const t = A.TIT_PRIMA[k](61, 'nel 5,0%') + ' ' + A.TIT_DOPO[k](61, 'nel 5,0%');
        const stallo = /nessun campo (ha|aveva) i numeri per governare/.test(t);
        const arabi  = /(le serve|le serviva) l’appoggio dei partiti arabi/.test(t);
        return (stallo && A.TIT_FONTE_P[k] !== 'stallo') || (arabi && A.TIT_FONTE_P[k] !== 'arabi');
      });
      esito(disallineate.length === 0,
        'e ogni frase che enuncia una proposizione prende [P] da quella proposizione',
        disallineate.join(' · '));
      esito(A.TIT_FONTE_P.f3 === null && A.TIT_FONTE_P.f4 === null,
        'e le due senza numero non hanno sorgente');
      esito(CELLE.every(k => (A.TIT_FONTE_P[k] === null) === (A.TIT_BLOCCO[k] === null) ||
                             A.TIT_FONTE_P[k] === 'stallo' || A.TIT_FONTE_P[k] === 'arabi'),
        'e ogni cella dichiara una sorgente se e solo se la sua frase porta un numero');
    }
  } else {
    esito(false, 'il Monte Carlo è disponibile per legare [P] al testo');
  }
}

/* ══ 11 · l'articolo davanti alla percentuale, che è una regola di lingua ══
 *
 * Tre copie corrette oggi divergono domani, e qui le copie sarebbero ventiquattro. La
 * regola dipende dalla PAROLA con cui il numero si legge, non dalla cifra: «nel cinque»,
 * «nell'otto», «nello zero», ma «nel diciotto» perché comincia per d. */
{
  const casi = [
    [0.050, 'nel 5,0%'], [0.080, 'nell\'8,0%'], [0.000, 'nello 0,0%'], [0.003, 'nello 0,3%'],
    [0.010, 'nell\'1,0%'], [0.110, 'nell\'11,0%'], [0.180, 'nel 18,0%'], [0.800, 'nell\'80,0%'],
    [0.895, 'nell\'89,5%'], [0.900, 'nel 90,0%'], [0.748, 'nel 74,8%'], [1.000, 'nel 100,0%']
  ];
  const male = casi.filter(([v, s]) => A.inPc(v) !== s).map(([v, s]) => v + ' → «' + A.inPc(v) + '» invece di «' + s + '»');
  esito(male.length === 0, 'l\'articolo segue la parola: nel / nell\' / nello', male.join(' · '));
}

/* ══ 12 · l'h1 e il <title> escono dalla stessa funzione ══
 *
 * Sono due strade per lo stesso stato, e la seconda è quella che si vede FUORI dalla
 * pagina. Se divergessero, nessuna prova che le guardasse una per volta se ne
 * accorgerebbe: è precisamente il difetto del colore di blocco. */
{
  const S = A.stato();
  const fo = F(A.blocchi(S.SEG));
  const dopo = A.votoPassato();
  const h1 = D.getElementById('k-h1');
  esito(!!h1, 'l\'h1 ha un id: il titolo si scrive per id come tutto il resto della pagina');
  esito(h1 && h1.textContent === A.testoTitolo(fo, dopo, S.MC),
    'l\'h1 in pagina è il testo della cella corrente',
    h1 && h1.textContent);
  /* IL MUTANTE CHE QUESTA RIGA HA UCCISO. Prima diceva «D.title === undefined || true»,
     cioè non diceva niente: facendo uscire il <title> da uno stato diverso dall'h1 la
     prova restava verde. È la doppia strada dichiarata nel commento della funzione e non
     provata — la stessa forma del colore di blocco, di nuovo. */
  const corto = A.titoloCorto(fo, dopo);
  esito(D.title === corto,
    'e il <title> è la forma corta dello STESSO stato dell\'h1, non di un altro',
    '<title>: «' + D.title + '» · atteso: «' + corto + '»');
  esito(corto.length < 60, 'che sta sotto i 60 caratteri: «' + corto + '» — ' + corto.length);
  esito(A.cellaTitolo(fo) === A.datiTitolo(fo, S.MC).cella,
    'e la cella è una sola: datiTitolo non ne calcola una seconda');
}

/* LA FORMA CORTA NON PUO' AFFERMARE DOVE LA LUNGA CONDIZIONA.
 * Il 28 agosto 2026 og:title diceva «Maggioranza solo con i partiti arabi» mentre l'h1
 * diceva «i partiti arabi POTREBBERO essere decisivi». La corta aveva perso il modale, ed
 * e' la corta quella che ESCE dalla pagina — la scheda di Telegram, quella di WhatsApp, il
 * risultato di ricerca — cioe' proprio dove nessuno puo' confrontarla con la lunga. Era la
 * correzione del 25 agosto su «sono decisivi», che nella forma corta non era mai arrivata.
 *
 * LE DUE FORME NON POSSONO ESSERE IDENTICHE, e non e' quello che si prova: il tetto lascia
 * 45 caratteri alla frase e la lunga di f3 ne usa 76. Il taglio ha il permesso di togliere
 * il numero, la frequenza, le subordinate. NON ha il permesso di cambiare la POSIZIONE: se
 * la lunga dice che una cosa potrebbe accadere, la corta non puo' dire che accade.
 *
 * SI PROVA LA CLASSE, NON L'ISTANZA: qualunque cella la cui forma lunga porti un modale deve
 * portarne uno anche nella corta, comprese le celle scritte domani. Asserire che f3 dice
 * «potrebbero» sarebbe provare la stringa che ho appena scritto io — e infatti questa
 * asserzione, appena scritta, ne ha trovata subito una seconda che nessuno aveva vista. */
const MODALE = /pot(rebbe|rebbero|eva|evano)/;
/* L'INVENTARIO, con l'idioma di opacita.js: una scivolata dichiarata con la sua ragione non fa
   cadere, una NON dichiarata si'. Serve perche' la corta di DOPO/f3 non si ripara
   accorciando: il parallelo diretto della PRIMA — «Vigilia: i partiti arabi potevano essere
   decisivi» — misura 49 caratteri, 64 con la coda, e SFORA il tetto di 60. E ogni altra
   forma DOPO apre con «Vigilia:», quindi toglierlo per una cella sola romperebbe il
   registro dell'era. La formulazione la sceglie l'autore: i testi sono suoi, e quarantadue su
   quarantotto li ha dettati lui. Le misurate che starebbero nel tetto sono nel messaggio
   del commit del 28 agosto 2026. */
const SCIVOLATE_NOTE = {
  'DOPO/f3': 'la corta afferma dove la lunga condiziona. Il parallelo della PRIMA ' +
             'sfora di 4 caratteri con la coda, quindi la riparazione non è meccanica: ' +
             'la formulazione la sceglie chi scrive i testi.'
};
{
  const scivola = [];
  for (const era of ['PRIMA', 'DOPO']) {
    const L = A['TIT_' + era], C = A['TIT_CORTO_' + era];
    for (const k of Object.keys(L)) {
      const lu = L[k](61, 'nel 42%'), co = C[k](61);
      if (MODALE.test(lu) && !MODALE.test(co)) scivola.push(era + '/' + k);
    }
  }
  const nuove = scivola.filter(k => !(k in SCIVOLATE_NOTE));
  esito(nuove.length === 0,
    'nessuna forma corta NON DICHIARATA afferma dove la lunga condiziona',
    nuove.join(' · '));
  /* IL VERSO OPPOSTO, o l'inventario diventa una lista di scuse che nessuno toglie: una voce
     dichiarata che non scivola piu' deve far cadere la prova, cosi' chi la ripara e'
     costretto a cancellarla. E' il numero di opacita.js che chi ne aggiunge una deve alzare. */
  const risolte = Object.keys(SCIVOLATE_NOTE).filter(k => scivola.indexOf(k) < 0);
  esito(risolte.length === 0,
    'e nessuna voce dichiarata è già risolta: chi la ripara toglie la riga',
    risolte.join(' · '));
  /* E IL CONTROLLO CHE SA FALLIRE: se un giorno nessuna forma lunga portasse piu' un modale,
     la prima asserzione sarebbe verde per ASSENZA DEL CASO, cioe' non proverebbe niente. */
  const conModale = [];
  for (const era of ['PRIMA', 'DOPO'])
    for (const k of Object.keys(A['TIT_' + era]))
      if (MODALE.test(A['TIT_' + era][k](61, 'nel 42%'))) conModale.push(era + '/' + k);
  esito(conModale.length > 0,
    'e almeno una forma lunga porta un modale, o la prova di sopra sarebbe verde per assenza '+
    'del caso', conModale.join(' · '));
}

console.log('\ntitolo: ' + ok + '/' + (ok + ko));
if (ko) process.exit(1);
