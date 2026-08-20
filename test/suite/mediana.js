/* Le due colonne «Seggi»: quella de «L'analisi» e quella di «Proiezione per lista».
 *
 * Sono due grandezze diverse di proposito — mediana grezza delle rilevazioni contro
 * stima puntuale del modello — e finché restano tali va bene. Ma nessuna delle 230 prove
 * toccava movimenti() o med(), e in quel silenzio sono cresciuti due difetti che si
 * vedevano solo aprendo la pagina:
 *
 *   · a parità di seggi in SEG il testo rivendicava un primo posto che veniva soltanto
 *     dall'ordine di inserimento delle chiavi di dhondt() — Likud e Yashar entrambi a 23,
 *     e la pagina scriveva che il modello «ribalta l'ordine e colloca il Likud al primo
 *     posto»;
 *   · la tabella dell'analisi mostrava Hadash–Ta'al, che lo scenario attivo ha già fuso
 *     nella Lista Unita araba, sotto la stessa intestazione «Seggi» con cui la proiezione
 *     mostra la lista fusa.
 *
 * È la lacuna dei token di blocco chiusa in f2ae70e, spostata di un piano: là erano due
 * copie dello stesso colore, qui sono due strade sulla stessa anagrafica di liste.
 *
 * Ogni prova è mutata: si asserisce anche il caso opposto, così che una guardia troppo
 * larga — un testo che non parla mai di primo posto, un filtro che non mostra mai le
 * liste arabe — non passi per corretta.
 *
 * Il DOM è quello vero di jsdom costruito da index.html, non uno stub: le sei suite a DOM
 * ridotto non saprebbero leggere le righe rese (punto 13 di CLAUDE.md).
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
  'global.A={rAnalisi:rAnalisi,sciolte:sciolteDalloScenario,nm:nm,' +
  'setSOND:function(v){SOND=v;},setSEG:function(v){SEG=v;},setPAR:function(k,v){PAR[k]=v;},' +
  'sim:function(v){SIM=v;}};carica().then(render,render)');
eval(src);

/* Archivio sintetico: cinque rilevazioni in cinque giorni, tutte dentro la finestra dei
   sette giorni di movimenti(). I numeri non devono sommare a 120 — la mediana non è un
   riparto — devono solo essere deterministici, perché l'archivio vero cambia ogni giorno
   e una prova che dipenda da esso scade da sola. */
const SEGGI = {yashar:24, likud:23, byachad:14, democratici:10, beitenu:10,
               utj:8, otzma:8, shas:7, hadash_taal:6, balad:4, raam:5, sionismo_rel:5};
const FINTI = ['2026-08-19','2026-08-18','2026-08-17','2026-08-16','2026-08-15']
  .map(function(d,i){ return {data:d, istituto:'Prova ' + i, campione:600,
                              seggi:Object.assign({}, SEGGI)}; });

/* nomi delle liste nella colonna di sinistra di k-movers */
function righeAnalisi(){
  return [].slice.call(D.getElementById('k-movers').querySelectorAll('.pr .nm'))
    .map(function(n){ return n.childNodes[0].textContent.trim(); });
}
function testoAnalisi(){ return D.getElementById('k-analisi').textContent; }
function notaSciolte(){ return D.getElementById('k-movscio').textContent; }

setTimeout(function(){
  const A = global.A;
  A.sim(2000);
  A.setSOND(FINTI);

  /* ══ 1 · a parità di seggi il testo non rivendica un primato ══
     La mediana dà Yashar 24 e Likud 23: un distacco di un seggio, sopra la soglia di 0,6
     che accende il confronto con la proiezione. Se in SEG i due sono appaiati, la frase
     deve dirlo — e non deve mai parlare di sorpasso, perché a parità il capofila è solo
     la prima chiave inserita da dhondt(). */
  A.setSEG({likud:23, yashar:23, byachad:13, democratici:10, beitenu:10,
            utj:8, otzma:8, shas:7, lista_araba:8, raam:5, sionismo_rel:5});
  A.rAnalisi();
  const pari = testoAnalisi();
  esito(/appaiati a 23 seggi/.test(pari),
    'a parità di seggi il testo dice che i primi sono appaiati',
    pari.slice(0, 400));
  esito(!/primo posto/.test(pari) && !/ribalta/.test(pari),
    'a parità di seggi il testo non parla di sorpasso né di primo posto',
    pari.slice(0, 400));

  /* mutazione: con un distacco vero in SEG il confronto deve tornare a esserci, altrimenti
     la prova sopra passerebbe anche con la frase cancellata del tutto */
  A.setSEG({likud:25, yashar:23, byachad:13, democratici:10, beitenu:10,
            utj:8, otzma:8, shas:7, lista_araba:8, raam:5, sionismo_rel:5});
  A.rAnalisi();
  const sorp = testoAnalisi();
  esito(/al primo posto/.test(sorp) && /Likud/.test(sorp),
    'mutazione: con un distacco vero in SEG il sorpasso viene ancora segnalato',
    sorp.slice(0, 400));

  /* e quando il modello conferma la mediana non c'è niente da segnalare */
  A.setSEG({yashar:25, likud:23, byachad:13, democratici:10, beitenu:10,
            utj:8, otzma:8, shas:7, lista_araba:8, raam:5, sionismo_rel:5});
  A.rAnalisi();
  esito(!/primo posto/.test(testoAnalisi()) && !/appaiati/.test(testoAnalisi()),
    'quando il modello conferma la mediana il confronto non viene aggiunto',
    testoAnalisi().slice(0, 400));

  /* ══ 2 · nessuna lista sciolta dallo scenario nella tabella dell'analisi ══ */
  A.setPAR('listaunita', 1);
  A.setSEG({likud:23, yashar:23, byachad:13, democratici:10, beitenu:10,
            utj:8, otzma:8, shas:7, lista_araba:8, raam:5, sionismo_rel:5});
  A.rAnalisi();
  const sciolte = A.sciolte();
  esito(sciolte.length > 0, 'con lo scenario attivo c\'è almeno una lista sciolta',
    JSON.stringify(sciolte));
  const conFusione = righeAnalisi();
  const intruse = sciolte.map(A.nm).filter(function(n){ return conFusione.indexOf(n) >= 0; });
  esito(intruse.length === 0,
    'nessuna lista sciolta dallo scenario compare nella tabella dell\'analisi',
    'trovate ' + JSON.stringify(intruse) + ' fra ' + JSON.stringify(conFusione));
  esito(sciolte.every(function(i){ return notaSciolte().indexOf(A.nm(i)) >= 0; }),
    'la nota sotto la tabella nomina le liste omesse',
    '"' + notaSciolte() + '"');

  /* mutazione: spento lo scenario le stesse liste devono ricomparire, altrimenti il filtro
     starebbe nascondendo le liste arabe sempre invece che per via della fusione */
  A.setPAR('listaunita', 0);
  A.rAnalisi();
  const senzaFusione = righeAnalisi();
  esito(sciolte.every(function(i){ return senzaFusione.indexOf(A.nm(i)) >= 0; }),
    'mutazione: spento lo scenario le liste sciolte tornano nella tabella',
    JSON.stringify(senzaFusione));
  esito(notaSciolte() === '',
    'mutazione: spento lo scenario la nota sulle liste omesse sparisce',
    '"' + notaSciolte() + '"');

  console.log('\nmediana: ' + ok + '/' + (ok + ko));
  if (ko) process.exit(1);
}, 3000);
