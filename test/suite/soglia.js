/* La soglia dei 61 negli istogrammi: dominio, etichetta, corpo, e le due fasce.
 *
 * Tre mosse applicate insieme il 22 agosto 2026, e insieme vanno provate, perché la
 * terza da sola PEGGIORA la seconda. Più una quarta, lo stesso giorno: le due fasce.
 *
 * 1 · IL DOMINIO COMPRENDE SEMPRE LA SOGLIA. Prima mn e mx uscivano dai soli quantili
 *     simulati: a swing −6 il dominio della coalizione era 30–57 e x61 valeva 504,4
 *     contro un viewBox largo 460 — la linea della maggioranza non veniva disegnata
 *     affatto, né l'etichetta, e niente lo diceva. Non è un difetto della resa stretta:
 *     il viewBox è fisso, a 1265 succede identico.
 * 2 · L'ETICHETTA SI RIBALTA. Era sempre a destra della linea e la tagliava il bordo
 *     (l'SVG di radice ha overflow:hidden): nello stato predefinito 12 render su 12,
 *     e 9 stati su 26 lungo lo swing, fino a 136 unità cioè zero per cento visibile.
 * 3 · IL CORPO SCALA SOTTO I 660, come già fa il grafico della tendenza: a 380 il
 *     fattore di scala è 0,7087, quindi un font-size 10 rende 7,09px reali. Da sola
 *     questa mossa allarga l'etichetta da 85,7 a 132,7 unità e porta il taglio da 9
 *     stati su 26 a 13: **vale solo con la 2**. Per questo lo spazzolamento qui sotto
 *     gira a TUTTI E DUE i corpi, e non solo a quello di partenza.
 *
 * 4 · LE DUE FASCE, alta e bassa, come MARGINI del disegno. È la mossa che chiude la
 *     causa di cui l'alone --card, vissuto un giorno, chiudeva il sintomo: l'etichetta
 *     stava DENTRO l'area delle barre. Misurato su 50 stati con l'inchiostro vero, si
 *     sovrapponeva a delle barre in 33 e alla fascia dell'80% in 48; con la scatola
 *     stimata per eccesso che questa prova usa, 43 e 50. L'alone risolveva il contrasto
 *     (1,56 in chiaro, 2,04 in scuro sopra una barra piena) e non la sovrapposizione,
 *     ed è stato tolto. In basso: a 380 la didascalia cominciava 1,42px sotto la linea
 *     della scala e finiva esattamente sul bordo del viewBox, zero.
 *     L'area del disegno NON cambia: pagare i margini con i dati sarebbe il contrario.
 */
const {JSDOM} = require('jsdom');
const fs = require('fs');

let ok = 0, ko = 0;
function esito(cond, desc, dettaglio){
  if (cond) { ok++; console.log('OK ' + desc); }
  else { ko++; console.log('KO ' + desc + (dettaglio ? ' — ' + dettaglio : '')); }
}

const W_VB = 460;                             /* la larghezza del viewBox: l'unica costante rimasta */
const FATTORE_380 = 326 / W_VB;               /* reso a 380px, misurato su browser */

/* ── la tavolozza si legge da index.html: se cambia lì, cambia anche qui ── */
const html = fs.readFileSync('../../index.html','utf8');
function vars(b){ const o = {}; for (const m of b.matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{3,8})/g)) o[m[1]] = m[2]; return o; }
const CHIARO = vars(html.match(/#kn26\{([\s\S]*?)\n\}/)[1]);
const SCURO  = Object.assign({}, CHIARO, vars(html.match(/#kn26\.scuro\{([\s\S]*?)\}/)[1]));

function lum(h){ h = h.replace('#',''); const v = [0,2,4].map(i => parseInt(h.substr(i,2),16)/255)
  .map(c => c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4));
  return 0.2126*v[0] + 0.7152*v[1] + 0.0722*v[2]; }
function contrasto(a,b){ const l1 = lum(a), l2 = lum(b);
  return (Math.max(l1,l2)+0.05) / (Math.min(l1,l2)+0.05); }

/* ── banco ── */
const dom = new JSDOM('<!doctype html><html><body><div id="kn26"></div></body></html>', {pretendToBeVisual:true});
const D = dom.window.document, W = dom.window;
global.DOMParser = W.DOMParser;
D.body.innerHTML = html.replace(/<script>[\s\S]*?<\/script>/g,'')
  .match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
global.document = D; global.window = W;

let MOB = false, TEMA_SCURO = false;
W.matchMedia = q => ({matches: /max-width:\s*660/.test(q) ? MOB : false,
                      addEventListener(){}, addListener(){}});
W.IntersectionObserver = class { observe(){} unobserve(){} };
global.IntersectionObserver = W.IntersectionObserver;
W.requestAnimationFrame = f => f();
/* getComputedStyle restituisce i token VERI del tema in corso, così C.card e C.ink
   sono quelli della pagina e il contrasto si calcola sui colori pubblicati */
global.getComputedStyle = () => ({getPropertyValue: k =>
  (TEMA_SCURO ? SCURO : CHIARO)[String(k).replace(/^--/,'')] || ''});
global.Blob = function(){}; global.URL = {createObjectURL(){ return ''; }};
global.FileReader = function(){}; global.fetch = () => Promise.reject(0);

let src = fs.readFileSync(__dirname + '/../app.js','utf8');
src = src.replace('carica().then(render,render)',
  'global.A={render:render,C:function(){return C;}};carica().then(render,render)');
eval(src);
const A = global.A;
const $ = i => D.getElementById(i);

/* ── piloti ── */
function tema(scuro){
  TEMA_SCURO = scuro;
  D.querySelector('#k-tema button[data-tema="' + (scuro ? 'scuro' : 'chiaro') + '"]')
   .dispatchEvent(new W.MouseEvent('click', {bubbles:true}));
}
function swing(v){
  const sl = $('k-sw'); sl.value = String(v);
  sl.dispatchEvent(new W.Event('input',  {bubbles:true}));
  sl.dispatchEvent(new W.Event('change', {bubbles:true}));
}
/* legge dall'SVG reso quel che serve, senza fidarsi di nessuna copia */
function leggi(id){
  const svg = $(id).querySelector('svg');
  const bb = [...svg.querySelectorAll('rect.bb')].map(r => +r.dataset.i);
  const testi = [...svg.querySelectorAll('text')];
  const eti = testi.find(t => /61 = maggioranza/.test(t.textContent));
  /* la linea della maggioranza è l'unica VERTICALE: cercarla per una y letterale
     l'ha già persa una volta, quando la cima è passata da 14 a T−2 */
  const linea = [...svg.querySelectorAll('line')].find(l => l.getAttribute('x1') === l.getAttribute('x2'));
  const cap = testi.find(t => /simulazioni su 10/.test(t.textContent));
  const assi = testi.filter(t => t !== eti && t !== cap);
  return {
    mn: Math.min.apply(null, bb), mx: Math.max.apply(null, bb), bb,
    x61: linea ? +linea.getAttribute('x1') : null,
    eti, cap, assi,
    cimaLinea: linea ? +linea.getAttribute('y1') : null,   /* T−2 */
    asseY:     linea ? +linea.getAttribute('y2') : null,   /* T+PH */
    fe:  eti ? +eti.getAttribute('font-size') : null,
    ex:  eti ? +eti.getAttribute('x') : null,
    fin: eti ? eti.getAttribute('text-anchor') === 'end' : null
  };
}
/* la scatola dell'etichetta, data una larghezza ipotizzata */
function scatola(g, larg){ return g.fin ? [g.ex - larg, g.ex] : [g.ex, g.ex + larg]; }

const SWING = [-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6];
const GRAFICI = ['k-hist','k-hist2'];

A.render();

/* ══ 1 · IL DOMINIO COMPRENDE SEMPRE LA SOGLIA ══════════════════════════════ */
const senza61 = [], lineaFuori = [], stretti = [];
SWING.forEach(v => { swing(v); GRAFICI.forEach(id => {
  const g = leggi(id);
  if (g.bb.indexOf(61) < 0) senza61.push(id + '@' + v + ' dominio ' + g.mn + '–' + g.mx);
  if (!(g.x61 > 0 && g.x61 < W_VB)) lineaFuori.push(id + '@' + v + ' x61=' + g.x61);
  if (!(g.mn <= 60 && g.mx >= 62)) stretti.push(id + '@' + v + ' ' + g.mn + '–' + g.mx);
}); });
esito(senza61.length === 0,
  'il cestello dei 61 esiste in tutti i ' + (SWING.length*2) + ' stati dello swing', senza61.join(' · '));
esito(lineaFuori.length === 0,
  'la linea della maggioranza è dentro il viewBox in tutti gli stati', lineaFuori.join(' · '));
esito(stretti.length === 0,
  'la soglia ha sempre almeno un cestello per parte (mn≤60, mx≥62)', stretti.join(' · '));

/* e il fermo non deve stravolgere il dominio dove non serve: a swing 0 nessuno dei due
   grafici viene allargato dal fermo, perché i quantili già comprendono la soglia */
swing(0);
const g0 = leggi('k-hist'), g0b = leggi('k-hist2');
esito(g0.mn > 30 && g0b.mn > 30,
  'a swing zero il fermo non allarga il dominio oltre i quantili',
  'coal ' + g0.mn + '–' + g0.mx + ', oppo ' + g0b.mn + '–' + g0b.mx);

/* ══ 2 · L'ETICHETTA STA DENTRO, E LA 3 NON LA FA USCIRE ════════════════════ */
/* Lo spazzolamento gira a TUTTI E DUE i corpi: senza il ribaltamento il corpo grande
   è quello che taglia di più, quindi una prova al solo corpo piccolo lascerebbe
   scoperto proprio il caso che la mossa 3 crea. */
for (const mob of [false, true]) {
  MOB = mob; A.render();
  /* ETIW è la larghezza DICHIARATA su cui il codice decide il lato; LARGA è la più
     larga davvero misurata (Verdana, 10,3 unità per unità di corpo, il 22 agosto 2026
     su undici famiglie). La prova vuole tutte e due: la scatola dichiarata dentro il
     viewBox, e il testo vero dentro la scatola dichiarata. Se qualcuno abbassa ETIW
     sotto la famiglia più larga, la seconda cade. */
  const fe = mob ? 15.5 : 10, etiW = 12 * fe, larga = 10.3 * fe;
  const nome = mob ? 'sotto i 660 (corpo ' + fe + ')' : 'sopra i 660 (corpo ' + fe + ')';

  const fuori = [], fuoriLargo = [], destraFallirebbe = [], sinistraFallirebbe = [];
  SWING.forEach(v => { swing(v); GRAFICI.forEach(id => {
    const g = leggi(id);
    const b = scatola(g, etiW);
    if (!(b[0] >= -0.01 && b[1] <= W_VB + 0.01)) fuori.push(id + '@' + v + ' [' + b[0].toFixed(1) + ',' + b[1].toFixed(1) + ']');
    /* stessa scatola con la famiglia più larga misurata: è il caso della macchina
       con una pila di caratteri diversa dalla nostra */
    const bl = scatola(g, larga);
    if (!(bl[0] >= -0.01 && bl[1] <= W_VB + 0.01)) fuoriLargo.push(id + '@' + v);
    /* il controfattuale: dove sarebbe finita SENZA il ribaltamento, cioè con la mossa 3
       e senza la 2 — è il caso che va coperto perché la 3 da sola peggiora */
    const destraNo = g.x61 + 6 + etiW > W_VB;
    if (destraNo) destraFallirebbe.push(id + '@' + v);
    /* la garanzia NON è «a sinistra ci sta sempre» — a swing −6 l'opposizione ha
       x61 a 159,4 e a sinistra non ci starebbe — ma «quando a destra non ci sta, a
       sinistra sì». È l'implicazione che il ribaltamento usa, e l'unica che serve. */
    if (destraNo && g.x61 - 6 - etiW < 0) sinistraFallirebbe.push(id + '@' + v + ' x61=' + g.x61);
  }); });

  esito(fuori.length === 0, 'l\'etichetta sta dentro il viewBox in ogni stato, ' + nome,
    fuori.length + ' fuori: ' + fuori.join(' · '));
  esito(fuoriLargo.length === 0,
    'ci sta anche con la famiglia di caratteri più larga misurata, ' + nome,
    fuoriLargo.join(' · '));
  esito(etiW >= larga,
    'la larghezza dichiarata copre la famiglia più larga misurata, ' + nome,
    'dichiarata ' + etiW.toFixed(1) + ' contro ' + larga.toFixed(1));
  esito(sinistraFallirebbe.length === 0,
    'dove la destra non basta, la sinistra basta sempre, ' + nome, sinistraFallirebbe.join(' · '));
  console.log('   (senza ribaltamento sarebbe uscita in ' + destraFallirebbe.length +
              ' stati su ' + (SWING.length*2) + ', ' + nome + ')');

  /* la sicurezza è algebrica, non statistica: se la destra non basta, x61 è oltre
     W−6−ETIW, e a sinistra restano W−12−ETIW unità. Il caso «non ci sta da nessuna
     parte» non esiste finché ETIW ≤ (W−12)/2. */
  esito(etiW <= (W_VB - 12) / 2,
    'la larghezza dichiarata sta sotto il limite che rende il ribaltamento sicuro, ' + nome,
    'ETIW ' + etiW.toFixed(1) + ' contro ' + ((W_VB-12)/2).toFixed(0));
}
MOB = false; A.render(); swing(0);

/* ══ 3 · IL CORPO SCALA SOTTO I 660 E SOLO LÌ ═══════════════════════════════ */
MOB = false; A.render();
const largo = leggi('k-hist');
MOB = true;  A.render();
const stretto = leggi('k-hist');
MOB = false; A.render();

esito(largo.fe === 10, 'sopra i 660 l\'etichetta resta a corpo 10', 'corpo ' + largo.fe);
esito(Math.abs(stretto.fe - 15.5) < 0.01, 'sotto i 660 l\'etichetta va a corpo 15,5', 'corpo ' + stretto.fe);
esito(largo.assi.every(t => +t.getAttribute('font-size') === 10) &&
      stretto.assi.every(t => Math.abs(+t.getAttribute('font-size') - 15.5) < 0.01),
  'i numeri dell\'asse scalano con l\'etichetta',
  'sopra ' + largo.assi.map(t => t.getAttribute('font-size')).join(',') +
  ' · sotto ' + stretto.assi.map(t => t.getAttribute('font-size')).join(','));
esito(Math.abs(+largo.cap.getAttribute('font-size') - 10.5) < 0.01 &&
      Math.abs(+stretto.cap.getAttribute('font-size') - 16.3) < 0.1,
  'la didascalia dentro l\'SVG scala con l\'etichetta',
  'sopra ' + largo.cap.getAttribute('font-size') + ' · sotto ' + stretto.cap.getAttribute('font-size'));

/* il numero che conta per il lettore: quanti pixel VERI a 380 */
const reso = stretto.fe * FATTORE_380;
esito(reso >= 9, 'a 380 l\'etichetta rende almeno 9px reali', reso.toFixed(2) + 'px (era 7,09)');
esito(largo.fe * FATTORE_380 < 9,
  'ed è proprio il corpo di prima che non ci arrivava', (largo.fe*FATTORE_380).toFixed(2) + 'px');

/* ══ E LA STESSA REGOLA VALE NELL'EMICICLO, dal 30 agosto 2026 ══
 * «MAGGIORANZA 61» vive in DUE disegni: qui e dentro l'arco. Il pavimento dei 9px era
 * arrivato solo qui, e nell'emiciclo la stessa etichetta rendeva 7,20px a 380 — cioè
 * praticamente il 7,09 che questa prova esiste per aver chiuso. Nessuna prova la
 * misurava, e l'ha trovata un occhio sulla pagina resa il 30 agosto 2026.
 * La regola si ESTENDE invece di essere ricopiata: è la stessa proprietà, sullo stesso
 * testo, in un secondo posto — e senza, il prossimo che ritocca il corpo la riporta sotto.
 * Il viewBox dell'emiciclo è 430 e non 460, quindi il fattore è un altro: a 380 il
 * contenitore vale 326, misurato su browser come quello degli istogrammi. */
const FATTORE_EMI_380 = 326 / 430;
function leggiEmi(){
  const svg = $('k-emi').querySelector('svg');
  const eti = [...svg.querySelectorAll('text')].find(t => /MAGGIORANZA/.test(t.textContent));
  return {
    fe: eti ? +eti.getAttribute('font-size') : null,
    y:  eti ? +eti.getAttribute('y') : null,
    cerchi: [...svg.querySelectorAll('circle')].map(c => ({cy:+c.getAttribute('cy'), r:+c.getAttribute('r')}))
  };
}
MOB = true;  A.render(); const emiStretto = leggiEmi();
MOB = false; A.render(); const emiLargo   = leggiEmi();

const resoEmi = emiStretto.fe * FATTORE_EMI_380;
esito(resoEmi >= 9, 'e a 380 l\'etichetta dell\'EMICICLO rende almeno 9px reali',
  resoEmi.toFixed(2) + 'px (era 7,20)');
esito(emiLargo.fe * FATTORE_EMI_380 < 9,
  'ed è proprio il corpo di prima che non ci arrivava nemmeno lì',
  (emiLargo.fe * FATTORE_EMI_380).toFixed(2) + 'px');

/* IL CORPO NON PUÒ CRESCERE QUANTO SI VUOLE, e questa è la metà che impedisce di far
 * passare la prova qui sopra alzando un numero. Sopra l'etichetta c'è il bordo del
 * viewBox, sotto ci sono i seggi: a fattore 1,40 l'etichetta URTA DUE CERCHI — misurato
 * su browser con l'inchiostro vero, ed è la ragione per cui il fattore è 1,3 e non 1,55
 * come negli istogrammi.
 * jsdom non fa layout, quindi la scatola si STIMA PER ECCESSO dagli attributi, con i due
 * rapporti misurati sul disegno reso e arrotondati in su: 1,12 di ascesa sopra la base e
 * 1,40 di altezza totale, contro 1,10 e 1,35 misurati. Sovrastimare costa un po' di
 * margine e non lascia mai passare un urto — è l'argomento di ETIW. Verificato che la
 * stima MORDA: col fattore a 1,40 il fondo uscirebbe a 19,12 contro una cima dei seggi a
 * 18,69, cioè la prova cade dove il browser vede l'urto. */
const ASCESA = 1.12, ALTEZZA = 1.40;
[['sotto i 660', emiStretto], ['sopra i 660', emiLargo]].forEach(function(par){
  const dove = par[0], e = par[1];
  const top = e.y - ASCESA * e.fe, bottom = top + ALTEZZA * e.fe;
  const cima = Math.min.apply(null, e.cerchi.map(c => c.cy - c.r));
  esito(top >= 0 && bottom <= cima,
    'e ' + dove + ' l\'etichetta dell\'emiciclo sta fra il bordo del viewBox e i seggi',
    'inchiostro ' + top.toFixed(2) + '–' + bottom.toFixed(2) + ', cima dei seggi ' + cima.toFixed(2));
});
/* E LA BASE SCALA COL CORPO. Il serraggio «Math.max(11, yt)» decide la quota
 * dell'etichetta praticamente sempre, perché con 120 seggi la soglia cade al centro
 * dell'arco: lasciandolo fisso, il corpo più grande cresce verso l'alto e il bordo lo
 * taglia. Il mutante che riporta il serraggio a 11 fa cadere la scatola qui sopra, ma
 * solo se qualcuno dichiara che le due quote DEVONO essere diverse. */
esito(emiStretto.y > emiLargo.y,
  'e la base dell\'etichetta si abbassa col corpo, o il bordo la taglierebbe',
  'sotto ' + emiStretto.y + ' · sopra ' + emiLargo.y);

/* La didascalia dell'80% non esce dal viewBox nemmeno al corpo grande, e non c'è nessun
   serraggio a impedirlo: il serraggio è stato scritto, misurato e tolto perché non
   mordeva in nessuno stato — codice che nessuna prova può esercitare. Al suo posto c'è
   questa, che MISURA il margine. Se un giorno una distribuzione spinge la fascia
   dell'80% di lato, questa cade e si vede; un serraggio l'avrebbe nascosta. */
MOB = true; A.render();
const CAPW = 19 * 16.275;      /* larghezza dichiarata al corpo grande, caso peggiore */
let margine = Infinity, fuoriCap = [];
SWING.forEach(v => { swing(v); GRAFICI.forEach(id => {
  const cx = +leggi(id).cap.getAttribute('x');
  margine = Math.min(margine, cx - CAPW/2, W_VB - CAPW/2 - cx);
  if (cx - CAPW/2 < -0.01 || cx + CAPW/2 > W_VB + 0.01) fuoriCap.push(id + '@' + v + ' cx=' + cx);
}); });
esito(fuoriCap.length === 0, 'la didascalia dell\'80% resta dentro il viewBox al corpo grande',
  fuoriCap.join(' · '));
esito(margine >= 10, 'e ci resta con almeno dieci unità di margine, non per un pelo',
  'margine minimo ' + margine.toFixed(1) + ' unità su ' + (SWING.length*2) + ' stati');
MOB = false; A.render(); swing(0);

/* ══ 4 · NESSUN TESTO SI SOVRAPPONE AL DISEGNO ══════════════════════════════
   È la proprietà vera, e sostituisce quella sull'alone. L'alone c'è stato un giorno:
   chiudeva il CONTRASTO dell'etichetta sopra le barre piene (1,56 in chiaro, 2,04 in
   scuro), cioè il sintomo. La causa era che l'etichetta stava DENTRO l'area del
   disegno: misurato su 50 stati, si sovrapponeva a delle barre in 33 e alla fascia
   dell'80% in 48. Chiusa la causa con le due fasce, l'alone è stato tolto e questa
   prova ha preso il suo posto — è più forte, perché vale per QUALUNQUE testo, anche
   uno aggiunto domani, e non solo per quello che avevamo in mente.

   La scatola del testo è stimata per ECCESSO — [linea di base − corpo, + 0,3 corpo] —
   perché jsdom non fa layout: misurato su browser, l'inchiostro vero sta fra 0,77 e
   0,26 del corpo attorno alla linea di base, quindi la scatola lo contiene con margine.
   Sovrastimare qui è il verso giusto: una prova che non vede una sovrapposizione vera
   sarebbe inutile. */
{
  const FINE = [];                       /* spazzolamento a mezzo punto: 25 valori × 2 = 50 */
  for (let v = -6; v <= 6; v += 0.5) FINE.push(v);
  const suBarre = [], suFascia = [], suTriangolo = [];
  MOB = true; A.render();
  FINE.forEach(v => { swing(v); GRAFICI.forEach(id => {
    const svg = $(id).querySelector('svg');
    const g = leggi(id);
    const t = g.eti, y = +t.getAttribute('y'), fe = g.fe;
    const x0 = g.fin ? g.ex - 12*fe : g.ex, x1 = g.fin ? g.ex : g.ex + 12*fe;
    const y0 = y - fe, y1 = y + 0.3*fe;
    const tocca = (bx,by,bw,bh) => bx+bw > x0 && bx < x1 && by < y1 && by+bh > y0;
    const barre = [...svg.querySelectorAll('rect.bb')]
      .filter(r => tocca(+r.getAttribute('x'), +r.getAttribute('y'),
                         +r.getAttribute('width'), +r.getAttribute('height')));
    if (barre.length) suBarre.push(id + '@' + v + ' (' + barre.length + ')');
    const f = svg.querySelector('rect[opacity=".07"]');
    if (tocca(+f.getAttribute('x'), +f.getAttribute('y'), +f.getAttribute('width'), +f.getAttribute('height')))
      suFascia.push(id + '@' + v);
    /* e il triangolo della stima puntuale, che è l'altra cosa che vive lassù */
    const tri = svg.querySelector('path[d^="M"]');
    if (tri) { const d = tri.getAttribute('d').match(/-?\d+(\.\d+)?/g).map(Number);
      const tx0 = Math.min(d[0],d[2],d[4]), tx1 = Math.max(d[0],d[2],d[4]);
      const ty0 = Math.min(d[1],d[3],d[5]), ty1 = Math.max(d[1],d[3],d[5]);
      if (tx1 > x0 && tx0 < x1 && ty0 < y1 && ty1 > y0) suTriangolo.push(id + '@' + v); }
  }); });
  MOB = false; A.render(); swing(0);
  esito(suBarre.length === 0, 'l\'etichetta non si sovrappone a nessuna barra, in 50 stati',
    suBarre.length + ' su 50: ' + suBarre.slice(0,6).join(' · ') + (suBarre.length>6?' …':''));
  esito(suFascia.length === 0, 'né alla fascia dell\'80%, in 50 stati',
    suFascia.length + ' su 50');
  esito(suTriangolo.length === 0,
    'né al triangolo della stima puntuale — la collisione latente che nessuno aveva visto',
    suTriangolo.length + ' su 50: ' + suTriangolo.join(' · '));
}

/* e il contrasto resta quello del fondo, perché sopra il fondo ci sta e basta */
for (const scuro of [false, true]) {
  tema(scuro); A.render();
  const C = A.C(), nome = scuro ? 'scuro' : 'chiaro';
  esito(contrasto(C.ink, C.card) >= 4.5,
    'sul fondo della scheda l\'etichetta sta sopra 4,5, tema ' + nome,
    contrasto(C.ink, C.card).toFixed(2));
  /* il numero che diceva perché l'alone era servito, e perché adesso non serve */
  const barra = scuro ? '#FF5084' : '#78002D';        /* opposizione, il caso peggiore */
  esito(contrasto(C.ink, barra) < 4.5,
    'sopra una barra piena starebbe sotto 4,5 — per questo non ci va sopra, tema ' + nome,
    contrasto(C.ink, barra).toFixed(2) + ' su ' + barra);
  /* l'alone non deve tornare per abitudine: era il rimedio a un sintomo, non alla causa */
  const conAlone = [];
  GRAFICI.forEach(id => { [...$(id).querySelectorAll('svg text')]
    .forEach(t => { if (t.hasAttribute('paint-order') || t.hasAttribute('stroke'))
      conAlone.push(id + ' «' + t.textContent.slice(0,18) + '»'); }); });
  esito(conAlone.length === 0,
    'nessun testo porta più l\'alone: la causa è chiusa, non il sintomo, tema ' + nome,
    conAlone.join(' · '));
}
tema(false); A.render();

/* ══ 5 · LE DUE FASCE SONO MARGINI, E SI VEDE DAI NUMERI ════════════════════ */
for (const mob of [false, true]) {
  MOB = mob; A.render(); swing(0);
  const g = leggi('k-hist'), nome = mob ? 'sotto i 660' : 'sopra i 660';
  const vb = $('k-hist').querySelector('svg').getAttribute('viewBox').split(' ').map(Number);
  const T = g.cimaLinea + 2, PH = g.asseY - T, B = vb[3] - g.asseY;

  esito(vb[2] === W_VB, 'la larghezza del viewBox non cambia, ' + nome, 'W=' + vb[2]);
  esito(PH === 152, 'l\'AREA DEL DISEGNO non cambia mai: le fasce non si pagano coi dati, ' + nome,
    'PH=' + PH);
  esito(T === (mob ? 42 : 32) && B === (mob ? 78 : 50),
    'le fasce scalano col corpo, ' + nome, 'T=' + T + ', B=' + B);
  esito(vb[3] === T + PH + B, 'l\'altezza del viewBox è la somma delle tre parti, ' + nome,
    'H=' + vb[3] + ' contro ' + (T+PH+B));

  /* l'etichetta sta INTERAMENTE sopra il disegno, non solo «non lo tocca» */
  const y = +g.eti.getAttribute('y');
  esito(y + 0.3*g.fe < T, 'la linea di base dell\'etichetta sta tutta nella fascia alta, ' + nome,
    'fondo dell\'inchiostro ' + (y + 0.3*g.fe).toFixed(1) + ' contro la cima del disegno ' + T);
  esito(Math.abs(Math.abs(g.ex - g.x61) - 6) < 0.05,
    'e resta a sei unità dalla linea, da qualunque lato, ' + nome,
    'x etichetta ' + g.ex + ', linea ' + g.x61);

  /* lo stacco fra il disegno e la didascalia: almeno l'altezza dell'inchiostro della
     didascalia stessa. È la regola che ha deciso i numeri, quindi è lei che va provata.
     Misurato su browser: l'inchiostro della didascalia sta fra 0,76 e 0,24 del corpo. */
  const fc = +g.cap.getAttribute('font-size'), yc = +g.cap.getAttribute('y');
  const scala = g.asseY + 24*(mob ? 1.55 : 1);
  const stacco = (yc - 0.76*fc) - scala, inchiostro = fc;
  esito(stacco >= inchiostro,
    'fra la scala dell\'80% e la didascalia c\'è almeno un\'altezza di didascalia, ' + nome,
    'stacco ' + stacco.toFixed(1) + ' contro ' + inchiostro.toFixed(1) + ' unità');
  /* e in pixel VERI, che è quello che il lettore vede */
  const k = mob ? 326/W_VB : 674/W_VB;
  esito(stacco * k >= 9,
    'e in pixel veri sono almeno nove, ' + nome,
    (stacco*k).toFixed(2) + 'px (era 1,42 a 380 e 8,79 a 760)');
  /* la didascalia non arriva più a filo del bordo */
  esito(vb[3] - (yc + 0.24*fc) >= 3,
    'la didascalia non finisce sul bordo del viewBox, ' + nome,
    (vb[3] - (yc + 0.24*fc)).toFixed(1) + ' unità di margine (era 0,00 a 380)');
  /* e i numeri dell'asse non stanno appiccicati all'asse */
  const yn = +g.assi[0].getAttribute('y');
  esito((yn - 0.76*g.fe - g.asseY) * k >= 6,
    'i numeri dell\'asse stanno almeno sei pixel veri sotto l\'asse, ' + nome,
    ((yn - 0.76*g.fe - g.asseY)*k).toFixed(2) + 'px (era 2,83 a 380)');
}
MOB = false; A.render(); swing(0);

if (ko) process.exitCode = 1;
