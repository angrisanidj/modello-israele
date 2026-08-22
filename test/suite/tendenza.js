/* L'asse e i mesi del grafico della tendenza, ai due punti di rottura.
 *
 * Il difetto, misurato a 380 il 22 agosto 2026. Il grafico portava le stesse due densità
 * a tutte le larghezze:
 *   · SEDICI etichette sull'asse dei seggi (8→68, passo 4) a 11,66px di corpo su un
 *     passo di 10,22px: l'inchiostro è alto 8,15 e fra un'etichetta e la successiva
 *     restavano 2,07px. La colonna dei numeri si leggeva come un blocco continuo;
 *   · OTTO etichette dei mesi, con «mag» larga 22,98px e un passo minimo di 23,07:
 *     0,09px di margine, cioè si toccavano.
 *
 * Il rimedio sono due costanti per punto di rottura — PASSOY e SALTAMESI — accanto a W,
 * Lm, Rm, T0, B e FS, che il grafico aveva già: nessun meccanismo nuovo. È la stessa
 * forma della scala del carattere degli istogrammi, e questa prova la lega al punto di
 * rottura allo stesso modo: SOPRA i 660 non deve cambiare niente.
 *
 * Due cose che questa prova tiene, e che non sono l'aritmetica del passo:
 *
 * 1 · IL PASSO 8 SI SCEGLIE SULLA LINEA DEL 61, non sui numeri tondi. Il grafico va da 8
 *     a 68, cioè 2,55px reali per seggio: col passo 4 il filetto del 60 cade a 2,55px
 *     dalla linea tratteggiata della maggioranza — due righe orizzontali quasi
 *     coincidenti, e una è il riferimento per cui il grafico esiste. Col passo 8 i
 *     filetti più vicini sono 56 e 64, a 7,65px. Misurati anche 10 e 12, che darebbero
 *     valori più tondi: tutti e due tengono il filetto del 60, quindi conservano la
 *     quasi-coincidenza, e lasciano scoperti 8 seggi in alto invece di 4.
 * 2 · I MESI SI DIRADANO CONTANDO DALL'ULTIMO. Alternare sull'indice del mese lascerebbe
 *     fuori il più recente — oggi agosto — che è il capo da cui si legge il grafico.
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

let MOB = false;
W.matchMedia = q => ({matches: /max-width:\s*660/.test(q) ? MOB : false,
                      addEventListener(){}, addListener(){}});
W.IntersectionObserver = class { observe(){} unobserve(){} };
global.IntersectionObserver = W.IntersectionObserver;
W.requestAnimationFrame = f => f();
W.localStorage = {getItem:()=>null, setItem(){}, removeItem(){}};
global.getComputedStyle = () => ({getPropertyValue:()=>''});
global.Blob = function(){}; global.URL = {createObjectURL(){ return ''; }};
global.FileReader = function(){}; global.fetch = () => Promise.reject(0);

let src = fs.readFileSync(__dirname + '/../app.js','utf8');
src = src.replace('carica().then(render,render)', 'global.A={render:render};carica().then(render,render)');
eval(src);

/* ── il reso, misurato su browser il 22 agosto 2026 ── */
const RESO = {380: {larghezza:326, viewBox:520}, 760: {larghezza:674, viewBox:900}};
/* l'inchiostro dei caratteri, in frazione del corpo: misurato con TextMetrics sulla
   pila del foglio. jsdom non misura testo, quindi il numero si dichiara qui. */
const ASC = 0.657, DISC = 0;          /* le cifre non hanno discendenti */
const LARG_MESE = 1.236;              /* «mag» in frazioni del corpo */

function leggi(){
  const svg = D.getElementById('k-trend').querySelector('svg');
  const vb = svg.getAttribute('viewBox').split(' ').map(Number);
  const testi = [].slice.call(svg.querySelectorAll('text'));
  const ass = testi.filter(t => t.getAttribute('text-anchor') === 'end' && /^\d+$/.test(t.textContent))
    .map(t => ({v:+t.textContent, y:+t.getAttribute('y'), fs:+t.getAttribute('font-size')}))
    .sort((a,b) => a.v - b.v);
  const mesi = testi.filter(t => /^(gen|feb|mar|apr|mag|giu|lug|ago|set|ott)$/.test(t.textContent))
    .map(t => ({m:t.textContent, x:+t.getAttribute('x'), fs:+t.getAttribute('font-size')}))
    .sort((a,b) => a.x - b.x);
  const orizz = [].slice.call(svg.querySelectorAll('line'))
    .filter(l => l.getAttribute('y1') === l.getAttribute('y2'));
  const dash = orizz.find(l => l.getAttribute('stroke-dasharray'));
  return {vb, ass, mesi, elementi: svg.querySelectorAll('*').length,
    griglia: orizz.filter(l => !l.getAttribute('stroke-dasharray')).map(l => +l.getAttribute('y1')),
    y61: dash ? +dash.getAttribute('y1') : null};
}

/* ══ i due punti di rottura ═══════════════════════════════════════════════════ */
const A = global.A;
const F = {};
[false, true].forEach(function(mob){
  MOB = mob; A.render();
  F[mob ? 380 : 760] = leggi();
});
MOB = false; A.render();

const largo = F[760], stretto = F[380];
const k = w => RESO[w].larghezza / RESO[w].viewBox;

/* ── 1 · il passo dell'asse ── */
esito(largo.ass.length === 16, 'sopra i 660 l\'asse resta a sedici etichette, passo 4',
  largo.ass.length + ': ' + largo.ass.map(x => x.v).join(','));
esito(stretto.ass.length === 8, 'sotto i 660 diventano otto, passo 8',
  stretto.ass.length + ': ' + stretto.ass.map(x => x.v).join(','));
const passi = a => [...new Set(a.map((x,i) => i ? x.v - a[i-1].v : null).filter(Boolean))];
esito(JSON.stringify(passi(largo.ass)) === '[4]', 'e il passo sopra i 660 è uniforme a 4',
  JSON.stringify(passi(largo.ass)));
esito(JSON.stringify(passi(stretto.ass)) === '[8]', 'sotto i 660 uniforme a 8',
  JSON.stringify(passi(stretto.ass)));
/* le etichette cadono su MULTIPLI del passo, non su lo: lo è calcolato dai dati e la
   scala si sposterebbe insieme al minimo */
esito(stretto.ass.every(x => x.v % 8 === 0), 'e cadono sui multipli del passo, non su lo',
  JSON.stringify(stretto.ass.map(x => x.v)));
/* E questa è sulla FORMA, non sul valore, perché oggi il valore non discrimina: lo vale
   8, che è già multiplo di 8, quindi ancorare le etichette a lo darebbe la stessa scala
   e la prova qui sopra passerebbe lo stesso. Ma lo è calcolato dai dati —
   Math.min(38, Math.floor(minimo/4)*4) — cioè è un multiplo di 4 al più 38: può valere
   36, 28, 20, e allora la scala diventerebbe 36-44-52-60-68, che si sposta insieme al
   minimo dell'archivio. È la stessa scelta di struttura.mjs sulle composizioni: dove il
   comportamento non distingue, si guarda la forma. */
esito(/for\(var v=Math\.ceil\(lo\/PASSOY\)\*PASSOY;/.test(src),
  'e il ciclo parte dal primo multiplo del passo, non da lo: lo si sposta coi dati',
  (/for\(var v=[^;]+;/.exec(src) || ['non trovato'])[0]);
/* l'intervallo resta coperto: il grafico va da lo a hi e le etichette non devono
   fermarsi molto prima */
const lo = largo.ass[0].v, hi = largo.ass[largo.ass.length-1].v;
esito(stretto.ass[0].v - lo <= 8 && hi - stretto.ass[stretto.ass.length-1].v <= 8,
  'e coprono l\'intervallo: scoperti al più otto seggi per capo',
  'da ' + lo + ' a ' + hi + ', etichette da ' + stretto.ass[0].v +
  ' a ' + stretto.ass[stretto.ass.length-1].v);

/* ── il numero per cui il passo è 8 e non 10: la linea del 61 ── */
const unita = (stretto.griglia[stretto.griglia.length-1] - stretto.griglia[0]) /
              (stretto.ass[stretto.ass.length-1].v - stretto.ass[0].v);
const dal61 = f => Math.min.apply(null, f.griglia.map(y => Math.abs(y - f.y61)));
esito(dal61(stretto) * k(380) >= 6,
  'a 380 nessun filetto di griglia cade addosso alla linea del 61',
  (dal61(stretto)*k(380)).toFixed(2) + 'px (col passo 4 erano 2,55)');
/* e la controprova: col passo 4 il filetto del 60 c'era, e cadeva a 2,55 */
esito(Math.abs(Math.abs(unita) * k(380) - 2.55) < 0.2,
  'un seggio vale 2,55px reali a 380: è la misura che rende 2,55 il caso peggiore',
  (Math.abs(unita)*k(380)).toFixed(2) + "px");
esito(!stretto.ass.some(x => x.v === 60) && largo.ass.some(x => x.v === 60),
  'il filetto del 60 — quello che toccava il 61 — sotto i 660 non c\'è, e sopra sì');

/* ── le etichette dell'asse non si toccano più ── */
const margineAsse = f => {
  const passoY = Math.abs(f.ass[1].y - f.ass[0].y);
  return (passoY - f.ass[0].fs * (ASC + DISC));
};
esito(margineAsse(stretto) * k(380) >= 9,
  'a 380 fra un\'etichetta dell\'asse e la successiva restano almeno nove pixel veri',
  (margineAsse(stretto)*k(380)).toFixed(2) + 'px (erano 2,07)');

/* ── 2 · i mesi ── */
esito(largo.mesi.length === 8, 'sopra i 660 i mesi restano tutti',
  JSON.stringify(largo.mesi.map(x => x.m)));
esito(stretto.mesi.length === Math.ceil(largo.mesi.length / 2),
  'sotto i 660 se ne mostra uno sì e uno no',
  JSON.stringify(stretto.mesi.map(x => x.m)));
/* IL PUNTO: l'ultimo non deve mai cadere */
esito(stretto.mesi[stretto.mesi.length-1].m === largo.mesi[largo.mesi.length-1].m,
  'e il mese più recente c\'è sempre: il conto parte dall\'ultimo, non dal primo',
  'sopra finisce con «' + largo.mesi[largo.mesi.length-1].m + '», sotto con «' +
  stretto.mesi[stretto.mesi.length-1].m + '»');
/* la controprova: contando dal primo cadrebbe proprio quello */
const daInizio = largo.mesi.filter((_,i) => i % 2 === 0).map(x => x.m);
esito(daInizio[daInizio.length-1] !== largo.mesi[largo.mesi.length-1].m,
  'mentre contando dal primo l\'ultimo mese cadrebbe: è la mutazione che questa prova coglie',
  'da inizio: ' + JSON.stringify(daInizio));
/* e i mesi mostrati sono un sottoinsieme ORDINATO di quelli di sopra, senza salti dispari */
esito(stretto.mesi.every(x => largo.mesi.some(y => y.m === x.m)),
  'i mesi mostrati sotto i 660 sono un sottoinsieme di quelli di sopra');
/* le etichette dei mesi non si toccano più */
const margineMesi = f => {
  const p = []; for (let i = 1; i < f.mesi.length; i++) p.push(f.mesi[i].x - f.mesi[i-1].x);
  return Math.min.apply(null, p) - f.mesi[0].fs * LARG_MESE;
};
esito(margineMesi(stretto) * k(380) >= 12,
  'a 380 fra un mese e il successivo restano almeno dodici pixel veri',
  (margineMesi(stretto)*k(380)).toFixed(2) + 'px (erano 0,09)');
esito(margineMesi(largo) * k(760) >= 12,
  'e sopra i 660 il margine c\'era già e non è cambiato',
  (margineMesi(largo)*k(760)).toFixed(2) + 'px');

/* ── il disegno si alleggerisce, e solo sotto i 660 ── */
esito(stretto.elementi < largo.elementi,
  'sotto i 660 il disegno porta meno elementi',
  stretto.elementi + ' contro ' + largo.elementi);
esito(largo.elementi - stretto.elementi === 20,
  'venti in meno: otto filetti, otto etichette dell\'asse, quattro mesi',
  String(largo.elementi - stretto.elementi));
/* e la nuvola dei sondaggi NON è stata toccata: dice la dispersione delle rilevazioni,
   ed è l'unica cosa nel grafico che mostra il dato grezzo invece della proiezione */
const punti = f => f.elementi;
esito(D.getElementById('k-trend').querySelectorAll('.pt').length > 400,
  'la nuvola dei singoli sondaggi resta intera: non è stata diradata',
  String(D.getElementById('k-trend').querySelectorAll('.pt').length));

console.log('\ntendenza: ' + ok + '/' + (ok + ko));
if (ko) process.exit(1);
