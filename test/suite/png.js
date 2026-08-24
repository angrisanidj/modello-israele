/* L'ESPORTAZIONE PNG DEI QUATTRO DISEGNI.
 *
 * In jsdom non c'è né layout né rasterizzazione: quello che si prova qui è la COMPOSIZIONE
 * — che cosa finisce nell'SVG che il browser riceve — e le proprietà che non dipendono dai
 * pixel. Quello che dipende dai pixel è stato misurato su browser vero il 23 agosto 2026 e
 * i numeri stanno in CLAUDE.md: i tre PNG escono a 1380×924, 1290×828 e 1800×820, la tela
 * non è contaminata, e l'inchiostro dell'emiciclo lascia margini di 33/43/50/48 su 1290×828.
 *
 * LA PROPRIETÀ CHE CONTA PIÙ DI TUTTE, ed è scritta dal verso giusto: dopo la stampa,
 * NESSUN ELEMENTO esce a un'opacità diversa da quella calcolata. Non «la nuvola esce a
 * .07»: quella è un'istanza, e la prova che la nomina non copre i 126 elementi
 * dell'emiciclo filtrato — che non hanno nessun attributo e uscirebbero a opacità PIENA,
 * cioè con il filtro sparito invece che sbagliato — né i 23 della tendenza isolata, né
 * quello che qualcuno aggiunge domani.
 *
 * E LA GEOMETRIA È SEMPRE QUELLA DESKTOP: il precedente sul carattere non si estende,
 * perché il carattere è una cosa che la macchina impone e la geometria una cosa che il
 * codice sceglie. Un PNG che finisce in un articolo non deve avere l'asse diradato perché
 * chi l'ha esportato era su un telefono.
 */
const {JSDOM} = require('jsdom');
const fs = require('fs');

let ok = 0, ko = 0;
function esito(cond, desc, dettaglio){
  if (cond) { ok++; console.log('OK ' + desc); }
  else { ko++; console.log('KO ' + desc + (dettaglio ? ' — ' + dettaglio : '')); }
}

const HTML = fs.readFileSync('../../index.html', 'utf8');
const dom = new JSDOM('<!doctype html><html><body><div id="kn26"></div></body></html>', {pretendToBeVisual:true, url:'https://esempio.test/'});
const W = dom.window, D = W.document;
global.DOMParser = W.DOMParser;
D.body.innerHTML = HTML.replace(/<script>[\s\S]*?<\/script>/g,'')
  .match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
global.document = D; global.window = W;
/* stretto() legge matchMedia: qui si dichiara SCHERMO e si cambia da fuori, così la stessa
   suite può chiedere «e se fossimo su un telefono?» senza rimontare la pagina */
let SCHERMO = 'largo';
W.matchMedia = q => ({matches: /max-width:660px/.test(q) && SCHERMO === 'stretto',
                      addEventListener(){}, addListener(){}});
W.IntersectionObserver = class { observe(){} unobserve(){} };
global.IntersectionObserver = W.IntersectionObserver;
W.requestAnimationFrame = f => f();
/* jsdom non implementa scrollIntoView, e il clic su una voce di cronologia lo chiama: senza
   questo stub la suite stampa uno stack trace per ogni clic — rumore che finirebbe per
   nascondere un errore vero, che è il modo in cui un banco smette di essere letto. */
W.Element.prototype.scrollIntoView = function(){};
Object.defineProperty(W, 'localStorage', {configurable:true,
  value: {getItem:()=>null, setItem(){}, removeItem(){}}});
/* getComputedStyle è la manopola della prova sulle opacità: jsdom non fa la cascata dei
   fogli, quindi la si dichiara qui e si controlla che cosa la stampa legge. Il valore vero
   della cascata è stato misurato su browser; qui si prova che la stampa lo riporti. */
let OPACITA = () => '1';
global.getComputedStyle = el => ({getPropertyValue: () => '', opacity: OPACITA(el)});
global.Blob = function(p, o){ this.parti = p; this.type = o && o.type; };
global.URL = {createObjectURL(){ return 'blob:finto'; }, revokeObjectURL(){}};
global.FileReader = function(){};
global.fetch = () => Promise.reject(0);

let src = fs.readFileSync(__dirname + '/../app.js','utf8');
src = src.replace('carica().then(render,render)',
  'global.A={PNG_DISEGNI:PNG_DISEGNI,PNG_TESTA:PNG_TESTA,PNG_PIEDE:PNG_PIEDE,PNG_FONT:PNG_FONT,' +
  'stampaOpacita:stampaOpacita,svgPerPNG:svgPerPNG,targaPNG:targaPNG,bottonePNG:bottonePNG,' +
  'montaPNG:montaPNG,rigaEventoPNG:rigaEventoPNG,dataPNG:dataPNG,piedePNG:piedePNG,' +
  'fasceIst:fasceIst,stretto:stretto,forza:function(v){FORZA_LARGO=v;},' +
  'svgEsportabile:svgEsportabile,largo:function(){return FORZA_LARGO;},' +
  'EMBED:EMBED,FIRMA_N:FIRMA_N,CANONICO:CANONICO,render:render};carica().then(render,render)');
eval(src);
try{ A.render(); }catch(e){ console.log('KO il render non è partito — ' + (e && e.message)); }

/* ══ 1 · I QUATTRO DISEGNI SONO DICHIARATI IN UN POSTO SOLO ═════════════════ */
{
  const d = A.PNG_DISEGNI, ids = Object.keys(d);
  esito(ids.length === 4, 'i disegni esportabili sono quattro', ids.join(', '));
  esito(ids.join(',') === 'k-hist,k-hist2,k-emi,k-trend',
    'e sono gli istogrammi, l\'emiciclo e la tendenza: tutto il resto della pagina è HTML',
    ids.join(','));
  ids.forEach(id => {
    esito(!!D.getElementById(id), '  · «' + id + '» esiste nel markup');
    esito(!!d[id].sez && !!d[id].tit, '  · e ha sezione e titolo per la targa',
      JSON.stringify(d[id]));
    esito(d[id].K >= 2, '  · e un fattore di scala dichiarato', String(d[id].K));
  });
  /* la tendenza è il doppio più larga: a K=3 uscirebbe 2700px di lato lungo */
  esito(d['k-trend'].K < d['k-emi'].K,
    'la tendenza si esporta a un fattore più basso: è il doppio più larga degli altri',
    d['k-trend'].K + ' contro ' + d['k-emi'].K);
  /* l'emiciclo non ha piede: la legenda ce l'ha dentro il disegno */
  esito(!d['k-emi'].piede && !!d['k-trend'].piede && !!d['k-hist'].piede,
    'l\'emiciclo non ha piede — la legenda ce l\'ha dentro — e gli altri sì');
}

/* ══ 2 · LA GEOMETRIA È SEMPRE QUELLA DESKTOP ══════════════════════════════
 * Non si prova che il viewBox sia 460×234: si prova che sia LO STESSO a schermo largo e a
 * schermo stretto quando FORZA_LARGO è accesa, e DIVERSO quando non lo è. Un numero scritto
 * qui invecchierebbe come è già invecchiato il 210 del punto 7. */
{
  const vb = id => { const s = D.getElementById(id).querySelector('svg');
    return s ? s.getAttribute('viewBox') : null; };
  SCHERMO = 'largo'; A.render();
  const largo = {hist: vb('k-hist'), trend: vb('k-trend'), emi: vb('k-emi')};
  SCHERMO = 'stretto'; A.render();
  const stretto = {hist: vb('k-hist'), trend: vb('k-trend'), emi: vb('k-emi')};
  esito(largo.hist !== stretto.hist && largo.trend !== stretto.trend,
    'a schermo stretto istogrammi e tendenza hanno un\'altra geometria: è la premessa',
    JSON.stringify(largo) + ' contro ' + JSON.stringify(stretto));
  esito(largo.emi === stretto.emi,
    'l\'emiciclo invece è lo stesso alle due larghezze', largo.emi);
  /* e con la leva accesa, da schermo stretto si ottiene la geometria larga */
  A.forza(1); A.render();
  const forzato = {hist: vb('k-hist'), trend: vb('k-trend')};
  A.forza(0); SCHERMO = 'largo'; A.render();
  esito(forzato.hist === largo.hist && forzato.trend === largo.trend,
    'con FORZA_LARGO accesa, da schermo stretto si ridisegna con la geometria desktop',
    JSON.stringify(forzato));
  esito(A.stretto() === false, 'e stretto() dice «no» a schermo largo');
  SCHERMO = 'stretto';
  esito(A.stretto() === true, 'e «sì» a schermo stretto');
  A.forza(1);
  esito(A.stretto() === false, 'ma «no» quando la leva è accesa, qualunque sia lo schermo');
  A.forza(0); SCHERMO = 'largo'; A.render();
}

/* ══ 3 · LE FASCE DELL'ISTOGRAMMA SONO UNA FUNZIONE SOLA ═══════════════════
 * La targa si aggancia a T e a B, e ricalcolarle sarebbe la strada doppia che le fasce
 * esistono per non avere. */
{
  const a = A.fasceIst(1), b = A.fasceIst(1.55);
  esito(a.PH === b.PH, 'PH non cambia col corpo: l\'area del disegno non paga i margini',
    a.PH + ' e ' + b.PH);
  esito(b.T > a.T && b.B > a.B, 'le fasce invece scalano col corpo',
    'T ' + a.T + '→' + b.T + ' · B ' + a.B + '→' + b.B);
  esito(a.H === a.T + a.PH + a.B && b.H === b.T + b.PH + b.B,
    'e l\'altezza è la somma delle tre: nessun numero indovinato', a.H + ' e ' + b.H);
  /* e il viewBox reso usa quella somma, non un'altra */
  const s = D.getElementById('k-hist').querySelector('svg');
  esito(s && s.getAttribute('viewBox') === '0 0 460 ' + a.H,
    'il viewBox dell\'istogramma a schermo largo è quello che fasceIst() dichiara',
    s ? s.getAttribute('viewBox') : '(nessun svg)');
}

/* ══ 4 · LA COPIA DA SERIALIZZARE ══════════════════════════════════════════ */
{
  const c = A.svgPerPNG('k-emi');
  esito(!!c, 'svgPerPNG() restituisce una copia');
  esito(c && c.getAttribute('xmlns') === 'http://www.w3.org/2000/svg',
    'con xmlns: senza, new Image() fallisce IN SILENZIO');
  esito(c && c.getAttribute('font-family') === A.PNG_FONT,
    'e con font-family sulla radice: 45 dei 68 <text> lo ereditano da #kn26, e dentro un <img> non c\'è antenato');
  const orig = D.getElementById('k-emi').querySelector('svg');
  esito(c && c.querySelectorAll('*').length === orig.querySelectorAll('*').length,
    'e la copia ha gli stessi elementi dell\'originale',
    c ? c.querySelectorAll('*').length + ' contro ' + orig.querySelectorAll('*').length : '');
  esito(c && c !== orig, 'ed è una copia, non l\'originale: la pagina non si tocca');
  /* i colori sono già risolti: nei quattro disegni var(--…) non compare mai */
  esito(c && c.outerHTML.indexOf('var(--') < 0,
    'nessun var(--…) da risolvere: leggiTema() ha già scritto esadecimali');
}

/* ══ 5 · LA PROPRIETÀ DELLE OPACITÀ, DAL VERSO CHE CONTA ═══════════════════
 * Dopo la stampa, nessun elemento esce a un'opacità diversa da quella calcolata. Copre la
 * nuvola (.28 scritto contro .07 calcolato), i 126 dell'emiciclo filtrato e i 23 della
 * tendenza isolata — che non hanno NESSUN attributo e uscirebbero a opacità piena — e
 * qualunque elemento aggiunto domani. */
{
  const orig = D.getElementById('k-emi').querySelector('svg');
  const el = [].slice.call(orig.querySelectorAll('*'));
  esito(el.length > 100, 'l\'emiciclo ha abbastanza elementi da rendere la prova non banale',
    String(el.length));

  /* uno stato inventato: un elemento su tre attenuato, e di quelli metà senza attributo —
     che è la forma dei 126 dell'emiciclo filtrato */
  const atteso = new Map();
  el.forEach((x, i) => {
    let v = 1;
    if (i % 3 === 0) v = 0.22;
    else if (i % 7 === 0) v = 0.07;
    atteso.set(x, v);
  });
  OPACITA = x => String(atteso.has(x) ? atteso.get(x) : 1);
  const copia = A.svgPerPNG('k-emi');
  const cel = [].slice.call(copia.querySelectorAll('*'));
  let male = 0, primo = null;
  cel.forEach((x, i) => {
    const a = x.getAttribute('opacity');
    const scritta = a === null ? 1 : parseFloat(a);
    const vero = atteso.get(el[i]);
    if (Math.abs(scritta - vero) > 0.005){
      male++;
      if (!primo) primo = el[i].tagName + ': calcolata ' + vero + ', scritta ' + scritta;
    }
  });
  esito(!male,
    'dopo la stampa NESSUNO dei ' + cel.length + ' elementi esce a un\'opacità diversa da quella calcolata',
    male + ' sbagliati, il primo: ' + primo);
  /* e il verso che rende la prova non banale: che qualcosa fosse davvero da stampare */
  const daStampare = el.filter(x => atteso.get(x) < 1).length;
  esito(daStampare > 20,
    'e ce n\'erano da stampare, o la prova passerebbe anche senza stampare niente',
    String(daStampare));
  /* opacità piena: l'attributo si TOGLIE, non si scrive «1» — un attributo in più su
     duecento elementi è peso nel file per niente */
  const pieni = cel.filter((x, i) => atteso.get(el[i]) === 1);
  esito(pieni.every(x => x.getAttribute('opacity') === null),
    'gli elementi a opacità piena non portano nessun attributo',
    String(pieni.filter(x => x.getAttribute('opacity') !== null).length));
  OPACITA = () => '1';
}

/* ══ 6 · LA TARGA ══════════════════════════════════════════════════════════ */
{
  const dis = A.PNG_DISEGNI['k-emi'];
  const s = A.targaPNG(dis, '<g/>', 430, 232, null);
  const d = new W.DOMParser().parseFromString(s, 'image/svg+xml');
  const root = d.documentElement;
  esito(root.tagName === 'svg', 'la targa è un SVG');
  esito(root.getAttribute('xmlns') === 'http://www.w3.org/2000/svg', 'con xmlns');
  esito(root.getAttribute('viewBox') === '0 0 430 ' + (A.PNG_TESTA + 232),
    'e l\'altezza è testata più disegno: l\'emiciclo non ha piede',
    root.getAttribute('viewBox'));
  const testi = [].slice.call(root.children).filter(x => x.tagName === 'text').map(x => x.textContent);
  esito(testi.some(t => t.indexOf(dis.tit) >= 0), 'la targa nomina il disegno', testi.join(' | '));
  esito(testi.some(t => t.toUpperCase().indexOf(dis.sez.toUpperCase()) >= 0),
    'e la sezione da cui viene', testi.join(' | '));
  /* LA FIRMA E L'INDIRIZZO: un PNG gira senza la pagina attorno, ed è il caso in cui
     l'attribuzione conta di più, non di meno. E viene dalla stessa costante della pagina. */
  esito(testi.some(t => t.indexOf(A.FIRMA_N) >= 0),
    'la targa porta la firma, dalla stessa costante della pagina', testi.join(' | '));
  esito(testi.some(t => t.indexOf('angrisanidj.github.io') >= 0),
    'e l\'indirizzo, perché il PNG gira senza la pagina attorno', testi.join(' | '));
  esito(testi.some(t => /aggiornato al|ultimo sondaggio|non disponibile/.test(t)),
    'e la data, perché un\'immagine senza data non si può citare', testi.join(' | '));
  /* il disegno entra ANNIDATO: conserva il suo sistema di coordinate, e la targa non deve
     sapere niente di lui — che è la sola forma in cui una cornice diversa non obbliga a
     rifare il disegno */
  const dentro = root.querySelector('svg');
  esito(!!dentro && dentro.getAttribute('y') === String(A.PNG_TESTA),
    'il disegno entra come SVG annidato, spostato in giù della testata',
    dentro ? dentro.getAttribute('y') : '(nessuno)');
  /* il piede c'è dove è dichiarato e non dove non lo è */
  const conPiede = A.targaPNG(A.PNG_DISEGNI['k-hist'], '<g/>', 460, 234, null);
  const d2 = new W.DOMParser().parseFromString(conPiede, 'image/svg+xml');
  esito(d2.documentElement.getAttribute('viewBox') === '0 0 460 ' + (A.PNG_TESTA + 234 + A.PNG_PIEDE),
    'l\'istogramma invece ha anche il piede, e l\'altezza lo dice',
    d2.documentElement.getAttribute('viewBox'));
}

/* ══ 7 · LA RIGA DELL'EVENTO, SOLO QUANDO C'È UN EVENTO ════════════════════
 * Senza, l'isolato è un disegno quasi tutto grigio con una scheggia accesa di 36,8px su un
 * asse da 274: non dice niente a chi lo trova fuori dalla pagina. */
{
  esito(A.rigaEventoPNG() === '',
    'senza evento isolato la riga non c\'è', A.rigaEventoPNG());
  const senza = A.targaPNG(A.PNG_DISEGNI['k-trend'], '<g/>', 900, 336, null);
  const h1 = +/viewBox="0 0 900 ([\d.]+)"/.exec(senza)[1];
  esito(h1 === A.PNG_TESTA + 336 + A.PNG_PIEDE,
    'e la targa della tendenza è alta testata + disegno + piede', String(h1));
  /* si accende l'evento e si riguarda */
  const b = D.querySelector('#k-crono [data-ev]');
  esito(!!b, 'la cronologia ha voci da isolare');
  if (b){
    b.click();
    esito(A.rigaEventoPNG().length > 30,
      'con un evento isolato la riga dice il fatto e i trenta giorni dopo',
      A.rigaEventoPNG().slice(0, 90));
    const con = A.targaPNG(A.PNG_DISEGNI['k-trend'], '<g/>', 900, 336, null);
    const h2 = +/viewBox="0 0 900 ([\d.]+)"/.exec(con)[1];
    esito(h2 === h1 + A.PNG_PIEDE,
      'e la targa cresce di una riga invece di stringere il disegno: PH non si tocca',
      h1 + ' → ' + h2);
    const dd = new W.DOMParser().parseFromString(con, 'image/svg+xml');
    const tt = [].slice.call(dd.documentElement.children).filter(x => x.tagName === 'text')
      .map(x => x.textContent);
    esito(tt.some(t => t.indexOf('giorni successivi') >= 0 || t.indexOf('giorno successivo') >= 0),
      'e la riga è nella targa', tt[tt.length - 1]);
    /* la riga NON è ricomposta: è la stessa frase che il lettore ha davanti */
    const inPagina = (D.querySelector('#k-evsel .ed') || {textContent: ''}).textContent
      .replace(/\s+/g, ' ').trim();
    esito(inPagina.length > 10 && A.rigaEventoPNG().indexOf(inPagina.slice(0, 30)) >= 0,
      'e viene dal riquadro reso, non ricomposta: non può divergere da quello che si vede',
      inPagina.slice(0, 50));
    const off = D.querySelector('#k-crono [data-ev][aria-pressed="true"]');
    if (off) off.click();
  }
}

/* ══ 8 · IL COMANDO ════════════════════════════════════════════════════════ */
{
  const b = [].slice.call(D.querySelectorAll('button.png[data-png]'));
  esito(b.length === 4, 'i pulsanti sono quattro, uno per disegno', String(b.length));
  const eti = b.map(x => x.getAttribute('aria-label'));
  esito(new Set(eti).size === 4,
    'e i quattro nomi accessibili sono DIVERSI: quattro «Scarica PNG» sarebbero indistinguibili in un elenco di comandi',
    eti.join(' | '));
  esito(b.every(x => x.getAttribute('aria-label') === x.getAttribute('title')),
    'aria-label e title sono la stessa stringa, nata una volta sola');
  esito(b.every(x => (x.getAttribute('aria-label') || '').indexOf(A.PNG_DISEGNI[x.getAttribute('data-png')].tit) >= 0),
    'e ciascuno NOMINA il suo grafico', eti.join(' | '));
  esito(b.every(x => x.tagName === 'BUTTON'),
    'sono <button>: il pulsante nell\'ordine di tabulazione È l\'accesso da tastiera');
  /* montaPNG è idempotente: render() gira molte volte */
  A.render(); A.render();
  esito(D.querySelectorAll('button.png[data-png]').length === 4,
    'e restano quattro dopo due render: il montaggio toglie prima di mettere',
    String(D.querySelectorAll('button.png[data-png]').length));
  /* NIENTE PNG DENTRO L'EMBED: <a download> in sandbox non solleva niente e non scarica,
     e un comando che finge di funzionare è peggio di un comando assente */
  esito(A.EMBED === false, 'questa pagina non è un embed');
  esito(A.bottonePNG('k-emi').length > 0, 'e il pulsante si scrive');
}

/* ══ 9 · LA COMPOSIZIONE DELL'ESPORTAZIONE ════════════════════════════════
 * È la parte che decide la geometria, ed era l'unica non esercitata: la rasterizzazione ha
 * bisogno di una tela e di new Image(), che in jsdom non esistono, quindi con tutto dentro
 * esportaPNG() nessuna prova poteva arrivarci. Due mutazioni che la guastavano — FORZA_LARGO
 * mai accesa, e FORZA_LARGO lasciata accesa — restavano VIVE, e la geometria desktop è la
 * decisione centrale di tutta questa voce.
 * svgEsportabile() è la stessa cosa senza la tela: entra un id, esce l'SVG con la sua targa,
 * e la pagina resta com'era. */
{
  const vb = id => D.getElementById(id).querySelector('svg').getAttribute('viewBox');
  SCHERMO = 'largo'; A.render();
  const largo = {hist: vb('k-hist'), trend: vb('k-trend')};
  const daLargo = A.svgEsportabile('k-hist');
  esito(!!daLargo && daLargo.testo.length > 500, 'svgEsportabile() compone un SVG',
    daLargo ? String(daLargo.testo.length) : '(nulla)');
  esito(!!daLargo && daLargo.W === 460, 'largo quanto il disegno', daLargo && String(daLargo.W));
  esito(!!daLargo && daLargo.HT === A.PNG_TESTA + A.fasceIst(1).H + A.PNG_PIEDE,
    'e alto testata + disegno + piede', daLargo && String(daLargo.HT));

  /* IL CUORE: da schermo STRETTO deve uscire la geometria LARGA. */
  SCHERMO = 'stretto'; A.render();
  esito(vb('k-hist') !== largo.hist,
    'a schermo stretto la pagina è mobile: è la premessa, senza la quale il resto non prova niente',
    vb('k-hist'));
  const daStretto = A.svgEsportabile('k-hist');
  const daStrettoT = A.svgEsportabile('k-trend');
  /* il viewBox che si legge nel testo è quello della TARGA, non del disegno: il disegno
     entra come SVG annidato con width e height, e le sue coordinate sono quelle. Quindi la
     geometria desktop si verifica sull'altezza della targa, che da quella deriva. */
  const attesaTarga = 'viewBox="0 0 460 ' + (A.PNG_TESTA + A.fasceIst(1).H + A.PNG_PIEDE) + '"';
  esito(!!daStretto && daStretto.testo.indexOf(attesaTarga) >= 0,
    'ma il disegno esportato porta la geometria DESKTOP, non quella dello schermo',
    (daStretto ? (/viewBox="[^"]*"/.exec(daStretto.testo) || [''])[0] : '') + ' invece di ' + attesaTarga);
  /* e il disegno annidato è alto quanto il disegno desktop, non quanto quello mobile */
  esito(!!daStretto && daStretto.H === A.fasceIst(1).H,
    'e il disegno annidato è alto quanto quello desktop',
    daStretto ? daStretto.H + ' contro ' + A.fasceIst(1).H + ' (mobile sarebbe ' + A.fasceIst(1.55).H + ')' : '');
  esito(!!daStretto && !!daLargo && daStretto.HT === daLargo.HT,
    'e la targa è alta come quella composta da desktop',
    daStretto && daLargo ? daStretto.HT + ' contro ' + daLargo.HT : '');
  esito(!!daStrettoT && daStrettoT.W === 900,
    'e la tendenza esce a 900 di larghezza anche da un telefono, dove in pagina è 520',
    daStrettoT && String(daStrettoT.W));

  /* E LA PAGINA TORNA COM'ERA: la leva si rispegne, e il disegno resta quello dello schermo
     su cui si trova il lettore. Un'esportazione che lascia la pagina desktop su un telefono
     è un difetto che si vede solo dopo, e non si collega più alla sua causa. */
  esito(A.largo() === 0, 'dopo la composizione la leva è rispenta', String(A.largo()));
  esito(vb('k-hist') !== largo.hist,
    'e la pagina è tornata alla geometria dello schermo, non è rimasta desktop', vb('k-hist'));
  SCHERMO = 'largo'; A.render();
  esito(vb('k-hist') === largo.hist, 'e a schermo largo torna quella larga', vb('k-hist'));

  /* il nome del file dice quale disegno è: quattro file uguali nella cartella dei download
     sono indistinguibili, che è la lezione dei quattro «Scarica PNG» */
  const nomi = Object.keys(A.PNG_DISEGNI).map(id => A.svgEsportabile(id).nome);
  esito(new Set(nomi).size === 4, 'e i quattro file hanno nomi diversi', nomi.join(' '));
  esito(nomi.every(n => /^knesset2026-.+\.png$/.test(n)), 'tutti riconoscibili', nomi.join(' '));
}

console.log('\n' + ok + '/' + (ok + ko));
if (ko) process.exit(1);
