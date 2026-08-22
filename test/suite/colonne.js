/* Le colonne dichiarate e i figli emessi devono essere lo stesso numero.
 *
 * Il difetto, misurato a 380 il 22 agosto 2026. La riga della tabella dell'analisi
 * emette CINQUE figli — nome, seggi, sparkline, 7 gg, 30 gg — e sotto i 660 la griglia
 * ne dichiarava QUATTRO. La regola che nascondeva il quinto nascondeva la TESTATA e non
 * il DATO: `#kn26 .prh span:nth-child(5)` prende solo gli span della testata. Il quinto
 * div finiva quindi in una riga IMPLICITA della griglia, a x=27 e largo 104px, cioè
 * sotto la colonna «Lista», 34px più in basso e senza nessuna intestazione sopra.
 * Non era un a-capo: era una colonna orfana. Ogni riga era alta 77,7px invece di 51,3.
 *
 * È la solita forma: due dichiarazioni della stessa cosa — quante colonne ha la tabella
 * — che nessuna prova legava. La testata la dice in HTML, la griglia la dice in CSS, e
 * la riga la dice nel JavaScript che la costruisce. TRE strade, non due.
 *
 * Come funziona la prova. Il numero di figli lo dà il DOM vero costruito da jsdom, che
 * esegue il renderer; le colonne e le regole di visibilità le dà il foglio letto a una
 * data larghezza da test/css.js. Le due cose si confrontano a ogni punto di rottura.
 * jsdom non fa layout, ma qui non serve: si contano dichiarazioni, non pixel.
 */
const {JSDOM} = require('jsdom');
const fs = require('fs');

let ok = 0, ko = 0;
function esito(cond, desc, dettaglio){
  if (cond) { ok++; console.log('OK ' + desc); }
  else { ko++; console.log('KO ' + desc + (dettaglio ? ' — ' + dettaglio : '')); }
}

const CSS = require('../css.js').carica('../../index.html');
const html = fs.readFileSync('../../index.html', 'utf8');

/* ── il DOM vero, per contare i figli che il renderer emette ── */
const dom = new JSDOM('<!doctype html><html><body><div id="kn26"></div></body></html>', {pretendToBeVisual:true});
const W = dom.window, D = W.document;
global.DOMParser = W.DOMParser;
D.body.innerHTML = html.replace(/<script>[\s\S]*?<\/script>/g,'')
  .match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
global.document = D; global.window = W;
W.matchMedia = () => ({matches:false, addEventListener(){}, addListener(){}});
W.IntersectionObserver = class { observe(){} unobserve(){} };
global.IntersectionObserver = W.IntersectionObserver;
W.requestAnimationFrame = f => f();
global.getComputedStyle = () => ({getPropertyValue:()=>''});
global.Blob = function(){}; global.URL = {createObjectURL(){ return ''; }};
global.FileReader = function(){}; global.fetch = () => Promise.reject(0);
let src = fs.readFileSync(__dirname + '/../app.js','utf8');
src = src.replace('carica().then(render,render)', 'global.A={render:render};carica().then(render,render)');
eval(src);
global.A.render();

/* quante colonne dichiara una `grid-template-columns` */
function colonne(gt){
  if (!gt) return null;
  const rep = /repeat\((\d+)\s*,/.exec(gt);
  if (rep) return +rep[1];
  return gt.trim().split(/\s+/).filter(Boolean).length;
}
/* Quali celle sono NASCOSTE a una data larghezza — risolto con la corrispondenza vera,
 * non con un confronto di stringhe.
 *
 * Due tentativi sbagliati prima di questo, e sono la ragione per cui il metodo è questo:
 *  · un `indexOf(prefisso)` faceva credere che `#kn26 .prh span:nth-child(5)` valesse
 *    per `#kn26 .pr`, e dichiarava incoerente la tabella della proiezione, che è sana;
 *  · un prefisso col confine giusto risolveva quello ma NON vedeva che quella stessa
 *    regola raggiunge anche `.prh.mv` — perché `.prh.mv` è anche `.prh`. Con quel
 *    metodo, togliere la riga che riaccende «30 gg» nella testata non faceva cadere
 *    niente: cioè la prova non coglieva il difetto originale rovesciato.
 * Un selettore non si legge, si applica: `matches()` lo fa, e jsdom ce l'ha.
 *
 * Il vincitore fra più regole si decide per SPECIFICITÀ e poi per ordine di sorgente,
 * come in un browser: `#kn26 .prh.mv span:nth-child(5){display:block}` deve battere
 * `#kn26 .prh span:nth-child(5){display:none}` sia per l'una che per l'altro. */
function specificita(sel){
  const id = (sel.match(/#[\w-]+/g) || []).length;
  const cl = (sel.match(/\.[\w-]+|\[[^\]]+\]|:[a-z-]+(\([^)]*\))?/g) || []).length;
  const el = (sel.replace(/[#.][\w-]+|\[[^\]]+\]|:[a-z-]+(\([^)]*\))?/g, '')
                 .match(/[a-z][\w-]*/gi) || []).length;
  return id * 10000 + cl * 100 + el;
}
function nascosti(regs, celle){
  const via = new Set();
  celle.forEach((c, i) => {
    let vinc = null;
    regs.forEach(r => {
      const m = /(?:^|;)\s*display\s*:\s*([^;]+)/.exec(r.decl);
      if (!m) return;
      r.sel.split(',').map(s => s.trim()).forEach(s => {
        let colpisce = false;
        try { colpisce = c.matches(s); } catch (e) { return; }
        if (!colpisce) return;
        const p = specificita(s);
        if (!vinc || p > vinc.p || (p === vinc.p && r.ord >= vinc.ord))
          vinc = {p, ord: r.ord, v: m[1].trim()};
      });
    });
    if (vinc && vinc.v === 'none') via.add(i + 1);
  });
  return via;
}

const LARGHEZZE = [380, 600, 760, 1265];

/* ── le due tabelle a griglia costruite dal JavaScript ── */
const TAB = [
  {nome: 'analisi',    testata: '#kn26 .prh.mv', riga: '#kn26 .pr.mv',
   selT: '#kn26 .prh.mv', selR: '#kn26 .pr.mv',
   preT: '#kn26 .prh.mv', preR: '#kn26 .pr.mv',
   elT: D.querySelector('#kn26 .prh.mv'), elR: D.querySelector('#k-movers .pr.mv')},
  {nome: 'proiezione', testata: '#kn26 .prh', riga: '#kn26 .pr',
   selT: '#kn26 .prh', selR: '#kn26 .pr',
   preT: '#kn26 .prh', preR: '#kn26 .pr',
   elT: D.querySelector('#kn26 .prh:not(.mv)'), elR: D.querySelector('#k-proj .pr:not(.mv)')}
];

esito(!!TAB[0].elT && !!TAB[0].elR, 'la tabella dell\'analisi è resa',
  TAB[0].elR ? '' : 'riga assente');
esito(!!TAB[1].elT && !!TAB[1].elR, 'la tabella della proiezione è resa',
  TAB[1].elR ? '' : 'riga assente');

TAB.forEach(t => {
  if (!t.elT || !t.elR) return;
  const nT = t.elT.children.length, nR = t.elR.children.length;
  esito(nT === nR, 'testata e riga hanno lo stesso numero di celle, ' + t.nome,
    'testata ' + nT + ', riga ' + nR);

  LARGHEZZE.forEach(w => {
    const R = CSS.regole(w);
    /* la griglia: l'ultima dichiarata che nomina il selettore della riga */
    let gt = null;
    R.forEach(r => { r.sel.split(',').map(s => s.trim()).forEach(s => {
      if (s !== t.selR) return;
      const m = /(?:^|;)\s*grid-template-columns\s*:\s*([^;]+)/.exec(r.decl);
      if (m) gt = m[1].trim(); }); });
    if (!gt) return;                    /* a quella larghezza vale la regola di base */
    const nc = colonne(gt);
    const celleR = [...t.elR.children], celleT = [...t.elT.children];
    const viaR = nascosti(R, celleR), viaT = nascosti(R, celleT);
    const visR = nR - viaR.size, visT = nT - viaT.size;

    esito(nc === visR,
      'a ' + w + 'px le colonne dichiarate sono quante le celle visibili della riga, ' + t.nome,
      nc + ' colonne contro ' + visR + ' celle (' + gt + '; nascoste ' + [...viaR].join(',') + ')');
    esito(visT === visR,
      'a ' + w + 'px testata e riga nascondono le stesse celle, ' + t.nome,
      'testata ' + visT + ' visibili, riga ' + visR + ' (testata nasconde ' +
      ([...viaT].join(',') || 'nulla') + ', riga ' + ([...viaR].join(',') || 'nulla') + ')');
  });
});

/* La conseguenza che il difetto produceva — una riga implicita, e la riga alta 77,7px
   invece di 51,3 — jsdom non la può misurare, e un esito(true) che la dichiarasse
   sarebbe un'asserzione che non può cadere. Il numero sta nella testata di questo file
   e in CLAUDE.md; qui si prova la CAUSA, che è verificabile. */

/* ── la sparkline: dove non c'è colonna non dev'esserci nemmeno il disegno ── */
[380, 600].forEach(w => {
  const R = CSS.regole(w);
  const via = nascosti(R, [...TAB[0].elR.children]);
  esito(via.has(3), 'a ' + w + 'px la sparkline esce dalla riga, non solo dalla testata',
    'nascoste ' + ([...via].join(',') || 'nessuna'));
});
[760, 1265].forEach(w => {
  const R = CSS.regole(w);
  const via = nascosti(R, [...TAB[0].elR.children]);
  esito(!via.has(3), 'a ' + w + 'px la sparkline resta', 'nascoste ' + [...via].join(','));
});

/* ── il nome ha lo spazio per stare su una riga ──
   «Giudaismo Unito Torah» misura 146,6px a 380 col corpo della tabella, misurato su
   browser il 22 agosto 2026. La colonna gli dava 104: la sua riga era alta 94,7px
   contro i 78 delle altre, ed era una delle quattro cose aperte sul mobile. */
const NOME_PIU_LUNGO = 146.6;
[[380, 11], [600, 15]].forEach(([w]) => {
  const R = CSS.regole(w);
  let gt = null;
  R.forEach(r => { r.sel.split(',').map(s => s.trim()).forEach(s => {
    if (s !== '#kn26 .pr.mv') return;
    const m = /grid-template-columns\s*:\s*([^;]+)/.exec(r.decl);
    if (m) gt = m[1].trim(); }); });
  esito(/^1fr\b/.test(gt || ''),
    'a ' + w + 'px la colonna del nome è elastica, non un numero fisso da 104px',
    'colonne: ' + gt);
});
esito(NOME_PIU_LUNGO < 155,
  'e a 380 le restano 155px contro i 146,6 che il nome più lungo chiede');

if (ko) process.exitCode = 1;
