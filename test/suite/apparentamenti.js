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
 *
 * E DAL 23 AGOSTO 2026 UNA QUARTA, CHE È IL TERMINE.
 *
 * 4 · TUTTO QUELLO CHE LA PAGINA DICE DEGLI ACCORDI DIPENDE DA UNA DATA. Il termine è
 *     l'undicesimo giorno prima del voto — il 16 ottobre — e non il deposito delle liste:
 *     prima di quel giorno un accordo annunciato è un'ipotesi che la leva può applicare,
 *     dopo non è più niente, e il comando sparisce. Le prove sulla leva accesa dicono
 *     quindi A QUALE DATA valutano, con `al` per il motore e con l'orologio congelato per
 *     la pagina resa. Le prime stesure non lo dicevano, e `npm run spazzola` le ha trovate
 *     al primo giro: davano per scontato di essere eseguite prima del 16 ottobre, che è
 *     una fixture stagionale con un altro nome.
 *
 * E UNA COSA CHE QUESTA SUITE NON FA, DI PROPOSITO: non asserisce quanto vale l'accordo.
 * Dipende dall'archivio del giorno — sul seme BASE oggi vale zero seggi, sull'archivio
 * pubblicato uno — quindi rifà il conto e verifica che la riga di esito dica QUELLO.
 * Scritto «vale un seggio» sarebbe caduto alla prima rilevazione nuova, dicendo «difetto»
 * dove c'era un sondaggio in più.
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
  'coppieAl:coppieAl,contoApp:contoApp,sopraSoglia:sopraSoglia,termineApp:termineApp,' +
  'valida:validaApparentamenti,erroriRiga:erroriRiga,APP_STATI:APP_STATI,' +
  'TERMINE_APP_GG:TERMINE_APP_GG,TAPPE:TAPPE,rApp:rApp,rCalendario:rCalendario,' +
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

/* LE DUE DATE CHE SEPARANO I DUE MONDI, ricavate dal termine e non scritte. Prima del 16
   ottobre un accordo annunciato è un'ipotesi che la leva può applicare; dopo non è più
   niente. Le prove che parlano della leva accesa devono dire A QUALE DATA la valutano, o
   danno per scontato di essere eseguite prima del termine — e `npm run spazzola`, che
   porta l'orologio al 23 ottobre, le trova: sono cadute così, la prima volta. */
const gMeno = k => new Date(Date.parse(A.termineApp() + 'T00:00:00Z') - k*864e5).toISOString().slice(0,10);
const PRIMA = gMeno(1), DOPO = gMeno(-1);

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
/* Le date che significano «adesso» si costruiscono DA OGGI. Scritte per esteso sarebbero
   costanti temporali dentro una fixture: valgono finché non valgono più, ed è il difetto
   che ha fatto cadere mediana.js il primo giorno in cui il calendario è girato. */
function giorniFa(k){
  const oggi = new Date();
  return new Date(Date.UTC(oggi.getFullYear(), oggi.getMonth(), oggi.getDate()) - k*864e5)
    .toISOString().slice(0,10);
}
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
/* LE ATTESE SI CALCOLANO DALLA TABELLA, non dal suo contenuto di oggi. Il 16 ottobre ne
   arriveranno quattro insieme, e una riga in più non deve far diventare rosso il banco:
   davanti a un rosso un agente farebbe la cosa peggiore, cioè aggiustare la prova. */
esito(A.valida().length === 0,
  'la tabella pubblicata è valida: nessuna riga sbagliata',
  A.valida().map(r => 'riga ' + r.riga + ': ' + r.errori.join('; ')).join(' | '));
{
  /* la proprietà è «senza coppie il riparto è quello di prima», e si prova SVUOTANDO la
     tabella invece di sperare che sia vuota: dal primo deposito non lo sarà più */
  const vere = A.APP.map(x => Object.assign({}, x));
  A.setApp([]);
  esito(A.coppieRiparto(null, null).length === 0,
    'con la tabella vuota nessun accordo entra nel riparto', JSON.stringify(A.coppieRiparto(null, null)));
  A.setApp(vere);
  esito(A.coppieRiparto(null, null).length === A.APP.filter(x => x.stato === 'depositato').length,
    'e con la tabella vera, a leva spenta, entrano esattamente i depositati',
    A.coppieRiparto(null, null).length + ' contro ' + A.APP.filter(x => x.stato === 'depositato').length + ' depositati');
}

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
  /* con la tabella VUOTA: è la proprietà «senza accordi la strada è quella di prima», e
     dal primo deposito la tabella non è più vuota da sé */
  A.setApp([]);
  esito(A.strutturaApp(['raam','lista_araba','likud'], null) === null,
    'e il riparto veloce prende la strada di prima: senza accordi la struttura non esiste');
  A.setApp(ORIG);
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
  {
    const attesi = A.APP.filter(x => x.stato !== 'ritirato' && x.data <= PRIMA).length;
    esito(A.coppieRiparto(null, PRIMA).length === attesi,
      'accendendo la leva, alla vigilia del termine, entrano tutti gli accordi vivi a quel giorno',
      A.coppieRiparto(null, PRIMA).map(x => x.a + '+' + x.b).join(', ') + ' contro ' + attesi + ' attesi');
    esito(attesi > 0, 'e ce n\'è almeno uno, o questa prova non guarda niente', String(attesi));
  }

  /* il meccanismo deve poter spostare un seggio: se non lo spostasse mai, tutte le
     prove qui sopra passerebbero anche con un'implementazione che non fa niente */
  let spostati = 0, esempio = null;
  for (let i = 0; i < 400; i++) {
    const q = quoteCasuali(5 + (i % 12));
    const ids = Object.keys(q);
    const q2 = {};
    ids.forEach((k, j) => { q2[j === 0 ? 'raam' : (j === 1 ? 'lista_araba' : k)] = q[k]; });
    const con = A.dhondt(q2, PRIMA), senza = A.ripartoSoglia(q2);
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
  esito(A.strutturaApp(Object.keys(S.QUO), PRIMA) !== null,
    'mentre alla vigilia del termine sì, con la leva accesa');
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

/* ══ L'OROLOGIO, DA QUI IN GIÙ ═════════════════════════════════════════════
 *
 * Tutto quello che la pagina DICE degli accordi dipende da una data: prima del termine il
 * comando c'è e la riga parla di un'ipotesi, dopo il comando sparisce e la riga dice che
 * quell'ipotesi non è mai diventata un fatto. Una prova che desse per scontato di essere
 * eseguita prima del 16 ottobre sarebbe una fixture stagionale — l'invariante 10 — e
 * `npm run spazzola`, che porta l'orologio al 23 ottobre, la troverebbe. Quindi
 * l'orologio si congela, e i due rami si provano tutti e due, alle due date che li
 * separano: il giorno prima del termine e il giorno dopo. Le date escono da termineApp(),
 * non sono scritte. */
const veroDate = W.Date, veroGlobal = global.Date;
function congela(iso){
  const fisso = new veroDate(iso + 'T12:00:00');
  function Finta(){
    if (arguments.length === 0) return new veroDate(fisso.getTime());
    return new (Function.prototype.bind.apply(veroDate, [null].concat([].slice.call(arguments))))();
  }
  Finta.prototype = veroDate.prototype;
  Finta.UTC = veroDate.UTC; Finta.parse = veroDate.parse; Finta.now = () => fisso.getTime();
  global.Date = Finta; W.Date = Finta;
}
function scongela(){ global.Date = veroGlobal; W.Date = veroDate; }
congela(PRIMA);
A.render();
esito(!!Object.keys(A.stato().SEG).length,
  'col l\'orologio alla vigilia del termine il modello calcola ancora: la finestra dei 60 giorni si àncora alla rilevazione più recente, non a oggi');

/* ══ 10 · QUELLO CHE LA PAGINA DICE, E QUANTO VALE OGGI ═════════════════════ */

{
  const testo = e => String((D.getElementById(e) || {}).innerHTML || '')
    .replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  A.par('apparentamenti', 0); A.rFoot();
  const spento = testo('k-foot');
  esito(/Gli accordi di apparentamento .* sono simulati/.test(spento),
    'la nota metodologica non dice più «non sono simulati»');
  esito(!/Non sono simulati gli accordi/.test(spento), 'e la vecchia frase non è rimasta in giro');
  {
    /* il ramo atteso si deduce dalla tabella: col primo deposito la nota cambia frase, e
       una prova ancorata alla frase di oggi direbbe «difetto» dove c'è un accordo in più */
    const dp = A.APP.filter(x => x.stato === 'depositato').length;
    const an = A.coppieAl(null, true).filter(x => x.stato !== 'depositato').length;
    esito(dp
        ? /Accordi depositati, e quindi sempre nel riparto/.test(spento)
        : /Nessun accordo risulta ancora depositato/.test(spento),
      dp ? 'elenca i ' + dp + ' accordi depositati' : 'dichiara che nessuno è depositato',
      (spento.match(/(Nessun accordo|Accordi depositati)[^.]*\./) || [''])[0]);
    esito(!an || /Non entrano nel riparto/.test(spento),
      'e che gli annunciati non entrano', (spento.match(/Annunciati[^.]*\.[^.]*\./) || [''])[0]);
  }
  esito(/mappa incompleta sarebbe peggio/.test(spento),
    'e dice al lettore perché una mappa a metà sarebbe peggio di nessuna mappa');

  /* il controfattuale esiste solo se c'è qualcosa da applicare per ipotesi: con la
     tabella tutta depositata la leva non ha niente da dire, e la nota giustamente non
     cambia. La prova installa un annunciato invece di sperare che ci sia. */
  const vere = A.APP.map(x => Object.assign({}, x));
  A.setApp([{a:'shas', b:'utj', data:giorniFa(3), stato:'proposto'}]);
  A.par('apparentamenti', 0); A.rFoot();
  const spento2 = testo('k-foot');
  A.par('apparentamenti', 1); A.rFoot();
  const acceso = testo('k-foot');
  esito(/quindi entrano nel riparto/.test(acceso) && /controfattuale/.test(acceso),
    'e con la leva accesa dichiara che quello che si legge è un controfattuale',
    (acceso.match(/Il pulsante[^.]*\./) || [''])[0]);
  esito(spento2 !== acceso, 'le due note non sono la stessa stringa');
  A.setApp(vere);
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

/* ══ 11 · IL TERMINE NON È IL DEPOSITO DELLE LISTE ══════════════════════════
 *
 * È il difetto che questa suite non vedeva: il modello e la nota dicevano che gli accordi
 * si chiudono con le liste, l'8 settembre. È falso — si depositano fino all'undicesimo
 * giorno prima del voto — e la prova non poteva accorgersene perché la data sbagliata era
 * scritta in un commento e in una frase, non in un numero.
 * Adesso il termine è UNA sola espressione, VOTO meno undici giorni, e da lì escono la
 * riga del calendario, la leva e la nota. */
{
  const T = A.termineApp();
  const atteso = new Date(Date.UTC(2026,9,27) - A.TERMINE_APP_GG*864e5).toISOString().slice(0,10);
  esito(T === atteso, 'il termine è il voto meno ' + A.TERMINE_APP_GG + ' giorni', T);
  esito(T === '2026-10-16', 'cioè il 16 ottobre 2026', T);
  esito(A.TERMINE_APP_GG === 11,
    'undici giorni, verificato su tre cicli: 2019, 2021 e 2022', String(A.TERMINE_APP_GG));

  const tap = A.TAPPE.filter(x => x.t === 'Termine per gli accordi di eccedenza');
  esito(tap.length === 1, 'il calendario ha la riga del termine, e una sola', String(tap.length));
  esito(tap.length === 1 && tap[0].d === T,
    'e la sua data è quella ricavata, non una copia', tap.length ? tap[0].d : '—');

  const dep8 = A.TAPPE.filter(x => x.t === 'Deposito delle liste')[0];
  esito(!!dep8 && dep8.d < T,
    'il deposito delle liste viene PRIMA del termine degli accordi: sono due date diverse',
    (dep8 ? dep8.d : '—') + ' contro ' + T);
  const distanza = Math.round((Date.parse(T) - Date.parse(dep8.d)) / 864e5);
  esito(distanza === 38, 'e fra le due passano 38 giorni', String(distanza));

  const sil = A.TAPPE.filter(x => x.t === 'Scatta il silenzio demoscopico')[0];
  const q = Math.round((Date.parse(sil.d) - Date.parse(T)) / 864e5);
  esito(q === 7,
    'il termine cade una settimana prima del silenzio demoscopico: nell\'ultima settimana gli accordi sono noti e i sondaggi finiti',
    q + ' giorni');

  /* la data non è scritta a mano da nessuna parte: se lo fosse, il giorno in cui il voto
     si sposta il calendario direbbe una cosa e la nota un'altra */
  const sorgente = fs.readFileSync(__dirname + '/../app.js','utf8');
  esito(!sorgente.includes("'2026-10-16'") && !sorgente.includes('"2026-10-16"'),
    'e la data del termine non compare come costante nel codice');

  A.rCalendario();
  const cal = D.getElementById('k-calend').textContent;
  esito(/Termine per gli accordi di eccedenza/.test(cal),
    'il calendario reso porta la tappa nuova');
  esito(/16 ottobre 2026/.test(cal), 'con la sua data per esteso');
}

/* ══ 12 · DOPO IL TERMINE UN ACCORDO NON DEPOSITATO NON È UN'IPOTESI ════════
 *
 * È una cosa che non è successa, e la differenza si vede solo spostando l'orologio: la
 * leva accesa il 17 ottobre non deve applicare niente. Si prova con `al`, che è la data
 * alla quale si valuta — la stessa che usa la serie storica per ricalcolare il passato —
 * e non con l'orologio, così la prova non dipende dal giorno in cui gira. */
{
  /* la tabella è controllata: un annunciato e nient'altro. Con quella pubblicata la prova
     direbbe cose diverse a seconda di che cosa è stato depositato quel giorno, e la
     proprietà — «dopo il termine un annunciato non vale più» — non dipende da questo. */
  const vere = A.APP.map(x => Object.assign({}, x));
  /* datato PRIMA della prima data che si interroga: da qui in giù l'orologio è congelato
     alla vigilia del termine, quindi «tre giorni fa» sarebbe ottobre e non entrerebbe nel
     conto del 30 settembre — la data si sceglie rispetto a quello che si chiede, non
     rispetto a oggi */
  A.setApp([{a:'raam', b:'lista_araba', data:giorniFa(60), stato:'proposto'}]);
  A.par('apparentamenti', 1);
  const T = A.termineApp();
  const prima = A.coppieAl('2026-09-30', true).length;
  const giorno = A.coppieAl(T, true).length;
  const dopo = A.coppieAl('2026-10-17', true).length;
  esito(prima === 1, 'prima del termine la leva accende l\'accordo annunciato', String(prima));
  esito(giorno === 1, 'e il giorno stesso del termine ancora: è l\'ultimo giorno utile', String(giorno));
  esito(dopo === 0, 'il giorno dopo no, e la leva non c\'entra: non è un\'ipotesi, è una cosa che non è successa',
    String(dopo));
  esito(A.coppieAl('2026-11-10', true).length === 0,
    'e a voto avvenuto nemmeno');
  A.setApp(vere);
  /* un DEPOSITATO invece attraversa il termine: è un fatto, non un'ipotesi */
  A.setApp([{a:'raam', b:'lista_araba', data:'2026-09-20', stato:'depositato'}]);
  esito(A.coppieAl('2026-10-17', false).length === 1,
    'un accordo depositato resta nel riparto anche dopo il termine');
  A.setApp(ORIG);
  A.par('apparentamenti', 0);
}

/* ══ 13 · UN ANNUNCIATO CHE MUORE, E IL 2022 DICE CHE È IL CASO NORMALE ═════
 * Nel 2022 nessuna delle tre liste arabe firmò: le trattative annunciate finirono in
 * niente. Il caso va previsto prima che succeda, o la sera in cui succede si scrive
 * codice di fretta su una pagina pubblica. */
{
  A.par('apparentamenti', 1);
  A.setApp([{a:'raam', b:'lista_araba', data:'2026-08-22', stato:'ritirato', fine:'2026-09-10'}]);
  esito(A.coppieAl('2026-09-05', true).length === 1,
    'prima del ritiro la serie storica lo vede ancora annunciato', String(A.coppieAl('2026-09-05', true).length));
  esito(A.coppieAl('2026-09-10', true).length === 0,
    'dal giorno del ritiro non esiste più', String(A.coppieAl('2026-09-10', true).length));
  /* e oggi: la data del ritiro si costruisce DA OGGI, non si scrive. Una data letterale
     qui direbbe «ritirato» soltanto finché è agosto — è l'invariante 10, e mediana.js
     l'ha già pagata una volta. */
  A.setApp([{a:'raam', b:'lista_araba', data:giorniFa(30), stato:'ritirato', fine:giorniFa(2)}]);
  esito(A.coppieAl(null, true).length === 0,
    'un accordo ritirato l\'altroieri oggi non vale, con la leva accesa o spenta',
    String(A.coppieAl(null, true).length));
  A.setApp([{a:'raam', b:'lista_araba', data:giorniFa(30), stato:'ritirato', fine:giorniFa(-5)}]);
  esito(A.coppieAl(null, true).length === 1,
    'e uno che verrà ritirato fra cinque giorni oggi vale ancora: la serie storica non riscrive il passato',
    String(A.coppieAl(null, true).length));
  A.setApp([{a:'raam', b:'lista_araba', data:'2026-08-22', stato:'ritirato'}]);
  esito(A.coppieAl(null, true).length === 0,
    'un ritirato senza data di ritiro non è mai vissuto: non si può fingere che valga oggi');
  A.setApp(ORIG);
  A.par('apparentamenti', 0);
}

/* ══ 14 · L'ETICHETTA DICE QUANTI ACCORDI APPLICA E IN CHE STATO ════════════
 *
 * «Apparentamenti» da solo non basta: chi lo preme deve sapere se guarda un fatto o
 * un'ipotesi. E IL NUMERO NON È APPARENTAMENTI.length — è quanti ne entrano davvero nel
 * riparto, che è un altro numero il primo giorno in cui una lista scende sotto soglia. */
{
  const B = () => D.getElementById('k-app');
  const riga = () => String(D.getElementById('k-appriga').innerHTML || '')
    .replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();

  /* LA TABELLA È CONTROLLATA, non quella pubblicata: l'etichetta esiste solo se c'è
     qualcosa da applicare per ipotesi, e dal primo deposito la tabella pubblicata può non
     avere più nessun annunciato — il comando sparirebbe e queste prove morirebbero su un
     pulsante nascosto, dicendo «difetto» dove c'è un accordo firmato.
     Il numero atteso esce da contoApp(), che è la stessa sorgente dell'etichetta: quello
     che si prova qui è la FORMA — azione, numero, singolare o plurale — mentre che il
     numero venga dal riparto e non dalla tabella lo prova la riga con la lista sotto
     soglia, più sotto. */
  const VERE = A.APP.map(x => Object.assign({}, x));
  A.setApp([{a:'raam', b:'lista_araba', data:giorniFa(2), stato:'proposto'}]);
  const nAnn = () => A.contoApp(A.sopraSoglia()).ann;
  /* L'ATTESA È CAMBIATA IL 23 AGOSTO 2026, ed è cambiata per una misura: «Aggiungi 1
     accordo annunciato» misura 195,4px a 380 contro una soglia di 191,1, quindi si
     prendeva una riga sua — e, peggio, «Togli 1 accordo annunciato» ne misura 171,9 e
     rientrava, cioè il gruppo dei comandi cambiava altezza di 36px SOTTO IL DITO a ogni
     pressione. «Apparentamento» sta a 178,9 e 155,4: tutte e due in riga.
     Quello che si prova qui non cambia: la FORMA — azione, numero, singolare o plurale —
     e che il numero venga da contoApp(). «Annunciato» non è sparito dalla pagina, è
     sceso nella riga di esito, e le asserzioni su quella sono più sotto e non si toccano. */
  const atteso = (az, n) => az + ' ' + n + ' ' + (n === 1 ? 'apparentamento' : 'apparentamenti');
  A.par('apparentamenti', 0); A.render();
  esito(nAnn() > 0,
    'c\'è almeno un accordo annunciato in tabella, o le prove sull\'etichetta non guardano niente',
    String(nAnn()));
  esito(B().textContent === atteso('Aggiungi', nAnn()),
    'a leva spenta l\'etichetta dice l\'azione, il numero e lo stato', B().textContent);
  esito(!B().hidden, 'e il comando c\'è');
  const eti0 = B().getAttribute('aria-label');
  esito(eti0 === B().getAttribute('title'),
    'aria-label e title sono la stessa stringa, nata una volta sola', eti0);
  esito(eti0.indexOf(B().textContent) === 0,
    'e il nome accessibile COMINCIA col testo visibile: WCAG 2.5.3, chi comanda a voce dice quello che vede',
    eti0);
  esito(/Ra'am e Lista Unita araba/.test(eti0), 'il nome accessibile dice anche QUALI', eti0);
  esito(B().getAttribute('aria-pressed') === null,
    'e non porta aria-pressed: il nome dice l\'azione e cambia premendo, quindi lo direbbe al contrario');

  A.par('apparentamenti', 1); A.render();
  esito(B().textContent === atteso('Togli', nAnn()),
    'premuto, il nome cambia — ed è quello il riscontro', B().textContent);
  const eti1 = B().getAttribute('aria-label');
  esito(eti1.indexOf(B().textContent) === 0 && eti1 !== eti0,
    'anche il nome accessibile cambia, e comincia sempre col testo visibile', eti1);
  esito(/dal riparto/.test(eti1) && /al riparto/.test(eti0),
    'con la preposizione giusta nei due versi: si aggiunge AL riparto e si toglie DAL riparto');
  A.par('apparentamenti', 0); A.render();

  /* IL NUMERO VIENE DA coppieRiparto(). Due accordi in tabella, uno dei quali su una lista
     che non siede: l'etichetta deve dire UNO, perché uno solo entra. Con
     APPARENTAMENTI.length direbbe due, e il riparto ne applicherebbe uno. */
  const sotto = Object.keys(A.stato().QUO).filter(k => A.stato().QUO[k] < SOGLIA)[0];
  esito(!!sotto, 'nell\'archivio c\'è almeno una lista sotto soglia, o questa prova non prova niente', sotto);
  const UNA = [{a:'raam', b:'lista_araba', data:giorniFa(2), stato:'proposto'}];
  A.setApp(UNA.concat([{a: sotto, b:'shas', data:giorniFa(4), stato:'proposto'}]));
  A.render();
  esito(A.APP.length === 2 && B().textContent === atteso('Aggiungi', 1),
    'con un accordo in più sciolto dalla soglia, l\'etichetta non lo conta',
    A.APP.length + ' in tabella, etichetta «' + B().textContent + '»');
  esito(/non è sopra la soglia/.test(riga()),
    'e la riga di esito dichiara lo scarto CON LA RAGIONE', riga());
  esito(riga().indexOf(A.nm(sotto)) >= 0, 'nominando la lista che lo scioglie');

  /* due accordi che si contendono la stessa lista: il DEPOSITATO vince, e non perché è
     scritto prima — qui è scritto dopo apposta */
  A.setApp([{a:'raam', b:'lista_araba', data:'2026-08-22', stato:'proposto'},
            {a:'lista_araba', b:'democratici', data:'2026-08-23', stato:'depositato'}]);
  A.par('apparentamenti', 1); A.render();
  const dentro = A.coppieRiparto(A.sopraSoglia(), null);
  esito(dentro.length === 1 && dentro[0].stato === 'depositato',
    'fra un annunciato e un depositato che condividono una lista entra il depositato, benché scritto dopo',
    JSON.stringify(dentro.map(x => x.a + '+' + x.b + ' ' + x.stato)));
  esito(/è già in un altro accordo/.test(riga()),
    'e la riga dichiara perché l\'altro è rimasto fuori', riga());
  A.par('apparentamenti', 0);

  /* il plurale, che è la forma in cui questa etichetta vivrà da settembre */
  A.setApp([{a:'raam', b:'lista_araba', data:giorniFa(3), stato:'proposto'},
            {a:'shas', b:'utj', data:giorniFa(2), stato:'proposto'}]);
  A.render();
  esito(B().textContent === 'Aggiungi 2 apparentamenti',
    'con due accordi annunciati l\'etichetta va al plurale, e il numero è due', B().textContent);
  A.setApp(VERE); A.render();
}

/* ══ 15 · LA RIGA DI ESITO DICE I DEPOSITATI, CHE NESSUN PULSANTE GOVERNA ═══
 * E dice l'effetto in BLOCCHI, non solo in seggi: l'unico accordo in tabella oggi sposta
 * un seggio da un blocco all'altro, e «un seggio» sarebbe vero e depotenziato. */
{
  const riga = () => String(D.getElementById('k-appriga').innerHTML || '')
    .replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();

  /* tabella controllata, per la stessa ragione del §14: qui si prova che cosa la riga
     DICE nei tre regimi, non che cosa c'è in anagrafica stasera */
  const VERE15 = A.APP.map(x => Object.assign({}, x));
  A.setApp([{a:'raam', b:'lista_araba', data:giorniFa(2), stato:'proposto'}]);
  A.par('apparentamenti', 0); A.render();
  const spenta = riga();
  esito(/Nessun accordo di eccedenza è ancora depositato/.test(spenta),
    'a leva spenta dice che non c\'è niente di depositato', spenta);
  esito(/16 ottobre 2026/.test(spenta) && /non il deposito delle liste/.test(spenta),
    'e dice il termine vero, contro quello che il lettore darebbe per scontato', spenta);
  {
    const vivi = A.coppieAl(null, true).filter(x => x.stato !== 'depositato');
    esito(spenta.indexOf(vivi.length + ' annunciat') >= 0,
      'dice quanti sono gli annunciati', vivi.length + ' · ' + spenta);
    esito(vivi.every(x => spenta.indexOf(A.nm(x.a)) >= 0 && spenta.indexOf(A.nm(x.b)) >= 0),
      'e li nomina tutti', spenta);
    esito(vivi.every(x => spenta.indexOf(String(+x.data.slice(8, 10))) >= 0),
      'ciascuno con la sua data', spenta);
  }

  A.par('apparentamenti', 1); A.render();
  const accesa = riga();
  esito(/ipotesi, non un fatto/.test(accesa),
    'a leva accesa dichiara che è un\'ipotesi, non un fatto', accesa);

  /* LE DUE STRADE LEGATE, E SENZA ASSERIRE UNA MISURA. Quanto valga l'accordo dipende
     dall'archivio del giorno — oggi uno, il 22 agosto zero — quindi la prova non scrive
     un seggio: rifà il conto e verifica che la riga dica QUELLO. Se dicesse «un seggio»
     cadrebbe alla prima rilevazione nuova, e cadrebbe dicendo «difetto» dove c'è un
     sondaggio in più. */
  const S2 = A.stato(), b = A.blocchi(S2.SEG);
  const senza = A.dhondt(S2.QUO, null, []), bs = A.blocchi(senza);
  let mossi = 0;
  Object.keys(S2.SEG).forEach(k => { if (S2.SEG[k] > (senza[k]||0)) mossi += S2.SEG[k] - (senza[k]||0); });
  const cambiati = ['coalizione','opposizione','arabo','incerto'].filter(z => bs[z] !== b[z]);
  console.log('  [misura] l\'accordo annunciato vale ' + mossi + ' seggi sul seme di prova, ' +
    'blocchi ' + JSON.stringify(bs) + ' → ' + JSON.stringify(b));
  /* le espressioni sono senza distinzione di maiuscole apposta: la frase dei seggi comincia
     una proposizione nuova — «Vale 1 seggio» — e una prova ancorata alla minuscola cadrebbe
     su una virgola spostata invece che su un difetto */
  esito(mossi
      ? new RegExp('(vale|valgono) ' + mossi + ' segg', 'i').test(accesa)
      : /non sposta(no)? nessun seggio/i.test(accesa),
    'la riga dice esattamente i seggi che il riparto ha mosso', mossi + ' · ' + accesa);
  esito(cambiati.every(z => accesa.indexOf('→ ' + b[z]) >= 0),
    'e per ogni blocco che si muove scrive il numero di arrivo vero',
    cambiati.join(', ') + ' · ' + accesa);
  esito(!cambiati.length || /Blocco Netanyahu|Opposizione sionista|Partiti arabi|arab/i.test(accesa),
    'nominando il blocco e non solo il seggio', accesa);
  A.par('apparentamenti', 0); A.render();

  /* E IL RAMO CHE SI MUOVE, che sul seme di prova l'accordo vero non esercita. Senza
     questo, metà della riga di esito non sarebbe provata da nessuno: si cerca una coppia
     che sposti almeno un seggio invece di scriverne una a caso, perché quale sia dipende
     dall'archivio e cambia da un giorno all'altro. */
  {
    const S3 = A.stato();
    const sopraQ = Object.keys(S3.QUO).filter(k => S3.QUO[k] >= SOGLIA);
    let trovata = null, atteso = null, blocchiAttesi = null;
    for (let i = 0; i < sopraQ.length && !trovata; i++)
      for (let j = i + 1; j < sopraQ.length && !trovata; j++) {
        const cp = [{a: sopraQ[i], b: sopraQ[j], data: giorniFa(3), stato: 'proposto'}];
        A.setApp(cp); A.par('apparentamenti', 1);
        const base = A.dhondt(S3.QUO, null, []), con = A.dhondt(S3.QUO, null, A.coppieRiparto(A.sopraSoglia(), null));
        let m = 0; Object.keys(con).forEach(k => { if (con[k] > (base[k]||0)) m += con[k] - (base[k]||0); });
        if (m) { trovata = cp; atteso = m; blocchiAttesi = [A.blocchi(base), A.blocchi(con)]; }
      }
    esito(!!trovata, 'sul seme di prova esiste almeno una coppia che sposta un seggio: il ramo si può esercitare',
      trovata ? trovata[0].a + '+' + trovata[0].b + ' vale ' + atteso : 'nessuna');
    if (trovata) {
      A.setApp(trovata); A.par('apparentamenti', 1); A.render();
      const r = riga();
      esito(new RegExp('(vale|valgono) ' + atteso + ' segg', 'i').test(r),
        'e la riga scrive quel numero di seggi', atteso + ' · ' + r);
      const cambiati = ['coalizione','opposizione','arabo','incerto']
        .filter(z => blocchiAttesi[0][z] !== blocchiAttesi[1][z]);
      esito(cambiati.every(z => r.indexOf('→ ' + blocchiAttesi[1][z]) >= 0),
        cambiati.length ? 'e i numeri di arrivo dei blocchi che si muovono' : 'e se nessun blocco si muove non ne inventa',
        cambiati.join(', ') + ' · ' + r);
      esito(!cambiati.length || /fra i blocchi/.test(r),
        'dicendo che il seggio attraversa il confine, che è il fatto che conta', r);
    }
    A.setApp(ORIG); A.par('apparentamenti', 0); A.render();
  }

  /* con un depositato la riga lo dice anche a leva spenta, perché nessun comando lo governa */
  A.setApp([{a:'raam', b:'lista_araba', data:giorniFa(1), stato:'depositato'}]);
  A.render();
  const dep = riga();
  esito(/1 accordo depositato/.test(dep) && /sempre nel riparto/.test(dep),
    'un accordo depositato è dichiarato dalla riga anche a leva spenta', dep);
  esito(D.getElementById('k-app').hidden,
    'e il comando sparisce, perché non c\'è più niente da applicare per ipotesi');
  A.setApp(VERE15); A.render();
}

/* ══ 16 · GLI ALTRI TRE PULSANTI DELLE IPOTESI HANNO L'ETICHETTA FISSA ══════
 * Quindi lo stato lo può dire solo aria-pressed, e fino a oggi mancava: un lettore di
 * schermo non sapeva se «Solo ultimi 7 giorni» fosse alzata o abbassata. È la grammatica
 * opposta a quella del comando degli accordi, ed è la stessa distinzione già scritta per
 * i pulsanti dell'house effect. */
{
  const par = ['recenti','listaunita','apparentamenti'];
  A.par('recenti', 0); A.par('listaunita', 1); A.render();
  const b = k => D.querySelector('[data-par="' + k + '"]');
  esito(b('recenti').getAttribute('aria-pressed') === 'false',
    '«Solo ultimi 7 giorni» dichiara di non essere premuto', b('recenti').getAttribute('aria-pressed'));
  esito(b('listaunita').getAttribute('aria-pressed') === 'true',
    'e «Lista Unita araba», che nasce accesa, dichiara di esserlo', b('listaunita').getAttribute('aria-pressed'));
  A.par('recenti', 1); A.render();
  esito(b('recenti').getAttribute('aria-pressed') === 'true',
    'e il valore segue la leva, non il render', b('recenti').getAttribute('aria-pressed'));
  A.par('recenti', 0); A.render();
  esito(b('apparentamenti').getAttribute('aria-pressed') === null,
    'il quarto no, ed è la ragione per cui la regola è scritta e non dedotta');
  esito(par.every(k => k === 'apparentamenti' || b(k).textContent === b(k).textContent.trim()),
    'gli altri tre hanno l\'etichetta fissa: è per questo che gli serve aria-pressed');
}

/* ══ 17 · LA NOTA NON DICE PIÙ IL FALSO ═════════════════════════════════════ */
{
  const testo = () => String((D.getElementById('k-foot') || {}).innerHTML || '')
    .replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  A.par('apparentamenti', 0); A.rFoot();
  const n = testo();
  esito(!/il termine è quello del deposito delle liste/.test(n),
    'la frase falsa non c\'è più: il termine NON è quello del deposito delle liste');
  esito(/Il termine per depositarli non è quello delle liste/.test(n),
    'e la nota lo dice esplicitamente, perché è la cosa che il lettore dà per scontata', n.slice(0,200));
  esito(/16 ottobre 2026/.test(n), 'con la data ricavata');
  esito(/38 giorni dopo la chiusura delle liste/.test(n),
    'e la distanza dalle liste calcolata, non scritta');
  esito(/7 giorni prima del silenzio demoscopico/.test(n),
    'e dice che nell\'ultima settimana gli accordi saranno noti e i sondaggi finiti');
  esito(/nel 2022 tutti e quattro nell'ultima settimana utile/.test(n),
    'e che storicamente si firmano tardi: è la ragione per cui la tabella oggi è quasi vuota');
}

/* ══ 18 · IL GIORNO DOPO IL TERMINE, SULLA PAGINA RESA ══════════════════════
 * Le due prove precedenti hanno provato il motore con `al`; questa prova quello che il
 * lettore vede, che è l'altra metà: il comando sparisce e la riga smette di offrire un
 * controfattuale. */
{
  /* tabella controllata con un solo ANNUNCIATO: è quello che dopo il termine deve morire.
     Con la tabella pubblicata, un accordo depositato — che dopo il termine resta, ed è
     giusto — farebbe cadere queste prove dicendo «difetto» dove c'è un accordo firmato. */
  const VERE18 = A.APP.map(x => Object.assign({}, x));
  A.setApp([{a:'raam', b:'lista_araba', data:giorniFa(60), stato:'proposto'}]);
  congela(DOPO);
  A.par('apparentamenti', 1);     /* accesa apposta: dopo il termine non deve contare */
  A.render();
  const riga = String(D.getElementById('k-appriga').innerHTML || '')
    .replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  esito(D.getElementById('k-app').hidden,
    'il giorno dopo il termine il comando non c\'è più');
  esito(/termine per gli accordi di eccedenza è passato/i.test(riga),
    'e la riga di esito lo dichiara', riga);
  esito(!/ipotesi, non un fatto/.test(riga),
    'e non offre più nessun controfattuale, benché la leva sia rimasta accesa', riga);
  esito(/non contano più/.test(riga),
    'dice che gli annunciati e mai depositati non contano più: non è un\'ipotesi, è una cosa che non è successa',
    riga);
  esito(A.coppieRiparto(A.sopraSoglia(), null).length === 0,
    'e nel riparto non entra niente, che è il fatto sotto la frase');

  const S = A.stato();
  esito(Object.keys(S.SEG).reduce((a,k) => a + S.SEG[k], 0) === 120,
    'e i seggi fanno sempre 120: l\'invariante 1 vale anche dopo il termine');

  A.rFoot();
  const nota = String(D.getElementById('k-foot').innerHTML || '').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  esito(/Gli accordi annunciati e mai depositati/.test(nota),
    'e la nota metodologica cambia ramo con lei', nota.slice(-320));
  A.par('apparentamenti', 0);
  A.setApp(VERE18);
}
scongela();
A.setApp(ORIG);
A.render();

/* ══ 19 · LE CONVALIDE: UNA RIGA SBAGLIATA NON PASSA, E DICE PERCHÉ ═════════
 *
 * Questa tabella si riempie a mano, di sera, e il 16 ottobre potrebbero esserci quattro
 * righe da mettere insieme. Provati uno per uno i nove modi di sbagliarla il 23 agosto
 * 2026, PRIMA delle convalide: tre passavano in silenzio totale — data nel futuro, campo
 * `data` mancante, la stessa lista due volte — e due cambiavano significato senza dirlo,
 * perché uno `stato` scritto male non è nessuno dei tre valori e finiva fra gli
 * annunciati. Un accordo che credevi depositato non entrava nel riparto.
 *
 * Qui si prova che ognuno dei nove ADESSO parla, e che parla con il motivo giusto: «non è
 * in P{}» e non «non è sopra la soglia», che mandava a cercare nel posto sbagliato. */
{
  const buona = {a:'shas', b:'utj', data:giorniFa(2), stato:'depositato'};
  esito(A.erroriRiga(buona).length === 0, 'una riga buona non ha errori',
    A.erroriRiga(buona).join('; '));

  const CASI = [
    ['id che non esiste',        {a:'raamm', b:'lista_araba', data:giorniFa(1), stato:'proposto'}, /non è in P\{\}/],
    ['campo «a» mancante',       {b:'lista_araba', data:giorniFa(1), stato:'proposto'},            /manca il campo «a»/],
    ['campo «b» mancante',       {a:'raam', data:giorniFa(1), stato:'proposto'},                   /manca il campo «b»/],
    ['la stessa lista due volte',{a:'raam', b:'raam', data:giorniFa(1), stato:'proposto'},         /apparentata con sé stessa/],
    ['campo «data» mancante',    {a:'shas', b:'utj', stato:'depositato'},                          /manca il campo «data»/],
    ['data nel futuro',          {a:'shas', b:'utj', data:giorniFa(-30), stato:'depositato'},       /è nel futuro/],
    ['data malformata',          {a:'shas', b:'utj', data:'22-08-2026', stato:'depositato'},        /non è nella forma/],
    ['stato scritto male',       {a:'shas', b:'utj', data:giorniFa(1), stato:'depositatp'},        /lo stato «depositatp» non esiste/],
    ['stato con la maiuscola',   {a:'shas', b:'utj', data:giorniFa(1), stato:'Depositato'},        /lo stato «Depositato» non esiste/],
    ['ritirato senza «fine»',    {a:'shas', b:'utj', data:giorniFa(9), stato:'ritirato'},          /senza il campo «fine»/],
    ['ritiro prima dell\'annuncio', {a:'shas', b:'utj', data:giorniFa(2), stato:'ritirato', fine:giorniFa(9)}, /precede l'annuncio/],
    ['depositato con una «fine»',{a:'shas', b:'utj', data:giorniFa(9), stato:'depositato', fine:giorniFa(2)}, /non può avere una data di ritiro/]
  ];
  CASI.forEach(function(c){
    const e = A.erroriRiga(c[1]);
    esito(e.length > 0 && c[2].test(e.join(' ')),
      'la convalida prende «' + c[0] + '» e lo dice col motivo giusto', e.join('; ') || 'nessun errore');
    /* e la riga sbagliata non entra DA NESSUNA PARTE, che è la metà che conta */
    A.setApp([c[1]]); A.par('apparentamenti', 1);
    esito(A.coppieAl(null, true).length === 0 && A.coppieRiparto(A.sopraSoglia(), null).length === 0,
      '  · e non entra né fra le coppie attive né nel riparto');
  });

  /* la fascia rossa lo dice al lettore, e nomina la riga */
  A.setApp([{a:'raamm', b:'lista_araba', data:giorniFa(1), stato:'proposto'}]);
  A.render();
  const fascia = String((D.getElementById('k-msg') || {}).textContent || '');
  esito(/riga sbagliata|righe sbagliate/.test(fascia), 'la pagina lo dichiara con la fascia rossa', fascia.slice(0, 140));
  esito(/raamm/.test(fascia) && /non è in P\{\}/.test(fascia),
    'nominando la riga e il motivo', fascia.slice(0, 200));
  A.setApp(ORIG); A.par('apparentamenti', 0); A.render();
}

/* ══ 20 · ZERO, UNO E TRE ACCORDI IN CIASCUNO STATO ═════════════════════════
 * Le prove devono reggere la tabella che ci sarà, non quella che c'è. Il 2021 ne ha visti
 * sei, il 2022 quattro: tre righe insieme sono lo scenario normale, non l'estremo. */
{
  const COPPIE = [['shas','utj'], ['likud','sionismo_rel'], ['democratici','beitenu']];
  const riga = (p, st, i) => {
    const r = {a:p[0], b:p[1], data:giorniFa(10 + i), stato:st};
    if (st === 'ritirato') r.fine = giorniFa(1);
    return r;
  };
  const testoRiga = () => String(D.getElementById('k-appriga').innerHTML || '')
    .replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();

  ['proposto','depositato','ritirato'].forEach(function(st){
    [0, 1, 3].forEach(function(n){
      const tab = COPPIE.slice(0, n).map((p, i) => riga(p, st, i));
      A.setApp(tab); A.par('apparentamenti', 1);
      let vivo = true;
      try { A.render(); } catch(e){ vivo = false; }
      const eti = n + ' ' + st + (n === 1 ? '' : 'i');
      esito(vivo, 'con ' + eti + ' la pagina si rende', eti);
      if (!vivo) return;

      esito(A.valida().length === 0, '  · e la tabella è valida', A.valida().map(r => r.errori.join('; ')).join(' | '));
      const S = A.stato();
      esito(Object.keys(S.SEG).reduce((a, k) => a + S.SEG[k], 0) === 120, '  · i seggi fanno 120');

      const c = A.contoApp(A.sopraSoglia());
      const atteso = st === 'depositato' ? n : 0;
      esito(c.dep === atteso, '  · i depositati contati sono ' + atteso, String(c.dep));
      /* un ritirato con `fine` nel passato non è vivo oggi: né depositato né annunciato */
      esito(st === 'ritirato' ? c.ann === 0 : true, '  · un ritirato non conta fra gli annunciati', String(c.ann));

      const B = D.getElementById('k-app');
      esito(B.hidden === !(c.ann > 0 && !c.oltre),
        '  · il comando c\'è quando e solo quando ha qualcosa da applicare',
        'hidden ' + B.hidden + ' · ann ' + c.ann);
      if (!B.hidden)
        esito(B.textContent === 'Togli ' + c.ann + ' ' + (c.ann === 1 ? 'apparentamento' : 'apparentamenti'),
          '  · e l\'etichetta concorda col conto', B.textContent);
      esito(testoRiga().length > 20, '  · la riga di esito dice qualcosa', testoRiga().slice(0, 90));
      if (atteso) esito(testoRiga().indexOf(atteso + ' accord') >= 0,
        '  · e dichiara i depositati, che nessun comando governa', testoRiga().slice(0, 120));
    });
  });
  A.setApp(ORIG); A.par('apparentamenti', 0); A.render();
}

console.log('\napparentamenti: ' + ok + '/' + (ok + ko));
if (ko) process.exit(1);
