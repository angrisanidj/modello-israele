/* LA NOTA DELLA SOGLIA, e la frase che diceva il falso.
 *
 * Fino al 30 agosto 2026 #k-soglianota affermava che una lista sotto soglia «disperde i
 * propri voti e li consegna di fatto ai partiti più grandi dello stesso campo». La metà sui
 * «più grandi» regge — i divisori successivi sono quasi sempre di liste maggiori — quella
 * sul campo no: misurato sull'archivio pubblicato, facendo cadere sotto soglia ciascuna
 * delle dodici liste che la superano, in ZERO casi su dodici i seggi restano tutti nel
 * campo. La frase era vera del 2022, che infatti citava, e falsa della proiezione che le
 * stava sopra — cioè affermava una cosa che i numeri due centimetri più su smentivano.
 *
 * Qui si prova la MECCANICA e non i numeri di oggi: che il controfattuale conservi i seggi,
 * che la frase generata dica quello che il controfattuale ha calcolato, e che l'accordo
 * grammaticale non dipenda da niente che il codice non conosca. I numeri cambiano a ogni
 * rilevazione, ed è precisamente per questo che la frase si genera invece di essere scritta.
 */
const {JSDOM} = require('jsdom');
const fs = require('fs');

let ok = 0, ko = 0;
function esito(cond, desc, dettaglio){
  if (cond) { ok++; console.log('OK ' + desc); }
  else { ko++; console.log('KO ' + desc + (dettaglio ? ' — ' + dettaglio : '')); }
}
const parola = (t, n) => (' ' + t + ' ').indexOf(' ' + n + ' ') >= 0;

const HTML = fs.readFileSync(__dirname + '/../../index.html','utf8');
const dom = new JSDOM('<!doctype html><html><body><div id="kn26"></div></body></html>', {pretendToBeVisual:true});
const W = dom.window, D = W.document;
global.DOMParser = W.DOMParser;
D.body.innerHTML = HTML.replace(/<script>[\s\S]*?<\/script>/g,'').match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
global.document = D; global.window = W;
W.matchMedia = () => ({matches:false, addEventListener(){}, addListener(){}});
W.IntersectionObserver = class { observe(){} unobserve(){} disconnect(){} };
global.IntersectionObserver = W.IntersectionObserver;
W.requestAnimationFrame = f => f();
W.Element.prototype.scrollIntoView = function(){};
Object.defineProperty(W,'localStorage',{value:{getItem:()=>null,setItem(){},removeItem(){}},configurable:true});
global.getComputedStyle = () => ({getPropertyValue:()=>''});
global.Blob = function(){}; global.URL = {createObjectURL(){return '';},revokeObjectURL(){}};
global.FileReader = function(){}; global.fetch = () => Promise.reject(0);

let src = fs.readFileSync(__dirname + '/../app.js','utf8');
src = src.slice(0, src.indexOf('carica().then(render,render)')) +
  'global.A={seSotto:seSotto,clausolaSoglia:clausolaSoglia,fraseSoglia:fraseSoglia,' +
  'frazione:frazione,FRAZ:FRAZ,' +
  'aRischio:aRischio,QUO:function(){return QUO;},SEG:function(){return SEG;},SOGLIA:SOGLIA,' +
  'bloccoDi:bloccoDi,nmA:nmA,nm:nm,render:render,IDS:IDS,dhondt:dhondt,' +
  'listeClausola:listeClausola,CLAUSOLA_MIN:CLAUSOLA_MIN,' +
  'ripartoSenza:ripartoSenza,listeSulFilo:listeSulFilo,chiGoverna:chiGoverna,' +
  'combinazioniSoglia:combinazioniSoglia,codaSomme:codaSomme,P:P,' +
  'fraseCombinazioni:fraseCombinazioni,fraseScenarioSoglia:fraseScenarioSoglia,' +
  'segnoDipendeDaIpotesi:segnoDipendeDaIpotesi,fraseBanda:fraseBanda,setPAR:function(k,v){PAR[k]=v;},PAR:function(){return PAR;}};})();';
eval(src);
const A = global.A;
A.render();

const testo = (D.getElementById('k-soglianota') || {textContent:''})
  .textContent.replace(/\s+/g,' ').trim();

/* 1 · LA FRASE FALSA NON C E PIU, e non si cerca la stringa vecchia: si cerca la
      PROPRIETA che la rendeva falsa, cioe che la nota affermi che i seggi restano nel
      campo di chi cade. Cercare «dello stesso campo» passerebbe alla prima riscrittura
      che dice la stessa cosa con altre parole. */
esito(testo.length > 0, 'la nota della soglia viene scritta', testo.slice(0, 60));
/* SI GUARDA TUTTA LA PAGINA, non la sola nota. La stessa affermazione era scritta DUE
   volte — in #k-soglianota e nel testo dell analisi — e tutte e due dicevano il falso nello
   stesso modo: riparandone una sola sarebbe rimasta l altra, in un riquadro diverso, a dire
   che i seggi finiscono alle liste piu grandi dello stesso campo. Una prova puntata su un
   id solo avrebbe dichiarato chiusa una cosa chiusa a meta. */
const pagina = D.getElementById('kn26').textContent.replace(/s+/g,' ');
esito(!/(consegna|vanno|finiscono|restano|disperdono)[^.]{0,80}stesso campo/i.test(pagina),
  'e NESSUN punto della pagina afferma che i seggi di chi cade restino nel suo stesso campo',
  (pagina.match(/[^.]{0,80}stesso campo/i)||[''])[0]);

/* 2 · LA MECCANICA STA FUORI DAL RAMO. Vale sempre, con liste sul filo o senza: prima
      stava DENTRO il ramo delle liste a rischio, quindi il lettore la incontrava solo
      quando cera qualcuno da nominare, e nellaltro caso la nota diceva che nessuno
      rischia senza dire che cosa succederebbe se qualcuno rischiasse. Si prova nel
      SORGENTE perche il ramo vuoto non e raggiungibile a comando: aRischio() dipende
      dal Monte Carlo. */
const sorgente = fs.readFileSync(__dirname + '/../app.js','utf8');
const iRamo = sorgente.indexOf("nessuna presenta un rischio elevato di esclusione.')");
const iMecc = sorgente.indexOf('Una lista che resta sotto il 3,25% non elegge nessuno');
esito(iRamo > 0 && iMecc > iRamo,
  'e la meccanica sta FUORI dal ramo delle liste a rischio: vale anche quando non ne rischia nessuna',
  'ramo a ' + iRamo + ', meccanica a ' + iMecc);
esito(sorgente.split('non solo fra quelle del suo campo').length - 1 === 1,
  'e la frase nasce UNA VOLTA SOLA: due copie corrette oggi divergono domani',
  sorgente.split('non solo fra quelle del suo campo').length - 1 + ' occorrenze');
esito(/si ridistribuiscono fra tutte le liste rimaste/.test(testo),
  'e la nota la dice al lettore, non solo al sorgente');

/* 3 · IL CONTROFATTUALE CONSERVA I SEGGI, ed e la forma matematica di «si
      ridistribuiscono fra tutte le liste rimaste». Sotto d Hondt togliere una lista puo
      solo far salire le altre, mai scendere: quindi i seggi che perde sono esattamente
      quelli che gli altri guadagnano. Se un giorno non tornasse vorrebbe dire che
      qualcuno PERDE seggi quando un concorrente sparisce, e allora la frase della nota
      sarebbe da riscrivere. */
const QUO = A.QUO(), sopra = Object.keys(QUO).filter(k => QUO[k] >= A.SOGLIA);
esito(sopra.length > 2, 'ci sono liste sopra soglia su cui provare', sopra.length + ' liste');
const nonConserva = sopra.filter(id => {
  const s = A.seSotto(id);
  return s.dentro + s.fuori !== s.persi;
});
esito(nonConserva.length === 0,
  'il controfattuale conserva i seggi: quelli persi sono esattamente quelli redistribuiti',
  nonConserva.map(id => {
    const s = A.seSotto(id);
    return A.nm(id) + ' ' + s.dentro + '+' + s.fuori + ' invece di ' + s.persi;
  }).join(' · '));

/* 4 · LA FRASE DICE QUELLO CHE IL CONTROFATTUALE HA CALCOLATO. Si rifa il conto e si
      guarda che i numeri della clausola siano quelli: una clausola che dicesse un numero
      suo sarebbe la strada doppia di sempre. */
const scordate = sopra.filter(id => {
  const s = A.seSotto(id), c = A.clausolaSoglia(id);
  if (!s.persi) return false;
  if (!c) return true;
  /* col ramo dei due campi la parola «tutti» non c e: quello che deve esserci sempre e il
     NUMERO dei seggi, che e il dato. */
  if (!s.dentro) return !parola(c, String(s.persi)) ||
    (c.indexOf('tutti') < 0 && c.indexOf('in uno dei due campi') < 0);
  const fr = A.frazione(s.fuori, s.persi);
  if (fr) return c.indexOf(fr) < 0;
  return !parola(c, String(s.fuori)) || !parola(c, String(s.persi));
});
esito(scordate.length === 0,
  'e la clausola porta i numeri che il controfattuale ha calcolato, per ogni lista',
  scordate.map(id => A.nm(id) + ': ' + A.clausolaSoglia(id)).join(' · '));

/* 5 · L ACCORDO NON DIPENDE DAL NOME DELLA LISTA, ed e il difetto trovato scrivendo.
      La prima stesura diceva «i seggi che X perderebbe»: il soggetto della relativa e il
      NOME, e su «i Democratici» usciva «i Democratici perderebbe». Il numero grammaticale
      di un nome di lista non e ricavabile da niente che il codice conosca, quindi la
      forma buona e quella in cui non ce niente da indovinare: il soggetto sono i SEGGI
      e la lista e un complemento che passa da nmA(id, di). */
const conRelativa = sopra.filter(id => /perderebbe/.test(A.clausolaSoglia(id) || ''));
esito(conRelativa.length === 0,
  'nessuna clausola fa concordare un verbo col NOME della lista',
  conRelativa.map(id => A.clausolaSoglia(id)).join(' · '));
const senzaNmA = sopra.filter(id => {
  const c = A.clausolaSoglia(id);
  return c && c.indexOf(A.nmA(id, 'di')) < 0;
});
esito(senzaNmA.length === 0,
  'e la lista entra dalla preposizione dichiarata, non da un «di» scritto a mano',
  senzaNmA.map(id => A.nm(id) + ': ' + A.clausolaSoglia(id)).join(' · '));

/* 6 · LA FRAZIONE, sui casi costruiti: risponde solo dove la parola esiste, e il numero
      grammaticale sta nella tabella accanto alla parola invece di essere dedotto. */
const casi = [[1,2,'metà'], [1,3,'un terzo'], [2,3,'due terzi'], [1,4,'un quarto'],
              [3,4,'tre quarti'], [5,12,null], [0,4,null], [4,4,null], [5,4,null], [2,0,null]];
const fraKO = casi.filter(c => A.frazione(c[0], c[1]) !== c[2]);
esito(fraKO.length === 0, 'frazione() risponde solo dove la parola esiste',
  fraKO.map(c => c[0] + ' su ' + c[1] + ' dà ' + A.frazione(c[0], c[1])).join(' · '));
esito(A.FRAZ['metà'] === 0 && A.FRAZ['due terzi'] === 1,
  'e ogni frazione porta il proprio numero grammaticale',
  JSON.stringify(A.FRAZ));
const senzaNumero = Object.keys(A.FRAZ).filter(w => A.FRAZ[w] !== 0 && A.FRAZ[w] !== 1);
esito(senzaNumero.length === 0,
  'e nessuna frazione e dichiarata senza numero grammaticale', senzaNumero.join(', '));

/* 7 · E LA NOTA NON PARLA DI LISTE CHE NON HA PRESENTATO. La clausola nomina le liste
      che il periodo prima ha gia dichiarato sul filo, e nessunaltra: e la conseguenza di
      quel rischio, non un elenco a se. */
const rischio = A.aRischio();
const nominateFuori = A.IDS.filter(id =>
  rischio.indexOf(id) < 0 && A.SEG()[id] &&
  testo.indexOf('seggi ' + A.nmA(id, 'di')) >= 0);
esito(nominateFuori.length === 0,
  'e la clausola non nomina liste che la nota non ha dichiarato sul filo',
  nominateFuori.map(A.nm).join(', '));


/* 8 · LA FRASE SI PROVA SU CASI COSTRUITI, uno per ramo, perche il seme non li esercita.
 *     In jsdom il fetch non parte e il banco gira su BASE, dove NESSUN rapporto e una
 *     frazione con un nome — 7/23, 5/13, 2/5, 3/8, 2/7, 4/10, 1/8 danno tutti null. Il ramo
 *     della frazione era percio IRRAGGIUNGIBILE, e un mutante che ci rimetteva la relativa
 *     sbagliata restava VIVO: la prova diceva verde su un ramo che non aveva mai eseguito.
 *     E la classe gia registrata — un mutante invisibile perche i dati non lo esercitano
 *     mai — e si chiude separando la composizione dal conto. */
const UNO = sopra[0];
const forme = [
  [{persi:4, dentro:4, fuori:0}, /resterebbero nel suo campo/, 'nessuno esce'],
  [{persi:5, dentro:0, fuori:5}, /uscirebbero tutti dal suo campo/, 'escono tutti'],
  [{persi:4, dentro:2, fuori:2}, /^metà dei seggi .* uscirebbe dal suo campo$/, 'metà, verbo singolare'],
  [{persi:3, dentro:1, fuori:2}, /^due terzi dei seggi .* uscirebbero dal suo campo$/, 'due terzi, verbo plurale'],
  [{persi:12, dentro:7, fuori:5}, /^5 dei 12 seggi .* uscirebbero dal suo campo$/, 'rapporto in cifre']
];
const formeKO = forme.filter(c => !c[1].test(A.fraseSoglia(UNO, c[0])));
esito(formeKO.length === 0,
  'ogni ramo della frase esce nella forma giusta, su casi costruiti',
  formeKO.map(c => c[2] + ': ' + A.fraseSoglia(UNO, c[0])).join(' · '));
/* e il verbo NON e sempre lo stesso: un mutante che scrive «uscirebbero» dappertutto
   passerebbe qualunque asserzione scritta su un ramo solo. */
esito(/ uscirebbe /.test(A.fraseSoglia(UNO,{persi:4,dentro:2,fuori:2})) &&
      / uscirebbero /.test(A.fraseSoglia(UNO,{persi:3,dentro:1,fuori:2})),
  'e le due forme del verbo escono davvero tutte e due, secondo la frazione',
  A.fraseSoglia(UNO,{persi:4,dentro:2,fuori:2}) + ' | ' + A.fraseSoglia(UNO,{persi:3,dentro:1,fuori:2}));
const relKO = forme.filter(c => /perderebbe/.test(A.fraseSoglia(UNO, c[0])));
esito(relKO.length === 0, 'e nessuna forma rimette la relativa che concorda col nome',
  relKO.map(c => A.fraseSoglia(UNO, c[0])).join(' · '));

/* 9 · E LA CLAUSOLA FINISCE DAVVERO NELLA NOTA. Senza questa, togliere il pezzo che la
 *     concatena lascerebbe tutto verde: le asserzioni di sopra provano la funzione, non la
 *     pagina. */
const atteseNota = A.listeClausola().map(A.clausolaSoglia).filter(Boolean);
esito(atteseNota.length === 0 || atteseNota.every(c => testo.indexOf(c) >= 0),
  'e la clausola generata compare NELLA NOTA, non solo nella funzione',
  atteseNota.filter(c => testo.indexOf(c) < 0).join(' · ') || 'nessuna lista sul filo');

/* 10 · NESSUNA LISTA PERDE SEGGI QUANDO UN CONCORRENTE SPARISCE. E il fatto su cui poggia
 *      la conservazione: sotto d Hondt togliere una lista puo solo far salire le altre. Se
 *      un giorno non valesse, dentro+fuori resterebbe uguale a persi per compensazione e
 *      l asserzione 3 non se ne accorgerebbe. */
const chiPerde = [];
sopra.forEach(id => {
  const q = {}; Object.keys(QUO).forEach(k => q[k] = QUO[k]);
  q[id] = A.SOGLIA - 0.01;
  const dopo = A.dhondt(q), prima = A.SEG();
  Object.keys(prima).forEach(k => {
    if (k !== id && (dopo[k] || 0) < (prima[k] || 0)) chiPerde.push(A.nm(k) + ' quando cade ' + A.nm(id));
  });
});
esito(chiPerde.length === 0,
  'e nessuna lista PERDE seggi quando un concorrente scende sotto soglia',
  chiPerde.slice(0,3).join(' · '));


/* 11 · IL LEGAME SI PROVA NEL SORGENTE, perche sul seme non e' esercitabile.
 *      In jsdom il banco gira su BASE e aRischio() puo' restituire una lista vuota: allora
 *      l asserzione 9 non ha niente da confrontare e resta verde qualunque cosa faccia la
 *      pagina — infatti il mutante che TOGLIE la concatenazione della clausola dalla nota
 *      restava VIVO. E' la stessa forma dell asserzione 8: un ramo che i dati non
 *      accendono. Qui non si puo' separare una funzione pura, perche' quello che manca e'
 *      una concatenazione: si guarda dove sta, come per og:title col job.
 *      E si guarda anche che la meccanica NON sia dentro un ramo: fra la chiusura del
 *      ternario e la frase non deve comparire «risk», o la spiegazione tornerebbe a
 *      vedersi solo quando c e' qualcuno da nominare. */
esito(typeof A.fraseSoglia === 'function',
  'la composizione della frase e una funzione a se, esercitabile senza dati');
const iChiude = sorgente.indexOf("di esclusione.')");
const iClaus = sorgente.indexOf("cl.join(', e ')");
esito(iClaus > 0 && iClaus > iChiude,
  'la nota concatena DAVVERO la clausola generata: senza, la funzione sarebbe provata e la pagina no',
  'concatenazione a ' + iClaus);
const fraDueA = sorgente.slice(iChiude, iMecc);
esito(iChiude > 0 && iMecc > iChiude && fraDueA.indexOf('risk') < 0,
  'e fra la chiusura del ramo e la meccanica non c e nessun risk: la spiegazione non e condizionata',
  fraDueA.replace(/\s+/g, ' ').slice(0, 100));


/* 12 · CHI ENTRA NELLA CLAUSOLA: le liste sul filo, piu' quelle fuori dai due campi che
 *      hanno seggi. La seconda categoria e' il caso in cui la meccanica si vede meglio,
 *      perche' i seggi attraversano TUTTI — una lista che non sta con nessuno dei due campi
 *      non ha un campo in cui restare. La regola si RIDERIVA qui e si confronta: scrivere
 *      l elenco atteso sarebbe ricopiare la selezione invece di provarla. */
const attesa = A.aRischio().slice();
A.IDS.forEach(id => {
  if (A.bloccoDi(id) !== 'incerto') return;
  if ((A.SEG()[id] || 0) < A.CLAUSOLA_MIN) return;
  if (attesa.indexOf(id) < 0) attesa.push(id);
});
esito(A.listeClausola().slice().sort().join(',') === attesa.slice().sort().join(','),
  'la clausola nomina le liste sul filo piu quelle fuori dai due campi con abbastanza seggi',
  A.listeClausola().map(A.nm).join(', ') + ' invece di ' + attesa.map(A.nm).join(', '));

/* e le due esclusioni che l autore ha chiesto di verificare, una per volta */
const senzaSeggi = A.IDS.filter(id => A.bloccoDi(id) === 'incerto' && !(A.SEG()[id] || 0));
esito(senzaSeggi.length === 0 || senzaSeggi.every(id => A.listeClausola().indexOf(id) < 0),
  'e una lista fuori dai due campi SENZA seggi non compare mai',
  senzaSeggi.map(A.nm).join(', ') + ' (' + senzaSeggi.length + ' liste a zero seggi)');
esito(senzaSeggi.length > 0,
  'e il caso a zero seggi esiste davvero nei dati, quindi l esclusione e esercitata',
  senzaSeggi.length + ' liste fuori dai due campi senza seggi');
/* IL PAVIMENTO E' UNA DECISIONE, e sta scritta: con un seggio solo la frase direbbe che un
   seggio si sposta, che e' vero di qualunque lista e non illustra niente. Oggi nessuna lista
   fuori dai due campi ne ha esattamente uno, quindi il pavimento non e' esercitato dai dati:
   quello che si prova e' che ci sia e quanto valga. */
esito(A.CLAUSOLA_MIN >= 2,
  'e il pavimento della seconda categoria e almeno due seggi: con uno la frase sarebbe banale',
  'CLAUSOLA_MIN = ' + A.CLAUSOLA_MIN);

/* 13 · LA FRASE PER CHI UN CAMPO NON CE L HA. Una lista fuori dai due campi non ha un campo
 *      da cui uscire, quindi la frase dice dove i seggi VANNO. Vale solo se ci vanno tutti:
 *      se una parte finisse alle liste arabe sarebbe falsa, e si torna a quella generale. */
const AGO = A.IDS.filter(id => A.bloccoDi(id) === 'incerto')[0];
esito(!!AGO, 'c e una lista fuori dai due campi su cui provare la forma', AGO || 'nessuna');
esito(/entrerebbero in uno dei due campi$/.test(A.fraseSoglia(AGO, {persi:5, dentro:0, fuori:5, campi:5})),
  'i seggi di una lista fuori dai due campi entrano nei due campi, non escono dal suo',
  A.fraseSoglia(AGO, {persi:5, dentro:0, fuori:5, campi:5}));
esito(/uscirebbero tutti dal suo campo$/.test(A.fraseSoglia(AGO, {persi:5, dentro:0, fuori:5, campi:3})),
  'e se NON ci vanno tutti si torna alla frase generale, che resta vera',
  A.fraseSoglia(AGO, {persi:5, dentro:0, fuori:5, campi:3}));
esito(!/entrerebbero in uno dei due campi/.test(A.fraseSoglia(UNO, {persi:5, dentro:0, fuori:5, campi:5})),
  'e la forma non tocca le liste che un campo ce l hanno',
  A.fraseSoglia(UNO, {persi:5, dentro:0, fuori:5, campi:5}));

/* 14 · UN SEGGIO SOLO NON PRODUCE «i 1 seggio». La prima stesura componeva sempre al
 *      plurale, e col pavimento a due il caso non si vede mai dalla nota — ma fraseSoglia()
 *      e' pubblica e totale, e una funzione che sbaglia dove non la si guarda sbaglia
 *      comunque. */
const singolari = [{persi:1, dentro:0, fuori:1, campi:1}, {persi:1, dentro:1, fuori:0, campi:0}];
const singKO = singolari.filter(s => {
  const t = A.fraseSoglia(UNO, s) + ' ' + A.fraseSoglia(AGO, s);
  return / 1 seggio/.test(t) || /seggio .*(uscirebbero|resterebbero|entrerebbero)/.test(t);
});
esito(singKO.length === 0, 'con un seggio solo la frase resta al singolare',
  singolari.map(s => A.fraseSoglia(UNO, s)).join(' · '));


/* ══ 15 · LO SCENARIO DELLA SOGLIA: LE COMBINAZIONI ═══════════════════════════════════
 * clausolaSoglia() risponde a «dove vanno i seggi di QUESTA lista». Lo scenario risponde a
 * «e se cadessero insieme, cambia chi puo' governare?», e non e' la somma delle risposte di
 * prima: a ogni caduta i divisori si riassestano da capo.
 * NIENTE E' SCRITTO SULL'ARCHIVIO DEL GIORNO. Oggi il verdetto e' lo stesso in tutte le
 * combinazioni, quindi una prova scritta sui numeri di oggi eserciterebbe un ramo su due e
 * sarebbe verde per assenza del caso — la forma contro cui questo progetto mette in
 * guardia. Il ramo che AVVERTE si prova su combinazioni costruite. */
const QUOTE = A.QUO(), segOra = A.SEG();
const SRC = fs.readFileSync(__dirname + '/../../index.html','utf8');

/* 15.1 · UNA STRADA SOLA PER IL CONTROFATTUALE. seSotto() e le combinazioni facevano lo
 *        stesso mestiere in due posti: la copia delle quote e l'esclusione. Il legame si
 *        prova nel SORGENTE, perche' due strade che oggi concordano sono precisamente la
 *        condizione in cui la divergenza non si vede. */
const corpoSeSotto = SRC.slice(SRC.indexOf('function seSotto(id){'),
                               SRC.indexOf('function seSotto(id){') + 400);
esito(corpoSeSotto.indexOf('ripartoSenza([id])') >= 0 && corpoSeSotto.indexOf('dhondt(') < 0,
  'seSotto passa da ripartoSenza: una strada sola per il controfattuale',
  corpoSeSotto.split('\n')[1]);

/* 15.2 · ripartoSenza([]) NON E' UN CASO DEGENERE: e' la configurazione di oggi, ed e' il
 *        primo elemento di ogni elenco di combinazioni. Se divergesse da SEG, tutti i
 *        confronti dello scenario partirebbero da un termine sbagliato. */
const oggiRip = A.ripartoSenza([]);
const divRip = A.IDS.filter(i => (oggiRip[i]||0) !== (segOra[i]||0));
esito(divRip.length === 0, 'ripartoSenza([]) riproduce esattamente il riparto di oggi',
  divRip.map(i => A.nm(i)).join(', ') || 'nessuna divergenza');

/* 15.3 · e con una lista dentro, quella esce e i 120 restano 120. */
const vittima = A.IDS.filter(i => (segOra[i]||0) > 0)[0];
const senzaV = A.ripartoSenza([vittima]);
const tot = A.IDS.reduce((s,i) => s + (senzaV[i]||0), 0);
esito((senzaV[vittima]||0) === 0 && tot === 120,
  'ripartoSenza(x) esclude x e i seggi restano 120', A.nm(vittima) + ' -> ' + tot);

/* 16 · CHI ARRIVA A 61, e l'ORDINE delle risposte. Un campo da solo viene prima della somma
 *      con i partiti arabi, o «opposizione» e «opposizione + arabi» sarebbero
 *      indistinguibili PROPRIO nel caso in cui l'opposizione ce la fa senza. */
const casiGov = [
  [{coalizione:61, opposizione:40, arabo:10, incerto:9}, 'coalizione'],
  [{coalizione:40, opposizione:61, arabo:10, incerto:9}, 'opposizione'],
  [{coalizione:50, opposizione:55, arabo:10, incerto:5}, 'oppoarabi'],
  [{coalizione:50, opposizione:50, arabo:5,  incerto:15}, 'stallo'],
  [{coalizione:30, opposizione:62, arabo:12, incerto:16}, 'opposizione'],
];
const govKO = casiGov.filter(c => A.chiGoverna(c[0]) !== c[1]);
esito(govKO.length === 0, 'chiGoverna risponde nei quattro casi, e nell ordine giusto',
  govKO.map(c => JSON.stringify(c[0]) + ' -> ' + A.chiGoverna(c[0])).join(' | ') || 'tutti');

/* 17 · LE COMBINAZIONI SONO 2^N e la prima e' oggi. Con una lista sono DUE, non quattro: il
 *      caso a una lista non e' un limite, e' quello di oggi. */
[[], [vittima]].forEach(fl => {
  const c = A.combinazioniSoglia(fl);
  esito(c.length === (1 << fl.length) && c[0].fuori.length === 0,
    'combinazioniSoglia(' + fl.length + ') ne da ' + (1 << fl.length) + ', e la prima e oggi',
    c.map(x => '[' + x.fuori.join(',') + ']').join(' '));
});

/* 18 · LA CODA DELLE SOMME, tre rami. «fra 68 e 68» sarebbe un intervallo che non e' un
 *      intervallo: quando gli estremi coincidono si dice il numero. */
const codaCasi = [
  [[68], 'e 68 se restasse fuori'],
  [[68,68,68], 'e 68 in tutte le altre combinazioni'],
  [[68,70,72], 'e fra 68 e 72 nelle altre combinazioni'],
];
const codaKO = codaCasi.filter(c => A.codaSomme([vittima], c[0]).indexOf(c[1]) < 0);
esito(codaKO.length === 0, 'codaSomme distingue i tre rami',
  codaCasi.map(c => A.codaSomme([vittima], c[0]).trim()).join(' · '));
esito(A.codaSomme([vittima], []) === '', 'e senza altre combinazioni non dice niente',
  JSON.stringify(A.codaSomme([vittima], [])));

/* 19 · IL RAMO CHE AVVERTE, che nessun archivio di oggi esercita.
 *      «Quello che cambia e' il margine, non chi governa» e' vero oggi ED E' LA COSA PIU'
 *      FACILE DA SCRIVERE PER SEMPRE. Se la frase non sapesse dire il contrario sarebbe una
 *      decorazione, e continuerebbe a rassicurare il giorno in cui una combinazione ribalta
 *      il verdetto. Qui il verdetto si ribalta su combinazioni costruite. */
const B_OGGI = {coalizione:50, opposizione:55, arabo:11, incerto:4};
const B_RIB  = {coalizione:62, opposizione:48, arabo:6,  incerto:4};
const combUguali = [
  {fuori:[], b:B_OGGI, gov:'oppoarabi', somma:66},
  {fuori:[vittima], b:B_OGGI, gov:'oppoarabi', somma:68},
];
const combRibalta = [
  {fuori:[], b:B_OGGI, gov:'oppoarabi', somma:66},
  {fuori:[vittima], b:B_RIB, gov:'coalizione', somma:54},
];
const tUg = A.fraseCombinazioni([vittima], combUguali, null);
const tRi = A.fraseCombinazioni([vittima], combRibalta, null);
esito(tUg.indexOf('cambia è il margine, non chi governa') >= 0 &&
      tUg.indexOf('non è la stessa in tutte le combinazioni') < 0,
  'a verdetto uguale la frase dice che cambia il margine', tUg.trim());
esito(tRi.indexOf('non è la stessa in tutte le combinazioni') >= 0 &&
      tRi.indexOf('cambia è il margine, non chi governa') < 0 &&
      tRi.indexOf(A.nm(vittima)) >= 0,
  'e quando una combinazione lo ribalta la frase lo dice, e nomina quale', tRi.trim());

/* 19-bis · e se in quella combinazione non governa nessuno, non si inventa un vincitore. */
const combStallo = [
  {fuori:[], b:B_OGGI, gov:'oppoarabi', somma:66},
  {fuori:[vittima], b:{coalizione:50,opposizione:50,arabo:5,incerto:15}, gov:'stallo', somma:55},
];
esito(A.fraseCombinazioni([vittima], combStallo, null)
        .indexOf('nessuna maggioranza sarebbe possibile') >= 0,
  'e se in una combinazione non governa nessuno, lo dice invece di tacere',
  A.fraseCombinazioni([vittima], combStallo, null).trim());

/* 20 · LA CLAUSOLA DEL SEGNO parla solo quando i due segni DIVERGONO davvero. E' la regola
 *      di ipotesiNeiNumeri(): un'ipotesi che non sposta niente non si dichiara, o si insegna
 *      a saltare la riga proprio prima del giorno in cui conta. */
const sgTutte = A.IDS.map(i => A.segnoDipendeDaIpotesi(i)).filter(Boolean);
const sgKO = sgTutte.filter(s => !((s.leva < 0 && s.fonte > 0) || (s.leva > 0 && s.fonte < 0)));
esito(sgKO.length === 0, 'segnoDipendeDaIpotesi parla solo se i due segni divergono',
  sgTutte.map(s => s.id + ' leva ' + s.leva + ' fonte ' + s.fonte).join(' | ') || 'nessuna oggi');
const nonRiclass = A.IDS.filter(i => A.bloccoDi(i) === A.P[i].b);
esito(nonRiclass.every(i => A.segnoDipendeDaIpotesi(i) === null),
  'e tace su ogni lista che la leva non riclassifica', nonRiclass.length + ' liste');

/* 20-bis · la frase segue il segno invece di dare i verbi per scontati: il caso rovesciato —
 *          la leva che fa GUADAGNARE e la fonte che fa PERDERE — non esiste oggi e la
 *          composizione deve reggerlo comunque. */
const sgFinto = {id:vittima, seggi:5, blocco:'blocco Netanyahu', leva:2, fonte:-3};
const tSg = A.fraseCombinazioni([vittima], combUguali, sgFinto);
esito(tSg.indexOf('il blocco ne guadagna 2;') >= 0 && /ne perde 3\.$/.test(tSg.trim()),
  'la clausola del segno segue i segni invece di scriverli a mano',
  tSg.slice(tSg.indexOf('Se a restare fuori')).trim());

/* 21 · IL FILO NON E' RICOPIATO NELLA PROVA. Il mezzo punto e' la costante che decide se
 *      questa prova morde: scriverlo qui vorrebbe dire che un mutante che lo porta a zero —
 *      cioe' che spegne lo scenario — resterebbe verde. Si legge dal sorgente. */
const mFilo = SRC.match(/var FILO_SOGLIA=([0-9.]+);/);
esito(!!mFilo && parseFloat(mFilo[1]) > 0, 'FILO_SOGLIA e dichiarata e non e zero',
  mFilo ? mFilo[1] : 'assente');
const soprail = A.IDS.filter(i => (segOra[i]||0) > 0 &&
  (QUOTE[i] - A.SOGLIA) >= parseFloat(mFilo[1]));
esito(A.listeSulFilo().every(i => (QUOTE[i] - A.SOGLIA) < parseFloat(mFilo[1])) &&
      soprail.every(i => A.listeSulFilo().indexOf(i) < 0),
  'listeSulFilo tiene dentro chi sta sotto la distanza e fuori chi sta sopra',
  A.listeSulFilo().map(i => A.nm(i) + ' ' + (QUOTE[i]-A.SOGLIA).toFixed(3)).join(', ') || 'nessuna');

/* 22 · E LA CLAUSOLA DEL SEGNO NON SI CERCA SUL FILO. Sul seme di prova la lista
 *      riclassificata puo' non essere sul filo — in produzione dista 0,54 punti, quattro
 *      millesimi oltre il mezzo punto — quindi la proprieta' non e' esercitabile dai dati e
 *      il legame si prova dove sta: nel sorgente. E' l'idioma di og:title col job. */
const corpoScen = SRC.slice(SRC.indexOf('function fraseScenarioSoglia(){'),
                            SRC.indexOf('function fraseCombinazioni(filo,comb,sg){'));
esito(corpoScen.indexOf('IDS.forEach') >= 0 && corpoScen.indexOf('filo.forEach') < 0,
  'la clausola del segno si cerca su tutte le liste, non sul filo',
  corpoScen.split('\n').filter(r => r.indexOf('sg=') >= 0).join(' ').trim());


/* ══ 23 · LA BANDA DELLA SOMMA ════════════════════════════════════════════════════════
 * «Opposizione + arabi» e' la maggioranza in tutte le combinazioni, ed era l'unica
 * affermazione della pagina su chi puo' governare senza un intervallo: k-verdetto dichiara
 * due bande, una per BLOCCO, e la somma dei due decisivi non stava da nessuna parte. */
esito(A.fraseBanda(61,73) === ' In 8 simulazioni su 10 quella somma sta fra 61 e 73.',
  'fraseBanda compone gli estremi e non la mediana', JSON.stringify(A.fraseBanda(61,73)));

/* 23.1 · LA BANDA STA NEL RAMO CHE NOMINA LA SOMMA, e in nessun altro: dove a governare e'
 *        un campo da solo, «quella somma» non ha antecedente e la frase parlerebbe di una
 *        grandezza che il periodo prima non ha nominato. */
const combOppSola = [
  {fuori:[], b:{coalizione:40, opposizione:62, arabo:12, incerto:6}, gov:'opposizione', somma:74},
  {fuori:[vittima], b:{coalizione:40, opposizione:63, arabo:12, incerto:5}, gov:'opposizione', somma:75},
];
esito(A.fraseCombinazioni([vittima], combOppSola, null).indexOf('quella somma sta fra') < 0,
  'e non compare dove a governare e un campo da solo',
  A.fraseCombinazioni([vittima], combOppSola, null).trim());

/* 23.2 · I NUMERI VENGONO DAL MONTE CARLO, non da una costante. Il legame si prova nel
 *        sorgente: una banda scritta a mano sarebbe verde oggi e falsa alla prossima
 *        rilevazione, che e' la classe di difetto chiusa tre volte il 30 agosto 2026. */
const rigaBanda = SRC.split('\n').filter(r => r.indexOf('fraseBanda(') >= 0 &&
                                              r.indexOf('function fraseBanda') < 0).join(' ');
esito(rigaBanda.indexOf('MC.oppArab') >= 0 && rigaBanda.indexOf('.10') >= 0 &&
      rigaBanda.indexOf('.90') >= 0,
  'e i due estremi escono da MC.oppArab, non da una costante', rigaBanda.trim());

/* 23.3 · E LA SOMMA SI FA DENTRO IL CICLO. res.oppz e res.arab sono ordinati ciascuno per
 *        conto suo, quindi il k-esimo dell'uno e il k-esimo dell'altro NON sono la stessa
 *        simulazione: sommarli darebbe una distribuzione che non descrive nessuna
 *        esecuzione. E' la trappola delle due colonne «Seggi», e qui morderebbe proprio
 *        sulla frase per cui la banda esiste. */
const corpoMC = SRC.slice(SRC.indexOf('function montecarlo('),
                          SRC.indexOf('res.oppArab'));
esito(corpoMC.indexOf('oppAr[s]=bo+ba') >= 0,
  'la somma per la banda si fa dentro il ciclo, simulazione per simulazione',
  (corpoMC.split('\n').filter(r => r.indexOf('oppAr[s]') >= 0)[0]||'').trim());
const sommaFuori = SRC.indexOf('res.oppz[') >= 0 &&
  SRC.split('\n').some(r => /res\.oppz\s*\[[^\]]*\]\s*\+\s*res\.arab\s*\[/.test(r));
esito(!sommaFuori, 'e non si compone mai sommando i due array gia ordinati',
  sommaFuori ? 'trovata una somma fuori dal ciclo' : 'nessuna');


/* ══ 24 · LA SELEZIONE E' STRUTTURALE, LA FORMULAZIONE E' DEL CONTEGGIO ═══════════════
 * listeClausola() sceglie DI QUALE LISTA PARLARE: e' la terza categoria accanto alle due
 * dichiarate presso bloccoDi() — chi conta seggi legge la leva, chi calcola quote legge
 * l'anagrafica, e chi sceglie di che cosa parlare legge l'anagrafica anche lui.
 * Letta con la leva la categoria si SVUOTAVA: da quando PAR.inbilico nasce accesa,
 * bloccoDi() risponde «coalizione» per la lista riclassificata, e la clausola su quella
 * lista compariva solo premendo il pulsante. */
const riclass = A.IDS.filter(i => A.bloccoDi(i) !== A.P[i].b);
esito(riclass.length > 0,
  'la premessa: esiste almeno una lista che la leva riclassifica, o questa prova non morde',
  riclass.map(i => A.nm(i) + ' ' + A.P[i].b + ' -> ' + A.bloccoDi(i)).join(', '));

/* 24.1 · LA PROPRIETA': la selezione non si muove quando la leva si muove. E' l'unica forma
 *        che coglie il difetto senza nominare una lista — vale anche per quella che
 *        qualcuno riclassifica domani. */
const primaDellaLeva = A.listeClausola().slice().sort().join(',');
A.setPAR('inbilico', A.PAR().inbilico ? 0 : 1);
A.render();
const dopoLaLeva = A.listeClausola().slice().sort().join(',');
A.setPAR('inbilico', A.PAR().inbilico ? 0 : 1);
A.render();
esito(primaDellaLeva === dopoLaLeva,
  'listeClausola sceglie le stesse liste con la leva accesa e spenta',
  '[' + primaDellaLeva + '] contro [' + dopoLaLeva + ']');

/* 24.2 · e il verso che manca sempre: che la categoria non sia vuota per costruzione. Una
 *        selezione invariante su un elenco vuoto e invariante e non prova niente. */
const fuoriCampi = A.IDS.filter(i => A.P[i].b === 'incerto' && (A.SEG()[i]||0) >= A.CLAUSOLA_MIN);
esito(fuoriCampi.every(i => A.listeClausola().indexOf(i) >= 0) &&
      (fuoriCampi.length === 0 || A.listeClausola().length > 0),
  'e ogni lista fuori dai due campi PER ANAGRAFICA con abbastanza seggi ci finisce dentro',
  fuoriCampi.map(A.nm).join(', ') || 'nessuna sul seme');

/* 24.3 · LA FORMULAZIONE, invece, resta sul conteggio: «dal suo campo» deve concordare con
 *        i numeri che il lettore ha davanti, non con l'anagrafica. Le due domande sono
 *        diverse, ed e' per questo che leggono due cose diverse — il legame si prova nel
 *        sorgente, perche' sul seme le due letture possono coincidere. */
/* SI GUARDA LA RIGA CHE SELEZIONA, non il corpo: il commento accanto NOMINA la leva per
   spiegare perche non la si legge, ed e la trappola di ARCO_ORD — un controllo che cerca
   una stringa nel sorgente trova anche chi la nomina per negarla. */
const rigaSel = SRC.slice(SRC.indexOf('function listeClausola(){'),
                          SRC.indexOf('function aRischio(){'))
  .split(String.fromCharCode(10)).filter(function(r){return r.indexOf("!=='incerto'")>=0;}).join(' ');
esito(rigaSel.indexOf("P[i].b!=='incerto'") >= 0 && rigaSel.indexOf('bloccoDi') < 0,
  'la selezione legge l anagrafica e non nomina mai la leva',
  rigaSel.trim());
const corpoFrase = SRC.slice(SRC.indexOf('function fraseSoglia(id,s){'),
                             SRC.indexOf('function clausolaSoglia(id){'));
esito(corpoFrase.indexOf("bloccoDi(id)==='incerto'") >= 0,
  'e la formulazione resta sul conteggio, o le parole non concorderebbero con i numeri',
  corpoFrase.split('\n').filter(r => r.indexOf('bloccoDi') >= 0).join(' ').trim());

console.log('\nsoglianota: ' + ok + '/' + (ok + ko));
if (ko) process.exit(1);
