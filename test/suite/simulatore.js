/* Il simulatore manuale di maggioranza, su un DOM vero.
 *
 * Le pastiglie erano già <button>, ma lo stato selezionato passava solo dal colore e la
 * barra portava due esadecimali cablati — '#1c6b45' e '#a52a2a' — che la tavolozza non
 * aveva mai visto: la stessa strada doppia dei token di blocco, versione semaforo. Con i
 * token veri il bianco fisso del totale, sul --pos del tema scuro, starebbe a 2,14.
 *
 * Le proprietà:
 *   · ogni pastiglia è <button type="button"> con aria-pressed coerente con la selezione,
 *     e il click commuta insieme stato e attributo;
 *   · la pastiglia selezionata porta il fondo pieno del colore della lista;
 *   · la barra passa dai token via classe: nessun esadecimale cablato nel codice né nello
 *     stile in linea — la mutazione che rimette i due colori di prima deve cadere;
 *   · il confine dei due stati è 61 COMPRESO: a 60 «non ci arriva», a 61 maggioranza;
 *   · niente gradiente nella CSS della barra;
 *   · il testo del totale è --on-color, e passa a --ink solo quando il riempimento è
 *     troppo stretto per contenerlo.
 *
 * Le altezze delle pillole e la leggibilità del totale sopra il riempimento non sono
 * misurabili in jsdom, che non fa layout: verificate a mano su browser il 21 agosto 2026
 * nei due temi, a larghezza piena, a 760 e a 380px.
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
  'global.A={render:render,sim:function(v){SIM=v;},rChips:rChips,SEG:function(){return SEG;},' +
  'setSEG:function(v){SEG=v;},setCOAL:function(v){COAL=v;},COAL:function(){return COAL;},' +
  'P:function(){return P;},cp:cp,calcola:calcola,PRESET:function(){return PRESET;},' +
  'apertura:Object.keys(COAL).slice()};carica().then(render,render)');
/* La selezione di APERTURA si fotografa dove global.A viene costruito, cioè subito dopo
   che è stata scritta e prima che qualunque prova possa toccarla. Non si aggancia alla
   RIGA che la scrive: una mutazione che rimette una lista letterale la sposterebbe, e la
   prova morirebbe invece di cadere — cioè non proverebbe più la cosa per cui esiste. */
eval(src);

const $ = i => D.getElementById(i);
const chips = () => [].slice.call($('k-chips').querySelectorAll('.chip'));
const chipDi = id => $('k-chips').querySelector('[data-p="' + id + '"]');
function click(el){ el.dispatchEvent(new W.MouseEvent('click',{bubbles:true})); }

/* la CSS della barra e delle pastiglie, per le asserzioni che riguardano lo stile */
const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
/* le regole della barra sono scritte su due righe: si cerca nel CSS intero, con [^}]*
   che attraversa le righe, non in un filtro riga per riga che perderebbe la seconda */
const cssGauge = css;

setTimeout(function(){
  const A = global.A;
  A.sim(500);
  A.setCOAL({}); A.rChips();

  /* ── comandi veri, stato dichiarato ── */
  const c = chips();
  esito(c.length >= 10, 'una pastiglia per ogni lista con seggi', String(c.length));
  esito(c.every(b => b.tagName === 'BUTTON' && b.type === 'button'),
    'ogni pastiglia è un <button type="button">');
  esito(c.every(b => b.getAttribute('aria-pressed') === 'false'),
    'a riposo nessuna pastiglia dichiara di essere premuta');
  esito($('k-chips').getAttribute('role') === 'group' && !!$('k-chips').getAttribute('aria-label'),
    'le pastiglie si presentano come un gruppo di comandi');
  esito(c.every(b => !b.getAttribute('style')),
    'a riposo nessuna pastiglia ha il fondo pieno');

  /* ── il click commuta stato e attributo insieme ── */
  click(chipDi('likud'));
  esito(A.COAL().likud === true, 'il click mette la lista nella coalizione');
  esito(chipDi('likud').getAttribute('aria-pressed') === 'true' && chipDi('likud').classList.contains('on'),
    'e la pastiglia lo dichiara, con aria-pressed e classe insieme');
  const attesoFondo = A.cp(A.P().likud.c).toLowerCase();
  esito((chipDi('likud').getAttribute('style') || '').toLowerCase().indexOf(attesoFondo) >= 0,
    'la pastiglia selezionata porta il fondo pieno del colore della lista',
    chipDi('likud').getAttribute('style'));
  click(chipDi('likud'));
  esito(!A.COAL().likud && chipDi('likud').getAttribute('aria-pressed') === 'false',
    'il secondo click la toglie e aria-pressed torna false');

  /* ── i due stati della barra, dai token e non da esadecimali ── */
  esito(!/#1c6b45|#a52a2a/i.test(src),
    'nessun esadecimale cablato per i due stati della barra nel codice');
  /* jsdom serializza i colori in linea come rgb(…), non esadecimali: si cercano entrambi */
  esito(!/#[0-9a-f]{3,6}|rgb\(|background/i.test($('k-gb').getAttribute('style') || ''),
    'lo stile in linea del riempimento non porta colori: solo la larghezza',
    $('k-gb').getAttribute('style'));
  esito(/\.gauge\.ok i\{[^}]*var\(--pos\)/.test(cssGauge) && /\.gauge i\{[^}]*var\(--neg\)/.test(cssGauge),
    'la CSS lega i due stati ai token --pos e --neg');
  const soloGauge = (css.match(/#kn26 \.(gauge|chip)[^{]*\{[^}]*\}/g) || []).join('\n');
  esito(soloGauge.length > 0 && !/gradient/i.test(soloGauge), 'nessun gradiente nella CSS della barra e delle pastiglie');
  esito(/\.gauge \.vv\{[^}]*var\(--on-color\)/.test(cssGauge),
    'il totale dentro il riempimento è --on-color, non bianco fisso');
  esito(!/\.gauge \.vv\{[^}]*#fff/i.test(cssGauge), 'e il bianco fisso di prima non c\'è più');
  esito(/\.gauge \.th\{[^}]*box-shadow:[^}]*var\(--wash\)/.test(cssGauge),
    'il tratto della soglia porta l\'alone --wash');

  /* ── il confine esatto a 61, nei due versi ── */
  /* id veri: rChips() legge P[i] per la nota sulle liste arabe, e un id inventato la fa morire */
  A.setSEG({likud:60, raam:1, yashar:59});
  A.setCOAL({likud:true}); A.rChips();
  esito(!$('k-gauge').classList.contains('ok') && $('k-gv').textContent === '60 seggi',
    'a 60 seggi la barra dice «non ci arriva»', $('k-gv').textContent);
  A.setCOAL({likud:true, raam:true}); A.rChips();
  esito($('k-gauge').classList.contains('ok') && $('k-gv').textContent === '61 seggi',
    'a 61 seggi esatti la barra passa a maggioranza: il confine è compreso', $('k-gv').textContent);
  esito($('k-gb').style.width === (100*61/120).toFixed(2).replace(/\.?0+$/,'') + '%' ||
        Math.abs(parseFloat($('k-gb').style.width) - 100*61/120) < 0.01,
    'il riempimento è proporzionale ai seggi su 120', $('k-gb').style.width);

  /* ── a pochi seggi il totale non resta in --on-color sul fondo --wash ── */
  A.setCOAL({raam:true}); A.rChips();
  esito($('k-gauge').classList.contains('vuota') && !!$('k-gv').style.left,
    'con un riempimento troppo stretto il totale passa accanto, in --ink',
    $('k-gv').style.left);
  A.setCOAL({likud:true}); A.rChips();
  esito(!$('k-gauge').classList.contains('vuota') && !$('k-gv').style.left,
    'con riempimento sufficiente il totale torna dentro, in --on-color');

  /* ripristino */
  A.calcola && A.calcola();
  A.setCOAL({});

  /* ══ l'etichetta della soglia regge sui TRE fondi possibili ══
   *
   * Il tratto e l'etichetta cadono su --wash finché il riempimento non li raggiunge, e sul
   * riempimento — --neg o --pos — quando lo supera. La misura di prima era contro --wash
   * soltanto: lo stesso errore dell'anello, una tinta scelta contro un fondo mentre i
   * fondi sono due. Nessuna tinta singola regge su tutti e tre (--mute 4,79 su --wash ma
   * 1,21 su --neg e --pos in chiaro; --ink 2,80; --on-color 1,09), e non basta nemmeno
   * far cambiare colore all'etichetta secondo il fondo, perché sopra i 61 seggi
   * l'etichetta cade quasi sempre A METÀ — misurato a 69, 72 e 79 — con una parte su
   * ciascun fondo. Da qui la targhetta: un fondo --wash solido sotto il testo. */
  function rgb(h){ h = h.replace('#',''); return [0,2,4].map(i => parseInt(h.substr(i,2),16)); }
  function lin(v){ v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); }
  function lum(t){ return 0.2126*lin(t[0]) + 0.7152*lin(t[1]) + 0.0722*lin(t[2]); }
  function rap(a, b){ const A = lum(rgb(a)), B = lum(rgb(b)); return (Math.max(A,B)+0.05)/(Math.min(A,B)+0.05); }
  function vars(b){ const o = {}; for (const m of b.matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{3,8})/g)) o[m[1]] = m[2]; return o; }
  const CH = vars(html.match(/#kn26\{([\s\S]*?)\n\}/)[1]);
  const SC = Object.assign({}, CH, vars(html.match(/#kn26\.scuro\{([\s\S]*?)\}/)[1]));

  const regolaThl = (css.match(/#kn26 \.gauge \.thl\{[^}]*\}/) || [''])[0];
  esito(/background:var\(--wash\)/.test(regolaThl),
    'l\'etichetta della soglia porta una targhetta --wash sotto il testo', regolaThl.slice(0, 90));
  esito(/padding:/.test(regolaThl), 'la targhetta ha un margine interno, o sarebbe invisibile');
  [['chiaro', CH], ['scuro', SC]].forEach(function(t){
    const nome = t[0], V = t[1];
    const fondi = [['--wash', V.wash], ['--neg', V.neg], ['--pos', V.pos]];
    /* senza targhetta: nessuna tinta singola regge su tutti e tre */
    const nudo = Math.min.apply(null, fondi.map(f => rap(V.mute, f[1])));
    esito(nudo < 4.5,
      'tema ' + nome + ': senza targhetta l\'etichetta sul fondo peggiore sta sotto 4,5 — la targhetta serve',
      nudo.toFixed(2));
    /* con la targhetta: il testo sta sempre su --wash, e la targhetta si stacca dai fondi */
    esito(rap(V.mute, V.wash) >= 4.5,
      'tema ' + nome + ': il testo sulla targhetta regge 4,5', rap(V.mute, V.wash).toFixed(2));
    const targMin = Math.min.apply(null, fondi.slice(1).map(f => rap(V.wash, f[1])));
    esito(targMin >= 3,
      'tema ' + nome + ': la targhetta si stacca dal riempimento in entrambi gli stati (≥3)',
      targMin.toFixed(2));
    /* il tratto, stessa storia: nudo non regge, con l'alone sì */
    const trattoNudo = Math.min.apply(null, fondi.map(f => rap(V.ink, f[1])));
    esito(trattoNudo < 3, 'tema ' + nome + ': il tratto nudo sul riempimento sta sotto 3',
      trattoNudo.toFixed(2));
  });
  const regolaTh = (css.match(/#kn26 \.gauge \.th\{[^}]*\}/) || [''])[0];
  esito(/box-shadow:[^;}]*var\(--wash\)/.test(regolaTh),
    'il tratto della soglia porta l\'alone --wash, che è ciò che lo salva sul riempimento',
    regolaTh.slice(0, 90));

  /* ══ le scorciatoie del cambiamento: tre gradi distinti ══
   *
   * «Blocco del cambiamento» prometteva l'opposizione sionista e includeva già Ra'am: il
   * pulsante per la sola opposizione non esisteva. Ora i tre gradi sono distinti, e la
   * differenza è sostanziale — Ra'am ha gov:1 ed entra al governo, le altre liste arabe
   * hanno gov:0 e sostengono dall'esterno. */
  function selezionate(){
    return [].slice.call($('k-chips').querySelectorAll('.chip.on')).map(b => b.dataset.p).sort();
  }
  function preset(p){ D.querySelector('[data-pre="' + p + '"]')
    .dispatchEvent(new W.MouseEvent('click',{bubbles:true})); return selezionate(); }
  A.calcola(); A.rChips();

  const zionista = ['byachad','democratici','yashar','beitenu'].sort();
  esito(JSON.stringify(preset('cambio')) === JSON.stringify(zionista),
    '«Blocco del cambiamento» seleziona la sola opposizione sionista, senza Ra\'am',
    JSON.stringify(preset('cambio')));
  const conRaam = zionista.concat(['raam']).sort();
  esito(JSON.stringify(preset('cambio_raam')) === JSON.stringify(conRaam),
    '«Cambiamento + Ra\'am» aggiunge Ra\'am e nient\'altro',
    JSON.stringify(preset('cambio_raam')));
  const conArabi = preset('cambio_ar');
  esito(conRaam.every(i => conArabi.indexOf(i) >= 0) && conArabi.length > conRaam.length,
    '«Cambiamento + liste arabe» contiene i precedenti e aggiunge le altre liste arabe',
    JSON.stringify(conArabi));
  esito(conArabi.some(i => A.P()[i] && !A.P()[i].gov),
    'e le liste che aggiunge sono quelle con gov:0, che sostengono dall\'esterno',
    JSON.stringify(conArabi.filter(i => A.P()[i] && !A.P()[i].gov)));
  esito(preset('cambio_raam').indexOf('raam') >= 0 && preset('cambio').indexOf('raam') < 0,
    'i tre gradi sono davvero distinti: Ra\'am separa il primo dal secondo');
  esito(D.querySelectorAll('[data-pre]').length === 6,
    'le scorciatoie sono sei', String(D.querySelectorAll('[data-pre]').length));
  preset('clear');
  esito(selezionate().length === 0, '«Azzera» le toglie tutte');

  /* ══ LA SELEZIONE DI APERTURA E LA SCORCIATOIA SONO LA STESSA COSA ═══════════
   *
   * Fino al 22 agosto 2026 erano due: una riga che scriveva
   * COAL={likud:1,shas:1,utj:1,sionismo_rel:1,otzma:1} alla partenza, e la stessa
   * lista, identica, dentro il gestore della scorciatoia. Due strade per lo stesso
   * valore e nessuna prova che le legasse — la quarta volta in questo progetto dopo i
   * token di blocco, l'anagrafica delle liste e l'etichetta dei marcatori.
   * La pagina si apriva su cinque pastiglie premute e 51 seggi con NESSUNA scorciatoia
   * accesa: uno stato senza provenienza. E l'8 settembre, quando una lista entra nel
   * blocco, si aggiorna il preset e la partenza resta indietro: la pagina si aprirebbe
   * su una coalizione che nessun pulsante sa riprodurre.
   * Questa è la prova che le lega. */
  /* L'ASSERZIONE DAVA PER SCONTATO CHE OGNI LISTA DEL BLOCCO ABBIA SEGGI, ed è vera oggi e
     falsa per giorni. `apertura` è l'insieme DICHIARATO; il pulsante restituisce le
     pastiglie RESE, e una lista senza seggi non ha pastiglia — rChips monta solo quelle che
     ne hanno. Le due cose coincidono finché ogni lista del blocco è sopra zero.
     Dall'8 settembre non coincidono più: una lista depositata entra in P{} il giorno del
     deposito e prende seggi solo quando un sondaggio la nomina, e in mezzo passano giorni —
     la settimana in cui la mappa cambia, cioè quella in cui questa suite serve di più.
     Trovato il 26 agosto 2026 nella prova di regia su «Popolo d'Israele»: mappata la lista,
     apertura dava sei id e il pulsante cinque, e la prova cadeva su un difetto che non c'era.
     La proprietà giusta è: il pulsante riproduce la selezione di apertura RISTRETTA alle
     liste che hanno una pastiglia. Il legame fra apertura e PRESET resta intero e si prova
     sotto, sugli insiemi dichiarati, dove i seggi non c'entrano. */
  const conSeggi = i => (A.SEG()[i] || 0) > 0;
  const APERTURA = A.apertura.slice().sort();
  const DAL_PULSANTE = preset('netanyahu');
  esito(JSON.stringify(APERTURA.filter(conSeggi)) === JSON.stringify(DAL_PULSANTE),
    'premendo «Blocco Netanyahu» si ottiene la selezione di apertura, per le liste che hanno seggi',
    'apertura ' + JSON.stringify(APERTURA) + ' · pulsante ' + JSON.stringify(DAL_PULSANTE));
  /* e OGGI coincidono per intero: senza questa riga il filtro qui sopra potrebbe nascondere
     una divergenza vera dietro «tanto è una lista senza seggi» */
  esito(APERTURA.every(conSeggi),
    'e oggi ogni lista del blocco ha seggi, quindi il filtro non sta nascondendo niente',
    JSON.stringify(APERTURA.filter(i => !conSeggi(i))));

  /* ══ LA FINESTRA DELL'8 SETTEMBRE, ESERCITATA ══
     Lo stato va ACCESO, o questa prova passa a vuoto guardando la pagina di sempre: si
     porta a zero i seggi di una lista del blocco e si pretende che le due strade dicano
     ancora la stessa cosa. È la configurazione che nella settimana del deposito è normale. */
  {
    const seggiVeri = Object.assign({}, A.SEG());
    const vittima = APERTURA.filter(conSeggi)[0];
    const finti = Object.assign({}, seggiVeri); delete finti[vittima];
    A.setSEG(finti); A.rChips();
    const dopo = preset('netanyahu');
    esito(dopo.indexOf(vittima) < 0,
      'con una lista del blocco a zero seggi la sua pastiglia non c\'è', vittima);
    esito(JSON.stringify(A.apertura.slice().sort().filter(i => (finti[i] || 0) > 0)) ===
          JSON.stringify(dopo),
      'e il pulsante riproduce lo stesso la selezione di apertura: la finestra del deposito regge',
      'atteso ' + JSON.stringify(A.apertura.slice().sort().filter(i => (finti[i] || 0) > 0)) +
      ' · ottenuto ' + JSON.stringify(dopo));
    esito(A.PRESET().netanyahu.indexOf(vittima) >= 0,
      'e la lista senza seggi resta nel preset: è fuori dallo schermo, non fuori dal blocco');
    A.setSEG(seggiVeri); A.rChips(); preset('netanyahu');
  }
  esito(JSON.stringify(A.PRESET().netanyahu.slice().sort()) === JSON.stringify(APERTURA),
    'e tutte e due vengono da PRESET.netanyahu, che è l\'unico posto in cui è scritta',
    JSON.stringify(A.PRESET().netanyahu));
  /* E PRESET.netanyahu non è scritto nemmeno lui: è il filtro sull'anagrafica, dove il
     blocco di ciascuna lista è già dichiarato. Riscriverlo come elenco sarebbe una copia
     di P{}, e l'8 settembre se ne aggiornerebbe una sola — la struttura non lo vieta,
     perché dentro PRESET un elenco è lecito: lo lega questa. */
  const daAnagrafica = Object.keys(A.P()).filter(i => A.P()[i].b === 'coalizione').sort();
  esito(JSON.stringify(A.PRESET().netanyahu.slice().sort()) === JSON.stringify(daAnagrafica),
    'e PRESET.netanyahu è il filtro sull\'anagrafica, non una quarta copia della stessa lista',
    'preset ' + JSON.stringify(A.PRESET().netanyahu.slice().sort()) +
    ' · anagrafica ' + JSON.stringify(daAnagrafica));

  /* ══ LA SCORCIATOIA ACCESA SI DEDUCE, NON SI RICORDA ═════════════════════════ */
  const scorciatoie = () => [].slice.call(D.querySelectorAll('[data-pre]'));
  const accese = () => scorciatoie().filter(b => b.classList.contains('on')).map(b => b.dataset.pre);

  A.rChips();
  esito(JSON.stringify(accese()) === '["netanyahu"]',
    'premuta una scorciatoia, quella e solo quella risulta accesa', JSON.stringify(accese()));
  esito(scorciatoie().filter(b => b.getAttribute('aria-pressed') === 'true').length === 1,
    'e aria-pressed lo dichiara su una sola',
    JSON.stringify(scorciatoie().map(b => b.dataset.pre + '=' + b.getAttribute('aria-pressed'))));

  /* Cambiare UNA pastiglia deve spegnerla: se restasse accesa affermerebbe che la
     selezione è quella composizione, e non lo è più. È il motivo per cui lo stato è
     dedotto dal confronto degli insiemi e non ricordato dall'ultimo clic. */
  click(chipDi('otzma'));
  esito(accese().length === 0,
    'togliendo una lista la scorciatoia si SPEGNE: non può affermare una composizione che non è più quella',
    JSON.stringify(accese()));
  esito(scorciatoie().every(b => b.getAttribute('aria-pressed') !== 'true'),
    'e nessuna resta a dichiararsi premuta');
  /* e rimettendola si riaccende: «questa selezione è il blocco Netanyahu» o è vero o no */
  click(chipDi('otzma'));
  esito(JSON.stringify(accese()) === '["netanyahu"]',
    'rimettendola si riaccende: lo stato segue la selezione, in tutti e due i versi',
    JSON.stringify(accese()));
  /* e ricomponendola a mano da zero, senza mai premere la scorciatoia */
  preset('clear');
  esito(accese().length === 0, 'azzerando non resta accesa nessuna composizione');
  A.PRESET().netanyahu.forEach(i => { if (A.SEG()[i]) click(chipDi(i)); });
  esito(JSON.stringify(accese()) === '["netanyahu"]',
    'ricomposta a mano, la scorciatoia si accende senza che sia stata premuta',
    JSON.stringify(accese()));

  /* «Azzera» nomina un'AZIONE, non una composizione: su un nome che dice l'azione
     aria-pressed direbbe il contrario di quel che si legge. È la stessa grammatica già
     scelta per «Escludi / Includi» nell'house effect. */
  const azzera = D.querySelector('[data-pre="clear"]');
  esito(!azzera.hasAttribute('aria-pressed'),
    '«Azzera» non porta aria-pressed: nomina un\'azione, non uno stato',
    azzera.getAttribute('aria-pressed'));
  preset('clear');
  esito(!azzera.classList.contains('on') && !azzera.hasAttribute('aria-pressed'),
    'e non si accende nemmeno quando la selezione è vuota');
  /* le altre cinque invece lo portano sempre, acceso o spento: dichiarano una cosa */
  esito(scorciatoie().filter(b => b.dataset.pre !== 'clear')
        .every(b => b.getAttribute('aria-pressed') === 'true' || b.getAttribute('aria-pressed') === 'false'),
    'le altre cinque dichiarano sempre il proprio stato, acceso o spento',
    JSON.stringify(scorciatoie().map(b => b.dataset.pre + '=' + b.getAttribute('aria-pressed'))));

  /* Il confronto è sulle liste CON SEGGI, e serve un caso in cui la differenza si veda:
     oggi tutte le liste del blocco ne hanno, quindi togliere il filtro non cambierebbe
     nulla e la mutazione passerebbe. Qui una lista del preset viene privata dei seggi —
     è quello che succede a una lista che il modello non elegge più — e la scorciatoia
     deve accendersi lo stesso sulle rimanenti, perché sono tutte quelle selezionabili.
     Senza il filtro resterebbe spenta per sempre. */
  const salvaSEG = A.SEG();
  const senzaSeggi = Object.assign({}, salvaSEG); senzaSeggi.otzma = 0;
  A.setSEG(senzaSeggi);
  A.setCOAL({}); A.PRESET().netanyahu.forEach(i => { if (senzaSeggi[i]) A.COAL()[i] = true; });
  A.rChips();
  esito(JSON.stringify(accese()) === '["netanyahu"]',
    'una lista del blocco senza seggi non spegne la scorciatoia: il confronto guarda le liste selezionabili',
    JSON.stringify(accese()));
  /* E il caso limite che rende necessaria la guardia sulla selezione vuota: se TUTTE le
     liste di una composizione perdessero i seggi, il suo elenco filtrato sarebbe vuoto
     come la selezione, e la scorciatoia si accenderebbe su niente — dichiarando che una
     selezione vuota È il blocco Netanyahu. Non è un'ipotesi di scuola: è quello che
     succede a un blocco che il modello smette di eleggere. */
  const azzerato = Object.assign({}, salvaSEG);
  A.PRESET().netanyahu.forEach(i => { azzerato[i] = 0; });
  A.setSEG(azzerato); A.setCOAL({}); A.rChips();
  esito(accese().length === 0,
    'con la selezione vuota nessuna scorciatoia si accende, nemmeno una rimasta senza liste',
    JSON.stringify(accese()));
  A.setSEG(salvaSEG); A.setCOAL({}); A.rChips();

  /* mai due accese insieme: due composizioni distinte non possono essere la stessa */
  const doppie = [];
  ['netanyahu','cambio','cambio_raam','cambio_ar','unita'].forEach(function(n){
    preset(n); if (accese().length > 1) doppie.push(n + '→' + accese().join('+'));
  });
  esito(doppie.length === 0, 'non se ne accendono mai due insieme', doppie.join(' · '));

  console.log('\nsimulatore: ' + ok + '/' + (ok + ko));
  if (ko) process.exit(1);
}, 3000);
