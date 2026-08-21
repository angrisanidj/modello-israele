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
  'P:function(){return P;},cp:cp,calcola:calcola};carica().then(render,render)');
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

  /* ══ l'etichetta della soglia regge sui TRE fondi possibili ══
   *
   * Il tratto e l'etichetta cadono su --wash finché il riempimento non li raggiunge, e sul
   * riempimento — --neg o --pos — quando lo supera. La misura di prima era contro --wash
   * soltanto: lo stesso errore dell'anello, una tinta scelta contro un fondo mentre i
   * fondi sono due. Nessuna tinta singola regge su tutti e tre (--mute 4,79 su --wash ma
   * 1,21 su --neg e --pos in chiaro; --ink 2,80; --on-color 1,09), e non basta nemmeno
   * far cambiare colore all'etichetta secondo il fondo, perché sopra i 61 seggi
   * l'etichetta cade quasi sempre A METÀ — misurato a 69, 72 e 79 — con una parte su
   * ciascun fondo. Da qui la targhetta: un fondo --wash solido sotto il testo. */
  function rgb(h){ h = h.replace('#',''); return [0,2,4].map(i => parseInt(h.substr(i,2),16)); }
  function lin(v){ v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); }
  function lum(t){ return 0.2126*lin(t[0]) + 0.7152*lin(t[1]) + 0.0722*lin(t[2]); }
  function rap(a, b){ const A = lum(rgb(a)), B = lum(rgb(b)); return (Math.max(A,B)+0.05)/(Math.min(A,B)+0.05); }
  function vars(b){ const o = {}; for (const m of b.matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{3,8})/g)) o[m[1]] = m[2]; return o; }
  const CH = vars(html.match(/#kn26\{([\s\S]*?)\n\}/)[1]);
  const SC = Object.assign({}, CH, vars(html.match(/#kn26\.scuro\{([\s\S]*?)\}/)[1]));

  const regolaThl = (css.match(/#kn26 \.gauge \.thl\{[^}]*\}/) || [''])[0];
  esito(/background:var\(--wash\)/.test(regolaThl),
    'l\'etichetta della soglia porta una targhetta --wash sotto il testo', regolaThl.slice(0, 90));
  esito(/padding:/.test(regolaThl), 'la targhetta ha un margine interno, o sarebbe invisibile');
  [['chiaro', CH], ['scuro', SC]].forEach(function(t){
    const nome = t[0], V = t[1];
    const fondi = [['--wash', V.wash], ['--neg', V.neg], ['--pos', V.pos]];
    /* senza targhetta: nessuna tinta singola regge su tutti e tre */
    const nudo = Math.min.apply(null, fondi.map(f => rap(V.mute, f[1])));
    esito(nudo < 4.5,
      'tema ' + nome + ': senza targhetta l\'etichetta sul fondo peggiore sta sotto 4,5 — la targhetta serve',
      nudo.toFixed(2));
    /* con la targhetta: il testo sta sempre su --wash, e la targhetta si stacca dai fondi */
    esito(rap(V.mute, V.wash) >= 4.5,
      'tema ' + nome + ': il testo sulla targhetta regge 4,5', rap(V.mute, V.wash).toFixed(2));
    const targMin = Math.min.apply(null, fondi.slice(1).map(f => rap(V.wash, f[1])));
    esito(targMin >= 3,
      'tema ' + nome + ': la targhetta si stacca dal riempimento in entrambi gli stati (≥3)',
      targMin.toFixed(2));
    /* il tratto, stessa storia: nudo non regge, con l'alone sì */
    const trattoNudo = Math.min.apply(null, fondi.map(f => rap(V.ink, f[1])));
    esito(trattoNudo < 3, 'tema ' + nome + ': il tratto nudo sul riempimento sta sotto 3',
      trattoNudo.toFixed(2));
  });
  const regolaTh = (css.match(/#kn26 \.gauge \.th\{[^}]*\}/) || [''])[0];
  esito(/box-shadow:[^;}]*var\(--wash\)/.test(regolaTh),
    'il tratto della soglia porta l\'alone --wash, che è ciò che lo salva sul riempimento',
    regolaTh.slice(0, 90));

  /* ══ le scorciatoie del cambiamento: tre gradi distinti ══
   *
   * «Blocco del cambiamento» prometteva l'opposizione sionista e includeva già Ra'am: il
   * pulsante per la sola opposizione non esisteva. Ora i tre gradi sono distinti, e la
   * differenza è sostanziale — Ra'am ha gov:1 ed entra al governo, le altre liste arabe
   * hanno gov:0 e sostengono dall'esterno. */
  function selezionate(){
    return [].slice.call($('k-chips').querySelectorAll('.chip.on')).map(b => b.dataset.p).sort();
  }
  function preset(p){ D.querySelector('[data-pre="' + p + '"]')
    .dispatchEvent(new W.MouseEvent('click',{bubbles:true})); return selezionate(); }
  A.calcola(); A.rChips();

  const zionista = ['byachad','democratici','yashar','beitenu'].sort();
  esito(JSON.stringify(preset('cambio')) === JSON.stringify(zionista),
    '«Blocco del cambiamento» seleziona la sola opposizione sionista, senza Ra\'am',
    JSON.stringify(preset('cambio')));
  const conRaam = zionista.concat(['raam']).sort();
  esito(JSON.stringify(preset('cambio_raam')) === JSON.stringify(conRaam),
    '«Cambiamento + Ra\'am» aggiunge Ra\'am e nient\'altro',
    JSON.stringify(preset('cambio_raam')));
  const conArabi = preset('cambio_ar');
  esito(conRaam.every(i => conArabi.indexOf(i) >= 0) && conArabi.length > conRaam.length,
    '«Cambiamento + liste arabe» contiene i precedenti e aggiunge le altre liste arabe',
    JSON.stringify(conArabi));
  esito(conArabi.some(i => A.P()[i] && !A.P()[i].gov),
    'e le liste che aggiunge sono quelle con gov:0, che sostengono dall\'esterno',
    JSON.stringify(conArabi.filter(i => A.P()[i] && !A.P()[i].gov)));
  esito(preset('cambio_raam').indexOf('raam') >= 0 && preset('cambio').indexOf('raam') < 0,
    'i tre gradi sono davvero distinti: Ra\'am separa il primo dal secondo');
  esito(D.querySelectorAll('[data-pre]').length === 6,
    'le scorciatoie sono sei', String(D.querySelectorAll('[data-pre]').length));
  preset('clear');
  esito(selezionate().length === 0, '«Azzera» le toglie tutte');

  console.log('\nsimulatore: ' + ok + '/' + (ok + ko));
  if (ko) process.exit(1);
}, 3000);
