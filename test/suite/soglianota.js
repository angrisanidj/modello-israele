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
  'listeClausola:listeClausola,CLAUSOLA_MIN:CLAUSOLA_MIN};})();';
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

console.log('\nsoglianota: ' + ok + '/' + (ok + ko));
if (ko) process.exit(1);
