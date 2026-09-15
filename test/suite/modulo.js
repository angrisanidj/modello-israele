/* IL MODULO DEI SEGGI SEGUE IL TEMA: il contrasto reso delle etichette, a pagina aperta in scuro.
 *
 * Scritta il 15 settembre 2026. Le etichette di #k-form-seggi nascevano dentro il modulo manuale,
 * al caricamento dello script, prima che leggiTema() avesse girato: SCURO valeva ancora false e
 * nessun cambio di tema le ricostruiva. Aprendo la pagina in scuro 13 etichette su 23 stavano
 * sotto 3 di contrasto e 18 sotto 4,5, con un minimo di 1,57 — il colore chiaro di Hadash–Ta'al
 * sulla carta scura.
 *
 * LA PROVA NON GUARDA SE IL CODICE CHIAMA cp(): lo chiamava anche prima. Misura il colore che
 * l'etichetta porta davvero, contro la carta del tema in cui la pagina è, nei due versi: aperta
 * in scuro, poi in chiaro, poi di nuovo in scuro.
 *
 * LE ETICHETTE SOTTO 4,5 CHE RESTANO SONO UN INVENTARIO, non una soglia allentata. Sono il giro
 * a parte già annunciato: con la tavolozza giusta stanno fra 3,57 e 4,39, e qui il colore è
 * l'unico inchiostro del nome, quindi vale il pavimento del testo. Una etichetta nuova sotto 4,5
 * fa cadere la prova; una dell'inventario che risale sopra la fa cadere anche lei, perché va
 * tolta invece di restare come scusa. È l'idioma di opacita.js.
 */
const fs = require('fs');
const {JSDOM} = require('jsdom');
let ok = 0, ko = 0;
function esito(cond, desc, dettaglio){
  if (cond) { ok++; console.log('OK ' + desc); }
  else { ko++; console.log('KO ' + desc + (dettaglio !== undefined ? ' — ' + dettaglio : '')); }
}

/* la pagina si apre con il SISTEMA in scuro: il tema resta «auto», che è il caso di chi non ha
   mai premuto niente, e leggiTema() lo risolve in scuro */
const dom = new JSDOM('<!doctype html><html><body><div id="kn26"></div></body></html>', {pretendToBeVisual: true});
const W = dom.window, D = W.document;
global.DOMParser = W.DOMParser;
const html = fs.readFileSync('../../index.html', 'utf8');
D.body.innerHTML = html.replace(/<script>[\s\S]*?<\/script>/g, '').match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
global.document = D; global.window = W;
W.matchMedia = q => ({matches: /prefers-color-scheme:\s*dark/.test(q), addEventListener(){}, addListener(){}});
W.IntersectionObserver = class { observe(){} unobserve(){} };
global.IntersectionObserver = W.IntersectionObserver;
W.requestAnimationFrame = f => f();
Object.defineProperty(W, 'localStorage', {configurable: true, value: {getItem: () => null, setItem(){}, removeItem(){}}});
global.getComputedStyle = () => ({getPropertyValue: () => ''});
global.Blob = function(){}; global.URL = {createObjectURL(){ return ''; }}; global.FileReader = function(){};
global.fetch = () => Promise.reject(0);

let src = fs.readFileSync(__dirname + '/../app.js', 'utf8');
src = src.replace('carica().then(render,render)',
  'global.A={C:function(){return C;},P:P,IDS:IDS,corre:corre,nm:nm,PAL_SCURO:PAL_SCURO,cp:cp,' +
  'applicaTema:applicaTema,render:render,scuro:function(){return SCURO;}};carica().then(render,render)');
eval(src);
A.render();

const INVENTARIO = {
  scuro: {
    democratici: 'tavolozza scura 4,36: pavimento del codice colore, non del testo — giro a parte',
    bennett26:   'tavolozza scura 4,36: pavimento del codice colore, non del testo — giro a parte',
    blue_white:  'tavolozza scura 4,36: pavimento del codice colore, non del testo — giro a parte',
    beitenu:     'tavolozza scura 4,36: pavimento del codice colore, non del testo — giro a parte',
    shas:        'tavolozza scura 4,36: pavimento del codice colore, non del testo — giro a parte',
    lista_araba: 'tavolozza scura 4,39: pavimento del codice colore, non del testo — giro a parte'
  },
  chiaro: {
    otzma:       'tavolozza chiara 3,57: il pavimento del codice colore in chiaro è 3,36 — giro a parte',
    democratici: 'tavolozza chiara 3,58: il pavimento del codice colore in chiaro è 3,36 — giro a parte',
    yashar:      'tavolozza chiara 3,59: il pavimento del codice colore in chiaro è 3,36 — giro a parte',
    shas:        'tavolozza chiara 3,60: il pavimento del codice colore in chiaro è 3,36 — giro a parte',
    lista_araba: 'tavolozza chiara 3,76: il pavimento del codice colore in chiaro è 3,36 — giro a parte'
  }
};

/* un esadecimale passa com'è; solo rgb(…) si converte. La prima stesura estraeva le cifre anche
   da «#0F1727» — «0» e «1727» — e misurava il contrasto contro un colore che non esiste: sei
   etichette a 2,87 dove la pagina rende 4,36. È l'errore di conversione che la misura sul
   browser aveva fatto un'ora prima, ripetuto qui. */
const esa = s => { s = String(s).trim(); if (/^#[0-9a-f]{6}$/i.test(s)) return s.toUpperCase();
  const m = s.match(/\d+/g); return m ? '#' + m.slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('').toUpperCase() : s.toUpperCase(); };
const lum = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]
  .map(c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); })
  .reduce((a, c, i) => a + c * [0.2126, 0.7152, 0.0722][i], 0); };
const contrasto = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

/* ogni etichetta, con la lista a cui appartiene: l'input accanto porta data-p */
function etichette(){
  return [...D.querySelectorAll('#k-form-seggi > div')].map(d => {
    const l = d.querySelector('label'), i = d.querySelector('.i-s');
    return {id: i ? i.dataset.p : null, colore: esa(l ? l.style.color : ''), input: i};
  });
}
function misura(tema){
  const carta = esa(A.C().card);
  const e = etichette();
  const valori = e.map(x => ({id: x.id, colore: x.colore, c: contrasto(x.colore, carta)}));
  const sotto3 = valori.filter(v => v.c < 3), sotto45 = valori.filter(v => v.c < 4.5);
  const inv = INVENTARIO[tema];
  const nuove = sotto45.filter(v => !inv[v.id]).map(v => v.id + ' ' + v.colore + ' ' + v.c.toFixed(2));
  const risalite = Object.keys(inv).filter(id => !sotto45.some(v => v.id === id));
  return {carta, valori, sotto3, sotto45, nuove, risalite};
}
const corrono = A.IDS.filter(i => A.corre(i));

/* ══ 1 · APERTA IN SCURO ══ */
{
  esito(A.scuro() === true && lum(esa(A.C().card)) < 0.05,
    'la pagina è aperta in scuro: il tema segue il sistema e la carta è scura', esa(A.C().card));
  const m = misura('scuro');
  esito(m.valori.length === corrono.length && m.valori.every(v => v.id && A.corre(v.id)),
    'il modulo ha un\'etichetta per ogni lista che corre, e solo per quelle', m.valori.length + ' contro ' + corrono.length);
  esito(m.sotto3.length === 0,
    'aperta in scuro, nessuna etichetta sta sotto 3 di contrasto sulla carta scura — prima della riparazione erano 13',
    m.sotto3.map(v => v.id + ' ' + v.colore + ' ' + v.c.toFixed(2)).join(' | '));
  esito(m.nuove.length === 0,
    'e quelle sotto 4,5 sono solo quelle dell\'inventario, con la loro ragione', m.nuove.join(' | '));
  esito(m.risalite.length === 0,
    'e ogni voce dell\'inventario sta ancora sotto 4,5: una che risale va tolta', m.risalite.join(', '));
}

/* ══ 2 · IL CAMBIO DI TEMA LE RICOSTRUISCE, NEI DUE VERSI, E NON CANCELLA I NUMERI SCRITTI ══ */
{
  const primo = etichette()[0];
  primo.input.value = '7';
  A.applicaTema('chiaro');
  esito(A.scuro() === false && lum(esa(A.C().card)) > 0.9, 'passata in chiaro, la carta è chiara', esa(A.C().card));
  const m = misura('chiaro');
  esito(m.sotto3.length === 0 && m.nuove.length === 0 && m.risalite.length === 0,
    'in chiaro le etichette si ricostruiscono sulla tavolozza chiara: nessuna sotto 3, e sotto 4,5 solo l\'inventario',
    'sotto 3: ' + m.sotto3.map(v => v.id).join(',') + ' · nuove: ' + m.nuove.join(' | ') + ' · risalite: ' + m.risalite.join(','));
  const dopo = etichette().find(x => x.id === primo.id);
  esito(dopo && dopo.input.value === '7',
    'e il numero già scritto in una casella sopravvive alla ricostruzione', dopo ? dopo.input.value : 'casella sparita');
  A.applicaTema('scuro');
  const m2 = misura('scuro');
  esito(A.scuro() === true && m2.sotto3.length === 0 && m2.nuove.length === 0,
    'e tornata in scuro si ricostruiscono di nuovo: il verso che una sola ricostruzione al caricamento non avrebbe',
    m2.sotto3.map(v => v.id + ' ' + v.c.toFixed(2)).join(' | '));
}

console.log('\nmodulo: ' + ok + '/' + (ok + ko));
if (ko) process.exit(1);
process.exit(0);
