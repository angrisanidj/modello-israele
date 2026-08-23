/* IL RIQUADRO DELLA DIREZIONE, E LA PROMESSA CHE FA.
 *
 * «Questo riquadro confronta due esecuzioni complete del modello a parametri identici:
 * isola il movimento della proiezione da quello dei singoli sondaggi.» È
 * un'affermazione, non una didascalia, e fino al 23 agosto 2026 era falsa per una leva
 * su sei.
 *
 * IL DIFETTO. PREC — la proiezione di sette giorni fa — girava con `dhondt(qp, taglio)`,
 * cioè valutando gli accordi di eccedenza ALLA DATA DEL TAGLIO. Gli accordi sono l'unico
 * parametro ancorato a una data invece che allo stato, quindi un accordo annunciato dopo
 * il taglio entrava nel termine di oggi e non in quello di paragone: il lettore premeva
 * il pulsante degli apparentamenti e il riquadro gli attribuiva alla settimana un
 * movimento che aveva causato lui. Misurato: −1 al blocco Netanyahu, e non l'aveva fatto
 * nessun sondaggio.
 *
 * LE ALTRE CINQUE LEVE NON L'AVEVANO, e non per attenzione: swing, affluenza, esclusione
 * di istituti, «solo ultimi 7 giorni» e Lista Unita vivono nelle variabili che
 * attiviAl() e quoteDa() leggono, quindi arrivano a tutti e due i termini da sé. Qui si
 * verificano tutte e sei invece di fidarsi di quel ragionamento, ed è il motivo per cui
 * questa suite esiste: la proprietà è «PREC gira coi parametri di ADESSO», non «gli
 * apparentamenti sono stati riparati».
 *
 * E LA LETTURA «COM'ERA» NON SPARISCE: sta in serieModello(), che passa la data di ogni
 * punto. Le due domande sono diverse — «che cosa diceva il modello quel giorno» e «di
 * quanto si è mosso a parità di parametri» — e §4 verifica che restino separate.
 */
process.env.TZ = process.env.TZ || 'Europe/Rome';

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
  'global.A={render:render,rDirezione:rDirezione,rTrend:rTrend,blocchi:blocchi,nm:nm,' +
  'firmaPar:firmaPar,firmaRiparto:firmaRiparto,coppieRiparto:coppieRiparto,sopraSoglia:sopraSoglia,' +
  'notaSerie:notaSerie,scartoPS:scartoPS,SCARTO_PS:SCARTO_PS,' +
  'serie:serieModello,APP:APPARENTAMENTI,' +
  'setApp:function(v){APPARENTAMENTI.length=0;v.forEach(function(x){APPARENTAMENTI.push(x);});},' +
  'par:function(k,v){if(v===undefined)return PAR[k];PAR[k]=v;},' +
  'sw:function(v){SW=v;},aff:function(v){AFF=v;},' +
  'escl:function(o){Object.keys(ESCL).forEach(function(k){delete ESCL[k];});Object.assign(ESCL,o);},' +
  'sim:function(v){SIM=v;},SOND:function(){return SOND;},setSOND:function(v){SOND=v;},EVENTI:function(){return EVENTI;},' +
  'stato:function(){return{SEG:SEG,PREC:PREC,QUO:QUO,MC:MC};},dhondt:dhondt,SOGLIA:SOGLIA,' +
  'guastaFirma:function(v){if(PREC)PREC.firma=v;},' +
  'precMC:function(v){if(PREC)PREC.mc=v;},' +
  'precSeg:function(){if(PREC)PREC.seg=Object.assign({},SEG);}};carica().then(render,render)');
eval(src);

const A = global.A;
A.sim(4000);                     /* il riquadro non guarda le probabilità: bastano meno simulazioni */
/* L'ARCHIVIO SI RIBASA A OGGI. Tutto questo file parla del confronto con sette giorni fa,
   e PREC non esiste quando la finestra dei sette giorni è vuota: senza ribasare, la suite
   muore il 23 ottobre — il silenzio demoscopico — cioè esattamente il giorno che npm run
   spazzola esiste per trovare. È lo stesso rimedio delle sei suite del punto 13: si
   spostano TUTTE le date della stessa quantità, quindi niente di relativo cambia e cambia
   solo il rapporto con oggi, che è l'assunzione che qui va resa esplicita. */
require('../frescura.js')(A);
A.render();

const $ = i => D.getElementById(i);
const testo = i => String(($(i)||{}).textContent || '').replace(/\s+/g,' ').trim();
/* la data per esteso come la scrive la pagina: la prova la ricostruisce invece di
   cercarne un pezzo, o passerebbe anche con una data sbagliata purché contenga il giorno */
const MESI = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto',
              'settembre','ottobre','novembre','dicembre'];
const dataLunga = iso => { const p = iso.split('-'); return parseInt(p[2],10) + ' ' + MESI[+p[1]-1] + ' ' + p[0]; };
const giorniFa = k => {
  const o = new Date();
  return new Date(Date.UTC(o.getFullYear(), o.getMonth(), o.getDate()) - k*864e5).toISOString().slice(0,10);
};
const ORIG = A.APP.map(x => Object.assign({}, x));
function foto(){
  const S = A.stato();
  return {seg: JSON.stringify(A.blocchi(S.SEG)),
          prec: S.PREC ? JSON.stringify(A.blocchi(S.PREC.seg)) : '—',
          n: S.PREC ? S.PREC.n : 0};
}

/* ══ 0 · UNA COPPIA CHE SPOSTA DAVVERO UN SEGGIO ════════════════════════════
 * L'accordo vero in anagrafica vale ZERO seggi sul seme di prova — sull'archivio
 * pubblicato ne vale uno — quindi provare la leva con quello la lascerebbe muta: la
 * prova passerebbe senza guardare niente, che è la forma di verde che questo progetto ha
 * già pagato tre volte. Quale coppia sposti un seggio dipende dall'archivio, quindi si
 * cerca invece di sceglierla. */
const COPPIA = (function(){
  const S = A.stato();
  const sopra = Object.keys(S.QUO).filter(k => S.QUO[k] >= A.SOGLIA);
  const base = A.dhondt(S.QUO, null, []);
  for (let i = 0; i < sopra.length; i++)
    for (let j = i + 1; j < sopra.length; j++) {
      const cp = [{a: sopra[i], b: sopra[j], data: giorniFa(0), stato: 'proposto'}];
      const r = A.dhondt(S.QUO, null, cp);
      if (Object.keys(r).some(k => r[k] !== (base[k] || 0))) return cp;
    }
  return null;
})();
esito(!!COPPIA, 'sul seme di prova esiste una coppia che sposta un seggio: le leve si possono esercitare',
  COPPIA ? COPPIA[0].a + '+' + COPPIA[0].b + ', annunciata il ' + COPPIA[0].data : 'nessuna');

/* ══ 1 · OGNI LEVA ARRIVA A TUTTI E DUE I TERMINI ═══════════════════════════ */

const LEVE = [
  ['swing +4',            () => A.sw(4),                     () => A.sw(0)],
  ['affluenza −20',       () => A.aff(-20),                  () => A.aff(0)],
  ['escludi Direct Polls',() => A.escl({'Direct Polls':1}),   () => A.escl({})],
  ['solo ultimi 7 giorni',() => A.par('recenti',1),           () => A.par('recenti',0)],
  ['Lista Unita spenta',  () => A.par('listaunita',0),        () => A.par('listaunita',1)],
  /* con la coppia che sposta un seggio, o la leva non muoverebbe niente e la prova
     passerebbe a vuoto proprio sulla leva che aveva il difetto */
  ['apparentamenti',      () => { A.setApp(COPPIA || ORIG); A.par('apparentamenti',1); },
                          () => { A.par('apparentamenti',0); A.setApp(ORIG); }]
];
let mossePro = 0;
LEVE.forEach(function(L){
  L[2](); A.render(); const off = foto();
  L[1](); A.render(); const on = foto();
  const S = A.stato();

  /* LA PROPRIETÀ CHE VALE PER TUTTE: i due riparti hanno RICEVUTO gli stessi parametri.
     È l'affermazione che il riquadro scrive, e si legge dalle due firme. Per le cinque
     leve di stato è vera per costruzione — la firma è un'istantanea delle variabili — e
     per gli accordi no: sono l'unico parametro ancorato a una data, e la firma del
     paragone dichiara le coppie che vi sono entrate davvero. */
  esito(S.PREC.firma === A.firmaRiparto(A.coppieRiparto(A.sopraSoglia(), null)),
    'con la leva «' + L[0] + '» accesa i due riparti dichiarano gli stessi parametri',
    S.PREC.firma + '  contro  ' + A.firmaRiparto(A.coppieRiparto(A.sopraSoglia(), null)));

  const oggi = off.seg !== on.seg;
  const prec = off.prec !== on.prec || off.n !== on.n;
  if (oggi) mossePro++;
  /* E LA PROPRIETÀ DI COMPORTAMENTO, che vale solo per le leve di stato: se muovono la
     proiezione devono muovere anche il paragone. Sugli accordi NON si può pretendere:
     una coppia può entrare in tutti e due i riparti e spostare un seggio solo in uno,
     perché le quote dei due sono diverse — è quello che succede sul seme di prova. Lì la
     proprietà è la firma, che è più forte e non dipende dall'archivio del giorno. */
  if (L[0] !== 'apparentamenti')
    esito(!oggi || prec,
      'e la leva «' + L[0] + '» arriva anche al termine di paragone',
      'proiezione ' + off.seg + ' → ' + on.seg + ' · paragone ' + off.prec + ' → ' + on.prec);
  if (!oggi) console.log('  [muta] «' + L[0] + '» oggi non muove la proiezione: la prova non prova niente su di lei');
  L[2](); A.render();
});
/* IL BANCO DEVE ESERCITARE DAVVERO LE LEVE. Se un giorno l'archivio cambiasse tanto da
   rendere mute tutte e sei, le sei asserzioni qui sopra passerebbero senza guardare
   niente — è la forma di prova verde che questo progetto ha già pagato tre volte. */
esito(mossePro >= 4,
  'e almeno quattro leve su sei muovono davvero la proiezione: le prove qui sopra non passano a vuoto',
  mossePro + ' su ' + LEVE.length);

/* ══ 2 · LA LEVA DEGLI APPARENTAMENTI, DA VICINO ════════════════════════════
 * È quella che aveva il difetto, e la proprietà stretta è che l'accordo entri nel
 * TERMINE DI PARAGONE benché sia stato annunciato dopo il taglio. */
{
  /* L'accordo si mette DEPOSITATO e datato dopo il taglio: depositato perché così la
     prova vale anche dopo il 16 ottobre, quando la leva non ha più niente da applicare e
     un accordo annunciato non è più un'ipotesi ma una cosa che non è successa — con la
     leva, questa prova sarebbe scaduta col termine. */
  const dopoIlTaglio = [{a: COPPIA[0].a, b: COPPIA[0].b, data: giorniFa(1), stato: 'depositato'}];
  A.setApp([]); A.render();
  const off = foto();
  A.setApp(dopoIlTaglio); A.render();
  const on = foto();
  const S = A.stato();
  /* Che i SEGGI del paragone si muovano non si può pretendere: le quote dei due termini
     sono diverse, e una coppia può entrare in tutti e due i riparti e spostare un seggio
     solo in uno — è quello che succede sul seme di prova. La proprietà è che l'accordo sia
     ENTRATO, e la firma è il posto in cui si legge: è la stessa cosa che il riquadro
     afferma, non una sua approssimazione. */
  esito(off.seg !== on.seg,
    'l\'accordo datato dopo il taglio muove la proiezione di oggi: la prova ha qualcosa da guardare',
    off.seg + ' → ' + on.seg);
  esito(A.firmaRiparto(A.coppieRiparto(A.sopraSoglia(), null))
          .indexOf(dopoIlTaglio[0].a + '+' + dopoIlTaglio[0].b) >= 0,
    'ed è entrato nel riparto di oggi');
  esito(S.PREC.firma.indexOf(dopoIlTaglio[0].a + '+' + dopoIlTaglio[0].b) >= 0,
    'la firma del paragone dichiara la coppia che ha usato', S.PREC.firma);
  esito(S.PREC.firma === A.firmaRiparto(A.coppieRiparto(A.sopraSoglia(), null)),
    'e coincide con quella del riparto di oggi: è la stessa affermazione che il riquadro scrive');
  A.setApp(ORIG); A.par('apparentamenti', 0); A.render();
}

/* ══ 3 · LA FRASE ESCE DALLA PROPRIETÀ ══════════════════════════════════════
 * «A parametri identici» si scrive solo se le due firme coincidono. Il ramo alternativo
 * non si vede mai col codice di oggi, ed è esattamente per questo che va esercitato: una
 * frase che non può cambiare non è un'affermazione, è una decorazione. */
{
  A.par('apparentamenti', 1); A.render();
  const con = testo('k-direz');
  esito(/a parametri identici/.test(con),
    'a leve accese il riquadro afferma di confrontare due esecuzioni a parametri identici');
  esito(!/non sono stati calcolati con gli stessi parametri/.test(con),
    'e non avverte del contrario');

  /* si guasta la firma del paragone, che è il caso vero in cui una coppia si scioglie
     sotto soglia in un termine e non nell'altro */
  A.guastaFirma('un-altro-mondo');
  A.rDirezione();
  const rotto = testo('k-direz');
  esito(!/a parametri identici/.test(rotto),
    'e se i due riparti hanno ricevuto parametri diversi la promessa sparisce', rotto.slice(-160));
  esito(/non sono stati calcolati con gli stessi parametri/.test(rotto),
    'e al suo posto il riquadro lo dichiara, invece di ripetere una promessa che non mantiene',
    rotto.slice(-160));
  A.render();
  esito(/a parametri identici/.test(testo('k-direz')), 'e al render successivo torna quella vera');
  A.par('apparentamenti', 0); A.render();
}

/* ══ 4 · LA SERIE STORICA RESTA «COM'ERA» ═══════════════════════════════════
 * È l'unica cosa nella pagina che dipende da quella lettura, e non deve seguire i
 * parametri di adesso: un accordo annunciato il 22 agosto non può comparire in una
 * proiezione di luglio. La prova mette un accordo in mezzo all'archivio e guarda dove
 * cade il gradino. */
{
  /* L'accordo è DEPOSITATO, e il confronto è fra tabella vuota e tabella piena invece
     che fra leva spenta e leva accesa: quello che si prova qui è la DATA, non la leva, e
     dopo il 16 ottobre la leva non applicherebbe più niente — la prova scadrebbe col
     termine, che è la stagionalità appena tolta di mezzo. */
  const q = giorniFa(20);
  A.setApp([]);
  A.par('apparentamenti', 0); A.render();
  const senza = A.serie().map(p => p.d + ':' + p.g + '/' + p.o + '/' + p.a);
  A.setApp([{a: COPPIA[0].a, b: COPPIA[0].b, data: q, stato: 'depositato'}]); A.render();
  const con = A.serie().map(p => p.d + ':' + p.g + '/' + p.o + '/' + p.a);

  esito(senza.length === con.length, 'la serie ha lo stesso numero di punti nei due casi',
    senza.length + ' contro ' + con.length);
  const primoDiverso = con.findIndex((v, i) => v !== senza[i]);
  const prima = con.filter((v, i) => senza[i] === v && v.slice(0,10) < q).length;
  esito(primoDiverso < 0 || con[primoDiverso].slice(0,10) >= q,
    'nessun punto ANTERIORE all\'annuncio si muove: il passato non viene riscritto',
    primoDiverso < 0 ? 'nessun punto si muove' : 'primo punto diverso ' + con[primoDiverso]);
  esito(prima > 0, 'e di punti anteriori ce n\'è, quindi la prova ha qualcosa da guardare',
    prima + ' punti prima del ' + q);
  esito(primoDiverso >= 0,
    'mentre da lì in poi la serie sente l\'accordo: la lettura «com\'era» esiste ancora',
    primoDiverso < 0 ? 'la serie non si muove mai: il ramo non è esercitato' : con[primoDiverso]);
  A.setApp(ORIG); A.par('apparentamenti', 0); A.render();
}

/* ══ 5 · LA DIFFERENZA FRA LA LINEA E LA TESTATA SI DICHIARA ════════════════
 * Con l'accordo acceso l'ultimo punto della linea vale 51 e la proiezione in cima 50,
 * perché l'accordo è stato annunciato dopo l'ultima rilevazione. È corretto ed era muto:
 * nessuna parola lo diceva. */
{
  A.par('apparentamenti', 0); A.render();
  esito(testo('k-trendnota') === '',
    'senza accordi in vigore la nota non c\'è: non si scrive una spiegazione di una differenza che non esiste');

  /* Quanto valga l'accordo vero dipende dall'archivio del giorno — sul seme di prova
     vale zero seggi — quindi la prova non asserisce la differenza: asserisce il LEGAME,
     cioè che la nota c'è quando e solo quando la differenza c'è. */
  A.par('apparentamenti', 1); A.render();
  {
    const S = A.serie(), ult = S[S.length-1], b = A.blocchi(A.stato().SEG);
    const diversi = ult.g !== b.coalizione || ult.o !== b.opposizione || ult.a !== b.arabo;
    esito(diversi === (testo('k-trendnota') !== ''),
      'con l\'accordo in tabella la nota c\'è quando e solo quando la fine della linea e la proiezione divergono',
      'divergono: ' + diversi + ' · nota: «' + testo('k-trendnota') + '»');
  }
  A.par('apparentamenti', 0); A.render();

  /* E IL RAMO CHE PARLA VA ESERCITATO, che sul seme di prova l'accordo vero non esercita.
     La divergenza si costruisce sull'ULTIMO PUNTO della serie invece di aspettarla
     dall'archivio: quale coppia sposti un seggio, e a quale data cada l'ultima
     rilevazione, sono due cose che cambiano ogni notte, e una prova che le desse per
     buone sarebbe una fixture stagionale — la stessa che npm run spazzola ha appena
     trovato in questa suite. */
  {
    const accordo = [{a: COPPIA[0].a, b: COPPIA[0].b, data: giorniFa(3), stato: 'depositato'}];
    A.setApp(accordo); A.render();
    const S = A.serie().slice();
    const b = A.blocchi(A.stato().SEG);
    const ult = Object.assign({}, S[S.length-1], {g: b.coalizione + 1, a: b.arabo - 1});
    S[S.length-1] = ult;
    A.notaSerie(S);
    const n = testo('k-trendnota');
    esito(n !== '', 'quando la fine della linea e la proiezione divergono, la nota lo dichiara', n);
    esito(n.indexOf(dataLunga(ult.d)) >= 0, 'dicendo la data dell\'ultimo punto per esteso', n);
    esito(/annunciat|vigore/.test(n),
      'e perché: gli accordi in vigore sono arrivati dopo l\'ultima rilevazione', n);
    const nums = (n.match(/\d+/g) || []).map(Number);
    esito(nums.indexOf(b.coalizione) >= 0 && nums.indexOf(ult.g) >= 0,
      'e i due numeri veri, quello della linea e quello della proiezione, non una frase generica',
      n + '  [attesi ' + ult.g + ' e ' + b.coalizione + ']');
    /* E CHE SIA IL RENDER A SCRIVERLA, non solo questa prova: la nota qui sopra è stata
       messa a mano: se rTrend() non la ricalcolasse, resterebbe lì, e una nota vera in
       pagina non comparirebbe mai. Il render la deve riportare allo stato vero. */
    A.render();
    esito(testo('k-trendnota') !== n,
      'e la nota la riscrive il render, non solo la prova che la chiama a mano',
      'dopo il render: «' + testo('k-trendnota') + '»');
    A.setApp(ORIG); A.par('apparentamenti', 0); A.render();
  }
}

/* ══ 5-bis · LA NOTA NON DÀ LA COLPA A UN ACCORDO CHE NON C'È ═══════════════
 * La guardia che lo impedisce è una riga sola, e senza una prova che la esercita sarebbe
 * codice che nessuno tocca: qui la nota si chiama a mano con una serie il cui ultimo
 * punto diverge, e con la tabella degli accordi VUOTA. Una divergenza di altra origine
 * vorrebbe un'altra diagnosi, e attribuirla agli accordi sarebbe una frase falsa scritta
 * con sicurezza. */
{
  A.setApp([]); A.par('apparentamenti', 0); A.render();
  const S = A.serie().slice();
  const b = A.blocchi(A.stato().SEG);
  /* un ultimo punto che diverge di sicuro, senza toccare gli accordi */
  S[S.length-1] = Object.assign({}, S[S.length-1], {g: b.coalizione + 3, o: b.opposizione - 3});
  A.notaSerie(S);
  esito(testo('k-trendnota') === '',
    'con la tabella degli accordi vuota la nota tace anche se la linea e la testata divergono',
    testo('k-trendnota'));
  A.setApp(ORIG); A.render();
}

/* ══ 5-ter · I SEGGI FERMI E UNA PROBABILITÀ CHE SI MUOVE ═══════════════════
 * Il riquadro mostra quattro numeri, due di seggi e due di probabilità, e possono dire
 * cose diverse: «Opposizione sionista 57 invariato» accanto a «Prob. maggioranza
 * opposizione 21% +4 pt». Qui si prova il RAMO che riconosce il caso — la frase la scrive
 * l'autore, e quando arriverà avrà dove attaccarsi.
 * Misurato: su 53 confronti possibili da marzo, i seggi restano fermi e una probabilità si
 * muove di più di due punti in sei (11%), di più di tre in tre (6%). La soglia è tre
 * perché due esecuzioni identiche del Monte Carlo differiscono fino a 1,9 punti: a due, il
 * ramo si accenderebbe sul campionamento. */
{
  const b = {coalizione: 51, opposizione: 57, arabo: 12, incerto: 0};
  const mc = n => ({n: 100, vC: 2, vO: n, vA: 96 - n, st: 2});

  esito(A.SCARTO_PS === 3,
    'la soglia è tre punti, sopra il rumore di due esecuzioni identiche (1,9)', String(A.SCARTO_PS));

  const su = A.scartoPS(b, b, mc(25), mc(20));
  esito(su.fermi && su.scatta, 'seggi fermi e cinque punti di probabilità: il ramo scatta',
    JSON.stringify(su));
  esito(su.blocco === 'opposizione' && Math.round(su.d) === 5,
    'e dice quale blocco e di quanto', su.blocco + ' ' + su.d.toFixed(1));

  const piano = A.scartoPS(b, b, mc(22), mc(20));
  esito(piano.fermi && !piano.scatta,
    'due punti soli non bastano: sarebbe rumore del Monte Carlo', JSON.stringify(piano));

  const mossi = A.scartoPS(b, {coalizione: 53, opposizione: 55, arabo: 12, incerto: 0}, mc(25), mc(20));
  esito(!mossi.fermi && !mossi.scatta,
    'e se i seggi si sono mossi il ramo non scatta: il caso è «fermi E mossa»', JSON.stringify(mossi));

  /* e nel DOM: la classe c'è quando e solo quando il ramo scatta */
  A.render();
  const dz = D.querySelector('#k-direz .dz');
  const S = A.stato();
  const vero = A.scartoPS(A.blocchi(S.SEG), A.blocchi(S.PREC.seg), S.MC, S.PREC.mc);
  esito(!!dz, 'il riquadro è reso');
  esito(dz.classList.contains('psmossa') === vero.scatta,
    'la classe «psmossa» compare quando e solo quando il caso c\'è',
    'classe ' + dz.className + ' · scatta ' + vero.scatta);
  if (vero.scatta) {
    esito(dz.getAttribute('data-psblocco') === vero.blocco,
      'e porta il blocco che si è mosso, per la frase che verrà', dz.getAttribute('data-psblocco'));
    esito(dz.getAttribute('data-psora') && dz.getAttribute('data-psprima'),
      'con i due numeri, quello di oggi e quello di sette giorni fa',
      dz.getAttribute('data-psprima') + ' → ' + dz.getAttribute('data-psora'));
  }
  /* IL RAMO VA ESERCITATO SULLA PAGINA RESA, non solo sulla funzione: sul seme di prova
     il caso può non capitare, e allora l'asserzione qui sopra passerebbe in tutti e due i
     versi. Si forza il termine di paragone a una distribuzione lontana — è l'unico modo
     di far scattare il caso senza aspettare l'archivio giusto — e si guarda il DOM. */
  {
    const S2 = A.stato();
    const q = {n: 1000, vC: 20, vO: 20, vA: 960, st: 0};
    A.precSeg();          /* i seggi fermi sono la metà della condizione */
    A.precMC(q);
    A.rDirezione();
    const dz2 = D.querySelector('#k-direz .dz');
    esito(dz2.classList.contains('psmossa'),
      'forzando una probabilità lontana, la classe compare sulla pagina resa', dz2.className);
    esito(!!dz2.getAttribute('data-psblocco'),
      'e gli attributi con i numeri ci sono', dz2.getAttribute('data-psblocco') + ' ' + dz2.getAttribute('data-psdelta'));
    A.render();
  }
  esito(!/probabilit[àa] si (?:è )?moss/i.test(testo('k-direz')),
    'e nessuna frase è ancora scritta: il ramo è pronto, la prosa no');
}

/* ══ 6 · LA FIRMA DEI PARAMETRI È UNA SOLA ══════════════════════════════════
 * Nasce come chiave della cache della serie e serve al riquadro: due copie divergerebbero
 * in silenzio, ed è la lacuna dei token di blocco spostata dai colori ai parametri. */
{
  const app = fs.readFileSync(__dirname + '/../app.js','utf8');
  esito((app.match(/function firmaPar\(/g) || []).length === 1,
    'firmaPar() è definita una volta sola');
  esito(!/JSON\.stringify\(PAR\)\+'\|'\+Object\.keys\(ESCL\)[\s\S]{0,40}\+SW\+'\|'\+AFF/.test(
        app.replace(/function firmaPar\(\)\{[\s\S]*?\}/, '')),
    'e la sua espressione non è ricopiata da nessun\'altra parte');
  /* E IL MONTE CARLO DEL PARAGONE riceve gli stessi accordi dei seggi. Non è osservabile
     da fuori senza confrontare due nuvole di ventimila numeri — e sarebbe una prova
     rumorosa su una grandezza casuale — quindi si guarda la chiamata: è lo stesso idioma
     con cui si verifica che invD() inverta col riparto senza accordi. */
  const blocco = (app.match(/var cpQp=[\s\S]*?\};/) || [''])[0];
  esito(/dhondt\(qp,\s*null,\s*cpQp\)/.test(blocco),
    'il riparto del paragone usa gli accordi di adesso, non quelli del taglio', blocco.slice(0,120));
  esito(/montecarlo\([^;]*,\s*null\)/.test(blocco),
    'e il suo Monte Carlo pure: seggi e probabilità del confronto nascono dagli stessi accordi',
    blocco.replace(/\s+/g,' ').slice(0,220));
  esito(!/dhondt\(qp,\s*taglio/.test(app) && !/ORIZZONTE\+7,\s*taglio\)/.test(app),
    'e nel file non è rimasta nessuna delle due chiamate vecchie, ancorate al taglio');

  const prima = A.firmaPar();
  A.sw(3);
  esito(A.firmaPar() !== prima, 'la firma cambia quando cambia una leva', prima + ' → ' + A.firmaPar());
  A.sw(0);
  esito(A.firmaPar() === prima, 'e torna identica quando la leva torna dov\'era');
  A.render();
}

console.log('\ndirezione: ' + ok + '/' + (ok + ko));
if (ko) process.exit(1);
