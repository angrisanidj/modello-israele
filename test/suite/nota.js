/* Le tabelle della nota metodologica, e la data nella testata.
 *
 * Due sforamenti diversi che condividono una sola conseguenza: a 380 il documento
 * scorreva in orizzontale. Erano gli ultimi due, dopo l'house effect.
 *
 * 1. LE QUATTRO TABELLE DI #k-metodo. La larghezza non era del contenuto: gliela dava il
 *    white-space:nowrap GLOBALE delle celle, scritto per l'archivio e per l'house effect
 *    — dove le colonne sono numeri e andare a capo sarebbe un difetto — ed ereditato da
 *    quattro tabelle di prosa che non ne hanno mai avuto bisogno. Misurato su browser a
 *    380, contenitore #k-foot da 326px:
 *
 *      Liste che si muovono insieme    3 col.   528,0   →  175 di sforamento del documento
 *      Il modello alla prova           5 col.   427,9   →   74,9
 *      Ancoraggi dello swing           4 col.   388,4   →   35,4
 *      Affluenza araba                 4 col.   381,8   →   28,8
 *
 *    Non si sommano: lo sforamento è un massimo. Andando a capo tornano tutte e quattro a
 *    326, cioè al contenitore.
 *
 *    E c'erano due difetti a 1265 che nessuno aveva registrato, perché la nota è chiusa
 *    per impostazione predefinita e lì va su due colonne da 515px: la tabella delle
 *    correlazioni, larga 528, sbordava nella gronda da 44 A QUALUNQUE larghezza a due
 *    colonne; e il backtest si spezzava fra le due colonne — testata orfana in fondo alla
 *    sinistra e corpo in cima alla destra, due frammenti alti 45,2 e 248,2. Il capo riga
 *    chiude il primo, break-inside:avoid il secondo.
 *
 * 2. LA DATA NELLA TESTATA. Non sforava «di 35px»: era già andata a capo quattro volte,
 *    una parola per riga, e gli 85,8px sono la larghezza della sola parola «AGGIORNATO».
 *    L'aritmetica della riga — 359,7 di contenuto più 44 di gap in 358 — dice che nemmeno
 *    azzerando i gap starebbe, quindi accorciare il testo spostava il problema invece di
 *    chiuderlo.
 *
 * QUEL CHE QUESTE PROVE NON DICONO, e va detto perché è la metà che conta. jsdom non fa
 * layout: non può misurare una larghezza resa, non sa che cosa sia una colonna di
 * multicolonna e non conta le righe di un testo. Le quattro proprietà che il rimedio
 * doveva ottenere — documento a 380 senza sforamento con la nota aperta e chiusa, nessuna
 * tabella oltre il contenitore alle tre larghezze, nessuna spezzata fra due colonne, la
 * data su una riga sola — sono misurate su browser vero e scritte nei commenti accanto
 * alle regole. Qui si prova la CAUSA: che la regola ci sia, che vinca su quella globale,
 * e che nessun'altra riga del foglio — nemmeno una scritta domani — torni a imporre il
 * nowrap dentro la nota. È la stessa divisione del lavoro dell'house effect: il confine è
 * provato come costante, la sua derivazione è misurata a mano.
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
eval(src);

const $ = i => D.getElementById(i);
const css = (html.match(/<style>([\s\S]*?)<\/style>/) || ['',''])[1];

/* ── il foglio, spogliato dei commenti e sciolto in regole ──
 * Le media query si appiattiscono, ma la loro condizione resta attaccata alla regola:
 * serve a distinguere una dichiarazione globale da una che vale solo sotto i 660. */
const pulito = css.replace(/\/\*[\s\S]*?\*\//g, '');
function regole(testo){
  const out = [];
  let i = 0;
  while (i < testo.length) {
    const apre = testo.indexOf('{', i);
    if (apre < 0) break;
    const testa = testo.slice(i, apre).trim();
    let d = 1, j = apre + 1;
    while (j < testo.length && d) { const c = testo[j]; if (c === '{') d++; else if (c === '}') d--; j++; }
    const corpo = testo.slice(apre + 1, j - 1);
    if (/^@media/.test(testa)) {
      const cond = testa.slice(6).replace(/\s+/g,'');
      for (const r of regole(corpo)) { r.media = r.media || cond; out.push(r); }
    } else if (testa[0] !== '@') {
      for (const sel of testa.split(',')) {
        const s = sel.trim();
        if (s) out.push({sel:s, decl:corpo, peso:peso(s), media:null});
      }
    }
    i = j;
  }
  return out;
}
/* Specificità, nella forma che questo foglio usa davvero: identificatori, classi e
   attributi, elementi. Nessun selettore qui ha pseudo-elementi da contare a parte. */
function peso(s){
  const id = (s.match(/#[\w-]+/g) || []).length;
  const cl = (s.match(/\.[\w-]+|\[[^\]]+\]|:[\w-]+(\([^)]*\))?/g) || []).length;
  const el = (s.replace(/[#.][\w-]+|\[[^\]]+\]|:[\w-]+(\([^)]*\))?/g,'').match(/[a-zA-Z][\w-]*/g) || []).length;
  return id * 10000 + cl * 100 + el;
}
const RG = regole(pulito);

setTimeout(function(){

  /* ══ 1 · le quattro tabelle esistono, e sono di prosa ══ */
  const foot = $('k-foot');
  const tab = [].slice.call(foot.querySelectorAll('table'));
  esito(tab.length === 4, 'la nota metodologica porta quattro tabelle', String(tab.length));

  /* Il criterio è quello che le rendeva larghe: una cella di PROSA, cioè con più parole
     dentro, tenuta su una riga sola da una regola pensata per le cifre. */
  const celle = [].slice.call(foot.querySelectorAll('td,th'));
  const prosa = celle.filter(c => c.textContent.trim().split(/\s+/).length >= 3);
  esito(prosa.length >= 20,
    'e dentro ci sono celle di prosa, non colonne di cifre: è la ragione dello sforamento',
    prosa.length + ' celle su ' + celle.length);
  const piuLunga = prosa.map(c => c.textContent.trim())
    .sort((a,b) => b.length - a.length)[0] || '';
  esito(piuLunga.length > 30, 'la peggiore è una frase intera, non un\'etichetta', piuLunga);

  /* ══ 2 · nessuna cella della nota resta inchiodata su una riga ══
   *
   * Non si guarda se la regola c'è: si guarda, cella per cella, quale dichiarazione
   * VINCE. Così vale anche per una regola scritta domani, che è il modo in cui questo
   * difetto è nato — una regola globale scritta per due tabelle che ne ha raggiunte sei. */
  function vince(el, prop){
    let migliore = null;
    RG.forEach(function(r){
      const m = new RegExp('(^|;)\\s*' + prop + '\\s*:\\s*([^;!]+)(!important)?').exec(r.decl);
      if (!m) return;
      let corr; try { corr = el.matches(r.sel); } catch(e) { return; }
      if (!corr) return;
      const imp = /!important/.test(r.decl.slice(m.index, m.index + m[0].length + 12));
      const chiave = (imp ? 1e9 : 0) + r.peso;
      if (!migliore || chiave >= migliore.chiave)
        migliore = {chiave:chiave, valore:m[2].trim(), sel:r.sel, media:r.media};
    });
    return migliore;
  }
  const inchiodate = celle.map(c => ({c:c, v:vince(c, 'white-space')}))
    .filter(x => x.v && /nowrap/.test(x.v.valore));
  esito(inchiodate.length === 0,
    'nessuna cella della nota è tenuta su una riga sola: vince white-space:normal',
    inchiodate.length ? inchiodate[0].v.sel + ' → ' + inchiodate[0].v.valore : '');
  const conNormale = celle.filter(c => { const v = vince(c, 'white-space'); return v && /normal/.test(v.valore); });
  esito(conNormale.length === celle.length,
    'e la dichiarazione che vince è esplicita su tutte, non un\'assenza',
    conNormale.length + '/' + celle.length);

  /* ══ 3 · il rimedio è circoscritto: l'archivio e l'house effect NON vanno a capo ══
   *
   * La regola globale non è stata tolta, è stata scavalcata dentro .foot. Se qualcuno la
   * togliesse, l'archivio — 22 colonne di cifre — comincerebbe ad andare a capo e queste
   * due prove cadrebbero. */
  const altrove = [].slice.call($('k-tab').querySelectorAll('td,th'))
    .concat([].slice.call($('k-house').querySelectorAll('td,th')));
  esito(altrove.length > 20, 'archivio e house effect hanno celle da controllare', String(altrove.length));
  const svincolate = altrove.filter(c => { const v = vince(c, 'white-space'); return !v || !/nowrap/.test(v.valore); });
  esito(svincolate.length === 0,
    'e continuano a stare su una riga: il capo riga vale nella nota, non dappertutto',
    svincolate.length + ' celle svincolate');

  /* ══ 4 · la rottura di colonna: il backtest si spezzava fra le due ══
   *
   * jsdom non sa che cosa sia una colonna di multicolonna, quindi qui si prova che la
   * dichiarazione ci sia e raggiunga tutte e quattro le tabelle. Che i frammenti siano
   * tornati uno è misurato su browser: da 2 (45,2 + 248,2) a 1 (262,9). */
  const spezzabili = tab.filter(t => { const v = vince(t, 'break-inside'); return !v || !/avoid/.test(v.valore); });
  esito(spezzabili.length === 0,
    'nessuna tabella della nota può spezzarsi fra le due colonne',
    spezzabili.length + ' su ' + tab.length);
  esito(RG.some(r => /\.foot table$/.test(r.sel) && /break-inside\s*:\s*avoid/.test(r.decl) && !r.media),
    'e la regola vale a ogni larghezza, non solo sotto una soglia');

  /* ══ 5 · il padding stretto sta dove il capo riga costa, e solo lì ══
   *
   * Il capo riga aggiunge 472px di verticale sulle quattro tabelle; il padding stretto ne
   * restituisce 186. Sopra i 660 non c'è niente da restituire, perché non vanno a capo. */
  const pad = RG.filter(r => /\.foot (td|th)$/.test(r.sel) && /padding\s*:/.test(r.decl));
  esito(pad.length > 0, 'il padding delle celle della nota è dichiarato', String(pad.length));
  esito(pad.every(r => r.media && /max-width:660px/.test(r.media)),
    'e solo sotto i 660: sopra, stringere le celle sarebbe soltanto più fitto',
    pad.map(r => r.media).join(' '));

  /* ══ 6 · lo spazio unificatore fra il valore e la sua distanza dal voto ══
   *
   * Da quando le celle vanno a capo, «+1,75 (62 gg)» potrebbe spezzarsi fra il numero e la
   * parentesi, e le due metà dicono qualcosa solo insieme. */
  const swing = tab.find(t => /Restringimento/.test(t.textContent));
  esito(!!swing, 'la tabella degli ancoraggi dello swing si riconosce dalla sua testata');
  if (swing) {
    /* jsdom rende l'entità: innerHTML restituisce «&nbsp;» dove il codice ha messo
       U+00A0. Si normalizza, o si prova la serializzazione invece del carattere. */
    const h = swing.innerHTML.replace(/&nbsp;/g, String.fromCharCode(0x00a0));
    esito((h.match(/\u00a0<small>/g) || []).length === 6,
      'tutti e sei i valori sono legati alla loro distanza dal voto da uno spazio unificatore',
      String((h.match(/\u00a0<small>/g) || []).length));
    esito(!/[ \t]<small>/.test(h),
      'e nessuno è legato da uno spazio normale, che si spezzerebbe');
  }

  /* ══ 7 · la data della testata va a capo invece di uscire dallo schermo ══
   *
   * Che stia su UNA riga è misurato su browser: 219,7px allineati a destra, testata da 62
   * a 77px a 380, identica a 760. Qui si prova che la riga possa andare a capo e che la
   * data resti dov'era — a destra — e soprattutto che non sia stata nascosta. */
  const upd = $('k-upd');
  esito(!!upd && upd.tagName === 'EM' && upd.closest('.brow'),
    'la data sta ancora nella testata, ed è la stessa <em> di prima');
  const wrap = vince(D.querySelector('#kn26 .brow'), 'flex-wrap');
  esito(wrap && /wrap/.test(wrap.valore) && !/nowrap/.test(wrap.valore),
    'la testata può mandare la data a capo: nemmeno azzerando i gap la riga starebbe',
    wrap ? wrap.valore : 'nessuna dichiarazione');
  const ml = vince(upd, 'margin-left');
  esito(ml && /auto/.test(ml.valore),
    'e la data resta allineata a destra sulla riga sua, dov\'era',
    ml ? ml.valore : 'nessuna dichiarazione');
  const disp = vince(upd, 'display');
  esito(!disp || !/none/.test(disp.valore),
    'e non è nascosta a nessuna larghezza: la testata è il primo posto in cui si guarda se il dato è fresco',
    disp ? disp.sel + ' → ' + disp.valore : '');
  esito(/\d/.test(upd.textContent) || upd.textContent === '—',
    'e continua a portare una data, non un segnaposto vuoto', upd.textContent);

  console.log('\nnota: ' + ok + '/' + (ok + ko));
  if (ko) process.exit(1);
}, 3000);
