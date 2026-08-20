/* L'interazione degli istogrammi, esercitata su un DOM vero.
 *
 * Perché serve: l'aggancio in istogramma() esce senza fare nulla se il contenitore non
 * è un DOM vero, e sette suite ne usano uno ridotto. Senza questa prova quelle righe non
 * sarebbero coperte da niente e `npm run verifica` resterebbe verde anche rompendole —
 * cioè l'accorgimento che tiene su le altre prove nasconderebbe codice non esercitato.
 * È la trappola elencata in CLAUDE.md, e questa prova è ciò che la disinnesca.
 *
 * Il DOM è costruito da index.html con jsdom, come in boot.js.
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
  'global.A={render:render,sim:function(v){SIM=v;}};carica().then(render,render)');
eval(src);

setTimeout(function(){
  const cont = D.getElementById('k-hist');
  const svg  = cont && cont.querySelector && cont.querySelector('svg');
  const riga = D.getElementById('k-hist-l');

  esito(!!svg, 'il grafico è reso come SVG');
  if (!svg) { console.log('KO impossibile proseguire senza SVG'); process.exitCode = 1; return; }

  /* ── raggiungibilità ── */
  esito(svg.getAttribute('tabindex') === '0',
    'il grafico è un solo punto di tabulazione', 'tabindex=' + svg.getAttribute('tabindex'));
  esito(svg.getAttribute('aria-describedby') === 'k-hist-l',
    'il grafico rimanda alla riga di lettura', 'aria-describedby=' + svg.getAttribute('aria-describedby'));
  esito(!!riga && riga.getAttribute('aria-live') === 'polite',
    'la riga di lettura è annunciata dai lettori di schermo',
    riga ? 'aria-live=' + riga.getAttribute('aria-live') : 'riga assente');
  esito(svg.querySelectorAll('title').length === 0,
    'nessun <title> residuo sulle barre',
    svg.querySelectorAll('title').length + ' rimasti: si sovrapporrebbero alla riga');

  const barre = svg.querySelectorAll('.bb');
  esito(barre.length > 10, 'le barre sono interrogabili singolarmente (' + barre.length + ')');

  /* ── il contorno segue la barra attiva ── */
  const ho = D.getElementById('k-hist-ho'), hi = D.getElementById('k-hist-hi');
  esito(!!ho && !!hi, 'il contorno è disegnato in due tratti concentrici');
  const attiva = () => {
    const x = ho && ho.getAttribute('x'), w = ho && ho.getAttribute('width');
    if (!x || !w || +w === 0) return null;
    const c = [...barre].filter(b => b.getAttribute('x') === x && b.getAttribute('width') === w);
    return c.length === 1 ? +c[0].getAttribute('data-i') : (c.length + ' barre');
  };
  const combacia = () => ho && hi &&
    ho.getAttribute('x') === hi.getAttribute('x') &&
    ho.getAttribute('width') === hi.getAttribute('width');

  esito(attiva() === null, 'prima del fuoco nessuna barra è evidenziata', 'evidenziata ' + attiva());
  esito(riga.textContent.trim() === '', 'prima del fuoco la riga è vuota', '«' + riga.textContent + '»');

  /* ── fuoco iniziale sul 61 ── */
  svg.dispatchEvent(new W.FocusEvent('focus'));
  esito(/^61 seggi/.test(riga.textContent),
    'il fuoco iniziale si posa sul 61, la soglia della maggioranza', '«' + riga.textContent + '»');
  esito(attiva() === 61, 'il contorno è sulla barra del 61', 'evidenziata ' + attiva());
  esito(combacia(), 'i due tratti del contorno sono sulla stessa barra');

  const tasto = k => svg.dispatchEvent(new W.KeyboardEvent('keydown', {key:k, cancelable:true}));

  /* ── frecce ── */
  tasto('ArrowRight');
  esito(attiva() === 62 && /^62 seggi/.test(riga.textContent),
    'la freccia destra avanza di un seggio', 'evidenziata ' + attiva() + ', riga «' + riga.textContent + '»');
  tasto('ArrowLeft'); tasto('ArrowLeft');
  esito(attiva() === 60 && /^60 seggi/.test(riga.textContent),
    'la freccia sinistra torna indietro', 'evidenziata ' + attiva() + ', riga «' + riga.textContent + '»');

  /* ── estremi ── */
  const primi = +barre[0].getAttribute('data-i');
  const ultimi = +barre[barre.length-1].getAttribute('data-i');
  tasto('Home');
  esito(attiva() === primi && riga.textContent.indexOf(primi + ' seggi') === 0,
    'Home porta al primo cestello (' + primi + ')', 'evidenziata ' + attiva());
  tasto('End');
  esito(attiva() === ultimi && riga.textContent.indexOf(ultimi + ' seggi') === 0,
    'End porta all\'ultimo cestello (' + ultimi + ')', 'evidenziata ' + attiva());

  /* ── una sola barra alla volta ── */
  esito(typeof attiva() === 'number',
    'è evidenziata esattamente una barra alla volta', 'trovate ' + attiva());
  esito(D.querySelectorAll('#k-hist .bb.on').length === 0,
    'l\'evidenziazione non tocca il riempimento delle barre',
    D.querySelectorAll('#k-hist .bb.on').length + ' barre con riempimento alterato');

  /* ── la riga dice tre cose, non una ── */
  esito(/seggi.*·.*delle simulazioni.*·.*almeno/.test(riga.textContent),
    'la riga dà cestello, frequenza e probabilità cumulata', '«' + riga.textContent + '»');

  /* ── il secondo istogramma è agganciato allo stesso modo ── */
  const c2 = D.getElementById('k-hist2');
  const svg2 = c2 && c2.querySelector && c2.querySelector('svg');
  const riga2 = D.getElementById('k-hist2-l');
  esito(!!svg2 && svg2.getAttribute('tabindex') === '0' && !!riga2,
    'anche il secondo istogramma è interrogabile');
  if (svg2 && riga2) {
    svg2.dispatchEvent(new W.FocusEvent('focus'));
    esito(/seggi/.test(riga2.textContent),
      'il secondo istogramma ha una riga di lettura propria', '«' + riga2.textContent + '»');
    esito(riga2.id !== riga.id && riga2.textContent !== '',
      'le due righe di lettura sono indipendenti');
  }

  if (ko) process.exitCode = 1;
}, 300);
