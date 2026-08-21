/* «Chi serve per governare», su un DOM vero.
 *
 * La sezione ha due regimi — la risposta in prosa fino a quattro coalizioni praticabili,
 * i gruppi col conteggio grezzo sopra — e quattro stati per lista: nucleo, alternativa,
 * fuori per veto, fuori per scelta propria. Le proprietà:
 *
 *   · il nucleo mostrato coincide con l'INTERSEZIONE delle coalizioni praticabili,
 *     ricalcolata qui in modo indipendente da COALS;
 *   · ogni lista con seggi compare in ESATTAMENTE uno dei quattro stati — nessuna
 *     sparisce, che è il difetto della versione precedente: la Lista Unita araba
 *     usciva dal filtro prima ancora del calcolo, senza una parola;
 *   · il passaggio di forma avviene a N=4, non altrove: a 4 la prosa, a 5 i gruppi —
 *     provato su coalizioni sintetiche perché i veti veri non producono N=4 e N=5 a
 *     comando, e il confine va provato ESATTO, non «da qualche parte fra 3 e 6»;
 *   · a nucleo vuoto la frase d'apertura ha un soggetto: non può cominciare con
 *     «Senza » e basta;
 *   · nessuna barra e nessuna percentuale, in nessuno dei due regimi.
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
  'global.A={render:render,sim:function(v){SIM=v;},rPower:rPower,calcola:calcola,' +
  'setVOFF:function(o){VETO_OFF=o;},setCOALS:function(v){COALS=v;},' +
  'COALS:function(){return COALS;},SEG:function(){return SEG;},P:function(){return P;},' +
  'IDS:function(){return IDS;},nm:nm};carica().then(render,render)');
eval(src);

const $ = i => D.getElementById(i);
const testo = () => $('k-power').textContent.replace(/\s+/g, ' ').trim();
function stati(){
  const per = {};
  [].forEach.call($('k-power').querySelectorAll('[data-pw]'), n => {
    const nome = n.textContent.trim();
    per[nome] = per[nome] || [];
    if (per[nome].indexOf(n.dataset.pw) < 0) per[nome].push(n.dataset.pw);
  });
  return per;
}

setTimeout(function(){
  const A = global.A;
  A.sim(500);
  const SEG = A.SEG(), P = A.P();

  /* ══ regime B, sui dati veri (N=2) ══ */
  const okC = A.COALS().filter(c => !c.c.length);
  esito(okC.length === 2 && okC.length <= 4, 'oggi le coalizioni praticabili sono 2: regime in prosa');

  /* il nucleo mostrato = intersezione delle praticabili, ricalcolata qui */
  let inter = okC[0].m.slice();
  okC.forEach(c => { inter = inter.filter(i => c.m.indexOf(i) >= 0); });
  const st = stati();
  const nucleoMostrato = Object.keys(st).filter(n => st[n].indexOf('nucleo') >= 0);
  esito(nucleoMostrato.length === inter.length &&
        inter.every(i => nucleoMostrato.indexOf(A.nm(i)) >= 0),
    'il nucleo mostrato coincide con l\'intersezione delle coalizioni praticabili',
    JSON.stringify(nucleoMostrato) + ' contro ' + JSON.stringify(inter.map(A.nm)));

  /* i seggi del nucleo, dichiarati nella frase, sono la somma vera */
  const sommaNucleo = inter.reduce((a, i) => a + SEG[i], 0);
  esito(new RegExp('sono ' + sommaNucleo + ' seggi').test(testo()),
    'la frase dichiara i seggi veri del nucleo (' + sommaNucleo + ')', testo().slice(0, 160));

  /* ogni lista con seggi in esattamente uno dei quattro stati */
  const conSeggi = A.IDS().filter(i => SEG[i]).map(A.nm);
  const buoni = ['nucleo','alt','veto','scelta'];
  const senzaStato = conSeggi.filter(n => !st[n] || !st[n].length);
  const doppioStato = conSeggi.filter(n => st[n] && st[n].length > 1);
  esito(senzaStato.length === 0,
    'nessuna lista con seggi sparisce dalla sezione', JSON.stringify(senzaStato));
  esito(doppioStato.length === 0,
    'nessuna lista compare in due stati', JSON.stringify(doppioStato));
  esito(conSeggi.every(n => !st[n] || st[n].every(s => buoni.indexOf(s) >= 0)),
    'ogni stato è nel vocabolario dei quattro');

  /* i due esclusi, distinti e motivati */
  esito((st['Likud'] || []).indexOf('veto') >= 0 && /Likud[^]*veto con/.test(testo()),
    'il Likud è dichiarato fuori per veto, col veto nominato', JSON.stringify(st['Likud']));
  esito((st['Lista Unita araba'] || []).indexOf('scelta') >= 0 &&
        /sostenerlo dall'esterno/.test(testo()),
    'la Lista Unita araba è dichiarata fuori per scelta propria, con la ragione',
    JSON.stringify(st['Lista Unita araba']));

  /* niente barre e niente percentuali, e i completamenti per esteso senza lettere */
  esito(!$('k-power').querySelector('svg rect'), 'nessuna barra nel regime in prosa');
  esito(!/%/.test(testo()), 'nessuna percentuale nel regime in prosa');
  esito(/oppure/.test(testo()),
    'i completamenti alternativi sono nominati per esteso, non con lettere', testo().slice(0, 220));

  /* ══ regime A, sui dati veri (N=6 con due veti spenti) ══ */
  A.setVOFF({0:1, 1:1}); A.calcola(); A.rPower();
  const n6 = A.COALS().filter(c => !c.c.length).length;
  esito(n6 > 4, 'con due veti spenti le praticabili superano la soglia', String(n6));
  esito(/in \d+ delle \d+/.test(testo()),
    'il regime a gruppi usa il conteggio grezzo «in K delle N»', testo().slice(0, 180));
  esito(!/%/.test(testo()) && !$('k-power').querySelector('svg rect'),
    'niente percentuali e niente barre nemmeno nel regime a gruppi');
  const st6 = stati();
  const spariteA = A.IDS().filter(i => A.SEG()[i]).map(A.nm).filter(n => !st6[n]);
  esito(spariteA.length === 0,
    'anche a N alto nessuna lista sparisce', JSON.stringify(spariteA));
  A.setVOFF({}); A.calcola(); A.rPower();

  /* ══ il confine di forma, ESATTO, su coalizioni sintetiche ══
     i veti veri non producono N=4 e N=5 a comando: 3 con un veto spento, 6 con due */
  function finta(m){ return {m: m, t: m.reduce((a, i) => a + SEG[i], 0), c: [], n: m.length}; }
  const q4 = [
    finta(['yashar','byachad','democratici','beitenu','raam']),
    finta(['yashar','byachad','democratici','shas','utj']),
    finta(['yashar','byachad','democratici','beitenu','shas']),
    finta(['yashar','byachad','democratici','beitenu','utj'])
  ];
  A.setCOALS(q4); A.rPower();
  esito(/Senza .* non si governa/.test(testo()) && !/in \d+ delle \d+/.test(testo()),
    'a N=4 la sezione è ancora in prosa', testo().slice(0, 140));
  const q5 = q4.concat([finta(['yashar','byachad','democratici','raam','shas'])]);
  A.setCOALS(q5); A.rPower();
  esito(/in \d+ delle 5/.test(testo()) && !/non si governa/.test(testo()),
    'a N=5 la sezione passa ai gruppi: il confine è esattamente 4', testo().slice(0, 140));

  /* ══ nucleo vuoto in prosa: la frase ha un soggetto ══ */
  const disgiunte = [
    finta(['yashar','byachad','democratici','beitenu','raam']),
    finta(['likud','shas','utj','sionismo_rel','otzma'])
  ];
  A.setCOALS(disgiunte); A.rPower();
  esito(/Nessuna lista è presente/.test(testo()),
    'a nucleo vuoto la frase d\'apertura ha un soggetto', testo().slice(0, 140));
  esito(!/Senza\s+non si governa|Senza\s*:/.test(testo()),
    'e non resta un «Senza» appeso senza nomi');

  /* ripristino per le suite successive */
  A.calcola(); A.rPower();

  console.log('\npotere: ' + ok + '/' + (ok + ko));
  if (ko) process.exit(1);
}, 3000);
