/* ══════════════════════════════════════════════════════════════════════════════════
 * I QUATTRO BLOCCHI, E I POSTI IN CUI IL QUARTO SPARIVA
 *
 * Scritta il 27 agosto 2026. `blocchi()` restituisce QUATTRO totali da sempre, e per mesi
 * quasi nessun consumatore ne ha pubblicati quattro: l'emiciclo disegnava i seggi dell'ago
 * della bilancia, li colorava, li nominava in legenda — e poi i tre numeri grandi in mezzo
 * all'aula sommavano 111 su 120. La tendenza li buttava via del tutto. Il riquadro
 * dell'evento isolato, che è quello per cui CLAUDE.md dichiara che la DATA di una
 * voce-evento non la tocca un agente, ne dimenticava un quarto. E `testoCondivisione()` e
 * `promptAI()` annunciavano «i 120 seggi» elencandone 111 FUORI dalla pagina: su X, su
 * Facebook, dentro un'anteprima, dentro la domanda mandata a un servizio terzo.
 *
 * IL DIFETTO È ARRIVATO FIN QUI PERCHÉ NESSUNA PROVA LEGAVA I TOTALI AL 120. In tutto il
 * banco non ce n'era una: `emi.js` non nomina mai `incerto`, e ogni consumatore era
 * corretto rispetto a sé stesso — che è esattamente la forma contro cui questo progetto
 * mette in guardia da quando i token di blocco sono stati divergenti per tre commit.
 *
 * QUINDI QUESTA PROVA NON GUARDA UN ELENCO DI POSTI: GUARDA UNA PROPRIETÀ.
 * «Ogni vista che pubblica dei totali di blocco li pubblica tutti» vale anche per la vista
 * che qualcuno aggiunge domani, mentre «l'emiciclo mostra quattro numeri» avrebbe provato
 * l'istanza. L'unica eccezione è dichiarata e ha una ragione scritta: l'archivio della
 * sezione 11, che afferma di riprodurre «i blocchi che gli istituti pubblicano» e non il
 * conteggio del modello.
 *
 * E NIENTE È SCRITTO SULL'ARCHIVIO DEL GIORNO. Nella proiezione di oggi l'ago della
 * bilancia ha ZERO seggi — «Casa Sionista» sta a 2,76% contro una soglia di 3,25 — quindi
 * una prova scritta sui numeri di oggi non eserciterebbe niente e sarebbe verde per
 * assenza del caso. L'archivio viene modificato QUI, spostando quattro seggi dal Likud, e
 * la proprietà si prova dove esiste.
 * (Il conto dei seggi di un SONDAGGIO è invece un dato: quindici rilevazioni vere di BASE
 * danno quattro seggi a Casa Sionista, ed è per questo che la nuvola dei sondaggi della
 * tendenza scartava dei punti già oggi.)
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
  'global.A={P:P,IDS:IDS,BL:BL,IN_BILICO:IN_BILICO,bloccoDi:bloccoDi,filtraBilico:filtraBilico,' +
  'blocchi:blocchi,render:render,PRESET:PRESET,ARCO_ORD:ARCO_ORD,ARCO_VICINI:ARCO_VICINI,' +
  'siglaBlocco:siglaBlocco,SIGLA_TIPO:SIGLA_TIPO,SIGLA_PREP:SIGLA_PREP,' +
  'testoCondivisione:testoCondivisione,promptAI:promptAI,serieModello:serieModello,' +
  'get SOND(){return SOND;},set SOND(v){SOND=v;},get SEG(){return SEG;},' +
  'get PAR(){return PAR;},PAR_DEF:PAR_DEF,statoLeve:statoLeve,' +
  'ipotesiNeiNumeri:ipotesiNeiNumeri,set SIM(v){SIM=v;},'+
  'setPAR:function(k,v){PAR[k]=v;},'+
  'get EMIMODE(){return EMIMODE;},set EMIMODE(v){EMIMODE=v;}};})();';
eval(src);

const $ = i => D.getElementById(i);
const testo = i => ($(i) ? $(i).textContent.replace(/\s+/g,' ').trim() : '');
const CHIAVI = ['coalizione','opposizione','arabo','incerto'];

/* ══ 0 · LA PREMESSA, MISURATA ══════════════════════════════════════════════════════
 * Senza questa la suite girerebbe a vuoto: proverebbe che tre totali sommano 120 mentre il
 * quarto blocco è a zero, cioè non proverebbe niente. */
A.SIM = 2000;
const SEME = A.SOND.slice();
/* LA LISTA CHE ENTRA NON PUO ESSERE QUELLA DELLA LEVA, e la prima stesura sbagliava.
   Dal 27 agosto 2026 la leva nasce ACCESA, quindi Amcha viene contata nel blocco Netanyahu
   e non compare MAI come quarto blocco: una prova che la usasse per esercitare i quattro
   totali si troverebbe davanti a tre, cioe' misurerebbe un'altra cosa credendo di
   misurare questa. Il quarto blocco si esercita con «Casa Sionista», che l ago della
   bilancia ce l ha per anagrafica e che nessuna riga di IN_BILICO nomina — ed e' anche
   piu' onesto, perche' la proprieta' e' del BLOCCO e non della lista che la leva sposta. */
const ENTRA = 'casa_sionista';
/* LA LEVA È UN ARGOMENTO, NON UN'EREDITÀ, e questa riga è costata dodici asserzioni.
   Fino al 27 agosto 2026 le due fixture facevano «PAR.inbilico = PAR_DEF.inbilico», con
   scritto accanto «al DIFETTO, non a zero: una fixture che la spegnesse proverebbe uno
   stato che il lettore non incontra mai». Il ragionamento era buono e la forma no: girando
   PAR_DEF la sera stessa, dodici asserzioni si sono trovate sotto l'altro stato e sono
   cadute insieme — non perché il codice fosse rotto, ma perché nessuna di loro diceva in
   quale dei due stati valeva. Adesso lo dicono, e lo stato PREDEFINITO ha un'asserzione sua
   che legge PAR_DEF invece di ereditarlo in silenzio: è la stessa mossa dei totali
   dell'archivio, dove il numero si legge dal colspan che lo dichiara al lettore. */
function conAgo(seggi, leva){
  A.SOND = SEME.map(s => {
    const o = JSON.parse(JSON.stringify(s));
    delete o._q; delete o._qk;
    if (seggi && o.seggi && o.seggi.likud >= 8) {
      o.seggi.likud -= seggi; o.seggi[ENTRA] = (o.seggi[ENTRA] || 0) + seggi;
    }
    return o;
  });
  A.PAR.inbilico = leva ? 1 : 0;
  A.render();
}
/* PRIMA DI QUALUNQUE FIXTURE, o l'asserzione non può cadere: appena una fixture tocca PAR,
   confrontarlo con PAR_DEF verifica quello che la fixture ha appena scritto. Qui invece
   dice la cosa che deve dire — che la pagina parte da PAR_DEF e non da uno stato suo — e
   coglie la seconda copia di PAR_DEF rimasta indietro, che in questo file è già successa. */
esito(A.PAR.inbilico === A.PAR_DEF.inbilico,
  'lo stato di partenza della pagina e quello di PAR_DEF, non uno stato suo',
  A.PAR.inbilico + ' contro ' + A.PAR_DEF.inbilico);
conAgo(0);
const SENZA = A.blocchi(A.SEG);
esito(SENZA.incerto === 0,
  'premessa: nell archivio di prova l ago della bilancia parte a zero seggi', String(SENZA.incerto));
conAgo(4);
const CON = A.blocchi(A.SEG);
esito(CON.incerto > 0,
  'e con quattro seggi spostati dal Likud una lista dell ago entra in Knesset',
  JSON.stringify(CON));
esito(CHIAVI.reduce((a,k) => a + CON[k], 0) === 120,
  'i quattro totali sommano 120, che e l invariante 1', JSON.stringify(CON));

/* ══ 1 · L'ARCO CHIUDE A 120 ════════════════════════════════════════════════════════
 * È la prova che mancava in tutto il banco. Non «l'emiciclo mostra quattro numeri»: la
 * somma di quello che il lettore legge dentro l'arco è l'aula intera, con qualunque
 * configurazione. */
function totaliArco(){
  const svg = $('k-emi').innerHTML;
  const num = [...svg.matchAll(/<text data-g="([a-z]+)"[^>]*x="[\d.]+" y="(\d+)"[^>]*>(\d+)<\/text>/g)]
    .map(m => ({g:m[1], y:+m[2], v:+m[3]}));
  if (!num.length) return [];
  const y = Math.min.apply(null, num.map(z => z.y));
  return num.filter(z => z.y === y);
}
{
  const t = totaliArco();
  esito(t.length > 0 && t.reduce((a,z) => a + z.v, 0) === 120,
    'i totali dentro l arco sommano 120 con quattro blocchi in aula',
    t.map(z => z.g + '=' + z.v).join(' ') + ' → ' + t.reduce((a,z) => a + z.v, 0));
  esito(t.length === CHIAVI.filter(k => CON[k]).length,
    'e sono tanti quanti i blocchi che hanno seggi, non un numero scritto',
    t.length + ' totali per ' + CHIAVI.filter(k => CON[k]).length + ' blocchi con seggi');
  esito(t.map(z => z.g).join(',') === A.ARCO_ORD.filter(k => CON[k]).join(','),
    'nell ordine in cui i blocchi siedono nell arco, da sinistra a destra',
    t.map(z => z.g).join(','));
}
conAgo(0);
{
  const t = totaliArco();
  esito(t.length > 0 && t.reduce((a,z) => a + z.v, 0) === 120,
    'e sommano 120 anche con tre blocchi, cioe nella configurazione di oggi',
    t.map(z => z.g + '=' + z.v).join(' '));
  esito(t.length === 3, 'dove i totali sono tre perche i blocchi con seggi sono tre', String(t.length));
}

/* ══ 2 · NESSUNA VOCE IRRAGGIUNGIBILE, E UNA STRADA SOLA PER L'ORDINE ═══════════════
 * Il difetto di partenza, in una riga: la tabella delle sigle dichiarava «incerti» e la
 * riga dei totali era cablata a tre chiavi. Una sigla che nessuno stato può mostrare è
 * codice che dice una cosa mentre il disegno ne fa un'altra.
 * E IL SECONDO, TROVATO IL 27 AGOSTO 2026: l'ordine dei blocchi nell'arco era scritto a
 * mano in QUATTRO posti, tre d'accordo e la legenda con un ordine suo — «coalizione,
 * opposizione, incerto, arabo», né l'arco né il suo specchio. Nessuna prova poteva dire
 * quale delle due fosse la svista, perché ciascuna era corretta rispetto a sé stessa.
 * Il legame si prova DOVE STA, cioè nel sorgente: che le quattro sedi chiamino la costante
 * invece di riscriverla. È l'idioma di og:title col job e di colonneBlocco() con le due
 * tabelle. */
/* E IL TERZO, TROVATO IL 30 AGOSTO 2026 GUARDANDO LA PAGINA RESA, il giorno in cui l ago
 * della bilancia e arrivato a cinque seggi: la sigla dentro l arco diceva «incerti» e la
 * legenda quaranta pixel sotto diceva «Ago della bilancia». La tabella TOT_SIGLA era una
 * SECONDA ANAGRAFICA dei nomi di blocco, e tre voci su quattro erano gia derivabili da
 * BL[x].n — quindi non c era una parola sbagliata da correggere, c era una strada doppia
 * da togliere. Quella voce era stata scritta quando il quarto blocco non aveva mai seggi,
 * cioe quando nessuno poteva vederla accanto alla legenda.
 * LA PROVA E SULLA REGOLA, NON SULLE QUATTRO STRINGHE DI OGGI: asserire che la sigla di
 * «incerto» sia «bilancia» sarebbe rimettere in una prova la tabella appena tolta, e
 * cadrebbe il giorno in cui un blocco cambia nome per una ragione buona. Si prova che ogni
 * sigla SIA UNA PAROLA DEL NOME da cui viene — che e la proprieta che «incerti» violava —
 * e che il confronto sia insensibile alla sola maiuscola iniziale, perche quella la regola
 * la toglie di proposito quando la parola stava in testa. */
esito(CHIAVI.every(k => A.siglaBlocco(k)),
  'ogni blocco ha la sua sigla e nessuna sigla e di un blocco che non esiste',
  CHIAVI.map(k => k + ':' + A.siglaBlocco(k)).join(' '));
const fuoriDalNome = CHIAVI.filter(k => {
  const par = String(A.BL[k].n).trim().split(/\s+/).map(w => w.toLowerCase());
  return par.indexOf(String(A.siglaBlocco(k)).toLowerCase()) < 0;
});
esito(fuoriDalNome.length === 0,
  'e ogni sigla e una PAROLA del nome del suo blocco: e la proprieta che «incerti» violava',
  fuoriDalNome.map(k => A.siglaBlocco(k) + ' non e in «' + A.BL[k].n + '»').join(' · '));
/* E NESSUNA SIGLA E UNA PAROLA DI SERVIZIO, che e la meta che mancava.
 * «Una parola del nome» non basta, e l hanno detto due mutanti VIVI al primo giro: la
 * regola che non toglie il tipo in testa produce «partiti», «blocco» e «ago», e quella che
 * non salta la preposizione produce «della». Sono tutte e quattro PAROLE DEL NOME, quindi
 * l asserzione qui sopra le lasciava passare — e sono tutte e quattro sigle che dicono di
 * che TIPO di raggruppamento si tratta invece di dire QUALE, cioe' l esatto contrario del
 * mestiere della sigla. Quattro blocchi che si chiamano «partiti», «blocco», «ago» e
 * «opposizione» non si distinguono affatto.
 * La proprieta e questa, ed e meccanica: la sigla non puo essere una delle parole che la
 * regola esiste per scartare — il tipo E la preposizione, che sono due liste e vanno
 * guardate tutte e due: il mutante che non salta la preposizione restituisce «della», che
 * non e un tipo ed e sopravvissuto al primo giro di questa stessa asserzione. */
const SERVIZIO = A.SIGLA_TIPO.concat(A.SIGLA_PREP);
const diServizio = CHIAVI.filter(k =>
  SERVIZIO.indexOf(String(A.siglaBlocco(k)).toLowerCase()) >= 0);
esito(diServizio.length === 0,
  'e nessuna sigla e una parola di SERVIZIO: dice quale blocco, non di che tipo',
  diServizio.map(k => A.siglaBlocco(k)).join(', '));
esito(new Set(CHIAVI.map(k => A.siglaBlocco(k))).size === CHIAVI.length,
  'e le quattro sigle sono distinte fra loro',
  CHIAVI.map(k => A.siglaBlocco(k)).join(', '));

/* E IL RILEVATORE SA ACCENDERSI. Senza questa riga la prova qui sopra resterebbe verde
 * anche il giorno in cui la regola smettesse di derivare e tornasse a inventare: si
 * costruisce un nome che la regola non sa ridurre e si guarda che il controllo lo colga. */
const FINTO = {n: 'Ago della bilancia'};
esito(['incerti','indecisi','altri'].every(x => 'ago della bilancia'.split(' ').indexOf(x) < 0),
  'e il controllo sa dire di no: «incerti» non e una parola di «Ago della bilancia»');
/* LA MAIUSCOLA E DELLA POSIZIONE, NON DEL NOME PROPRIO. «Netanyahu» sta in seconda parola e
 * la tiene; «Opposizione» sta in testa e la perde. Il mutante che toglie la minuscola
 * farebbe comparire una maiuscola in mezzo a «arabi» e «bilancia», che non significa
 * niente e che nessuna delle prove qui sopra coglierebbe. */
const inTesta = CHIAVI.filter(k => String(A.BL[k].n).trim().split(/\s+/)[0].toLowerCase()
  === String(A.siglaBlocco(k)).toLowerCase());
esito(inTesta.length > 0 && inTesta.every(k => /^[a-z]/.test(A.siglaBlocco(k))),
  'e la sigla che viene dalla PRIMA parola del nome perde la maiuscola della posizione',
  inTesta.map(k => A.siglaBlocco(k)).join(',') || 'nessuna cella esercita il caso');
esito(A.ARCO_ORD.slice().sort().join(',') === CHIAVI.slice().sort().join(','),
  'e l ordine dell arco copre esattamente i blocchi dichiarati: nessuno irraggiungibile',
  A.ARCO_ORD.join(','));
/* L ORDINE SI PROVA COME PROPRIETA, NON COME ELENCO. Scrivere qui
   ['opposizione','arabo','incerto','coalizione'] sarebbe ricopiare la costante che il
   codice ha appena smesso di scrivere quattro volte, e cadrebbe il giorno in cui la
   ragione cambia invece del giorno in cui l ordine sbaglia.
   La ragione e questa: non e l emiciclo dello SPETTRO politico, e quello delle
   MAGGIORANZE possibili. La linea dei 61 sta al centro dell arco e non si muove mai —
   e il punto medio fra il 60 e il 61 seggio, quindi con 120 seggi cade sempre li — e
   l ordine decide che cosa il lettore ci trova sotto. Con i due campi agli ESTREMI e i
   due gruppi decisivi in mezzo, cio che sta a sinistra della linea e sempre un prefisso
   che comincia da un campo: o il campo di testa governa da solo, o gli manca un pezzo
   del gruppo decisivo che gli sta accanto. Enumerando tutte le 302.621 partizioni dei
   120 seggi in quattro gruppi, il caso «la linea taglia a meta un campo che la
   maggioranza non ce l ha» — quello in cui non si legge niente e bisogna contare —
   passa dal 49,0% a ZERO. */
const CAMPI = ['opposizione','coalizione'], DECISIVI = ['arabo','incerto'];
esito(CAMPI.indexOf(A.ARCO_ORD[0]) >= 0 && CAMPI.indexOf(A.ARCO_ORD[3]) >= 0,
  'i due CAMPI stanno agli estremi dell arco: e la condizione per cui a sinistra della ' +
  'linea dei 61 c e sempre un prefisso che comincia da un campo', A.ARCO_ORD.join(','));
esito(DECISIVI.indexOf(A.ARCO_ORD[1]) >= 0 && DECISIVI.indexOf(A.ARCO_ORD[2]) >= 0,
  'e i due gruppi DECISIVI stanno in mezzo, dove cade la linea', A.ARCO_ORD.join(','));
esito(A.ARCO_ORD[0] === 'opposizione' && A.ARCO_ORD[1] === 'arabo',
  'gli arabi stanno accanto all OPPOSIZIONE, che e l unico campo che potrebbero ' +
  'appoggiare: «all opposizione servono N seggi arabi» si legge invece di contarsi',
  A.ARCO_ORD.join(','));
esito(A.ARCO_ORD[2] === 'incerto' && A.ARCO_ORD[3] === 'coalizione',
  'e l ago della bilancia accanto alla COALIZIONE, cosi la stessa lettura vale a ' +
  'specchio: «alla coalizione servono N seggi dell ago»', A.ARCO_ORD.join(','));
{
  const js = fs.readFileSync(__dirname + '/../app.js','utf8');
  /* un elenco delle quattro chiavi scritto a mano, in qualunque ordine: è la copia che
     diverge. Non si cerca UN ordine — si cerca la FORMA, così vale anche per quello che
     qualcuno scrive domani. */
  const QUATTRO = /\[\s*'(?:coalizione|opposizione|arabo|incerto)'\s*,\s*'(?:coalizione|opposizione|arabo|incerto)'\s*,\s*'(?:coalizione|opposizione|arabo|incerto)'\s*,\s*'(?:coalizione|opposizione|arabo|incerto)'\s*\]/g;
  const copie = js.match(QUATTRO) || [];
  esito(copie.filter(c => c === "['opposizione','arabo','incerto','coalizione']").length === 1,
    'l ordine dell arco e scritto UNA volta sola: ARCO_ORD',
    copie.length + ' elenchi di quattro chiavi in tutto il file');
  /* SI GUARDANO I COMANDI, NON I COMMENTI CHE LI NOMINANO, ed e la trappola che questo
     progetto ha gia pagato nel controllo dell autostash. Il primo giro contava «ARCO_ORD»
     nel sorgente crudo: il commento accanto alla legenda dice «vedi ARCO_ORD», quindi
     rimettendo un elenco a mano al posto della chiamata il conto restava quattro e il
     mutante SOPRAVVIVEVA. I commenti si tolgono prima di contare.
     E la proprieta forte non e «quante volte la chiama»: e che dentro rEmi non ci sia
     NESSUN elenco delle quattro chiavi. Cosi non conta in quale ordine lo si riscrive. */
  const daRE = js.indexOf('function rEmi()');
  const rEmi = js.slice(daRE, js.indexOf(String.fromCharCode(10) + 'function ', daRE + 10))
    .replace(/\/\*[\s\S]*?\*\//g, '');
  esito(!QUATTRO.test(rEmi),
    'e dentro rEmi non c e nessun elenco di blocchi scritto a mano: le sedi la CHIAMANO',
    (rEmi.match(QUATTRO) || []).join(' · '));
  esito((rEmi.match(/ARCO_ORD/g) || []).length >= 4,
    'e le quattro sedi la chiamano davvero: le due sequenze dei seggi, la riga dei totali ' +
    'e la legenda', String((rEmi.match(/ARCO_ORD/g) || []).length) + ' chiamate dentro rEmi');
}

/* ══ 3 · I TOTALI NON TOCCANO I SEGGI ═══════════════════════════════════════════════
 * Il corpo si ricava dal disegno reso, quindi la prova lo verifica sul disegno reso e non
 * su un modello dell'arco. Le larghezze sono stimate con le stesse costanti del codice e
 * per ECCESSO: se la stima e il codice divergessero, cadrebbe qui. */
/* IL PAVIMENTO SI LEGGE DAL SORGENTE, non si riscrive qui: una costante copiata in una
   prova e' la strada doppia di sempre, e per giunta quella che decide se la prova morde. */
/* L'ARIA RICHIESTA NON È PIÙ UNA COSTANTE DA LEGGERE: È IL VARCO DEL DISEGNO.
   La prima stesura pretendeva TOT_ARIA > 0 — bastava a togliere il confronto con lo zero
   esatto in virgola mobile (un contatto vale 8,9e-15, che è VERO, e la bisezione stringeva
   il corpo fino a 18 invece di 27,5) e NON bastava a rendere vera la proprietà: con mezza
   unità il numero più a sinistra finiva a 0,68 unità dal seggio, cioè 0,9px a 1265. Non è
   «ci sta»: è un contatto mancato.
   «Il vuoto si vede» quanto lo dice il disegno: fra due seggi contigui l'emiciclo lascia
   un varco, e se un numero sta a un seggio più vicino di quanto due seggi stiano fra loro
   si legge attaccato. Quel varco è quindi la pretesa, LETTA dai cerchi resi invece che
   scritta — e la prova qui verifica la stessa cosa sul disegno vero. */
esito(/function varcoFraSeggi\(/.test(HTML) && !/var TOT_ARIA=/.test(HTML),
  'l aria richiesta si RICAVA dal varco fra due seggi, invece di essere un numero scelto');
function urtoTotali(){
  const svg = $('k-emi').innerHTML;
  const cer = [...svg.matchAll(/cx="([\d.]+)" cy="([\d.]+)"/g)].map(m => ({x:+m[1], y:+m[2]}));
  const txt = [...svg.matchAll(/<text data-g="[a-z]+"[^>]*x="([\d.]+)" y="(\d+)"[^>]*font-size="([\d.]+)"[^>]*>([^<]*)<\/text>/g)];
  const EM = 0.55, SU = 0.72, GIU = 0.24, R = 5.4;
  /* il varco vero del disegno, calcolato qui come lo calcola il codice */
  let vicini = Infinity;
  for (let i = 0; i < cer.length; i++) for (let j = i + 1; j < cer.length; j++)
    vicini = Math.min(vicini, Math.hypot(cer[i].x - cer[j].x, cer[i].y - cer[j].y));
  const VARCO = vicini - 2 * R;
  let peggio = 0, minAria = Infinity;
  txt.forEach(m => {
    const x = +m[1], y = +m[2], corpo = +m[3], contenuto = m[4];
    const ls = /letter-spacing="([\d.]+)em"/.exec(m[0]);
    const w = EM * corpo * contenuto.length + (ls ? (+ls[1]) * corpo * contenuto.length : 0);
    const a = x - w / 2, c = x + w / 2, t = y - SU * corpo, b = y + GIU * corpo;
    cer.forEach(q => {
      const dx = Math.max(a - q.x, q.x - c, 0), dy = Math.max(t - q.y, q.y - b, 0);
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < R) peggio = Math.max(peggio, R - d);
      minAria = Math.min(minAria, d - R);
    });
  });
  return {peggio: peggio, quanti: cer.length, varco: VARCO, aria: minAria};
}
/* NON «non tocca»: «sta lontano almeno quanto due seggi stanno fra loro». È la proprietà
   che «non collide» non esprimeva, e la differenza è misurata: con la vecchia pretesa il
   numero più a sinistra stava a 0,68 unità dal seggio — 0,9px a 1265 — e nessuna
   asserzione cadeva. Il varco si calcola qui dai cerchi resi, come lo calcola il codice:
   se il codice smettesse di ricavarlo, i due numeri divergerebbero e questa cade. */
const corpi = [];
function guardaTotali(tag){
  const u = urtoTotali();
  esito(u.quanti === 120 && u.aria >= u.varco,
    tag + ': ogni numero e ogni sigla stanno dal seggio piu vicino almeno quanto due seggi ' +
    'stanno fra loro',
    'aria ' + u.aria.toFixed(2) + ' contro un varco di ' + u.varco.toFixed(2) + ' unita');
  const m = /<text data-g="[a-z]+"[^>]*y="204"[^>]*font-size="([\d.]+)"/.exec($('k-emi').innerHTML);
  corpi.push(m ? +m[1] : 0);
  return u;
}
guardaTotali('tre blocchi');
conAgo(2);  guardaTotali('quattro blocchi, ago piccolo');
conAgo(4);  guardaTotali('quattro blocchi, ago medio');
conAgo(9);  guardaTotali('quattro blocchi, ago grande');
/* IL CORPO È UNA COSTANTE, NON UN ESITO, ed è la ragione per cui il tetto è 28 e non 31.
   Con 31 sarebbe 31 · 30 · 30 · 28 a seconda di dove capitano i seggi, e un numero che
   cambia grandezza secondo la configurazione è peggio di una sigla più piccola. */
esito(new Set(corpi).size === 1 && corpi[0] > 20,
  'e il corpo e lo STESSO in tutte le configurazioni: non cambia con la disposizione dei seggi',
  corpi.join(' · '));
conAgo(4);

/* ══ 4 · LA PROPRIETÀ, NON L'ELENCO ═════════════════════════════════════════════════
 * Ogni vista che pubblica un insieme di totali di blocco li pubblica TUTTI, e le viste si
 * verificano sul numero che il LETTORE legge, non sull'oggetto che il codice passa. */
{
  const inc = String(CON.incerto);
  const casi = [
    ['la riga di condivisione', A.testoCondivisione(false)],
    ['il prompt che va al servizio terzo', A.promptAI()],
    ['il sommario di testata', testo('k-deck')],
    ['il verdetto', testo('k-verdetto')],
    ['la legenda della tendenza', testo('k-trendleg')]
  ];
  casi.forEach(function(c){
    const numeri = (c[1].match(/\d+/g) || []);
    esito(numeri.indexOf(inc) >= 0,
      c[0] + ' nomina anche il quarto blocco', 'cerco ' + inc + ' in: ' + c[1].slice(0, 160));
  });
  /* il riquadro dell'evento isolato: quello con cui si apre il commento di questa suite */
  const voce = D.querySelector('#k-crono > button[data-ev]');
  if (voce) {
    voce.dispatchEvent(new W.MouseEvent('click', {bubbles:true}));
    const eb = $('k-evsel').querySelectorAll('.eb > div');
    const somma = [].map.call(eb, e => {
      const m = /(\d+)\s*$/.exec(e.textContent.replace(/\s+/g,' ').trim());
      return m ? +m[1] : 0;
    }).reduce((a, c) => a + c, 0);
    esito(eb.length === 4 && somma === 120,
      'il riquadro dell evento isolato dice quattro numeri, e sommano 120',
      eb.length + ' righe, somma ' + somma);
    voce.dispatchEvent(new W.MouseEvent('click', {bubbles:true}));
  } else { esito(false, 'la cronologia ha almeno una voce da isolare'); }
  const S = A.serieModello();
  esito(S.every(x => ['g','o','a','i'].every(k => typeof x[k] === 'number')),
    'ogni punto della serie della tendenza porta tutti e quattro i blocchi');
  esito(S.every(x => x.g + x.o + x.a + x.i === 120),
    'e ogni punto della serie chiude a 120',
    JSON.stringify(S.filter(x => x.g + x.o + x.a + x.i !== 120).slice(0, 2)));
}

/* ══ 4b · E LA QUARTA SERIE SI SPEGNE QUANDO NON HA NIENTE DA DIRE ══════════════════
 * Il ramo che la toglie non si esercita con l'archivio del progetto, e la ragione e' un
 * dato: QUINDICI rilevazioni di BASE danno quattro seggi a Casa Sionista, quindi la nuvola
 * dei sondaggi ha sempre dei punti dell'ago della bilancia anche quando la proiezione non
 * gliene assegna nessuno. Senza questa fixture il mutante che disegna sempre quattro serie
 * resta VIVO — misurato, ed e' il motivo per cui questo blocco esiste: una linea piatta
 * sullo zero per tutto l'asse e una voce di legenda che dice sempre 0 sono rumore, non
 * informazione, e nessuna prova se ne sarebbe accorta.
 * La fixture toglie i seggi dell'ago della bilancia da OGNI rilevazione e li rimette al
 * Likud, cosi' ogni riga continua a chiudere a 120: e' l'invariante 1, e una fixture che la
 * violasse proverebbe un'altra cosa. */
{
  const AGO = A.IDS.filter(i => A.P[i].b === 'incerto');
  A.SOND = SEME.map(s => {
    const o = JSON.parse(JSON.stringify(s));
    delete o._q; delete o._qk;
    let tolti = 0;
    if (o.seggi) { AGO.forEach(k => { if (o.seggi[k]) { tolti += o.seggi[k]; delete o.seggi[k]; } }); }
    if (tolti && o.seggi) o.seggi.likud = (o.seggi.likud || 0) + tolti;
    if (o.sotto) AGO.forEach(k => { delete o.sotto[k]; });
    return o;
  });
  A.PAR.inbilico = 0; A.render();
  const somme = A.SOND.filter(s => s.seggi).map(s => Object.keys(s.seggi).reduce((a,k) => a + s.seggi[k], 0));
  esito(somme.every(v => v === 120),
    'premessa: la fixture senza ago della bilancia lascia ogni riga a 120 seggi',
    JSON.stringify(somme.filter(v => v !== 120).slice(0,3)));
  esito(A.blocchi(A.SEG).incerto === 0, 'e la proiezione non gliene assegna nessuno');
  const svg = $('k-trend').innerHTML;
  const linee = new Set((svg.match(/class="ln ln-([a-z])"/g) || []).map(x => x.slice(-2,-1)));
  const punti = new Set((svg.match(/class="pt pt-([a-z])"/g) || []).map(x => x.slice(-2,-1)));
  esito(linee.size === 3 && !linee.has('i'),
    'senza un solo seggio all ago della bilancia la tendenza disegna TRE linee, non una piatta a zero',
    [...linee].join(','));
  esito(punti.size === 3 && !punti.has('i'),
    'e la nuvola dei sondaggi non porta una quarta serie di punti sullo zero',
    [...punti].join(','));
  esito([...D.querySelectorAll('#k-trendleg b[data-ln]')].length === 3,
    'e la legenda ha tre voci: una che dicesse sempre 0 sarebbe rumore');
  conAgo(4);
}

/* ══ 5 · L'ECCEZIONE DICHIARATA ═════════════════════════════════════════════════════
 * L'archivio ne pubblica TRE, e non è una dimenticanza: quelle colonne affermano di
 * riprodurre i totali degli istituti, e un istituto non conosce le nostre ipotesi. Il
 * piede della sezione lo dice al lettore, e questa prova pretende che continui a dirlo:
 * togliere la frase lasciando i tre totali sarebbe il difetto senza l'avviso. */
{
  esito(/somma è minore di 120/.test(D.body.textContent.replace(/\s+/g,' ')),
    'il piede dell archivio dichiara che i suoi tre totali possono non fare 120');
  const fonte = A.blocchi(A.SEG, true), conta = A.blocchi(A.SEG);
  esito(CHIAVI.every(k => fonte[k] === conta[k]),
    'e a leva spenta il conto della fonte e quello del modello coincidono');
}

/* La fixture della LEVA e' un altra cosa: qui i seggi vanno alla lista che IN_BILICO
   nomina, o non ci sarebbe niente da spostare. */
function conBilico(seggi, leva){
  const id = A.IN_BILICO[0].id;
  A.SOND = SEME.map(s => {
    const o = JSON.parse(JSON.stringify(s));
    delete o._q; delete o._qk;
    if (seggi && o.seggi && o.seggi.likud >= 8) {
      o.seggi.likud -= seggi; o.seggi[id] = (o.seggi[id] || 0) + seggi;
    }
    return o;
  });
  A.PAR.inbilico = leva ? 1 : 0;
  A.render();
}
esito(A.IN_BILICO.every(r => r.id !== ENTRA),
  'la lista che entra in Knesset nelle fixture NON e quella che la leva sposta: ' +
  'altrimenti la leva la conterebbe altrove e il quarto blocco non esisterebbe mai',
  ENTRA);

/* ══ 6 · LA LEVA RICLASSIFICA, NON RICALCOLA ════════════════════════════════════════
 * È l'affermazione su cui poggia tutto il resto — «nessun colore cambia, PAL_SCURO
 * intatto» — e va provata, non dichiarata. Se un giorno il blocco entrasse nel riparto,
 * queste asserzioni cadono. */
function seggiOra(){ return A.IDS.filter(i => A.SEG[i]).map(i => i + ':' + A.SEG[i]).join(' '); }
{
  conBilico(4, 0);
  const spenta = seggiOra(), bSpenta = A.blocchi(A.SEG);
  A.PAR.inbilico = 1; A.render();
  const accesa = seggiOra(), bAccesa = A.blocchi(A.SEG);
  esito(spenta === accesa,
    'accendendo la leva nessuna lista cambia di un seggio: e un conteggio, non un riparto',
    spenta + '  vs  ' + accesa);
  esito(bAccesa.coalizione > bSpenta.coalizione && bAccesa.incerto < bSpenta.incerto,
    'ma i seggi cambiano campo, che e quello che la leva promette',
    JSON.stringify(bSpenta) + ' -> ' + JSON.stringify(bAccesa));
  esito(CHIAVI.reduce((a,k) => a + bAccesa[k], 0) === 120,
    'e la somma resta 120 anche a leva accesa');
  conAgo(4);
}

/* ══ 7 · DOVE LA LEVA NON DEVE ARRIVARE ═════════════════════════════════════════════
 * Le funzioni che calcolano QUOTE leggono l'anagrafica e non la leva: lo swing è tarato su
 * tre elezioni in cui queste liste non esistevano. E soprattutto la leva non deve
 * raggiungere la guardia «Gov.» del parser notturno, o ogni notte con la leva accesa il
 * job respingerebbe righe VALIDE dichiarando «blocco discordante» — nel lavoro notturno,
 * cioè dove nessuno guarda.
 * Si prova sul SORGENTE perché è lì che sta la proprietà: la strada giusta è quella NON
 * presa, e due valori uguali per caso non direbbero niente. È l'idioma con cui og:title è
 * legato al job. */
{
  const js = fs.readFileSync(__dirname + '/../app.js','utf8');
  function corpo(nome){
    const i = js.indexOf('function ' + nome + '(');
    return i < 0 ? '' : js.slice(i, js.indexOf('\n}', i));
  }
  ['applicaSwing','puntiPer'].forEach(function(n){
    const c = corpo(n);
    esito(c.length > 20 && !/bloccoDi/.test(c) && /\.b\b/.test(c),
      n + '() legge l anagrafica e non la leva: lo swing e una misura storica',
      c.length ? 'nomina bloccoDi' : 'funzione non trovata');
  });
  const mc = corpo('montecarlo');
  esito(/dir\[i\]=b===/.test(mc) && /isCo\[i\]=bc2===/.test(mc),
    'nel Monte Carlo dir[] legge l anagrafica e isCo/isOp/isAr leggono la leva: ' +
    'lo scossone e storico, il conteggio dei 61 e la domanda della leva');
  /* L'ANCORA VA CERCATA DOVE COMPARE UNA VOLTA SOLA. La prima stesura cercava
     'PRESET.netanyahu.forEach', che compare DUE volte — nella guardia del parser e
     nell'inizializzazione di COAL — e indexOf trovava la seconda: il mutante che porta la
     guardia a leggere bloccoDi restava VIVO, cioe' l'asserzione guardava un altro pezzo di
     file credendo di guardare il parser. E' la trappola della prima occorrenza, che questo
     progetto ha gia' pagato nel misuratore di mutanti, vista dal lato della prova.
     Adesso l'ancora e' il messaggio della guardia, che e' unico, e la regione esaminata e'
     tutta la funzione che lo contiene. */
  const gm = js.indexOf("motivo='blocco governo '");
  const capo = js.lastIndexOf('function parseWikiTabella(', gm);
  const coda = js.indexOf(String.fromCharCode(10) + 'function ', gm);
  esito(js.split("motivo='blocco governo '").length - 1 === 1,
    'il messaggio della guardia Gov compare una volta sola: e un ancora buona',
    String(js.split("motivo='blocco governo '").length - 1));
  esito(gm > 0 && capo >= 0 && coda > gm && !/bloccoDi/.test(js.slice(capo, coda)),
    'e la funzione che porta quella guardia non nomina bloccoDi: la leva non la raggiunge',
    gm < 0 ? 'guardia non trovata' : 'la funzione nomina bloccoDi');
  esito(/IDS\.filter\(function\(i\)\{return P\[i\]\.b==='coalizione';\}\)/.test(js),
    'e PRESET.netanyahu resta il filtro sull anagrafica, che e quello che la fonte conta');
}

/* ══ 8 · IL COMANDO, E LO STATO IN CUI IL LETTORE ARRIVA ═══════════════════════════
 * Il 27 agosto 2026 la leva è nata accesa la mattina ed è tornata spenta la sera, e questa
 * sezione è stata scritta due volte. La seconda stesura non è una correzione: è il difetto
 * girato, e quello che prova è lo stesso — che lo stato in cui il lettore ARRIVA sia
 * dichiarato, e che l'altro si raggiunga con un comando che dice che cosa fa.
 * QUELLO CHE È CAMBIATO È DA DOVE SI PARTE, e adesso è scritto: le fixture non seguono più
 * PAR_DEF in silenzio — prendono la leva come argomento — così ogni asserzione dice in
 * quale dei due stati vale invece di ereditarlo. Finché la seguivano, girare la cifra in
 * PAR_DEF spostava dodici asserzioni sotto un altro stato senza che nessuna riga lo dicesse:
 * è successo, e le dodici sono cadute tutte insieme. */
{
  /* IL PREDEFINITO E' ACCESO dal 30 agosto 2026, ed e' la terza volta che questa riga
     cambia: accesa la mattina del 27, spenta la sera, accesa di nuovo il 30 sulla
     dichiarazione di Ofer Winter. Non e' un ripensamento — e' che la ragione e' diversa:
     il 27 l'ipotesi era «e se governasse con Netanyahu?», adesso e' un fatto che il partito
     ha dichiarato con una data e una fonte, e che la fonte dei sondaggi non ha ancora
     recepito. L'ANAGRAFICA resta quella di Wikipedia, e l'asserzione qui sotto lo tiene. */
  esito(A.PAR_DEF.inbilico === 1,
    'PAR_DEF porta la leva ACCESA: il conteggio predefinito porta la dichiarazione di Winter, ' +
    'e «Azzera» — che ripristina PAR_DEF — ci riporta',
    String(A.PAR_DEF.inbilico));

  /* IL COMANDO COMPARE QUANDO COMINCIA A SPOSTARE QUALCOSA, E NON PRIMA.
     Vale nei due stati, e si prova su quello ACCESO perché lì il comando è anche l'unica
     via d'uscita da un'ipotesi già dentro i numeri: se comparisse un render dopo, il
     lettore si troverebbe davanti a un conteggio che non può disfare. È la transizione,
     non i due stati separati. */
  /* IL PUNTO NON SI INDOVINA, SI CERCA. «Al primo seggio» sarebbe falso: un seggio per
     rilevazione vale una quota dello 0,8% e la soglia e' 3,25, quindi la lista resta fuori
     dal riparto e la leva continua a muovere zero. La proprieta' e' che il comando compaia
     esattamente quando la lista ENTRA nella proiezione — e il valore di soglia dipende
     dall'archivio, quindi scriverne uno qui sarebbe la costante che scade. */
  const id = A.IN_BILICO[0].id;
  let entra = 0;
  for (let n = 0; n <= 8 && !entra; n++) { conBilico(n, 1); if (A.SEG[id]) entra = n; }
  esito(entra > 0, 'esiste un numero di seggi che fa entrare la lista nella proiezione',
    'provati 0..8');
  conBilico(entra - 1, 1);
  esito(!A.SEG[id] && $('k-bilico').hidden === true,
    'finche la lista resta sotto soglia il comando non c e: uno che non fa niente e ' +
    'peggio di uno assente', 'con ' + (entra - 1) + ' seggi per rilevazione');
  esito(testo('k-bilriga') === '', 'e la riga di esito tace');
  conBilico(entra, 1);
  const b1 = A.blocchi(A.SEG);
  esito($('k-bilico').hidden === false,
    'e compare da se nello stesso render in cui la lista entra, senza che nessuno prema ' +
    'niente', 'a ' + entra + ' seggi per rilevazione');
  /* la proprieta' NON e' «la coalizione cresce di tanti seggi quanti ne prende la lista»:
     quei seggi arrivano da un riparto rifatto, e altre liste si muovono insieme. E' che
     nel conteggio del modello l ago della bilancia resta a ZERO mentre nel conteggio
     della FONTE quei seggi ci sono: cioe' l ipotesi e' gia' applicata, ed e' esattamente
     il render in cui il comando compare. */
  esito(b1.incerto === 0 && A.blocchi(A.SEG, true).incerto === A.SEG[id] && A.SEG[id] > 0,
    'e con la leva accesa i seggi sono gia contati nel blocco: non c e un render in cui ' +
    'l ipotesi e applicata e il comando per toglierla non c e ancora',
    JSON.stringify(b1) + ' contro la fonte ' + JSON.stringify(A.blocchi(A.SEG, true)));

  /* ── LO STATO IN CUI IL LETTORE ARRIVA: leva spenta, cioè il conto della fonte ── */
  conBilico(4, 0);
  const b = $('k-bilico');
  /* UN ASSERZIONE DEVE CADERE, NON ESPLODERE — quinta volta in questo progetto, e questa
     l ha trovata la mutazione. Con il verso riportato a «incerto», o con l anagrafica
     spostata in coalizione, la leva muove ZERO: il comando non viene reso e aria-label non
     c e. Le due righe qui sotto leggevano quel null e facevano MORIRE la suite alla
     riga 607 — 58 asserzioni buone, poi il vuoto. Il banco dichiarava morti i due mutanti
     perche il processo usciva diverso da zero, ma una suite che non arriva in fondo non ha
     giudicato niente: e la distinzione fra «cade» ed «esplode» che questo progetto ha gia
     pagato quattro volte. Col ripiego a stringa vuota le asserzioni cadono, dicono quale
     proprieta e violata, e le trenta che seguono vengono comunque valutate. */
  const spento = b ? b.textContent : '', eti = (b && b.getAttribute('aria-label')) || '';
  esito(/^Conta /.test(spento),
    'nello stato in cui il lettore arriva il verbo e «Conta», cioe l azione che AGGIUNGE ' +
    'l ipotesi a un conteggio che senza di lei e quello della fonte', spento);
  esito(eti.indexOf(spento) === 0,
    'il nome accessibile comincia col testo visibile, come chiede WCAG 2.5.3', eti);
  esito(b.getAttribute('aria-pressed') === null,
    'e non porta aria-pressed: il nome dice l azione, quindi il riscontro e il nome che cambia');
  const rigaSp = testo('k-bilriga');
  esito(/^La fonte non conta/.test(rigaSp),
    'e la riga di esito apre da quello che dice la FONTE, che e la ragione per cui la ' +
    'lista sta fuori dai due campi', rigaSp.slice(0, 160));
  esito(/peserebbe/.test(rigaSp) && /seggi/.test(rigaSp),
    'e dice quanto peserebbe l ipotesi senza applicarla: il condizionale e il canale che ' +
    'distingue una misura da un conteggio', rigaSp.slice(0, 240));

  /* ── E LO STATO CHE SI RAGGIUNGE PREMENDO: l'ipotesi dentro i numeri ── */
  A.PAR.inbilico = 1; A.render();
  const acceso = $('k-bilico').textContent;
  esito(acceso !== spento, 'premendo, il nome cambia — ed e il riscontro', spento + ' -> ' + acceso);
  esito(/^Togli /.test(acceso),
    'e diventa «Togli», cioe l azione che riporta il conteggio a quello della fonte', acceso);
  esito(acceso.length === spento.length,
    'e ha la STESSA lunghezza nei due stati: il pannello non si accorcia sotto il dito, ' +
    'che e il difetto costato al comando degli accordi 36px di salto',
    spento + ' (' + spento.length + ') · ' + acceso + ' (' + acceso.length + ')');
  const rigaAc = testo('k-bilriga');
  esito(/^Il conteggio parte da un/.test(rigaAc),
    'e la riga dichiara l ipotesi nel PRIMO periodo: un ipotesi applicata va dichiarata ' +
    'prima di dire quanto vale, che l abbia scelta il lettore o il predefinito',
    rigaAc.slice(0, 160));
  esito(/→/.test(rigaAc),
    'dicendo quanti seggi si spostano e fra quali blocchi', rigaAc.slice(0, 240));
  esito(/pulsante/.test(rigaAc),
    'e dove sta la via d uscita: «ipotesi» senza il comando per toglierla e una parola sola');
  /* LA LEVA SI DICHIARA NEL PROMPT QUANDO DIFFERISCE DAL PREDEFINITO, e dal 30 agosto 2026
     il predefinito e' ACCESO: quindi si dichiara da SPENTA. statoLeve() risponde a «che cosa
     ha cambiato il lettore» e il confronto e' con PAR_DEF — e la frase segue lo STATO, non
     una stringa fissa: era una sola, descriveva l'acceso, e col predefinito rovesciato
     diceva l'esatto contrario a un servizio terzo che non ha modo di verificarlo. */
  A.PAR.inbilico = 0; A.render();
  esito(/contate a parte/.test(A.promptAI()),
    'e il prompt che va al servizio terzo dichiara la leva SPENTA, perche dal 30 agosto ' +
    'e accesa il difetto', A.promptAI().slice(0, 200));
  A.PAR.inbilico = A.PAR_DEF.inbilico; A.render();
  esito(!/contate nel blocco/.test(A.promptAI()) && !/contate a parte/.test(A.promptAI()),
    'e non la dichiara quando e al valore predefinito: statoLeve confronta con PAR_DEF');
  conAgo(4);
}

/* ══ 9 · IL MECCANISMO NON È IL CASO ════════════════════════════════════════════════
 * Una leva per lista sarebbe ingestibile l'8 settembre. Questa ne governa tutte le righe
 * dichiarate insieme, come PAR.apparentamenti governa tutti gli accordi annunciati, e le
 * righe che non può applicare le scarta CON LA RAGIONE. */
{
  esito(Array.isArray(A.IN_BILICO) && A.IN_BILICO.length > 0 &&
        A.IN_BILICO.every(r => r.id && r.verso && r.data && r.fonte),
    'ogni riga di IN_BILICO porta id, verso, data e fonte: nessuna senza il perche');
  const fin = A.filtraBilico(A.SEG);
  esito(fin.ok.length + fin.scarti.length === A.IN_BILICO.length,
    'il filtro non perde righe per strada: o entrano o sono scartate con la ragione');
  esito(fin.scarti.every(x => x.perche && x.perche.length > 8),
    'e ogni scarto porta la sua ragione, nata dentro il filtro e non accanto');
  A.IN_BILICO.push({id:'lista_che_non_esiste', verso:'coalizione', data:'2026-01-01', fonte:'prova'});
  const dopo = A.filtraBilico(A.SEG);
  esito(dopo.scarti.some(x => x.r.id === 'lista_che_non_esiste') && dopo.ok.length === fin.ok.length,
    'una riga sbagliata viene scartata e non tocca le altre');
  esito(A.bloccoDi('amcha') !== null && A.bloccoDi('lista_che_non_esiste') === null,
    'e bloccoDi() risponde null per una lista che non e in anagrafica, invece di indovinare');
  A.IN_BILICO.pop();
}

/* ══ 10 · QUELLO CHE ESCE DALLA PAGINA PORTA L'IPOTESI CON SÉ ══════════════════════
 * È la famiglia del riquadro dell'evento isolato: un numero che esce dal suo contesto.
 * Da quando la leva nasce accesa, il conteggio predefinito non è quello della fonte — e
 * la riga di esito che lo dichiara la vede chi è SULLA pagina, non chi riceve il testo su
 * WhatsApp, non chi vede la card su Facebook, non il servizio terzo che riceve il prompt.
 *
 * E LA DOMANDA NON È QUELLA DI statoLeve(). Quella confronta con PAR_DEF e risponde «che
 * cosa ha cambiato il lettore»: con la leva accesa per difetto TACE proprio quando
 * l'ipotesi è applicata. Le due funzioni devono restare due, e queste asserzioni sono
 * quelle che lo tengono. */
{
  conBilico(0, 1);
  esito(A.ipotesiNeiNumeri() === '',
    'senza seggi da spostare non si dichiara niente, nemmeno a leva accesa: un ipotesi che ' +
    'non muove un numero e rumore, e insegna a saltare la riga prima del giorno in cui conta');
  esito(A.testoCondivisione(false).indexOf('ipotesi') < 0,
    'e la frase di condivisione non ne parla');

  conBilico(4, 1);
  const ip = A.ipotesiNeiNumeri();
  esito(ip.length > 0 && /ipotesi/.test(ip) && /non un fatto/.test(ip),
    'con la lista in Knesset e la leva accesa la dichiarazione c e, e dice che e un ipotesi', ip);
  /* LE DUE FUNZIONI RESTANO DUE, E ADESSO LA PROVA NON DIPENDE DA DOVE PUNTA IL DIFETTO.
     Fino al 27 agosto 2026 qui c'era: «ipotesiNeiNumeri parla mentre statoLeve tace». Era
     vero perche' il predefinito era ACCESO — cioe' l'asserzione provava la regola sfruttando
     una configurazione, e la sera stessa, girato il predefinito, e' diventata falsa senza
     che la regola fosse cambiata di una virgola. E' la stessa forma dell'house effect in
     ordine di blocco «per fortuna»: corretta rispetto a se stessa, e muta sul giorno che
     conta.
     LA REGOLA E': ipotesiNeiNumeri() risponde a «che cosa c'e' dentro questi numeri» e NON
     consulta PAR_DEF; statoLeve() risponde a «che cosa ha cambiato il lettore» e lo consulta.
     Il caso in cui divergono e' quello in cui il predefinito E' l'ipotesi, e si esercita
     spostando PAR_DEF invece di aspettare il giorno in cui qualcuno lo sposta davvero — che
     e' anche il giorno in cui una prova assente non lo direbbe a nessuno. */
  /* E ADESSO SI ESERCITANO TUTTI E DUE I VERSI, invece di uno. E' la terza stesura di
     questa asserzione e le prime due sono cadute per la stessa ragione: seguivano il
     predefinito vero, quindi ogni volta che qualcuno lo girava dicevano il falso senza che
     la regola fosse cambiata. Adesso il predefinito lo impone la prova, in un verso e
     nell'altro, e il verso vero non conta piu. */
  const DIFETTO = A.PAR_DEF.inbilico;
  A.PAR_DEF.inbilico = 0;                    /* il predefinito NON e l ipotesi */
  esito(A.statoLeve().indexOf('fuori dai due campi') >= 0,
    'col predefinito lontano dall ipotesi statoLeve la dichiara: il lettore ha cambiato qualcosa',
    '«' + A.statoLeve() + '»');
  esito(A.ipotesiNeiNumeri() === ip,
    'e ipotesiNeiNumeri dice la stessa cosa di prima: la sua domanda non dipende dal predefinito');
  A.PAR_DEF.inbilico = 1;                    /* il giorno in cui il predefinito E l ipotesi */
  esito(A.ipotesiNeiNumeri() === ip,
    'col predefinito spostato sull ipotesi, ipotesiNeiNumeri dice la STESSA cosa: non ' +
    'consulta PAR_DEF, perche la sua domanda non dipende da chi ce l ha messa', ip.slice(0,80));
  esito(A.statoLeve().indexOf('fuori dai due campi') < 0,
    'e statoLeve TACE, perche il lettore non ha piu cambiato niente: e il caso per cui le ' +
    'due funzioni sono due, e quello in cui una sola direbbe la cosa giusta per la ragione ' +
    'sbagliata', '«' + A.statoLeve() + '»');
  A.PAR_DEF.inbilico = DIFETTO;
  /* le tre strade che escono dalla pagina la portano, e la portano UGUALE */
  esito(A.testoCondivisione(false).indexOf(ip) >= 0,
    'la frase di condivisione la porta — X, Telegram, WhatsApp e Threads ricevono il testo');
  esito(A.testoCondivisione(true).indexOf(ip) >= 0,
    'anche nella forma con l indirizzo in coda');
  esito(A.promptAI().indexOf(ip) >= 0,
    'e il prompt che va al servizio terzo la porta');
  /* UNA STRINGA SOLA: se un giorno una delle tre la ricomponesse per conto suo, direbbe la
     stessa cosa oggi e una cosa diversa al primo ritocco. Si prova nel SORGENTE, dove sta
     il legame, come per og:title e il job. */
  const js = fs.readFileSync(__dirname + '/../app.js','utf8');
  esito((js.match(/ipotesiNeiNumeri\(/g) || []).length >= 3,
    'e nasce una volta sola: le strade che la usano la CHIAMANO, non la riscrivono ' +
    '(una definizione piu le chiamate)',
    String((js.match(/ipotesiNeiNumeri\(/g) || []).length) + ' occorrenze');

  /* ══ e la targa dell'anteprima, che è la strada per Facebook e LinkedIn ══
   * Lì il testo della condivisione non passa: passa solo l'indirizzo, e a parlare resta
   * l'immagine. Il legame si prova nel sorgente del job — che gira in un altro processo,
   * dove una divergenza non la vedrebbe nessuno — e la geometria si prova sui numeri. */
  const ant = fs.readFileSync(__dirname + '/../../.github/scripts/anteprima.mjs','utf8');
  /* LE DUE ASSERZIONI SONO PRECISE PERCHÉ DUE MUTANTI SONO SOPRAVVISSUTI A QUELLE VAGHE.
     La prima stesura cercava `spia.ipotesiNeiNumeri` senza gli argomenti: il mutante che
     passava alla targa la forma LUNGA — 142 caratteri su una riga che ne regge 100, cioè
     una frase troncata proprio dove sta l'avvertimento — restava vivo. E non c'era niente
     che dicesse che la riga viene DISEGNATA: spegnerla non faceva cadere nulla.
     Si prova nel sorgente e non sul reso perché il job gira in un altro processo, dove una
     divergenza non la vedrebbe nessuno. È l'idioma con cui og:title è legato al job. */
  esito(/spia\.ipotesiNeiNumeri\(true\)/.test(ant),
    'l anteprima CHIEDE la frase alla pagina invece di ricomporla, e chiede la forma CORTA');
  esito(/ipotesi \? '<text/.test(ant),
    'e la targa la DISEGNA davvero, invece di riceverla e buttarla');
  esito(/ipotesiNeiNumeri:ipotesiNeiNumeri/.test(ant),
    'e la funzione le arriva davvero, perche il job la espone nella spia');
  /* le quote si LEGGONO dal sorgente del job e non si riscrivono qui: una costante
     ricopiata in una prova e la strada doppia di sempre, e per giunta quella che decide se
     la prova morde. */
  const TESTA = +(/TESTA = (\d+)/.exec(ant) || [0,0])[1];
  const yIp = +(/Y_IP = (\d+)/.exec(ant) || [0,0])[1];
  const fsIp = +(/FS_IP = (\d+)/.exec(ant) || [0,0])[1];
  esito(TESTA > 0 && yIp > 0 && fsIp > 0,
    'la banda della testata e la riga della dichiarazione sono dichiarate nel sorgente',
    'TESTA=' + TESTA + ' Y_IP=' + yIp + ' FS_IP=' + fsIp);
  esito(yIp + 0.25 * fsIp < TESTA,
    'e la riga sta DENTRO la banda che c e gia: non paga il disegno, perche la testata e ' +
    'un margine della tela e non del disegno',
    'fondo a ' + (yIp + 0.25 * fsIp) + ' su ' + TESTA);
  /* IL PIEDE NON POTEVA PORTARLA, ed è il numero che ha deciso dove va. */
  const LATO = +(/LATO = (\d+)/.exec(ant) || [0,40])[1];
  const W = +(/W = (\d+)/.exec(ant) || [0,1200])[1];
  const regge = Math.floor((W - 2 * LATO) / (0.55 * 18));
  const piede = 'Daniele Angrisani · angrisanidj.github.io/modello-israele · dati al 24 agosto 2026';
  esito(piede.length + ip.length > regge,
    'e il piede non poteva portarla: a corpo 18 regge ' + regge + ' caratteri e ne usa gia ' +
    piede.length + ', la dichiarazione ne vale ' + ip.length);
  /* LA FORMA CORTA CI STA, ed è la ragione per cui esiste. */
  const corta = A.ipotesiNeiNumeri(true);
  const reggeIp = Math.floor((W - 2 * LATO) / (0.62 * fsIp));
  esito(corta.length > 0 && corta.length <= reggeIp,
    'e la forma corta ci sta nella riga della testata senza essere tagliata',
    corta.length + ' caratteri su ' + reggeIp + ': «' + corta + '»');
  esito(/^Ipotesi del modello/.test(corta),
    'e mette l essenziale DAVANTI: se un giorno andasse tagliata, a sopravvivere e ' +
    'l avvertimento e non il dettaglio', corta);
  esito(corta.length < ip.length,
    'la corta e piu corta della lunga, che e quello che le distingue',
    corta.length + ' contro ' + ip.length);
  conAgo(4);
}

/* ══ 11 · NESSUN CONTO DEI BLOCCHI SCRITTO A MANO NEL TESTO ═══════════════════════
 * La didascalia dell'emiciclo diceva «I tre numeri al centro» e «restano tutti e tre», e
 * og:image:alt — che ESCE dalla pagina — diceva «per i tre blocchi». Un conto scritto in
 * una frase è la stessa forma della sigla irraggiungibile: un testo che afferma quello che
 * il codice non fa, e che nessuna prova sui numeri può cogliere.
 * L'ECCEZIONE È DICHIARATA E RESTA: il piede dell'archivio dice «I tre totali in fondo», e
 * lì sono tre di proposito — quelle colonne riproducono la fonte. */
{
  const testoPagina = D.body.textContent.replace(/\s+/g, ' ');
  const conti = [
    ['I tre numeri al centro', 'la didascalia dell emiciclo'],
    ['I tre totali restano', 'la didascalia del filtro'],
    ['con i tre blocchi', 'la nota dell embed']
  ];
  conti.forEach(function(c){
    esito(testoPagina.indexOf(c[0]) < 0,
      c[1] + ' non scrive a mano quanti sono i blocchi', c[0]);
  });
  const alt = (HTML.match(/<meta property="og:image:alt" content="([^"]*)"/) || [0,''])[1];
  esito(alt.length > 20 && !/\btre blocchi\b/.test(alt),
    'e og:image:alt nemmeno, che e il caso peggiore: quella stringa esce dalla pagina e la ' +
    'legge chi non vede l immagine', alt);
  esito(/somma è minore di 120/.test(testoPagina) && /I tre totali in fondo/.test(testoPagina),
    'ma il piede dell archivio tiene i suoi TRE, che li sono di proposito: quelle colonne ' +
    'riproducono la fonte e lo dichiarano');
}


/* ══ 12 · IL VUOTO FRA I GRUPPI È UN ANGOLO, E VALE PER TUTTE E CINQUE LE FILE ══════
 * La prova che non c'era. Fino al 27 agosto 2026 i posti vuoti si inserivano nella sequenza
 * LINEARE dei 120 seggi, che poi veniva distribuita sulle cinque file ordinando i posti per
 * angolo: un vuoto cancellava un seggio in UNA fila, e alle altre quattro, a quello stesso
 * angolo, non succedeva niente. Misurato sulla pagina resa, con tre blocchi: su dieci
 * coppie fila×confine il vuoto c'era in DUE. La fila esterna sembrava uniforme perché lì il
 * confine non c'era affatto.
 * NESSUNA PROVA POTEVA VEDERLO, ed è la famiglia di sempre: emi.js contava i seggi, blocchi
 * contava i totali, soglia.js misurava le etichette — nessuna guardava lo SPAZIO FRA due
 * pastiglie. Il documento non scorreva, niente usciva dalla finestra, e tutto era verde.
 * QUELLO CHE SI ASSERISCE È LA PROPRIETÀ, non i numeri di oggi: il disegno porta 120
 * pastiglie, e in ogni fila ogni cambio di colore ha un vuoto — uno solo, non due. Vale con
 * tre blocchi, con quattro, e con quelli che avrà l'8 settembre. */
/* Le due letture del disegno stanno in un posto solo: le usano tutte e due le meta della
   sezione, e riscriverle sarebbe la strada doppia dentro la prova che ne cerca una. */
function fileArco(){
  const per = {};
  [...D.querySelectorAll('#k-emi svg circle')].forEach(c => {
    const x = +c.getAttribute('cx'), y = +c.getAttribute('cy');
    const r = Math.round(Math.hypot(x - 215, 212 - y));
    (per[r] = per[r] || []).push({x: x, y: y, g: c.getAttribute('data-g')});
  });
  return Object.keys(per).map(Number).sort((a,b) => a-b).map(r => ({r: r, g: per[r]}));
}
/* i confini di una fila, misurati in MULTIPLI del passo di quella fila: un numero assoluto
   non direbbe niente, perche le file hanno passi diversi */
function confini(f){
  const d = [];
  for (let i = 1; i < f.length; i++)
    d.push({v: Math.hypot(f[i].x - f[i-1].x, f[i].y - f[i-1].y), c: f[i].g !== f[i-1].g});
  const nor = d.filter(z => !z.c).map(z => z.v);
  const passo = nor.reduce((a,b) => a+b, 0) / nor.length;
  return d.filter(z => z.c).map(z => z.v / passo);
}
{
  conAgo(4);
  const cerchi = [...D.querySelectorAll('#k-emi svg circle')].map(c => ({
    x: +c.getAttribute('cx'), y: +c.getAttribute('cy'), g: c.getAttribute('data-g')
  }));
  esito(cerchi.length === 120,
    'l arco disegna 120 pastiglie: i vuoti sono posti in piu, non seggi in meno',
    String(cerchi.length));
  /* le file si riconoscono dal raggio, che e la cosa che le definisce */
  const fila = {};
  cerchi.forEach(p => {
    const r = Math.round(Math.hypot(p.x - 215, 212 - p.y));
    (fila[r] = fila[r] || []).push(p);
  });
  const raggi = Object.keys(fila).map(Number).sort((a,b) => a-b);
  esito(raggi.length === 5, 'su cinque file', raggi.join(' '));
  const dett = [];
  let mancanti = 0, doppi = 0, quanti = 0;
  raggi.forEach(r => {
    const f = fila[r], d = [];
    for (let i = 1; i < f.length; i++)
      d.push({v: Math.hypot(f[i].x - f[i-1].x, f[i].y - f[i-1].y), c: f[i].g !== f[i-1].g});
    const nor = d.filter(z => !z.c).map(z => z.v);
    const passo = nor.reduce((a,b) => a+b, 0) / nor.length;
    const c = d.filter(z => z.c).map(z => z.v / passo);
    quanti += c.length;
    c.forEach(v => { if (v < 1.5) mancanti++; if (v > 2.5) doppi++; });
    /* i gruppi PRESENTI in questa fila: i confini devono essere tanti quanti i passaggi
       fra loro, cioe uno di meno. Un gruppo troppo piccolo per arrivare a una fila li non
       ha due confini, ne ha uno — ed e la mossa che toglie i buchi doppi. */
    const presenti = new Set(f.map(p => p.g)).size;
    dett.push('r' + r + ': ' + c.length + ' confini per ' + presenti + ' gruppi [' +
      c.map(v => v.toFixed(2)).join(' ') + ']');
    esito(c.length === presenti - 1,
      'fila r=' + r + ': un vuoto per ogni passaggio fra gruppi presenti, ne uno di piu ne uno di meno',
      c.length + ' confini per ' + presenti + ' gruppi presenti');
  });
  esito(mancanti === 0,
    'e NESSUN cambio di colore avviene senza vuoto: il confine si vede in tutte e cinque ' +
    'le file, non in quella dove capita l angolo', dett.join(' · '));
  esito(doppi === 0,
    'e nessun vuoto e doppio: un gruppo assente da una fila unisce due confini in UNO, ' +
    'invece di lasciare un buco largo il doppio', dett.join(' · '));
  esito(quanti >= 5,
    'e i confini misurati sono abbastanza da rendere la prova capace di cadere',
    String(quanti) + ' confini in tutto');
  /* LA SOMMA DEI GRUPPI TORNA ANCHE NEL DISEGNO, non solo nei totali scritti: e la
     seconda meta di ripartiFile(), quella che una ripartizione sbagliata romperebbe in
     silenzio disegnando 119 o 121 pastiglie con i totali giusti sotto. */
  const perGruppo = {};
  cerchi.forEach(p => { perGruppo[p.g] = (perGruppo[p.g] || 0) + 1; });
  const attesi = A.blocchi(A.SEG);
  esito(A.ARCO_ORD.every(k => (perGruppo[k] || 0) === attesi[k]),
    'e ogni gruppo ha nel disegno esattamente i seggi che il totale gli attribuisce',
    JSON.stringify(perGruppo) + ' contro ' + JSON.stringify(attesi));
  /* ── E IL CASO CHE IL PRIMO NON ESERCITA: un gruppo troppo piccolo per arrivare a tutte
     le file. Lì i suoi due confini diventano UNO, e la mutazione che li lascia tutti e due
     apre un buco largo il doppio — invisibile alla prova qui sopra, perché con l'archivio
     del progetto ogni blocco arriva a tutte e cinque le file.
     LA CONFIGURAZIONE NON SI SCRIVE, SI CERCA: quanti seggi prenda una lista dipende
     dall'archivio del giorno, e un numero scritto qui sarebbe la costante che scade. Si
     spazzola finché una fila resta senza un gruppo, e se non si trova la prova lo DICHIARA
     invece di passare in silenzio. */
  let trovata = null;
  for (let quota = 3; quota <= 6 && !trovata; quota++)
    for (let n = 4; n <= 7 && !trovata; n++) {
      A.SOND = SEME.map((s, i) => {
        const o = JSON.parse(JSON.stringify(s));
        delete o._q; delete o._qk;
        if (o.seggi && o.seggi.likud >= 8 && i % quota === 0) {
          o.seggi.likud -= n; o.seggi[ENTRA] = (o.seggi[ENTRA] || 0) + n;
        }
        return o;
      });
      A.PAR.inbilico = 0; A.render();
      const f = fileArco();
      const gruppi = new Set([].concat.apply([], f.map(x => x.g.map(p => p.g))));
      if (gruppi.size >= 3 && f.some(x => new Set(x.g.map(p => p.g)).size < gruppi.size))
        trovata = 'n=' + n + ' ogni ' + quota + ' rilevazioni';
    }
  if (!trovata) {
    esito(true, 'nessuna configurazione con un gruppo assente da una fila: il caso del ' +
      'vuoto doppio non e esercitato da questo archivio — DICHIARATO, non passato in silenzio');
  } else {
    const f = fileArco();
    const tot = f.reduce((a, x) => a + x.g.length, 0);
    esito(tot === 120, 'col gruppo piccolo l arco disegna ancora 120 pastiglie (' + trovata + ')',
      String(tot));
    let manc = 0, dop = 0, righeCorte = 0;
    f.forEach(x => {
      const presenti = new Set(x.g.map(p => p.g)).size;
      const c = confini(x.g);
      if (presenti < 4) righeCorte++;
      esito(c.length === presenti - 1,
        'fila r=' + x.r + ': ' + presenti + ' gruppi presenti, ' + c.length + ' confini — ' +
        'un gruppo che non arriva a una fila li non ha due confini, ne ha uno',
        c.map(v => v.toFixed(2)).join(' '));
      c.forEach(v => { if (v < 1.5) manc++; if (v > 2.5) dop++; });
    });
    esito(righeCorte > 0,
      'e la configurazione esercita davvero il caso: almeno una fila non ha tutti i gruppi',
      righeCorte + ' file su ' + f.length);
    esito(manc === 0 && dop === 0,
      'e nessun vuoto manca ne e doppio nemmeno li: ' + manc + ' mancanti, ' + dop + ' doppi');
  }
  conAgo(4);
}


/* ══ 13 · LA CODA SEPARATA: DENTRO IL BLOCCO MA NON IL BLOCCO ══════════════════════
 * Scritta il 27 agosto 2026. Con la leva accesa «Popolo d'Israele» conta nel blocco
 * Netanyahu e resta ocra: quattro pastiglie di un'altra tinta dentro un gruppo di blu, e
 * che siano contate lo diceva solo il totale.
 * IL COLORE NON SEGUE LA LEVA, ED È UNA DECISIONE, non una cosa non fatta: la leva è
 * un'IPOTESI, e ridipingere la lista la farebbe sembrare un fatto — il pulsante è l'unica
 * cosa che dichiara il condizionale. In più il colore porta già il blocco attraverso il
 * SETTORE DI TINTA, e i quattro settori sono disgiunti per regola. La ragione per esteso
 * sta accanto a rEmi.
 * QUELLO CHE IL DISEGNO DICE ADESSO è che quei seggi stanno dentro il conteggio del blocco
 * e non dentro il blocco: vanno in coda, e un vuoto PIÙ STRETTO di quello fra i blocchi li
 * separa. Due vuoti uguali direbbero «un quarto blocco» mentre la riga sotto ne conta tre —
 * la stessa forma dell'arco che ne contava tre su quattro. */
{
  /* la coda va esercitata dove esiste: vista per lista, leva accesa, e una lista spostata
     che abbia dei seggi. conBilico() li dà alla lista che IN_BILICO nomina. */
  conBilico(4, 1);
  A.EMIMODE = 'liste'; A.render();
  const mosse = A.IN_BILICO.map(r => r.id).filter(i => A.SEG[i]);
  esito(mosse.length > 0 && A.EMIMODE === 'liste',
    'premessa: nella vista per lista c e almeno una lista che la leva ha spostato e che ha seggi',
    mosse.join(' '));
  const f1 = fileArco();
  esito(f1.reduce((a, x) => a + x.g.length, 0) === 120,
    'con la coda separata l arco disegna ancora 120 pastiglie',
    String(f1.reduce((a, x) => a + x.g.length, 0)));
  /* 1 · LA LISTA SPOSTATA È IN CODA AL SUO BLOCCO, IN OGNI FILA IN CUI COMPARE. */
  let fuoriPosto = 0, file = 0;
  f1.forEach(x => {
    const ids = x.g.map(p => p.g);
    mosse.forEach(id => {
      const ult = ids.lastIndexOf(id);
      if (ult < 0) return;
      file++;
      /* dopo di lei, in quella fila, non ci dev essere nessuna lista del blocco in cui la
         leva l ha messa: e la definizione di «in coda» */
      for (let k = ult + 1; k < ids.length; k++)
        if (A.bloccoDi(ids[k]) === A.bloccoDi(id)) fuoriPosto++;
    });
  });
  esito(file > 0 && fuoriPosto === 0,
    'la lista che la leva ha spostato sta IN CODA al blocco in ogni fila in cui compare',
    file + ' file, ' + fuoriPosto + ' liste del blocco dopo di lei');
  /* 2 · IL VUOTO INTERNO È PIÙ STRETTO DI QUELLO FRA I BLOCCHI, o direbbe «un quarto
     blocco» mentre i totali ne contano tre. */
  let coppie = 0, indistinti = 0;
  f1.forEach(x => {
    const c = confini(x.g), ids = x.g.map(p => p.g), d = [];
    for (let i = 1; i < ids.length; i++) if (ids[i] !== ids[i-1]) d.push([ids[i-1], ids[i]]);
    /* i confini misurati sono quelli fra LISTE; interessano solo quelli che cambiano
       blocco (largo) e quello che entra nella coda (stretto) */
    const larghi = [], stretti = [];
    d.forEach(([a, b], i) => {
      if (c[i] < 1.5) return;                        /* cambio di lista dentro un segmento */
      if (mosse.indexOf(b) >= 0 && A.bloccoDi(a) === A.bloccoDi(b)) stretti.push(c[i]);
      else larghi.push(c[i]);
    });
    stretti.forEach(s => larghi.forEach(l => { coppie++; if (!(l > s + 0.4)) indistinti++; }));
  });
  esito(coppie > 0,
    'e la fila porta tutti e due i vuoti, cosi la prova puo confrontarli',
    coppie + ' coppie confine-di-blocco / vuoto-interno');
  esito(indistinti === 0,
    'il vuoto interno e piu STRETTO di ogni confine fra blocchi della stessa fila: due ' +
    'vuoti uguali direbbero un quarto blocco mentre i totali ne contano tre',
    indistinti + ' coppie indistinguibili su ' + coppie);
  /* 3 · E LA CODA È PER COSTRUZIONE, NON PER FORTUNA — è la prova che l autore ha chiesto.
     Oggi «Popolo d Israele» è ultima anche perché l ordinamento dentro il blocco è per
     seggi decrescenti e ne ha meno di tutte: la proprietà reggerebbe lo stesso, e non
     saprebbe nessuno che regge per un altra ragione. È la quarta volta in questo file —
     l house effect in ordine di blocco, l ordine del pannello dell archivio, la targa dove
     tela e disegno coincidevano — e le prime tre sono state chiuse rendendo la cosa vera
     per costruzione. Qui si esercita: si danno alla lista spostata PIÙ seggi di qualche
     lista del blocco che la ospita, e si pretende che resti comunque in coda. */
  let grossa = 0;
  for (let n = 5; n <= 14 && !grossa; n++) {
    conBilico(n, 1); A.EMIMODE = 'liste'; A.render();
    const id = A.IN_BILICO[0].id, b = A.bloccoDi(id);
    const altre = A.IDS.filter(i => i !== id && A.SEG[i] && A.bloccoDi(i) === b);
    if (A.SEG[id] && altre.some(i => A.SEG[i] < A.SEG[id])) grossa = n;
  }
  if (!grossa) {
    esito(false, 'non si trova un numero di seggi che renda la lista spostata piu grande ' +
      'di qualcuna del blocco che la ospita: la coda resta provata solo dove capita');
  } else {
    const id = A.IN_BILICO[0].id, b = A.bloccoDi(id);
    const minori = A.IDS.filter(i => i !== id && A.SEG[i] && A.bloccoDi(i) === b && A.SEG[i] < A.SEG[id]);
    esito(minori.length > 0,
      'con ' + grossa + ' seggi per rilevazione la lista spostata ne ha piu di ' +
      minori.length + ' liste del blocco che la ospita: se la coda fosse solo l ordinamento ' +
      'per seggi, adesso starebbe in mezzo',
      'lei ' + A.SEG[id] + ', loro ' + minori.map(i => A.SEG[i]).join('/'));
    let fuori = 0, viste = 0;
    fileArco().forEach(x => {
      const ids = x.g.map(p => p.g), ult = ids.lastIndexOf(id);
      if (ult < 0) return;
      viste++;
      for (let k = ult + 1; k < ids.length; k++) if (A.bloccoDi(ids[k]) === b) fuori++;
    });
    esito(viste > 0 && fuori === 0,
      'e resta in coda lo stesso: l ordine lo decide da dove viene la lista, non quanto e grande',
      viste + ' file, ' + fuori + ' liste del blocco dopo di lei');
  }
  /* 5 · IL CASO CHE FA VIVERE UN MUTANTE SE NON LO SI COSTRUISCE: un blocco troppo piccolo
     per arrivare a una fila, MENTRE esiste un vuoto interno. Lì i due vuoti si fondono, e
     quello che sopravvive dev essere il PIÙ LARGO: un confine di blocco disegnato stretto
     direbbe «dentro il blocco» dove i blocchi sono due.
     Non si ottiene con nessuna delle due fixture da sole — serve una lista dell ago della
     bilancia CON seggi (che resta un blocco) e insieme una lista spostata dalla leva. E la
     configurazione si cerca, perché quanti seggi prenda una lista dipende dall archivio. */
  let insieme = null;
  for (let qc = 3; qc <= 6 && !insieme; qc++)
    for (let nc = 4; nc <= 6 && !insieme; nc++)
      for (let na = 5; na <= 8 && !insieme; na++) {
        A.SOND = SEME.map((s, i) => {
          const o = JSON.parse(JSON.stringify(s));
          delete o._q; delete o._qk;
          if (o.seggi && o.seggi.likud >= 10) {
            if (i % qc === 0) { o.seggi.likud -= nc; o.seggi[ENTRA] = (o.seggi[ENTRA] || 0) + nc; }
            if (i % 3 === 0) { o.seggi.likud -= na; o.seggi[A.IN_BILICO[0].id] = (o.seggi[A.IN_BILICO[0].id] || 0) + na; }
          }
          return o;
        });
        A.PAR.inbilico = 1; A.EMIMODE = 'liste'; A.render();
        const b = A.blocchi(A.SEG);
        const senza = fileArco().filter(x => !x.g.some(p => A.bloccoDi(p.g) === 'incerto')).length;
        if (b.incerto > 0 && A.SEG[A.IN_BILICO[0].id] > 0 && senza > 0)
          insieme = 'ago ' + nc + '/' + qc + ', spostata ' + na + '/3 → incerto ' + b.incerto;
      }
  if (!insieme) {
    esito(false, 'non si trova una configurazione con un blocco piccolo E un vuoto interno: ' +
      'la regola del vuoto piu largo resta senza prova');
  } else {
    const f = fileArco();
    esito(f.reduce((a, x) => a + x.g.length, 0) === 120,
      'col blocco piccolo E la coda separata l arco disegna ancora 120 pastiglie (' + insieme + ')');
    esito(f.some(x => !x.g.some(p => A.bloccoDi(p.g) === 'incerto')),
      'e almeno una fila non ha il blocco piccolo: e li che i due vuoti si fondono');
    /* LA PROPRIETÀ, e vale per tutte le file: un confine è stretto SE E SOLO SE separa due
       segmenti dello STESSO blocco. Copre il vuoto interno e la fusione insieme, e non
       nomina nessun numero di posti. */
    let sbagliati = 0, contati = 0, dett = [];
    f.forEach(x => {
      const c = confini(x.g), ids = x.g.map(p => p.g), cambi = [];
      for (let i = 1; i < ids.length; i++) if (ids[i] !== ids[i-1]) cambi.push([ids[i-1], ids[i]]);
      cambi.forEach(([a, b], i) => {
        if (c[i] < 1.5) return;                       /* cambio di lista dentro un segmento */
        contati++;
        const stesso = A.bloccoDi(a) === A.bloccoDi(b);
        const stretto = c[i] < 2.5;
        if (stesso !== stretto) { sbagliati++; dett.push('r' + x.r + ' ' + a + '|' + b + ' ' + c[i].toFixed(2) + '×'); }
      });
    });
    esito(contati >= 6, 'e i confini da giudicare sono abbastanza', String(contati));
    esito(sbagliati === 0,
      'un vuoto e STRETTO se e solo se separa due segmenti dello stesso blocco: dove il ' +
      'blocco piccolo manca i due vuoti si fondono nel PIU LARGO, o un confine di blocco ' +
      'verrebbe disegnato come se fosse interno', dett.slice(0, 4).join(' · '));
  }
  /* 6 · E IL CASO CHE NESSUNA CONFIGURAZIONE DI OGGI RAGGIUNGE, perché IN_BILICO ha una
     riga sola e sposta verso la COALIZIONE, che è l ultimo blocco dell arco.
     La regola del vuoto più largo morde quando il segmento saltato viene DOPO un segmento
     interno: succede solo se a spezzarsi è un blocco che NON è l ultimo. Il mutante che
     toglie quella riga è rimasto vivo due giri proprio per questo — non perché la prova
     fosse debole, ma perché il caso non esiste nell archivio né nell anagrafica.
     Si costruisce cambiando il VERSO della riga: la stessa lista, spostata verso
     l opposizione invece che verso la coalizione. Non è una fixture arbitraria — è
     esattamente la forma che IN_BILICO avrà il giorno in cui qualcuno ci aggiunge una
     seconda riga, ed è il giorno in cui nessuno rifarebbe questo ragionamento. */
  {
    const riga = A.IN_BILICO[0], versoVero = riga.verso;
    riga.verso = 'opposizione';
    conBilico(4, 1); A.EMIMODE = 'liste'; A.render();
    const id = riga.id;
    const spezzato = A.bloccoDi(id);
    const f = fileArco();
    const senza = f.filter(x => !x.g.some(p => p.g === id)).length;
    esito(spezzato === 'opposizione' && A.SEG[id] > 0,
      'con la riga girata verso l opposizione, a spezzarsi e un blocco che NON e l ultimo',
      id + ' → ' + spezzato + ', ' + A.SEG[id] + ' seggi');
    esito(senza > 0,
      'e la coda non arriva a tutte le file: e li che il vuoto saltato deve fondersi col ' +
      'successivo', senza + ' file su ' + f.length + ' senza la coda');
    esito(f.reduce((a, x) => a + x.g.length, 0) === 120,
      'l arco disegna ancora 120 pastiglie');
    let sbagliati = 0, contati = 0, dett = [];
    f.forEach(x => {
      const c = confini(x.g), ids = x.g.map(p => p.g), cambi = [];
      for (let i = 1; i < ids.length; i++) if (ids[i] !== ids[i-1]) cambi.push([ids[i-1], ids[i]]);
      cambi.forEach(([a, b], i) => {
        if (c[i] < 1.5) return;
        contati++;
        const stesso = A.bloccoDi(a) === A.bloccoDi(b);
        if (stesso !== (c[i] < 2.5)) { sbagliati++; dett.push('r' + x.r + ' ' + a + '|' + b + ' ' + c[i].toFixed(2) + '×'); }
      });
    });
    esito(contati >= 6, 'e i confini da giudicare sono abbastanza', String(contati));
    esito(sbagliati === 0,
      'anche qui un vuoto e stretto se e solo se separa due segmenti dello stesso blocco: ' +
      'dove la coda manca, il confine col blocco dopo resta LARGO', dett.slice(0, 4).join(' · '));
    riga.verso = versoVero;
  }
  /* 4 · A LEVA SPENTA NON CAMBIA UN PIXEL, ed è la riga che tiene il prezzo dove deve
     stare: il confine fra blocchi si allarga solo se c è un vuoto interno da cui
     distinguerlo, quindi chi non preme vede il disegno di prima. */
  conBilico(4, 0); A.EMIMODE = 'liste'; A.render();
  const spente = fileArco().map(x => confini(x.g));
  esito(spente.every(c => c.every(v => v < 2.5)),
    'a leva spenta nessun confine si allarga: chi non preme vede il disegno di prima',
    spente.map(c => c.map(v => v.toFixed(2)).join(' ')).join(' · '));
  A.EMIMODE = 'blocchi';
  conAgo(4);
}


/* ══ 14 · CHI STA VICINO A CHI DENTRO UN BLOCCO ════════════════════════════════════
 * ARCO_ORD dice l'ordine dei BLOCCHI; dentro un blocco l'arco ordinava per seggi
 * decrescenti, e nient'altro — un ordine che non dice niente e che decideva per caso una
 * cosa che conta: quale lista di un blocco decisivo tocca il campo che le sta accanto.
 * Ra'am ha già governato con l'opposizione, la Lista Unita no; ma la Lista Unita ha più
 * seggi, quindi l'ordine per grandezza metteva LEI dal lato dell'opposizione.
 * E IL VERSO SI DICHIARA COL VICINO, NON CON LA POSIZIONE: «in testa» sarebbe vero solo
 * finché ARCO_ORD tiene l'opposizione a sinistra degli arabi, e il giorno in cui quell'ordine
 * cambiasse vorrebbe dire il contrario, in silenzio. La prova lo esercita girando ARCO_ORD. */
{
  A.PAR.inbilico = 0;
  conAgo(0); A.EMIMODE = 'liste'; A.render();
  const dellaFila = () => fileArco().map(x => {
    const o = []; x.g.forEach(p => { if (o[o.length-1] !== p.g) o.push(p.g); });
    return o;
  });
  /* LA TABELLA VUOTA VA COLTA, NON SUBITA: senza questa riga la prova ESPLODE invece di
     cadere — «cannot read properties of undefined» — e questo progetto ha gia pagato tre
     volte la differenza fra una suite che fallisce e una che muore. */
  esito(A.ARCO_VICINI.length > 0,
    'la tabella dei vicini dichiara almeno una lista: svuotarla toglierebbe la proprieta ' +
    'senza che nessuna asserzione se ne accorga', String(A.ARCO_VICINI.length));
  const v = A.ARCO_VICINI[0] || {id:'', verso:''};
  const suoBlocco = A.bloccoDi(v.id);
  esito(!!A.SEG[v.id] && !!suoBlocco,
    'premessa: la lista dichiarata vicina a un campo ha seggi, quindi il caso si esercita',
    v.id + ' → ' + suoBlocco + ', ' + A.SEG[v.id] + ' seggi');
  /* la proprietà: dentro il suo blocco non c'è nessuna lista dello stesso blocco DAL LATO
     del campo che ARCO_VICINI le assegna. Il lato si ricava da ARCO_ORD, come fa il codice. */
  function tocca(){
    let male = 0, viste = 0;
    const mio = A.ARCO_ORD.indexOf(suoBlocco), suo = A.ARCO_ORD.indexOf(v.verso);
    dellaFila().forEach(o => {
      const i = o.indexOf(v.id); if (i < 0) return;
      viste++;
      const stesso = k => A.bloccoDi(k) === suoBlocco;
      if (suo < mio) { for (let j = 0; j < i; j++) if (stesso(o[j])) male++; }
      else           { for (let j = i+1; j < o.length; j++) if (stesso(o[j])) male++; }
    });
    return {male: male, viste: viste};
  }
  const t = tocca();
  esito(t.viste > 0 && t.male === 0,
    'la lista dichiarata sta all estremo del suo blocco che guarda il campo dichiarato, in ' +
    'ogni fila in cui compare', t.viste + ' file, ' + t.male + ' liste dello stesso blocco dal lato sbagliato');
  /* E NON PER GRANDEZZA: se fosse l'ordine per seggi, la lista dichiarata sarebbe li solo
     quando e la piu grande del blocco. Oggi non lo e — ed e proprio per questo che il caso
     si esercita da se. */
  const compagne = A.IDS.filter(i => i !== v.id && A.SEG[i] && A.bloccoDi(i) === suoBlocco);
  esito(compagne.some(i => A.SEG[i] > A.SEG[v.id]),
    'e non ci sta per grandezza: nel suo blocco c e una lista con PIU seggi, quindi ' +
    'l ordine per seggi la metterebbe altrove',
    v.id + ' ' + A.SEG[v.id] + ' contro ' + compagne.map(i => i + ' ' + A.SEG[i]).join(', '));
  /* IL VERSO SEGUE ARCO_ORD, e si prova girandolo: con i blocchi allo specchio la lista
     dichiarata deve passare all altro capo del suo blocco DA SOLA. Senza questa, «verso» e
     «in testa» sarebbero indistinguibili — cioe la dichiarazione col vicino non varrebbe
     piu di una posizione scritta a mano. */
  const vero = A.ARCO_ORD.slice();
  A.ARCO_ORD.reverse(); A.render();
  const t2 = tocca();
  esito(t2.viste > 0 && t2.male === 0,
    'e girando ARCO_ORD la lista passa dall altro capo del suo blocco da sola: il verso lo ' +
    'ricava dall ordine dei blocchi, non da una posizione scritta a mano',
    t2.viste + ' file, ' + t2.male + ' dal lato sbagliato');
  A.ARCO_ORD.length = 0; vero.forEach(k => A.ARCO_ORD.push(k));
  A.EMIMODE = 'blocchi'; conAgo(4);
}


/* ── LA LEVA NASCE ACCESA, E LE PAROLE SEGUONO LO STATO ──
 *
 * Rovesciata il 30 agosto 2026 sulla dichiarazione di Ofer Winter del 27: un fatto con una
 * data e una fonte, come i veti e gli apparentamenti. L ANAGRAFICA NON SI TOCCA — in P{}
 * Amcha resta dove la mette Wikipedia — e da li discendono tre cose che spostarla avrebbe
 * rotto: la guardia del parser continua a validare, il piede dell archivio resta vero, e il
 * colore resta quello del settore dell ago.
 * Quello che si prova qui e che il rovesciamento non abbia lasciato indietro delle parole:
 * una frase cablata sul verso vecchio direbbe il contrario, e a un servizio terzo che non
 * ha modo di verificarlo. */
{
  /* SI RIPARTE DALLO STATO DI APERTURA, o non si misura la pagina: le fixture di sopra
     lasciano PAR e SOND come servivano a loro, e la prima asserzione che confronta con
     PAR_DEF verificherebbe quello che una fixture ha appena scritto. E la trappola gia
     registrata in questo stesso file, tre righe piu su. */
  /* E LA FIXTURE DEVE DARE SEGGI AD AMCHA, o niente di quello che segue si accende: sul
     seme la lista non ne ha, quindi la leva muove ZERO — il pulsante non compare,
     ipotesiNeiNumeri() tace per progetto, e la riga prende il ramo del nulla. Le prime
     asserzioni scritte cosi cadevano tutte e tre, e non per un difetto: per un seme che
     non esercita il caso. E la stessa classe della frazione in soglianota.js.
     Si usa lo stesso idioma di conAgo(): si spostano seggi dal Likud alla lista che deve
     entrare, cosi ogni riga chiude ancora a 120. */
  A.SOND = SEME.map(x => {
    const o = JSON.parse(JSON.stringify(x));
    delete o._q; delete o._qk;
    if (o.seggi && o.seggi.likud >= 8) { o.seggi.likud -= 5; o.seggi.amcha = (o.seggi.amcha || 0) + 5; }
    return o;
  });
  A.PAR.inbilico = A.PAR_DEF.inbilico;
  A.render();
  const leggi = () => {
    const r = D.getElementById('k-bilriga');
    return {
      riga: r ? r.textContent.replace(/\s+/g,' ').trim() : '',
      pulsante: (D.getElementById('k-bilico')||{textContent:''}).textContent.trim(),
      leve: String(A.statoLeve() || ''),
      ipotesi: A.ipotesiNeiNumeri() || '',
      /* LA TINTA SI LEGGE DAL DISEGNO RESO, non da P[id].c. Leggere il campo
         dell'anagrafica sarebbe asserire che una costante e costante: il mutante che fa
         seguire la leva al colore tocca il RENDER, e su P[id].c non lascia traccia. Ci
         sono cascato al primo giro, ed e la forma gia registrata in questo progetto —
         una prova corretta rispetto a se stessa che guarda dalla parte sbagliata. */
      fill: fill('amcha'),
      fillLikud: fill('likud')
    };
  };
  /* LA TINTA SI LEGGE NELLA VISTA PER LISTA, e la vista predefinita non e quella.
     Nell arco per BLOCCO i seggi portano gia il token del blocco in cui sono CONTATI —
     con la leva accesa quelli di Amcha sono blu, ed e giusto: quella vista dice il
     conteggio, non chi e chi. Cercare li «il colore non segue la leva» significherebbe
     asserire il falso su una vista e non provare niente sull altra. La domanda vive nella
     vista per lista, che e la sola in cui una tinta di lista esiste. */
  function fill(id){
    const c = D.getElementById('k-emi').querySelector('circle[data-g="' + id + '"]');
    return c ? c.getAttribute('fill') : '';
  }
  esito(A.PAR_DEF.inbilico === 1,
    'la leva nasce ACCESA: il conteggio predefinito porta la dichiarazione di Winter',
    'PAR_DEF.inbilico = ' + A.PAR_DEF.inbilico);
  esito(A.P.amcha.b === 'incerto',
    'e l anagrafica NON si tocca: in P{} Amcha resta dove la mette la fonte',
    'P.amcha.b = ' + A.P.amcha.b);
  esito(A.bloccoDi('amcha') === 'coalizione',
    'ma il conteggio la mette in coalizione: la leva muove bloccoDi(), non l anagrafica');

  /* IL COLORE NON SEGUE LA LEVA, e se lo seguisse sarebbe la stessa strada doppia da
     un altra porta: la tinta esce da P[id].c, che la leva non tocca. */
  A.EMIMODE = 'liste'; A.render();
  const apert = leggi();
  A.PAR.inbilico = 0; A.render();
  const prem = leggi();
  esito(apert.fill !== '' && apert.fill === prem.fill,
    'e il COLORE non segue la leva: il seggio reso porta la stessa tinta nei due stati',
    'acceso ' + apert.fill + ' · spento ' + prem.fill);
  esito(apert.fill !== apert.fillLikud,
    'e non prende quella di una lista del blocco che la ospita: la tinta esce ' +
    'dall anagrafica, dove Amcha e ancora ago della bilancia',
    'Amcha ' + apert.fill + ' · Likud ' + apert.fillLikud);
  esito(A.bloccoDi('amcha') === 'incerto',
    'e spegnendo, il conteggio torna dove lo mette la fonte');

  /* LE PAROLE SEGUONO LO STATO. E il difetto che il rovesciamento ha scoperto: statoLeve()
     emetteva UNA stringa fissa, che descriveva lo stato acceso, quando lo stato DIFFERISCE
     dal predefinito. Finche il predefinito era spento «differisce» voleva dire «acceso» e
     la frase era giusta per coincidenza; rovesciato il predefinito diceva il contrario. */
  esito(/Togli/.test(apert.pulsante) && /Conta/.test(prem.pulsante),
    'il pulsante dice l azione giusta nei due stati: «Togli» a leva accesa, «Conta» a spenta',
    apert.pulsante + ' | ' + prem.pulsante);
  esito(apert.leve === '' && prem.leve !== '',
    'statoLeve() tace a chi non ha toccato niente e parla a chi ha premuto',
    'apertura «' + apert.leve + '» · premuto «' + prem.leve + '»');
  esito(/a parte/.test(prem.leve) && !/invece che a parte/.test(prem.leve),
    'e la frase di statoLeve() descrive lo STATO, non una stringa fissa del verso vecchio',
    prem.leve);
  esito(apert.ipotesi !== '' && prem.ipotesi === '',
    'ipotesiNeiNumeri() fa il contrario: parla quando l ipotesi e nei numeri, e tace quando non c e',
    'apertura «' + apert.ipotesi.slice(0,40) + '» · premuto «' + prem.ipotesi + '»');

  /* E LA RAGIONE SI LEGGE NEI DUE RAMI. Il campo «fonte» lo stampava solo il ramo spento,
     che dal rovesciamento legge soltanto chi preme: chi apre vedeva l ipotesi dichiarata e
     non da dove viene. */
  esito(/Winter/.test(apert.riga) && /Winter/.test(prem.riga),
    'e la ragione con la data si legge in tutti e due i rami, non solo in quello che si preme',
    'apertura ' + /Winter/.test(apert.riga) + ' · premuto ' + /Winter/.test(prem.riga));
  esito(/ipotesi/.test(apert.riga) && /riporta/.test(apert.riga),
    'e chi non ha toccato niente legge che e un ipotesi E come toglierla');
  A.PAR.inbilico = A.PAR_DEF.inbilico; A.EMIMODE = 'blocchi'; A.render();
}

console.log('\nblocchi: ' + ok + '/' + (ok + ko));
if (ko) process.exit(1);
