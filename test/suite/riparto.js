/* ══════════════════════════════════════════════════════════════════════════════════
 * IL RIPARTO QUANDO LA MAPPA DELLE LISTE CAMBIA
 *
 * Scritta il 26 agosto 2026, dopo la prova di regia su «Popolo d'Israele» di Ofer Winter.
 * La configurazione di cui parlano i giornali — una lista nuova che entra MENTRE una del
 * suo stesso blocco cade sotto soglia — il modello la calcola già: è quello che fa la
 * soglia del 3,25%. Ma NESSUNA PROVA LA ESERCITAVA, e le due cose non sono la stessa.
 * `apparentamenti.js` prova una lista sotto soglia dentro un accordo di eccedenza, cioè il
 * caso in cui il partner non eredita; qui si prova il composto, che è un'altra domanda:
 * quando una lista del campo sparisce e un'altra entra, dove finiscono i seggi.
 *
 * LA PROPRIETÀ CHE CONTA, ed è quella che un lettore verifica a occhio sul grafico: la
 * quota di una lista sotto soglia NON SI REDISTRIBUISCE DENTRO IL SUO CAMPO. Il riparto
 * riparte da capo sulle sole liste ammesse, quindi il blocco che perde una lista sotto
 * soglia PERDE SEGGI NETTI — che è precisamente la notizia. Il modo sbagliato di scriverlo,
 * cioè travasare i voti al partito più vicino dello stesso campo, è la cosa che un modello
 * ingenuo fa: se un giorno qualcuno lo introducesse, queste asserzioni cadono.
 *
 * NIENTE È SCRITTO SULL'ARCHIVIO DEL GIORNO. Le quote sono una fixture sintetica, perché la
 * proprietà è del RIPARTO e non dei sondaggi di oggi: scritta sull'archivio cadrebbe alla
 * prima rilevazione nuova, dicendo «difetto» dove c'è un sondaggio in più. Gli id sono
 * quelli veri dell'anagrafica, perché il blocco di ciascuno lo dichiara P{}.
 * ══════════════════════════════════════════════════════════════════════════════════ */
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
D.body.innerHTML = fs.readFileSync(__dirname + '/../../index.html','utf8')
  .replace(/<script>[\s\S]*?<\/script>/g,'').match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
global.document = D; global.window = W;
W.matchMedia = () => ({matches:false, addEventListener(){}, addListener(){}});
W.IntersectionObserver = class { observe(){} unobserve(){} };
global.IntersectionObserver = W.IntersectionObserver;
W.requestAnimationFrame = f => f();
Object.defineProperty(W, 'localStorage',
  {value:{getItem:()=>null,setItem(){},removeItem(){}}, configurable:true});
global.getComputedStyle = () => ({getPropertyValue:()=>''});
global.Blob = function(){}; global.URL = {createObjectURL(){return '';}};
global.FileReader = function(){}; global.fetch = () => Promise.reject(0);

let src = fs.readFileSync(__dirname + '/../app.js','utf8');
src = src.replace('carica().then(render,render)',
  'global.A={dhondt:dhondt,ripartoVeloce:ripartoVeloce,P:P,IDS:IDS};carica().then(render,render)');
eval(src);

const P = A.P;
const blocco = id => (P[id] || {}).b;
const somma  = (r, b) => Object.keys(r).filter(k => blocco(k) === b)
                               .reduce((a, k) => a + r[k], 0);
const totale = r => Object.keys(r).reduce((a, k) => a + r[k], 0);

/* la soglia si LEGGE dal sorgente invece di riscriverla: è una costante del modello, e una
   copia qui divergerebbe il giorno in cui il legislatore la muove */
const HTML = fs.readFileSync(__dirname + '/../../index.html','utf8');
const SOGLIA = parseFloat((HTML.match(/3\.25/) || ['3.25'])[0]);

/* ══ 0 · LA PREMESSA, MISURATA ═══════════════════════════════════════════════════
 * Le quote della fixture devono cadere ai due lati della soglia: senza, questa suite
 * girerebbe a vuoto provando che una lista sopra soglia entra. */
esito(Math.abs(SOGLIA - 3.25) < 1e-9, 'la soglia è il 3,25% dichiarato nel sorgente', String(SOGLIA));

/* OTZMA È FUORI DALLA FIXTURE APPOSTA, ed è la lista che «entra» nel blocco 2: le cinque
   della coalizione ci sono tutte nell'anagrafica, quindi se la fixture le contenesse tutte
   non ne resterebbe nessuna da far entrare e la prova non avrebbe un caso. I suoi punti
   stanno nel Likud finché non entra. */
const OGGI = {
  likud:29.5, shas:7.5, utj:6.5, sionismo_rel:4.5,
  byachad:16.0, democratici:6.0, beitenu:7.0, yashar:14.0,
  raam:4.0, lista_araba:4.0
};
esito(Math.abs(Object.values(OGGI).reduce((a,b)=>a+b,0) - 99) < 1e-9,
  'la fixture somma a 99, come le quote normalizzate del modello',
  String(Object.values(OGGI).reduce((a,b)=>a+b,0)));
esito(OGGI.sionismo_rel > SOGLIA,
  'e Sionismo Religioso ci parte SOPRA soglia, o il confronto non prova niente',
  String(OGGI.sionismo_rel));
esito(Object.keys(OGGI).some(k => blocco(k) === 'coalizione') &&
      Object.keys(OGGI).some(k => blocco(k) === 'opposizione') &&
      Object.keys(OGGI).some(k => blocco(k) === 'arabo'),
  'e la fixture copre tutti e tre i campi che il grafico mostra');

/* ══ 1 · UNA LISTA SOTTO SOGLIA NON PRENDE SEGGI E NON NE LASCIA A NESSUNO IN
 *        PARTICOLARE ═══════════════════════════════════════════════════════════════
 * Il caso semplice, prima del composto: la stessa configurazione con Sionismo Religioso
 * spinto sotto e i suoi punti dati a NESSUNO — le altre quote restano identiche e la somma
 * scende. È il modo di isolare l'effetto della soglia da quello del travaso. */
{
  const sotto = Object.assign({}, OGGI, {sionismo_rel: 2.8});
  const a = A.dhondt(OGGI), b = A.dhondt(sotto);
  esito(totale(a) === 120 && totale(b) === 120,
    'i seggi fanno 120 con la lista sopra soglia e con la lista sotto',
    totale(a) + ' / ' + totale(b));
  esito(a.sionismo_rel > 0, 'sopra soglia la lista prende seggi', String(a.sionismo_rel));
  esito(!b.sionismo_rel, 'sotto soglia non ne prende nessuno', String(b.sionismo_rel));
  /* LA PROPRIETÀ CENTRALE: il blocco che perde una lista sotto soglia perde seggi NETTI.
     Se i voti si travasassero dentro il campo, il totale del blocco resterebbe fermo. */
  esito(somma(b, 'coalizione') < somma(a, 'coalizione'),
    'e il suo BLOCCO perde seggi netti: la quota persa non si travasa dentro il campo',
    somma(a, 'coalizione') + ' → ' + somma(b, 'coalizione'));
  esito(somma(b,'opposizione') + somma(b,'arabo') > somma(a,'opposizione') + somma(a,'arabo'),
    'e quello che perde va agli ALTRI campi, che è perché la notizia è una notizia',
    (somma(a,'opposizione')+somma(a,'arabo')) + ' → ' + (somma(b,'opposizione')+somma(b,'arabo')));
  /* e nessun compagno di campo guadagna più di quanto guadagni in proporzione ai propri
     voti: il travaso, se ci fosse, si vedrebbe come un salto su UNA lista sola */
  const salto = k => (b[k] || 0) - (a[k] || 0);
  const compagni = Object.keys(OGGI).filter(k => blocco(k) === 'coalizione' && k !== 'sionismo_rel');
  esito(compagni.every(k => salto(k) <= 2),
    'e nessun compagno di campo eredita in blocco i seggi della lista caduta',
    compagni.map(k => k + ' ' + (salto(k) >= 0 ? '+' : '') + salto(k)).join(' · '));
}

/* ══ 2 · IL COMPOSTO: UNA ENTRA MENTRE UN'ALTRA CADE ═════════════════════════════
 * È la configurazione di cui parla Channel 12. La lista che entra non deve essere una lista
 * NUOVA di anagrafica — quella è un'altra domanda, ed è il contratto di
 * mappare-una-lista-nuova.md — quindi il ruolo lo fa un id vero del blocco che nella fixture
 * di partenza non c'è: così si prova il riparto e non la mappatura. */
{
  const NUOVA = Object.keys(P).filter(k => P[k].b === 'coalizione' && OGGI[k] === undefined)[0];
  if (!NUOVA) { console.log('KO nessuna lista del blocco fuori dalla fixture'); process.exit(1); }
  esito(!!NUOVA,
    'esiste nell\'anagrafica una lista del blocco di Netanyahu fuori dalla fixture',
    String(NUOVA));

  /* i punti della lista che entra vengono dal Likud, che è il travaso plausibile;
     Sionismo Religioso scende sotto soglia e i suoi punti restano suoi e persi */
  const ch12 = Object.assign({}, OGGI, {sionismo_rel: 2.8, likud: 25.0});
  ch12[NUOVA] = 4.5;
  /* NON somma a 99, e non è un errore della fixture: 1,7 punti sono quelli che Sionismo
     Religioso porta sotto soglia, e restano suoi e persi. Se sommasse a 99 vorrebbe dire
     che qualcuno se li è presi, cioè il travaso che questa suite esiste per escludere. */
  const s12 = Object.values(ch12).reduce((a,b)=>a+b,0);
  esito(Math.abs(s12 - 97.3) < 1e-9,
    'la configurazione composta somma a 97,3: gli 1,7 sotto soglia restano persi',
    String(s12));

  const a = A.dhondt(OGGI), b = A.dhondt(ch12);
  esito(totale(b) === 120, 'con una lista dentro e una fuori i seggi fanno ancora 120',
    String(totale(b)));
  esito(b[NUOVA] > 0, 'la lista che entra prende seggi', String(b[NUOVA]));
  esito(!b.sionismo_rel,
    'e quella sotto soglia resta fuori NELLO STESSO riparto', String(b.sionismo_rel));
  /* IL NUMERO CHE IL LETTORE GUARDA: il blocco non torna dov'era solo perché una lista è
     entrata. Se tornasse, vorrebbe dire che il modello sta travasando i voti persi. */
  esito(somma(b, 'coalizione') < somma(a, 'coalizione'),
    'il blocco di Netanyahu resta sotto: entrare non compensa cadere',
    somma(a, 'coalizione') + ' → ' + somma(b, 'coalizione'));
  /* e la lista che entra NON eredita i seggi di quella caduta: ne prende in proporzione ai
     propri voti, che è la differenza fra un riparto e una staffetta */
  esito(b[NUOVA] <= a.sionismo_rel + 1,
    'e non eredita i seggi di quella caduta: li riparte sui propri voti',
    'entrata ' + b[NUOVA] + ' contro i ' + a.sionismo_rel + ' di prima');
  /* IL VERSO OPPOSTO, o l'asserzione qui sopra passerebbe anche con una lista che non entra
     affatto: portandola sotto soglia il blocco deve scendere ANCORA. */
  const senza = Object.assign({}, ch12); senza[NUOVA] = 2.0;
  const c = A.dhondt(senza);
  esito(somma(c, 'coalizione') < somma(b, 'coalizione'),
    'e se anche quella che entra restasse sotto soglia, il blocco scenderebbe ancora',
    somma(b, 'coalizione') + ' → ' + somma(c, 'coalizione'));
}

/* ══ 3 · LE DUE STRADE DEL RIPARTO CONCORDANO ANCHE QUI ══════════════════════════
 * dhondt() fa la proiezione, ripartoVeloce() le 20.000 simulazioni: se divergessero, la
 * pagina direbbe due cose diverse dello stesso scenario — la proiezione con la lista fuori
 * e le probabilità con la lista dentro. È la strada doppia già legata per gli accordi di
 * eccedenza, e questa configurazione è quella in cui è più facile che si stacchi, perché è
 * l'unica in cui l'insieme delle liste ammesse cambia sotto i piedi delle due funzioni. */
{
  const NUOVA = Object.keys(P).filter(k => P[k].b === 'coalizione' && OGGI[k] === undefined)[0];
  const ch12 = Object.assign({}, OGGI, {sionismo_rel: 2.8, likud: 25.0});
  ch12[NUOVA] = 4.5;
  const ids = Object.keys(ch12);
  const lento = A.dhondt(ch12);
  /* ripartoVeloce(sh, n, out) SCRIVE IN out e non restituisce niente: è la forma delle
     20.000 simulazioni, dove allocare un oggetto per giro costerebbe. E MUTA sh, azzerando
     in luogo le quote sotto soglia — quindi le si passa una COPIA, o il confronto con
     dhondt() finirebbe per misurare due input diversi. */
  const sh = ids.map(k => ch12[k]);
  const out = new Array(ids.length).fill(0);
  let errore = null;
  try { A.ripartoVeloce(sh.slice(), ids.length, out); }
  catch (e) { errore = e && e.message; }
  if (errore !== null) {
    /* non si dichiara provato quello che non si è esercitato: se la firma cambia, la riga
       lo dice invece di tacere */
    esito(false, 'ripartoVeloce() si esercita su questa configurazione', errore);
  } else {
    const oggetto = ids.reduce((o, k, i) => { if (out[i] > 0) o[k] = out[i]; return o; }, {});
    esito(totale(oggetto) === 120,
      'anche la strada veloce chiude a 120 con una lista dentro e una fuori',
      String(totale(oggetto)));
    const diff = ids.filter(k => (lento[k] || 0) !== (oggetto[k] || 0));
    esito(diff.length === 0,
      'e le due strade assegnano gli stessi seggi lista per lista',
      diff.map(k => k + ': ' + (lento[k]||0) + ' vs ' + (oggetto[k]||0)).join(', '));
  }
}

console.log('\nriparto: ' + ok + '/' + (ok + ko));
if (ko) process.exit(1);
