/* Le pastiglie dei veti e la loro riga di lettura, su un DOM vero.
 *
 * Prima erano <span> senza tabindex: da tastiera i veti non si potevano toccare affatto, e
 * la spiegazione passava dal `title`, cioè dal suggerimento nativo del browser. Ora sono
 * <button> e la spiegazione ha una riga sola, alimentata dal puntatore e dal fuoco.
 *
 * Le proprietà:
 *   · puntatore e fuoco portano alla STESSA riga, con lo stesso testo;
 *   · la riga NON si svuota all'uscita, e dal 22 agosto 2026 e' cosi' di proposito:
 *     vedi la prova sulla sequenza del tocco piu' sotto;
 *   · la riga dice motivazione, fonte quando c'è, e stato — lo stato fin qui passava solo
 *     dal barrato, che a un lettore di schermo non arriva;
 *   · nessun `title` residuo: una strada sola, non due che dicono la stessa cosa in tempi
 *     e posti diversi;
 *   · l'attivazione da tastiera funziona, e il fuoco sopravvive alla ricostruzione.
 *
 * Su invio e barra spaziatrice, una precisazione onesta: jsdom non implementa
 * l'attivazione predefinita: un keydown su un <button> lì non genera un click, quindi
 * simularlo proverebbe soltanto che sappiamo scrivere una simulazione. Quello che si
 * verifica è ciò che rende veri invio e barra in un browser: che l'elemento sia un
 * <button type="button"> tabulabile, che il click — l'evento che invio e barra generano —
 * disattivi davvero il veto, e che nessun gestore di tasti li intercetti. La prova sul
 * browser vero è stata fatta a mano, ed è riferita nel messaggio di consegna.
 *
 * DOM jsdom vero come emifiltro.js: qui si asserisce su elementi resi, e negli stub
 * `innerHTML` è una stringa che nessuno analizza mai.
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
  'global.A={render:render,sim:function(v){SIM=v;},VETI:function(){return VETI;},' +
  'invito:function(){return VETO_INVITO;},' +
  'off:function(){return VETO_OFF;}};carica().then(render,render)');
eval(src);

const $ = i => D.getElementById(i);
const pastiglie = () => [].slice.call($('k-veti').querySelectorAll('button[data-v]'));
const riga = () => $('k-vetol').textContent;
function evento(el, tipo){ el.dispatchEvent(new W.Event(tipo, {bubbles:false})); }
function click(el){ el.dispatchEvent(new W.MouseEvent('click', {bubbles:true})); }

setTimeout(function(){
  const A = global.A;
  A.sim(1000);
  const VETI = A.VETI();
  const VETO_INVITO = A.invito();

  /* ── la struttura del dato ── */
  esito(VETI.length === 14, 'quattordici veti in archivio', String(VETI.length));
  esito(VETI.every(v => v.length === 4),
    'ogni veto ha quattro campi: le due liste, la motivazione e la fonte',
    JSON.stringify([...new Set(VETI.map(v => v.length))]));
  esito(VETI.every(v => typeof v[3] === 'string'),
    'il campo fonte esiste sempre, anche quando è vuoto');
  esito(VETI.every(v => v[2] && v[2].trim()),
    'nessuna motivazione vuota');
  /* La riga di lettura è una sola: due pastiglie con lo stesso testo la lascerebbero
     immobile nel passaggio dall'una all'altra, e sembrerebbe bloccata invece che
     aggiornata. Fino alla revisione editoriale succedeva per due coppie su quattordici. */
  const ripetute = VETI.map(v => v[2]).filter((t,i,a) => a.indexOf(t) !== i);
  esito(ripetute.length === 0,
    'nessuna motivazione ripetuta: ogni pastiglia cambia davvero la riga',
    JSON.stringify([...new Set(ripetute)]));

  /* ── le pastiglie sono comandi veri ── */
  const p = pastiglie();
  esito(p.length === 14, 'quattordici pastiglie rese', String(p.length));
  esito(p.every(b => b.tagName === 'BUTTON' && b.type === 'button'),
    'ogni pastiglia è un <button type="button">, quindi tabulabile e attivabile da tastiera',
    JSON.stringify([].slice.call($('k-veti').children).map(x => x.tagName)
      .filter((x,i,a) => a.indexOf(x) === i)));
  /* Se le pastiglie non ci sono — o non sono più <button> — tutto il resto opererebbe su
     undefined e la suite morirebbe con un TypeError invece di riferire. Meglio fermarsi
     dicendo che cosa non è stato provato: un guasto deve leggersi come un guasto, non
     come un conteggio più basso. */
  if (!p.length){
    console.log('\nveti: ' + ok + '/' + (ok + ko) +
      ' — nessuna pastiglia <button> resa, i controlli successivi non sono stati eseguiti');
    process.exit(1);
  }
  esito(p.every(b => !b.hasAttribute('title')),
    'nessun title residuo: la spiegazione ha una strada sola',
    JSON.stringify(p.filter(b => b.hasAttribute('title')).map(b => b.dataset.v)));
  esito(p.every(b => b.getAttribute('aria-pressed') === 'true'),
    'a riposo tutti i veti risultano attivi, e lo dichiarano');
  esito(riga() === VETO_INVITO,
    'a riposo la riga porta l’invito, non il vuoto: sta sopra le pastiglie e un blocco ' +
    'vuoto da 4,4em fra il titolo e i veti sarebbe una lacuna, non una riserva',
    '"' + riga() + '"');

  /* ── il puntatore riempie la riga ── */
  const b0 = p[0];
  evento(b0, 'pointerenter');
  const daPuntatore = riga();
  esito(daPuntatore.indexOf(VETI[0][2]) >= 0,
    'il puntatore porta la motivazione nella riga', '"' + daPuntatore + '"');
  esito(/veto attivo/.test(daPuntatore),
    'la riga dichiara lo stato, che dal solo barrato non arrivava', '"' + daPuntatore + '"');
  evento(b0, 'pointerleave');
  esito(riga() === daPuntatore,
    'uscendo col puntatore la riga RESTA: è una didascalia, non uno stato transitorio',
    '"' + riga() + '"');

  /* ── il fuoco riempie LA STESSA riga, con lo stesso testo ── */
  b0.focus();
  const daFuoco = riga();
  esito(D.activeElement === b0, 'la pastiglia riceve davvero il fuoco');
  esito(daFuoco === daPuntatore && daFuoco !== '',
    'il fuoco porta alla stessa riga lo stesso testo del puntatore',
    'puntatore "' + daPuntatore + '" · fuoco "' + daFuoco + '"');
  b0.blur();
  esito(riga() === daFuoco, 'e resta anche perdendo il fuoco', '"' + riga() + '"');

  /* ── testi diversi per pastiglie diverse: la riga segue davvero la pastiglia ── */
  evento(p[0], 'pointerenter'); const t0 = riga();
  evento(p[0], 'pointerleave');
  evento(p[4], 'pointerenter'); const t4 = riga();
  evento(p[4], 'pointerleave');
  esito(t0 !== t4 && t4.indexOf(VETI[4][2]) >= 0,
    'pastiglie diverse portano testi diversi', '"' + t0 + '" · "' + t4 + '"');

  /* ── la fonte compare quando c'è, e non viene inventata quando manca ── */
  const conFonte = VETI.map((v,i) => [v,i]).filter(x => x[0][3]);
  if (conFonte.length){
    const i = conFonte[0][1];
    evento(p[i], 'pointerenter');
    esito(riga().indexOf(conFonte[0][0][3]) >= 0,
      'dove la fonte c\'è, la riga la mostra', '"' + riga() + '"');
    evento(p[i], 'pointerleave');
  } else {
    evento(p[0], 'pointerenter');
    esito(!/Fonte:/.test(riga()),
      'dove la fonte manca, la riga non la nomina e non se la inventa', '"' + riga() + '"');
    evento(p[0], 'pointerleave');
  }

  /* ── il click disattiva: è l'evento che invio e barra generano su un <button> ── */
  click(pastiglie()[0]);
  esito(A.off()[0] === true, 'il click disattiva il veto', JSON.stringify(A.off()));
  const dopo = pastiglie()[0];
  esito(dopo.getAttribute('aria-pressed') === 'false' && /off/.test(dopo.className),
    'la pastiglia disattivata lo dichiara, non solo col barrato',
    dopo.getAttribute('aria-pressed') + ' · ' + dopo.className);
  esito(D.activeElement === dopo,
    'dopo la ricostruzione il fuoco torna sulla pastiglia, o la tastiera resterebbe a piedi',
    D.activeElement ? D.activeElement.tagName + '/' + (D.activeElement.dataset||{}).v : 'nessuno');
  esito(/veto disattivato/.test(riga()),
    'la riga si riscrive con lo stato aggiornato', '"' + riga() + '"');

  /* ── e nessun gestore di tasti intercetta invio o barra ──
     è ciò che, in un browser, lascia al <button> il compito di generare il click */
  ['Enter',' '].forEach(function(k){
    const ev = new W.KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true});
    pastiglie()[0].dispatchEvent(ev);
    esito(ev.defaultPrevented === false,
      'nessuno intercetta il tasto ' + (k === ' ' ? 'barra spaziatrice' : k));
  });

  click(pastiglie()[0]);
  esito(A.off()[0] === false, 'un secondo click riattiva il veto', JSON.stringify(A.off()));

  /* ══ LA SEQUENZA VERA DI UN TOCCO ═══════════════════════════════════════════
     Il difetto stava nell'ORDINE, non in nessun evento preso da solo: ciascuno dei
     quattro gestori era corretto rispetto a se stesso, ed erano proprio quelli che le
     prove qui sopra verificavano una alla volta.
     Un dito in Chrome produce: pointerover, pointerenter, pointerdown, pointerup,
     click, pointerout, pointerleave — e il click, in mezzo, ricostruisce le pastiglie
     e rimette il fuoco. Tracciata il 22 agosto 2026 su browser: la riga si riempiva al
     primo evento, il focus() la riscriveva con lo stato NUOVO al quinto, e il
     pointerleave la cancellava al settimo. Chi tocca otteneva un veto commutato e una
     riga vuota, 367px piu' in basso di dove aveva premuto.
     Questa prova non guarda i gestori: guarda che cosa resta scritto dopo l'intera
     sequenza. E il pointerleave si manda al nodo VECCHIO e al nuovo, perche' il click
     ha ricostruito le pastiglie in mezzo e il browser puo' consegnarlo all'uno o
     all'altro: la proprieta' deve reggere in tutti e due i casi. */
  const tocco = function(indice){
    const passi = [];
    const q = function(){ return pastiglie()[indice]; };
    const segna = function(t){ passi.push({passo:t, riga:riga(),
      premuto:q() ? q().getAttribute('aria-pressed') : null}); };
    /* jsdom non implementa PointerEvent, e qui non serve: nessuno dei gestori guarda
       dentro l'evento — non c'è nessun ramo su pointerType, ed è il punto. Quel che si
       riproduce è la SEQUENZA, che è dove stava il difetto. */
    const tocca = function(el,t){ el.dispatchEvent(new W.Event(t,{bubbles:true, cancelable:true})); };
    let b = q();
    segna('0 · a riposo');
    tocca(b,'pointerover'); b.dispatchEvent(new W.Event('pointerenter',{bubbles:false}));
    segna('1 · dito appoggiato');
    tocca(b,'pointerdown'); segna('2 · premuto');
    tocca(b,'pointerup');   segna('3 · rilasciato');
    click(b);               segna('4 · click: il veto commuta');
    const nuovo = q();
    b.dispatchEvent(new W.Event('pointerleave',{bubbles:false}));
    if (nuovo && nuovo !== b) nuovo.dispatchEvent(new W.Event('pointerleave',{bubbles:false}));
    segna('5 · dito sollevato');
    return {passi, nuovo:nuovo, vecchio:b};
  };

  const T = tocco(3);
  const motivo = VETI[3][2];
  esito(T.passi[1].riga.indexOf(motivo) >= 0,
    'al tocco la spiegazione compare PRIMA che il veto commuti',
    '"' + T.passi[1].riga.slice(0,60) + '"');
  esito(T.passi[4].premuto === 'false' && /veto disattivato/.test(T.passi[4].riga),
    'al click la riga si riscrive con lo stato nuovo',
    T.passi[4].premuto + ' · "' + T.passi[4].riga.slice(0,60) + '"');
  esito(T.passi[5].riga === T.passi[4].riga,
    'e QUANDO IL DITO SI SOLLEVA la spiegazione resta: è il difetto che questa prova tiene chiuso',
    '"' + T.passi[5].riga.slice(0,60) + '"');
  esito(T.passi[5].riga.indexOf(motivo) >= 0 && T.passi[5].riga !== VETO_INVITO,
    'alla fine della sequenza resta la motivazione del veto toccato, non l’invito',
    '"' + T.passi[5].riga.slice(0,60) + '"');
  esito(T.vecchio !== T.nuovo,
    'la pastiglia viene davvero ricostruita in mezzo alla sequenza: è la ragione per cui ' +
    'i singoli eventi non bastano a provarla');
  /* e un secondo tocco sulla stessa pastiglia riporta il veto com'era, senza vuoti */
  const T2 = tocco(3);
  esito(T2.passi[5].riga.indexOf(motivo) >= 0 && /veto attivo/.test(T2.passi[5].riga),
    'un secondo tocco riattiva e la riga lo dice, sempre senza svuotarsi',
    '"' + T2.passi[5].riga.slice(0,60) + '"');

  /* ── l'invito non deve mai sovrascrivere una spiegazione ──
     rVeti() gira a OGNI render — basta muovere un cursore — e scrivere l'invito senza
     guardare cancellerebbe la spiegazione che il lettore sta leggendo: sarebbe il
     difetto appena chiuso, rientrato dalla finestra. Per questo si scrive solo se la
     riga è vuota, e per questo la prova esercita un render vero in mezzo. */
  evento(pastiglie()[7], 'pointerenter');
  const primaDelRender = riga();
  esito(primaDelRender.indexOf(VETI[7][2]) >= 0, 'la settima pastiglia scrive la sua riga',
    '"' + primaDelRender.slice(0,60) + '"');
  A.render();
  esito(riga() === primaDelRender,
    'un render completo non cancella la spiegazione rimettendo l’invito',
    '"' + riga().slice(0,60) + '"');
  esito(riga() !== VETO_INVITO,
    'e in particolare non è tornata a essere l’invito', '"' + riga().slice(0,40) + '"');

  /* ── e la riga sta SOPRA le pastiglie ──
     Misurato su browser: quattordici pastiglie su nove righe per 360px, e la riga
     stava 367px sotto la prima fila. Sopra, ne dista 9. jsdom non fa layout: quello
     che si prova qui e' l'ORDINE nel documento, che e' la causa di quella distanza. */
  const rigaEl = $('k-vetol'), contEl = $('k-veti');
  esito(!!(rigaEl.compareDocumentPosition(contEl) & 4),
    'la riga di lettura precede le pastiglie nel documento',
    'posizione ' + rigaEl.compareDocumentPosition(contEl));
  esito(rigaEl.parentNode === contEl.parentNode,
    'e le sta accanto, nello stesso riquadro');

  console.log('\nveti: ' + ok + '/' + (ok + ko));
  if (ko) process.exit(1);
}, 3000);
