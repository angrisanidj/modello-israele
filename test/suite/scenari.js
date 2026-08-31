/* ══════════════════════════════════════════════════════════════════════════════════
 * LA VERIFICA A SCENARI — le combinazioni che nessun'altra suite esercita
 *
 * Le altre suite provano UNA leva alla volta. Questa le esercita INSIEME, ed è la sola
 * famiglia di difetti che una prova su un comando solo non può vedere: la colonna orfana
 * dell'analisi, il dominio degli istogrammi che escludeva la soglia, la riga dei veti
 * cancellata dal pointerleave stavano tutti in una combinazione, non in un comando.
 *
 * NASCE COME STRUMENTO A MANO IL 31 AGOSTO 2026 ED È DIVENTATA UNA SUITE LO STESSO GIORNO,
 * per la ragione che vale più del contenuto: uno strumento a mano si esegue quando qualcuno
 * se lo ricorda, e l'8 settembre nessuno se lo ricorderà. Nel banco ci passa da solo.
 *
 * E LA PRIMA COSA CHE HA TROVATO ERA NASCOSTA DA UN'ASSERZIONE DEBOLE, scritta da me
 * mezz'ora prima: «con tutti gli istituti esclusi la pagina dice qualcosa» guardava che il
 * verdetto non fosse vuoto — e passava, perché il verdetto non era vuoto: portava ancora
 * la proiezione di prima. La pagina non taceva, MENTIVA. Vedi la sezione 1.
 * ══════════════════════════════════════════════════════════════════════════════════ */
const {JSDOM} = require('jsdom');
const fs = require('fs');

let ok = 0, ko = 0;
function esito(cond, desc, dettaglio){
  if (cond) { ok++; console.log('OK ' + desc); }
  else { ko++; console.log('KO ' + desc + (dettaglio ? ' — ' + dettaglio : '')); }
}

const HTML = fs.readFileSync(__dirname + '/../../index.html','utf8');
const dom = new JSDOM('<!doctype html><html><body><div id="kn26"></div></body></html>', {pretendToBeVisual:true});
const W = dom.window, D = W.document;
global.DOMParser = W.DOMParser;
D.body.innerHTML = HTML.replace(/<script>[\s\S]*?<\/script>/g,'').match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
global.document = D; global.window = W;
W.matchMedia = () => ({matches:false, addEventListener(){}, addListener(){}});
W.IntersectionObserver = class { observe(){} unobserve(){} };
global.IntersectionObserver = W.IntersectionObserver;
W.requestAnimationFrame = f => f();
W.Element.prototype.scrollIntoView = function(){};
Object.defineProperty(W,'localStorage',{value:{getItem:()=>null,setItem(){},removeItem(){}},configurable:true});
global.getComputedStyle = () => ({getPropertyValue:()=>''});
global.Blob = function(){}; global.URL = {createObjectURL(){return '';},revokeObjectURL(){}};
global.FileReader = function(){}; global.fetch = () => Promise.reject(0);

let src = fs.readFileSync(__dirname + '/../app.js','utf8');
src = src.slice(0, src.indexOf('carica().then(render,render)')) +
  'global.A={P:P,IDS:IDS,BL:BL,PRESET:PRESET,blocchi:blocchi,render:render,' +
  'QUO:function(){return QUO;},istituti:istituti,' +
  'setPAR:function(k,v){PAR[k]=v;},PAR_DEF:PAR_DEF,' +
  'ESCL_reset:function(){ESCL={};},ESCL_set:function(i){ESCL[i]=1;},' +
  'EMIFILT_reset:function(){EMIFILT=null;},EMIFILT_set:function(i){EMIFILT=i;},' +
  'get SEG(){return SEG;},get SOND(){return SOND;},set SOND(v){SOND=v;},' +
  'set SW(v){SW=v;},set AFF(v){AFF=v;},set SIM(v){SIM=v;},nm:nm};})();';
eval(src);

const $ = i => D.getElementById(i);
const txt = i => ($(i) ? $(i).textContent.replace(/\s+/g,' ').trim() : '');
const SEME = A.SOND.slice();
A.SIM = 3000;
function azzera(){
  A.setPAR('recenti',0); A.setPAR('listaunita',1); A.setPAR('apparentamenti',0);
  A.setPAR('inbilico',A.PAR_DEF.inbilico);
  A.SW = 0; A.AFF = 0; A.ESCL_reset(); A.EMIFILT_reset(); A.SOND = SEME.slice();
}
const B = () => A.blocchi(A.SEG);
const TOT = b => b.coalizione + b.opposizione + b.arabo + b.incerto;
const CERCHI = () => (($('k-emi').innerHTML || '').match(/<circle/g) || []).length;

/* ══ 1 · COMANDI COMBINATI ════════════════════════════════════════════════════════
 * Le prove esercitano una leva alla volta; qui swing, affluenza, esclusione di istituti e
 * scenario di lista si applicano INSIEME, ai quattro angoli del dominio. */
[[-6,-18],[6,9],[-6,9],[6,-18]].forEach(function(c){
  azzera(); A.SW = c[0]; A.AFF = c[1];
  A.setPAR('listaunita',0); A.ESCL_set('Direct Polls'); A.render();
  const et = 'swing ' + c[0] + ' · affluenza ' + c[1] + ' · Direct escluso · Lista Unita spenta';
  esito(TOT(B()) === 120, et + ': i seggi fanno 120', 'somma ' + TOT(B()));
  esito(CERCHI() === 120, et + ': l arco disegna 120 pastiglie', String(CERCHI()));
  const h1 = $('k-hist').innerHTML, h2 = $('k-hist2').innerHTML;
  esito(/61 = maggioranza/.test(h1) && /61 = maggioranza/.test(h2),
    et + ': la soglia dei 61 e dentro tutti e due gli istogrammi — con un blocco che crolla '
    + 'il dominio puo escluderla, ed e il difetto per cui il dominio ha un pavimento');
  const vb = (h1.match(/viewBox="0 0 (\d+)/) || [])[1];
  const et61 = (h1.match(/x="([\d.]+)"[^>]*>61 = maggioranza/) || [])[1];
  esito(!et61 || (+et61 > 0 && +et61 < +vb),
    et + ': e l etichetta sta dentro il viewBox, non tagliata dal bordo', 'x ' + et61 + ' su ' + vb);
});

/* ══ 2 · L'ARCHIVIO CHE SI SVUOTA PER MANO DEL LETTORE ════════════════════════════
 * È la sezione che ha trovato il difetto, e la forma dell'asserzione è la lezione: quella
 * di prima guardava che il verdetto NON FOSSE VUOTO, e passava — perché non era vuoto,
 * portava ancora la proiezione di prima. Il vuoto si vede; il conteggio di ieri no.
 * Quindi si assertisce che il verdetto NON dica più i numeri, e che dica la causa. */
{
  azzera(); A.render();
  const prima = txt('k-verdetto');
  esito(/proiezione centrale/.test(prima),
    'premessa: con le rilevazioni il verdetto porta la proiezione', prima.slice(0,60));
  const ist = A.istituti();
  ist.forEach(i => A.ESCL_set(i));
  A.render();
  const dopo = txt('k-verdetto');
  esito(!/proiezione centrale assegna/.test(dopo),
    'esclusi tutti gli istituti il verdetto NON porta piu la proiezione di prima: la pagina '
    + 'non deve mostrare numeri che il suo stesso stato dice di non avere', dopo.slice(0,70));
  esito(/tutti e/.test(dopo) && /istituti/.test(dopo),
    'e dice la CAUSA, cioe che li ha esclusi il lettore', dopo.slice(0,70));
  esito(/Azzera|reinseriscine|Reinseriscine/.test(dopo),
    'e la via d uscita: uno stato prodotto da un comando si disfa con un comando');
  esito(/non ci sono, non sono zero|nessuna rilevazione/.test(dopo),
    'e non spaccia l assenza per uno zero: sono due cose diverse', dopo.slice(0,90));
  esito(CERCHI() === 0 && [...($('k-probs')||{children:[]}).children].length === 0,
    'e quello che non ha piu senso si svuota invece di restare indietro: arco e pastiglie',
    CERCHI() + ' cerchi');
  azzera(); A.render();
  esito(/proiezione centrale/.test(txt('k-verdetto')) && CERCHI() === 120,
    'e reinserendoli la pagina torna quella di prima: lo stato e reversibile');
}

/* ══ 3 · LE ALTRE LEVE AGLI ESTREMI ══════════════════════════════════════════════ */
{
  azzera(); A.setPAR('recenti',1); A.render();
  esito(TOT(B()) === 120 || /non e stata pubblicata|nessuna rilevazione/i.test(txt('k-analisi')),
    '«solo ultimi 7 giorni»: o i seggi fanno 120, o la pagina dichiara la finestra vuota',
    'somma ' + TOT(B()));
  azzera(); A.EMIFILT_set('likud'); A.AFF = -18; A.render();
  esito(CERCHI() === 120,
    'filtro dell emiciclo piu affluenza estrema: il disegno resta intero');
  azzera(); A.render();
}

/* ══ 5 · ARCHIVIO DEGENERE ═══════════════════════════════════════════════════════
 * Gli stati che nessun archivio vero produce, e che il modello incontrerà comunque: da
 * disco senza fetch, con una rilevazione sola, con un archivio vecchio di due mesi. La
 * regola è sempre la stessa — o il numero c'è, o la pagina dice perché non c'è. */
{
  azzera(); A.SOND = []; A.render();
  esito(!/proiezione centrale assegna/.test(txt('k-verdetto')),
    'archivio VUOTO: il verdetto non porta piu una proiezione', txt('k-verdetto').slice(0,60));
  esito(txt('k-verdetto').length > 20,
    'e dice qualcosa invece di lasciare la casella bianca', txt('k-verdetto').slice(0,80));
  esito(CERCHI() === 0, 'e l arco non disegna seggi che non esistono', String(CERCHI()));

  /* LA PIU RECENTE, non la prima: SEME[0] e la piu vecchia dell archivio e cade fuori
     dalla finestra dei sessanta giorni — una fixture che da zero non prova il caso
     degenere, prova il filtro. */
  const RECENTE = SEME.slice().sort((a,b) => a.data < b.data ? 1 : -1)[0];
  azzera(); A.SOND = [RECENTE]; A.render();
  esito(TOT(B()) === 120, 'UNA rilevazione sola: i seggi fanno comunque 120', 'somma ' + TOT(B()));
  esito(CERCHI() === 120, 'e l arco e intero');
  esito(/8 simulazioni su 10/.test(txt('k-verdetto')),
    'e la banda dell 80% si dichiara lo stesso: con una rilevazione sola e degenere, e '
    + 'tacere la farebbe sembrare certezza', txt('k-verdetto').slice(0,110));

  /* due rilevazioni dello STESSO istituto: il grappolo non deve azzerare il peso di
     entrambe, o il totale dei pesi va a zero e ogni quota diventa NaN */
  azzera();
  const uno = SEME.slice().sort((a,b) => a.data < b.data ? 1 : -1)
    .filter(s => s.istituto === RECENTE.istituto).slice(0,2);
  if (uno.length === 2) {
    A.SOND = uno; A.render();
    esito(TOT(B()) === 120, 'due rilevazioni dello stesso istituto: il grappolo non azzera '
      + 'i pesi, e i seggi fanno 120', 'somma ' + TOT(B()));
    esito(!/NaN/.test(txt('k-verdetto') + txt('k-proj')), 'e nessun NaN raggiunge la pagina');
  } else esito(false, 'non si trovano due rilevazioni dello stesso istituto nel seme');
  azzera(); A.render();
}

/* ══ 4 · SCENARI DI LISTA — quello che l'8 settembre esercita ═════════════════════ */
{
  azzera(); A.setPAR('listaunita',0); A.render();
  const q = Object.keys(A.QUO()).filter(k => A.QUO()[k]);
  esito(!(q.indexOf('lista_araba') >= 0 && (q.indexOf('hadash_taal') >= 0 || q.indexOf('balad') >= 0)),
    'fusione sciolta: contenitore e componenti non coesistono nelle quote — gli stessi '
    + 'elettori contati due volte sono il difetto che «dentro» esiste per chiudere');
  esito(TOT(B()) === 120, 'e i seggi fanno ancora 120', 'somma ' + TOT(B()));

  azzera(); A.render();
  const prima = A.IDS.filter(i => A.P[i].b === 'coalizione').length;
  A.P.prova_nuova = {n:'Lista di Prova', l:'X', c:'#123456', b:'coalizione', o:99, gov:1, r22:null};
  A.IDS.push('prova_nuova');
  esito(A.IDS.filter(i => A.P[i].b === 'coalizione').length === prima + 1,
    'una lista nuova nel blocco Netanyahu entra da se nel filtro dell anagrafica: PRESET '
    + 'non e un elenco da tenere allineato');
  delete A.P.prova_nuova; A.IDS.pop();

  azzera(); A.render();
  const senza = A.IDS.filter(i => !A.SEG[i]);
  const chips = [...D.querySelectorAll('#k-chips button[data-p]')].map(b => b.dataset.p);
  esito(senza.filter(i => chips.indexOf(i) >= 0).length === 0,
    'una lista MAPPATA che non ha ancora seggi non ha pastiglia nel simulatore: e la '
    + 'finestra fra il deposito e il primo sondaggio che la nomina');
  esito(!!D.querySelector('[data-pre][aria-pressed="true"]'),
    'e la scorciatoia riproduce comunque la selezione di apertura');

  /* una cade sotto soglia MENTRE un'altra entra — lo scenario di Channel 12 */
  A.SOND = SEME.map(function(s){
    const o = JSON.parse(JSON.stringify(s)); delete o._q; delete o._qk;
    if (o.seggi && o.seggi.sionismo_rel) {
      const v = o.seggi.sionismo_rel; delete o.seggi.sionismo_rel;
      o.seggi.casa_sionista = (o.seggi.casa_sionista || 0) + v;
    }
    if (o.sotto) delete o.sotto.sionismo_rel;
    return o;
  });
  A.render();
  esito(TOT(B()) === 120, 'una lista cade sotto soglia mentre un altra entra: i seggi fanno 120',
    'somma ' + TOT(B()));
  esito(!A.SEG.sionismo_rel, 'e la lista caduta non ha seggi nella proiezione');
  esito(/ridistribuiscono fra tutte le liste rimaste/.test(txt('k-soglianota')),
    'e la nota della soglia dice la meccanica giusta: i seggi vanno a TUTTE le liste '
    + 'rimaste, non a quelle del suo campo', txt('k-soglianota').slice(0,100));
  azzera(); A.render();
}

console.log('\nscenari: ' + ok + '/' + (ok + ko));
if (ko) process.exit(1);

/* ══ 6 · L'EMBED ═════════════════════════════════════════════════════════════════
 * Le nove risposte stanno in CLAUDE.md; qui si provano le tre che dipendono dallo STATO e
 * non dal markup, cioè quelle che una prova sul solo embed non vedrebbe. Il resto —
 * che cosa sparisce, la firma, l'altezza — lo tiene embed.js. */
{
  azzera(); A.render();
  const dentro = ['k-emi','k-sintriga','k-sprobs','k-firma'];
  esito(dentro.every(i => $(i)),
    'i pezzi della forma compatta esistono tutti nel markup: la potatura toglie, non sposta',
    dentro.filter(i => !$(i)).join(',') || 'tutti presenti');
  /* il difetto che l'embed renderebbe pubblico: numeri che restano indietro. Con tutti gli
     istituti esclusi la riga di sintesi non deve dire la proiezione di prima. */
  A.istituti().forEach(i => A.ESCL_set(i)); A.render();
  esito(txt('k-sintriga') === '',
    'e la riga di sintesi — quella che finisce nella forma compatta dell embed e nella targa '
    + 'delle card — non resta indietro: un riquadro incorporato altrove annuncerebbe una '
    + 'proiezione che il modello non ha piu, e nessuno lo vedrebbe',
    '«' + txt('k-sintriga').slice(0,60) + '»');
  azzera(); A.render();
  esito(txt('k-sintriga') !== '',
    'e con le rilevazioni torna a dirla: lo stato e reversibile anche li',
    '«' + txt('k-sintriga').slice(0,60) + '»');
}

console.log('\nscenari: ' + ok + '/' + (ok + ko));
if (ko) process.exit(1);
