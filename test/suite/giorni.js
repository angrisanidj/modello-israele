/* Il conto dei giorni al voto, e le tappe del calendario — quante ne dichiara TAPPE, non
 * sei: dal 23 agosto 2026 ce n'è una in più, il termine degli accordi di eccedenza.
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
  'TAPPE:TAPPE,termineApp:termineApp,' +
  'rCalendario:rCalendario,GIORNI:function(){return GIORNI;},'+
  'PREC:function(){return PREC;},SOND:function(){return SOND;}};carica().then(render,render)');
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

  /* ══ 5 · le tappe del calendario: la stessa funzione, e la parola cambia a mezzanotte ══ */
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
  /* PER TITOLO, NON PER POSIZIONE. Queste asserzioni erano scritte come tappe()[3] — il
     voto — e tappe()[0] — il deposito: la riga nuova del termine degli accordi di
     eccedenza le ha spostate tutte di uno, e sei prove sono cadute dicendo «passato» dove
     il difetto era soltanto un indice. Un calendario è un elenco che cresce, e una prova
     che lo indicizza per posizione cade a ogni riga aggiunta senza che niente sia rotto. */
  function idTappa(titolo){ let k = -1; A.TAPPE.forEach((x, i) => { if (x.t === titolo) k = i; }); return k; }
  function gTappa(titolo){ return tappe()[idTappa(titolo)]; }

  /* il giorno prima del deposito delle liste, a due ore diverse */
  congela(2026, 8, 7, 9, 0);  A.rCalendario();
  const mattina = gTappa('Deposito delle liste'), passMattina = passate();
  congela(2026, 8, 7, 21, 0); A.rCalendario();
  const sera = gTappa('Deposito delle liste'), passSera = passate();
  esito(mattina === sera,
    'la prima tappa dice la stessa cosa la mattina e la sera dello stesso giorno',
    'mattina «' + mattina + '» · sera «' + sera + '»');
  esito(mattina === '1giorno',
    'e il giorno prima del deposito manca UN giorno, al singolare: diceva «1 giorni»',
    mattina);
  esito(passMattina === passSera && passMattina === 0,
    'e nessuna tappa è ancora passata');

  /* il giorno stesso, e il giorno dopo */
  congela(2026, 8, 8, 23, 30); A.rCalendario();
  esito(gTappa('Deposito delle liste') === 'oggi', 'il giorno del deposito la tappa dice «oggi», anche a tarda sera',
    gTappa('Deposito delle liste'));
  esito(passate() === 0, 'e non è ancora passata');
  congela(2026, 8, 9, 0, 30); A.rCalendario();
  esito(gTappa('Deposito delle liste') === 'passato', 'e il giorno dopo, mezz\'ora dopo mezzanotte, è passata',
    gTappa('Deposito delle liste'));
  esito(passate() === 1, 'ed è una sola', String(passate()));

  /* a cavallo del cambio d'ora: il voto, che è due giorni dopo */
  congela(2026, 9, 25, 12, 0); A.rCalendario();
  const t25 = tappe();
  congela(2026, 9, 25, 23, 45); A.rCalendario();
  const t25b = tappe();
  esito(t25.join('|') === t25b.join('|'),
    'il 25 ottobre, giorno del cambio d\'ora, tutte le tappe dicono la stessa cosa a mezzogiorno e a mezzanotte meno un quarto',
    t25.join(' · '));
  esito(/^2/.test(t25[idTappa('Si vota')]),
    'e al voto mancano due giorni, non uno né tre', t25[idTappa('Si vota')]);
  congela(2026, 9, 27, 6, 0); A.rCalendario();
  esito(gTappa('Si vota') === 'oggi', 'il giorno del voto la tappa dice «oggi»', gTappa('Si vota'));
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
    'e le tappe del calendario pure: condividevano il difetto, condividono il rimedio');
  /* Le chiamate legittime sono tre, più la definizione: il conto alla rovescia, le sei
     tappe del calendario e ggOggi(), che la nota metodologica usa per dire in quale
     tratto del banco di prova ci si trova. Tutte e tre contano giorni di calendario da
     ADESSO, che è precisamente il caso in cui gg() sbaglia.
     Il numero non è il punto: il punto è che ogni occorrenza in più sia una di queste e
     non una gg() «riparata» per sbaglio. Per questo la prova, oltre a contarle, verifica
     che ciascuna passi da un oggi e non da due date d'archivio. */
  const usi = app.match(/ggCal\([^)]*\)/g) || [];
  /* Da cinque a sette il 22 agosto 2026, e l'attesa si aggiorna perché il punto è
     cambiato di proposito. I due usi nuovi sono ggTappa(), che dice quanti giorni
     mancano a una tappa del calendario elettorale cercandola per titolo, e la menzione
     nel commento che la accompagna. Serve alla PROSA: la nota metodologica parla del
     deposito delle liste dell'8 settembre, e dal 9 quella frase è falsa — vedi
     depositoPassato() e l'invariante 10. La condizione doveva essere la stessa del conto
     alla rovescia e delle sei schede, non una terza espressione scritta a mano, ed è per
     questo che il conteggio sale invece di restare fermo. */
  /* Da sette a undici il 22 agosto 2026, e le quattro nuove dicono anche perché la REGOLA
     qui sotto è cambiata insieme al conteggio.
       · votoPassato() — se l'h1 e il <title> parlano al presente o al passato. La domanda
         «il voto è passato?» è la stessa del conto alla rovescia, non una quarta
         espressione scritta a mano. Il 27 ottobre vale zero, quindi il giorno del voto la
         pagina parla ancora al presente, ed è voluto;
       · ORIZZONTE — la distanza fra l'ultima rilevazione e il voto, cioè il punto in cui
         il Monte Carlo si congela quando il conto alla rovescia arriva a zero;
       · il ritardo dell'ultima verifica riuscita rispetto a oggi, e la distanza fra
         l'ultimo sondaggio e quella verifica: le due divergenze che la testata dichiara.
     LA REGOLA NON È PIÙ «ogni chiamata parte da un oggi», perché due di queste non ci
     partono e sono giuste lo stesso. Quella vera, che il conteggio da solo non diceva, è
     un'altra: ggCal normalizza i componenti LOCALI di un istante, quindi ogni sua data
     dev'essere un istante con un significato locale — new Date() adesso, oppure una data
     d'archivio letta come mezzanotte locale con 'T00:00:00'. Una new Date('AAAA-MM-GG')
     nuda è mezzanotte UTC e a ovest di Greenwich vale il giorno prima: è esattamente il
     difetto che ggCal esiste per chiudere, e passargliela dentro lo riaprirebbe. */
  /* Da undici a dodici quando anche finestra() ha smesso di ancorarsi all'ultimo
     sondaggio: «negli ultimi 7 giorni» adesso conta da oggi, come il confronto della
     proiezione. Era la seconda metà dello stesso difetto, e la sua chiusura porta la
     dodicesima chiamata — l'unica che gira su tutto l'archivio, e infatti l'«oggi» è
     issato fuori dal filtro. */
  esito(usi.length === 12,
    'ggCal è usata nei punti che contano giorni di calendario, e in nessun altro',
    usi.length + ' occorrenze, definizione compresa: ' + usi.join(' · '));
  esito(/function ggOggi\(\)\{return Math\.max\(0,ggCal\(new Date\(\),VOTO\)\);\}/.test(app),
    'e la nota metodologica ricava i giorni al voto dalla data corrente, non da una costante');
  /* i siti di chiamata veri: non la definizione «ggCal(a,b)» e non le menzioni nei
     commenti, che sono scritte «ggCal()» senza argomenti */
  const chiamate = usi.filter(u => u !== 'ggCal(a,b)' && u !== 'ggCal()');
  esito(chiamate.length > 0 && chiamate.every(u => /new Date\(\)|oggi|T00:00:00/.test(u)),
    'ogni data passata a ggCal è un istante locale: adesso, oppure una mezzanotte locale',
    chiamate.join(' · '));
  /* E LA META' CHE IL CONTEGGIO NON VEDE: nessuna new Date() dentro una chiamata di ggCal
     può essere una data d'archivio NUDA. `new Date('2026-08-20')` è mezzanotte UTC, i cui
     componenti locali a ovest di Greenwich sono del 19: giornoUTC() li rimonterebbe al
     giorno sbagliato, e la differenza uscirebbe di uno. Con 'T00:00:00' l'istante è
     mezzanotte locale e il rimontaggio è esatto ovunque.
     La finestra di 120 caratteri serve perché la cattura qui sopra si ferma alla prima
     parentesi chiusa e taglia gli argomenti annidati. */
  const finestre = [];
  for (let i = app.indexOf('ggCal('); i >= 0; i = app.indexOf('ggCal(', i + 1))
    finestre.push(app.slice(i, i + 120));
  const nude = finestre.filter(w => {
    const arg = w.slice(0, w.indexOf(');') + 1);
    return /new Date\((?!\))/.test(arg) &&
           (arg.match(/new Date\((?!\))/g) || []).length !== (arg.match(/T00:00:00/g) || []).length;
  });
  esito(nude.length === 0,
    'e nessuna è una data d\'archivio nuda, che sarebbe mezzanotte UTC e varrebbe il giorno prima',
    nude.slice(0, 2).map(w => w.split('\n')[0].slice(0, 70)).join(' · '));

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

  /* E IL GIORNO PRIMA DI OGNI TAPPA, NON SOLO DELLA PRIMA. Le sei vigilie erano scritte a
     mano — [[2026,8,7],[2026,9,5],…] — cioè sei date letterali che dicevano «il giorno
     prima della tappa i-esima»: la stessa cosa solo finché il calendario non cresce. Ora
     escono da A.TAPPE, e la riga nuova del termine degli accordi si prova da sé. */
  A.TAPPE.forEach(function(x, i){
    const v = new Date(Date.parse(x.d + 'T00:00:00Z') - 864e5);
    congela(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate(), 18, 0); A.rCalendario();
    const t = tappe()[i];
    esito(t === '1giorno', 'la vigilia di «' + x.t + '» dice «1 giorno»', t);
  });
  scongela();
  A.rCalendario();

  /* ══ 8 · l'ancora del confronto a sette giorni ══
   *
   * Il verdetto confronta la proiezione di oggi con quella di sette giorni fa. Il taglio
   * partiva dall'ULTIMO SONDAGGIO in archivio invece che da oggi: la frase diceva «sette
   * giorni fa» e ne confrontava nove — misurato il 22 agosto, ultimo sondaggio del 20,
   * taglio al 13 invece che al 15. Due giorni, e la deriva cresce in silenzio se il lavoro
   * notturno si ferma, perché l'ancora si allontana da oggi insieme all'archivio.
   * È lo stesso difetto di «aggiornato al» e la stessa invariante 10: un «sette» che non
   * nasce dalla data corrente. */
  const app3 = fs.readFileSync(__dirname + '/../app.js','utf8');
  esito(/var taglio=new Date\(giornoUTC\(new Date\(\)\)-7\*864e5\)/.test(app3),
    'il taglio del confronto parte da OGGI e passa da giornoUTC, come il conto alla rovescia');
  esito(!/sett=new Date\(new Date\(ult\)/.test(app3),
    'e non dall\'ultimo sondaggio in archivio: quell\'ancora derivava senza dirlo');
  /* due date distinte, perché sono due fatti e nessuno è deducibile dall'altro:
     il giorno del confronto, e l'ultimo sondaggio che ci rientra */
  esito(/taglio:taglio,\s*data:Lp\[0\]\.data/.test(app3),
    'e PREC porta due date: il taglio del confronto e l\'ultimo sondaggio che vi rientra');
  /* IL RAMO CHE SPARIVA IN SILENZIO. Queste due asserzioni stavano dentro un `if (PREC)`
     nudo: PREC esiste solo quando il taglio a sette giorni lascia fuori almeno una
     rilevazione, cioè quando l'archivio è fresco. Con l'archivio di agosto letto a
     febbraio il taglio cade anch'esso nel passato, Lp coincide con L e PREC è nullo — e
     la suite passava da 57 asserzioni a 55 senza dirlo. Non è un falso verde, è peggio:
     è un verde che si assottiglia. Misurato spazzolando le date dal 23 agosto al
     1° febbraio.
     Adesso il ramo si dichiara: se PREC non c'è, si asserisce PERCHÉ non c'è, così il
     conteggio resta lo stesso e chi legge sa che cosa è stato provato. */
  {
    const P = A.PREC && A.PREC();
    if (P) {
      esito(!!P.taglio && !!P.data, 'la proiezione di confronto le espone tutte e due',
        'taglio ' + P.taglio + ' · ultimo sondaggio ' + P.data);
      esito(P.data <= P.taglio,
        'e l\'ultimo sondaggio del confronto non è successivo al taglio',
        P.data + ' contro ' + P.taglio);
    } else {
      const ult = A.SOND ? A.SOND().filter(s => !s.pre).map(s => s.data).sort().pop() : null;
      const taglio = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(),
        new Date().getDate()) - 7 * 864e5).toISOString().slice(0, 10);
      esito(!!ult && ult <= taglio,
        'la proiezione di confronto non esiste, e la ragione è dichiarata: l\'ultimo sondaggio ' +
        'è anteriore al taglio di sette giorni fa',
        'ultimo ' + ult + ' · taglio ' + taglio);
      esito(true,
        'quindi non c\'è niente da confrontare, e il conteggio non cala in silenzio');
    }
  }

  console.log('\ngiorni: ' + ok + '/' + (ok + ko));
  if (ko) process.exit(1);
}, 3000);
