/* Contenitore e componenti non possono stare nella stessa normalizzazione.
 *
 * La Lista Unita araba non è una lista fra le altre: è una relazione fra liste. Hadash-Ta'al
 * e Balad sono le sue componenti, e l'archivio attraversa nel tempo due configurazioni —
 * nove rilevazioni della finestra nominano il contenitore, trentasei le componenti, nessuna
 * entrambi. Il passo di imputazione di quoteDa() leggeva quell'assenza come «non rilevata» e
 * accreditava 3,00 punti alla lista mancante, in tutte e due le direzioni: gli stessi
 * elettori contati due volte dentro la stessa normalizzazione a 99. A scenario spento
 * costava tre seggi al blocco arabo e ne consegnava due a quello di Netanyahu.
 *
 * La parentela è dichiarata in P{} con il campo `dentro`, e queste prove la leggono da lì:
 * valgono per un numero qualunque di fusioni, non per il caso arabo cablato. L'8 settembre,
 * quando le liste si chiudono, basterà aggiungere il campo alle nuove componenti perché
 * queste prove le coprano.
 *
 * Le due proprietà, e sono distinte:
 *   · in QUO non coesistono mai un contenitore e una sua componente;
 *   · nessuna lista riceve una quota imputata in una rilevazione che usa l'altra
 *     configurazione — verificato senza numeri magici, aggiungendo all'archivio due
 *     rilevazioni dell'altra configurazione e pretendendo che nessuna quota si muova.
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
  'global.A={calcola:calcola,QUO:function(){return QUO;},P:function(){return P;},nm:nm,' +
  'setSOND:function(v){SOND=v;},setPAR:function(k,v){PAR[k]=v;},sim:function(v){SIM=v;}};' +
  'carica().then(render,render)');
eval(src);

/* Le famiglie si ricavano dall'anagrafica, non sono elencate qui: se l'8 settembre
   arrivano altre fusioni, queste prove le coprono senza essere toccate. */
function famiglie(P){
  const f = {};
  Object.keys(P).forEach(function(i){
    const c = P[i].dentro;
    if (!c || !P[c]) return;
    if (!f[c]) f[c] = [];
    f[c].push(i);
  });
  return f;
}

/* Archivio sintetico: due configurazioni della stessa famiglia, in due momenti diversi.
   I seggi sommano a 120 come in una rilevazione vera, perché l'inversione in quote parte
   dal totale. Il livello arabo è alto — dodici seggi — perché una quota imputata cade sul
   tetto di 3,00: più il livello vero è distante dal tetto, più una fuga di imputazione si
   vede. Con una fixture al 3% non si vedrebbe niente, e sarebbe una fixture più comoda del
   reale. */
const RESTO = {likud:24, yashar:20, byachad:15, democratici:10, beitenu:10,
               shas:8, utj:7, otzma:6, sionismo_rel:4};
function conComponenti(d, i){
  return {data:d, istituto:'Prova '+i, campione:600,
          seggi:Object.assign({}, RESTO, {hadash_taal:12, raam:4}), sotto:{balad:1.8}};
}
function conContenitore(d, i){
  return {data:d, istituto:'Prova '+i, campione:600,
          seggi:Object.assign({}, RESTO, {lista_araba:12, raam:4})};
}
const COMPONENTI = [conComponenti('2026-08-19',1), conComponenti('2026-08-18',2)];
const CONTENITORE = [conContenitore('2026-08-17',3), conContenitore('2026-08-16',4)];

setTimeout(function(){
  const A = global.A;
  A.sim(1000);
  const FAM = famiglie(A.P());
  const nomi = Object.keys(FAM);

  esito(nomi.length > 0,
    'l\'anagrafica dichiara almeno una famiglia col campo `dentro`',
    JSON.stringify(FAM));

  /* ══ 1 · nessuna coesistenza in QUO, sull'archivio vero, nei due scenari ══
     È la proprietà che tiene la pagina: qualunque cosa succeda all'archivio, il modello
     non può proiettare insieme un contenitore e una lista che ci è dentro. */
  [1, 0].forEach(function(v){
    A.setPAR('listaunita', v);
    A.calcola();
    const Q = A.QUO();
    const coppie = [];
    nomi.forEach(function(c){
      if (Q[c] === undefined) return;
      FAM[c].forEach(function(k){ if (Q[k] !== undefined) coppie.push(A.nm(c) + ' + ' + A.nm(k)); });
    });
    esito(coppie.length === 0,
      'archivio vero, scenario ' + (v ? 'acceso' : 'spento') + ': nessun contenitore accanto a una sua componente in QUO',
      JSON.stringify(coppie) + ' · QUO: ' + JSON.stringify(Object.keys(Q)));
  });

  /* ══ 2 · la famiglia si risolve nel lato della rilevazione più recente ══
     Nei due versi, perché una regola che scegliesse sempre le componenti passerebbe
     il primo caso senza sapere niente. */
  A.setPAR('listaunita', 0);

  A.setSOND(COMPONENTI.concat(CONTENITORE));
  A.calcola();
  const qComp = A.QUO();
  esito(qComp.lista_araba === undefined && qComp.hadash_taal !== undefined,
    'se la rilevazione più recente nomina le componenti, il contenitore esce da QUO',
    JSON.stringify(Object.keys(qComp)));
  /* la seconda componente deve sopravvivere: risolvere la famiglia scegliendo un id solo
     invece che un lato buttava via Balad insieme al contenitore, e con lei i voti sotto
     soglia che la fusione serve appunto a non disperdere */
  esito(qComp.balad !== undefined,
    'la seconda componente resta in QUO insieme alla prima',
    JSON.stringify(Object.keys(qComp)));

  A.setSOND([conContenitore('2026-08-19',1), conContenitore('2026-08-18',2),
             conComponenti('2026-08-17',3), conComponenti('2026-08-16',4)]);
  A.calcola();
  const qCont = A.QUO();
  esito(qCont.lista_araba !== undefined && qCont.hadash_taal === undefined && qCont.balad === undefined,
    'se la rilevazione più recente nomina il contenitore, le componenti escono da QUO',
    JSON.stringify(Object.keys(qCont)));

  /* ══ 3 · nessuna quota imputata da una rilevazione dell'altra configurazione ══
     Senza numeri magici: si calcola sulle sole rilevazioni che nominano le componenti, poi
     si aggiungono due rilevazioni che nominano il contenitore. Se l'imputazione non fugge,
     quelle due non hanno niente da dire su queste liste e nessuna quota si muove.

     Regge perché la fixture è costruita apposta: le due configurazioni sono identiche su
     tutto il resto — stessi seggi per le altre nove liste, stesso Ra'am, stesso totale di
     120 — quindi le loro quote invertite coincidono e due rilevazioni in più non spostano
     una media pesata. L'unica cosa che può muovere un numero è una fuga di imputazione.
     Non è una legge generale: è una fixture che isola la variabile. */
  A.setSOND(COMPONENTI);
  A.calcola();
  const solo = A.QUO();
  A.setSOND(COMPONENTI.concat(CONTENITORE));
  A.calcola();
  const piu = A.QUO();
  const mosse = Object.keys(solo).filter(function(i){
    return piu[i] === undefined || Math.abs(piu[i] - solo[i]) > 1e-9;
  }).map(function(i){
    return A.nm(i) + ' ' + solo[i].toFixed(3) + '→' + (piu[i] === undefined ? 'assente' : piu[i].toFixed(3));
  });
  esito(mosse.length === 0,
    'due rilevazioni dell\'altra configurazione non muovono nessuna quota',
    JSON.stringify(mosse));

  console.log('\nfusione: ' + ok + '/' + (ok + ko));
  if (ko) process.exit(1);
}, 3000);
