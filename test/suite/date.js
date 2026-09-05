/* LE DUE DATE, L'ORIZZONTE CHE NON VA A ZERO E LA FASCIA DEL DOPO-VOTO.
 *
 * Sono tre cose e una famiglia sola: che cosa la pagina dice del TEMPO quando il tempo
 * passa e nessuno la riscrive. È l'invariante 10 — «niente tempo scritto a mano» —
 * portata dai numeri alla prosa e allo stato del modello.
 *
 * 1 · LE DUE DATE. «aggiornato al 20 agosto» diceva la data dell'ULTIMO SONDAGGIO in
 *     archivio, non quella dell'ultimo aggiornamento riuscito. Un lettore non poteva
 *     distinguere «ha girato stanotte e non c'era niente di nuovo» da «è fermo da dieci
 *     giorni»: la stessa stringa copre i due casi, e dentro un embed quella differenza è
 *     fra un dato fresco e un dato morto nell'articolo di qualcun altro. Adesso sono due
 *     grandezze con due nomi, e la pagina dichiara quando divergono.
 *
 * 2 · L'ORIZZONTE. GIORNI è quanto manca al voto e il 28 ottobre vale zero. Ma è anche il
 *     parametro con cui montecarlo() tara l'ampiezza dell'errore: a zero giorni gli
 *     intervalli si stringono al minimo, e la pagina mostrerebbe una precisione altissima
 *     attorno a una proiezione che nessuno ha più ricalcolato. La falsa precisione
 *     CRESCEREBBE mentre il dato invecchia, che è il verso peggiore. L'orizzonte è invece
 *     la distanza fra il voto e la rilevazione più recente, e resta quella per sempre.
 *
 * 3 · LA FASCIA. Dal 28 ottobre la pagina deve dire, sopra ogni altra cosa, che non è un
 *     risultato elettorale. Finché dati/archivio.json non porta il campo «esito» il
 *     modello non conosce il risultato vero, e una pagina che mostra 120 seggi il giorno
 *     dopo il voto viene letta come se lo mostrasse.
 *
 * L'orologio si congela come in deposito.js e giorni.js, con TZ=Europe/Rome: con TZ=UTC
 * metà di questi casi non si manifesta. E il fetch è FINTO, non respinto: il registro del
 * lavoro notturno è l'unica cosa che dà la data della verifica, quindi una prova che non
 * glielo servisse proverebbe soltanto il ramo «non disponibile».
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
process.env.TZ = 'Europe/Rome';

/* Rende l'intera pagina con l'orologio fermo a `iso` e il registro del lavoro notturno
   uguale a `job` (null = file assente, come quando si apre index.html da disco). */
async function alGiorno(iso, job, stretto, giro){
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
  /* la larghezza si legge da matchMedia, che qui è finta: è l'unico modo di provare la
     forma stretta senza un browser, ed è la stessa leva che usano istogramma, tendenza e
     riquadro dell'evento. */
  W.matchMedia = q => ({matches: !!stretto && /max-width:\s*660px/.test(String(q)),
                        addEventListener(){}, addListener(){}});
  W.IntersectionObserver = class { observe(){} unobserve(){} };
  global.IntersectionObserver = W.IntersectionObserver;
  W.requestAnimationFrame = f => f();
  W.localStorage = {getItem:()=>null, setItem(){}, removeItem(){}};
  global.getComputedStyle = () => ({getPropertyValue:()=>''});
  global.Blob = function(){}; global.URL = {createObjectURL(){ return ''; }};
  global.FileReader = function(){};
  /* l'archivio si rifiuta — vale il seme BASE, come da doppio clic — e il registro si
     serve solo se il caso lo prevede */
  /* DUE FILE, DUE FATTI. stato-job.json dice l'ultima verifica RIUSCITA; da-fare.json lo
     scrive il passo del riepilogo, che gira anche quando una guardia ha fermato tutto, e
     dice quando il job È PARTITO. Il finto fetch li serve tutti e due, o la prova non
     potrebbe distinguere «il job è bloccato» da «il job è fermo». */
  global.fetch = u => {
    if (job && /stato-job\.json/.test(u))
      return Promise.resolve({ok:true, json:() => Promise.resolve(job)});
    if (giro && /da-fare\.json/.test(u))
      return Promise.resolve({ok:true, json:() => Promise.resolve(giro)});
    return Promise.reject(0);
  };
  const src = src0.replace('carica().then(render,render)',
    'global.A={render:render,stato:function(){return{GIORNI:GIORNI,ORIZZONTE:ORIZZONTE,MC:MC,SEG:SEG,' +
    'JOB:JOB,GIRO:GIRO,SOND:SOND,L:L,VOTO:VOTO,GAP_VERIFICA:GAP_VERIFICA,'+
    'GAP_SONDAGGI:GAP_SONDAGGI,GAP_GIRO:GAP_GIRO};},' +
    'q:q,ggCal:ggCal,blocchi:blocchi,finestra:finestra};carica().then(render,render)');
  eval(src);
  /* la catena di carica() è fatta di microtask: un setTimeout(0) è un macrotask e arriva
     dopo tutte. Senza questa attesa JOB sarebbe ancora nullo e la prova misurerebbe lo
     stato prima del caricamento — la forma di prova che passa a vuoto e sembra verde. */
  await new Promise(r => setTimeout(r, 0));
  const testo = e => String((D.getElementById(e) || {}).innerHTML || '')
    .replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  const pv = D.getElementById('k-postvoto');
  const out = {
    S: global.A.stato(),
    upd: (D.getElementById('k-upd') || {}).textContent,
    GIRO: global.A.stato().GIRO,
    updClasse: (D.getElementById('k-upd') || {}).className,
    fresh: testo('k-fresh'),
    cd: testo('k-cd'),
    h1: (D.getElementById('k-h1') || {}).textContent,
    titolo: D.title,
    fascia: testo('k-postvoto'),
    fasciaVisibile: !!pv && /(^|\s)on(\s|$)/.test(pv.className),
    fermo: testo('k-fermo'),
    fermoVisibile: (function(){ const e = D.getElementById('k-fermo');
      return !!e && (' '+e.className+' ').indexOf(' on ') >= 0; })(),
    nota: testo('k-foot'),
    swnota: testo('k-sw-nota'),
    simn: (D.getElementById('k-simn') || {}).textContent,
    meta: ['k-cd','k-fresh','k-n'].map(i => testo(i)),
    anmeta: (D.getElementById('k-anmeta') || {}).textContent,
    analisi: testo('k-analisi'),
    movers: String((D.getElementById('k-movers') || {}).innerHTML || '').length,
    finestra: global.A.finestra ? global.A.finestra(0, 6).map(x => x.data) : null,
    ultimo: global.A.stato().SOND.filter(x => !x.pre).map(x => x.data).sort().pop()
  };
  global.Date = D0;
  return out;
}

(async function(){

const JOB = {data:'2026-08-22', valide:155, ambigue:24};
const OGGI   = await alGiorno('2026-08-22', JOB);
const VIGILIA= await alGiorno('2026-10-26', JOB);
const VOTO   = await alGiorno('2026-10-27', JOB);
const DOPO   = await alGiorno('2026-10-28', JOB);
const NOV    = await alGiorno('2026-11-10', JOB);
const FERMO  = await alGiorno('2026-09-05', {data:'2026-08-22'});
/* verifica riuscita l'11 giorni dopo l'ultimo sondaggio: la quiete supera la soglia dei
   sette, ed è il caso in cui il lettore deve sapere che il job gira e non trova niente */
const QUIETE = await alGiorno('2026-09-05', {data:'2026-08-30'});
const SENZA  = await alGiorno('2026-08-22', null);
/* ══ IL JOB BLOCCATO CONTRO IL JOB FERMO ══════════════════════════════════════════
 * Due cause dello stesso ritardo, e da qui si vedevano uguali. Il 27 agosto 2026 il cron
 * delle 03:30 non è partito e la testata ha continuato a dire «verificato il 26 agosto»
 * senza segnalare niente: un giorno di scarto sta sotto GAP_VERIFICA, e sarebbe rimasta
 * muta fino al 28. Il battito le distingue — dati/da-fare.json lo scrive il passo del
 * riepilogo, che gira con «if: always()» anche quando una guardia ha fermato tutto. */
const BLOCCATO = await alGiorno('2026-09-05', {data:'2026-08-22'}, false,
  {generato:'2026-09-05', job:{esito:'ko'}});
const SPENTO   = await alGiorno('2026-09-05', {data:'2026-08-22'}, false,
  {generato:'2026-08-22', job:{esito:'ok'}});

/* ══ 1 · LA FASCIA DEL DOPO-VOTO ══════════════════════════════════════════════ */

esito(!OGGI.fasciaVisibile && !VIGILIA.fasciaVisibile,
  'prima del voto la fascia non si vede');
esito(!VOTO.fasciaVisibile,
  'e nemmeno il 27 ottobre, il giorno stesso: il confine è il giorno, non ventiquattr\'ore');
esito(DOPO.fasciaVisibile && NOV.fasciaVisibile,
  'dal 28 ottobre si vede, e non scade più');
esito(/Le elezioni si sono tenute il 27 ottobre 2026/.test(DOPO.fascia),
  'e dice quando si è votato', DOPO.fascia);
esito(/non mostra i risultati elettorali/.test(DOPO.fascia),
  'e soprattutto che questa non è la pagina dei risultati');
/* la data non è scritta nella fascia: viene da VOTO, che è l'unico posto in cui la data
   del voto è dichiarata. Se restasse anche qui sarebbe la solita strada doppia. */
esito((html.match(/2026-10-27/g) || []).length === 1,
  'la data del voto in forma ISO compare una volta sola nel file: chi la riscrive fa cadere questa',
  String((html.match(/2026-10-27/g) || []).length) + ' occorrenze');
/* il testo si scrive sempre, anche quando non si vede: così il giorno in cui compare non
   è il giorno in cui viene scritto per la prima volta */
esito(OGGI.fascia === DOPO.fascia && OGGI.fascia.length > 60,
  'il testo della fascia esiste anche prima del voto: a comparire è solo la classe');

/* ══ 2 · IL CONTO ALLA ROVESCIA E L'ORIZZONTE SONO DUE GRANDEZZE ══════════════ */

const ultimo = OGGI.S.L[0].data;
/* L'orizzonte atteso si ricalcola QUI, con l'aritmetica scritta per esteso, invece di
   chiamare la ggCal del modello: una prova che riusasse la funzione provata direbbe
   soltanto che è uguale a sé stessa. */
function giorniFra(a, b){
  const A0 = new Date(a + 'T00:00:00'), B0 = new Date(b + 'T00:00:00');
  return Math.round((Date.UTC(B0.getFullYear(),B0.getMonth(),B0.getDate()) -
                     Date.UTC(A0.getFullYear(),A0.getMonth(),A0.getDate())) / 864e5);
}
const ORIZ = giorniFra(ultimo, '2026-10-27');
esito(OGGI.S.ORIZZONTE === ORIZ,
  'l\'orizzonte è la distanza fra la rilevazione più recente e il voto',
  OGGI.S.ORIZZONTE + ' contro ' + ORIZ + ' (ultimo sondaggio ' + ultimo + ')');
esito(OGGI.S.GIORNI !== OGGI.S.ORIZZONTE,
  'e non coincide col conto alla rovescia: sono due grandezze, e con l\'archivio di oggi differiscono',
  'conto ' + OGGI.S.GIORNI + ', orizzonte ' + OGGI.S.ORIZZONTE);
esito(VOTO.S.GIORNI === 0 && DOPO.S.GIORNI === 0 && NOV.S.GIORNI === 0,
  'dal giorno del voto il conto alla rovescia è zero');
esito(DOPO.S.ORIZZONTE === ORIZ && NOV.S.ORIZZONTE === ORIZ,
  'ma l\'orizzonte no: resta quello, e non si muove più',
  DOPO.S.ORIZZONTE + ' · ' + NOV.S.ORIZZONTE);
esito(OGGI.S.ORIZZONTE === DOPO.S.ORIZZONTE && OGGI.S.ORIZZONTE === NOV.S.ORIZZONTE,
  'e non c\'è nessun salto fra il 22 agosto e il 10 novembre: una regola sola, senza rami');

/* LA CONSEGUENZA CHE SI VEDE: gli intervalli non collassano. È il motivo per cui
   l'orizzonte esiste, e va misurato sul numero che il lettore legge — l'ampiezza della
   banda dell'80% — non sul parametro. */
{
  const amp = g => {
    const a = g.S.MC.coal;
    const qq = (arr,p) => arr[Math.min(arr.length-1, Math.max(0, Math.floor(p*arr.length)))];
    return qq(a,.90) - qq(a,.10);
  };
  const a0 = amp(OGGI), a1 = amp(NOV);
  esito(a1 > 0 && Math.abs(a1 - a0) <= Math.max(2, a0 * 0.25),
    'e la banda dell\'80% del blocco non collassa dopo il voto: ' + a0 + ' seggi il 22 agosto, ' + a1 + ' il 10 novembre');
  esito(a1 >= 6,
    'e resta larga quanto un\'incertezza a due mesi dal voto, non quanto una a zero giorni', String(a1));
}
esito(/orizzonte\s+\d+\s+giorni/.test(String(NOV.simn)) && !/orizzonte 0 giorni/.test(String(NOV.simn)),
  'e la riga sotto le simulazioni dichiara l\'orizzonte vero, non zero', String(NOV.simn));

/* ══ 3 · LE DUE DATE ══════════════════════════════════════════════════════════ */

esito(/verificato il 22 agosto 2026/.test(OGGI.upd),
  'la testata dice l\'ultima VERIFICA riuscita, letta dal registro del lavoro notturno', OGGI.upd);
esito(!/aggiornato al/.test(OGGI.upd),
  'e non chiama più «aggiornamento» la data dell\'ultimo sondaggio');
esito(new RegExp('ultimo sondaggio ' + '19 agosto 2026').test(OGGI.fresh),
  'e l\'altra riga dice l\'ultimo SONDAGGIO, che è un\'altra data', OGGI.fresh);
esito(OGGI.upd.indexOf('19 agosto') < 0 && OGGI.fresh.indexOf('22 agosto') < 0,
  'le due non si scambiano: ciascuna porta la sua');
esito(/verifica non nota/.test(SENZA.upd),
  'senza il registro la testata lo dichiara invece di ripiegare sull\'ultimo sondaggio', SENZA.upd);
esito(/vecchio/.test(String(SENZA.updClasse)),
  'e lo segnala anche al colore, perché un dato di cui non si sa l\'età non è un dato fresco',
  String(SENZA.updClasse));

/* LE DUE DIVERGENZE, che sono due e non una. */
esito(!/giorni fa/.test(OGGI.upd) && !/vecchio/.test(String(OGGI.updClasse)),
  'con il job che ha girato stanotte la testata non dice niente in più', OGGI.upd);
esito(/14 giorni fa/.test(FERMO.upd) && /vecchio/.test(String(FERMO.updClasse)),
  'con il job fermo da due settimane la testata dice da quanto, e lo marca',
  FERMO.upd + ' · ' + FERMO.updClasse);
esito(OGGI.S.GAP_VERIFICA === 2 && OGGI.S.GAP_SONDAGGI === 7,
  'le due soglie sono dichiarate una volta sola e valgono 2 e 7 giorni',
  OGGI.S.GAP_VERIFICA + ' · ' + OGGI.S.GAP_SONDAGGI);
/* il 22 agosto la distanza fra l'ultimo sondaggio (19) e la verifica (22) è di tre
   giorni: sotto la soglia, quindi non si dice niente */
esito(!/non ne arrivano di nuovi/.test(OGGI.fresh),
  'tre giorni di silenzio non si dichiarano: è la cadenza normale', OGGI.fresh);
esito(/11 giorni.*non ne arrivano di nuovi/.test(QUIETE.fresh),
  'ma con la verifica del 30 agosto e l\'ultimo sondaggio del 19, la quiete si dichiara e si conta',
  QUIETE.fresh);
esito(!/non ne arrivano di nuovi/.test(FERMO.fresh),
  'e non si dichiara quando è il job a essere fermo: lì la notizia è l\'altra, ed è nella testata',
  FERMO.fresh);

/* ══ 4 · LE FRASI CHE SCADONO ══════════════════════════════════════════════════ */

esito(/mancano ancora \d+ giorn/.test(OGGI.nota),
  'la nota ricava i giorni al voto invece di scrivere «due mesi»',
  (OGGI.nota.match(/restano ampi[^.]*\./) || [''])[0]);
/* «due mesi» resta legittimo dove è STORIA — la colonna «A due mesi» della tabella degli
   ancoraggi e le istantanee del banco di prova — quindi si guarda la frase, non il file. */
const FRASE4 = (OGGI.nota.match(/Gli intervalli mostrati[^.]*.[^.]*./) || [''])[0];
esito(FRASE4 && !/due mesi/.test(FRASE4),
  'e la frase non porta più il «due mesi» scritto a mano', FRASE4);
esito(!/circa cinque seggi/.test(OGGI.nota) && !/due o tre./.test(OGGI.nota),
  'né lo «scarto tipico di circa cinque seggi», che dipendeva dalla distanza dal voto');
esito(/erano ampi perché la proiezione si è fermata/.test(NOV.nota),
  'e dopo il voto la stessa frase passa al passato',
  (NOV.nota.match(/erano ampi[^.]*\./) || [''])[0]);
esito(!/mancano ancora/.test(NOV.nota),
  'senza lasciare in giro la formulazione al futuro');
esito(!/tre volte più piccoli/.test(OGGI.nota),
  'il rapporto degli ancoraggi non è più scritto «tre volte»');
esito(/propongono in media [\d,]+ punti .? ?e a una settimana ne proporranno/.test(OGGI.nota),
  'ed esce dai due valori calcolati',
  (OGGI.nota.match(/I pulsanti cambiano[^.]*\./) || [''])[0]);
esito(/proponevano in media/.test(NOV.nota) && !/proporranno/.test(NOV.nota),
  'e anche quella frase passa al passato dopo il voto',
  (NOV.nota.match(/I pulsanti cambiavano[^.]*\./) || [''])[0]);
esito(/dove siamo oggi/.test(OGGI.swnota) && /dove la proiezione si è fermata/.test(NOV.swnota),
  'e la nota sotto il cursore dello swing pure');
/* lo scarto tipico esce dal Monte Carlo: se fosse ancora una costante, non cambierebbe
   fra due stati con orizzonti diversi — e qui l'orizzonte è lo stesso, quindi si guarda
   che il numero ci sia e sia quello della banda disegnata */
esito(/lo scarto tipico sul totale di un blocco vale [\d,]+ seggi/.test(OGGI.nota),
  'lo scarto tipico è un numero calcolato',
  (OGGI.nota.match(/lo scarto tipico[^.]*\./) || [''])[0]);

/* ══ 5 · IL TITOLO CAMBIA TEMPO VERBALE ═══════════════════════════════════════ */

esito(!/Alla vigilia del voto/.test(OGGI.h1) && !/Alla vigilia del voto/.test(VOTO.h1),
  'fino al 27 ottobre compreso il titolo parla al presente', VOTO.h1);
esito(/^Alla vigilia del voto/.test(DOPO.h1) && /^Alla vigilia del voto/.test(NOV.h1),
  'dal 28 parla al passato, e il soggetto è il modello', DOPO.h1);
esito(OGGI.h1 !== DOPO.h1 && OGGI.titolo !== DOPO.titolo,
  'e cambiano tutti e due: l\'h1 e il <title>',
  DOPO.titolo);
esito(String(DOPO.titolo).length < 60, 'il <title> del dopo sta sotto i 60 caratteri',
  DOPO.titolo + ' — ' + String(DOPO.titolo).length);
esito(/Voto concluso/.test(VOTO.cd) && /Voto concluso/.test(DOPO.cd),
  'e il conto alla rovescia dice «voto concluso»', VOTO.cd);

/* ══ 6 · IL SOMMARIO A UNA RIGA SOTTO I 660 ═══════════════════════════════════
 *
 * Misurato su browser il 22 agosto 2026 a 375px: le tre voci chiedevano 706,3px di testo
 * dentro 353, quindi quattro righe e 70px di altezza. In forma corta 321,9px su una riga
 * sola, 15,5px, con 31 di margine. Sopra i 660 non cambia niente: 676px dà le stesse due
 * righe di prima.
 *
 * SONO DUE FORME DELLO STESSO DATO, ed è per questo che la prova le lega invece di
 * guardarle una per volta: è la lezione delle schede dell'house effect, dove tabella e
 * scheda erano ciascuna corretta rispetto a sé stessa e discordi fra loro. Qui i numeri
 * sono quattro — giorni al voto, giorno e mese dell'ultimo sondaggio, rilevazioni nel
 * modello, rilevazioni in archivio — e devono essere gli stessi nelle due forme. */
{
  const LARGO   = await alGiorno('2026-08-22', JOB, false);
  const STRETTO = await alGiorno('2026-08-22', JOB, true);
  const num = t => (String(t).match(/\d+/g) || []).map(Number);

  esito(STRETTO.meta.join(' ') !== LARGO.meta.join(' '),
    'sotto i 660 il sommario cambia forma', STRETTO.meta.join(' · '));
  esito(STRETTO.meta.join('').length < LARGO.meta.join('').length * 0.6,
    'e la forma corta è meno della metà: ' +
    STRETTO.meta.join('').length + ' caratteri contro ' + LARGO.meta.join('').length);

  /* i giorni al voto: stesso numero nelle due forme */
  esito(num(STRETTO.meta[0])[0] === num(LARGO.meta[0])[0] && num(LARGO.meta[0])[0] > 0,
    'i giorni al voto sono gli stessi nelle due forme',
    STRETTO.meta[0] + ' · ' + LARGO.meta[0]);
  /* la data dell'ultimo sondaggio: la forma corta porta giorno e mese, la lunga anche
     l'anno, ma il giorno e il mese devono coincidere */
  const gL = num(LARGO.meta[1]), gS = num(STRETTO.meta[1]);
  esito(gS[0] === gL[0] && gS.length >= 2,
    'la data dell\'ultimo sondaggio è la stessa: stesso giorno nelle due forme',
    STRETTO.meta[1] + ' · ' + LARGO.meta[1]);
  esito(/^sondaggi al /.test(STRETTO.meta[1]) && /^ultimo sondaggio /.test(LARGO.meta[1]),
    'e resta chiaro di che data si tratta anche in forma corta', STRETTO.meta[1]);
  /* i due conteggi delle rilevazioni */
  const cL = num(LARGO.meta[2]), cS = num(STRETTO.meta[2]);
  esito(cS.length === 2 && cL.length >= 2 && cS[0] === cL[0] && cS[1] === cL[1],
    'e i due conteggi delle rilevazioni sono gli stessi',
    STRETTO.meta[2] + ' · ' + LARGO.meta[2]);
  esito(cS[0] > 0 && cS[1] >= cS[0],
    'con quelle nel modello mai più di quelle in archivio', STRETTO.meta[2]);
  /* il foglio deve dichiarare la riga unica sotto i 660: senza nowrap la forma corta ci
     starebbe lo stesso oggi, e si riaprirebbe a due righe in silenzio il giorno in cui
     un numero passa a tre cifre */
  esito(/@media\(max-width:660px\)[\s\S]{0,4000}#kn26 \.meta\{[^}]*flex-wrap:nowrap/.test(html),
    'e il foglio dichiara la riga unica sotto i 660, invece di lasciarla al caso');
}

/* ══ 7 · «NEGLI ULTIMI 7 GIORNI» CONTA DA OGGI ════════════════════════════════
 *
 * Seconda metà del difetto chiuso sul confronto della proiezione. `finestra()` prendeva
 * come riferimento la data della rilevazione più recente, quindi «gli ultimi 7 giorni»
 * voleva dire «i sette giorni prima dell'ultimo sondaggio». Con l'archivio fresco le due
 * ancore coincidono e la frase è vera; la deriva CRESCE IN SILENZIO quando il lavoro
 * notturno si ferma, perché l'ancora si allontana da oggi insieme all'archivio.
 *
 * La conseguenza che il difetto nascondeva: con l'ancora giusta la finestra può essere
 * VUOTA. Prima non poteva — conteneva sempre almeno l'ultimo sondaggio — e il ramo di
 * uscita lasciava il sottotitolo con il conteggio del render precedente. */
{
  const dentro = (date, D) => date.filter(x => {
    const A0 = new Date(x + 'T00:00:00'), B0 = new Date(D + 'T00:00:00');
    const d = Math.round((Date.UTC(B0.getFullYear(),B0.getMonth(),B0.getDate()) -
                          Date.UTC(A0.getFullYear(),A0.getMonth(),A0.getDate())) / 864e5);
    return d >= 0 && d <= 6;
  });

  /* con l'archivio fresco la finestra è quella dei sette giorni prima di OGGI, e si
     ricalcola qui a mano invece di richiamare finestra() */
  const tutte = OGGI.S.SOND.filter(x => !x.pre).map(x => x.data);
  const atteso = dentro(tutte, '2026-08-22').sort();
  esito(JSON.stringify(OGGI.finestra.slice().sort()) === JSON.stringify(atteso),
    'la finestra dei 7 giorni contiene le rilevazioni dei sette giorni prima di oggi',
    OGGI.finestra.length + ' contro ' + atteso.length);
  esito(new RegExp('^' + OGGI.finestra.length + ' rilevazioni pubblicate negli ultimi 7 giorni$')
        .test(OGGI.anmeta),
    'e il sottotitolo dice quel numero', OGGI.anmeta);

  /* LE DUE ANCORE DIVERGONO DAVVERO, e la prova lo mostra invece di darlo per buono:
     al 10 novembre i sette giorni prima di oggi non contengono niente, i sette prima
     dell'ultimo sondaggio ne contengono sette. Era la frase falsa sul presente. */
  const vecchiaAncora = dentro(tutte, NOV.ultimo);
  esito(vecchiaAncora.length > 0,
    'con la vecchia ancora — l\'ultimo sondaggio — la finestra sarebbe piena anche a novembre',
    vecchiaAncora.length + ' rilevazioni attorno al ' + NOV.ultimo);
  esito(NOV.finestra.length === 0,
    'con l\'ancora giusta al 10 novembre la finestra è vuota', JSON.stringify(NOV.finestra));
  esito(!/\d+ rilevazioni pubblicate negli ultimi 7 giorni/.test(NOV.anmeta),
    'e il sottotitolo non scrive più un conteggio falso sul presente', NOV.anmeta);
  esito(/nessuna rilevazione negli ultimi 7 giorni/.test(NOV.anmeta),
    'ma dichiara che non ce n\'è nessuna', NOV.anmeta);
  esito(/non è stata pubblicata nessuna rilevazione/.test(NOV.analisi) && NOV.analisi.length > 80,
    'e la tabella lo spiega invece di restare vuota', NOV.analisi.slice(0, 110));
  esito(/l’ultima in archivio è del|l'ultima in archivio è del/.test(NOV.analisi),
    'dicendo di quando è l\'ultima rilevazione che ha');
  esito(NOV.movers === 0, 'e le righe dei movimenti spariscono, invece di restare quelle di ieri');

  /* la proiezione in cima NON sparisce: usa una finestra di 60 giorni, ed è la
     distinzione che il testo del ramo vuoto dichiara */
  esito(NOV.S.SEG && Object.keys(NOV.S.SEG).length > 0 &&
        Object.values(NOV.S.SEG).reduce((a, b) => a + b, 0) === 120,
    'mentre la proiezione resta e fa sempre 120: la sua finestra è di 60 giorni');

  /* L'ACCORDO DI NUMERO, che stava scritto a mano. Il 25 agosto in finestra cade una
     sola rilevazione — è il primo giorno in cui succede con questo archivio — e la
     versione precedente avrebbe scritto «1 rilevazioni pubblicate». */
  const UNA = await alGiorno('2026-08-25', JOB);
  esito(UNA.finestra.length === 1,
    'il 25 agosto in finestra cade una rilevazione sola', JSON.stringify(UNA.finestra));
  esito(UNA.anmeta === '1 rilevazione pubblicata negli ultimi 7 giorni',
    'e il sottotitolo va al singolare: «1 rilevazioni» era la quarta copia della regola',
    UNA.anmeta);
  esito(/La mediana è calcolata su 1 rilevazione /.test(UNA.analisi) &&
        !/1 rilevazioni/.test(UNA.analisi),
    'e la frase della mediana pure, con il participio accordato',
    (UNA.analisi.match(/La mediana è calcolata[^.]*\./) || [''])[0]);
  esito(![OGGI, NOV, UNA].some(g => /\b1 rilevazioni\b/.test(g.anmeta + ' ' + g.analisi)),
    'e in nessuno stato compare «1 rilevazioni»');
}

/* ══ IL BATTITO: «non ha CONCLUSO» e «non ha GIRATO» sono due fatti ═══════════════ */

esito(/verificato il 22 agosto/.test(BLOCCATO.upd) && !/non gira/.test(BLOCCATO.upd),
  'job che gira e viene bloccato: la testata dice la verifica vecchia, non che sia fermo',
  BLOCCATO.upd);
esito(/vecchio/.test(BLOCCATO.updClasse),
  'e la segnala comunque, perche quattordici giorni senza una verifica riuscita sono tanti');
esito(/non gira dal 22 agosto/.test(SPENTO.upd),
  'job che NON gira: la testata lo dice, ed e un altra frase perche e un altro fatto',
  SPENTO.upd);
esito(!/verificato il/.test(SPENTO.upd),
  'e smette di dire la data della verifica: con la macchina ferma non e piu quella la notizia',
  SPENTO.upd);
esito(/vecchio/.test(SPENTO.updClasse), 'e resta marcata vecchia');
/* il caso di oggi, che è quello che il difetto ha attraversato: il job ha girato ieri e
   ha concluso ieri, quindi non si segnala niente */
const IERI = await alGiorno('2026-08-23', {data:'2026-08-22'}, false,
  {generato:'2026-08-22', job:{esito:'ok'}});
esito(!/non gira/.test(IERI.upd) && !/vecchio/.test(IERI.updClasse),
  'e un solo giorno di scarto non allarma nessuno dei due: la soglia c e per non gridare',
  IERI.upd);
esito(SPENTO.S.GAP_GIRO >= 1 && SPENTO.S.GAP_GIRO <= 3,
  'la soglia del battito e dichiarata e sta fra uno e tre giorni', String(SPENTO.S.GAP_GIRO));
/* e senza il file il battito non inventa niente, come per lo stato */
esito(SENZA.GIRO === null,
  'senza dati/da-fare.json il battito resta nullo invece di ripiegare su una data');


/* ══ LA FASCIA DEL PERCHE, non del quando ═══════════════════════════════════════════
 * La testata dice da quanti giorni il dato e vecchio, ed e onesto ma non e un allarme: al
 * lettore serve sapere che qualcuno deve intervenire. La condizione il modello la conosce
 * gia — stato-job.json fermo e da-fare.json con voci che BLOCCANO — quindi non c e nessuno
 * stato nuovo e nessun fetch nuovo: il file lo scarica gia battitoJob().
 * E LA CAUSA SI LEGGE DALLA VOCE, NON DAL CONTEGGIO. Le voci che bloccano sono quattro e
 * non dicono la stessa cosa: colonne-ignote e la fonte che pubblica liste che non
 * conosciamo, accordo-invalido e un errore nella NOSTRA tabella. Condizionare su
 * «blocca > 0» avrebbe dato la colpa alla fonte anche per una nostra riga sbagliata, cioe
 * una frase falsa scritta con sicurezza. */
{
  const IGNOTE  = {generato:'2026-09-08', voci:[{id:'colonne-ignote', urgenza:'blocca'}]};
  const NOSTRA  = {generato:'2026-09-08', voci:[{id:'accordo-invalido-3', urgenza:'blocca'}]};
  const INNOCUA = {generato:'2026-09-08', voci:[{id:'eventi-da-tradurre', urgenza:'richiede'}]};
  const FERMO   = {data:'2026-08-20'};
  const FRESCO  = {data:'2026-09-08'};

  const fa = await alGiorno('2026-09-08', FERMO, false, IGNOTE);
  esito(fa.fermoVisibile && fa.fermo.indexOf('liste che il modello non ha ancora mappato') >= 0,
    'con le colonne ignote e la verifica ferma la fascia dice PERCHE, non da quanti giorni',
    fa.fermo.slice(0, 130));

  const fb = await alGiorno('2026-09-08', FERMO, false, NOSTRA);
  esito(fb.fermoVisibile && fb.fermo.indexOf('La fonte ha pubblicato') < 0 &&
        fb.fermo.indexOf('richiede un intervento') >= 0,
    'e con una voce che NON e della fonte non da la colpa alla fonte',
    fb.fermo.slice(0, 130));

  const fc = await alGiorno('2026-09-08', FRESCO, false, IGNOTE);
  esito(!fc.fermoVisibile,
    'e non scatta un giorno prima: con la verifica fresca tace, come la testata',
    fc.fermo || '(vuota)');

  const fd = await alGiorno('2026-09-08', FERMO, false, INNOCUA);
  esito(!fd.fermoVisibile,
    'e non scatta per una voce che non blocca: quelle non fermano l archivio',
    fd.fermo || '(vuota)');

  const fe = await alGiorno('2026-09-08', FERMO, false, null);
  esito(!fe.fermoVisibile,
    'e senza da-fare.json — pagina aperta da disco — tace invece di indovinare',
    fe.fermo || '(vuota)');

  const rigaS = src0.split(String.fromCharCode(10))
    .find(r => r.indexOf('SINT_TIENI') >= 0) || '';
  esito(rigaS.indexOf(String.fromCharCode(39) + 'k-fermo' + String.fromCharCode(39)) >= 0,
    'e la fascia resta nella forma compatta dell embed: un archivio fermo conta di piu li',
    rigaS.trim().slice(0, 110));
}

console.log('\ndate: ' + ok + '/' + (ok + ko));
if (ko) process.exit(1);

})();
