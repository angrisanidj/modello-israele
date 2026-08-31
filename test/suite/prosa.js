/* ══════════════════════════════════════════════════════════════════════════════════
 * LA PROSA DEI QUATTRO BLOCCHI — V1-V7, P1-P4, I3-I6, S2-S7 e il primo partito
 *
 * Dettata dall'autore il 31 agosto 2026 su docs/testi-quattro-blocchi.md. Quello che qui
 * si prova non sono le stringhe — sarebbe ricopiarle — ma le PROPRIETÀ per cui sono state
 * scritte così, e il legame fra ogni numero citato e la grandezza da cui viene.
 *
 * LE FUNZIONI DELLA DIREZIONE SONO PURE E SI ESERCITANO SU CASI COSTRUITI, e senza non si
 * proverebbe quasi niente: V3, V6 e V7 dipendono da configurazioni che l'archivio del
 * giorno non produce — un blocco che attraversa 61, una lista che cade sotto soglia, il
 * voto passato — e un ramo che i dati non raggiungono è un ramo che nessuna mutazione fa
 * cadere. È l'idioma già pagato da fraseSoglia() in soglianota.js.
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
  'global.A={P:P,IDS:IDS,BL:BL,SEG_:function(){return SEG;},render:render,blocchi:blocchi,' +
  'casoDirezione:casoDirezione,fraseDirezione:fraseDirezione,clausolaDirezione:clausolaDirezione,' +
  'margineDichiarato:margineDichiarato,codaIsto:codaIsto,btErrori:btErrori,frasePrimo:frasePrimo,' +
  'BT_VICINO:BT_VICINO,BT_LONTANO:BT_LONTANO,PRIMO_STRETTO:PRIMO_STRETTO,' +
  'CHIAVI_BLOCCO:CHIAVI_BLOCCO,BLOCCHI_CAMPO:BLOCCHI_CAMPO,seg:seg,PRESET:PRESET,' +
  'get MC(){return MC;},get PREC(){return PREC;},get SEG(){return SEG;},' +
  'get SOND(){return SOND;},set SOND(v){SOND=v;},set SIM(v){SIM=v;},' +
  'get PAR(){return PAR;},set SW(v){SW=v;},set AFF(v){AFF=v;},get COAL(){return COAL;},' +
  'nm:nm};})();';
eval(src);

const $ = i => D.getElementById(i);
const testo = i => ($(i) ? $(i).textContent.replace(/\s+/g,' ').trim() : '');
A.SIM = 3000;
require('../frescura.js')({SOND:()=>A.SOND, setSOND:v=>{A.SOND=v;}, render:()=>A.render()});
A.render();

/* ══ 1 · I SETTE CASI DELLA DIREZIONE, SU CASI COSTRUITI ══════════════════════════ */
const B = (c,o,a,i) => ({coalizione:c, opposizione:o, arabo:a, incerto:i});
const prec = {taglio:'2026-08-24', data:'2026-08-23', n:44};
const base = {b:B(54,54,12,0), bp:B(54,54,12,0), prec:prec, oriz:58, dopoVoto:false,
              pC0:.05, pC1:.05, pO0:.14, pO1:.14, leva:false, entrata:null, uscita:null};
const con = x => Object.assign({}, base, x);

esito(A.casoDirezione(con({})) === 'V1',
  'V1: nessun blocco si muove', A.casoDirezione(con({})));
esito(A.casoDirezione(con({b:B(56,52,12,0)})) === 'V2',
  'V2: un blocco si muove ma nessuno attraversa 61');
esito(A.casoDirezione(con({b:B(62,46,12,0)})) === 'V3',
  'V3: un blocco attraversa 61 — e vince su V2, perche il movimento non e piu la notizia');
esito(A.casoDirezione(con({bp:B(62,46,12,0)})) === 'V3',
  'e vale anche nel verso opposto: un blocco che SCENDE sotto 61 ha attraversato lo stesso');
esito(A.casoDirezione(con({ps:{scatta:true, blocco:'coalizione', ora:9, prima:5}})) === 'V4',
  'V4: seggi fermi e probabilita mossa');
esito(A.casoDirezione(con({prec:null})) === 'V5',
  'V5: senza PREC non c e niente da confrontare');
esito(A.casoDirezione(con({dopoVoto:true})) === 'V7',
  'V7: dopo il voto, e vince su TUTTI — anche su V5, perche a voto avvenuto il riquadro '+
  'non torna piu');
esito(A.casoDirezione(con({dopoVoto:true, prec:null})) === 'V7',
  'e infatti V7 vince anche senza PREC');

/* ══ 2 · IL MARGINE DICHIARATO, E IL BUCO CHE IL BANCO NON COPRE ══════════════════
 * Il banco misura l'errore a due mesi e nell'ultima settimana, e FRA LE DUE non ha
 * istantanee. La frase non interpola — sarebbe una stima presentata come misura — e non
 * omette la cifra, che lascerebbe credere che il margine sia noto: dichiara il buco e dà i
 * due numeri veri. */
const e = A.btErrori();
esito(A.margineDichiarato(A.BT_VICINO).noto && A.margineDichiarato(A.BT_LONTANO).noto,
  'il margine e noto ai due estremi che il banco misura');
esito(!A.margineDichiarato(A.BT_VICINO + 1).noto && !A.margineDichiarato(A.BT_LONTANO - 1).noto,
  'e NON e noto in mezzo: fra la settimana e i due mesi il banco non ha istantanee',
  (A.BT_VICINO+1) + '-' + (A.BT_LONTANO-1) + ' giorni');
esito(A.margineDichiarato(A.BT_VICINO).val === e.vicino &&
      A.margineDichiarato(A.BT_LONTANO).val === e.lontano,
  'e i due valori sono quelli di btErrori(), non due numeri scritti qui');
{
  const f1 = A.fraseDirezione(con({b:B(56,52,12,0), oriz:(A.BT_VICINO+A.BT_LONTANO)/2|0}));
  esito(/non copre questa distanza/.test(f1) &&
        f1.indexOf(A.seg(e.lontano,1)) > 0 && f1.indexOf(A.seg(e.vicino,1).split(' ')[0]) > 0,
    'nella fascia scoperta la frase DICHIARA il buco e cita tutti e due i numeri veri',
    f1.slice(-190));
  const f2 = A.fraseDirezione(con({b:B(56,52,12,0), oriz:A.BT_LONTANO + 20}));
  esito(!/non copre/.test(f2) && f2.indexOf(A.seg(e.lontano,1)) > 0,
    'e dove il banco misura cita UNA cifra sola', f2.slice(-150));
  /* l'errore vale 4,5: seg() senza decimali lo arrotondava a «5 seggi», cioe' pubblicava
     un numero diverso da quello che la nota metodologica dichiara */
  esito(/,\d/.test(A.seg(e.lontano,1)),
    'e il decimale non si perde: il margine e 4,5 e non 5', A.seg(e.lontano,1));
}

/* ══ 3 · V6 — LE CAUSE CHE NON SONO I SONDAGGI ════════════════════════════════════
 * Tre rami con conseguenze diverse per la prosa: la leva e' reversibile e la governa il
 * lettore, l'attraversamento della soglia e' un fatto dei dati, la caduta muove piu'
 * blocchi insieme. Una frase scritta per la sola leva direbbe la cosa sbagliata proprio nel
 * caso che si e' visto in pagina il 28 agosto. */
esito(A.clausolaDirezione({leva:true}).indexOf('non viene dai sondaggi') > 0,
  'la leva si dichiara come IPOTESI, e la frase dice come toglierla');
esito(/Spegnendola/.test(A.clausolaDirezione({leva:true})),
  'e la via d uscita c e: un ipotesi senza il comando per toglierla e una parola sola');
{
  const s = A.clausolaDirezione({entrata:'likud', b_entrata:5});
  esito(/superato la soglia/.test(s) && /nessun elettore/.test(s),
    'chi attraversa la soglia si dichiara come FATTO, non come ipotesi: e la distinzione '+
    'per cui i rami sono tre e non uno', s.slice(0,90));
  esito(A.clausolaDirezione({entrata:'likud', b_entrata:5}).indexOf(A.seg(5)) > 0,
    'e i suoi seggi passano da seg(), che porta l accordo');
}
esito(/ridistribuiti fra tutte le liste rimaste/.test(A.clausolaDirezione({uscita:'likud'})),
  'chi cade sotto soglia dice la meccanica giusta: i seggi vanno a TUTTE le liste rimaste, '+
  'non a quelle del suo campo — e la nota della soglia dice la stessa cosa');
/* IL LEGAME SI PROVA NEL SORGENTE, perche' la CONDIZIONE non e' esercitabile: PREC gira
   con i parametri di adesso, quindi la leva e' applicata a tutti e due i termini e
   contribuisce al movimento SOLO se la lista che sposta ha cambiato seggi fra le due
   esecuzioni. Costruire quello stato vorrebbe dire fabbricare un PREC, cioe' un secondo
   modo di produrlo. Si legge la riga che passa «leva», come per og:title col job. */
{
  const src = fs.readFileSync(__dirname + '/../../index.html','utf8');
  /* la RIGA che passa il campo, non ogni riga che nomina la parola: un commento che
     spiega la leva la nomina anche lui, ed e la trappola di ARCO_ORD per la quarta volta */
  const L = src.split(String.fromCharCode(10));
  const riga = L.map((l,i) => l.trim().indexOf('leva:') === 0 ? l + ' ' + (L[i+1]||'') : '')
    .join(' ');
  esito(riga.indexOf('bF') >= 0 && riga.indexOf('bpF') >= 0,
    'e la leva si dichiara quando CONTRIBUISCE al movimento, non quando e accesa: PREC gira '+
    'coi parametri di adesso, quindi la leva sposta tutti e due i termini e il delta non ne '+
    'risente se i seggi della lista non sono cambiati', riga.trim().slice(0,110));
  esito(riga.indexOf('PAR.inbilico') < 0,
    'e non guarda PAR.inbilico da solo, che sarebbe vero anche quando la leva non muove nulla');
}
esito(A.clausolaDirezione({}) === '',
  'e senza nessuna delle tre cause la clausola tace: dichiararne una che non c e insegna '+
  'a saltare la riga');
{
  const f = A.fraseDirezione(con({b:B(56,52,12,0), leva:true}));
  esito(/almeno un seggio/.test(f) && /non viene dai sondaggi/.test(f),
    'e la clausola SI AGGIUNGE al caso invece di sostituirlo: il movimento c e comunque, '+
    'e V2 e V3 lo raccontano');
}

/* ══ 4 · LE QUATTRO PASTIGLIE ═════════════════════════════════════════════════════
 * Sono una PARTIZIONE delle simulazioni, quindi la prosa non può sovrapporsi né lasciare
 * buchi. E P1 non elenca i cinque nomi a mano: li elencava, ed era la copia che l'8
 * settembre resta indietro. */
{
  const righe = [...($('k-probs')||{children:[]}).children]
    .map(c => (c.querySelector('.d')||{textContent:''}).textContent.replace(/\s+/g,' ').trim());
  esito(righe.length === 4 && righe.every(r => r.length > 40),
    'le quattro pastiglie hanno tutte una riga di spiegazione', righe.length + ' righe');
  const coal = A.PRESET.netanyahu.filter(i => A.SEG[i]);
  esito(coal.length > 0 && coal.every(i => righe[0].indexOf(A.nm(i)) >= 0),
    'P1 elenca TUTTE le liste che PRESET.netanyahu tiene con seggi, e le elenca da li: '+
    'cinque nomi scritti a mano sono la copia che l 8 settembre resta indietro',
    coal.map(i => A.nm(i)).join(', '));
  esito(righe[3].indexOf('fuori dai due campi') > 0,
    'P4 non dice «stallo» senza dire di CHI sono i seggi che mancano');
  esito(!/stallo/i.test(righe[3]),
    'e non usa la parola che nasconde il fatto');
  esito(/appoggio esterno|dall.esterno/.test(righe[2]),
    'P3 dice che non e una coalizione ma una CONDIZIONE: l appoggio puo essere esterno');
}

/* ══ 5 · LE DIDASCALIE DEGLI ISTOGRAMMI ═══════════════════════════════════════════
 * I tre casi sono esclusivi e ordinati dal più informativo al meno: dire «ne mancano 7»
 * quando la banda contiene 61 sarebbe vero e fuorviante. E la distanza si misura sulla
 * MEDIANA SIMULATA, che è la grandezza che l'istogramma disegna. */
{
  const arr = i => { const a = []; for (let k = 0; k < 1000; k++) a.push(i(k)); return a.sort((x,y)=>x-y); };
  const lontano = arr(k => 39 + (k % 3));            /* mediana 40: nessun blocco vero ci arriva, cosi la prova non coincide per caso con blocchi(SEG) */
  const stretto = arr(k => 60 + (k % 2));            /* mediana 60, a un seggio da 61 */
  const largo   = arr(k => 50 + Math.floor(k / 50)); /* banda 50-69, attraversa 61, mediana 59 */
  const c1 = A.codaIsto('coalizione', lontano, 40);
  const c2 = A.codaIsto('coalizione', stretto, 60);
  const c3 = A.codaIsto('coalizione', largo, 59);
  esito(/mancano/.test(c1) && c1.indexOf(A.seg(21)) > 0,
    'I3: lontano da 61 dice quanti ne mancano, e li conta dalla MEDIANA simulata', c1.trim());
  esito(/un solo seggio/.test(c2) && (c2.match(/%/g)||[]).length === 2,
    'I4: a ridosso di 61 da le DUE frequenze, che e il caso in cui l istogramma serve',
    c2.trim());
  esito(/comprende entrambi/.test(c3) && !/mancano/.test(c3),
    'I5: quando la banda attraversa 61 lo dice, e NON dice quanti ne mancano — sarebbe '+
    'vero e fuorviante', c3.trim());
  esito(!/scenario/.test(c1),
    'e senza swing ne affluenza non dichiara nessuno scenario');
  A.SW = 4; const c4 = A.codaIsto('coalizione', lontano, 40); A.SW = 0;
  esito(/scenario costruito/.test(c4) && /4,0 punti|4 punti/.test(c4),
    'I6: con lo swing acceso dichiara che quello NON e la proiezione', c4.slice(-90));
  A.AFF = -20; const c5 = A.codaIsto('coalizione', lontano, 40); A.AFF = 0;
  esito(/scenario costruito/.test(c5) && /affluenza/.test(c5),
    'e l affluenza fa lo stesso — AFF nasce a ZERO e non a null, quindi «diverso da null» '+
    'avrebbe dichiarato uno scenario sotto ogni istogramma', c5.slice(-90));
}

/* ══ 6 · IL SIMULATORE ════════════════════════════════════════════════════════════
 * È l'unico dei quattro blocchi in cui il lettore ha fatto qualcosa, e la frase deve
 * rispondere a lui. Non deve giudicare una coalizione plausibile — il modello conta i
 * seggi, i veti li dichiarano i partiti — e non deve contraddire la barra. */
{
  const sel = () => Object.keys(A.COAL).filter(i => A.COAL[i] && A.SEG[i]);
  const tot = () => sel().reduce((s,i) => s + A.SEG[i], 0);
  const g = () => testo('k-gnote');
  esito(tot() < 61 && /ne mancano/.test(g()) && /lista più grande/.test(g()),
    'S3: sotto 61 dice quanti ne mancano E da dove potrebbero arrivare — la seconda meta '+
    'e quella che il lettore userebbe per la mossa successiva', g().slice(0,150));
  {
    const fuori = A.IDS.filter(i => A.SEG[i] && !A.COAL[i]).sort((a,c) => A.SEG[c]-A.SEG[a]);
    esito(fuori.length > 0 && g().indexOf('ne ha ' + fuori.map(i=>A.SEG[i])[0]) > 0,
      'e quella lista e davvero la piu grande fra le NON selezionate, non una qualunque',
      A.nm(fuori[0]) + ' ' + A.SEG[fuori[0]]);
  }
  esito(/corrisponde alla composizione/.test(g()),
    'S6: quando la selezione e una scorciatoia, la composizione ha un nome');
  /* e il nome NON si ricalcola: si legge dal pulsante che il confronto degli insiemi ha
     acceso, o sarebbero due strade per la stessa domanda */
  {
    const b = D.querySelector('[data-pre][aria-pressed="true"]');
    esito(!!b && g().indexOf(b.textContent.replace(/\s+/g,' ').trim()) > 0,
      'e il nome e quello del pulsante acceso, non un secondo confronto degli insiemi');
  }
  /* S4 — il veto si prova ACCENDENDO lo stato: una prova su uno stato interattivo che non
     lo accende passa a vuoto e sembra verde. */
  {
    const prima = Object.keys(A.COAL).filter(i => A.COAL[i]);
    A.IDS.forEach(i => { delete A.COAL[i]; });
    A.COAL.likud = 1; A.COAL.yashar = 1;         /* Eisenkot esclude un governo Netanyahu */
    A.render();
    const v = testo('k-gnote');
    esito(/contraddice/.test(v) && /veto dichiarato|veti dichiarati/.test(v),
      'S4: la coalizione che viola un veto lo dichiara, e dice QUANTI sono', v.slice(0,140));
    esito(/resta valido come conteggio/.test(v),
      'e distingue il conteggio dalla praticabilita: il modello conta i seggi, i veti li '+
      'dichiarano i partiti');
    esito(/Eisenkot|Netanyahu/.test(v),
      'e la stringa del veto dice gia CHI lo pone e verso chi: non serviva niente di nuovo',
      v.slice(0,200));
    A.IDS.forEach(i => { delete A.COAL[i]; });
    prima.forEach(i => { A.COAL[i] = 1; });
    A.render();
  }
}

/* ══ 7 · IL PRIMO PARTITO ═════════════════════════════════════════════════════════
 * Non è una forma del titolo: le dodici forme sono una partizione sulla soglia dei 61, e
 * il primo partito è un'altra domanda. È una frase in k-verdetto, e la clausola dello
 * scarto compare solo a gara stretta. */
{
  const v = testo('k-verdetto');
  const pri = Object.keys(A.MC.primo).filter(k => A.MC.primo[k])
    .sort((a,b) => A.MC.primo[b] - A.MC.primo[a]);
  esito(pri.length > 1, 'premessa: la gara per il primo posto ha almeno due contendenti');
  const stretta = A.MC.primo[pri[0]] / A.MC.n < A.PRIMO_STRETTO;
  esito(stretta === /questione aperta/.test(v),
    'la clausola dello scarto compare SE E SOLO SE la gara e stretta: sopra la soglia il '+
    'primo posto non e una questione aperta e dirlo sarebbe rumore',
    'stretta ' + stretta + ' · clausola ' + /questione aperta/.test(v));
  /* I DUE RAMI SI ESERCITANO SU CASI COSTRUITI, o quello che l archivio non produce
     resta senza prova: oggi la gara e stretta, quindi il ramo «larga» non si vedrebbe mai
     e il mutante che fa comparire la clausola SEMPRE resterebbe vivo. */
  esito(A.frasePrimo(['a','b'], 0.90, 24, 20) === '',
    'a gara LARGA la clausola tace: sopra la soglia il primo posto non e una questione '+
    'aperta, e dirlo sarebbe rumore');
  esito(/questione aperta/.test(A.frasePrimo(['a','b'], 0.55, 24, 23)),
    'e a gara stretta compare');
  esito(A.frasePrimo(['a'], 0.55, 24, 0) === '',
    'e con un solo contendente tace: non c e nessuno da cui distanziarsi');
  esito(A.frasePrimo(['a','b'], 0.55, 23, 23).indexOf('appaiate a') > 0 &&
        !/di scarto/.test(A.frasePrimo(['a','b'], 0.55, 23, 23)),
    'e a PARI di seggi non nomina nessuno scarto: non c e ordine da invertire, e il capo '+
    'della proiezione non e nemmeno definito');
  esito(A.frasePrimo(['a','b'], 0.55, 24, 23).indexOf(A.seg(1)+' di scarto') > 0 &&
        A.frasePrimo(['a','b'], 0.55, 25, 22).indexOf(A.seg(2)+' di scarto') > 0,
    'e il numero segue la formula: uno scarto di 1 si chiude con 1 seggio, uno di 3 con 2');
  if (stretta) {
    const s1 = A.SEG[pri[0]]||0, s2 = A.SEG[pri[1]]||0;
    esito(s1 === s2
        ? /appaiate a/.test(v)
        : v.indexOf(A.seg(Math.ceil((Math.abs(s1-s2)+1)/2)) + ' di scarto') > 0,
      'e il numero e quello della formula, oppure il ramo del PARI: a parita di seggi non '+
      'c e nessun ordine da invertire, e «il capo della proiezione» non e nemmeno definito',
      s1 + ' contro ' + s2);
  }
  /* LA CLAUSOLA CHE DICHIARA LE DUE LETTURE, e il verso che conta e' che TACCIA quando
     concordano: una nota che compare sempre non distingue niente. */
  const capoSeg = A.IDS.filter(i => A.SEG[i]).sort((a,c) => A.SEG[c]-A.SEG[a])[0];
  const discordi = capoSeg !== pri[0] && A.SEG[capoSeg] !== A.SEG[pri[0]];
  esito(discordi === /due domande diverse/.test(v),
    'e la clausola sulle due letture compare SE E SOLO SE discordano: le simulazioni e la '+
    'proiezione rispondono a due domande, e dichiararlo quando dicono la stessa cosa '+
    'sarebbe rumore', 'discordi ' + discordi);
  esito(!/ribalta/.test(v),
    'e k-verdetto NON dichiara la coppia di k-analisi: quella la dichiara k-analisi, e '+
    'ripeterla qui sarebbe la stessa frase in due posti');
}


/* ══ 8 · LE CAUSE SI SOMMANO, E RESTANO DISTINGUIBILI ═════════════════════════════
 * Il 31 agosto 2026 in pagina si applicano tutte e due: Popolo d'Israele ha attraversato
 * la soglia E la leva instrada i suoi seggi nel blocco Netanyahu. Mostrarne una sola
 * lascerebbe credere che il movimento sia interamente un'ipotesi, mentre metà è un fatto. */
{
  const sola = A.clausolaDirezione({leva:true});
  const fatto = A.clausolaDirezione({entrata:'likud', b_entrata:5});
  const due = A.clausolaDirezione({entrata:'likud', b_entrata:5, leva:true});
  esito(due.indexOf(fatto) === 0,
    'con tutte e due, il FATTO viene per primo: l attraversamento e quello che e successo, '+
    'la leva e dove quei seggi vengono contati', due.slice(0,60));
  esito(due.length > fatto.length && /ipotesi che il conteggio applica/.test(due),
    'e la leva non si perde: si aggiunge in coda invece di essere sostituita');
  esito(/^Parte di questo/.test(sola) && /E parte di questo/.test(due),
    'e i due rami restano distinguibili: da sola la leva comincia da capo, dietro un fatto '+
    'si lega con la congiunzione', sola.slice(0,20) + ' | ' + due.slice(-70,-40));
  const cad = A.clausolaDirezione({uscita:'likud', leva:true});
  esito(cad.indexOf('scesa sotto') > 0 && cad.indexOf('scesa sotto') < cad.indexOf('ipotesi'),
    'e vale anche per la caduta sotto soglia: e un elenco di cause presenti, non una catena');
  /* LA LUNGHEZZA, misurata: la clausola sta in coda a V2 o V3, che sono gia' due periodi.
     Il tetto non e' un numero scelto — e' il testo che il riquadro portava prima di questa
     riparazione, e la clausola doppia non deve raddoppiarlo. */
  const conDue = A.fraseDirezione(con({b:B(56,52,12,0), entrata:'likud', b_entrata:5, leva:true}));
  const senza  = A.fraseDirezione(con({b:B(56,52,12,0)}));
  esito(conDue.length < senza.length * 2.6,
    'e la frase con tutte e due le cause non raddoppia il riquadro',
    senza.length + ' → ' + conDue.length + ' caratteri');
}
console.log('\nprosa: ' + ok + '/' + (ok + ko));
if (ko) process.exit(1);
