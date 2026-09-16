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
/* IL FUSO SI IMPONE QUI, PRIMA DI QUALUNQUE Date, come in giorni.js, date.js e deposito.js.
   esegui.mjs lancia le suite con l'ambiente ereditato e non ne fissa nessuno: il lavoro
   notturno gira su GitHub in UTC, e la macchina su cui questa riga è stata scritta sta in
   Europe/Berlin. In UTC la vigilia calcolata da una mezzanotte locale coincide con quella
   UTC, cioè il difetto che il §5 esiste per cogliere NON SI MANIFESTA — e la sezione sarebbe
   verde nel solo posto in cui conta, il cancello del job. Il §5 verifica che l'imposizione
   abbia avuto effetto, invece di darla per scontata. */
process.env.TZ = 'Europe/Rome';

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
  'sim:function(v){SIM=v;},sig:function(v){SIG=v;},montecarlo:montecarlo,' +
  'parola:parolaProposto,setQS:function(q,s){QUO=q;SEG=s;},' +
  'filtraRiparto:filtraRiparto,effettoApp:effettoApp,ripartoDepositati:ripartoDepositati,' +
  'ipotesiNeiNumeri:ipotesiNeiNumeri,testoCondivisione:testoCondivisione,promptAI:promptAI,' +
  'statoLeve:(typeof statoLeve===\'function\'?statoLeve:null)};carica().then(render,render)');
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

/* L'ATTESA È CAMBIATA IL 14 SETTEMBRE 2026, DI PROPOSITO: la leva nasce accesa, per decisione
   dell'autore e a termine fino al 16 ottobre. Quello che si prova qui resta la stessa cosa —
   la pagina parte dal predefinito dichiarato — e la ragione del valore sta nel §22. */
esito(A.par('apparentamenti') === A.PAR_DEF.apparentamenti && A.PAR_DEF.apparentamenti === 1,
  'la leva degli apparentamenti firmati nasce accesa, dal predefinito', String(A.par('apparentamenti')));
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
  /* LA LEVA SI SPEGNE QUI, invece di darla per spenta: fino al 14 settembre 2026 lo era per
     difetto, e l'asserzione diceva «a leva spenta» affidandosi al predefinito */
  A.par('apparentamenti', 0);
  esito(A.coppieRiparto(null, null).length === A.APP.filter(x => x.stato === 'depositato').length,
    'e con la tabella vera, a leva spenta, entrano esattamente i depositati',
    A.coppieRiparto(null, null).length + ' contro ' + A.APP.filter(x => x.stato === 'depositato').length + ' depositati');
  A.par('apparentamenti', A.PAR_DEF.apparentamenti);
}

{
  const S = A.stato();
  /* IL FATTO E' DEL SEME, NON DELL'ARCHIVIO. Qui S.QUO sono le quote del seme BASE, perche' in
     jsdom il fetch fallisce. Fino al 15 settembre 2026 l'attesa era «il riparto con gli accordi
     coincide con quello senza»: portava dentro un fatto dei dati, vero finche' sul seme gli
     accordi firmati non spostavano niente. La correzione della riga Direct Polls del 18 agosto
     2026 (Ra'am 5→6, Hadash–Ta'al 6→5, come l'ha corretta la fonte il 20) fa valere un seggio
     all'accordo Ra'am + Lista Unita araba, da Yashar ai partiti arabi; sull'archivio pubblicato
     lo stesso accordo non cambia valore. La proprieta' del titolo della sezione — senza coppie il
     riparto e' quello di prima — la prova l'asserzione qui sopra che svuota la tabella, e non
     dipende dai dati. Se il seme cambia, questa attesa si rifa' sul fatto nuovo: non si aggiusta. */
  /* LA DATA E' IL FATTO, NON «ADESSO». dhondt() senza data valuta gli accordi a oggi, e dopo
     il 16 ottobre gli annunciati e mai depositati non contano piu': con l'orologio al 23
     ottobre lo scarto era vuoto e questa attesa cadeva, avendo ragione il codice. Il fatto
     che si prova e' quello misurato il 15 settembre 2026, quindi la data e' quella: e' la
     data letterale legittima dell'invariante 10, non un modo di dire «oggi». */
  const conAcc = A.dhondt(S.QUO, '2026-09-15'), senzaAcc = A.ripartoSoglia(S.QUO);
  const scarto = Object.keys(Object.assign({}, conAcc, senzaAcc))
    .filter(k => (conAcc[k] || 0) !== (senzaAcc[k] || 0))
    .map(k => { const d = (conAcc[k] || 0) - (senzaAcc[k] || 0); return k + ' ' + (d > 0 ? '+' : '') + d; })
    .sort().join(', ');
  esito(scarto === 'lista_araba +1, yashar -1',
    'sul SEME, non sull archivio, gli accordi firmati spostano un seggio da Yashar alla Lista Unita ' +
    'araba: e il fatto dopo la correzione della riga del 18 agosto',
    scarto || 'nessuno scarto: gli accordi non spostano niente');
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

/* ══ 5 · GLI ACCORDI NON RETROAGISCONO ══════════════════════════════════════
 * RISCRITTA IL 13 SETTEMBRE 2026: le due asserzioni di prima erano verdi per coincidenza,
 * e per DUE coincidenze diverse.
 * La prima: prendevano ORIG[0] e contavano TUTTA la tabella — `=== 0` alla vigilia,
 * `=== 1` il giorno dell'annuncio. Finché la tabella aveva una riga sola, «nella tabella
 * non c'è niente» e «quell'accordo non c'è» erano la stessa frase. Con le tre righe del 10
 * e del 12 settembre non lo sono più: alla vigilia dell'accordo arabo esistono già i due
 * dell'opposizione.
 * La seconda sta sotto, ed è la trappola già registrata per giornoUTC(): `prima` partiva da
 * una mezzanotte LOCALE letta con toISOString(), che a Roma sta nel giorno precedente. La
 * vigilia usciva DUE giorni prima invece di uno — per l'accordo del 12 stampava il 10 — e
 * con la data del 22 agosto dava il 20, cioè comunque prima, e passava.
 *
 * Adesso tre cose, e ciascuna chiude una delle due coincidenze o la terza che le teneva
 * nascoste:
 * · l'accordo si cerca PER COPPIA DI ID, e se non si trova la sezione CADE dicendolo — mai
 *   un'asserzione su un undefined, mai uno zero su zero che si legge verde;
 * · si esercitano TUTTE le righe, e si pretende che coprano date diverse: la proprietà è
 *   «nessun accordo retroagisce», non «il primo non retroagisce»;
 * · la vigilia si calcola in UTC, e una prova dice che è UN giorno prima. È quella la prova
 *   che coglie il ritorno alla mezzanotte locale: la presenza da sola non basta, perché due
 *   giorni prima l'accordo non c'è comunque.
 * E QUEST'ULTIMA VALE SOLO A ROMA, di proposito: con TZ=UTC mezzanotte locale e mezzanotte
 * UTC coincidono e il difetto non esiste. Il banco impone TZ=Europe/Rome; qui lo si
 * verifica, perché una prova che gira nel fuso sbagliato è verde senza provare niente. */

{
  const zona = Intl.DateTimeFormat().resolvedOptions().timeZone;
  esito(zona === 'Europe/Rome',
    'la suite gira con TZ=Europe/Rome: in UTC il difetto della mezzanotte locale non si manifesta', zona);

  A.par('apparentamenti', 1);
  /* LE TRE COPPIE SONO I FATTI CHE QUESTA SEZIONE PROVA, e stanno scritte qui apposta: la data
     no — si legge dalla riga trovata — perché è la cosa che la proprietà interroga. Se un
     giorno una delle tre esce dalla tabella, la sezione cade e chiede di aggiornare l'elenco
     invece di provare di meno in silenzio. */
  const COPPIE = [['lista_araba', 'raam'], ['byachad', 'beitenu'], ['yashar', 'democratici']];
  const stessa = (x, a, b) => (x.a === a && x.b === b) || (x.a === b && x.b === a);
  const cerca = (a, b) => ORIG.find(x => stessa(x, a, b));
  const giorno = iso => Date.parse(iso + 'T00:00:00Z');
  const esercitati = [];

  COPPIE.forEach(([a, b]) => {
    const acc = cerca(a, b);
    esito(!!acc, 'l\'accordo ' + a + ' + ' + b + ' è in tabella',
      'NON TROVATO: la sezione non può provarlo, e cade invece di saltarlo');
    if (!acc) return;
    esercitati.push(acc);

    const prima = new Date(giorno(acc.data) - 864e5).toISOString().slice(0, 10);
    esito((giorno(acc.data) - giorno(prima)) / 864e5 === 1,
      '  la vigilia di ' + a + ' + ' + b + ' è UN giorno prima, non due',
      prima + ' → ' + acc.data);

    const presente = al => A.coppieRiparto(null, al).some(x => stessa(x, a, b));
    esito(!presente(prima),
      '  alla vigilia dell\'annuncio ' + a + ' + ' + b + ' non esiste ancora: la serie storica non lo fa retroagire',
      prima);
    esito(presente(acc.data), '  e dal giorno dell\'annuncio sì', acc.data);

    const q = quoteCasuali(9), ids = Object.keys(q), q4 = {};
    ids.forEach((k, j) => { q4[j === 0 ? a : (j === 1 ? b : k)] = q[k]; });
    esito(ugual(A.dhondt(q4, prima), A.ripartoSoglia(q4)),
      '  e a quella data il riparto è quello senza accordi');
  });

  esito(esercitati.length === COPPIE.length,
    'tutte e ' + COPPIE.length + ' le righe sono state esercitate', esercitati.length + ' su ' + COPPIE.length);
  esito(new Set(esercitati.map(x => x.data)).size >= 2,
    'e coprono date diverse: la proprietà vale per ogni accordo, non per il primo',
    esercitati.map(x => x.data).join(', '));
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
  /* L'elenco è nominale apposta: è l'unica cosa che si accorge di una chiave aggiunta o
     tolta in silenzio, e la seconda copia di PAR_DEF dentro «azzera» è stata trovata così.
     Il quarto parametro — inbilico, la leva delle liste che non stanno con nessuno dei due
     campi — è entrato il 27 agosto 2026. */
  esito(Object.keys(A.PAR_DEF).sort().join(',') === 'apparentamenti,inbilico,listaunita,recenti',
    'PAR_DEF porta tutti e quattro i parametri', Object.keys(A.PAR_DEF).sort().join(','));
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

/* ══ 9b · LE TRE RIGHE DEL 10 E DEL 12 SETTEMBRE 2026 ═══════════════════════
 * Stanno qui, dopo congela(PRIMA), e non in testa al file: due di queste prove accendono la
 * leva, e dopo il 16 ottobre la leva non ha niente da applicare — eseguite con l'orologio
 * vero, `npm run spazzola` le troverebbe mute. Il confronto a leva spenta vale a qualunque
 * data, ma sta con loro perché è la stessa tabella. */

/* ── 1 · A LEVA SPENTA OGNI NUMERO IN PAGINA È IDENTICO A PRIMA ───────────────
 * Il file lo impone dalla prima riga e fino a oggi lo provava sul RIPARTO, non sulla
 * pagina: SEG uguale non dice che il Monte Carlo, le probabilità, i totali delle pastiglie
 * e la tendenza siano uguali. Qui si rende la pagina due volte — con i soli depositati, e
 * con la tabella vera — e si confrontano tutti i numeri che la pagina scrive.
 * Il Monte Carlo usa Math.random, quindi i due render hanno lo STESSO seme: senza, due
 * pagine identiche differirebbero per rumore e la prova non potrebbe mai essere verde a
 * ragione. Il seme si prova per primo, o un confronto verde non vorrebbe dire niente.
 * E il verso che manca sempre: a leva ACCESA almeno un numero si muove, o il confronto
 * sarebbe cieco. Misurato il 13 settembre 2026 sul seme: 0 numeri diversi su 4537 a leva
 * spenta, 19 a leva accesa — si muove il Monte Carlo, non la proiezione centrale. */
{
  const veroRandom = Math.random;
  function semina(){
    let s = 987654321;
    Math.random = function(){ s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  }
  /* LE SEDI CHE DESCRIVONO LA TABELLA cambiano per forza, e sono dichiarate con la ragione:
     tutto il resto della pagina deve restare identico al numero */
  const SEDI_DELLA_TABELLA = {
    'k-app':     'il pulsante esiste e dice quanti accordi aggiunge solo se in tabella ce ne sono',
    'k-appriga': 'la riga di esito elenca gli accordi con nomi e data',
  };
  const PARAGRAFO_DELLA_NOTA = /heskem odafim/;   /* la nota metodologica elenca gli accordi con la data */
  function numeri(){
    const r = D.getElementById('kn26').cloneNode(true);
    Object.keys(SEDI_DELLA_TABELLA).forEach(id => { const e = r.querySelector('#' + id); if (e) e.remove(); });
    const foot = r.querySelector('#k-foot');
    if (foot) [...foot.querySelectorAll('p')].forEach(p => { if (PARAGRAFO_DELLA_NOTA.test(p.textContent)) p.remove(); });
    return r.textContent.match(/-?\d+(?:[.,]\d+)?/g) || [];
  }
  function giro(tabella, leva){
    A.setApp(tabella); A.par('apparentamenti', leva); semina(); A.render();
    const S = A.stato();
    return {n: numeri(), seg: JSON.stringify(S.SEG), quo: JSON.stringify(S.QUO)};
  }
  const diversi = (a, b) => { let d = 0; for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) d++; return d; };
  const DEP = ORIG.filter(x => x.stato === 'depositato');

  const s1 = giro(DEP, 0), s2 = giro(DEP, 0);
  esito(diversi(s1.n, s2.n) === 0,
    'il seme è riproducibile: due render identici scrivono gli stessi numeri, quindi un confronto verde vuol dire qualcosa',
    diversi(s1.n, s2.n) + ' diversi');

  esito(ORIG.some(x => x.stato !== 'depositato'),
    'la tabella pubblicata porta accordi non depositati: senza, l\'identità si proverebbe a vuoto');
  const prima = giro(DEP, 0), dopo = giro(ORIG, 0), accesa = giro(ORIG, 1);
  Math.random = veroRandom;
  A.setApp(ORIG); A.par('apparentamenti', 0); A.render();

  esito(prima.seg === dopo.seg && prima.quo === dopo.quo,
    'a leva SPENTA le tre righe non muovono né un seggio né una quota');
  esito(prima.n.length === dopo.n.length && diversi(prima.n, dopo.n) === 0,
    'a leva SPENTA ogni numero in pagina è identico a prima — tolte le sedi che descrivono la tabella',
    prima.n.length + ' contro ' + dopo.n.length + ' numeri, ' + diversi(prima.n, dopo.n) + ' diversi');
  esito(diversi(prima.n, accesa.n) > 0,
    'e il confronto non è cieco: a leva ACCESA almeno un numero si muove',
    diversi(prima.n, accesa.n) + ' diversi');
}

/* ── 2 · LA PAGINA DICE QUELLO CHE DICE LA FONTE: FIRMATO ─────────────────────
 * La parola per lo stato `proposto` è una sola — parolaProposto() — e le due proprietà che
 * la rendono vera si provano qui. La prima è sui DATI: ogni riga `proposto` ha una fonte
 * che dice «sign». Il giorno in cui entra un'offerta non firmata cade, ed è il segnale giusto
 * — la parola va ridecisa, non indovinata. La seconda è sulle STRADE: il markup non può
 * chiamare la funzione, quindi il ripiego del pulsante e la guida si legano a lei qui. */
{
  const proposti = ORIG.filter(x => x.stato === 'proposto');
  const senzaFirma = proposti.filter(x => !/\bsign(s|ed)?\b/i.test(x.fonte || ''));
  esito(senzaFirma.length === 0,
    'ogni accordo «proposto» in tabella ha una fonte che dice «sign»: è la condizione per cui la pagina lo chiama firmato',
    senzaFirma.map(x => x.a + '+' + x.b + ': «' + (x.fonte || '') + '»').join(' · '));
  esito(A.parola(1) === 'firmato' && A.parola(2) === 'firmati',
    'e la parola per il lettore è «firmato», al singolare e al plurale', A.parola(1) + ' / ' + A.parola(2));

  const bottone = (html.match(/<button[^>]*id="k-app"[^>]*>([^<]*)<\/button>/) || ['', ''])[1];
  esito(new RegExp('\\b' + A.parola(2) + '\\b').test(bottone),
    'il ripiego del pulsante nel markup usa la stessa parola: senza JavaScript direbbe altrimenti un\'altra cosa', bottone);
  const voce = (html.match(/Apparentamenti annunciati<\/b><span>([\s\S]*?)<\/span>/) || ['', ''])[1];
  esito(new RegExp('soltanto <i>' + A.parola(2) + '</i>').test(voce),
    'e la guida anche, nella frase che dice quali accordi il pulsante aggiunge', voce.slice(-160));

  /* IL VERSO CHE CONTA: nessuna delle sedi che descrivono gli accordi dice più «annunciato».
     Si guardano le SEDI e non tutta la pagina — «annunciato» ha altri sensi, e il titolo della
     voce della guida resta «Apparentamenti annunciati» perché è un nome di sezione a cui la
     nota metodologica rimanda. E si pretende che la parola nuova CI SIA, o una sede vuota
     passerebbe per corretta. */
  function sedi(){
    const t = id => ((D.getElementById(id) || {}).textContent || '').replace(/\s+/g, ' ');
    const p = [...D.getElementById('k-foot').querySelectorAll('p')].filter(x => /heskem odafim/.test(x.textContent))
      .map(x => x.textContent).join(' ');
    return {riga: t('k-appriga'), nota: p, simulatore: t('k-gnote'), tendenza: t('k-trendnota'),
            pulsante: (D.getElementById('k-app').getAttribute('aria-label') || ''),
            terzi: A.statoLeve ? String(A.statoLeve() || '') : ''};
  }
  [0, 1].forEach(leva => {
    A.setApp(ORIG); A.par('apparentamenti', leva); A.render(); A.rFoot();
    const s = sedi();
    const vecchie = Object.keys(s).filter(k => /annunciat/i.test(s[k].replace(/Apparentamenti annunciati/g, '')));
    esito(vecchie.length === 0,
      'a leva ' + (leva ? 'accesa' : 'spenta') + ' nessuna sede degli accordi dice più «annunciato»',
      vecchie.map(k => k + ': ' + (s[k].match(/.{0,50}annunciat.{0,30}/i) || [''])[0]).join(' · '));
    /* senza distinzione di maiuscole: la nota apre la frase con la parola — «Firmati ma non
       ancora depositati» — e la prima stesura, che la cercava minuscola, cadeva su una
       maiuscola invece che su un difetto */
    esito(new RegExp(A.parola(2).slice(0, 6), 'i').test(s.riga) && new RegExp(A.parola(2).slice(0, 6), 'i').test(s.nota),
      '  e la riga di esito e la nota metodologica dicono «firmat…»', s.riga.slice(0, 120));
  });
  A.par('apparentamenti', 0); A.render();
}

/* ── 3 · LE TRE SI CONTENDONO UN SOLO SEGGIO: LA RIGA DICE IL CONGIUNTO ────────
 * Il 13 settembre 2026, sulle quote pubblicate, ciascun accordo valeva un seggio e tutti e
 * tre insieme DUE: con una qualsiasi delle due coppie dell'opposizione attiva, quella araba
 * vale zero. Una frase che sommasse direbbe tre, cioè un numero falso.
 * Sul seme di prova il caso c'è già — da sola una coppia vale 1, insieme 0 — ma la prova
 * CERCA un vettore in cui insieme valgono più di zero e meno della somma, perché è quello
 * che esercita «Insieme valgono N» e la concordanza del verbo. Misurato: con le quote del
 * seme perturbate del ±30% il caso capita in 99 tentativi su 400, il primo al sesto. */
{
  const TRE = ORIG.filter(x => x.stato !== 'depositato');
  const S0 = A.stato();
  const ids = Object.keys(S0.QUO);
  let s = 4242; const rnd2 = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const mossi = (q, cp) => {
    const base = A.dhondt(q, null, []), r = A.dhondt(q, null, cp); let m = 0;
    Object.keys(r).forEach(k => { if (r[k] > (base[k] || 0)) m += r[k] - (base[k] || 0); });
    return m;
  };
  let caso = null;
  for (let t = 0; t < 400 && !caso; t++) {
    const q = {}; let tot = 0;
    ids.forEach(k => { q[k] = S0.QUO[k] * (0.7 + 0.6 * rnd2()); tot += q[k]; });
    ids.forEach(k => { q[k] = q[k] * 99 / tot; });
    if (!TRE.every(c => q[c.a] >= SOGLIA && q[c.b] >= SOGLIA)) continue;
    const som = TRE.reduce((a, c) => a + mossi(q, [c]), 0), cong = mossi(q, TRE);
    if (cong > 0 && som > cong) caso = {q: q, som: som, cong: cong};
  }
  esito(TRE.length >= 2, 'in tabella ci sono almeno due accordi non depositati, o non c\'è niente da congiungere', String(TRE.length));
  esito(!!caso, 'esiste un vettore di quote in cui gli accordi valgono insieme meno della loro somma',
    caso ? 'somma ' + caso.som + ', insieme ' + caso.cong : 'nessuno in 400 tentativi');
  if (caso) {
    A.setApp(ORIG); A.par('apparentamenti', 1);
    A.setQS(caso.q, A.dhondt(caso.q, null, TRE));
    A.rApp();
    const riga = String(D.getElementById('k-appriga').textContent || '').replace(/\s+/g, ' ');
    esito(new RegExp('Insieme valgono ' + caso.cong + ' segg').test(riga),
      'la riga di esito dice l\'effetto CONGIUNTO, e dice che è congiunto', caso.cong + ' · ' + riga);
    esito(riga.indexOf(' ' + caso.som + ' segg') < 0,
      'e non la somma dei singoli, che sarebbe un numero falso', caso.som + ' · ' + riga);
    esito(!/fra i blocchi/.test(riga) || new RegExp('(lo|li) spostano fra i blocchi').test(riga),
      'e il verbo concorda con gli accordi, non con i seggi', riga);
    esito(TRE.every(x => riga.indexOf(String(+x.data.slice(8, 10))) >= 0),
      'ciascun accordo con la sua data, anche a leva accesa', riga);
  }
  A.par('apparentamenti', 0); A.setApp(ORIG); A.render();
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
    /* L'ATTESA È CAMBIATA IL 13 SETTEMBRE 2026, di proposito: la parola dello stato
       `proposto` era «annunciato» e la fonte dei tre accordi in tabella dice «sign». La
       prova non scrive la parola nuova: la chiede a parolaProposto(), che è la sola strada,
       così un ritocco della parola non fa cadere una prova che guarda il numero. */
    esito(spenta.indexOf(vivi.length + ' ' + A.parola(vivi.length)) >= 0,
      'dice quanti sono, con la parola dello stato', vivi.length + ' · ' + spenta);
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
  /* attesa cambiata il 13 settembre 2026 con la parola dello stato: vedi il §15 */
  esito(new RegExp('Gli accordi ' + A.parola(2) + ' e mai depositati').test(nota),
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


/* ══ 21 · LA DEFINIZIONE STA IN UN POSTO SOLO, E LA NOTA RIMANDA ═════════════
 *
 * «Accordo» da solo non dice niente a un lettore italiano: il meccanismo dei voti in
 * eccedenza nel nostro sistema non esiste in quella forma, e fino al 23 agosto 2026 la
 * pagina non lo definiva da nessuna parte — lo nominava in sette punti e lo dava per noto.
 *
 * La definizione è nella guida dei comandi, alla voce «Apparentamenti annunciati», e
 * SOLTANTO lì. La ragione non è di gusto: notaApparentamenti() è prosa GENERATA, con rami
 * su data e stato, e una definizione non dipende da nessuno dei due — è una costante, e
 * metterla dentro una funzione che compone prosa condizionale è la forma che poi diverge.
 * Prima di oggi le due strade esistevano già: la nota apriva ripetendo il meccanismo che
 * la guida descrive. Finché dicevano la stessa cosa non si vedeva; il giorno in cui una
 * delle due si è arricchita — oggi — l'altra sarebbe rimasta indietro in silenzio.
 *
 * Quindi la prova è in due versi, come tutte quelle sulle strade doppie: la definizione
 * c'è dove deve, e NON c'è dove non deve. Una sola delle due asserzioni non basterebbe —
 * la prima passa anche se la nota la ricopia, la seconda passa anche se la definizione
 * non esiste affatto. */
{
  /* Le frasi si cercano per il loro CONTENUTO e non per intero: la prosa è dell'autore e
     può essere ritoccata, mentre quello che la prova pretende è che ci sia una frase che
     dice da dove viene il seggio. Cercare la stringa esatta renderebbe rossa una virgola. */
  const SEGNI = [/voti che avanzano|voti in eccedenza|resti/i,
                 /non bastano a eleggere/i,
                 /resto maggiore/i];
  const guida = String(D.getElementById('k-guida').innerHTML || '')
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const voce = (guida.match(/Apparentamenti annunciati([\s\S]*?)Lista Unita araba/) || ['',''])[1];

  esito(/Apparentamenti annunciati/.test(guida),
    'la voce della guida si chiama «Apparentamenti annunciati» e non più «proposti»: ' +
    '«annunciato» è il fatto verificabile, ed è la parola scelta per il pulsante',
    guida.slice(0, 60));
  esito(voce.length > 200, 'la voce esiste e ha del testo', String(voce.length));
  SEGNI.forEach(function(re, i){
    esito(re.test(voce), '  · la definizione dice ' +
      ['da dove vengono i voti', 'che non bastano a eleggere', 'a chi va il seggio in più'][i],
      voce.slice(0, 120));
  });
  /* E VIENE PRIMA DEL MECCANISMO: dice da dove viene il seggio, che è la cosa che rende
     l'istituto comprensibile a chi non ce l'ha nel proprio sistema. Il meccanismo — «due
     liste si presentano al riparto come una lista sola» — risponde a una domanda che il
     lettore si fa dopo. */
  const iDef = voce.search(/non bastano a eleggere/i);
  const iMecc = voce.search(/si presentano al riparto come una lista sola/i);
  esito(iDef >= 0 && iMecc >= 0 && iDef < iMecc,
    'e sta PRIMA del meccanismo, che è la domanda successiva',
    'definizione a ' + iDef + ', meccanismo a ' + iMecc);

  /* IL VERSO CHE CONTA: la nota metodologica NON ripete. */
  A.rFoot();
  const notaHTML = String(D.getElementById('k-foot').innerHTML || '');
  const nota = notaHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const ripetute = SEGNI.filter(function(re){ return re.test(nota); });
  esito(!ripetute.length,
    'la nota metodologica NON ripete la definizione: la sorgente è una sola',
    ripetute.map(String).join(' | '));
  esito(!/si presentano al riparto come una lista sola/i.test(nota),
    'e non ripete nemmeno il meccanismo, che era la copia già esistente prima di oggi',
    nota.slice(0, 160));
  /* ma RIMANDA, o il lettore della nota resterebbe senza: togliere una copia senza
     lasciare la strada è peggio che tenerne due */
  esito(/Come si usano i comandi/.test(nota) && /Apparentamenti annunciati/.test(nota),
    'la nota rimanda alla guida per nome, così chi legge la nota sa dove andare',
    nota.slice(0, 200));
  esito(/simulati dal modello/i.test(nota),
    'e dice quello che la guida non dice: che il meccanismo è simulato dal modello',
    nota.slice(0, 160));
}

/* ══ 22 · IL PREDEFINITO È ACCESO: DAL 14 SETTEMBRE 2026, FINO AL 16 OTTOBRE ════════════
 * Un predefinito che è un'ipotesi fa tacere statoLeve(), perché nessuno ha cambiato niente:
 * è la trappola già pagata con `inbilico`. Qui si prova che non succeda con gli accordi, e
 * nessuna attesa scrive un numero misurato — i 50 · 54 · 12 · 4 del 14 settembre stanno nel
 * commento accanto a PAR_DEF, con la data. Il riparto si RIFÀ con le coppie e senza. */
{
  const VERE22 = A.APP.map(x => Object.assign({}, x));
  const txt = id => String((D.getElementById(id) || {}).innerHTML || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const alDifetto = () => A.par('apparentamenti', A.PAR_DEF.apparentamenti);

  /* 1 · il predefinito, e la data accanto alla riga */
  esito(A.PAR_DEF.apparentamenti === 1, 'la leva degli apparentamenti nasce ACCESA', String(A.PAR_DEF.apparentamenti));
  const iDef = html.indexOf('var PAR_DEF=');
  const commento = html.slice(html.lastIndexOf('/*', iDef), iDef);
  /* LA DATA STA NELLA PRIMA RIGA, accanto al valore, come per l'esperimento del cron: cercata
     in tutto il commento, un mutante che la toglieva dalla testata restava vivo, perché
     «14 settembre 2026» e «16 ottobre» compaiono anche più sotto, nella ragione */
  const testata = commento.split('\n')[0];
  esito(/14 SETTEMBRE 2026/i.test(testata) && /16 OTTOBRE/i.test(testata) && /A TERMINE/i.test(testata),
    'e la prima riga del commento accanto al valore dice la data della decisione e il termine', testata);
  esito(/un campo solo/i.test(commento),
    'e il commento dice la ragione del termine: oggi la leva applica accordi di un campo solo', commento.slice(0, 120));

  congela(PRIMA);
  A.setApp(VERE22); alDifetto(); A.render();
  const sopra = A.sopraSoglia();

  /* 2 · IL CASO SI CERCA PRIMA DELLE GEMELLE, e la ragione è un mutante. Sulla tabella
     pubblicata, sul seme di prova, i tre accordi NON SPOSTANO NESSUN SEGGIO: il riparto con e
     quello senza coincidono, quindi «a leva accesa è il riparto con» e «il registro è il
     riparto senza» erano vere per costruzione, e il mutante che fa registrare al lavoro
     notturno il riparto CON gli accordi restava vivo. Le gemelle si provano su coppie che
     spostano seggi, e una guardia pretende che i due riparti differiscano.
     E L'EFFETTO CONGIUNTO NON È LA SOMMA DELLE COPPIE: si cercano due coppie che valgono
     qualcosa da sole e insieme meno della somma. In più la PRIMA delle due, da sola, deve
     spostare blocchi diversi da quelli dell'insieme: senza, il mutante che fa contare alla
     riga di esito una coppia sola restava vivo, perché da sola valeva quanto le due insieme. */
  const Q = A.stato().QUO, ids = Object.keys(sopra);
  const cp = (a, b) => ({a, b, data: gMeno(5), stato: 'proposto'});
  const tutte = [];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) tutte.push(cp(ids[i], ids[j]));
  const da1 = new Map(tutte.map(x => [x, A.effettoApp(Q, [x], [])]));
  let caso = null;
  for (let i = 0; i < tutte.length && !caso; i++) for (let j = i + 1; j < tutte.length && !caso; j++) {
    const x = tutte[i], y = tutte[j];
    if (x.a === y.a || x.a === y.b || x.b === y.a || x.b === y.b) continue;
    const ex = da1.get(x), ey = da1.get(y);
    if (!ex.mossi || !ey.mossi) continue;
    const ej = A.effettoApp(Q, [x, y], []);
    if (!(ej.mossi > 0 && ej.mossi < ex.mossi + ey.mossi)) continue;
    const diversa = e => JSON.stringify(e.a) !== JSON.stringify(ej.a);
    if (diversa(ex)) caso = {t: [x, y], somma: ex.mossi + ey.mossi, insieme: ej.mossi, j: ej};
    else if (diversa(ey)) caso = {t: [y, x], somma: ex.mossi + ey.mossi, insieme: ej.mossi, j: ej};
  }
  esito(!!caso, 'sulle quote di prova esistono due coppie che si contendono lo stesso seggio: il caso si esercita',
    caso ? caso.t.map(x => x.a + '+' + x.b).join(' · ') + ' — somma ' + caso.somma + ', insieme ' + caso.insieme : 'nessuna');
  if (caso) {
    A.setApp(caso.t); alDifetto(); A.render();
    const sopraC = A.sopraSoglia();
    const conCp = A.filtraRiparto(A.coppieAl(null, true), sopraC), senzaCp = A.filtraRiparto(A.coppieAl(null, false), sopraC);
    const rCon = JSON.stringify(A.dhondt(Q, null, conCp)), rSenza = JSON.stringify(A.dhondt(Q, null, senzaCp));
    esito(rCon !== rSenza, 'con queste coppie il riparto con e quello senza differiscono: le gemelle non si provano a vuoto');

    /* LE DUE GEMELLE: senza numeri fissi, il riparto si rifà */
    esito(JSON.stringify(A.stato().SEG) === rCon,
      'a leva ACCESA la proiezione è il riparto con gli accordi, rifatto e non scritto');
    const rdAccesa = JSON.stringify(A.ripartoDepositati());
    esito(rdAccesa === rSenza,
      'e il riparto che il lavoro notturno registra è quello SENZA gli accordi non depositati, anche a leva accesa');
    A.par('apparentamenti', 0); A.render();
    esito(JSON.stringify(A.stato().SEG) === rSenza, 'a leva SPENTA la proiezione è il riparto senza');
    esito(JSON.stringify(A.ripartoDepositati()) === rdAccesa,
      'e il riparto registrato non cambia con la leva: la guardia sui dati non scatta per una decisione');

    alDifetto(); A.render();
    const riga = txt('k-appriga'), ip = A.ipotesiNeiNumeri();
    esito(new RegExp('valgono ' + caso.insieme + ' segg', 'i').test(riga) && caso.insieme !== caso.somma,
      'la riga di esito dice l\'effetto CONGIUNTO, non la somma delle coppie', caso.insieme + ' contro ' + caso.somma + ' · ' + riga);
    const NOMI = {coalizione: 'Blocco Netanyahu', opposizione: 'Opposizione sionista', arabo: 'Partiti arabi', incerto: 'Ago della bilancia'};
    const detti = [...riga.matchAll(/(Blocco Netanyahu|Opposizione sionista|Partiti arabi|Ago della bilancia) (\d+) → (\d+)/g)]
      .map(m => m[1] + ' ' + m[2] + '→' + m[3]).sort().join(' · ');
    const attesi = Object.keys(NOMI).filter(z => caso.j.da[z] !== caso.j.a[z])
      .map(z => NOMI[z] + ' ' + caso.j.da[z] + '→' + caso.j.a[z]).sort().join(' · ');
    esito(detti === attesi,
      'e i blocchi che nomina sono quelli che si muovono con TUTTE le coppie insieme, non con la prima da sola',
      'detti ' + detti + ' · attesi ' + attesi);
    esito(new RegExp('valgono ' + caso.insieme + ' segg').test(ip),
      'e ipotesiNeiNumeri() dice lo stesso numero', ip);

    /* 4 · L'IPOTESI ESCE DALLA PAGINA IN TUTTE LE SEDI */
    /* «non un fatto» o «non fatti»: la chiusura va al plurale solo quando parlano tutte e due
       le ipotesi, e sul seme quella delle liste in bilico può tacere */
    esito(/accordi di eccedenza/.test(ip) && /non (un )?fatt/.test(ip),
      'a leva al predefinito ipotesiNeiNumeri() dichiara gli accordi: è il caso in cui statoLeve() tace', ip);
    esito(!/apparentament/.test(A.statoLeve() || ''),
      'e statoLeve() tace davvero sugli accordi, perché nessuno ha cambiato niente', A.statoLeve());
    esito(A.testoCondivisione(false).indexOf(ip) >= 0 && A.testoCondivisione(true).indexOf(ip) >= 0,
      'il testo di condivisione la porta, nelle due forme');
    esito(A.promptAI().indexOf(ip) >= 0, 'e il prompt che va al servizio terzo la porta');
    const corta = A.ipotesiNeiNumeri(true);
    esito(/^Ipotesi del modello/.test(corta) && /2 apparentamenti firmati e non depositati nel riparto/.test(corta),
      'e la forma corta, quella della targa, la dice per intero', corta);

    /* 5 · STATOLEVE SEGUE LO STATO, NEI DUE VERSI: è la riparazione di `inbilico` del 30 agosto */
    A.par('apparentamenti', 0); A.render();
    const tolti = A.statoLeve() || '';
    esito(/senza gli apparentamenti/.test(tolti) && !/applicati al riparto/.test(tolti),
      'chi SPEGNE la leva viene descritto come chi li ha tolti, non come chi li ha applicati', tolti);
    esito(!/accordi? di eccedenza/.test(A.ipotesiNeiNumeri()),
      'e ipotesiNeiNumeri() non li dichiara più: nei numeri non ci sono', A.ipotesiNeiNumeri());
    A.PAR_DEF.apparentamenti = 0; A.par('apparentamenti', 1); A.render();
    esito(/applicati al riparto/.test(A.statoLeve() || ''),
      'col predefinito spento e la leva accesa, statoLeve() dice che li ha applicati', A.statoLeve());
    esito(A.ipotesiNeiNumeri() === ip,
      'e ipotesiNeiNumeri() dice la STESSA cosa: non consulta PAR_DEF', A.ipotesiNeiNumeri());
    A.PAR_DEF.apparentamenti = 1;
  }

  /* 6 · IL VERBO E LA RIGA IN TUTTI GLI STATI, A LEVA AL PREDEFINITO */
  const TRE = [cp(ids[0], ids[1]), cp(ids[2], ids[3]), cp(ids[4], ids[5])];
  [['nessuno', []], ['uno', TRE.slice(0, 1)], ['tre', TRE]].forEach(function(s){
    A.setApp(s[1]); alDifetto(); A.render();
    const B = D.getElementById('k-app'), c = A.contoApp(A.sopraSoglia()), r = txt('k-appriga');
    if (!s[1].length) {
      esito(B.hidden, 'con nessun accordo in tabella il comando non c\'è: non esiste un «Togli 0»', B.textContent);
      esito(/Non ce n'è nessuno firmato in attesa di deposito/.test(r),
        '  · e la riga dice che non c\'è niente da togliere', r);
      esito(!/accord/.test(A.ipotesiNeiNumeri()), '  · e ipotesiNeiNumeri() non dichiara accordi', A.ipotesiNeiNumeri());
    } else {
      esito(!B.hidden && c.ann === s[1].length && B.textContent === 'Togli ' + c.ann + ' ' + (c.ann === 1 ? 'apparentamento' : 'apparentamenti'),
        'con ' + s[0] + ' in tabella, al predefinito il verbo è «Togli» e il numero è quello del riparto', B.textContent);
      esito(new RegExp(c.ann + ' accord[oi] ' + A.parola(c.ann) + ' e non depositat[oi]').test(r) && /per ipotesi/.test(r),
        '  · e la riga dice che sono applicati per ipotesi', r);
    }
  });

  /* 7 · IL GIORNO DOPO IL TERMINE: la leva resta accesa e non ha più niente da applicare */
  congela(DOPO);
  A.setApp(TRE); alDifetto(); A.render();
  esito(D.getElementById('k-app').hidden, 'il giorno dopo il 16 ottobre il comando sparisce anche con la leva accesa per difetto');
  esito(/termine per gli accordi di eccedenza è passato/.test(txt('k-appriga')), '  · e la riga lo dichiara', txt('k-appriga'));
  esito(!/accord/.test(A.ipotesiNeiNumeri()) && !/apparentament/.test(A.statoLeve() || ''),
    '  · e nessuna sede che esce dalla pagina parla più di accordi', A.ipotesiNeiNumeri() + ' | ' + A.statoLeve());
  scongela();
  A.setApp(ORIG); alDifetto(); A.render();
}

console.log('\napparentamenti: ' + ok + '/' + (ok + ko));
if (ko) process.exit(1);
