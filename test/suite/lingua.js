/* LE REGOLE DI LINGUA CHE DIPENDONO DA UN DATO, e la firma che le fa funzionare.
 *
 * In questo progetto ce ne sono tre, e tutte e tre hanno la stessa forma: una cosa che si
 * sa solo a tempo di esecuzione decide una parola. `acc(n,…)` sceglie fra singolare e
 * plurale, `ed(s)` fra «e» ed «ed», `nmA(i,prep)` la preposizione articolata. Sono
 * funzioni perché tre copie della stessa regola divergono, e sono divergte davvero: «1
 * giorni» nel calendario, «e è stata ignorata» nel messaggio del pulsante.
 *
 * IL DIFETTO DEL 23 AGOSTO 2026 ERA NELLA FIRMA, NON NELLE CHIAMATE. `nmA(i,prep)` aveva
 * `prep` facoltativa: si poteva chiamare `nmA(i)` e scrivere la preposizione a mano un
 * carattere prima, e in quel modo la contrazione non ha nessun posto in cui avvenire. La
 * pagina diceva:
 *
 *   · «contro il 44% di il Likud»          — nel verdetto
 *   · «In evidenza i seggi di I Democratici» — nella legenda dell'emiciclo
 *   · «tutte guidate da Likud»              — nelle coalizioni praticabili
 *   · e avrebbe detto «seguito da Likud»    — nell'analisi, appena un secondo partito sale
 *
 * Quattro punti, un difetto solo. Adesso la preposizione va dichiarata sempre — anche
 * vuota — e un controllo in test/struttura.mjs cerca la CLASSE, cioè un letterale che
 * finisce con una preposizione attaccato a un nome di lista: l'istanza si ripara, la
 * classe no. Il quarto caso l'ha trovato quel controllo, non un occhio.
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
  'global.A={nmA:nmA,nm:nm,acc:acc,ed:ed,Maiu:Maiu,ART:ART,CONTR:CONTR,' +
  'SENZA_CONTR:SENZA_CONTR,P:P};carica().then(render,render)');
eval(src);
const A = global.A;

/* ══ 1 · LA PREPOSIZIONE VA DICHIARATA, ANCHE VUOTA ═════════════════════════ */
{
  let lanciato = false;
  try { A.nmA('likud'); } catch(e){ lanciato = /preposizione va dichiarata/.test(e.message); }
  esito(lanciato, 'nmA senza preposizione fallisce, e dice perché');
  esito(A.nmA('likud', '') === 'il Likud',
    'con la preposizione vuota dà il nome con l\'articolo', A.nmA('likud', ''));
  esito(A.Maiu(A.nmA('likud', '')) === 'Il Likud',
    'e Maiu() la porta a inizio frase', A.Maiu(A.nmA('likud', '')));
}

/* ══ 2 · LE PREPOSIZIONI ARTICOLATE ═════════════════════════════════════════ */
{
  const casi = [
    ['likud', 'di', 'del Likud'], ['likud', 'a', 'al Likud'], ['likud', 'da', 'dal Likud'],
    ['likud', 'in', 'nel Likud'], ['likud', 'su', 'sul Likud'], ['likud', 'con', 'col Likud'],
    ['likud', 'per', 'per il Likud'],
    ['democratici', 'di', 'dei Democratici'], ['democratici', 'a', 'ai Democratici'],
    ['democratici', 'da', 'dai Democratici'], ['democratici', '', 'i Democratici'],
    ['raam', 'di', 'di Ra\'am'], ['raam', '', 'Ra\'am'],
    ['utj', 'da', 'dal Giudaismo Unito Torah']
  ];
  casi.forEach(function(c){
    esito(A.nmA(c[0], c[1]) === c[2],
      'nmA(' + c[0] + ', «' + c[1] + '») dà «' + c[2] + '»', A.nmA(c[0], c[1]));
  });
  let lanciato = false;
  try { A.nmA('likud', 'sopra'); } catch(e){ lanciato = /non ha una forma dichiarata/.test(e.message); }
  esito(lanciato, 'e una preposizione senza forma dichiarata fallisce invece di dare «sopra il»');
}

/* ══ 3 · L'ARTICOLO PUÒ ESSERE GIÀ DENTRO IL NOME ═══════════════════════════
 * «I Democratici» si chiama così: è il nome della lista, non una nostra aggiunta. Con
 * ART che dichiara «i», la pagina diceva «dei I Democratici». */
{
  esito(A.nm('democratici') === 'I Democratici',
    'il nome della lista comprende già l\'articolo', A.nm('democratici'));
  esito(A.nmA('democratici', 'di') === 'dei Democratici',
    'e nmA non lo raddoppia', A.nmA('democratici', 'di'));
  esito(A.nmA('likud', 'di') === 'del Likud',
    'mentre un nome che comincia per «Li» non perde niente', A.nmA('likud', 'di'));
}

/* ══ 4 · OGNI COMBINAZIONE CHE L'ANAGRAFICA PUÒ PRODURRE HA UNA FORMA ═══════
 * Non si prova la tabella: si prova che la tabella COPRA quello che le liste vere possono
 * chiedere. Una lista nuova con l'articolo, l'8 settembre, non deve poter produrre «da
 * il». */
{
  const arts = [...new Set(Object.keys(A.ART).map(k => A.ART[k]))];
  const preps = Object.keys(A.CONTR).map(k => k.split(' ')[0]);
  const mancanti = [];
  arts.forEach(a => [...new Set(preps)].forEach(pr => {
    if (!A.CONTR[pr + ' ' + a]) mancanti.push(pr + ' ' + a);
  }));
  esito(!mancanti.length,
    'ogni preposizione dichiarata ha la sua forma per ogni articolo in uso',
    mancanti.join(', '));
  esito(arts.length >= 2, 'e gli articoli in uso sono più di uno', arts.join(', '));
  esito(A.SENZA_CONTR.indexOf('per') >= 0,
    'le preposizioni che non si fondono sono dichiarate: «per il Likud», non «peril»');
}

/* ══ 5 · IL CONTROLLO STRUTTURALE ESISTE ════════════════════════════════════
 * La firma impedisce di chiamare nmA senza preposizione; non impedisce di scriverla
 * fuori lo stesso. Quella metà la tiene struttura.mjs, e questa prova verifica che quel
 * controllo ci sia — è la stessa ragione per cui esiste: l'istanza si ripara, la classe
 * no. */
{
  const st = fs.readFileSync(__dirname + '/../struttura.mjs', 'utf8');
  esito(/nessuna preposizione scritta a mano prima di un nome di lista/.test(st),
    'test/struttura.mjs cerca la classe, non l\'istanza');
  /* i commenti si tolgono PRIMA di cercare: qui dentro «nmA(i) → errore» è la spiegazione
     del difetto, non il difetto. È la stessa trappola di css.js, che analizzava il
     selettore di una regola commentata */
  const app = fs.readFileSync(__dirname + '/../app.js', 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const sole = (app.match(/nmA\([a-zA-Z0-9_.\[\]']+\)/g) || []);
  esito(!sole.length,
    'e nel codice non è rimasta nessuna chiamata a nmA con un argomento solo', sole.join(', '));
}

console.log('\nlingua: ' + ok + '/' + (ok + ko));
if (ko) process.exit(1);
