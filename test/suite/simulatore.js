/* Il simulatore manuale di maggioranza, su un DOM vero.
 *
 * Le pastiglie erano già <button>, ma lo stato selezionato passava solo dal colore e la
 * barra portava due esadecimali cablati — '#1c6b45' e '#a52a2a' — che la tavolozza non
 * aveva mai visto: la stessa strada doppia dei token di blocco, versione semaforo. Con i
 * token veri il bianco fisso del totale, sul --pos del tema scuro, starebbe a 2,14.
 *
 * Le proprietà:
 *   · ogni pastiglia è <button type="button"> con aria-pressed coerente con la selezione,
 *     e il click commuta insieme stato e attributo;
 *   · la pastiglia selezionata porta il fondo pieno del colore della lista;
 *   · la barra passa dai token via classe: nessun esadecimale cablato nel codice né nello
 *     stile in linea — la mutazione che rimette i due colori di prima deve cadere;
 *   · il confine dei due stati è 61 COMPRESO: a 60 «non ci arriva», a 61 maggioranza;
 *   · niente gradiente nella CSS della barra;
 *   · il testo del totale è --on-color, e passa a --ink solo quando il riempimento è
 *     troppo stretto per contenerlo.
 *
 * Le altezze delle pillole e la leggibilità del totale sopra il riempimento non sono
 * misurabili in jsdom, che non fa layout: verificate a mano su browser il 21 agosto 2026
 * nei due temi, a larghezza piena, a 760 e a 380px.
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
  'global.A={render:render,sim:function(v){SIM=v;},rChips:rChips,SEG:function(){return SEG;},' +
  'setSEG:function(v){SEG=v;},setCOAL:function(v){COAL=v;},COAL:function(){return COAL;},' +
  'P:function(){return P;},cp:cp};carica().then(render,render)');
eval(src);

const $ = i => D.getElementById(i);
const chips = () => [].slice.call($('k-chips').querySelectorAll('.chip'));
const chipDi = id => $('k-chips').querySelector('[data-p="' + id + '"]');
function click(el){ el.dispatchEvent(new W.MouseEvent('click',{bubbles:true})); }

/* la CSS della barra e delle pastiglie, per le asserzioni che riguardano lo stile */
const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
/* le regole della barra sono scritte su due righe: si cerca nel CSS intero, con [^}]*
   che attraversa le righe, non in un filtro riga per riga che perderebbe la seconda */
const cssGauge = css;

setTimeout(function(){
  const A = global.A;
  A.sim(500);
  A.setCOAL({}); A.rChips();

  /* ── comandi veri, stato dichiarato ── */
  const c = chips();
  esito(c.length >= 10, 'una pastiglia per ogni lista con seggi', String(c.length));
  esito(c.every(b => b.tagName === 'BUTTON' && b.type === 'button'),
    'ogni pastiglia è un <button type="button">');
  esito(c.every(b => b.getAttribute('aria-pressed') === 'false'),
    'a riposo nessuna pastiglia dichiara di essere premuta');
  esito($('k-chips').getAttribute('role') === 'group' && !!$('k-chips').getAttribute('aria-label'),
    'le pastiglie si presentano come un gruppo di comandi');
  esito(c.every(b => !b.getAttribute('style')),
    'a riposo nessuna pastiglia ha il fondo pieno');

  /* ── il click commuta stato e attributo insieme ── */
  click(chipDi('likud'));
  esito(A.COAL().likud === true, 'il click mette la lista nella coalizione');
  esito(chipDi('likud').getAttribute('aria-pressed') === 'true' && chipDi('likud').classList.contains('on'),
    'e la pastiglia lo dichiara, con aria-pressed e classe insieme');
  const attesoFondo = A.cp(A.P().likud.c).toLowerCase();
  esito((chipDi('likud').getAttribute('style') || '').toLowerCase().indexOf(attesoFondo) >= 0,
    'la pastiglia selezionata porta il fondo pieno del colore della lista',
    chipDi('likud').getAttribute('style'));
  click(chipDi('likud'));
  esito(!A.COAL().likud && chipDi('likud').getAttribute('aria-pressed') === 'false',
    'il secondo click la toglie e aria-pressed torna false');

  /* ── i due stati della barra, dai token e non da esadecimali ── */
  esito(!/#1c6b45|#a52a2a/i.test(src),
    'nessun esadecimale cablato per i due stati della barra nel codice');
  /* jsdom serializza i colori in linea come rgb(…), non esadecimali: si cercano entrambi */
  esito(!/#[0-9a-f]{3,6}|rgb\(|background/i.test($('k-gb').getAttribute('style') || ''),
    'lo stile in linea del riempimento non porta colori: solo la larghezza',
    $('k-gb').getAttribute('style'));
  esito(/\.gauge\.ok i\{[^}]*var\(--pos\)/.test(cssGauge) && /\.gauge i\{[^}]*var\(--neg\)/.test(cssGauge),
    'la CSS lega i due stati ai token --pos e --neg');
  const soloGauge = (css.match(/#kn26 \.(gauge|chip)[^{]*\{[^}]*\}/g) || []).join('\n');
  esito(soloGauge.length > 0 && !/gradient/i.test(soloGauge), 'nessun gradiente nella CSS della barra e delle pastiglie');
  esito(/\.gauge \.vv\{[^}]*var\(--on-color\)/.test(cssGauge),
    'il totale dentro il riempimento è --on-color, non bianco fisso');
  esito(!/\.gauge \.vv\{[^}]*#fff/i.test(cssGauge), 'e il bianco fisso di prima non c\'è più');
  esito(/\.gauge \.th\{[^}]*box-shadow:[^}]*var\(--wash\)/.test(cssGauge),
    'il tratto della soglia porta l\'alone --wash');

  /* ── il confine esatto a 61, nei due versi ── */
  /* id veri: rChips() legge P[i] per la nota sulle liste arabe, e un id inventato la fa morire */
  A.setSEG({likud:60, raam:1, yashar:59});
  A.setCOAL({likud:true}); A.rChips();
  esito(!$('k-gauge').classList.contains('ok') && $('k-gv').textContent === '60 seggi',
    'a 60 seggi la barra dice «non ci arriva»', $('k-gv').textContent);
  A.setCOAL({likud:true, raam:true}); A.rChips();
  esito($('k-gauge').classList.contains('ok') && $('k-gv').textContent === '61 seggi',
    'a 61 seggi esatti la barra passa a maggioranza: il confine è compreso', $('k-gv').textContent);
  esito($('k-gb').style.width === (100*61/120).toFixed(2).replace(/\.?0+$/,'') + '%' ||
        Math.abs(parseFloat($('k-gb').style.width) - 100*61/120) < 0.01,
    'il riempimento è proporzionale ai seggi su 120', $('k-gb').style.width);

  /* ── a pochi seggi il totale non resta in --on-color sul fondo --wash ── */
  A.setCOAL({raam:true}); A.rChips();
  esito($('k-gauge').classList.contains('vuota') && !!$('k-gv').style.left,
    'con un riempimento troppo stretto il totale passa accanto, in --ink',
    $('k-gv').style.left);
  A.setCOAL({likud:true}); A.rChips();
  esito(!$('k-gauge').classList.contains('vuota') && !$('k-gv').style.left,
    'con riempimento sufficiente il totale torna dentro, in --on-color');

  /* ripristino */
  A.calcola && A.calcola();
  A.setCOAL({});

  console.log('\nsimulatore: ' + ok + '/' + (ok + ko));
  if (ko) process.exit(1);
}, 3000);
