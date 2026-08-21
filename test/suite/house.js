/* L'house effect: due forme della stessa misura, e i colori dei valori.
 *
 * Due cose, e sono legate.
 *
 * 1. LA FORMA. La tabella ha 941,8px di larghezza minima e il contenitore vale
 *    clientWidth − 110: sotto i ~1052px spingeva l'intero documento fuori dalla finestra,
 *    588,8px a 380. Non si è messa a scorrere, si è cambiata forma — sotto la soglia una
 *    scheda per istituto, sopra la tabella. La ragione è l'8 settembre: due liste in più
 *    sono due voci dentro un elenco che va a capo, mentre la tabella passerebbe a ~1060px
 *    di minimo contro un contenitore che il max-width blocca a 1070, e sforerebbe anche
 *    su schermo largo.
 *    Il confine è 1075 e non 1052 per due motivi, e il secondo è quello che conta: la
 *    media query si confronta con innerWidth, cioè con la finestra COMPRESA la barra di
 *    scorrimento, mentre il contenitore vive dentro il clientWidth. A 1060 con una barra
 *    da 15px il contenitore vale 935 e la tabella sarebbe ricomparsa sforando di sette
 *    pixel — il difetto che questa regola esiste per chiudere. Misurato su browser: la
 *    media query rispondeva 1070 dove il clientWidth era 1055.
 *
 * 2. I COLORI. I valori erano --coal in eccesso e --neg in difetto, e nell'house effect
 *    il segno non è un giudizio: «+6,1 al Likud» è uno scarto, non un miglioramento.
 *    Peggio, tutti e due i token significano altro — --coal è il Blocco Netanyahu in
 *    cinque punti della pagina, --neg è «ha perso seggi» nelle colonne 7 GG e 30 GG.
 *    È la stessa forma dei difetti dei token di blocco e della mediana: due grandezze
 *    diverse sulla stessa codifica.
 *
 * E le due forme sono DUE STRADE PER LO STESSO VALORE, che è esattamente ciò che il
 * progetto ha già pagato caro tre volte. Qui sotto c'è la prova che le lega: gli stessi
 * istituti, e per ciascuno gli stessi scarti da 0,8 in su.
 *
 * Quel che jsdom non può dire, perché non fa layout: che a 380 la scheda non sfori e che
 * la soglia sia nel punto giusto. Il confine è provato come costante nella CSS; la sua
 * derivazione è misurata su browser e scritta nel commento accanto alla regola.
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
  'global.A={render:render,rHouse:rHouse,effettiCasa:effettiCasa,nm:nm,' +
  'ESCL:function(){return ESCL;}};carica().then(render,render)');
eval(src);

const $ = i => D.getElementById(i);
const css = (html.match(/<style>([\s\S]*?)<\/style>/) || ['',''])[1];

/* Il valore reso porta il meno tipografico (−, U+2212), non il trattino d'unione: è la
   stessa scelta delle colonne 7 GG e 30 GG. Chi legge i numeri dal DOM deve normalizzarlo,
   o parseFloat restituisce NaN e ogni scarto negativo sparisce dal conto. */
const num = t => parseFloat(String(t).replace('—','0').replace('−','-').replace(',','.')) || 0;

/* ── contrasto WCAG, sui token veri dei due temi ── */
function rgb(h){ h = h.replace('#',''); if (h.length === 3) h = h.split('').map(c=>c+c).join('');
  return [0,2,4].map(i => parseInt(h.substr(i,2),16)); }
function lin(v){ v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); }
function lum(t){ return 0.2126*lin(t[0]) + 0.7152*lin(t[1]) + 0.0722*lin(t[2]); }
function rap(a, b){ const A = lum(rgb(a)), B = lum(rgb(b)); return (Math.max(A,B)+0.05)/(Math.min(A,B)+0.05); }
function vars(b){ const o = {}; for (const m of b.matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{3,8})/g)) o[m[1]] = m[2]; return o; }
const CH = vars(html.match(/#kn26\{([\s\S]*?)\n\}/)[1]);
const SC = Object.assign({}, CH, vars(html.match(/#kn26\.scuro\{([\s\S]*?)\}/)[1]));

setTimeout(function(){

  const box = $('k-house');
  const tab = box.querySelector('.hstab');
  const sch = box.querySelector('.hsch');

  /* ══ 1 · le due forme esistono, e sono forme diverse della stessa cosa ══ */
  esito(!!tab && !!tab.querySelector('table'), 'la tabella c\'è, dentro .hstab');
  esito(!!sch && sch.querySelectorAll('.hs').length > 0, 'le schede ci sono, dentro .hsch',
    sch ? String(sch.querySelectorAll('.hs').length) : 'nessuna');

  /* ══ 2 · il confine, e che sia esatto ══
   *
   * Sotto la soglia: schede sì, tabella no. Sopra: il contrario. In jsdom non c'è layout,
   * quindi la proprietà si legge dove è scritta — nella CSS. */
  const regolaTab = (css.match(/#kn26 \.hstab\{[^}]*\}/) || [''])[0];
  const regolaSch = (css.match(/#kn26 \.hsch\{[^}]*\}/) || [''])[0];
  esito(/display:none/.test(regolaTab),
    'sotto la soglia la tabella è display:none — la forma predefinita è la scheda', regolaTab);
  esito(/display:flex/.test(regolaSch),
    'sotto la soglia le schede sono visibili', regolaSch);

  const mq = css.match(/@media\(min-width:(\d+)px\)\{([\s\S]*?)\n\}/g) || [];
  const blocco = mq.find(b => /\.hstab/.test(b) && /\.hsch/.test(b)) || '';
  const soglia = +(blocco.match(/min-width:(\d+)px/) || [0,0])[1];
  esito(soglia === 1075, 'il confine è a 1075px, ed è uno solo', String(soglia));
  esito(/#kn26 \.hstab\{display:block;\}/.test(blocco),
    'sopra il confine compare la tabella', blocco.slice(0,80));
  esito(/#kn26 \.hsch\{display:none;\}/.test(blocco),
    'sopra il confine spariscono le schede', blocco.slice(0,80));
  /* La soglia deve stare sopra la larghezza minima misurata, e il conto va fatto sulla
     barra di scorrimento più larga: la media query si confronta con innerWidth, cioè con
     la finestra COMPRESA la barra, mentre il contenitore vive dentro il clientWidth.
     Contenitore = soglia − barra − 110. Con la barra classica da 17px la tabella deve
     ancora starci: senza questa sottrazione la soglia sarebbe finita a 1060, dove il
     contenitore vale 935 e la tabella sfora di sette pixel. */
  const BARRA = 17;
  esito(soglia - BARRA - 110 >= 941.8,
    'a quel confine la tabella ci sta anche con la barra di scorrimento più larga',
    (soglia - BARRA - 110) + ' contro 941,8');
  esito(soglia - BARRA - 110 - 941.8 >= 5,
    'e con un margine che non è un arrotondamento (a 1052 sarebbe stato di 0,2px)',
    (soglia - BARRA - 110 - 941.8).toFixed(1) + 'px');
  esito(soglia - 110 - 941.8 < 941.8,
    'ma non tanto largo da nascondere la tabella dove ci starebbe comodamente');
  /* una sola coppia di regole: se qualcuno ne aggiunge un'altra, il confine si sdoppia */
  esito((css.match(/\.hstab/g) || []).length === 2 && (css.match(/\.hsch/g) || []).length === 2,
    'la commutazione avviene in un punto solo, non in due',
    'hstab ' + (css.match(/\.hstab/g)||[]).length + ' · hsch ' + (css.match(/\.hsch/g)||[]).length);

  /* ══ 3 · ogni istituto ha la sua scheda, col pulsante accanto ══ */
  const e = A.effettiCasa();
  const istituti = Object.keys(e.by);
  esito(istituti.length >= 5, 'ci sono istituti da mostrare', String(istituti.length));
  esito(sch.querySelectorAll('.hs').length === istituti.length,
    'una scheda per istituto, né una in più né una in meno',
    sch.querySelectorAll('.hs').length + ' contro ' + istituti.length);

  const senzaBottone = [].slice.call(sch.querySelectorAll('.hs')).filter(function(c){
    const b = c.querySelector('.hsh button[data-escl]');
    const nome = c.querySelector('.hsh b');
    return !b || !nome || b.dataset.escl !== nome.textContent;
  });
  esito(senzaBottone.length === 0,
    'in ogni scheda il pulsante sta nell\'intestazione, accanto al nome a cui si riferisce',
    senzaBottone.map(c => c.textContent.slice(0,24)).join(' | '));

  const nomiSchede = [].slice.call(sch.querySelectorAll('.hs .hsh b')).map(b => b.textContent).sort();
  esito(JSON.stringify(nomiSchede) === JSON.stringify(istituti.slice().sort()),
    'e sono gli stessi istituti della tabella, non un sottoinsieme',
    nomiSchede.join(' · '));

  /* il pulsante della scheda comanda davvero: è lo stesso data-escl della tabella */
  const primo = sch.querySelector('.hs .hsh button[data-escl]');
  const chi = primo.dataset.escl;
  primo.dispatchEvent(new W.MouseEvent('click', {bubbles:true}));
  esito(!!A.ESCL()[chi], 'il pulsante della scheda esclude l\'istituto', chi);
  const dopo = [].slice.call($('k-house').querySelectorAll('.hs')).find(c =>
    c.querySelector('.hsh b').textContent === chi);
  esito(dopo && dopo.classList.contains('off'),
    'e la scheda dell\'escluso si segna, col tratteggio e non con l\'opacità');
  esito(!/opacity/.test((css.match(/#kn26 \.hs\.off\{[^}]*\}/) || [''])[0]),
    'la scheda esclusa non copia l\'opacity:.42 della riga, dove nessun token arriva a 4,5',
    (css.match(/#kn26 \.hs\.off\{[^}]*\}/) || [''])[0]);
  $('k-house').querySelector('.hs .hsh button[data-escl="' + chi + '"]')
    .dispatchEvent(new W.MouseEvent('click', {bubbles:true}));
  esito(!A.ESCL()[chi], 'e lo reinserisce');

  /* ══ 4 · le due strade portano lo stesso valore ══
   *
   * È la regola generale del progetto: ogni valore che arriva allo schermo per più di una
   * strada deve avere una prova che le leghi. Qui le strade sono due — la tabella e le
   * schede — e la prova è questa. */
  const box2 = $('k-house');
  const tab2 = box2.querySelector('.hstab'), sch2 = box2.querySelector('.hsch');
  const cols = [].slice.call(tab2.querySelectorAll('thead th')).slice(2).map(th => th.getAttribute('title'));
  let divergenti = [];
  [].slice.call(tab2.querySelectorAll('tbody tr')).forEach(function(tr){
    const tds = [].slice.call(tr.querySelectorAll('td'));
    const nome = tds[0].querySelector('button').dataset.escl;
    const dallaTabella = tds.slice(2).map(function(td, i){
      return Math.abs(num(td.textContent)) >= 0.8 ? cols[i] + ' ' + td.textContent.trim() : null;
    }).filter(Boolean).sort();
    const card = [].slice.call(sch2.querySelectorAll('.hs')).find(c =>
      c.querySelector('.hsh b').textContent === nome);
    const dallaScheda = [].slice.call(card.querySelectorAll('.hsv span')).filter(s => !s.classList.contains('nq'))
      .map(s => s.querySelector('em').textContent + ' ' + s.querySelector('s').textContent).sort();
    if (JSON.stringify(dallaTabella) !== JSON.stringify(dallaScheda))
      divergenti.push(nome + ': tabella ' + JSON.stringify(dallaTabella) + ' scheda ' + JSON.stringify(dallaScheda));
  });
  esito(divergenti.length === 0,
    'per ogni istituto gli scarti da 0,8 in su sono gli stessi nelle due forme',
    divergenti.slice(0,2).join(' || '));

  /* la scheda tiene solo quelli che contano: se prendesse tutto sarebbe la tabella */
  const totCelle = tab2.querySelectorAll('tbody td.s').length;
  const totVoci = sch2.querySelectorAll('.hsv span:not(.nq)').length;
  esito(totVoci > 0 && totVoci < totCelle,
    'la scheda porta gli scarti che contano, non tutte le celle', totVoci + ' su ' + totCelle);

  /* ══ 5 · nessun valore usa --coal né --neg ══ */
  const reso = box2.innerHTML;
  esito(!/var\(--coal\)/.test(reso),
    'nessun valore dell\'house effect è dipinto in --coal, che altrove è il Blocco Netanyahu',
    (reso.match(/[^"]{0,40}var\(--coal\)/) || [''])[0]);
  esito(!/var\(--neg\)/.test(reso),
    'né in --neg, che altrove è «ha perso seggi» e «errore»',
    (reso.match(/[^"]{0,40}var\(--neg\)/) || [''])[0]);
  esito(!/var\(--pos\)/.test(reso), 'né in --pos: il segno qui non è un giudizio');
  const tinte = (reso.match(/color:var\(--[a-z0-9-]+\)/g) || [])
    .filter((v,i,a) => a.indexOf(v) === i).sort();
  esito(tinte.every(t => /--ink\)|--mute\)/.test(t)),
    'le sole tinte in gioco sono --ink e --mute: conta / non conta, non su / giù',
    tinte.join(' '));
  /* e il segno c'è davvero, perché è lui a portare la direzione */
  const positivi = [].slice.call(tab2.querySelectorAll('tbody td.s'))
    .filter(td => /^\+/.test(td.textContent.trim()));
  const negativi = [].slice.call(tab2.querySelectorAll('tbody td.s'))
    .filter(td => /^[-−]/.test(td.textContent.trim()));
  esito(positivi.length > 0 && negativi.length > 0,
    'la direzione la porta il segno, ed è scritto in tutte e due le direzioni',
    positivi.length + ' in eccesso · ' + negativi.length + ' in difetto');
  /* il meno è quello tipografico, lo stesso delle colonne 7 GG e 30 GG: due punti della
     stessa pagina che mostrano la stessa grandezza non possono usare due segni diversi */
  esito(negativi.every(td => /^−/.test(td.textContent.trim())),
    'e il meno è quello tipografico, non il trattino di unione',
    negativi.map(td => td.textContent.trim()).filter(x => !/^−/.test(x)).slice(0,3).join(' '));
  const vociNeg = [].slice.call(sch2.querySelectorAll('.hsv s'))
    .filter(s => /^[-−]/.test(s.textContent.trim()));
  esito(vociNeg.length > 0 && vociNeg.every(s => /^−/.test(s.textContent.trim())),
    'e lo stesso segno nelle schede, che sono la seconda strada per lo stesso valore',
    String(vociNeg.length));
  /* l'intensità la porta il peso, come prima */
  const grassi = [].slice.call(tab2.querySelectorAll('tbody td.s'))
    .filter(td => /font-weight:700/.test(td.getAttribute('style') || ''));
  esito(grassi.length > 0 && grassi.every(td => Math.abs(num(td.textContent)) >= 1.5),
    'e l\'intensità il peso, che scatta a 1,5 e solo lì', String(grassi.length));

  /* ══ 6 · il fondo degli scarti resta leggibile nei due temi ══
   *
   * La scheda sta su --wash; la pastiglia del valore, dentro la scheda, su --card. Sono
   * due fondi, non uno, ed è lo stesso errore dell'etichetta della soglia misurarne uno
   * solo. Le righe alternate non esistono: nessun nth-child in tutto il file. */
  esito(!/nth-child\((odd|even)\)/.test(css),
    'non ci sono righe alternate da misurare: nessun nth-child nel foglio');
  const fondoScheda = (css.match(/#kn26 \.hs\{[^}]*\}/) || [''])[0];
  const fondoVoce = (css.match(/#kn26 \.hsv span\{[^}]*\}/) || [''])[0];
  esito(/background:var\(--wash\)/.test(fondoScheda), 'la scheda sta su --wash', fondoScheda.slice(0,70));
  esito(/background:var\(--card\)/.test(fondoVoce), 'la pastiglia del valore sta su --card', fondoVoce.slice(0,70));

  [['chiaro', CH], ['scuro', SC]].forEach(function(t){
    const nome = t[0], V = t[1];
    const prove = [
      ['il valore (--ink) sulla pastiglia (--card)', V.ink, V.card],
      ['il valore (--ink) se la pastiglia sparisce e resta la scheda (--wash)', V.ink, V.wash],
      ['il nome della lista (--ink2) sulla pastiglia', V.ink2, V.card],
      ['il nome dell\'istituto (--ink) sulla scheda', V.ink, V.wash],
      ['la testata e il conteggio (--mute) sulla scheda', V.mute, V.wash],
      ['«nessuno scarto» (--mute) sulla pastiglia', V.mute, V.card]
    ];
    prove.forEach(function(p){
      const r = rap(p[1], p[2]);
      esito(r >= 4.5, 'tema ' + nome + ': ' + p[0] + ' regge 4,5', r.toFixed(2));
    });
    /* il bordo della pastiglia è decorativo: gli basta separare, non deve arrivare a 4,5 */
    esito(rap(V.hair, V.wash) > 1, 'tema ' + nome + ': il bordo della pastiglia si distingue dal fondo',
      rap(V.hair, V.wash).toFixed(2));
  });

  console.log('\nhouse: ' + ok + '/' + (ok + ko));
  if (ko) process.exit(1);
}, 3000);
