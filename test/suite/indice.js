/* L'indice: la voce accesa dev'essere INTERAMENTE visibile nel nastro.
 *
 * Perché serve. Sotto i 660 la fascia dell'indice è uno scorrevole orizzontale
 * (flex-wrap:nowrap; overflow-x:auto). Misurato su browser a 380: il nastro è largo
 * 1891px in una finestra da 358 — il 18,9% visibile, 1533px fuori — e `scrollLeft`
 * restava ZERO per sempre, perché niente lo muoveva. Dalla terza sezione in poi la
 * pastiglia accesa stava fra x 276 e x 1713: l'indice segnalava dove sei su un nastro
 * che non lo mostrava. Su undici punti di scorrimento campionati, otto avevano la voce
 * attiva fuori schermo.
 *
 * Perché la prova è fatta così. jsdom NON fa layout: rettangoli, scrollWidth e
 * clientWidth valgono zero, e `scrollLeft` sul prototipo è un no-op. Quindi la
 * geometria viene INIETTATA sugli elementi con le misure vere prese dal browser il
 * 22 agosto 2026 (larghezze e posizioni delle undici voci, finestra 358, nastro 1891),
 * e il nastro finto si comporta come uno vero: il rettangolo di ogni voce dipende dallo
 * scrollLeft corrente. Così la prova esercita l'ARITMETICA di inVista(), che è la sola
 * cosa che può sbagliare, e la esercita da qualunque posizione di partenza.
 *
 * Il callback dell'IntersectionObserver viene catturato da un osservatore finto: il
 * codice sotto prova è quello vero, non una copia.
 */
const {JSDOM} = require('jsdom');
const fs = require('fs');

let ok = 0, ko = 0;
function esito(cond, desc, dettaglio){
  if (cond) { ok++; console.log('OK ' + desc); }
  else { ko++; console.log('KO ' + desc + (dettaglio ? ' — ' + dettaglio : '')); }
}

/* ── geometria misurata su browser a 380px, tema chiaro, transizioni spente ──
   x = posizione della voce dentro il nastro; w = larghezza resa. */
const VOCI = [
  {x:   0.0, w:182.0}, {x: 186.0, w: 86.7}, {x: 276.6, w:155.6}, {x: 436.2, w:158.2},
  {x: 598.4, w:187.0}, {x: 789.4, w:182.6}, {x: 976.0, w:263.6}, {x:1243.6, w:111.3},
  {x:1358.9, w:216.7}, {x:1579.6, w:129.3}, {x:1713.0, w:178.4}
];
const FINESTRA = 358;      /* nav.clientWidth a 380 */
const NASTRO   = 1891;     /* nav.scrollWidth a 380 */

const dom = new JSDOM('<!doctype html><html><body><div id="kn26"></div></body></html>', {pretendToBeVisual:true});
const W = dom.window, D = W.document;
global.DOMParser = W.DOMParser;
const html = fs.readFileSync('../../index.html','utf8');
D.body.innerHTML = html.replace(/<script>[\s\S]*?<\/script>/g,'')
  .match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
global.document = D; global.window = W;
W.matchMedia = () => ({matches:false, addEventListener(){}, addListener(){}});

/* osservatore finto che cattura il callback vero */
let CB = null; const OSSERVATI = [];
W.IntersectionObserver = class {
  constructor(cb){ this.cb = cb; if (!CB) CB = cb; }
  observe(t){ if (this.cb === CB) OSSERVATI.push(t); }
  unobserve(){}
};
global.IntersectionObserver = W.IntersectionObserver;
W.requestAnimationFrame = f => f();
W.localStorage = {getItem:()=>null, setItem(){}, removeItem(){}};
global.getComputedStyle = () => ({getPropertyValue:()=>''});
global.Blob = function(){};
global.URL = {createObjectURL(){ return ''; }};
global.FileReader = function(){};
global.fetch = () => Promise.reject(0);

eval(fs.readFileSync(__dirname + '/../app.js','utf8'));

setTimeout(function(){
  const nav = D.getElementById('k-idx');
  const voci = nav ? Array.prototype.slice.call(nav.querySelectorAll('a')) : [];

  esito(!!nav && voci.length === 11, 'l\'indice è costruito con undici voci', voci.length + ' voci');
  esito(!!CB, 'il callback dell\'osservatore è stato catturato');
  esito(OSSERVATI.length === 11, 'tutte le sezioni sono osservate', OSSERVATI.length + ' osservate');
  if (!nav || voci.length !== 11 || !CB) { console.log('KO impossibile proseguire'); process.exitCode = 1; return; }

  /* ── il nastro finto: si comporta come uno scorrevole vero ── */
  let SL = 0, finestra = FINESTRA, nastro = NASTRO, scritture = 0;
  Object.defineProperty(nav, 'scrollLeft',  {get:function(){return SL;}, set:function(v){SL = v; scritture++;}, configurable:true});
  Object.defineProperty(nav, 'clientWidth', {get:function(){return finestra;}, configurable:true});
  Object.defineProperty(nav, 'scrollWidth', {get:function(){return nastro;}, configurable:true});
  nav.getBoundingClientRect = function(){ return {left:0, right:finestra, width:finestra, top:0, bottom:33, height:33}; };
  voci.forEach(function(a, i){
    a.getBoundingClientRect = function(){ return {
      left: VOCI[i].x - SL, right: VOCI[i].x - SL + VOCI[i].w,
      width: VOCI[i].w, top:0, bottom:28, height:28}; };
  });
  /* La sbirciata misura l'INCHIOSTRO delle voci, non la pastiglia, e lo fa con un
     Range — che in jsdom esiste ma non ha getBoundingClientRect, perché non c'è layout.
     Glielo si dà, come si è già dato tutto il resto: il testo comincia a INCASSO dal
     bordo della pastiglia e finisce a INCASSO dall'altro (padding 11 + bordo 1 = 12,
     misurato sulla pagina). Senza questo la sbirciata sarebbe codice che nessuna prova
     esercita, cioè la cosa contro cui il progetto mette in guardia. */
  const INCASSO = 12;
  W.Range.prototype.getBoundingClientRect = function(){
    const a = this.startContainer, i = voci.indexOf(a);
    if (i < 0) return {left:0, right:0, width:0, top:0, bottom:0, height:0};
    const x = VOCI[i].x + INCASSO - SL, w = VOCI[i].w - 2*INCASSO;
    return {left:x, right:x+w, width:w, top:0, bottom:28, height:28};
  };

  const accendi = i => CB([{isIntersecting:true, target: OSSERVATI[i]}]);
  const accesa  = () => voci.findIndex(a => a.classList.contains('on'));
  /* Tolleranza di UN pixel, e non è lassismo: `scrollWidth` è un INTERO mentre i
     rettangoli sono frazionari. Il nastro misura 1891 di scrollWidth ma l'ultima voce
     finisce a 1891,4, quindi nessun valore di scrollLeft può mostrarne l'ultimo mezzo
     pixel — è un limite dell'API, non del codice. Il difetto che questa prova esiste
     per tenere chiuso valeva 1533px, non 0,4. */
  const dentro  = i => VOCI[i].x >= SL - 1 && VOCI[i].x + VOCI[i].w <= SL + finestra + 1;

  /* ── il difetto chiuso: ogni sezione porta la sua voce interamente in vista ── */
  const fuori = [], sbagliate = [], oltre = [];
  for (let i = 0; i < 11; i++) {
    accendi(i);
    if (accesa() !== i) sbagliate.push(i + 1);
    if (!dentro(i))     fuori.push((i + 1) + ' (voce ' + VOCI[i].x.toFixed(0) + '–' +
                                   (VOCI[i].x + VOCI[i].w).toFixed(0) + ', finestra ' +
                                   SL.toFixed(0) + '–' + (SL + finestra).toFixed(0) + ')');
    if (SL < 0 || SL > nastro - finestra + 0.01) oltre.push((i + 1) + ' scrollLeft=' + SL.toFixed(1));
  }
  esito(sbagliate.length === 0, 'a ogni sezione si accende la voce giusta', 'sbagliate: ' + sbagliate.join(', '));
  esito(fuori.length === 0, 'a ogni cambio di sezione la voce accesa è INTERAMENTE visibile',
    fuori.length + ' fuori: ' + fuori.join(' · '));
  esito(oltre.length === 0, 'lo scorrimento resta dentro i limiti del nastro', oltre.join(' · '));

  /* ── e non basta che ci arrivi: ci arriva da qualunque posizione di partenza ── */
  const daFermo = [];
  for (let i = 0; i < 11; i++) {
    [0, 500, 1200, NASTRO - FINESTRA].forEach(function(p){
      SL = p; accendi(i);
      if (!dentro(i)) daFermo.push('voce ' + (i+1) + ' da ' + p);
    });
  }
  esito(daFermo.length === 0, 'ci arriva da qualunque posizione di partenza del nastro',
    daFermo.join(' · '));

  /* ── la prima e l'ultima non lasciano un vuoto ai bordi ── */
  SL = 900; accendi(0);
  esito(SL === 0, 'la prima voce porta il nastro a filo di sinistra', 'scrollLeft=' + SL);
  SL = 0; accendi(10);
  esito(Math.abs(SL - (nastro - finestra)) < 0.01,
    'l\'ultima voce porta il nastro a filo di destra', 'scrollLeft=' + SL);

  /* ── la voce sta al centro quando c'è spazio dalle due parti ── */
  SL = 0; accendi(5);
  const centro = SL + finestra/2, mezzo = VOCI[5].x + VOCI[5].w/2;
  esito(Math.abs(centro - mezzo) < 0.51, 'la voce centrale viene centrata nella finestra',
    'centro finestra ' + centro.toFixed(1) + ', centro voce ' + mezzo.toFixed(1));

  /* ── sopra i 660 il nastro va a capo e NON scorre: non si tocca ──
     È la metà della regola che una prova sul solo caso stretto lascerebbe scoperta:
     lì muovere scrollLeft sarebbe scorrere qualcosa che nessuno ha chiesto di scorrere.
     Si contano le SCRITTURE e non il valore finale: senza la guardia il serraggio
     riporterebbe comunque a zero, la prova resterebbe verde e la guardia potrebbe
     sparire senza che nessuno se ne accorga. Mutata: togliendo la guardia cade. */
  SL = 0; finestra = 720; nastro = 720; scritture = 0;
  const mosso = [];
  for (let i = 0; i < 11; i++) { accendi(i); if (SL !== 0) mosso.push(i + 1); }
  esito(mosso.length === 0, 'dove il nastro non scorre il nastro non si sposta',
    'mosso su ' + mosso.join(', '));
  esito(scritture === 0, 'dove il nastro non scorre, scrollLeft non viene proprio scritto',
    scritture + ' scritture');
  finestra = FINESTRA; nastro = NASTRO;

  /* ── una voce più larga della finestra si allinea a sinistra, non si centra ──
     Non succede oggi (la più larga è 263,6 su 358) ma può succedere l'8 settembre, se
     una lista nuova allunga un titolo di sezione: centrare lascerebbe fuori il NUMERO,
     che è l'inizio del nome e il solo appiglio per capire a che punto si è. */
  SL = 0; finestra = 150;
  accendi(6);   /* larga 263,6 */
  esito(Math.abs(SL - VOCI[6].x) < 0.01,
    'una voce più larga della finestra si allinea a sinistra',
    'scrollLeft=' + SL.toFixed(1) + ', voce a ' + VOCI[6].x);
  finestra = FINESTRA;

  /* ══ LA SBIRCIATA GARANTITA ═══════════════════════════════════════════════
     Tolta la barra di scorrimento, il solo segnale che il nastro continua è la
     pastiglia tagliata al bordo. Misurato sulle undici posizioni di riposo, cioè venti
     bordi: una pastiglia tagliata si vede in 20 su 20, ma il TESTO tagliato solo in
     19 — alla sezione 3 il bordo sinistro cade dentro l'imbottitura di coda della
     prima voce e si vedono 6,6px di NIENTE, mentre la seconda resta intera, così il
     nastro sembra cominciare lì. La sbirciata sposta lo scorrimento quel tanto che
     basta, e non sposta nient'altro. */
  const SBIRCIA = 18;
  /* la parte della scatola d'inchiostro tagliata dal bordo che cade DENTRO la finestra:
     è la stessa misura ai due bordi, quindi non c'è nessun verso da sbagliare */
  const testoAlBordo = bordo => {
    let v = 0;
    VOCI.forEach((_, i) => {
      const tx = VOCI[i].x + INCASSO, tw = VOCI[i].w - 2*INCASSO;
      if (!(tx < bordo && tx + tw > bordo)) return;
      v = Math.max(0, Math.min(tx + tw, SL + finestra) - Math.max(tx, SL));
    });
    return v;
  };
  function giroSbirciata(){
    const deboli = [], scoperte = [];
    for (let i = 0; i < 11; i++) {
      accendi(i);
      if (SL > 0.5 && testoAlBordo(SL) < SBIRCIA)
        deboli.push('sez ' + (i+1) + ' a sinistra: ' + testoAlBordo(SL).toFixed(1) + 'px');
      if (SL < nastro - finestra - 0.5 && testoAlBordo(SL + finestra) < SBIRCIA)
        deboli.push('sez ' + (i+1) + ' a destra: ' + testoAlBordo(SL+finestra).toFixed(1) + 'px');
      if (!dentro(i)) scoperte.push('sez ' + (i+1));
    }
    return {deboli, scoperte};
  }
  let G = giroSbirciata();
  esito(G.deboli.length === 0,
    'a ogni bordo dove c\'è ancora nastro si vedono almeno ' + SBIRCIA + 'px di testo vicino',
    G.deboli.join(' · '));
  /* IL VINCOLO CHE RENDE SICURA LA SBIRCIATA: non deve MAI scoprire la voce attiva.
     È la ragione per cui è serrata fra le due posizioni estreme che la tengono intera. */
  esito(G.scoperte.length === 0,
    'e la voce attiva resta INTERA: la sbirciata non la scopre mai', G.scoperte.join(' · '));

  /* ── e lo stesso in una finestra STRETTA, dove il serraggio morde davvero ──
     Con la finestra da 358 lo slittamento disponibile vale fra 47,2 e 135,6px e ne
     servono 22: il serraggio non tocca mai il risultato, quindi una prova alla sola
     larghezza vera NON farebbe cadere una mutazione che lo toglie — verificato, non
     supposto. A 240 il margine si assottiglia, il serraggio comincia a mordere e la
     misura del testo al bordo incontra voci che sporgono davvero dal bordo: è lì che
     si vede se il verso della misura è quello giusto.
     Undici voci larghe fino a 263,6 in una finestra da 240: due sono più larghe della
     finestra, e per quelle vale la regola dell'allineamento a sinistra, non il
     centraggio — la prova le tratta come tratta l'altra. */
  finestra = 240; G = giroSbirciata();
  esito(G.scoperte.every(x => {
      const i = +x.replace('sez ','') - 1; return VOCI[i].w > finestra; }),
    'in finestra stretta la sbirciata non scopre nessuna voce che ci starebbe',
    G.scoperte.join(' · '));
  /* Lì la sbirciata NON si può sempre dare, ed è la scelta giusta: meglio nessun
     segnale che perdere la voce che il lettore sta cercando. E non si può nemmeno
     pretendere che li soddisfi tutti e due — a 240 i due bordi entrano in CONFLITTO,
     perché scoprire a sinistra ricopre a destra. Verificato scrivendo l'asserzione
     sbagliata prima di questa: «dove il bordo resta debole è perché il serraggio lo
     vietava» cadeva sulle sezioni 5, 6 e 9, e non per un difetto — per il conflitto.
     Quel che si pretende è il vincolo di sicurezza, e basta quello. */
  finestra = FINESTRA; accendi(0);
  /* agli estremi non si pretende niente dal lato dove non c'è più nastro */
  accendi(0);
  esito(SL === 0, 'alla prima voce la sbirciata non chiede niente a sinistra', 'scrollLeft=' + SL);
  accendi(10);
  esito(Math.abs(SL - (nastro - finestra)) < 0.01, 'e all\'ultima non chiede niente a destra', 'scrollLeft=' + SL);

  /* ── il nastro non è un punto di tabulazione suo: le voci lo sono ──
     Chrome rende raggiungibile col tabulatore uno scorrevole SOLO se non contiene
     elementi focalizzabili. Qui ce ne sono undici, quindi il nastro è escluso, e il
     fuoco su una voce lo fa scorrere da solo: verificato su browser, dando fuoco
     all'undicesima voce scrollLeft passa da 0 a 1533. */
  esito(!nav.hasAttribute('tabindex'),
    'il nastro non aggiunge un punto di tabulazione proprio');
  esito(voci.every(a => a.getAttribute('href') && a.getAttribute('href').charAt(0) === '#'),
    'ogni voce resta un collegamento raggiungibile da tastiera');

  if (ko) process.exitCode = 1;
}, 300);
