/* Il registro degli eventi grezzi e la porta unica sulla cronologia.
 *
 * EVENTI, la cronologia pubblicata, è solo italiana e si scrive a mano: le voci che il
 * parser trova su Wikipedia sono citazioni inglesi non curate e non devono entrarvi da
 * sole — è già successo, due voci inglesi in pagina fra le quattordici italiane. Qui si
 * prova la meccanica che lo impedisce:
 *
 *   · il confronto è per CHIAVE (data + testo normalizzato), non per data sola: il
 *     confronto per data è quello da cui le voci del 22 gennaio e del 16 maggio erano
 *     sfuggite, perché EVENTI aveva voci italiane a date vicine ma non identiche;
 *   · una voce presente nel registro pubblicato non viene mai ridichiarata come nuova,
 *     qualunque sia il suo stato — le voci lavorate non si cancellano, cambiano stato;
 *   · una voce già vista da questo browser (EG, persistito nel salvato) non viene
 *     ridichiarata al click successivo;
 *   · il registro seminato in dati/eventi-grezzi.json è ben formato: chiavi uniche e
 *     coerenti con la funzione che le genera, stati dal vocabolario, e le quattordici
 *     voci corrispondenti alla cronologia italiana marcate tradotte.
 */
const {JSDOM} = require('jsdom');
const fs = require('fs');

let ok = 0, ko = 0;
function esito(cond, desc, dettaglio){
  if (cond) { ok++; console.log('OK ' + desc); }
  else { ko++; console.log('KO ' + desc + (dettaglio ? ' — ' + dettaglio : '')); }
}

const dom = new JSDOM('');
global.DOMParser = dom.window.DOMParser;
const store = {};
function El(id){return {id, innerHTML:'', textContent:'', style:{}, className:'', dataset:{}, disabled:false,
  classList:{toggle(){},contains(){return false},add(){},remove(){}},
  addEventListener(){}, querySelectorAll(){return [];}, value:''};}
global.document = {getElementById:id=>store[id]||(store[id]=El(id)),
  createElement:()=>({click(){},style:{}}), addEventListener(){}, documentElement:{scrollTop:0}};
const LS = {};
global.window = {addEventListener(){}, requestAnimationFrame(){}, pageYOffset:0,
  location:{protocol:'https:'},
  matchMedia:()=>({matches:false,addEventListener(){},addListener(){}}),
  IntersectionObserver:class{observe(){}unobserve(){}},
  storage:{get:k=>Promise.resolve(LS[k]?{value:LS[k]}:null),
           set:(k,v)=>{LS[k]=v;return Promise.resolve();}}};
global.IntersectionObserver = global.window.IntersectionObserver;
global.getComputedStyle = () => ({getPropertyValue:()=>''});
global.Blob = function(){}; global.URL = {createObjectURL(){return '';}};
global.FileReader = function(){}; global.fetch = () => Promise.reject(0);

let src = fs.readFileSync(__dirname + '/../app.js','utf8');
src = src.replace('carica().then(render,render)',
  'global.A={chiave:chiaveEvento,attesa:eventiInAttesa,EG:function(){return EG;},' +
  'azzeraEG:function(){EG={};},EVENTI:function(){return EVENTI;},salva:salva,' +
  'S:function(){return SOND;}};carica().then(render,render)');
eval(src);

setTimeout(function(){
  const A = global.A;

  /* ══ la chiave distingue per testo, non solo per data ══ */
  const k1 = A.chiave('2026-01-22','Ra\'am, Hadash–Ta\'al, and Balad publicly commit');
  const k2 = A.chiave('2026-01-22','Likud conducts a primary');
  esito(k1 !== k2, 'due testi diversi alla stessa data hanno chiavi diverse', k1 + ' · ' + k2);
  esito(A.chiave('2026-01-22','Ra\'am,   Hadash–Ta\'al… and BALAD publicly commit') ===
        A.chiave('2026-01-22','ra am hadash ta al and balad publicly commit'),
    'la normalizzazione assorbe maiuscole, punteggiatura e spazi',
    A.chiave('2026-01-22','Ra\'am,   Hadash–Ta\'al… and BALAD publicly commit'));

  /* ══ il registro pubblicato ferma le voci già viste ══ */
  const REG = [{chiave:k1, data:'2026-01-22', testo:'x', visto:'2026-08-21', stato:'nuovo'}];
  const eventi = [
    {data:'2026-01-22', testo:'Ra\'am, Hadash–Ta\'al, and Balad publicly commit'},
    {data:'2026-05-16', testo:'Former Hadash MK Yousef Jabareen is chosen'}
  ];
  A.azzeraEG();
  const n1 = A.attesa(eventi, REG);
  esito(n1 === 1, 'la voce già nel registro non viene ridichiarata: nuova è solo l\'altra', String(n1));

  /* ══ il secondo passaggio non riconta (EG) ══ */
  const n2 = A.attesa(eventi, REG);
  esito(n2 === 0, 'al secondo passaggio nessuna voce è di nuovo dichiarata', String(n2));

  /* ══ lo stato del registro non conta: tradotto O nuovo, mai ridichiarata ══ */
  A.azzeraEG();
  const n3 = A.attesa(eventi, [{chiave:k1, stato:'tradotto'},
    {chiave:A.chiave('2026-05-16','Former Hadash MK Yousef Jabareen is chosen'), stato:'scartato'}]);
  esito(n3 === 0, 'una voce resta ferma qualunque sia il suo stato nel registro', String(n3));

  /* ══ EVENTI non viene mai toccato da questo percorso ══ */
  const evN = A.EVENTI().length;
  A.azzeraEG();
  A.attesa(eventi, null);
  esito(A.EVENTI().length === evN,
    'il conteggio delle voci in attesa non tocca la cronologia pubblicata',
    A.EVENTI().length + ' contro ' + evN);
  esito(A.EVENTI().every(e => !/ the | and |conducts|chosen/.test(e.testo)),
    'nessuna voce inglese dentro EVENTI');

  /* ══ EG sopravvive al salvataggio ══ */
  A.salva();
  const salvato = JSON.parse(LS['knesset2026-v2']);
  esito(salvato.eg && salvato.eg.indexOf(k1) >= 0,
    'le chiavi viste finiscono nel salvato locale e sopravvivono alla ricarica',
    JSON.stringify(salvato.eg && salvato.eg.slice(0,2)));

  /* ══ il registro seminato su disco ══ */
  const reg = JSON.parse(fs.readFileSync(__dirname + '/../../dati/eventi-grezzi.json','utf8'));
  esito(reg.length >= 16, 'il registro seminato contiene le voci trovate su Wikipedia', String(reg.length));
  esito(reg.every(r => r.chiave === A.chiave(r.data, r.testo)),
    'ogni chiave del registro coincide con quella che la funzione genererebbe');
  esito(new Set(reg.map(r => r.chiave)).size === reg.length, 'nessuna chiave duplicata nel registro');
  esito(reg.every(r => r.stato === 'nuovo' || r.stato === 'tradotto' || r.stato === 'scartato'),
    'ogni stato è nel vocabolario', JSON.stringify([...new Set(reg.map(r => r.stato))]));
  const dateIt = new Set(A.EVENTI().map(e => e.data));
  esito(reg.filter(r => r.stato === 'tradotto').every(r => dateIt.has(r.data)),
    'ogni voce marcata tradotta ha davvero una voce italiana in cronologia alla sua data');
  /* solo la SEMINA del 21 agosto: per le voci che il lavoro notturno aggiungerà dopo,
     una data coincidente con una voce italiana è legittima — due eventi veri possono
     cadere lo stesso giorno — e un'asserzione generale bloccherebbe il job a torto */
  esito(reg.filter(r => r.stato === 'nuovo' && r.visto === '2026-08-21').every(r => !dateIt.has(r.data)),
    'le voci nuove della semina non hanno una voce italiana alla loro data',
    JSON.stringify(reg.filter(r => r.stato === 'nuovo').map(r => r.data)));

  console.log('\neventireg: ' + ok + '/' + (ok + ko));
  if (ko) process.exit(1);
}, 2500);
