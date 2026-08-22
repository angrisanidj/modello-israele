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
 *    Il colore è tornato, ma da un'altra parte e con un'altra forma: una SCALA
 *    DIVERGENTE sul FONDO della cella, quattro gradini più il neutro, sulle soglie che
 *    esistevano già — 0,8 e 1,5. Non è una coppia di tinte contrapposte, che direbbe due
 *    categorie: è un continuo che passa per un neutro, e il neutro è il fondo della
 *    cella, così le celle vicine allo zero sembrano non toccate. Il testo resta tutto
 *    --ink; l'attenuazione --mute sotto 0,8 è sparita perché diceva la stessa cosa del
 *    neutro nella stessa modalità.
 *    Le due tinte sono oro (H 85°) e viola (H 303°), e la ragione non è che nella
 *    tavolozza non restino tinte libere: è che le SUPERFICI NEUTRE della pagina sono già
 *    il blu della coalizione — --wash chiaro a 261,8°, --card scuro a 263,4°, --coal a
 *    262,2°, --acc a 262,9°. L'azzurro è occupato due volte, dal blocco e dalla carta.
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
  'global.A={render:render,rHouse:rHouse,effettiCasa:effettiCasa,nm:nm,P:P,' +
  'ESCL:function(){return ESCL;}};carica().then(render,render)');
eval(src);

const $ = i => D.getElementById(i);
/* Le VOCI di una scheda sono gli scarti, e nient'altro. Nella scheda ci sono anche due
   pastiglie che voci non sono: «nessuno scarto oltre 0,8 seggi» (.nq) e la pastiglia
   neutra di riepilogo «altre 4 · sotto 0,8» (.neu). Contarle come voci fa cadere la prova
   che lega tabella e schede — e ci è già caduta, al primo giro dopo la pastiglia neutra:
   la scheda dichiarava uno scarto in più della tabella, e lo scarto in più era il conto
   delle omesse. */
const VOCI = '.hsv span:not(.nq):not(.neu)';
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
  /* Una sola coppia di regole: se qualcuno ne aggiunge un'altra, il confine si sdoppia.
     Si contano le regole che COMMUTANO, cioè quelle che dichiarano display — non ogni
     citazione delle due classi. Fino al 22 agosto 2026 questa prova contava le citazioni,
     e cadeva appena una delle due forme riceveva una regola di aspetto: è successo con
     «#kn26 .hstab tr.off .ist{text-decoration:line-through}», che con la commutazione non
     c'entra niente. L'attesa era troppo larga rispetto a ciò che voleva difendere. */
  const commuta = (cl) => (css.replace(/\/\*[\s\S]*?\*\//g,'').match(/[^{}]+\{[^{}]*\}/g) || [])
    .filter(r => r.indexOf(cl) >= 0 && /display\s*:/.test(r.split('{')[1])).length;
  esito(commuta('.hstab') === 2 && commuta('.hsch') === 2,
    'la commutazione avviene in un punto solo, non in due',
    'hstab ' + commuta('.hstab') + ' · hsch ' + commuta('.hsch'));

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
    const dallaScheda = [].slice.call(card.querySelectorAll(VOCI))
      .map(s => s.querySelector('em').textContent + ' ' + s.querySelector('s').textContent).sort();
    if (JSON.stringify(dallaTabella) !== JSON.stringify(dallaScheda))
      divergenti.push(nome + ': tabella ' + JSON.stringify(dallaTabella) + ' scheda ' + JSON.stringify(dallaScheda));
  });
  esito(divergenti.length === 0,
    'per ogni istituto gli scarti da 0,8 in su sono gli stessi nelle due forme',
    divergenti.slice(0,2).join(' || '));

  /* la scheda tiene solo quelli che contano: se prendesse tutto sarebbe la tabella */
  const totCelle = tab2.querySelectorAll('tbody td.s').length;
  const totVoci = sch2.querySelectorAll(VOCI).length;
  esito(totVoci > 0 && totVoci < totCelle,
    'la scheda porta gli scarti che contano, non tutte le celle', totVoci + ' su ' + totCelle);

  /* ══ 5 · nessun valore usa --coal né --neg, e il testo non porta più nessuna tinta ══ */
  const reso = box2.innerHTML;
  esito(!/var\(--coal\)/.test(reso),
    'nessun valore dell\'house effect è dipinto in --coal, che altrove è il Blocco Netanyahu',
    (reso.match(/[^"]{0,40}var\(--coal\)/) || [''])[0]);
  esito(!/var\(--neg\)/.test(reso),
    'né in --neg, che altrove è «ha perso seggi» e «errore»',
    (reso.match(/[^"]{0,40}var\(--neg\)/) || [''])[0]);
  esito(!/var\(--pos\)/.test(reso), 'né in --pos: il segno qui non è un giudizio');
  /* Il testo dei valori è tutto --ink, senza eccezioni: l'attenuazione --mute sotto 0,8
     diceva «questa non conta» nella STESSA modalità in cui adesso lo dice il neutro della
     scala, ed era il duplicato vero. Toglierla porta 42 celle da 5,24 a 17,82 in chiaro. */
  const conStile = [].slice.call(tab2.querySelectorAll('tbody td.s'))
    .filter(td => td.getAttribute('style'));
  esito(conStile.length === 0,
    'nessuna cella di valore porta stile in linea: il gradino è una classe, il resto lo fa il foglio',
    conStile.slice(0,3).map(td => td.getAttribute('style')).join(' | '));
  /* solo le celle di VALORE: nella prima colonna --mute colora ancora il tipo di
     rilevazione accanto al nome dell'istituto, ed è un'etichetta, non uno scarto */
  const valoriMuti = [].slice.call(tab2.querySelectorAll('tbody td.s'))
    .filter(td => /--mute/.test(td.innerHTML) || /--mute/.test(td.getAttribute('style') || ''));
  esito(valoriMuti.length === 0,
    'e nessun valore è più attenuato in --mute: lo dice il neutro, e nella stessa modalità',
    String(valoriMuti.length));
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
  const vociNeg = [].slice.call(sch2.querySelectorAll(VOCI + ' s'))
    .filter(s2 => /^[-−]/.test(s2.textContent.trim()));
  esito(vociNeg.length > 0 && vociNeg.every(s2 => /^−/.test(s2.textContent.trim())),
    'e lo stesso segno nelle schede, che sono la seconda strada per lo stesso valore',
    String(vociNeg.length));

  /* ══ 5b · la scala divergente sul fondo della cella ══
   *
   * Il segno da solo si legge, ma su 88 celle scandirlo è faticoso. La risposta NON è una
   * coppia di tinte contrapposte: due tinte opposte dicono DUE CATEGORIE, mentre qui c'è
   * una grandezza continua che attraversa lo zero, e +0,3 e −0,3 devono somigliarsi. Una
   * DIVERGENTE è la risposta a quell'obiezione, non il contrario: è un continuo che passa
   * per un neutro, e i valori vicini allo zero finiscono entrambi accanto al neutro.
   * Il neutro è il fondo della cella, così le celle che non contano sembrano non toccate.
   *
   * Prima qui c'era un trattino di lunghezza fissa spostato dal centro. Non funzionava, e
   * il modo in cui non funzionava vale più della regola nuova: stava SOTTO il numero, e i
   * valori sotto 0,1 scrivono «—» DENTRO la cella — due segni orizzontali della stessa
   * famiglia a tredici pixel di distanza. Trovato guardando lo scatto, con queste prove
   * tutte verdi. */
  const celle = [].slice.call(tab2.querySelectorAll('tbody td.s'));
  const GRAD = ['p1','p2','m1','m2'];
  const gradDi = td => GRAD.find(g => td.classList.contains(g)) || '';
  /* un gradino solo per cella: due classi insieme vorrebbero dire due fondi in conflitto */
  esito(celle.every(td => GRAD.filter(g => td.classList.contains(g)).length <= 1),
    'ogni cella porta al più un gradino: non ci sono fondi in conflitto',
    celle.filter(td => GRAD.filter(g => td.classList.contains(g)).length > 1).length + ' con due');
  /* IL LEGAME CHE CONTA: le tre soglie che governano la scala sono le stesse che
     governano il grassetto e l'ingresso nella scheda. grad() chiama forte() e grosso(),
     non le riscrive — qui si prova che il risultato coincida davvero col valore reso. */
  const sbagliate = celle.filter(function(td){
    const v = num(td.textContent), a = Math.abs(v);
    const atteso = a < 0.8 ? '' : (v > 0 ? 'p' : 'm') + (a >= 1.5 ? 2 : 1);
    return gradDi(td) !== atteso;
  });
  esito(sbagliate.length === 0,
    'il gradino segue le soglie che c\'erano già: neutro sotto 0,8, poi 0,8-1,5 e da 1,5 in su',
    sbagliate.slice(0,3).map(td => '«' + td.textContent.trim() + '» → ' + (gradDi(td) || 'neutro')).join(' | '));
  /* e concorda col segno scritto: sono due strade per la stessa direzione */
  const discordi = celle.filter(function(td){
    const g = gradDi(td); if (!g) return false;
    const t = td.textContent.trim();
    return g[0] === 'p' ? !/^\+/.test(t) : !/^−/.test(t);
  });
  esito(discordi.length === 0,
    'e il verso del gradino concorda sempre col segno scritto nella cella',
    discordi.slice(0,3).map(td => td.className + ' → ' + td.textContent.trim()).join(' | '));
  /* il neutro esiste davvero, o la divergente sarebbe due categorie travestite */
  const neutre = celle.filter(td => !gradDi(td));
  esito(neutre.length > 0 && neutre.length < celle.length,
    'il neutro non è vuoto e non è tutto: le celle che non contano sembrano non toccate',
    neutre.length + ' neutre su ' + celle.length);
  /* le due parti esistono tutte e due, o la prova girerebbe a vuoto */
  esito(celle.some(td => gradDi(td)[0] === 'p') && celle.some(td => gradDi(td)[0] === 'm'),
    'e sono rappresentate tutte e due le direzioni');

  /* Le regole: il fondo sta nel FONDO, il testo resta --ink, il grassetto sta sulle due
     classi del gradino 2 — cioè sulla stessa soglia dell'1,5, non su una copia sua. */
  const rGrad = g => (css.match(new RegExp('#kn26 \\.hstab td\\.' + g + '\\{[^}]*\\}')) || [''])[0];
  GRAD.forEach(function(g){
    const r = rGrad(g);
    esito(/background:var\(--sc-/.test(r), 'il gradino .' + g + ' colora il FONDO, non il testo', r);
    esito(!/(^|;)color:/.test(r), 'e non tocca il colore del testo, che resta --ink', r);
  });
  esito(/font-weight:700/.test(rGrad('p2')) && /font-weight:700/.test(rGrad('m2')),
    'il grassetto sta sui due gradini da 1,5 in su: una soglia sola, non una copia');
  esito(!/font-weight/.test(rGrad('p1')) && !/font-weight/.test(rGrad('m1')),
    'e non sui gradini 0,8-1,5');
  const rCella = (css.match(/#kn26 \.hstab td\.s\{[^}]*\}/) || [''])[0];
  esito(/font-weight:400/.test(rCella),
    'la cella parte a 400: «#kn26 td.s{font-weight:700}» è globale e va disfatto qui, o il '
    + 'grassetto sarebbe ovunque', rCella);
  esito(!/padding|width|margin|position/.test(rCella),
    'e la scala non costa un pixel: né larghezza né verticale, al contrario del trattino '
    + 'che portava 13px di padding-bottom per riga', rCella);

  /* ══ 5b-bis · la scala si misura, e le tre cose misurate sono dichiarate qui ══
   *
   * 1. IL CONTRASTO. Il colore sta nel fondo e il testo resta --ink: su ogni gradino, nei
   *    due temi, deve reggere 4,5. È l'invariante che permette la scala.
   * 2. LA SIMMETRIA IN LUMINANZA. I gradini speculari hanno la stessa L: è ciò che rende
   *    i passi uguali dalle due parti, e insieme è la RAGIONE per cui in bianco e nero la
   *    direzione collassa. Le due cose sono la stessa cosa, quindi si provano insieme.
   * 3. IL COLLASSO IN GRIGIO è dichiarato, non scoperto: due gradini speculari sono lo
   *    stesso grigio, e a portare la direzione resta il segno. */
  [['chiaro', CH], ['scuro', SC]].forEach(function(t){
    const nome = t[0], V = t[1];
    GRAD.forEach(function(g){
      const tinta = V['sc-' + g];
      esito(!!tinta, 'tema ' + nome + ': il gradino --sc-' + g + ' è dichiarato nella tavolozza', tinta);
      if (!tinta) return;
      const r = rap(V.ink, tinta);
      esito(r >= 4.5, 'tema ' + nome + ': --ink sul gradino ' + g + ' regge 4,5', r.toFixed(2));
    });
    /* speculari: stessa luminanza a meno del 3%, che è l'arrotondamento a 8 bit */
    [['p1','m1'], ['p2','m2']].forEach(function(c){
      const r = rap(V['sc-' + c[0]], V['sc-' + c[1]]);
      esito(r <= 1.03,
        'tema ' + nome + ': i gradini ' + c[0] + ' e ' + c[1] + ' hanno la stessa luminanza — '
        + 'passi uguali dalle due parti, e in bianco e nero lo stesso grigio', r.toFixed(3));
    });
    /* e i due gradini di una stessa parte si distinguono fra loro e dal neutro, che è
       quel che sopravvive alla scala grigia: la divergente diventa una sequenziale */
    ['p','m'].forEach(function(v){
      const a = lum(rgb(V['sc-' + v + '1'])), b = lum(rgb(V['sc-' + v + '2'])), n = lum(rgb(V.card));
      esito(Math.abs(a - n) > 0.004 && Math.abs(b - a) > 0.004,
        'tema ' + nome + ': sul lato ' + v + ' neutro, gradino 1 e gradino 2 restano tre luminanze diverse',
        [n, a, b].map(x => x.toFixed(4)).join(' → '));
    });
    /* il neutro è il fondo della cella e nient'altro: se un giorno qualcuno gli desse una
       tinta, le celle vicine allo zero smetterebbero di sembrare non toccate */
    esito(!/#kn26 \.hstab td\.s\{[^}]*background/.test(css),
      'tema ' + nome + ': il neutro non è dipinto, è il fondo della cella');
  });
  /* L'AZZURRO È OCCUPATO DUE VOLTE, e questa è la ragione per cui la scala è oro e viola.
     Non «nella tavolozza non restano tinte libere»: le SUPERFICI NEUTRE della pagina sono
     già il blu della coalizione — --wash chiaro a H 261,8°, --card scuro a H 263,4°,
     --coal a 262,2°, --acc a 262,9°. Un gradino azzurro disterebbe ΔE 3,91 da --wash,
     meno di quanto --wash disti da --card (4,08): non sarebbe un colore, sarebbe la
     superficie secondaria della pagina.
     Qui si prova la conseguenza verificabile senza colorimetria: che nessuno dei quattro
     gradini sia uno dei token che significano altro. */
  [['chiaro', CH], ['scuro', SC]].forEach(function(t){
    const V = t[1];
    const presi = ['coal','oppo','arab','inc','acc','pos','neg','wash','card','hair','hair2']
      .map(k => (V[k] || '').toUpperCase());
    const collisi = GRAD.filter(g => presi.indexOf((V['sc-' + g] || '').toUpperCase()) >= 0);
    esito(collisi.length === 0,
      'tema ' + t[0] + ': nessun gradino coincide con un token che significa altro',
      collisi.join(' '));
  });

  /* ══ 5b-ter · il passaggio del puntatore, che il fondo colorato coprirebbe ══
   *
   * «#kn26 tbody tr:hover{background:var(--wash)}» mette un fondo sulla RIGA; i fondi
   * della scala stanno sulle CELLE e ci vanno sopra. Su 46 celle di 88 il passaggio non
   * lascerebbe traccia e la riga si accenderebbe a strisce. Qui cambia canale: due filetti
   * orizzontali invece di una velatura. */
  const rHov = (css.match(/#kn26 \.hstab tbody tr:hover\{[^}]*\}/) || [''])[0];
  const rHovTd = (css.match(/#kn26 \.hstab tbody tr:hover td\{[^}]*\}/) || [''])[0];
  const rHovSep = (css.match(/#kn26 \.hstab tbody tr:hover td\.sep\{[^}]*\}/) || [''])[0];
  esito(/background:transparent/.test(rHov),
    'sotto la tabella dell\'house effect il passaggio non usa più un fondo di riga', rHov);
  esito(/inset 0 1px 0/.test(rHovTd) && /inset 0 -1px 0/.test(rHovTd),
    'lo dicono due filetti orizzontali, sopra e sotto la riga', rHovTd);
  esito(/inset 1px 0 0/.test(rHovSep) && /inset 2px 0 0/.test(rHovSep),
    'e sulla cella di confine la regola è combinata, o il filetto del blocco verrebbe '
    + 'cancellato: box-shadow è la stessa proprietà', rHovSep);

  /* ══ 5c · i filetti fra i blocchi, dettati dall'anagrafica ══
   *
   * Le colonne erano già in ordine di blocco e nessuno lo diceva. I confini NON sono
   * posizioni cablate: si ricavano da P[i].b, quindi l'8 settembre si spostano da soli.
   * Oggi i confini sono DUE e non tre, e vale la pena dire perché: le quattro liste
   * «incerto» non hanno abbastanza rilevazioni per comparire, e Yisrael Beitenu — che
   * sta dopo di loro nell'ordine — è dichiarato «opposizione». Chi avesse cablato tre
   * posizioni avrebbe disegnato una linea in mezzo all'opposizione. */
  const intest = [].slice.call(tab2.querySelectorAll('thead th'));
  const liste = intest.slice(2).map(th => th.getAttribute('title'));
  const perNome = {};
  Object.keys(A.P ? A.P : {}).forEach(function(k){ perNome[A.P[k].n] = A.P[k].b; });
  const blocchi = liste.map(n => perNome[n]);
  esito(blocchi.every(Boolean),
    'ogni colonna della tabella si riconosce nell\'anagrafica', blocchi.join(' '));
  /* i confini attesi, calcolati dall'anagrafica e non scritti a mano */
  const attesi = liste.filter((n, i) => i > 0 && blocchi[i] !== blocchi[i-1]);
  const resi = intest.filter(th => th.classList.contains('sep')).map(th => th.getAttribute('title'));
  esito(resi.join('|') === attesi.join('|'),
    'i filetti cadono esattamente dove cambia il blocco, e in nessun altro punto',
    'attesi ' + (attesi.join(', ') || '(nessuno)') + ' · resi ' + (resi.join(', ') || '(nessuno)'));
  esito(attesi.length >= 2,
    'e i blocchi rappresentati in tabella sono più di due, altrimenti la prova gira a vuoto',
    [...new Set(blocchi)].join(', '));
  /* la stessa classe deve scendere su tutta la colonna, o il filetto è spezzato */
  attesi.forEach(function(n){
    const i = liste.indexOf(n) + 2;
    const colonna = [].slice.call(tab2.querySelectorAll('tbody tr')).map(tr => tr.children[i]);
    esito(colonna.every(td => td && td.classList.contains('sep')),
      'il filetto di «' + n + '» scende su tutte le righe, non solo sull\'intestazione',
      colonna.filter(td => !td || !td.classList.contains('sep')).length + ' righe scoperte');
  });
  /* il costo in larghezza: due ombre interne per confine, e nient'altro.
     La misura vera è su browser — con border-left la larghezza minima passava da 941,8 a
     943,8, contro il tetto di 944,8 oltre il quale la soglia dei 1075 si muoverebbe — e
     jsdom non fa layout. Qui si prova la CAUSA: che non venga aggiunta nessuna geometria.

     E IL FILETTO È A DUE TINTE, come l'alone della sparkline, la linea della maggioranza
     nell'emiciclo e l'anello degli istogrammi. Non è un vezzo: la scala divergente SPEGNE
     il filetto a una tinta sola. Misurato, il contrasto di luminanza di --hair sopra i
     cinque fondi: 1,24 sul neutro, ma 1,06 e 1,05 sui gradini 1 in chiaro e 1,00 e 1,00
     in scuro — la stessa identica luminanza del fondo, su 27 celle. Sarebbe una
     riparazione che ne rompe un'altra in silenzio, ed è già successo col pulsante
     dell'istituto escluso. Con --card sotto, il minimo del migliore dei due è 1,17 in
     chiaro e 1,26 in scuro, contro l'1,24 e 1,26 che il filetto ha sul neutro. */
  const rSep = (css.match(/#kn26 \.hstab \.sep\{[^}]*\}/) || [''])[0];
  esito(/box-shadow:inset 1px/.test(rSep),
    'il filetto è un\'ombra interna da 1px, che non partecipa al layout', rSep.trim());
  esito(!/border/.test(rSep),
    'e NON un bordo: con border-left la larghezza minima passava da 941,8 a 943,8 e il ' +
    'margine sulla soglia da 6,2 a 4,2px', rSep.trim());
  esito(/inset 1px 0 0 var\(--hair\)/.test(rSep) && /inset 2px 0 0 var\(--card\)/.test(rSep),
    'ed è a due tinte, --hair sopra e --card sotto: da solo --hair sparirebbe sui gradini 1, '
    + 'dove in tema scuro ha esattamente la luminanza del fondo', rSep.trim());
  esito(rSep.indexOf('--hair') < rSep.indexOf('--card'),
    'e --hair viene per primo, perché nel box-shadow la prima ombra sta SOPRA: invertirle '
    + 'darebbe due pixel di --card e nessun filetto', rSep.trim());
  /* le due tinte devono davvero coprirsi a vicenda: su ogni fondo, in ogni tema, almeno
     una delle due si stacca dal fondo su cui cade */
  [['chiaro', CH], ['scuro', SC]].forEach(function(t){
    const V = t[1];
    const fondi = [V.card, V['sc-p1'], V['sc-p2'], V['sc-m1'], V['sc-m2']];
    const deboli = fondi.filter(f => Math.max(rap(V.hair, f), rap(V.card, f)) < 1.15);
    esito(deboli.length === 0,
      'tema ' + t[0] + ': su ogni gradino almeno una delle due tinte del filetto si stacca',
      fondi.map(f => Math.max(rap(V.hair, f), rap(V.card, f)).toFixed(2)).join(' '));
  });

  /* ══ 5d · la scala anche nelle schede, e la pastiglia che le dà lo zero ══
   *
   * La prima obiezione era giusta: dentro una scheda entrano SOLO gli scarti da 0,8 in su,
   * quindi non ci sarebbe nemmeno una voce neutra, e una divergente senza centro torna a
   * essere due tinte su due categorie — la cosa che la divergente esiste per non essere.
   * Il centro glielo dà una pastiglia in coda, «altre 4 · sotto 0,8», che è anche il posto
   * giusto: l'elenco è ordinato per grandezza decrescente e lo zero ne è la continuazione.
   *
   * Costo misurato su browser a 380px: le schede passano da 1225,4 a 1317,9px, +7,5%.
   * Le alternative costavano il 45% (tutte le voci: 1780,1px) e il 43% (soglia a 0,1:
   * 1749,3px, e solo 2 celle su 88 stanno sotto 0,1, quindi non compra nemmeno il neutro).
   *
   * E il fondo è LO STESSO della tabella: la pastiglia sta su --card, non su --wash come
   * la scheda che la contiene. Le due forme usano le stesse quattro tinte e lo stesso
   * neutro — una strada sola. Le prove qui sotto lo legano. */
  const cartePiene = [].slice.call(sch2.querySelectorAll('.hs'))
    .filter(c => c.querySelectorAll(VOCI).length > 0);
  esito(cartePiene.length > 0, 'ci sono schede con voci da misurare', String(cartePiene.length));
  /* la pastiglia neutra c'è, ed è una sola per scheda */
  const senzaNeutra = cartePiene.filter(c =>
    c.querySelectorAll(VOCI).length < cols.length && !c.querySelector('.hsv .neu'));
  esito(senzaNeutra.length === 0,
    'ogni scheda che omette qualcosa lo dichiara con la pastiglia neutra: la scala ha il suo zero',
    senzaNeutra.map(c => c.querySelector('.hsh b').textContent).join(', '));
  const doppie = cartePiene.filter(c => c.querySelectorAll('.hsv .neu').length > 1);
  esito(doppie.length === 0, 'e ce n\'è una sola per scheda', String(doppie.length));
  /* il conto della pastiglia neutra deve tornare con la tabella: è la stessa grandezza
     letta da due parti, quindi è una strada doppia e va legata */
  const contiSbagliati = [];
  [].slice.call(sch2.querySelectorAll('.hs')).forEach(function(c){
    const nome = c.querySelector('.hsh b').textContent;
    const neu = c.querySelector('.hsv .neu');
    if (!neu) return;
    const dichiarato = parseInt(neu.querySelector('em').textContent.replace(/\D+/g,''), 10);
    const riga = [].slice.call(tab2.querySelectorAll('tbody tr'))
      .find(tr => tr.children[0].querySelector('button').dataset.escl === nome);
    const deboli = [].slice.call(riga.children).slice(2)
      .filter(td => Math.abs(num(td.textContent)) < 0.8).length;
    if (dichiarato !== deboli) contiSbagliati.push(nome + ': scheda ' + dichiarato + ' tabella ' + deboli);
  });
  esito(contiSbagliati.length === 0,
    'e il conto delle omesse coincide con le celle neutre della tabella, riga per riga',
    contiSbagliati.slice(0,3).join(' | '));
  /* l'accordo passa da acc(), non da una terza copia scritta a mano: «1 giorni» è già
     costato una volta */
  const accordi = [].slice.call(sch2.querySelectorAll('.hsv .neu em'))
    .filter(em => { const n = parseInt(em.textContent.replace(/\D+/g,''), 10);
      return n === 1 ? !/^altra /.test(em.textContent) : !/^altre /.test(em.textContent); });
  esito(accordi.length === 0, 'e l\'accordo di numero è quello di acc(), non una copia',
    accordi.map(e2 => e2.textContent).slice(0,3).join(' | '));
  /* la pastiglia neutra NON è colorata: è lei lo zero */
  const neutreTinte = [].slice.call(sch2.querySelectorAll('.hsv .neu'))
    .filter(n => GRAD.some(g => n.classList.contains(g)));
  esito(neutreTinte.length === 0, 'la pastiglia neutra non porta gradino: è il neutro, non un valore');

  /* le voci portano il gradino, e lo stesso della cella corrispondente della tabella */
  const divergenti2 = [];
  [].slice.call(sch2.querySelectorAll('.hs')).forEach(function(c){
    const nome = c.querySelector('.hsh b').textContent;
    const riga = [].slice.call(tab2.querySelectorAll('tbody tr'))
      .find(tr => tr.children[0].querySelector('button').dataset.escl === nome);
    [].slice.call(c.querySelectorAll(VOCI)).forEach(function(v){
      const lista = v.querySelector('em').textContent;
      const i = cols.indexOf(lista);
      const cella = riga.children[i + 2];
      const gS = GRAD.find(g => v.classList.contains(g)) || '';
      const gT = GRAD.find(g => cella.classList.contains(g)) || '';
      if (gS !== gT) divergenti2.push(nome + '/' + lista + ': scheda ' + (gS||'neutro') + ' tabella ' + (gT||'neutro'));
    });
  });
  esito(divergenti2.length === 0,
    'ogni voce della scheda porta lo stesso gradino della sua cella in tabella: una strada sola',
    divergenti2.slice(0,3).join(' | '));
  /* e nessuna voce è neutra, che è precisamente la ragione per cui la pastiglia serve */
  const vociNeutre2 = [].slice.call(sch2.querySelectorAll(VOCI))
    .filter(v => !GRAD.some(g => v.classList.contains(g)));
  esito(vociNeutre2.length === 0,
    'nessuna voce della scheda è neutra — ecco perché il centro deve arrivare dalla pastiglia',
    String(vociNeutre2.length));
  /* la pastiglia sta su --card come la cella della tabella: è ciò che rende le tinte
     riusabili senza una seconda serie */
  const fondoVoce0 = (css.match(/#kn26 \.hsv span\{[^}]*\}/) || [''])[0];
  esito(/background:var\(--card\)/.test(fondoVoce0),
    'la pastiglia sta su --card, lo stesso neutro della tabella: una serie di tinte sola',
    fondoVoce0.slice(0,80));
  /* il bordo del gradino 1 è il gradino 2 del suo lato: senza, --hair sparisce là sopra
     (1,06 e 1,05 in chiaro, 1,00 e 1,00 in scuro) proprio come spariva il filetto */
  const rP1 = (css.match(/#kn26 \.hsv \.p1\{[^}]*\}/) || [''])[0];
  const rM1 = (css.match(/#kn26 \.hsv \.m1\{[^}]*\}/) || [''])[0];
  esito(/border-color:var\(--sc-p2\)/.test(rP1) && /border-color:var\(--sc-m2\)/.test(rM1),
    'il bordo del gradino 1 è il gradino 2 del suo stesso lato, o il filo sparisce sul colore',
    rP1 + ' · ' + rM1);
  [['chiaro', CH], ['scuro', SC]].forEach(function(t){
    const V = t[1];
    ['p', 'm'].forEach(function(v){
      const r = rap(V['sc-' + v + '2'], V['sc-' + v + '1']);
      esito(r >= 1.2,
        'tema ' + t[0] + ': il bordo del gradino ' + v + '1 si stacca dal suo riempimento',
        r.toFixed(2));
    });
    /* e il testo sulla pastiglia colorata regge, come nella cella */
    GRAD.forEach(function(g){
      const r = rap(V.ink, V['sc-' + g]);
      esito(r >= 4.5, 'tema ' + t[0] + ': --ink sulla pastiglia ' + g + ' regge 4,5', r.toFixed(2));
    });
    /* la pastiglia neutra è in --mute, che è un colore e non un'alfa: --wash non c'entra,
       lei sta su --card */
    esito(rap(V.mute, V.card) >= 4.5,
      'tema ' + t[0] + ': il testo della pastiglia neutra (--mute su --card) regge 4,5',
      rap(V.mute, V.card).toFixed(2));
  });
  /* il grassetto viene dal gradino, non da una classe .f sua: era la stessa soglia
     dell'1,5 scritta in due posti */
  esito(!/class="f"/.test(sch2.innerHTML) && !/\.hsv s\.f/.test(css),
    'il grassetto della scheda viene da .p2/.m2, non da una classe .f: una soglia sola');
  const grassiS = (css.match(/#kn26 \.hsv \.p2 s,#kn26 \.hsv \.m2 s\{[^}]*\}/) || [''])[0];
  esito(/font-weight:700/.test(grassiS), 'e sta sui due gradini da 1,5 in su', grassiS);
  /* le schede continuano a NON portare i filetti: quelli dicono il confine fra blocchi,
     e la scheda i blocchi non li raggruppa affatto */
  esito(!/class="[^"]*\bsep\b/.test(sch2.innerHTML),
    'le schede non portano filetti: lì i blocchi non sono raggruppati, quindi non c\'è confine');
  const vociS = [].slice.call(sch2.querySelectorAll(VOCI));
  esito(vociS.length > 0 && vociS.every(v => /[+−]\d/.test(v.textContent) && v.querySelector('em')),
    'e ogni voce continua a portare il nome della lista accanto al suo scarto',
    vociS.length + ' voci');
  /* e restano ordinate per grandezza: è quello che nella tabella fa il grassetto */
  const perScheda = [].slice.call(sch2.querySelectorAll('.hs')).map(function(c){
    return [].map.call(c.querySelectorAll(VOCI + ' s'), s2 => Math.abs(num(s2.textContent)));
  });
  esito(perScheda.every(v => v.every((x,i) => i === 0 || v[i-1] >= x - 0.001)),
    'e ordinate per grandezza decrescente, che è il canale che la scheda usa al posto della griglia',
    perScheda.map(v => v.join('>')).slice(0,2).join(' | '));

  /* ══ 5e · il comando: dice l'azione, e nomina l'istituto ══
   *
   * Diceva «incluso», cioè lo STATO — che è già detto dal barrato sul nome e dal pulsante
   * in --neg — e non diceva a nessuno che cosa sarebbe successo premendolo. E otto pulsanti
   * con lo stesso nome accessibile sono indistinguibili in un elenco di comandi: è la
   * lezione dei quattro «Scarica PNG» e dei bersagli dei marcatori.
   * «Includi» e non «Reinserisci» è una MISURA: la tabella ha 941,8px di minimo contro un
   * contenitore che alla soglia dei 1075 vale 948. Con «Escludi/Reinserisci» il minimo sale
   * a 959,3 — undici pixel oltre il contenitore — e la soglia andrebbe rifatta a ~1090.
   * Con «Escludi/Includi» scende a 939,4. Misurato su browser clonando la tabella DENTRO
   * #kn26: fuori non eredita le regole «#kn26 …» e la misura dà 701,7, che è falsa. */
  const comandi = [].slice.call(box2.querySelectorAll('button[data-escl].mini'));
  esito(comandi.length > 0, 'i comandi ci sono', String(comandi.length));
  esito(comandi.every(b => /^(Escludi|Includi)$/.test(b.textContent.trim())),
    'il pulsante dice l\'azione, non lo stato',
    [...new Set(comandi.map(b => b.textContent.trim()))].join(' '));
  esito(!/>(incluso|escluso)</.test(box2.innerHTML),
    'e «incluso»/«escluso» non compaiono più come testo di un comando');
  esito(comandi.every(b => !/Reinserisci/.test(b.textContent + (b.getAttribute('aria-label')||''))),
    'né «Reinserisci», che costerebbe 17,5px di larghezza minima e sposterebbe la soglia dei 1075');
  /* il nome accessibile nomina l'istituto, e CONTIENE il testo visibile (WCAG 2.5.3) */
  const senzaNome = comandi.filter(b => {
    const a = b.getAttribute('aria-label') || '';
    return a.indexOf(b.dataset.escl) < 0 || a.indexOf(b.textContent.trim()) !== 0;
  });
  esito(senzaNome.length === 0,
    'ogni comando nomina il suo istituto, e il nome accessibile comincia col testo visibile',
    senzaNome.slice(0,3).map(b => b.getAttribute('aria-label')).join(' | '));
  /* I comandi sono sedici e non otto: ogni istituto ne ha uno nella tabella e uno nella
     scheda, e le due forme non sono mai visibili insieme. Quindi la proprietà non è «nomi
     tutti diversi» — sarebbe falsa — ma «tanti nomi distinti quanti sono gli istituti»:
     è quella che dice che in un elenco di comandi si distinguono. */
  const nomiDistinti = new Set(comandi.map(b => b.getAttribute('aria-label'))).size;
  const istDistinti = new Set(comandi.map(b => b.dataset.escl)).size;
  esito(nomiDistinti === istDistinti && istDistinti > 1,
    'e i nomi distinti sono tanti quanti gli istituti: in un elenco di comandi si distinguono',
    nomiDistinti + ' nomi · ' + istDistinti + ' istituti · ' + comandi.length + ' pulsanti nelle due forme');
  /* title e aria-label sono la STESSA stringa, nata una volta sola: è la lezione di ETI */
  const divergono = comandi.filter(b => b.getAttribute('title') !== b.getAttribute('aria-label'));
  esito(divergono.length === 0,
    'title e aria-label sono la stessa stringa: una strada sola, come ETI nei marcatori',
    divergono.slice(0,2).map(b => b.getAttribute('title') + ' ≠ ' + b.getAttribute('aria-label')).join(' | '));
  /* NIENTE aria-pressed dove il nome dichiara l'azione: direbbe il contrario di quel che si legge */
  esito(comandi.every(b => !b.hasAttribute('aria-pressed')),
    'e nessuno porta aria-pressed: il nome dice già l\'azione, il cambio di nome È il riscontro');

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
