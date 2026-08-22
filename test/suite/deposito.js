/* Le due frasi del deposito, ai due lati dell'8 settembre.
 *
 * Il difetto, trovato il 22 agosto 2026 rendendo la pagina con l'orologio congelato al
 * 9 settembre. Il CALENDARIO regge — la scheda del deposito dice «passato» e prende la
 * classe past, perché ggCal fa il suo lavoro. La PROSA no: due frasi della nota
 * metodologica parlavano del deposito al futuro e restavano identiche il giorno dopo.
 *
 *   · «Il modello proietta il sistema di partiti che vede, non quello che ci sarà: fino
 *     al deposito delle liste dell'8 settembre questa è la fonte di errore più grande»
 *   · «Il modello non prevede le fusioni di liste, che in Israele si decidono fino al
 *     deposito delle candidature e possono cambiare la mappa in un giorno»
 *
 * Il 9 settembre il deposito è passato, quella fonte di errore non agisce più, e le due
 * frasi continuano a leggersi bene mentendo. È l'invariante 10 — «niente tempo scritto a
 * mano» — applicata alla prosa invece che ai numeri, ed è la stessa forma del punto 8-bis
 * sul post-voto: un numero sbagliato si nota, una frase al presente che parla di un
 * futuro già passato no.
 *
 * La condizione è depositoPassato(), cioè ggCal(oggi, 8 settembre) < 0: la STESSA
 * espressione del conto alla rovescia e delle sei schede del calendario. La data del
 * deposito si legge da TAPPE, che è l'unico posto in cui il calendario elettorale è
 * scritto — se restasse anche qui sarebbe la solita strada doppia, con l'aggravante che
 * il calendario si aggiornerebbe da solo e la prosa no: la pagina direbbe «passato» in un
 * punto e parlerebbe al futuro nell'altro, nello stesso schermo.
 *
 * IL SEGNAPOSTO È STATO SOSTITUITO dalla prosa vera il 22 agosto 2026, e questa prova non
 * è cambiata di forma: verifica il MECCANISMO — che le due frasi cambino, e in che verso —
 * non le parole. Le espressioni cercate sono le poche che dichiarano il verbo, così la
 * prova regge un'altra riscrittura senza essere riscritta a sua volta.
 */
const {JSDOM} = require('jsdom');
const fs = require('fs');

let ok = 0, ko = 0;
function esito(cond, desc, dettaglio){
  if (cond) { ok++; console.log('OK ' + desc); }
  else { ko++; console.log('KO ' + desc + (dettaglio ? ' — ' + dettaglio : '')); }
}

const html = fs.readFileSync('../../index.html','utf8');
const src0 = fs.readFileSync(__dirname + '/../app.js','utf8');

/* Rende l'intera pagina con l'orologio fermo a una data. TZ=Europe/Rome, come in
   giorni.js: con TZ=UTC il difetto dell'ora legale non si manifesta affatto, e una
   suite che girasse solo lì direbbe che va tutto bene. */
process.env.TZ = 'Europe/Rome';
function alGiorno(iso){
  const quando = new Date(iso + 'T10:00:00+02:00').getTime();
  const D0 = Date;
  class DF extends D0 {
    constructor(...a){ if (!a.length) super(quando); else super(...a); }
    static now(){ return quando; }
  }
  const dom = new JSDOM('<!doctype html><html><body><div id="kn26"></div></body></html>', {pretendToBeVisual:true});
  const W = dom.window, D = W.document;
  global.DOMParser = W.DOMParser;
  D.body.innerHTML = html.replace(/<script>[\s\S]*?<\/script>/g,'')
    .match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
  global.document = D; global.window = W;
  global.Date = DF; W.Date = DF;
  W.matchMedia = () => ({matches:false, addEventListener(){}, addListener(){}});
  W.IntersectionObserver = class { observe(){} unobserve(){} };
  global.IntersectionObserver = W.IntersectionObserver;
  W.requestAnimationFrame = f => f();
  W.localStorage = {getItem:()=>null, setItem(){}, removeItem(){}};
  global.getComputedStyle = () => ({getPropertyValue:()=>''});
  global.Blob = function(){}; global.URL = {createObjectURL(){ return ''; }};
  global.FileReader = function(){}; global.fetch = () => Promise.reject(0);
  const src = src0.replace('carica().then(render,render)',
    'global.A={render:render,dep:depositoPassato,TAPPE:function(){return TAPPE;}};carica().then(render,render)');
  eval(src);
  global.A.render();
  const testo = e => String((D.getElementById(e) || {}).innerHTML || '')
    .replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  const cal = [].slice.call(D.getElementById('k-calend').children).map(c => ({
    data: c.querySelector('.dt').textContent.trim(),
    quando: c.querySelector('.g').textContent.trim(),
    passata: /past/.test(c.className)
  }));
  const out = {
    dep: global.A.dep(), TAPPE: global.A.TAPPE(),
    nota: testo('k-metodo') || String(D.getElementById('kn26').textContent).replace(/\s+/g,' '),
    calendario: cal,
    conto: testo('k-cd')
  };
  global.Date = D0;
  return out;
}

const PRIMA = alGiorno('2026-09-07');
const DOPO  = alGiorno('2026-09-09');

/* ── la condizione ── */
esito(PRIMA.dep === false, 'il 7 settembre il deposito non è passato', String(PRIMA.dep));
esito(DOPO.dep === true,  'il 9 settembre sì', String(DOPO.dep));
/* la data non è scritta nella prosa: si legge dal calendario elettorale */
const tappa = PRIMA.TAPPE.filter(t => t.t === 'Deposito delle liste')[0];
esito(!!tappa && tappa.d === '2026-09-08',
  'la data del deposito viene da TAPPE, che è l\'unico posto in cui il calendario è scritto',
  tappa ? tappa.d : 'tappa assente');
/* Un OR fra due condizioni qui era un'asserzione che non poteva cadere: la prima metà
   era sempre vera e la seconda non veniva mai valutata. Resta la sola che conta. */
esito((html.match(/2026-09-08/g) || []).length === 1,
  'e la data in forma ISO compare una volta sola nel file: chi la riscrive fa cadere questa',
  String((html.match(/2026-09-08/g) || []).length) + ' occorrenze');

/* ── il calendario reggeva già, e continua a reggere ── */
const schedaDep = g => g.calendario[0];
esito(schedaDep(PRIMA).quando !== 'passato' && schedaDep(PRIMA).passata === false,
  'il 7 la scheda del deposito è ancora futura', JSON.stringify(schedaDep(PRIMA)));
esito(schedaDep(DOPO).quando === 'passato' && schedaDep(DOPO).passata === true,
  'il 9 dice «passato» e prende la classe past', JSON.stringify(schedaDep(DOPO)));

/* ══ LE DUE FRASI ══════════════════════════════════════════════════════════════
   Si guarda che CAMBINO e in che verso, non quali parole portino: il ramo «dopo» è un
   segnaposto e le parole verranno sostituite. */
const dice = (t, re) => re.test(t);
const FUT = [
  {nome:'la fonte di errore', re:/fino al deposito delle liste/i},
  {nome:'i limiti',           re:/si decidono fino al deposito delle candidature/i}
];
const PAS = [
  {nome:'la fonte di errore', re:/questa fonte di errore si è chiusa/i},
  {nome:'i limiti',           re:/si decidevano fino al deposito/i}
];
FUT.forEach(function(x, i){
  esito(dice(PRIMA.nota, x.re), 'il 7 settembre ' + x.nome + ' parla del deposito al futuro');
  esito(!dice(DOPO.nota, x.re), 'e il 9 quella formulazione non c\'è più — ' + x.nome);
  esito(dice(DOPO.nota, PAS[i].re), 'il 9 ' + x.nome + ' ne parla al passato');
  esito(!dice(PRIMA.nota, PAS[i].re), 'e il 7 la formulazione al passato non c\'è ancora — ' + x.nome);
});

/* la proprietà che tiene tutto insieme, e che è la stessa della prova post-voto:
   NESSUNA delle due frasi resta identica fra i due giorni */
const estrai = (t, re) => { const m = re.exec(t); return m ? m[0] : null; };
const F1 = t => estrai(t, /Il modello proietta[^.]*\.|Con il deposito delle liste[^.]*\./);
const F2 = t => estrai(t, /Il modello non prevede le fusioni di liste[^;]*/);
esito(F1(PRIMA.nota) && F1(DOPO.nota) && F1(PRIMA.nota) !== F1(DOPO.nota),
  'la frase sulla fonte di errore NON resta identica fra il 7 e il 9',
  '7: «' + String(F1(PRIMA.nota)).slice(0,52) + '…» · 9: «' + String(F1(DOPO.nota)).slice(0,52) + '…»');
esito(F2(PRIMA.nota) && F2(DOPO.nota) && F2(PRIMA.nota) !== F2(DOPO.nota),
  'e nemmeno quella dei limiti',
  '7: «' + String(F2(PRIMA.nota)).slice(0,52) + '…» · 9: «' + String(F2(DOPO.nota)).slice(0,52) + '…»');

/* ── il confine è il GIORNO, non le ventiquattr'ore ──
   l'8 settembre il deposito è oggi, e la prosa deve ancora parlarne al futuro:
   è la stessa distinzione che ggCal porta al conto alla rovescia e alle schede */
const GIORNO = alGiorno('2026-09-08');
esito(GIORNO.dep === false,
  'l\'8 settembre, il giorno stesso, il deposito non è ancora passato', String(GIORNO.dep));
esito(dice(GIORNO.nota, FUT[0].re) && dice(GIORNO.nota, FUT[1].re),
  'e la prosa ne parla ancora al futuro: il confine è il giorno, non ventiquattr\'ore');
esito(GIORNO.calendario[0].quando === 'oggi',
  'mentre la scheda del calendario dice «oggi»', GIORNO.calendario[0].quando);

/* ── e dopo il voto le due frasi restano al passato, non tornano indietro ── */
const NOV = alGiorno('2026-11-10');
esito(NOV.dep === true && dice(NOV.nota, PAS[0].re) && dice(NOV.nota, PAS[1].re),
  'e restano al passato anche dopo il voto: il ramo non scade');

console.log('\ndeposito: ' + ok + '/' + (ok + ko));
if (ko) process.exit(1);
