/* GLI ACCORDI DI APPARENTAMENTO — heskem odafim.
 *
 * Due liste apparentate si presentano al riparto come una lista sola con la somma delle
 * quote; i seggi che la lista virtuale ottiene si dividono poi fra le due con lo stesso
 * d'Hondt applicato alla sola coppia. La soglia del 3,25% resta INDIVIDUALE.
 *
 * LE TRE COSE CHE QUESTA PROVA ESISTE PER TENERE.
 *
 * 1 · SENZA COPPIE IL RIPARTO DEV'ESSERE ESATTAMENTE QUELLO DI PRIMA. È il primo
 *     controllo da scrivere, perché la funzionalità nasce spenta: oggi nessun accordo è
 *     depositato e la leva dei proposti è alzata, quindi ogni numero in pagina deve
 *     essere identico a quello del giorno prima. Se questa cade, tutto il resto non
 *     conta.
 *
 * 2 · LE DUE STRADE DEVONO CONCORDARE. dhondt() fa la proiezione, ripartoVeloce() le
 *     20.000 simulazioni: toccarne una sola farebbe dire due cose diverse alla stessa
 *     pagina — la proiezione con gli apparentamenti e le probabilità senza. È la strada
 *     doppia di sempre, e qui nasce insieme alla funzionalità, quindi la prova nasce nel
 *     commit che la introduce e non dopo. Si confrontano su centinaia di vettori di
 *     quote generati, non su uno.
 *
 * 3 · UNA PROVA SU UNO STATO INTERATTIVO DEVE ACCENDERE QUELLO STATO. Per impostazione
 *     predefinita non c'è nessun accordo attivo: una prova che non accendesse la leva
 *     passerebbe a vuoto ed esisterebbe solo per sembrare verde. Qui la leva si accende,
 *     e si verifica anche che accendendola qualcosa si muova davvero — altrimenti
 *     un'implementazione che non facesse niente passerebbe tutto.
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
  'global.A={dhondt:dhondt,ripartoSoglia:ripartoSoglia,divisori:divisori,' +
  'ripartoVeloce:ripartoVeloce,strutturaApp:strutturaApp,bisezione:bisezione,' +
  'coppieAttive:coppieAttive,coppieRiparto:coppieRiparto,APP:APPARENTAMENTI,' +
  'SOGLIA:SOGLIA,blocchi:blocchi,nm:nm,render:render,rFoot:rFoot,PAR_DEF:PAR_DEF,' +
  'par:function(k,v){if(v===undefined)return PAR[k];PAR[k]=v;},' +
  'parTutto:function(){return PAR;},' +
  'setApp:function(v){APPARENTAMENTI.length=0;v.forEach(function(x){APPARENTAMENTI.push(x);});},' +
  'stato:function(){return{QUO:QUO,SEG:SEG,MC:MC};},' +
  'sim:function(v){SIM=v;},sig:function(v){SIG=v;},montecarlo:montecarlo};carica().then(render,render)');
eval(src);
try { A.render(); } catch(e) { console.log('KO il render non è partito — ' + (e && e.message)); }

const ORIG = A.APP.map(x => Object.assign({}, x));
const SOGLIA = A.SOGLIA;

/* ── attrezzi ─────────────────────────────────────────────────────────────── */

/* il riparto veloce non prende oggetti ma un array indicizzato: qui si fa il ponte, e si
   restituisce un oggetto id→seggi confrontabile con quello di dhondt() */
function veloce(q, al){
  const ids = Object.keys(q);
  const sh = new Float64Array(ids.length);
  ids.forEach((k, i) => { sh[i] = q[k]; });
  const out = new Int32Array(ids.length);
  A.ripartoVeloce(sh, ids.length, out, A.strutturaApp(ids, al));
  const r = {};
  ids.forEach((k, i) => { if (q[k] >= SOGLIA) r[k] = out[i]; });
  return r;
}
function somma(o){ return Object.keys(o).reduce((a, k) => a + o[k], 0); }
function ugual(a, b){
  const ka = Object.keys(a).filter(k => a[k] !== undefined).sort();
  const kb = Object.keys(b).filter(k => b[k] !== undefined).sort();
  if (ka.join(',') !== kb.join(',')) return false;
  return ka.every(k => a[k] === b[k]);
}
/* quote pseudocasuali riproducibili: niente Math.random, o due esecuzioni della stessa
   prova misurerebbero due cose diverse e un difetto raro sembrerebbe intermittente */
let seme = 12345;
function rnd(){ seme = (seme * 1103515245 + 12345) & 0x7fffffff; return seme / 0x7fffffff; }
function quoteCasuali(n){
  const q = {}, ids = [];
  for (let i = 0; i < n; i++) ids.push('l' + i);
  let t = 0;
  ids.forEach(k => { q[k] = 0.5 + rnd() * 25; t += q[k]; });
  ids.forEach(k => { q[k] = q[k] * 99 / t; });
  return q;
}

/* ══ 1 · SENZA COPPIE, IL RIPARTO È QUELLO DI PRIMA ═════════════════════════ */

esito(A.par('apparentamenti') === 0,
  'la leva degli apparentamenti proposti nasce spenta', String(A.par('apparentamenti')));
esito(A.APP.every(x => x.stato !== 'depositato'),
  'e oggi nessun accordo è depositato: il termine è quello del deposito delle liste');
esito(A.coppieRiparto(null, null).length === 0,
  'quindi nessun accordo entra nel riparto', JSON.stringify(A.coppieRiparto(null, null)));

{
  const S = A.stato();
  esito(ugual(A.dhondt(S.QUO), A.ripartoSoglia(S.QUO)),
    'sulle quote vere il riparto con gli accordi coincide con quello senza',
    JSON.stringify(A.dhondt(S.QUO)) + ' contro ' + JSON.stringify(A.ripartoSoglia(S.QUO)));
  esito(somma(A.dhondt(S.QUO)) === 120, 'e fa 120', String(somma(A.dhondt(S.QUO))));

  const diversi = [];
  for (let i = 0; i < 300; i++) {
    const q = quoteCasuali(6 + (i % 12));
    if (!ugual(A.dhondt(q), A.ripartoSoglia(q))) diversi.push(i);
  }
  esito(diversi.length === 0,
    'e su 300 vettori di quote generati non c\'è una sola differenza',
    diversi.length + ' diversi, primo il ' + diversi[0]);
  esito(A.strutturaApp(['raam','lista_araba','likud'], null) === null,
    'e il riparto veloce prende la strada di prima: senza accordi la struttura non esiste');
}

/* ══ 2 · LE DUE STRADE CONCORDANO ═══════════════════════════════════════════ */
/* Vale sia a leva spenta sia accesa: sono lo stesso riparto scritto due volte, una per
   oggetti e una per array tipizzati, e devono restare la stessa cosa. */
function confrontaStrade(nome, al){
  const diversi = [];
  for (let i = 0; i < 300; i++) {
    const q = quoteCasuali(5 + (i % 14));
    /* si rinominano due liste come i membri della coppia, così l'accordo morde */
    const ids = Object.keys(q);
    const q2 = {};
    ids.forEach((k, j) => { q2[j === 0 ? 'raam' : (j === 1 ? 'lista_araba' : k)] = q[k]; });
    const lento = A.dhondt(q2, al), rapido = veloce(q2, al);
    if (!ugual(lento, rapido)) diversi.push(i + ': ' + JSON.stringify(lento) + ' ≠ ' + JSON.stringify(rapido));
  }
  esito(diversi.length === 0,
    'proiezione e Monte Carlo danno lo stesso riparto — ' + nome,
    diversi.length + ' diversi · ' + diversi.slice(0, 1).join(''));
}
confrontaStrade('a leva spenta', null);
A.par('apparentamenti', 1);
confrontaStrade('a leva accesa', null);
A.par('apparentamenti', 0);

/* ══ 3 · CON LA LEVA ACCESA L'ACCORDO ENTRA, E SI VEDE ══════════════════════ */

{
  A.par('apparentamenti', 1);
  esito(A.coppieRiparto(null, null).length === 1,
    'accendendo la leva l\'accordo proposto entra nel riparto',
    JSON.stringify(A.coppieRiparto(null, null).map(x => x.a + '+' + x.b)));

  /* il meccanismo deve poter spostare un seggio: se non lo spostasse mai, tutte le
     prove qui sopra passerebbero anche con un'implementazione che non fa niente */
  let spostati = 0, esempio = null;
  for (let i = 0; i < 400; i++) {
    const q = quoteCasuali(5 + (i % 12));
    const ids = Object.keys(q);
    const q2 = {};
    ids.forEach((k, j) => { q2[j === 0 ? 'raam' : (j === 1 ? 'lista_araba' : k)] = q[k]; });
    const con = A.dhondt(q2, null), senza = A.ripartoSoglia(q2);
    if (!ugual(con, senza)) { spostati++; if (!esempio) esempio = {con, senza}; }
  }
  esito(spostati > 0,
    'e sposta davvero dei seggi: ' + spostati + ' vettori su 400 cambiano riparto',
    JSON.stringify(esempio));
  esito(spostati < 400,
    'ma non su tutti: sommare i resti non basta quando nessuna delle due è vicina al confine',
    String(spostati));

  /* la coppia non guadagna né perde nel totale del gruppo: quello che cambia è come i
     seggi si distribuiscono fra il gruppo e gli altri */
  const q = quoteCasuali(9);
  const ids = Object.keys(q), q3 = {};
  ids.forEach((k, j) => { q3[j === 0 ? 'raam' : (j === 1 ? 'lista_araba' : k)] = q[k]; });
  esito(somma(A.dhondt(q3, null)) === 120, 'e il totale resta 120 con l\'accordo attivo',
    String(somma(A.dhondt(q3, null))));
  A.par('apparentamenti', 0);
}

/* ══ 4 · LA SOGLIA RESTA INDIVIDUALE ════════════════════════════════════════ */

{
  A.par('apparentamenti', 1);
  /* Ra'am sotto soglia, Lista Unita sopra: l'accordo non esiste, e il partner non eredita
     niente. È il punto in cui un apparentamento scritto male regalerebbe seggi. */
  const q = {raam: SOGLIA - 0.5, lista_araba: 8, likud: 30, byachad: 25, shas: 20, utj: 16};
  const r = A.dhondt(q, null);
  esito(r.raam === undefined, 'una lista sotto soglia non entra, nemmeno se apparentata',
    JSON.stringify(r));
  const senzaRaam = Object.assign({}, q); delete senzaRaam.raam;
  esito(r.lista_araba === A.ripartoSoglia(senzaRaam).lista_araba,
    'e il partner prende esattamente i seggi che avrebbe da solo: l\'accordo non trasferisce niente',
    r.lista_araba + ' contro ' + A.ripartoSoglia(senzaRaam).lista_araba);
  esito(somma(r) === 120, 'e la somma resta 120', String(somma(r)));
  /* e la strada veloce dice la stessa cosa, che è dove la soglia si applica per
     simulazione invece che una volta */
  esito(ugual(r, veloce(q, null)),
    'la strada veloce concorda anche quando un membro cade sotto soglia',
    JSON.stringify(veloce(q, null)));
  A.par('apparentamenti', 0);
}

/* ══ 5 · GLI ACCORDI NON RETROAGISCONO ══════════════════════════════════════ */

{
  A.par('apparentamenti', 1);
  const dataAccordo = ORIG[0].data;
  const prima = new Date(new Date(dataAccordo + 'T00:00:00').getTime() - 864e5).toISOString().slice(0, 10);
  esito(A.coppieRiparto(null, prima).length === 0,
    'alla vigilia dell\'annuncio l\'accordo non esiste ancora: la serie storica non lo fa retroagire',
    prima);
  esito(A.coppieRiparto(null, dataAccordo).length === 1,
    'e dal giorno dell\'annuncio sì', dataAccordo);
  const q = quoteCasuali(9), ids = Object.keys(q), q4 = {};
  ids.forEach((k, j) => { q4[j === 0 ? 'raam' : (j === 1 ? 'lista_araba' : k)] = q[k]; });
  esito(ugual(A.dhondt(q4, prima), A.ripartoSoglia(q4)),
    'e a quella data il riparto è quello senza accordi');
  A.par('apparentamenti', 0);
}

/* ══ 6 · PROPOSTO E DEPOSITATO SONO DUE COSE ════════════════════════════════ */

{
  A.setApp([{a:'raam', b:'lista_araba', data:'2026-08-22', stato:'depositato', fonte:'prova'}]);
  esito(A.par('apparentamenti') === 0 && A.coppieRiparto(null, null).length === 1,
    'un accordo DEPOSITATO entra nel riparto anche a leva spenta: l\'8 settembre si cambia uno stato, non il codice');
  A.setApp([{a:'raam', b:'lista_araba', data:'2026-08-22', stato:'proposto', fonte:'prova'}]);
  esito(A.coppieRiparto(null, null).length === 0,
    'e uno PROPOSTO no: la leva è la soglia fra i due');

  /* una lista non può stare in due accordi: l'heskem odafim è fra DUE liste */
  A.setApp([
    {a:'raam', b:'lista_araba', data:'2026-08-22', stato:'depositato', fonte:'prova'},
    {a:'raam', b:'likud',       data:'2026-08-22', stato:'depositato', fonte:'prova'}
  ]);
  const cp = A.coppieRiparto(null, null);
  esito(cp.length === 1 && cp[0].b === 'lista_araba',
    'una lista sta in un accordo solo: il secondo viene scartato invece di fondere una catena',
    JSON.stringify(cp.map(x => x.a + '+' + x.b)));
  const q = {raam: 5, lista_araba: 7, likud: 27, byachad: 22, shas: 18, utj: 12, otzma: 8};
  esito(somma(A.dhondt(q, null)) === 120,
    'e la somma resta 120 anche con l\'accordo in eccesso scartato', String(somma(A.dhondt(q, null))));
  esito(ugual(A.dhondt(q, null), veloce(q, null)),
    'e le due strade concordano pure lì', JSON.stringify(veloce(q, null)));

  A.setApp(ORIG);
}

/* ══ 7 · IL MONTE CARLO PORTA LA STESSA REGOLA DELLA PROIEZIONE ═════════════ */
/* Non basta che le due funzioni concordino su quote fisse: montecarlo() deve passare la
   struttura, e passarle la data giusta. Se dimenticasse il parametro, le probabilità
   racconterebbero un riparto diverso da quello del grafico sopra. */
{
  A.par('apparentamenti', 1);
  A.sim(2000);
  const S = A.stato();
  const mc = A.montecarlo(S.QUO, 2000, 60, null);
  esito(mc.coal.length === 2000 && mc.coal.every(v => v >= 0 && v <= 120),
    'il Monte Carlo gira con gli accordi attivi e resta nei limiti');
  /* NON si sommano mc.coal[s] e mc.oppz[s]: i due array sono ordinati ciascuno per conto
     suo — servono ai quantili — quindi la posizione s non è la stessa simulazione nei
     due, e la somma può superare 120 senza che niente sia rotto. La proprietà vera è
     un'altra: i quattro esiti sono una partizione delle simulazioni, e ciascuno è
     deciso dai seggi che il riparto ha assegnato in quella simulazione. */
  esito(mc.vC + mc.vO + mc.vA + mc.st === mc.n,
    'e i quattro esiti partizionano le simulazioni: il riparto assegna seggi in ognuna',
    (mc.vC + mc.vO + mc.vA + mc.st) + ' su ' + mc.n);
  esito(mc.coal.every(v => v >= 0 && v <= 120) && mc.oppz.every(v => v >= 0 && v <= 120),
    'e nessun blocco esce dai 120 seggi in nessuna simulazione');
  /* la data arriva fino in fondo: a una data anteriore all'accordo la struttura non
     esiste, e il Monte Carlo deve girare senza */
  esito(A.strutturaApp(Object.keys(S.QUO), '2026-01-01') === null,
    'e a una data anteriore all\'annuncio la struttura non viene nemmeno costruita');
  esito(A.strutturaApp(Object.keys(S.QUO), null) !== null,
    'mentre a oggi sì, con la leva accesa');
  A.sim(20000);
  A.par('apparentamenti', 0);
}

/* ══ 7-bis · IL CABLAGGIO, che è la cosa che le prove qui sopra non toccavano ══
 *
 * DUE MUTANTI SOPRAVVISSUTI, e sono la ragione per cui questa sezione esiste.
 * Sostituendo `SEG=dhondt(QUO)` con `SEG=ripartoSoglia(QUO)`, e
 * `ripartoVeloce(sim,n,seg,AP)` con `...,null)`, tutte le prove restavano verdi: le prime
 * confrontano le funzioni fra loro, non quello che la pagina ne fa. E oggi l'unico
 * accordo in tabella — Ra'am più Lista Unita — non sposta nessun seggio, quindi anche
 * accendendo la leva SEG non cambia e nessun confronto se ne accorge.
 *
 * Serve quindi una coppia che SPOSTI un seggio sulle quote vere. Ce ne sono ventiquattro;
 * si usa Likud + Sionismo Religioso, che è quella annotata in CLAUDE.md: porta il Likud da
 * 23 a 24 e Yisrael Beitenu da 10 a 9, cioè un seggio che passa da un blocco all'altro.
 *
 * E per il Monte Carlo serve una seconda cosa: renderlo DETERMINISTICO. Con SIG a zero
 * l'ampiezza delle scosse è nulla e ogni simulazione riproduce esattamente la proiezione,
 * quindi il seggio si può confrontare invece di stimarlo su una distribuzione rumorosa. */
{
  const S0 = A.stato();
  const senza = A.ripartoSoglia(S0.QUO);
  A.setApp([{a:'likud', b:'sionismo_rel', data:'2026-01-01', stato:'depositato',
             fonte:'coppia di prova'}]);
  const con = A.dhondt(S0.QUO, null);
  esito(!ugual(con, senza),
    'la coppia di prova sposta davvero un seggio sulle quote vere',
    Object.keys(senza).filter(k => con[k] !== senza[k])
      .map(k => A.nm(k) + ' ' + senza[k] + '→' + con[k]).join(' · '));

  /* LA PROIEZIONE. Se calcola() usasse il riparto senza accordi, SEG resterebbe quello
     di prima e nessuna delle prove qui sopra lo direbbe. */
  A.render();
  const S1 = A.stato();
  esito(ugual(S1.SEG, con),
    'la proiezione in pagina usa il riparto CON gli accordi',
    JSON.stringify(S1.SEG));
  esito(!ugual(S1.SEG, senza),
    'e non quello senza: il cablaggio di calcola() è esercitato, non dedotto');

  /* IL MONTE CARLO. Stessa domanda, sull'altra strada: montecarlo() deve costruire la
     struttura e passarla a ogni simulazione. */
  A.sig(0);
  const mc = A.montecarlo(S1.QUO, 40, 60, null);
  const bCon = A.blocchi(con), bSenza = A.blocchi(senza);
  esito(bCon.coalizione !== bSenza.coalizione,
    'la coppia sposta un seggio fra i blocchi: ' + bSenza.coalizione + ' → ' + bCon.coalizione);
  esito(mc.coal.every(v => v === bCon.coalizione),
    'e con le scosse azzerate ogni simulazione riproduce il riparto CON gli accordi',
    'atteso ' + bCon.coalizione + ', visti ' + [...new Set(mc.coal)].join(','));
  esito(mc.oppz.every(v => v === bCon.opposizione),
    'anche sull\'opposizione', 'atteso ' + bCon.opposizione + ', visti ' + [...new Set(mc.oppz)].join(','));
  /* e la data arriva fino in fondo anche qui: prima dell'accordo il Monte Carlo deve
     dare il riparto senza */
  const mcPrima = A.montecarlo(S1.QUO, 40, 60, '2025-12-31');
  esito(mcPrima.coal.every(v => v === bSenza.coalizione),
    'e a una data anteriore all\'accordo riproduce il riparto SENZA',
    'atteso ' + bSenza.coalizione + ', visti ' + [...new Set(mcPrima.coal)].join(','));

  A.sig(1);
  A.setApp(ORIG);
  A.render();
}

/* ══ 8 · I VALORI PREDEFINITI DEI PARAMETRI HANNO UNA SORGENTE SOLA ═════════ */
/* Erano due: uno alla dichiarazione e uno dentro «azzera». La seconda copia si è scoperta
   aggiungendo il terzo parametro — azzerando, PAR tornava a un oggetto senza la chiave
   nuova. Il comportamento sarebbe stato giusto per caso, la forma dell'oggetto no, e
   _serieKey ne fa il JSON. */
{
  esito(Object.keys(A.PAR_DEF).sort().join(',') === 'apparentamenti,listaunita,recenti',
    'PAR_DEF porta tutti e tre i parametri', Object.keys(A.PAR_DEF).sort().join(','));
  esito(Object.keys(A.parTutto()).sort().join(',') === Object.keys(A.PAR_DEF).sort().join(','),
    'e PAR ha esattamente le sue chiavi');
  const app3 = fs.readFileSync(__dirname + '/../app.js','utf8');
  esito((app3.match(/recenti:0,listaunita:1/g) || []).length === 1,
    'e i valori predefiniti sono scritti una volta sola nel file',
    String((app3.match(/recenti:0,listaunita:1/g) || []).length) + ' occorrenze');
  esito(/PAR=Object\.assign\(\{\},PAR_DEF\)/.test(app3),
    'anche dentro «azzera», che li rilegge invece di riscriverli');
}

/* ══ 9 · L'INVERSIONE DEI SONDAGGI NON USA GLI ACCORDI ══════════════════════ */
/* invD() inverte i seggi PUBBLICATI da un istituto, che sono calcolati senza
   apparentamenti perché un istituto non può conoscerli. Invertire con una mappa diversa
   da quella che ha prodotto i numeri darebbe quote sbagliate, e in silenzio. */
{
  const app3 = fs.readFileSync(__dirname + '/../app.js','utf8');
  esito(/var got=ripartoSoglia\(Object\.assign/.test(app3),
    'invD inverte col riparto senza accordi, non con dhondt');
  esito(!/function invD[\s\S]{0,900}dhondt\(/.test(app3),
    'e dentro invD non compare nessuna chiamata a dhondt');
}

/* ══ 10 · QUELLO CHE LA PAGINA DICE, E QUANTO VALE OGGI ═════════════════════ */

{
  const testo = e => String((D.getElementById(e) || {}).innerHTML || '')
    .replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  A.par('apparentamenti', 0); A.rFoot();
  const spento = testo('k-foot');
  esito(/Gli accordi di apparentamento .* sono simulati/.test(spento),
    'la nota metodologica non dice più «non sono simulati»');
  esito(!/Non sono simulati gli accordi/.test(spento), 'e la vecchia frase non è rimasta in giro');
  esito(/Nessun accordo risulta ancora depositato/.test(spento),
    'dichiara che nessuno è depositato', (spento.match(/Nessun accordo[^.]*\./) || [''])[0]);
  esito(/Non entrano nel riparto/.test(spento),
    'e che i proposti non entrano', (spento.match(/Annunciati[^.]*\.[^.]*\./) || [''])[0]);
  esito(/mappa incompleta sarebbe peggio/.test(spento),
    'e dice al lettore perché una mappa a metà sarebbe peggio di nessuna mappa');

  A.par('apparentamenti', 1); A.rFoot();
  const acceso = testo('k-foot');
  esito(/quindi entrano nel riparto/.test(acceso) && /controfattuale/.test(acceso),
    'e con la leva accesa dichiara che quello che si legge è un controfattuale',
    (acceso.match(/Il pulsante[^.]*\./) || [''])[0]);
  esito(spento !== acceso, 'le due note non sono la stessa stringa');
  A.par('apparentamenti', 0); A.rFoot();

  /* quanto vale oggi, sulle quote vere: si stampa, non si asserisce — è una misura, e
     cambia a ogni sondaggio nuovo */
  const S = A.stato();
  A.par('apparentamenti', 1);
  const con = A.dhondt(S.QUO, null);
  A.par('apparentamenti', 0);
  const senza = A.ripartoSoglia(S.QUO);
  const mosse = Object.keys(senza).filter(k => (con[k] || 0) !== (senza[k] || 0));
  console.log('\n  quanto vale oggi l\'accordo Ra\'am + Lista Unita, sulle quote vere:');
  console.log('    ' + (mosse.length
    ? mosse.map(k => A.nm(k) + ' ' + senza[k] + '→' + con[k]).join(' · ')
    : 'nessun seggio si muove'));
  console.log('    blocchi senza: ' + JSON.stringify(A.blocchi(senza)));
  console.log('    blocchi con:   ' + JSON.stringify(A.blocchi(con)));
  esito(somma(con) === 120 && somma(senza) === 120,
    'e in tutti e due i casi la somma fa 120');
}

console.log('\napparentamenti: ' + ok + '/' + (ok + ko));
if (ko) process.exit(1);
