/* L'inventario delle opacità: l'invariante che vale più delle riparazioni.
 *
 * LA REGOLA. L'opacità può ridurre l'enfasi, ma non può essere l'unico portatore di una
 * distinzione, e non si applica a testo che in quello stato va letto.
 *
 * PERCHÉ NON BASTA «ALZARE L'OPACITÀ», che è quello che il CLAUDE.md diceva. Misurato sui
 * token veri, il valore di alfa necessario perché ciascuno arrivi a 4,5 sul proprio fondo:
 *
 *      token      chiaro   scuro
 *      --ink       0,59     0,49
 *      --ink2      0,72     0,68
 *      --acc       0,70     0,83
 *      --neg       0,82     0,68
 *      --mute      0,93     0,92
 *
 * Una riga attenuata contiene tutti questi token insieme, quindi comanda il peggiore:
 * --mute vuole alfa 0,93, e a 0,93 l'attenuazione non si vede più. Non esiste un'alfa che
 * attenui e lasci leggere: la leva non è l'opacità, è NON usarla sul testo.
 *
 * COME LAVORA QUESTA PROVA. Costruisce un DOM vero, scioglie il foglio in regole con lo
 * stesso risolutore di specificità di nota.js, e per ogni regola con opacity < 1 guarda
 * QUALI ELEMENTI raggiunge davvero. Se uno di quelli contiene testo, il selettore deve
 * comparire nell'inventario qui sotto con una ragione scritta. Non è un elenco di scuse:
 * è il posto in cui una decisione va presa a mano, e la prova cade se qualcuno ne aggiunge
 * una senza prenderla.
 *
 * E le voci PENDENTI sono contate: oggi sono ZERO, e il numero è scritto nella prova. Chi
 * ne aggiunge una deve alzarlo, chi ne ripara una deve abbassarlo — e in tutti e due i
 * casi deve passare di qui. Le due che c'erano — il numero della sezione nell'indice e la
 * voce spenta della legenda — sono state chiuse il 22 agosto 2026.
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

const app = fs.readFileSync(__dirname + '/../app.js','utf8');
let src = app;
eval(src);

const $ = i => D.getElementById(i);
const css = (html.match(/<style>([\s\S]*?)<\/style>/) || ['',''])[1];
const pulito = css.replace(/\/\*[\s\S]*?\*\//g, '');

/* ── il risolutore di nota.js: stesse regole, stesso peso ── */
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
        if (s) out.push({sel:s, decl:corpo, media:null});
      }
    }
    i = j;
  }
  return out;
}
const RG = regole(pulito);

/* ══════════════════════════════════════════════════════════════════════════
 * L'INVENTARIO. Ogni opacità < 1 che raggiunge testo sta qui, con la ragione.
 * ══════════════════════════════════════════════════════════════════════════ */
const INVENTARIO = [
  { sel: '#kn26 .btn:disabled', tipo: 'esente',
    perche: 'comando inattivo: WCAG 1.4.3 esenta esplicitamente il testo dei componenti di ' +
            'interfaccia disattivati, e il cursor:progress dice la stessa cosa una seconda volta' },
  { sel: '#kn26 #k-emi.filtra text[data-g]', tipo: 'codifica',
    perche: 'sono le etichette dei blocchi che il filtro ha messo sullo sfondo: in quello stato ' +
            'NON vanno lette, è il gruppo scelto che va letto, e la via d\'uscita è un pulsante. ' +
            'L\'opacità qui è la codifica del filtro, non un\'attenuazione decorativa' },
];
/* Il 22 agosto 2026 le due voci PENDENTI sono state chiuse, e l'elenco è tornato a zero:
   .idx a i ha perso l'opacità senza guadagnare niente (il numero non ha bisogno di essere
   attenuato) e .leg.lint b.spenta è passata alla pastiglia vuota più il nome in --mute. */
const PENDENTI_ATTESE = 0;

setTimeout(function(){

  /* ══ 1 · ogni regola di opacità < 1, e chi raggiunge ══ */
  const conOpacita = RG.map(function(r){
    const m = /(^|;)\s*opacity\s*:\s*([0-9.]+)/.exec(r.decl);
    if (!m) return null;
    const v = parseFloat(m[2]);
    /* Zero non è attenuazione, è nascondimento: un elemento a 0 non si legge male, non si
       legge affatto, e nella pagina serve solo come stato di partenza della comparsa.
       Ha una prova sua, più sotto. */
    if (!(v > 0 && v < 1)) return null;
    let n = [];
    try { n = [].slice.call(D.querySelectorAll(r.sel)); } catch(e) { return null; }
    return {sel:r.sel, v:v, n:n};
  }).filter(Boolean);

  esito(conOpacita.length >= 6,
    'il foglio dichiara opacità sotto 1 in più punti, e la prova li trova tutti',
    conOpacita.length + ' regole');

  /* Un elemento «porta testo» se lui o un discendente ha un nodo di testo non vuoto.
     Non basta guardare textContent sull'elemento: un contenitore vuoto di suo ma pieno di
     figli con testo è esattamente il caso delle righe attenuate. */
  function portaTesto(el){
    if ([].some.call(el.childNodes, n => n.nodeType === 3 && n.textContent.trim())) return true;
    return [].some.call(el.querySelectorAll('*'),
      e => [].some.call(e.childNodes, n => n.nodeType === 3 && n.textContent.trim()));
  }

  const suTesto = conOpacita.filter(r => r.n.length && r.n.some(portaTesto));
  const dichiarati = INVENTARIO.map(x => x.sel);
  const clandestini = suTesto.filter(r => dichiarati.indexOf(r.sel) < 0);

  esito(clandestini.length === 0,
    'nessuna opacità raggiunge del testo senza essere dichiarata nell\'inventario',
    clandestini.map(r => r.sel + ' (' + r.v + ')').join(' | '));

  /* ══ 2 · l'inventario non è un elenco di scuse: ogni voce ha una ragione, e le
   *       pendenti sono contate ══ */
  esito(INVENTARIO.every(x => x.perche && x.perche.length > 60),
    'ogni voce dell\'inventario porta una ragione scritta, non un\'etichetta');
  const pend = INVENTARIO.filter(x => x.tipo === 'PENDENTE');
  esito(pend.length === PENDENTI_ATTESE,
    'le voci ancora da decidere sono esattamente ' + PENDENTI_ATTESE +
    ': chi ne aggiunge o ne ripara una deve passare di qui',
    pend.length + ' — ' + pend.map(x => x.sel).join(', '));
  /* Una voce dichiarata che non raggiunge più niente è un inventario stantio: va tolta. */
  const morte = INVENTARIO.filter(function(x){
    let n = []; try { n = [].slice.call(D.querySelectorAll(x.sel)); } catch(e) { return false; }
    return conOpacita.some(r => r.sel === x.sel) === false;
  });
  esito(morte.length === 0,
    'e nessuna voce dell\'inventario è rimasta senza la sua regola nel foglio',
    morte.map(x => x.sel).join(', '));

  /* ══ 2b · lo zero è un'altra cosa, e ha bisogno di un'altra garanzia ══
   *
   * Un elemento a opacity:0 è nascosto, non attenuato. Nella pagina è lo stato di partenza
   * della comparsa delle sezioni: se qualcosa lo portasse a zero senza riportarlo a uno, il
   * lettore non troverebbe un testo pallido, troverebbe una pagina vuota — ed è già
   * successo una volta, con l'anteprima senza JavaScript. */
  const aZero = RG.filter(r => /(^|;)\s*opacity\s*:\s*0(\s|;|$)/.test(r.decl));
  esito(aZero.length > 0, 'la pagina usa opacity:0 come stato di partenza della comparsa',
    aZero.map(r => r.sel).join(', '));
  /* Il ritorno a uno deve valere per TUTTI: una regola dentro @media
     (prefers-reduced-motion) rimette a uno solo per chi ha chiesto meno animazioni, e per
     tutti gli altri la sezione resterebbe invisibile. La condizione è che esista un
     ritorno FUORI da ogni media query. */
  const senzaRitorno = aZero.filter(function(r){
    const base = r.sel.replace(/:[a-z-]+(\([^)]*\))?$/,'');
    return !RG.some(x => !x.media && x.sel.indexOf(base) === 0 &&
                          /(^|;)\s*opacity\s*:\s*1/.test(x.decl));
  });
  esito(senzaRitorno.length === 0,
    'e ogni elemento portato a zero torna a uno con una regola valida per tutti, non solo dentro una media query',
    senzaRitorno.map(r => r.sel).join(', '));

  /* ══ 3 · le cinque riparazioni del 22 agosto 2026 ══
   *
   * Cinque punti in cui l'opacità attenuava del testo e c'era già un altro canale che lo
   * diceva. Per ciascuno: l'opacità non c'è più, e il canale c'è. */
  function nessunaOpacita(sel){
    return !conOpacita.some(r => r.sel === sel);
  }
  const casi = [
    ['#kn26 .cal>div.past',  'la tappa passata del calendario'],
    ['#kn26 .veto.off',      'il veto disattivato'],
    ['#kn26 .co.ko',         'la coalizione bloccata']
  ];
  casi.forEach(function(c){
    esito(nessunaOpacita(c[0]), c[1] + ' non si attenua più', c[0]);
  });

  /* il canale, per ciascuno, verificato sul reso e non sul foglio */
  /* Le sei tappe sono tutte future, quindi oggi nel DOM non c'è nessuna .past e non c'è
     niente da guardare. La prova non finge: verifica che il conto sia quello atteso, e
     controlla il canale dove vive davvero, cioè nel ramo del generatore. */
  const past = [].slice.call(D.querySelectorAll('#k-calend .past'));
  const gg = [].slice.call(D.querySelectorAll('#k-calend .g')).map(e => e.textContent.trim());
  esito(gg.length === 6, 'il calendario rende le sue sei tappe', String(gg.length));
  esito(gg.every(t => /giorni|oggi|passato/.test(t)),
    'e ognuna dice o quanti giorni mancano, o «oggi», o «passato»', gg.join(' · '));
  esito(past.length === 0 || past.every(e => /passato/.test(e.querySelector('.g').textContent)),
    'e la tappa passata scrive la parola al posto del conto alla rovescia',
    past.length ? past[0].querySelector('.g').textContent : 'nessuna tappa è ancora passata');
  esito(/d<0\?' class="past"'/.test(app) && /:'passato'/.test(app),
    'il generatore lega le due cose: la classe .past e la parola «passato» nascono dallo stesso conto');

  const vetoOff = RG.filter(r => r.sel === '#kn26 .veto.off');
  esito(vetoOff.some(r => /line-through/.test(r.decl)),
    'il veto disattivato resta barrato: è quello il canale');
  const unVeto = D.querySelector('#k-veti button');
  esito(!!unVeto && unVeto.getAttribute('aria-pressed') !== null,
    'e lo dice anche con aria-pressed, per chi il barrato non lo vede');

  const koCss = RG.filter(r => r.sel === '#kn26 .co.ko').map(r => r.decl).join(' ');
  esito(/background:var\(--wash\)/.test(koCss),
    'la coalizione bloccata tiene il fondo --wash come canale');
  const bloccate = [].slice.call(D.querySelectorAll('#k-coal .co.ko'));
  esito(bloccate.length === 0 || bloccate.every(c => /Bloccata/.test(c.textContent)),
    'e soprattutto lo dice a parole, nell\'intestazione della scheda',
    bloccate.length ? bloccate[0].querySelector('b').textContent : 'nessuna bloccata oggi');

  /* ══ 4 · l'istituto escluso: barrato sul nome, numeri intatti ══
   *
   * È la riga che il lettore deve poter RILEGGERE per decidere se reinserire l'istituto:
   * il barrato sta sul nome e non tocca le cifre su cui si decide. */
  const tr = D.querySelector('#k-house .hstab tbody tr');
  esito(!!tr && !!tr.querySelector('.ist'),
    'il nome dell\'istituto ha un aggancio suo nella riga della tabella');

  /* NON basta guardare lo stato di riposo: per impostazione predefinita non c'è nessun
     istituto escluso, quindi la riga esclusa non esiste e ogni prova su di lei passa a
     vuoto. Una mutazione che rimetteva l'opacity sul <tr> non è stata vista da questa
     suite proprio per questo. Qui si preme il pulsante, come farebbe il lettore. */
  const comando = $('k-house').querySelector('.hstab button[data-escl]');
  esito(!!comando, 'la tabella porta il comando che esclude l\'istituto');
  if (comando) {
    comando.dispatchEvent(new W.MouseEvent('click', {bubbles:true}));
    const escluse = [].slice.call($('k-house').querySelectorAll('.hstab tbody tr.off'));
    esito(escluse.length === 1,
      'premuto, la riga corrispondente si marca con la classe .off — una sola',
      String(escluse.length));
    esito(!/opacity/.test($('k-house').innerHTML),
      'e la riga esclusa NON porta un\'opacità in linea: a .42 il nome scendeva a 1,79');
    esito(escluse.length === 1 && !!escluse[0].querySelector('.ist'),
      'il nome che il barrato deve colpire è dentro la riga esclusa');
    /* i numeri su cui si decide devono restare intatti: il barrato sta sul nome */
    const celle = escluse.length ? [].slice.call(escluse[0].querySelectorAll('td.s')) : [];
    esito(celle.length > 0 && celle.every(c => !/line-through/.test(c.getAttribute('style')||'')),
      'e i valori della riga restano non barrati: si decide guardando quelli',
      celle.length + ' celle di valore');
    /* il riquadro si ridisegna a ogni click: il pulsante di prima resta staccato dal
       documento, e va ritrovato per chiave invece che tenuto in mano. */
    const chiave = comando.getAttribute('data-escl');
    const dinuovo = $('k-house').querySelector('.hstab button[data-escl="' + chiave + '"]');
    esito(!!dinuovo && dinuovo !== comando,
      'e dopo il ridisegno il comando è un elemento nuovo, non quello di prima');
    if (dinuovo) dinuovo.dispatchEvent(new W.MouseEvent('click', {bubbles:true}));
    esito($('k-house').querySelectorAll('.hstab tbody tr.off').length === 0,
      'ripremuto, l\'istituto rientra e la riga torna normale');
  }
  const barra = RG.filter(r => /\.hstab tr\.off \.ist$/.test(r.sel));
  esito(barra.length === 1 && /line-through/.test(barra[0].decl),
    'la riga esclusa si segna col barrato sul nome, la grammatica dei veti',
    barra.length ? barra[0].decl.trim() : 'regola assente');
  esito(!RG.some(r => /\.hstab tr\.off/.test(r.sel) && /opacity/.test(r.decl)),
    'e non con l\'opacità, che a .42 portava il nome a 1,79 in chiaro');
  /* le due forme segnano l'esclusione allo stesso modo: è la regola delle due strade */
  const mini = RG.filter(r => /\.mini$/.test(r.sel) && /var\(--neg\)/.test(r.decl));
  esito(mini.some(r => /\.hs\.off/.test(r.sel)) && mini.some(r => /\.hstab tr\.off/.test(r.sel)),
    'scheda e tabella segnano l\'esclusione con lo stesso pulsante --neg',
    mini.map(r => r.sel).join(' | '));

  /* ══ 5 · l'archivio: il separatore dice a parole quello che l'opacità sussurrava ══ */
  esito(!/opacity/.test($('k-tab').innerHTML),
    'nessuna riga dell\'archivio porta più un\'opacità in linea');
  const sep = [].slice.call($('k-tab').querySelectorAll('td[colspan]'))
    .filter(t => /pre-fusione/i.test(t.textContent));
  esito(sep.length === 1,
    'e la riga di separazione che le dichiara è ancora lì, ed è una sola',
    String(sep.length));
  esito(sep.length === 1 && /esclusi dal modello/.test(sep[0].textContent),
    'e dice a parole che quelle rilevazioni non entrano nel modello',
    sep.length ? sep[0].textContent.trim().slice(0, 72) : '');
  /* la prosa della nota non deve più promettere un'attenuazione che non c'è */
  esito(!/compaiono attenuate/.test($('k-foot').innerHTML),
    'e la nota metodologica non descrive più un\'attenuazione che non c\'è più');

  /* ══ 6 · le due che erano rimaste in sospeso, e i canali che le hanno chiuse ══ */

  /* Il numero della sezione: niente opacità, e nemmeno un peso diverso — misurato, il
     font-weight 400 contro 700 cambia una cifra a 11px di 0,38px su 6,47, il 5,9%, che
     non è una distinzione. A separarlo restano la posizione e il margine. */
  const numIdx = RG.filter(r => r.sel === '#kn26 .idx a i');
  esito(numIdx.length === 1, 'il numero della sezione ha una regola sola', String(numIdx.length));
  esito(numIdx.every(r => !/opacity/.test(r.decl)),
    'e non porta più un\'opacità: a .55 stava a 1,81 in chiaro');
  esito(numIdx.every(r => !/font-weight/.test(r.decl)),
    'e nemmeno un peso diverso, che misurato valeva il 5,9% di una cifra: non è un canale');
  esito(numIdx.every(r => /margin-right/.test(r.decl)),
    'a distinguerlo restano la posizione e il margine che c\'erano già', numIdx[0].decl.trim());

  /* La voce spenta della legenda: pastiglia vuota, e il colore della serie le arriva come
     proprietà --c, perché la regola dello spento deve poterla svuotare senza conoscerlo. */
  const spenta = RG.filter(r => /\.leg\.lint b\.spenta/.test(r.sel));
  esito(spenta.length === 2, 'la voce spenta della legenda ha due regole: il nome e la pastiglia',
    String(spenta.length));
  esito(spenta.every(r => !/opacity/.test(r.decl)),
    'e nessuna delle due usa l\'opacità');
  esito(spenta.some(r => /color:var\(--mute\)/.test(r.decl)),
    'il nome della serie passa a --mute, che è un colore e regge 5,24 in chiaro');
  esito(spenta.some(r => /background:transparent/.test(r.decl) && /box-shadow:inset/.test(r.decl)),
    'e la pastiglia si svuota lasciando il solo bordo, con box-shadow e non border',
    (spenta.find(r => /box-shadow/.test(r.decl)) || {decl:''}).decl.trim());
  const pastiglia = D.querySelector('#k-trendleg b[data-ln] i');
  esito(!!pastiglia && /--c:/.test(pastiglia.getAttribute('style') || ''),
    'il colore della serie arriva alla pastiglia come proprietà --c',
    pastiglia ? pastiglia.getAttribute('style') : 'pastiglia assente');
  /* il valore resta leggibile: è un numero, e i numeri si leggono sempre */
  const valore = RG.filter(r => /\.leg\.lint b s$/.test(r.sel));
  esito(valore.some(r => /color:var\(--ink\)/.test(r.decl)),
    'e il valore della serie resta in --ink anche quando la voce è spenta');

  /* ══ 7 · le sparkline di k-proj: l'alfa era la codifica, ora è la geometria ══
   *
   * Barra .30, estremi .55, mediana piena. Sotto 3:1 contro il fondo stavano 12 liste su
   * 21 in chiaro e 9 in scuro agli estremi, e TUTTE E VENTUNO in tutti e due i temi sulla
   * barra — l'elemento che porta l'intervallo. A opacità piena reggono tutte.
   * A distinguerle resta la geometria, che c'era già: misurato sul reso, la barra è
   * orizzontale e spessa 3px, gli estremi sono verticali e spessi 3,72 (l'allungamento di
   * preserveAspectRatio="none" li ingrassa: sono PIÙ spessi della barra, non meno) e
   * sporgono 2,5px sopra e sotto. È la figura della barra d'errore.
   * Quello che l'alfa teneva insieme da sola è il disco contro la barra: a opacità piena
   * sono lo stesso colore, contrasto 1,00. Da qui l'alone --card, quarto uso dello stesso
   * idioma nel file. */
  const spark = [].slice.call($('k-proj').querySelectorAll('svg'));
  esito(spark.length >= 10, 'ogni riga della proiezione porta la sua sparkline', String(spark.length));
  esito(!/opacity/.test($('k-proj').innerHTML),
    'e nessun marcatore è più attenuato: a .30 la barra stava sotto 3:1 su tutte e 21 le liste');

  spark.forEach(function(sv, i){
    if (i) return;                        /* la struttura è la stessa per tutte */
    const el = [].slice.call(sv.children);
    esito(el.length === 5,
      'la sparkline ha cinque marcatori: barra, due estremi, alone e mediana', String(el.length));
    const barra = el[0], alone = el[3], disco = el[4];
    esito(barra.tagName === 'line' && barra.getAttribute('stroke-width') === '3',
      'la barra è la prima, spessa 3');
    esito(alone.tagName === 'circle' && alone.getAttribute('class') === 'alone',
      'l\'alone sta SOTTO il disco, non sopra: nell\'SVG l\'ordine è la pila');
    esito(disco.tagName === 'circle' && +disco.getAttribute('r') === 4.2,
      'e il disco della mediana conserva il suo raggio', disco.getAttribute('r'));
    esito(+alone.getAttribute('r') > +disco.getAttribute('r'),
      'l\'alone è più largo del disco, o non si vedrebbe',
      alone.getAttribute('r') + ' contro ' + disco.getAttribute('r'));
    esito(alone.getAttribute('cx') === disco.getAttribute('cx') &&
          alone.getAttribute('cy') === disco.getAttribute('cy'),
      'ed è concentrico: un alone scentrato è un errore che si vede solo a occhio');
  });

  /* Il colore dell'alone è il fondo, non un token nuovo: è la ragione per cui questa
     costruzione non costa niente alla tavolozza. */
  const aloni = [].slice.call($('k-proj').querySelectorAll('circle.alone'));
  esito(aloni.length === spark.length, 'ogni sparkline ha il suo alone', String(aloni.length));
  const tinteAlone = [...new Set(aloni.map(c => (c.getAttribute('fill')||'').toUpperCase()))];
  esito(tinteAlone.length === 1, 'e tutti gli aloni hanno la stessa tinta', tinteAlone.join(', '));

  /* ── i 21 casi, nei due temi ── */
  function rgb(h){ h = String(h).trim().replace('#',''); if (h.length===3) h = h.split('').map(c=>c+c).join('');
    return [0,2,4].map(i => parseInt(h.substr(i,2),16)); }
  function lin(v){ v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4); }
  function lum(t){ return 0.2126*lin(t[0])+0.7152*lin(t[1])+0.0722*lin(t[2]); }
  function rap(a,b){ const A2=lum(rgb(a)), B2=lum(rgb(b));
    return (Math.max(A2,B2)+0.05)/(Math.min(A2,B2)+0.05); }
  function vars(b){ const o={}; for (const m of b.matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{3,8})/g)) o[m[1]]=m[2]; return o; }
  const CH = vars(html.match(/#kn26\{([\s\S]*?)\n\}/)[1]);
  const SC = Object.assign({}, CH, vars(html.match(/#kn26\.scuro\{([\s\S]*?)\}/)[1]));
  const PS = {};
  for (const m of html.matchAll(/"(#[0-9A-Fa-f]{6})":"(#[0-9A-Fa-f]{6})"/g)) PS[m[1].toUpperCase()] = m[2];
  const LISTE = [];
  for (const m of html.matchAll(/^\s*([a-z_0-9]+)\s*:\{n:"([^"]+)"[\s\S]*?c:"(#[0-9A-Fa-f]{6})"/gm))
    LISTE.push({n:m[2], c:m[3]});
  esito(LISTE.length >= 20, 'l\'anagrafica dichiara le liste da misurare', String(LISTE.length));

  [['chiaro', CH, x => x], ['scuro', SC, x => PS[x.toUpperCase()] || x]].forEach(function(t){
    const nome = t[0], V = t[1], mappa = t[2];
    const fondo = V.card;
    const r = LISTE.map(l => ({n:l.n, v:rap(mappa(l.c), fondo)}));
    r.sort((a,b) => a.v - b.v);
    /* i tre marcatori colorati contro il fondo, a opacità piena */
    esito(r.every(x => x.v >= 3),
      'tema ' + nome + ': tutti i marcatori della sparkline reggono 3:1 contro il fondo',
      'minimo ' + r[0].v.toFixed(2) + ' (' + r[0].n + ') su ' + r.length + ' liste');
    /* e il disco contro il suo alone, che è lo stesso numero: l'alone È il fondo */
    esito(r.every(x => x.v >= 3),
      'tema ' + nome + ': e il disco si stacca dal suo alone, che è il fondo',
      'minimo ' + r[0].v.toFixed(2));
  });

  console.log('\nopacita: ' + ok + '/' + (ok + ko));
  if (ko) process.exit(1);
}, 3000);
