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
  'consegnaPNG:consegnaPNG,rispostaPNG:rispostaPNG,datiInBlob:datiInBlob,' +
  'largoA:largoA,tagliaA:tagliaA,' +
  'costruisciIndice:costruisciIndice,' +
  'CARD:CARD,svgCard:svgCard,testoCondivisione:testoCondivisione,' +
  'fraseCorta:fraseCorta,formaTitolo:formaTitolo,blocchi:blocchi,SEG:function(){return SEG;},' +
  'votoPassato:votoPassato,puoiCondividere:puoiCondividere,' +
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
  /* L'ALTEZZA SI DERIVA DALLA TESTATA RESA, non dalla costante. Prima l'attesa era
     PNG_TESTA + 232, e valeva finché la testata era alta sempre uguale; da quando la firma
     scende su una riga sua quando non ci sta, la testata cresce di una riga — e in jsdom la
     stima per eccesso la fa scendere, come la fa scendere il browser. Legare le due cose
     RESE invece di ripetere una costante è la mossa del colspan dell'intestazione di
     gruppo: il numero lo dichiara il markup, la prova lo legge. */
  const dentroSvg = root.querySelector('svg');
  const testaResa = dentroSvg ? +dentroSvg.getAttribute('y') : -1;
  esito(root.getAttribute('viewBox') === '0 0 430 ' + (testaResa + 232),
    'e l\'altezza è la testata resa più il disegno: l\'emiciclo non ha piede',
    root.getAttribute('viewBox') + ' con testata ' + testaResa);
  esito(testaResa >= A.PNG_TESTA,
    'e la testata non è mai più bassa di quella dichiarata',
    testaResa + ' contro ' + A.PNG_TESTA);
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
  esito(!!dentro && +dentro.getAttribute('y') === testaResa,
    'il disegno entra come SVG annidato, spostato in giù di tutta la testata',
    dentro ? dentro.getAttribute('y') : '(nessuno)');
  /* il piede c'è dove è dichiarato e non dove non lo è */
  const conPiede = A.targaPNG(A.PNG_DISEGNI['k-hist'], '<g/>', 460, 234, null);
  const d2 = new W.DOMParser().parseFromString(conPiede, 'image/svg+xml');
  const dentro2 = d2.documentElement.querySelector('svg');
  esito(d2.documentElement.getAttribute('viewBox') === '0 0 460 ' + (+dentro2.getAttribute('y') + 234 + A.PNG_PIEDE),
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


/* ══ 8 · LA CONSEGNA, CHE È LA TAPPA CHE FALLIVA ═══════════════════════════
 * Trovata il 24 agosto 2026 dopo che l'esportazione «non funzionava» a 380. Sul banco la
 * catena arrivava in fondo per tutti e quattro i disegni — blob SVG, img load, tela con un
 * disegno vero, a.click() col nome del file — quindi il difetto non era dove sembrava.
 *
 * ERANO TRE, E NESSUNO DEI TRE ERA LA RASTERIZZAZIONE:
 *   · il riscontro compariva in #k-msg, da 1.541 a 11.033 pixel SOPRA il pulsante premuto,
 *     in una pagina alta 18.177: un comando che parla dove nessuno guarda è indistinguibile
 *     da un comando muto;
 *   · l'ancora era fuori dal documento e l'href era un data: da 141 a 316 KB;
 *   · il bersaglio era 71,9 × 12px.
 *
 * E LA COSA CHE HA DECISO LA FORMA: non si può sapere se lo scaricamento è partito.
 * Misurato — a.click() restituisce undefined e ondownload/ondownloadend/ondownloaderror
 * sono tutti e tre assenti. Quindi il ramo si appoggia a un fatto sulla CAPACITÀ
 * (`'download' in a`), mai sull'identità del browser, e la parola del riscontro dichiara
 * quello che si è verificato — che l'immagine esiste — non che sia stata salvata. */
{
  const consegne = [];
  const OA = W.HTMLAnchorElement.prototype.click;
  W.HTMLAnchorElement.prototype.click = function(){
    consegne.push({href:String(this.href||'').slice(0,5), download:this.getAttribute('download'),
                   nelDocumento: D.contains(this)});
  };
  const revocati = [];
  const vecchioURL = global.URL;
  global.URL = {createObjectURL(b){ return 'blob:finto-' + (b && b.type); },
                revokeObjectURL(u){ revocati.push(u); }};
  const blob = new global.Blob(['x'], {type:'image/png'});

  /* ── il verso normale: l'attributo c'è ── */
  let esitoVisto = null;
  A.consegnaPNG(blob, 'knesset2026-prova.png', (e, x) => { esitoVisto = x; });
  esito(consegne.length === 1, 'con l\'attributo dichiarato la consegna clicca l\'ancora',
    JSON.stringify(consegne));
  esito(consegne[0] && consegne[0].nelDocumento === true,
    'e l\'ancora è NEL DOCUMENTO quando viene cliccata: staccata reggeva solo su Chromium',
    JSON.stringify(consegne[0]));
  esito(consegne[0] && consegne[0].href === 'blob:',
    'e l\'href è un blob:, non un data: da centinaia di KB — il 33% del base64 se ne va',
    consegne[0] && consegne[0].href);
  esito(consegne[0] && consegne[0].download === 'knesset2026-prova.png',
    'e il nome del file arriva fino all\'ancora', consegne[0] && consegne[0].download);
  esito(!D.querySelector('a[download="knesset2026-prova.png"]'),
    'e l\'ancora viene tolta dal documento subito dopo: non resta niente in pagina');
  /* LA PAROLA NON PROMETTE IL SALVATAGGIO, ed è la proprietà, non la stringa: qui l'esito
     è «tentata» proprio perché non è conoscibile. */
  esito(esitoVisto === 'tentata',
    'e l\'esito dichiarato è «tentata», perché il salvataggio NON è conoscibile', String(esitoVisto));
  /* l'URL non si revoca dentro il gestore: il browser deve poterlo leggere dopo */
  esito(revocati.length === 0,
    'e l\'URL non è revocato subito, o il browser non farebbe in tempo a leggerlo',
    JSON.stringify(revocati));

  /* ── il ramo del FATTO, non dell'identità: l'attributo non è dichiarato ── */
  const desc = Object.getOwnPropertyDescriptor(W.HTMLAnchorElement.prototype, 'download');
  delete W.HTMLAnchorElement.prototype.download;
  esito(!('download' in D.createElement('a')),
    'la prova sa togliere l\'attributo: il ramo si può esercitare davvero');
  consegne.length = 0;
  let aperto = null, esito2 = null;
  W.open = (u) => { aperto = u; return {chiuso:false}; };
  A.consegnaPNG(blob, 'knesset2026-prova.png', (e, x) => { esito2 = x; });
  esito(consegne.length === 0,
    'senza l\'attributo NON si clicca nessuna ancora: lo scaricamento non partirebbe e basta');
  esito(String(aperto || '').indexOf('blob:') === 0,
    'si apre l\'immagine invece, con lo stesso blob', String(aperto));
  esito(esito2 === 'aperta', 'e l\'esito è «aperta», che è quello che il lettore deve sapere',
    String(esito2));
  /* e il caso in cui anche l'apertura viene impedita: è l'UNICO dei tre in cui la pagina
     può dire con certezza che è andata male, perché window.open lo dichiara */
  let esito3 = null;
  W.open = () => null;
  A.consegnaPNG(blob, 'x.png', (e, x) => { esito3 = x; });
  esito(esito3 === 'bloccata',
    'e se anche l\'apertura è impedita lo si sa: window.open restituisce null', String(esito3));
  if (desc) Object.defineProperty(W.HTMLAnchorElement.prototype, 'download', desc);
  W.HTMLAnchorElement.prototype.click = OA;
  global.URL = vecchioURL;
}

/* ══ 9 · IL RISCONTRO STA SUL PULSANTE ════════════════════════════════════
 * La prova non guarda le stringhe una per una — guarda la proprietà che le governa:
 * nessuna delle parole del verso riuscito promette che il file sia stato SALVATO. */
{
  A.render();
  const bot = () => D.querySelector('button.png[data-png="k-emi"]');
  esito(!!bot(), 'il comando dell\'emiciclo è in pagina');
  const partenza = bot().textContent;
  A.rispostaPNG('k-emi', 'Immagine pronta');
  esito(bot().textContent === 'Immagine pronta',
    'e premendo risponde sul pulsante stesso, non a 4.980px di distanza', bot().textContent);
  esito(bot().classList.contains('detto'), 'e si dichiara in risposta con una classe');
  esito(bot().dataset.orig === partenza,
    'e conserva il testo di partenza invece di riscriverlo: bottonePNG() lo decide una volta sola',
    bot().dataset.orig);
  /* IL TESTO DI PARTENZA SI LEGGE DAL PULSANTE, e questa asserzione l'ha imposta una
     mutazione: quella che scriveva 'Scarica PNG' a mano restava VIVA, perché oggi il
     pulsante dice esattamente quello — la prova non distingueva «lo legge» da «lo indovina,
     e per ora indovina giusto». Sarebbe la seconda copia di una cosa che bottonePNG()
     decide già, cioè la strada doppia di sempre, e divergerebbe il giorno in cui l'etichetta
     cambia. Qui il pulsante viene fatto dire un'altra cosa, così le due strade si separano. */
  const b0 = bot();
  clearTimeout(b0.__t); delete b0.dataset.orig; b0.textContent = 'Un altro testo';
  A.rispostaPNG('k-emi', 'Immagine pronta');
  esito(bot().dataset.orig === 'Un altro testo',
    'e lo legge davvero: se l\'etichetta cambia, il ritorno la segue',
    bot().dataset.orig);
  clearTimeout(bot().__t);
  bot().textContent = partenza; delete bot().dataset.orig; bot().classList.remove('detto');
  A.rispostaPNG('k-emi', 'Immagine pronta');
  /* L'INGRESSO RICERCA IL PULSANTE, e questa è la metà osservabile della lezione di
     #k-house: fra il click e la risposta può esserci stato un render, che sostituisce il
     pulsante con un altro elemento, e un riferimento preso prima sarebbe morto. La prova lo
     esercita RIDISEGNANDO in mezzo.
     Il RITORNO, invece, scrive sul riferimento, e non è una svista: il mutante che toglieva
     la ricerca là restava vivo, perché dopo un render il pulsante nuovo porta già il testo
     di partenza e non c'è niente da rimettere a posto. Vedi il commento nel codice. */
  A.render();
  esito(!!bot(), 'dopo un render il pulsante c\'è ancora');
  A.rispostaPNG('k-emi', 'Immagine pronta');
  esito(bot().textContent === 'Immagine pronta', 'e il riscontro raggiunge quello nuovo');
  /* LE PAROLE SI LEGGONO DAL CODICE, NON SI RISCRIVONO QUI, e questa correzione l'ha
     imposta una mutazione: la prima stesura elencava a mano «Immagine pronta», «Aperta:
     tienila premuta» e «Bloccata dal browser» e verificava che nessuna promettesse il
     salvataggio. Verificava tre stringhe che aveva scritto lei — quindi il mutante che
     porta la parola del codice a «Scaricato» restava VIVO, e l'asserzione non poteva
     cadere per costruzione. È la stessa famiglia della tautologia di aff.js.
     Adesso le parole si estraggono dal sorgente di esportaPNG, e la proprietà è sulle
     parole VERE: nessuna promette che il file sia stato salvato, perché non è conoscibile. */
  const fonte = HTML.match(/function esportaPNG\(id\)\{[\s\S]*?\n\}/)[0];
  const parole = [...fonte.matchAll(/rispostaPNG\(id,\s*'([^']*)'/g)].map(m => m[1]);
  esito(parole.length === 4,
    'esportaPNG risponde sul pulsante in tutti e quattro i suoi esiti', parole.join(' · '));
  parole.forEach(p => esito(!/scaricat|salvat/i.test(p),
    '  · «' + p + '» non promette che il file sia salvato: non è conoscibile', p));
  /* e le tre parole del verso riuscito sono DISTINTE: «aperta» dice al lettore che cosa
     fare adesso, e dirgli la stessa cosa dei due casi in cui non deve fare niente
     cancellerebbe l'unica informazione che quel ramo esiste per dare */
  esito(new Set(parole).size === parole.length,
    'e i quattro esiti dicono quattro cose diverse', parole.join(' · '));
  /* IL RISCONTRO NON TORNA IN #k-msg. Il legame si prova dove sta — nel sorgente — come per
     og:title e il job: la callback non è esercitabile in jsdom, che non ha una tela, e una
     prova che non la guarda lascia vivo il mutante che rimette msg() al posto suo. */
  esito(!/else\s+msg\(/.test(fonte) && !/msg\('Immagine/.test(fonte),
    'e la conferma non passa più da msg(), che scrive a 1.541-11.033px dal pulsante', fonte.slice(-260));
  esito(/if\(err\)\{ rispostaPNG\(id,/.test(fonte),
    'anche l\'errore risponde sul pulsante: era la metà che serviva di più');
  esito(/msg\('L\\'esportazione non è riuscita/.test(fonte),
    'e #k-msg resta per la diagnosi per esteso: qui la conferma, là il perché');
  /* E IL RITORNO SI FA SCATTARE DAVVERO. La prima stesura rimetteva il testo a mano e poi
     verificava che fosse tornato — cioè verificava sé stessa: il mutante che toglie la
     riga del ritorno restava VIVO. Qui si cattura la richiamata dei 2,6 secondi
     sostituendo setTimeout, e la si esegue: è l'unico modo di esercitare un ritardo in una
     suite sincrona senza aspettare davvero. */
  const b2 = bot();
  clearTimeout(b2.__t);
  b2.textContent = partenza; delete b2.dataset.orig; b2.classList.remove('detto');
  const OT = global.setTimeout;
  let ritorno = null;
  global.setTimeout = (fn, ms) => { if (ms === 2600) { ritorno = fn; return 0; } return OT(fn, ms); };
  A.rispostaPNG('k-emi', 'Immagine pronta');
  global.setTimeout = OT;
  esito(typeof ritorno === 'function', 'il riscontro programma il proprio ritorno');
  esito(bot().textContent === 'Immagine pronta', 'e prima che scatti dice la parola nuova');
  ritorno();
  esito(bot().textContent === partenza,
    'e quando scatta il pulsante torna a dire l\'azione: il riscontro è transitorio, il comando resta',
    bot().textContent);
  esito(!bot().classList.contains('detto'), 'e la classe della risposta se ne va con la parola');
}

/* ══ 10 · IL BERSAGLIO È 44px ══════════════════════════════════════════════
 * Non è la voce 8 della coda in anticipo: è il comando che stava fallendo, e ripararne il
 * riscontro lasciandolo a 71,9 × 12px non avrebbe riparato niente. */
{
  const cssP = HTML.match(/<style>([\s\S]*?)<\/style>/)[1];
  const r = (cssP.match(/#kn26 \.lnk\.png\{[^}]*\}/) || [''])[0];
  esito(/min-height:44px/.test(r), 'il comando dell\'esportazione ha un bersaglio da 44px', r);
  esito(/align-items:center/.test(r) && /inline-flex/.test(r),
    'e la parola resta centrata: cresce l\'area, non la scritta', r);
  /* il corpo NON cresce: i 44px si prendono dall'imbottitura, non dal testo */
  esito(!/font-size/.test(r),
    'e il corpo resta quello di .lnk: un bersaglio più grande non è una scritta più grande', r);
  /* e non tocca l'ancoraggio: questi pulsanti non stanno nella fascia dell'indice */
  esito(!/\.idx/.test(r),
    'e la regola non raggiunge la fascia dell\'indice, che è accoppiata a scroll-margin-top');
}


/* ══ 11 · DUE TESTI SU UNA RIGA CHE NON SI CONOSCONO ══════════════════════
 * Il titolo della targa sta a sinistra e la firma a destra, e nessuno dei due sapeva quanto
 * occupasse l'altro. Misurato il 24 agosto 2026 con la sonda, in unità di viewBox:
 *
 *   disegno                        titolo + firma   spazio   esito
 *   Blocco Netanyahu               127,9 + 259      428      ci sta per 41,1
 *   Opposizione sionista           145,8 + 259      428      ci sta per 23,2
 *   Proiezione dei 120 seggi       171,9 + 259      398      SOVRAPPONE di 32,9
 *   Il modello giorno per giorno   200,8 + 259      868      larghissimo
 *
 * SI ROMPEVA UNO SOLO, e gli altri due lo mancavano per 41 e 23 unità: erano a un titolo
 * più lungo dal romperlo. Quindi la regola è DELLA TARGA e non dell'emiciclo, e questa
 * prova lo dice nel modo che conta — allungando un titolo e pretendendo che la firma
 * scenda invece di sovrapporsi. È la stessa famiglia della riga dell'evento tagliata a 150
 * caratteri: un numero di caratteri non è una larghezza.
 */
{
  /* la sonda vera non c'è in jsdom, che non fa layout: largoA() restituisce 0 e la firma
     resta in riga. Qui si monta una sonda FINTA che misura come un browser — 0,5 volte il
     corpo per carattere, il peso conta per il 7% — così il ramo si può esercitare davvero.
     È la stessa scelta dello storage guasto di embed.js: si riproduce la CAUSA, non si
     stubba il risultato. */
  const misura = (t, fs, peso) => t.length * fs * 0.5 * (peso === 700 ? 1.07 : 1);
  const finta = {
    ownerDocument: {
      createElementNS: () => {
        const e = {attr: {}, textContent: '',
          setAttribute(k, v){ this.attr[k] = v; },
          getBBox(){ return {width: misura(this.textContent, +this.attr['font-size'] || 10,
                                           +this.attr['font-weight'] || 0)}; },
          get parentNode(){ return null; }};
        return e;
      }
    },
    appendChild(){}, removeChild(){}
  };
  const dis = A.PNG_DISEGNI['k-emi'];
  const corto = Object.assign({}, dis, {tit: 'Seggi'});
  const lungo = Object.assign({}, dis, {tit: 'Proiezione dei 120 seggi della 26ª Knesset con i tre blocchi'});

  /* LE POSIZIONI NON SI CERCANO COME NUMERI, e questa correzione l'ha imposta il rimedio
     stesso: le quote della targa adesso si derivano dalla tela, quindi un'asserzione che
     cerca x="16" y="51" prova la FORMATTAZIONE e non la proprietà — ed è caduta al primo
     ritocco pur essendo il codice giusto.
     Quello che si vuole è la forma: la firma o sta a destra sulla riga del titolo
     (text-anchor="end"), o sta a sinistra su una riga PIÙ IN BASSO di quella del titolo. */
  const firmaDi = t => {
    const m = [...t.matchAll(/<text x="([\d.]+)" y="([\d.]+)"([^>]*)>([^<]*)</g)]
      .find(x => x[4].indexOf(A.FIRMA_N) === 0);
    const tit = [...t.matchAll(/<text x="([\d.]+)" y="([\d.]+)"[^>]*font-weight="700"[^>]*>([^<]*)</g)]
      .filter(x => !/[A-Z]{4}/.test(x[3])).pop();
    if (!m) return null;
    return {y: +m[2], destra: /text-anchor="end"/.test(m[3]), yTit: tit ? +tit[2] : null};
  };
  const inRiga = t => { const f = firmaDi(t); return !!f && f.destra; };
  const sottoRiga = t => { const f = firmaDi(t);
    return !!f && !f.destra && f.yTit !== null && f.y > f.yTit; };

  const sC = A.targaPNG(corto, '<g/>', 430, 232, finta);
  const sL = A.targaPNG(lungo, '<g/>', 430, 232, finta);
  esito(inRiga(sC) && !sottoRiga(sC),
    'con un titolo corto la firma resta sulla riga del titolo', sC.slice(0, 60));
  esito(sottoRiga(sL) && !inRiga(sL),
    'e con un titolo che non lascia spazio SCENDE su una riga sua, invece di sovrapporsi');
  /* e la targa cresce di quello che serve, invece di far crescere il disegno */
  const hC = +(/viewBox="0 0 [\d.]+ ([\d.]+)"/.exec(sC) || [])[1];
  const hL = +(/viewBox="0 0 [\d.]+ ([\d.]+)"/.exec(sL) || [])[1];
  esito(hL - hC === 16, 'e la targa cresce di 16 unità, quante ne serve la riga in più',
    hC + ' → ' + hL);
  /* NÉ LA FIRMA NÉ IL TITOLO SI ACCORCIANO: sono le due cose per cui la targa esiste —
     l'attribuzione e il nome del disegno. Se una delle due venisse troncata, il rimedio
     avrebbe tolto proprio quello che doveva proteggere. */
  esito(sL.indexOf(A.FIRMA_N) >= 0, 'la firma resta intera', A.FIRMA_N);
  esito(sL.indexOf(lungo.tit) >= 0, 'e il titolo pure', lungo.tit);

  /* DOVE NON SI PUÒ MISURARE SI STIMA PER ECCESSO, e questa attesa si è girata perché
     quella di prima codificava il comportamento sbagliato. Diceva «senza una sonda la targa
     resta com'era: non si decide su una misura che non si ha» — vero nel browser, dove la
     sonda c'è sempre. Ma IL LAVORO NOTTURNO NON NE HA UNA, perché jsdom non fa layout: là
     la vecchia regola lasciava la firma sulla riga del titolo, e sulla prima card resa si
     leggeva «Daniele Angrisani · angrisanidj.github.io/…» scritto SOPRA «Proiezione dei
     120 seggi». Non decidere era una decisione, ed era quella sbagliata.
     Adesso si stima a 0,55 corpi per carattere, 0,60 per il grassetto: più largo di
     qualunque pila reale. Sovrastimare costa una riga, sottostimare fa sovrapporre — lo
     stesso argomento di ETIW nell'etichetta dei 61. */
  const senzaSonda = A.targaPNG(lungo, '<g/>', 430, 232, null);
  esito(sottoRiga(senzaSonda),
    'senza una sonda la firma scende lo stesso: la stima per eccesso decide invece di rinunciare');
  const cortoSenza = A.targaPNG(corto, '<g/>', 430, 232, null);
  esito(inRiga(cortoSenza),
    'e con un titolo corto resta in riga: la stima non manda tutto sotto per prudenza');
  /* la stima è PIÙ LARGA della misura vera, non più stretta: è la proprietà che rende
     sicuro il verso in cui sbaglia */
  const fonteS = HTML.match(/var stimaL=function[^;]*;/)[0];
  const rap = [...fonteS.matchAll(/0\.\d+/g)].map(Number);
  esito(rap.length === 2 && rap[0] > rap[1],
    'e il grassetto si stima più largo del tondo, come è', fonteS);
  /* e tutti e due stanno SOPRA il rapporto misurato sulla pila del foglio — 0,433 corpi per
     carattere per la firma, 0,533 per il titolo in grassetto — perché sovrastimare costa una
     riga e sottostimare fa sovrapporre. Cercare le cifre «0.6» e «0.55» provava i caratteri
     scritti, non la proprietà: è caduta appena i due numeri sono stati ricalibrati, pur
     restando giusti. */
  esito(rap.length === 2 && rap[1] > 0.433 && rap[0] > 0.533,
    'e stanno sopra i rapporti misurati: si sbaglia dalla parte che costa una riga',
    rap.join(' e '));

  /* la misura è una funzione sua, usata da tagliaA() e dalla targa: una seconda sonda
     scritta a parte sarebbe la strada doppia di sempre */
  esito(/function largoA\(/.test(HTML) &&
        (HTML.match(/largoA\(/g) || []).length >= 3,
    'e la sonda è una funzione sola, chiamata da chi la usa',
    String((HTML.match(/largoA\(/g) || []).length) + ' occorrenze');
}


/* ══ 12 · LE CARD E LA CONDIVISIONE ═══════════════════════════════════════
 * Sono la stessa macchina del PNG: targaPNG() prende l'altezza come PARAMETRO invece che
 * come risultato, e una card è la stessa targa con la tela imposta. Una targa sola —
 * esportazione, anteprima Open Graph e card — perché due divergono al primo ritocco.
 *
 * QUELLO CHE HA DECISO LA FORMA, misurato il 24 agosto 2026:
 *   · navigator.share e canShare sono `undefined` su desktop, con isSecureContext vero:
 *     non è un'API che rifiuta i file, è un'API che non esiste, e il ramo senza comando è
 *     il caso NORMALE;
 *   · i link di intent non hanno nessun parametro per un file — X prende text e url,
 *     Facebook u, Telegram url e text — quindi su desktop la condivisione dipende da
 *     og:image e non da qui;
 *   · in griglia su Instagram una card è larga 161px: un corpo da 30 rende 4,0px, cioè
 *     nulla di testuale si legge. L'indirizzo c'è per chi apre la card, non per la griglia.
 */
{
  const F = A.CARD;
  esito(Array.isArray(F) && F.length === 4, 'i formati delle card sono quattro', String(F && F.length));
  esito(F.map(x => x.W + '×' + x.H).join(' ') === '1200×675 1200×630 1080×1080 1080×1350',
    'e sono quelli che le piattaforme chiedono', F.map(x => x.W + '×' + x.H).join(' '));
  /* LA COMPOSIZIONE B STA DOVE AVANZA SPAZIO, e non altrove: l'emiciclo è largo e piatto,
     quindi nei due formati larghi la larghezza si esaurisce prima dell'altezza e non
     avanza niente, mentre il quadrato avanza 286px e il verticale 498. */
  const conB = F.filter(x => x.B).map(x => x.n);
  esito(conB.join(',') === 'quadrata,verticale',
    'e il verdetto sta solo nei due formati che avanzano spazio', conB.join(','));
  /* i due che portano B sono anche i due senza link: Instagram non ne ammette */
  esito(F.filter(x => x.B).every(x => /Instagram/.test(x.eti)),
    'che sono i due di Instagram, dove un link non si può mettere');

  /* ══ LA CARD È LA TARGA, CON LA TELA IMPOSTA ══ */
  const c = A.svgCard('quadrata');
  esito(!!c, 'la card si compone');
  if (c) {
    esito(/width="1080" height="1080"/.test(c.testo),
      'e la tela è quella del formato, non quella ricavata dal disegno',
      (c.testo.match(/width="\d+" height="\d+"/) || [])[0]);
    esito(c.W === 1080 && c.H === 1080, 'e le misure dichiarate coincidono con la tela');
    esito(/knesset2026-quadrata\.png$/.test(c.nome), 'e il nome del file dice quale formato è', c.nome);
    /* IL VERDETTO VIENE DA fraseCorta(), non da un testo nuovo: quinto consumatore della
       stessa strada. Si prova che la frase resa SIA quella, non che le somigli. */
    const frase = A.fraseCorta(A.formaTitolo(A.blocchi(A.SEG())), A.votoPassato());
    const dentro = c.testo.indexOf(frase.slice(0, 18)) >= 0;
    esito(dentro, 'e il verdetto della card è la frase del titolo, non un testo nuovo',
      frase.slice(0, 40));
    /* e i tre totali sono quelli di blocchi(), con i colori dei tre blocchi */
    const b = A.blocchi(A.SEG());
    esito(c.testo.indexOf('Netanyahu ' + b.coalizione) >= 0 &&
          c.testo.indexOf('opposizione ' + b.opposizione) >= 0 &&
          c.testo.indexOf('arabi ' + b.arabo) >= 0,
      'e porta i tre totali di blocco, gli stessi della pagina',
      b.coalizione + '/' + b.opposizione + '/' + b.arabo);
  }
  /* e nei formati larghi il verdetto NON c'è: se ci fosse, non ci starebbe */
  const largo = A.svgCard('social');
  if (largo) {
    const b2 = A.blocchi(A.SEG());
    esito(largo.testo.indexOf('Netanyahu ' + b2.coalizione) < 0,
      'nei formati larghi il verdetto non c\'è: lo spazio non avanza');
    esito(/width="1200" height="630"/.test(largo.testo), 'e la tela è 1200×630');
  }
  /* un formato che non esiste non produce niente, invece di produrre una tela a caso */
  esito(A.svgCard('quadratissima') === null, 'un formato non dichiarato non produce niente');

  /* ══ IL TESTO CHE ACCOMPAGNA ══
     L'indirizzo NON sta nella frase: `text` e `url` sono due parametri separati in tutti e
     tre gli intent, e ripeterlo lo farebbe comparire due volte nel messaggio pubblicato. */
  const t = A.testoCondivisione();
  esito(t.indexOf(A.CANONICO) < 0 && !/https?:\/\//.test(t),
    'il testo della condivisione non porta l\'indirizzo: è l\'altro parametro', t);
  const b3 = A.blocchi(A.SEG());
  esito(t.indexOf('Netanyahu ' + b3.coalizione) >= 0 &&
        t.indexOf('opposizione ' + b3.opposizione) >= 0 &&
        t.indexOf('partiti arabi ' + b3.arabo) >= 0,
    'e porta i tre totali veri, non ricontati altrove', t);
  /* «giorni» al plurale sarebbe un'attesa stagionale: la vigilia del voto la frase dice
     «1 giorno», perché passa da acc(). Si chiede il NUMERO, che è la proprietà. */
  esito(/\d+ giorn[oi] dal voto/.test(t), 'e i giorni al voto', t);
  /* i giorni vengono da ggCal, che conta giorni di CALENDARIO: la stessa funzione del
     conto alla rovescia, non una sottrazione di millisecondi scritta qui */
  /* la FIRMA della funzione è cambiata quando le due copie sono state unificate — prendeva
     zero argomenti, adesso ne prende uno — e questa riga la cercava alla lettera: il match
     tornava null e la suite MORIVA invece di cadere, che è il difetto peggiore dei due.
     L'ha trovata `npm run spazzola`, non il banco normale, perché la morte arrivava dopo
     137 asserzioni e il conto non aveva niente da dire. Si cerca il NOME, non la firma. */
  const fonteTC = HTML.match(/function testoCondivisione\([^)]*\)\{[\s\S]*?\n\}/);
  esito(!!fonteTC && /ggCal\(new Date\(\),VOTO\)/.test(fonteTC[0]),
    'e li conta con ggCal, come il conto alla rovescia della testata',
    fonteTC ? fonteTC[0].slice(0, 90) : '(funzione non trovata)');

  /* ══ IL COMANDO C'È SOLO DOVE LA CAPACITÀ C'È ══
     Un comando che apre un foglio di condivisione senza poter allegare l'immagine
     prometterebbe una cosa che non fa. Il ramo guarda la CAPACITÀ, non il nome del
     browser: è la stessa grammatica di 'download' in a e di navigator.clipboard. */
  const fonte = HTML.match(/function puoiCondividere\(\)\{[\s\S]*?\n\}/)[0];
  esito(/canShare\(\{files:/.test(fonte),
    'la capacità si chiede con canShare({files}), cioè con un file vero', fonte.slice(0, 120));
  esito(!/userAgent|platform|iPhone|Android/.test(fonte),
    'e non si guarda mai il nome del browser', fonte);
  esito(/if\(EMBED\) return false;/.test(fonte),
    'e dentro l\'embed il comando non c\'è: in sandbox un <a download> non fa niente');
  /* E LA CAPACITÀ SI ESERCITA, non si legge soltanto nel sorgente. In jsdom l'API manca
     comunque, quindi il mutante che toglie la guardia restava VIVO: puoiCondividere()
     rispondeva false, ma per un'altra ragione. Si finge la capacità — come si finge lo
     storage guasto in embed.js — e si guarda la risposta nei due versi. */
  {
    const vero = W.navigator;
    Object.defineProperty(W, 'navigator', {configurable: true,
      value: {share(){ return Promise.resolve(); }, canShare(){ return true; }}});
    const conAPI = A.puoiCondividere();
    Object.defineProperty(W, 'navigator', {configurable: true, value: {}});
    const senzaAPI = A.puoiCondividere();
    Object.defineProperty(W, 'navigator', {configurable: true, value: vero});
    esito(conAPI === true, 'dove la capacità c\'è, il comando si può mettere', String(conAPI));
    esito(senzaAPI === false,
      'e dove non c\'è NON si mette: un comando che apre un foglio senza immagine prometterebbe una cosa che non fa',
      String(senzaAPI));
    /* IL CASO CHE LA GUARDIA ESISTE PER COGLIERE, e che nessuna prova esercitava: canShare
       che risponde SÌ mentre share non c'è. Il try/catch da solo non lo vede — canShare
       non lancia, risponde — quindi il comando comparirebbe, e premendolo chiamerebbe una
       funzione che non esiste. È una capacità DICHIARATA per un'azione che manca, ed è la
       ragione per cui la guardia non è ridondante: la mutazione che la toglieva restava
       viva proprio perché il caso non era nell'elenco di quelli provati. */
    Object.defineProperty(W, 'navigator', {configurable: true, value: {canShare(){ return true; }}});
    const soloCanShare = A.puoiCondividere();
    Object.defineProperty(W, 'navigator', {configurable: true, value: vero});
    esito(soloCanShare === false,
      'e se il browser dichiara la capacità ma non ha l\'azione, il comando non si mette lo stesso',
      String(soloCanShare));
  }

  /* ══ ANNULLARE NON È UN ERRORE ══
     share() restituisce una promessa, quindi l'esito è conoscibile — come per la copia.
     Ma se il lettore chiude il foglio la promessa viene rifiutata con AbortError, e
     dichiarare un fallimento dove qualcuno ha cambiato idea è dire il falso sul suo gesto. */
  const fc = HTML.match(/function condividi\(\)\{[\s\S]*?\n\}/)[0];
  esito(/AbortError/.test(fc), 'l\'annullamento si riconosce', fc.slice(-200));
  esito(/if\(!e\|\|e\.name!=='AbortError'\) rispostaCond/.test(fc),
    'e non dice niente: annullare non è un errore', fc.slice(-200));
  esito(/rispostaCond\('Condiviso'\)/.test(fc),
    'mentre la riuscita si dichiara, perché la promessa si risolve solo a condivisione avvenuta');
}


/* ══ 13 · LA TARGA DENTRO UNA CORNICE, E L'INDICE ═════════════════════════
 * Sette mutazioni su dieci sono sopravvissute al primo giro, e dicevano una cosa sola: le
 * prove esercitavano la targa dell'ESPORTAZIONE, dove la tela coincide con il disegno,
 * quindi tutto ciò che distingue i due sistemi di coordinate era invisibile. E dell'indice
 * non c'era nessuna prova.
 * È la coincidenza che nasconde il difetto, per la terza volta in questo file: l'house
 * effect in ordine di blocco «per fortuna», l'ordine del pannello che coincide finché
 * nessuna lista dell'ago della bilancia ha seggi, e adesso CW che è uguale a W finché non
 * esiste una card.
 */
{
  const dis = A.PNG_DISEGNI['k-emi'];
  const ink = {x: 21.6, y: 0.4, w: 386.7, h: 217};
  const cornice = {W: 1200, H: 630, ink: ink, B: 0};
  const c = A.targaPNG(dis, '<g/>', 430, 232, null, cornice);
  const dc = new W.DOMParser().parseFromString(c, 'image/svg+xml');
  const rc = dc.documentElement;
  const testiC = [].slice.call(rc.children).filter(x => x.tagName === 'text');

  esito(rc.getAttribute('viewBox') === '0 0 1200 630',
    'con una cornice la tela è quella imposta, non quella ricavata dal disegno',
    rc.getAttribute('viewBox'));

  /* LA DATA STA AL BORDO DELLA TELA, non a quello del disegno: misurandola su W finiva a
     x 414 su una tela larga 1200, cioè a un terzo della larghezza. */
  const data = testiC.find(t => /aggiornato al|ultimo sondaggio|non disponibile/.test(t.textContent));
  esito(!!data && data.getAttribute('text-anchor') === 'end' && +data.getAttribute('x') > 1000,
    'la data si allinea al bordo destro della TELA, non a quello del disegno',
    data ? data.getAttribute('x') : '(nessuna)');

  /* LA TESTATA SI SCALA CON LA TELA: con i corpi assoluti dell'esportazione, su 1200 unità
     diventavano tre righe da 11px accatastate nell'angolo. */
  const tit = testiC.find(t => t.textContent === dis.tit);
  const sez = testiC.find(t => t.textContent === dis.sez.toUpperCase());
  esito(!!tit && +tit.getAttribute('font-size') > 30,
    'il titolo si scala con la tela invece di restare al corpo del disegno',
    tit ? tit.getAttribute('font-size') : '(nessuno)');
  esito(!!sez && +sez.getAttribute('font-size') > +tit.getAttribute('font-size') * 0.6,
    'e la sezione con lui, nella stessa proporzione di sempre',
    sez ? sez.getAttribute('font-size') : '(nessuna)');
  /* e la proporzione È quella dell'esportazione: la scala non cambia il disegno della targa,
     lo ingrandisce. Si confronta il rapporto, non i due numeri. */
  const e = A.targaPNG(dis, '<g/>', 430, 232, null);
  const de = new W.DOMParser().parseFromString(e, 'image/svg+xml');
  const titE = [].slice.call(de.documentElement.children)
    .find(x => x.tagName === 'text' && x.textContent === dis.tit);
  const sezE = [].slice.call(de.documentElement.children)
    .find(x => x.tagName === 'text' && x.textContent === dis.sez.toUpperCase());
  const rC = +sez.getAttribute('font-size') / +tit.getAttribute('font-size');
  const rE = +sezE.getAttribute('font-size') / +titE.getAttribute('font-size');
  esito(Math.abs(rC - rE) < 0.001,
    'e il rapporto fra i corpi è lo stesso: la scala ingrandisce, non ridisegna',
    rC.toFixed(4) + ' contro ' + rE.toFixed(4));

  /* LA DIDASCALIA NON SI SCRIVE DOVE IL DISEGNO NON NE HA. «piede» era due cose insieme —
     la bandiera e l'altezza della fascia — e nel ramo della cornice l'altezza sovrascriveva
     la bandiera: la targa dell'emiciclo, che è la A, si metteva a scrivere la didascalia
     degli istogrammi, «la fascia chiara è l'intervallo… il triangolo è la stima puntuale»,
     sopra i seggi, a parlare di due cose che nell'emiciclo non esistono. */
  esito(c.indexOf('fascia chiara') < 0,
    'e la didascalia degli istogrammi non finisce nella targa dell\'emiciclo, che non ne ha');
  const cH = A.targaPNG(A.PNG_DISEGNI['k-hist'], '<g/>', 460, 234, null, cornice);
  esito(cH.indexOf('fascia chiara') >= 0,
    'mentre nell\'istogramma, che ne ha una, c\'è: la bandiera è tornata una bandiera');

  /* IL CONTROLLO DELLA FIRMA MISURA CONTRO LA TELA: contro il disegno, una card larga 1200
     decideva sui 398 del disegno e mandava la firma sotto dove ci stava comodamente. Il
     titolo corto su una tela larga deve restare in riga. */
  const cortoC = A.targaPNG(Object.assign({}, dis, {tit: 'Seggi'}), '<g/>', 430, 232, null, cornice);
  const dcc = new W.DOMParser().parseFromString(cortoC, 'image/svg+xml');
  const firmaC = [].slice.call(dcc.documentElement.children)
    .find(x => x.tagName === 'text' && x.textContent.indexOf(A.FIRMA_N) === 0);
  esito(!!firmaC && firmaC.getAttribute('text-anchor') === 'end',
    'e con un titolo corto su una tela larga la firma resta in riga: si misura contro la tela',
    firmaC ? (firmaC.getAttribute('text-anchor') || '(inizio)') : '(nessuna)');
}

/* ══ 14 · L'INDICE NON LEGGE I COMANDI MONTATI NEGLI h2 ════════════════════
 * Montando i comandi dell'esportazione e della condivisione dentro gli h2, l'indice ha
 * cominciato a dire «La prossima Knesset Scarica PNG» e «Scarica PNGCondividi» — due
 * textContent adiacenti concatenati senza spazio. E non era cosmetico: quella stringa è
 * anche il nome accessibile del collegamento, quindi un lettore di schermo diceva
 * «La prossima Knesset Scarica PNG Condividi, collegamento».
 * LA PROVA COPRE IL CASO GENERALE, non i due comandi di oggi: si monta un comando NUOVO in
 * un h2 e si pretende che non compaia in nessun testo derivato. Se la regola tornasse a
 * essere un'esclusione per nome, il comando successivo ricomparirebbe — ed è esattamente
 * quello che questa prova impedisce. */
{
  A.render(); A.costruisciIndice();
  const voci = () => [].slice.call(D.querySelectorAll('#kn26 .idx a')).map(a => a.textContent);
  const primaDi = voci();
  esito(primaDi.length > 5, 'l\'indice ha le sue voci', String(primaDi.length));
  esito(!primaDi.some(v => /Scarica PNG|Condividi/.test(v)),
    'e nessuna porta il testo dei comandi montati negli h2', primaDi.join(' | '));

  /* il caso generale: un comando che non esiste ancora */
  const h2 = D.querySelector('#kn26 section h2');
  const finto = D.createElement('button');
  finto.className = 'lnk';
  finto.textContent = 'Comando inventato';
  h2.appendChild(finto);
  A.render(); A.costruisciIndice();
  const dopo = voci();
  esito(!dopo.some(v => /Comando inventato/.test(v)),
    'e un comando aggiunto oggi in un h2 non compare in nessuna voce: la regola è strutturale',
    dopo.join(' | '));
  /* e il titolo non si è accorciato: si prende il testo dell'h2, non si sottrae qualcosa */
  esito(dopo[0] === primaDi[0],
    'e la voce resta identica a prima: il titolo non dipende da che cosa c\'è accanto',
    dopo[0] + ' contro ' + primaDi[0]);
  if (finto.parentNode) finto.parentNode.removeChild(finto);
  A.render(); A.costruisciIndice();

  /* E IL SOTTOTITOLO IN <em> NON C'È MAI STATO, ma prima veniva tolto per SOTTRAZIONE della
     sua stringa: la stessa forma di esclusione per nome che i comandi hanno fatto cadere. */
  const conEm = [].slice.call(D.querySelectorAll('#kn26 section h2')).filter(h => h.querySelector('em'));
  esito(conEm.length > 3, 'ci sono h2 con un sottotitolo in <em>', String(conEm.length));
  const sporche = voci().filter(v => conEm.some(h => {
    const em = h.querySelector('em');
    return em && em.textContent.length > 4 && v.indexOf(em.textContent.trim()) >= 0;
  }));
  esito(sporche.length === 0,
    'e nessuna voce porta il testo del sottotitolo', sporche.join(' | '));
}


console.log('\n' + ok + '/' + (ok + ko));
if (ko) process.exit(1);
