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
src = src.replace('carica().then(render,render)', 'global.A={render:render,impilaEtichette:impilaEtichette};carica().then(render,render)');
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
/*
   I CONTI SONO CAMBIATI IL 27 AGOSTO 2026, e non perche il passo si sia mosso: il DOMINIO
   si e allargato. Fino a quel giorno l'asse raccoglieva tre serie su quattro e partiva da
   8; adesso copre quello che il grafico disegna e parte da 0, quindi con lo STESSO passo
   le tacche sono due in piu a ogni larghezza. Il passo e la sua ragione non si toccano: e
   il NUMERO di tacche a essere una conseguenza, e per questo si ricava dal dominio.
*/
const attese = a => Math.round((Math.max.apply(null, a.map(x => x.v)) -
  Math.min.apply(null, a.map(x => x.v))) / (a[1].v - a[0].v)) + 1;
esito(largo.ass.length === attese(largo.ass) && largo.ass.length === 18,
  'sopra i 660 l\'asse porta una tacca ogni 4 seggi su TUTTO il dominio, e sono diciotto',
  largo.ass.length + ': ' + largo.ass.map(x => x.v).join(','));
esito(stretto.ass.length === attese(stretto.ass) && stretto.ass.length === 9,
  'sotto i 660 una ogni 8, e sono nove',
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
/* IL VALORE DI UN SEGGIO SI E RIDOTTO col dominio allargato — 2,55 → 2,25px a 380, cioe
   l'11,8% — ed e il prezzo dichiarato di quella riparazione: il grafico copre 68 seggi
   invece di 60 nella stessa altezza. La prova non riscrive il numero, lo ricava. */
const perSeggio = Math.abs(unita) * k(380);
esito(perSeggio > 2 && perSeggio < 2.6,
  'un seggio vale poco piu di due pixel reali a 380: e la misura che rende il filetto del 60 il caso peggiore',
  perSeggio.toFixed(2) + 'px (era 2,55 col dominio 8…68)');
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
esito(largo.elementi - stretto.elementi === 22,
  'ventidue in meno: nove filetti, nove etichette dell\'asse, quattro mesi — due piu di ' +
  'prima, perche il dominio allargato porta una tacca in piu a ogni larghezza',
  String(largo.elementi - stretto.elementi));
/* e la nuvola dei sondaggi NON è stata toccata: dice la dispersione delle rilevazioni,
   ed è l'unica cosa nel grafico che mostra il dato grezzo invece della proiezione */
const punti = f => f.elementi;
esito(D.getElementById('k-trend').querySelectorAll('.pt').length > 400,
  'la nuvola dei singoli sondaggi resta intera: non è stata diradata',
  String(D.getElementById('k-trend').querySelectorAll('.pt').length));


/* ══ IL DOMINIO COPRE QUELLO CHE IL GRAFICO DISEGNA ════════════════════════════════
 * Scritta il 27 agosto 2026. `vals` raccoglieva `g`, `o` e `a` e basta: la QUARTA serie
 * veniva disegnata e non veniva MAI misurata. Sulla pagina resa, area del grafico y 48…284
 * e dominio 8…68, la linea dell'ago della bilancia stava a y 299,7…315,5 — OTTANTASEI
 * vertici su ottantasei fuori dall'area, sopra i nomi dei mesi che sono a y 308 — e la sua
 * pastiglia finale a y 302,5…328,5 in un viewBox alto 318, tagliata dalla cornice.
 * È la famiglia della soglia dei 61 negli istogrammi, dove il dominio poteva escludere la
 * riga che il grafico esiste per mostrare — ma non la stessa causa: là il criterio era
 * sbagliato, qui l'ELENCO era incompleto.
 * LA PROVA È SULLA PROPRIETÀ, non sulla quarta serie: NIENTE di quello che il grafico
 * disegna cade fuori dall'area. Vale per la serie che qualcuno aggiunge domani. */
{
  const A2 = global.A;
  const dentro = (eti) => {
    const h = D.getElementById('k-trend').innerHTML;
    const H = +(h.match(/viewBox="0 0 \d+ (\d+)"/) || [])[1];
    const T0 = 30, B = 34, T = 30 + (H - 300), yBot = H - B;
    let fuori = 0, quante = 0, dett = [];
    ['g','o','a','i'].forEach(k => {
      const m = h.match(new RegExp('class="ln ln-' + k + '" d="([^"]+)"'));
      if (!m) return;
      quante++;
      const yy = m[1].split(/[ML]/).filter(Boolean)
        .map(s => +s.trim().split(' ')[1]).filter(v => !isNaN(v));
      const f = yy.filter(v => v > yBot + 0.05 || v < T - 0.05).length;
      if (f) { fuori += f; dett.push('ln-' + k + ': ' + f + '/' + yy.length); }
    });
    const pt = [...h.matchAll(/class="pt pt-\w" cx="[\d.]+" cy="([\d.]+)"/g)].map(x => +x[1]);
    const pf = pt.filter(v => v > yBot + 0.05 || v < T - 0.05).length;
    if (pf) dett.push('nuvola: ' + pf + '/' + pt.length);
    const pa = [...h.matchAll(/<g class="ln ln-(\w)"><rect [^>]*y="([-\d.]+)"[^>]*height="(\d+)"/g)]
      .map(m => ({k: m[1], y0: +m[2], y1: +m[2] + +m[3]}));
    const paf = pa.filter(p => p.y0 < -0.05 || p.y1 > H + 0.05);
    if (paf.length) dett.push('pastiglie fuori: ' + paf.map(p => p.k + ' ' + p.y0.toFixed(1) + '…' + p.y1.toFixed(1)).join(' '));
    return {quante: quante, punti: pt.length, pastiglie: pa.length, male: fuori + pf + paf.length, dett: dett.join(' · ')};
  };
  A2.render();
  const r = dentro();
  esito(r.quante === 4,
    'premessa: oggi il grafico disegna la quarta serie, quindi la prova esercita il caso',
    r.quante + ' serie');
  esito(r.punti > 400 && r.pastiglie === r.quante,
    'e disegna la nuvola e una pastiglia per serie',
    r.punti + ' punti, ' + r.pastiglie + ' pastiglie');
  esito(r.male === 0,
    'nessuna linea, nessun punto della nuvola e nessuna pastiglia cade fuori dall area del ' +
    'grafico: il dominio copre quello che il disegno contiene', r.dett);
  /* IL DOMINIO SI ALLARGA SOLO QUANDO SERVE, e il prezzo si paga dove c e qualcosa da dire */
  const tac = () => {
    const h = D.getElementById('k-trend').innerHTML;
    return [...h.matchAll(/<text x="(\d+(?:\.\d+)?)" y="[\d.]+"[^>]*>(\d+)<\/text>/g)]
      .filter(m => +m[1] < 34).map(m => +m[2]);
  };
  const t = tac();
  esito(t.length > 2 && Math.min.apply(null, t) === 0,
    'e con la quarta serie in campo l asse arriva a ZERO, che e dove quella serie vive',
    t.join(' '));
}


/* ══ LA PILA DELLE ETICHETTE HA UN TETTO, E SI PROVA PER ESAURIMENTO ═══════════════
 * Il serraggio aveva un verso solo: spingeva in giù e non guardava mai la cornice. Con
 * tre etichette non mordeva, con quattro sì — misurato, quattro serie fra 3 e 6 seggi
 * mandavano l'ultima a y 336,2 in un viewBox alto 318, e con QUALUNQUE dominio.
 * È la stessa forma dell'etichetta dei 61 prima del ribaltamento: una regola che conosce
 * una direzione sola.
 * SI PROVA SULLA FUNZIONE E NON SUL RENDER, e non è una scorciatoia: col dominio riparato
 * il caso che fa scattare il tetto NON LO RAGGIUNGE NESSUN ARCHIVIO — quattro totali che
 * sommano 120 non possono stare tutti in fondo. Una guardia che nessun render esercita è
 * codice che nessuno sa se funziona, quindi la funzione è pura e si spazzola per intero. */
{
  const A3 = global.A;
  const H = 318, T = 48, B = 34, DY = 20, MEZ = 13, ALT = (H - B) - T;
  /* la stessa Y del grafico, con il dominio che la regola sceglie */
  function quote(v4){
    const mn = Math.min.apply(null, v4), mx = Math.max.apply(null, v4);
    const lo = Math.min(38, Math.floor(mn / 4) * 4), hi = Math.max(64, Math.ceil(mx / 4) * 4);
    return v4.map(v => T + ALT * (1 - (v - lo) / (hi - lo))).sort((a, b) => a - b);
  }
  function senzaTetto(ys){
    const y = ys.slice();
    for (let i = 1; i < y.length; i++) if (y[i] - y[i-1] < DY) y[i] = y[i-1] + DY;
    return y;
  }
  let casi = 0, fuori = 0, vicini = 0, peggio = null, fuoriSenza = 0;
  for (let O = 0; O <= 120; O++)
    for (let Aa = 0; Aa + O <= 120; Aa += 1) {
      for (let Wq = 0; Wq + Aa + O <= 120; Wq += 7) {
        const C = 120 - O - Aa - Wq;
        const v = [O, Aa, Wq, C].filter(x => x > 0);
        if (v.length < 2) continue;
        casi++;
        const y = A3.impilaEtichette(quote([O, Aa, Wq, C]).slice(), DY, H, MEZ);
        if (y[0] - MEZ < -0.01 || y[y.length-1] + MEZ > H + 0.01) {
          fuori++; if (!peggio) peggio = [O, Aa, Wq, C].join('/') + ' → ' + y.map(x => x.toFixed(1)).join(' ');
        }
        for (let i = 1; i < y.length; i++) if (y[i] - y[i-1] < DY - 0.01) vicini++;
        const senza = senzaTetto(quote([O, Aa, Wq, C]));
        if (senza[senza.length-1] + MEZ > H + 0.01) fuoriSenza++;
      }
    }
  esito(casi > 5000, 'la spazzolata copre abbastanza configurazioni', String(casi) + ' partizioni');
  esito(fuori === 0,
    'nessuna pila di etichette esce dalla cornice, con qualunque ripartizione dei 120 seggi',
    peggio || '');
  esito(vicini === 0,
    'e nessuna coppia di etichette resta piu vicina del passo minimo: il tetto non le ' +
    'schiaccia una sull altra', String(vicini) + ' coppie');
  /* IL CONTROLLO CHE SA FALLIRE: senza il tetto, il difetto esiste davvero. Senza questa
     riga la prova sarebbe verde anche il giorno in cui il tetto sparisce, perche non
     saprebbe distinguere «riparato» da «non e mai successo». */
  esito(fuoriSenza > 0,
    'e il canale di rilevazione funziona: senza il tetto la pila USCIREBBE, in ' +
    fuoriSenza + ' configurazioni su ' + casi, String(fuoriSenza));
}

console.log('\ntendenza: ' + ok + '/' + (ok + ko));
if (ko) process.exit(1);
