/* Il filtro dell'emiciclo, esercitato su un DOM vero.
 *
 * Perché serve un DOM vero e non uno dei ridotti: qui si asserisce su elementi resi —
 * quali cerchi portano la classe che li tiene accesi, che cosa dice `aria-pressed`, dove
 * va il fuoco — e negli stub `innerHTML` è una stringa che nessuno analizza mai. È la
 * trappola elencata in CLAUDE.md, ed è la ragione per cui questa prova è costruita come
 * `interazione.js`: jsdom, markup vero preso da index.html, eventi veri.
 *
 * Le proprietà:
 *   · con un filtro attivo restano accesi ESATTAMENTE i seggi di quel gruppo, e nessun
 *     altro — nei due versi, perché «tutti accesi» e «nessuno acceso» passerebbero
 *     entrambi un controllo scritto in un verso solo;
 *   · Esc riporta alla vista piena;
 *   · vale in tutte e due le viste, «Per blocco» e «Per lista»;
 *   · l'attivazione da tastiera funziona davvero, e non perché la simuliamo con un click:
 *     si verifica che le voci siano <button> raggiungibili col tabulatore, che è ciò che
 *     rende invio e barra spaziatrice competenza del browser.
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
  'global.A={render:render,sim:function(v){SIM=v;},SEG:function(){return SEG;},' +
  'blocchi:blocchi,nm:nm,filtro:function(){return EMIFILT;}};carica().then(render,render)');
eval(src);

const $ = i => D.getElementById(i);
const cerchi = () => [].slice.call($('k-emi').querySelectorAll('circle'));
const accesi = () => cerchi().filter(c => c.classList.contains('on'));
const gruppoDi = c => c.getAttribute('data-g');
const voci = () => [].slice.call($('k-emileg').querySelectorAll('button[data-emig]'));
const vocePer = g => $('k-emileg').querySelector('[data-emig="' + g + '"]');
function click(el){ el.dispatchEvent(new W.MouseEvent('click',{bubbles:true})); }
function esc(){ D.dispatchEvent(new W.KeyboardEvent('keydown',{key:'Escape',bubbles:true})); }
function vista(m){ click(D.querySelector('[data-emi="' + m + '"]')); }

setTimeout(function(){
  const A = global.A;
  A.sim(1000);

  /* ── il disegno di partenza ── */
  esito(cerchi().length === 120, 'l\'emiciclo disegna 120 seggi', String(cerchi().length));
  esito(cerchi().every(c => !!gruppoDi(c)), 'ogni seggio dichiara il proprio gruppo');
  esito(accesi().length === 0 && !$('k-emi').classList.contains('filtra'),
    'senza filtro nessun seggio è marcato in evidenza', String(accesi().length));
  esito($('k-emiall').hidden === true && $('k-emist').textContent === '',
    'senza filtro il ritorno e la riga di stato sono muti',
    '"' + $('k-emist').textContent + '"');

  /* ── le voci sono comandi veri, non testo con un onclick ── */
  const v = voci();
  esito(v.length >= 3, 'la legenda è fatta di pulsanti', String(v.length));
  esito(v.every(b => b.tagName === 'BUTTON' && b.type === 'button'),
    'ogni voce è un <button>, quindi tabulabile e attivabile con invio e barra');
  esito(v.every(b => b.getAttribute('aria-pressed') === 'false'),
    'a riposo nessuna voce risulta premuta');
  esito($('k-emileg').getAttribute('role') === 'group' && !!$('k-emileg').getAttribute('aria-label'),
    'la legenda si presenta come un gruppo di comandi');

  /* ── il filtro, nelle due viste ── */
  [['blocchi','coalizione'],['partiti','likud']].forEach(function(par){
    const modo = par[0], g = par[1];
    vista(modo);
    const attesi = cerchi().filter(c => gruppoDi(c) === g).length;
    esito(attesi > 0, 'vista ' + modo + ': il gruppo di prova ha seggi da accendere', g);

    click(vocePer(g));

    /* i due versi: nessuno di troppo e nessuno di meno. Un controllo scritto in un verso
       solo passerebbe anche con tutti i cerchi accesi, o con nessuno. */
    const acc = accesi();
    esito(acc.length === attesi,
      'vista ' + modo + ': in evidenza esattamente i seggi del gruppo',
      'accesi ' + acc.length + ', attesi ' + attesi);
    esito(acc.every(c => gruppoDi(c) === g),
      'vista ' + modo + ': nessun seggio di un altro gruppo resta in evidenza',
      JSON.stringify(acc.map(gruppoDi).filter(x => x !== g)));
    esito(cerchi().filter(c => gruppoDi(c) === g).every(c => c.classList.contains('on')),
      'vista ' + modo + ': nessun seggio del gruppo resta spento');
    esito($('k-emi').classList.contains('filtra'),
      'vista ' + modo + ': il contenitore dichiara il filtro attivo, che è ciò che attenua il resto');
    esito(A.filtro() === g, 'vista ' + modo + ': lo stato interno segue la voce scelta', String(A.filtro()));
    esito(vocePer(g).getAttribute('aria-pressed') === 'true' &&
          voci().filter(b => b.getAttribute('aria-pressed') === 'true').length === 1,
      'vista ' + modo + ': risulta premuta una voce sola — la selezione è singola',
      JSON.stringify(voci().filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.dataset.emig)));
    esito($('k-emiall').hidden === false && /In evidenza/.test($('k-emist').textContent),
      'vista ' + modo + ': compaiono il ritorno e la riga di stato',
      '"' + $('k-emist').textContent + '"');

    /* i tre totali restano tutti e tre, e in evidenza c'è quello del blocco della voce */
    const tot = [].slice.call($('k-emi').querySelectorAll('text[data-g]'));
    esito(tot.length === 6,
      'vista ' + modo + ': i tre totali restano tutti e tre sotto filtro',
      String(tot.length / 2) + ' totali');

    /* ── Esc riporta alla vista piena ── */
    esc();
    esito(A.filtro() === null && accesi().length === 0 && !$('k-emi').classList.contains('filtra'),
      'vista ' + modo + ': Esc riporta alla vista piena',
      'filtro ' + A.filtro() + ', accesi ' + accesi().length);
    esito($('k-emiall').hidden === true && $('k-emist').textContent === '',
      'vista ' + modo + ': dopo Esc il ritorno e la riga di stato tacciono');
    esito(voci().every(b => b.getAttribute('aria-pressed') === 'false'),
      'vista ' + modo + ': dopo Esc nessuna voce risulta premuta');

    /* ── il secondo clic sulla stessa voce fa lo stesso ──
       Ogni via d'uscita riparte da un filtro appena riacceso e verificato: incatenarle
       una dopo l'altra le renderebbe dipendenti, e la prima che si rompe farebbe cadere
       le altre per motivi che non sono i loro. */
    click(vocePer(g));
    esito(A.filtro() === g, 'vista ' + modo + ': il filtro si riaccende per la prova del secondo clic');
    click(vocePer(g));
    esito(A.filtro() === null && accesi().length === 0,
      'vista ' + modo + ': il secondo clic sulla stessa voce toglie il filtro',
      'filtro ' + A.filtro() + ', accesi ' + accesi().length);

    /* ── e il pulsante esplicito pure ── */
    click(vocePer(g));
    esito(A.filtro() === g, 'vista ' + modo + ': il filtro si riaccende per la prova del pulsante');
    click($('k-emiall'));
    esito(A.filtro() === null && accesi().length === 0,
      'vista ' + modo + ': «Mostra tutti i seggi» toglie il filtro',
      'filtro ' + A.filtro() + ', accesi ' + accesi().length);
  });

  /* ── cambiare vista non lascia dentro un filtro che non seleziona più niente ── */
  vista('partiti');
  click(vocePer('likud'));
  vista('blocchi');
  esito(A.filtro() === null && accesi().length === 0,
    'cambiando vista il filtro si azzera invece di restare appeso a una chiave che non esiste',
    String(A.filtro()));

  console.log('\nemifiltro: ' + ok + '/' + (ok + ko));
  if (ko) process.exit(1);
}, 3000);
