/* Il conto dei giorni al voto, e le sei tappe del calendario.
 *
 * IL DIFETTO. gg() misura una differenza in millisecondi e la ARROTONDA. Fra «adesso» e
 * una mezzanotte, quella differenza contiene le ore già passate della giornata, quindi il
 * numero cambiava a MEZZOGIORNO: la mattina del 20 agosto la pagina diceva 68 giorni al
 * voto, il pomeriggio 67. Il lettore confronta col calendario, e dal 20 agosto al 27
 * ottobre i giorni di calendario sono 68 a qualunque ora.
 *
 * E C'È UN AGGRAVANTE. Fra oggi e il voto cade il cambio d'ora del 25 ottobre 2026, due
 * giorni prima delle urne: da lì la differenza in millisecondi porta un'ora in più, e
 * siccome gg() arrotonda, il momento in cui il numero scatta si sposta di nuovo. Per
 * questo le prove qui sotto stanno a cavallo del 25 ottobre e non a una data qualsiasi, e
 * per questo il fuso è imposto: con TZ=UTC il difetto non si manifesta affatto e una suite
 * che girasse solo lì direbbe che va tutto bene.
 *
 * IL RIMEDIO. giornoUTC() prende i componenti LOCALI di un istante — l'oggi del lettore è
 * quello del suo calendario — e li rimonta a mezzanotte UTC, dove l'ora legale non esiste.
 * ggCal() sottrae lì: la differenza è un multiplo esatto di 86.400.000 e non dipende né
 * dall'ora del giorno né dal cambio d'ora.
 *
 * gg() resta, e resta giusta dov'è usata: fra due date dell'archivio, che arrivano tutte
 * da new Date('AAAA-MM-GG') e quindi da mezzanotte UTC.
 */
process.env.TZ = 'Europe/Rome';          /* PRIMA di qualunque Date: vedi sopra */

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
  'global.A={gg:gg,ggCal:ggCal,giornoUTC:giornoUTC,VOTO:VOTO,acc:acc,seg:seg,' +
  'rCalendario:rCalendario,GIORNI:function(){return GIORNI;}};carica().then(render,render)');
eval(src);

const $ = i => D.getElementById(i);

/* il fuso deve essere davvero quello, o metà di queste prove non misura niente */
const offAgo = -new Date(2026,7,20,12).getTimezoneOffset()/60;
const offPri = -new Date(2026,9,24,12).getTimezoneOffset()/60;
const offDop = -new Date(2026,9,25,12).getTimezoneOffset()/60;

setTimeout(function(){

  /* ══ 1 · il banco di prova è quello giusto ══ */
  esito(offPri === 2 && offDop === 1,
    'il fuso di prova cambia davvero ora il 25 ottobre 2026, due giorni prima del voto',
    '24 ott UTC+' + offPri + ' · 25 ott UTC+' + offDop);
  esito(offAgo === 2, 'e ad agosto è ancora ora legale', 'UTC+' + offAgo);

  /* ══ 2 · il conto alla rovescia non dipende dall'ora in cui si apre la pagina ══
   *
   * Dal 20 agosto al 27 ottobre i giorni di calendario sono 68: 11 di agosto, 30 di
   * settembre, 27 di ottobre. */
  const V = A.VOTO;
  const casi = [
    [2026, 7, 20,  0,  1, 68, 'mezzanotte e un minuto del 20 agosto'],
    [2026, 7, 20, 11, 59, 68, 'un minuto prima di mezzogiorno'],
    [2026, 7, 20, 12,  1, 68, 'un minuto dopo mezzogiorno — qui il vecchio conto scattava'],
    [2026, 7, 20, 23, 59, 68, 'un minuto prima di mezzanotte'],
    [2026, 7, 21,  0,  1, 67, 'e solo a mezzanotte il numero cala di uno'],
    [2026, 9, 24, 23, 30,  3, 'la sera del 24 ottobre, ora legale'],
    [2026, 9, 25,  0, 30,  2, 'la notte del 25, prima del cambio d\'ora'],
    [2026, 9, 25, 12,  0,  2, 'il mezzogiorno del 25, dopo il cambio d\'ora'],
    [2026, 9, 25, 23, 30,  2, 'la sera del 25, un\'ora in più nella differenza grezza'],
    [2026, 9, 26,  0, 30,  1, 'la notte del 26'],
    [2026, 9, 26, 23, 30,  1, 'la sera della vigilia'],
    [2026, 9, 27,  0,  0,  0, 'la mezzanotte del voto'],
    [2026, 9, 27, 23, 59,  0, 'e per tutto il giorno del voto resta zero']
  ];
  casi.forEach(function(c){
    const ora = new Date(c[0], c[1], c[2], c[3], c[4]);
    esito(A.ggCal(ora, V) === c[5], 'giorni al voto ' + c[5] + ': ' + c[6],
      'ottenuto ' + A.ggCal(ora, V));
  });

  /* ══ 3 · e il vecchio conto sbagliava davvero: non è una prova che gira a vuoto ══
   *
   * Se questa cade, vuol dire che il difetto non c'era o che il banco non lo espone, e
   * allora tutte le prove qui sopra passerebbero anche col codice rotto. */
  const sbagliati = casi.filter(function(c){
    const ora = new Date(c[0], c[1], c[2], c[3], c[4]);
    return A.gg(ora, V) !== c[5];
  });
  esito(sbagliati.length >= 5,
    'il conto vecchio sbagliava in almeno cinque di questi istanti: il banco espone il difetto',
    sbagliati.length + ' su ' + casi.length + ' — ' +
    sbagliati.slice(0,3).map(c => c[6] + ' dava ' + A.gg(new Date(c[0],c[1],c[2],c[3],c[4]), V)).join(' · '));
  /* il caso del CLAUDE.md, alla lettera */
  const pom20 = new Date(2026, 7, 20, 15, 0);
  esito(A.gg(pom20, V) === 67 && A.ggCal(pom20, V) === 68,
    'il pomeriggio del 20 agosto: il conto vecchio diceva 67, il calendario dice 68',
    'gg ' + A.gg(pom20, V) + ' · ggCal ' + A.ggCal(pom20, V));

  /* ══ 4 · giornoUTC: nessuna ora sopravvive, e il cambio d'ora non sposta niente ══ */
  const g24 = A.giornoUTC(new Date(2026,9,24,23,59));
  const g25 = A.giornoUTC(new Date(2026,9,25, 0, 1));
  const g25b = A.giornoUTC(new Date(2026,9,25,23,59));
  const g26 = A.giornoUTC(new Date(2026,9,26, 0, 1));
  esito(g25 - g24 === 864e5, 'fra il 24 e il 25 ottobre passa esattamente un giorno',
    ((g25-g24)/36e5) + ' ore');
  esito(g26 - g25b === 864e5,
    'e fra il 25 e il 26 pure, benché in mezzo ci sia il cambio d\'ora',
    ((g26-g25b)/36e5) + ' ore');
  esito(g25 === g25b, 'due istanti dello stesso giorno danno la stessa mezzanotte UTC');
  esito(A.giornoUTC(new Date(2026,9,25,0,1)) % 864e5 === 0,
    'e il risultato è sempre una mezzanotte esatta');

  /* ══ 5 · le sei tappe: la stessa funzione, e la parola cambia a mezzanotte ══ */
  const veroDate = W.Date, veroGlobal = global.Date;
  function congela(y,m,d,h,mi){
    const fisso = new veroDate(y,m,d,h,mi);
    function Finta(){
      if (arguments.length === 0) return new veroDate(fisso.getTime());
      return new (Function.prototype.bind.apply(veroDate, [null].concat([].slice.call(arguments))))();
    }
    Finta.prototype = veroDate.prototype;
    Finta.UTC = veroDate.UTC; Finta.parse = veroDate.parse; Finta.now = () => fisso.getTime();
    global.Date = Finta; W.Date = Finta;
  }
  function scongela(){ global.Date = veroGlobal; W.Date = veroDate; }
  function tappe(){
    return [].map.call($('k-calend').querySelectorAll('.g'), e => e.textContent.trim());
  }
  function passate(){ return $('k-calend').querySelectorAll('.past').length; }

  /* il giorno prima del deposito delle liste, a due ore diverse */
  congela(2026, 8, 7, 9, 0);  A.rCalendario();
  const mattina = tappe()[0], passMattina = passate();
  congela(2026, 8, 7, 21, 0); A.rCalendario();
  const sera = tappe()[0], passSera = passate();
  esito(mattina === sera,
    'la prima tappa dice la stessa cosa la mattina e la sera dello stesso giorno',
    'mattina «' + mattina + '» · sera «' + sera + '»');
  esito(mattina === '1giorno',
    'e il giorno prima del deposito manca UN giorno, al singolare: diceva «1 giorni»',
    mattina);
  esito(passMattina === passSera && passMattina === 0,
    'e nessuna delle sei è ancora passata');

  /* il giorno stesso, e il giorno dopo */
  congela(2026, 8, 8, 23, 30); A.rCalendario();
  esito(tappe()[0] === 'oggi', 'il giorno del deposito la tappa dice «oggi», anche a tarda sera',
    tappe()[0]);
  esito(passate() === 0, 'e non è ancora passata');
  congela(2026, 8, 9, 0, 30); A.rCalendario();
  esito(tappe()[0] === 'passato', 'e il giorno dopo, mezz\'ora dopo mezzanotte, è passata',
    tappe()[0]);
  esito(passate() === 1, 'ed è una sola', String(passate()));

  /* a cavallo del cambio d'ora: il voto, che è due giorni dopo */
  congela(2026, 9, 25, 12, 0); A.rCalendario();
  const t25 = tappe();
  congela(2026, 9, 25, 23, 45); A.rCalendario();
  const t25b = tappe();
  esito(t25.join('|') === t25b.join('|'),
    'il 25 ottobre, giorno del cambio d\'ora, le sei tappe dicono la stessa cosa a mezzogiorno e a mezzanotte meno un quarto',
    t25.join(' · '));
  esito(t25[3] === '2giorni' || /^2/.test(t25[3]),
    'e al voto mancano due giorni, non uno né tre', t25[3]);
  congela(2026, 9, 27, 6, 0); A.rCalendario();
  esito(tappe()[3] === 'oggi', 'il giorno del voto la tappa dice «oggi»', tappe()[3]);
  scongela();
  A.rCalendario();

  /* ══ 6 · e gg() resta dov'è giusta ══
   *
   * Fra due date dell'archivio, che nascono da new Date('AAAA-MM-GG') cioè da mezzanotte
   * UTC, la differenza è esatta e l'arrotondamento non fa niente: quelle chiamate non
   * vanno toccate, e questa prova impedisce di «riparare» anche loro. */
  const a1 = new Date('2026-08-01'), a2 = new Date('2026-08-31');
  esito(A.gg(a1, a2) === 30, 'fra due date dell\'archivio gg() conta esatto', String(A.gg(a1, a2)));
  esito((a2 - a1) % 864e5 === 0,
    'e la differenza è un multiplo esatto di un giorno: non c\'è niente da arrotondare');
  const app = fs.readFileSync(__dirname + '/../app.js','utf8');
  esito(/GIORNI=Math\.max\(0,ggCal\(/.test(app),
    'il conto alla rovescia usa ggCal, non gg');
  esito(/var d=ggCal\(oggi,/.test(app),
    'e le sei tappe del calendario pure: condividevano il difetto, condividono il rimedio');
  esito((app.match(/ggCal\(/g) || []).length === 4,
    'ggCal è usata nei due punti che contano giorni di calendario, e in nessun altro',
    (app.match(/ggCal\(/g) || []).length + ' occorrenze, definizione compresa');

  /* ══ 7 · l'accordo di numero, che stava scritto a mano in tre punti ══
   *
   * Uno dei tre sbagliava: il calendario diceva «1 giorni» il giorno prima di ogni tappa.
   * Sono sei giorni in tutta la campagna, ma uno dei sei è la vigilia del voto. Tre copie
   * della stessa regola e una divergente: la forma di sempre. */
  esito(A.acc(1,'giorno','giorni') === 'giorno', 'uno vuole il singolare');
  esito(A.acc(2,'giorno','giorni') === 'giorni', 'due vuole il plurale');
  esito(A.acc(0,'giorno','giorni') === 'giorni', 'zero vuole il plurale');
  esito(A.acc(-1,'seggio','seggi') === 'seggio',
    'e meno uno pure il singolare: nelle differenze i numeri sono anche negativi');
  esito(A.seg(1) === '1 seggio' && A.seg(2) === '2 seggi' && A.seg(-1) === '1 seggio',
    'seg() passa per lo stesso accordo e non lo riscrive',
    A.seg(1) + ' · ' + A.seg(2) + ' · ' + A.seg(-1));
  const app2 = fs.readFileSync(__dirname + '/../app.js','utf8');
  esito(!/===1\?'seggio':'seggi'/.test(app2.replace(/\s/g,'')),
    'e non resta nessuna copia scritta a mano dell\'accordo sui seggi');
  esito((app2.match(/acc\(/g) || []).length >= 3,
    'l\'accordo è chiamato da più di un posto: è una regola, non un caso particolare',
    (app2.match(/acc\(/g) || []).length + ' occorrenze, definizione compresa');

  /* e il giorno prima di OGNI tappa, non solo della prima */
  const vigilie = [[2026,8,7],[2026,9,5],[2026,9,22],[2026,9,26],[2026,10,3],[2026,10,17]];
  vigilie.forEach(function(v, i){
    congela(v[0], v[1], v[2], 18, 0); A.rCalendario();
    const t = tappe()[i];
    esito(t === '1giorno', 'la vigilia della tappa ' + (i+1) + ' dice «1 giorno»', t);
  });
  scongela();
  A.rCalendario();

  console.log('\ngiorni: ' + ok + '/' + (ok + ko));
  if (ko) process.exit(1);
}, 3000);
