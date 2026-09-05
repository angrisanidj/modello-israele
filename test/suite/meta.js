/* LE META CHE LEGGE CHI NON ESEGUE IL JAVASCRIPT, e il legame fra og:title e l'h1.
 *
 * Un aggregatore — Facebook, X, WhatsApp, Slack, il primo passo di Googlebot — legge il
 * FILE SERVITO. Non aspetta il render, non esegue niente, e di questa pagina vede il
 * <head> e il markup di ripiego. Da qui due domande diverse, ed è la ragione per cui
 * questa suite esiste invece di stare tutta dentro struttura.mjs:
 *
 *   1 · CHE COSA SI LEGGE SENZA JAVASCRIPT. Prima di questo commit non c'era nessuna
 *       description, e la misura del 23 agosto 2026 dice che gli aggregatori ripiegavano
 *       in due modi diversi, sbagliati tutti e due: chi prende il testo del corpo così
 *       com'è trovava il FOGLIO DI STILE — che in questo file sta dentro il body — e chi
 *       toglie prima il foglio trovava il selettore del tema, l'h1 e poi L'AVVISO DI
 *       AVVIO, cioè «Il modello non è ancora partito». La prova non deduce: costruisce il
 *       DOM senza eseguire gli script e guarda.
 *
 *   2 · CHE og:title SIA LA STESSA FRASE DEL <title>, non un secondo titolo per lo stesso
 *       stato. og:title lo scrive il lavoro notturno, dentro index.html, perché il render
 *       non arriva a chi lo legge; il <title> lo scrive il render. Sono due strade per la
 *       stessa frase, e la seconda passa per UN ALTRO PROCESSO, dove nessuno la vedrebbe
 *       divergere: se un giorno rTitolo() cambiasse il modo di scegliere la forma, la
 *       scheda di condivisione resterebbe indietro in silenzio. Le lega titoloCortoOra(),
 *       e questa suite lega titoloCortoOra() a formaTitolo() su tutte e dodici le celle —
 *       non sulla sola cella che l'archivio di oggi produce, che sarebbe un legame provato
 *       sul caso che c'è.
 *
 * E la regione che il job può riscrivere: scriviMeta() è pura, quindi si prova senza DOM e
 * senza toccare il disco — compresi i modi in cui deve RIFIUTARSI di scrivere, che sono la
 * parte che conta, perché è lì che nasce il permesso di toccare index.html.
 */
const {JSDOM} = require('jsdom');
const fs = require('fs');
const path = require('path');

let ok = 0, ko = 0;
function esito(cond, desc, dettaglio){
  if (cond) { ok++; console.log('OK ' + desc); }
  else { ko++; console.log('KO ' + desc + (dettaglio ? ' — ' + dettaglio : '')); }
}

const RADICE = path.join(__dirname, '..', '..');
const HTML = fs.readFileSync(path.join(RADICE, 'index.html'), 'utf8');

/* ══ 1 · QUELLO CHE VEDE UN AGGREGATORE ══════════════════════════════════════════
 *
 * jsdom costruisce l'albero senza eseguire niente: è esattamente la condizione di chi
 * legge il file servito. Non si stubba nulla e non si chiama nessun render — se lo si
 * facesse, la prova misurerebbe la pagina calcolata, cioè la cosa che l'aggregatore NON
 * vede, e passerebbe dicendo di aver guardato. */
(function(){
  const D = new JSDOM(HTML).window.document;
  const meta = n => {
    const e = D.querySelector('meta[name="' + n + '"], meta[property="' + n + '"]');
    return e ? e.getAttribute('content') : null;
  };
  const descr = meta('description');
  esito(!!descr && descr.length >= 70,
    'la description c\'e\' nel file servito, senza eseguire una riga di JavaScript',
    descr ? descr.length + ' caratteri' : 'assente');
  esito(meta('og:description') === descr,
    'og:description porta la stessa stringa: due strade, un testo');
  esito(!!meta('og:title'), 'og:title c\'e\'');
  esito(meta('og:type') === 'website', 'og:type e\' website', String(meta('og:type')));
  esito(/^summary/.test(meta('twitter:card') || ''),
    'twitter:card e\' una scheda summary', String(meta('twitter:card')));
  const canon = D.querySelector('link[rel=canonical]');
  esito(!!canon && canon.getAttribute('href') === meta('og:url') &&
        /^https:\/\//.test(meta('og:url') || ''),
    'canonical e og:url sono lo stesso indirizzo https');
  /* L'ASSERZIONE SI È GIRATA, come diceva il commento che stava qui: fino al 24 agosto 2026
     pretendeva che og:image NON ci fosse, perché dichiarare un'immagine che nessun file
     produce è una promessa che nessuno mantiene. Adesso l'immagine c'è, la genera
     .github/scripts/anteprima.mjs, e twitter:card è passata a summary_large_image NELLO
     STESSO COMMIT. Non è un'attesa riparata: è un'attesa diventata obsoleta di proposito.
     Quello che si prova adesso è la stessa proprietà dal verso opposto — i due valori
     restano coerenti fra loro, e il file dichiarato esiste davvero. */
  esito(!!meta('og:image'), 'og:image c\'è', 'og:image=' + meta('og:image'));
  esito(meta('twitter:card') === 'summary_large_image',
    'e twitter:card è coerente con la sua presenza', meta('twitter:card'));
  esito(meta('og:image:width') === '1200' && meta('og:image:height') === '630',
    'e ne dichiara le misure, che è quello che gli aggregatori leggono per riservare il posto',
    meta('og:image:width') + '×' + meta('og:image:height'));
  esito(!!meta('og:image:alt') && meta('og:image:alt').length > 30,
    'e ha un testo alternativo: l\'anteprima la incontra anche chi non la vede',
    meta('og:image:alt'));
  /* IL FILE DICHIARATO ESISTE. Una meta che punta a un'immagine che non c'è è peggio di
     nessuna meta: l'aggregatore riserva il posto e mostra un riquadro rotto. */
  {
    const percorso = require('path').join(__dirname, '..', '..', 'dati', 'anteprima.png');
    esito(require('fs').existsSync(percorso),
      'e il file che dichiara esiste davvero nel repository', percorso);
    /* e l'indirizzo dichiarato è quello del file, non un altro: si compone dal canonical */
    const can = meta('og:url') || '';
    /* si confronta l'indirizzo SENZA impronta: «?v=<hash>» e' una chiave di cache, non
       parte del percorso, e dal 29 agosto 2026 c'e' sempre in pagina. */
    const imgNuda = meta('og:image').split('?')[0];
    esito(imgNuda.indexOf(can) === 0 && /dati\/anteprima\.png$/.test(imgNuda),
      'e l\'indirizzo si compone sul canonical, invece di essere un secondo indirizzo',
      meta('og:image'));
  }

  /* IL DIFETTO CHE LA DESCRIPTION CHIUDE, misurato invece che dedotto: che cosa
     prenderebbe un aggregatore se dovesse ripiegare sul corpo. Le due forme di ripiego. */
  const corpoGrezzo = D.body.textContent.replace(/\s+/g, ' ').trim();
  const c = D.body.cloneNode(true);
  c.querySelectorAll('style,script,noscript').forEach(e => e.remove());
  const corpoPulito = c.textContent.replace(/\s+/g, ' ').trim();
  esito(/^#kn26\s*\{/.test(corpoGrezzo),
    'ripiego A — il testo del corpo cosi\' com\'e\' comincia col foglio di stile, che sta dentro il body',
    corpoGrezzo.slice(0, 48));
  esito(/Il modello non è ancora partito/.test(corpoPulito.slice(0, 400)),
    'ripiego B — tolto il foglio, entro i primi 400 caratteri c\'e\' l\'avviso di avvio',
    corpoPulito.slice(0, 60));
  /* E la proprietà per cui il rimedio è un rimedio: la description NON è nessuno dei due
     ripieghi. Senza di lei l'aggregatore sceglieva fra due frasi sbagliate; con lei non
     sceglie affatto. */
  esito(!!descr && !/kn26|non è ancora partito/.test(descr) &&
        descr !== corpoGrezzo.slice(0, descr.length) &&
        descr !== corpoPulito.slice(0, descr.length),
    'la description non e\' nessuno dei due ripieghi: quando c\'e\', l\'aggregatore non ci arriva');
})();

/* ══ 2 · og:title È titoloCortoOra(), SU TUTTE E DODICI LE CELLE ══════════════════ */
const dom = new JSDOM('<!doctype html><html><body><div id="kn26"></div></body></html>', {pretendToBeVisual:true});
const W = dom.window, D = W.document;
global.DOMParser = W.DOMParser;
D.body.innerHTML = HTML.replace(/<script>[\s\S]*?<\/script>/g,'')
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
  'global.A={titoloCortoOra:titoloCortoOra,titoloCorto:titoloCorto,formaTitolo:formaTitolo,' +
  'blocchi:blocchi,votoPassato:votoPassato,cellaTitolo:cellaTitolo,' +
  'TIT_CORTO_PRIMA:TIT_CORTO_PRIMA,TIT_CORTO_DOPO:TIT_CORTO_DOPO,TIT_CODA:TIT_CODA,' +
  'SEG:function(){return SEG;},setSEG:function(v){SEG=v;},IDS:IDS,render:render};' +
  'carica().then(render,render)');
eval(src);
try{ A.render(); }catch(e){ console.log('KO il render non e\' partito — ' + (e && e.message)); }

esito(typeof A.titoloCortoOra === 'function',
  'titoloCortoOra() esiste: il <title> e og:title hanno una funzione sola');
esito(A.titoloCortoOra() === A.titoloCorto(A.formaTitolo(A.blocchi(A.SEG())), A.votoPassato()),
  'titoloCortoOra() E\' titoloCorto(formaTitolo(blocchi(SEG)), votoPassato())',
  A.titoloCortoOra());
esito(D.title === A.titoloCortoOra(),
  'dopo il render il <title> del documento e\' quello che la funzione restituisce',
  D.title + ' / ' + A.titoloCortoOra());
esito(A.titoloCortoOra().slice(-A.TIT_CODA.length) === A.TIT_CODA,
  'il titolo porta la coda che dice di che paese e di che anno si parla');

/* LE DODICI CELLE, e non le tre che l'archivio di oggi produce. Per ciascuna si costruisce
   un SEG che la fa scattare, si chiede titoloCortoOra() e si verifica che dica il testo di
   quella cella. Così un giorno in cui il modello si sposta su una cella mai vista non è il
   giorno in cui si scopre che il legame valeva per una sola.
   Gli id dei quattro blocchi si SCOPRONO chiedendo a blocchi() dove finisce un seggio,
   invece di scriverli: l'8 settembre l'anagrafica cambia, e un elenco scritto qui sarebbe
   la copia che resta indietro — la stessa che il controllo strutturale vieta al codice. */
(function(){
  const campione = {};
  /* Gli id si prendono da IDS e non da SEG: SEG porta le sole liste con seggi, e oggi
     l'ago della bilancia non ne ha nessuno — la prima stesura di questa prova ne trovava
     tre su quattro e cadeva, avendo ragione. L'anagrafica c'e' sempre; i seggi no. */
  A.IDS.forEach(id => {
    const uno = {}; uno[id] = 1;
    const b = A.blocchi(uno);
    const q = b.coalizione ? 'coalizione' : b.opposizione ? 'opposizione'
            : b.arabo ? 'arabo' : b.incerto ? 'incerto' : null;
    if (q && !campione[q]) campione[q] = id;
  });
  const quattro = ['coalizione','opposizione','arabo','incerto'].every(k => campione[k]);
  esito(quattro, 'i quattro blocchi hanno un id campione in SEG, letto dall\'anagrafica',
    JSON.stringify(campione));
  if (!quattro) return;

  /* Quale quaterna produca quale cella è una proprietà di formaTitolo(), non un fatto da
     ricopiare: si spazzola un reticolo e si tiene la prima quaterna che porta a ciascuna. */
  const perCella = {};
  for (let c = 0; c <= 120; c += 1)
    for (let o = 0; o <= 120 - c; o += 1)
      for (let a = 0; a <= 120 - c - o; a += 13){
        const k = A.cellaTitolo(A.formaTitolo({coalizione:c, opposizione:o, arabo:a,
                                               incerto:120 - c - o - a}));
        if (!perCella[k]) perCella[k] = [c, o, a];
      }
  const celle = Object.keys(A.TIT_CORTO_PRIMA);
  const coperte = celle.filter(k => perCella[k]);
  esito(coperte.length === celle.length,
    'il reticolo raggiunge tutte e ' + celle.length + ' le celle del titolo corto',
    'mancano: ' + celle.filter(k => !perCella[k]).join(', '));

  const salva = A.SEG();
  const divergenti = [], visti = {};
  coperte.forEach(k => {
    const q = perCella[k], seg = {};
    seg[campione.coalizione] = q[0]; seg[campione.opposizione] = q[1];
    seg[campione.arabo] = q[2]; seg[campione.incerto] = 120 - q[0] - q[1] - q[2];
    A.setSEG(seg);
    const fo = A.formaTitolo(A.blocchi(seg));
    const atteso = A.titoloCorto(fo, A.votoPassato());
    const avuto = A.titoloCortoOra();
    if (avuto !== atteso || A.cellaTitolo(fo) !== k) divergenti.push(k);
    visti[k] = avuto;
  });
  A.setSEG(salva);
  esito(!divergenti.length,
    'su tutte e ' + coperte.length + ' le celle titoloCortoOra() dice il testo di quella cella',
    divergenti.join(', '));
  /* Un legame che regge perché la funzione restituisce sempre la stessa frase non è un
     legame: le celle devono produrre titoli diversi, o l'asserzione qui sopra non prova
     niente. È lo stesso difetto delle asserzioni tautologiche già trovate in questo banco. */
  const distinti = Object.keys(visti).map(k => visti[k])
    .filter((x, i, a) => a.indexOf(x) === i).length;
  esito(distinti >= 10, 'le celle producono titoli distinti: il legame non regge per costanza',
    String(distinti) + ' distinti su ' + coperte.length);
})();

/* ══ 3 · scriviMeta(): LA REGIONE, E I MODI IN CUI DEVE RIFIUTARSI ═══════════════
 *
 * È la funzione che dà al lavoro notturno il permesso di toccare index.html, quindi la
 * parte che conta non è che scriva: è che NON scriva quando la regione non c'è più. Un job
 * che «ripara» un marcatore mancante indovinando dove metterlo è esattamente il modo in
 * cui un'eccezione stretta smette di esserlo. */
(async function(){
  const mod = await import('file:///' +
    path.join(RADICE, '.github', 'scripts', 'aggiorna.mjs').replace(/\\/g, '/'));
  const {scriviMeta, MARCA_INIZIO, MARCA_FINE} = mod;

  /* IL JOB NON RICOMPONE IL TITOLO, e questa è la sola asserzione che possa dirlo: le
     altre guardano la funzione, e la funzione resta giusta anche se nessuno la chiama.
     Il legame fra og:title e formaTitolo() vive in un ALTRO PROCESSO — un modulo Node che
     nessun render esercita — quindi qui si legge il sorgente del job e si pretende che il
     titolo esca da titoloCortoOra() e che formaTitolo(), titoloCorto() e le tabelle dei
     testi non compaiano affatto. È il controllo strutturale applicato alla lingua invece
     che alla composizione dei blocchi: coglie la FORMA della strada doppia prima che la
     strada doppia dica due cose diverse. */
  const JOB = fs.readFileSync(path.join(RADICE, '.github', 'scripts', 'aggiorna.mjs'), 'utf8');
  /* I COMMENTI SI TOLGONO PRIMA DI CERCARE, ed è la lezione di test/css.js: la prima
     stesura trovava «formaTitolo» e «TIT_CORTO» dentro il commento che SPIEGA perché non
     vanno usati, cioè falliva sul testo scritto per non farla fallire. E si cerca nel
     codice anche la chiamata, o basterebbe nominarla in un commento per essere verdi. */
  const jobCodice = JOB.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
  esito(/A\.titoloCortoOra\(\)/.test(jobCodice),
    'il job prende og:title da titoloCortoOra(), la stessa funzione del <title>');
  const ricomposto = ['formaTitolo', 'titoloCorto(', 'TIT_CORTO', 'TIT_CODA', 'cellaTitolo']
    .filter(t => jobCodice.indexOf(t) >= 0);
  esito(!ricomposto.length,
    'e non ne ricompone nessun pezzo per conto suo', ricomposto.join(', '));

  const TIT = 'Netanyahu a 51, uno dalla maggioranza · Knesset 2026';
  const fatto = scriviMeta(HTML, TIT);
  esito(fatto !== null, 'scriviMeta() riscrive index.html cosi\' com\'e\' oggi');
  esito(!!fatto && fatto.indexOf('<meta property="og:title" content="' + TIT + '">') >= 0,
    'og:title porta il titolo passato');
  /* NIENTE FUORI DALLA REGIONE: la differenza fra il file di prima e quello di dopo deve
     stare tutta fra i due marcatori. È la stessa proprietà che test/struttura.mjs verifica
     sul diff di git dentro il job; qui si verifica sulla funzione, dove non serve un
     repository per farla cadere. */
  if (fatto){
    const iA = HTML.indexOf(MARCA_INIZIO), iB = HTML.indexOf(MARCA_FINE);
    const jA = fatto.indexOf(MARCA_INIZIO), jB = fatto.indexOf(MARCA_FINE);
    esito(HTML.slice(0, iA) === fatto.slice(0, jA),
      'tutto quello che precede il marcatore d\'apertura e\' identico');
    esito(HTML.slice(iB) === fatto.slice(jB),
      'tutto quello che segue il marcatore di chiusura e\' identico');
    esito(iA === jA, 'il commento che spiega la regola resta al suo posto, byte per byte');
  }
  /* IDEMPOTENTE: la seconda notte con lo stesso titolo non deve produrre un diff, o il job
     committerebbe ogni notte una riga identica — e un commit che non cambia niente rende
     invisibile quello che cambia qualcosa. */
  esito(!!fatto && scriviMeta(fatto, TIT) === fatto,
    'riscrivere lo stesso titolo non cambia un byte: nessun commit a vuoto');
  /* e con un titolo diverso il file cambia: un idempotente che non scrive mai è verde */
  esito(!!fatto && scriviMeta(fatto, 'Vigilia: due blocchi a 60, stallo pieno · Knesset 2026') !== fatto,
    'con un titolo diverso il file cambia davvero');

  /* I RIFIUTI. Ciascuno è un modo in cui il <head> può essere stato riscritto da una
     persona, e in tutti il job deve fermarsi invece di indovinare. */
  esito(scriviMeta(HTML.replace(MARCA_INIZIO, '<!-- altro'), 'x') === null,
    'senza il marcatore d\'apertura, scriviMeta() rifiuta');
  esito(scriviMeta(HTML.replace(MARCA_FINE, '<!-- altro -->'), 'x') === null,
    'senza il marcatore di chiusura, scriviMeta() rifiuta');
  esito(scriviMeta(MARCA_FINE + '\n' + MARCA_INIZIO + ' -->', 'x') === null,
    'marcatori invertiti: rifiuta invece di scrivere alla rovescia');
  esito(scriviMeta('<head>' + MARCA_INIZIO + '\n' + MARCA_FINE, 'x') === null,
    'marcatore d\'apertura senza «-->» prima della fine: rifiuta');

  /* IL TITOLO ENTRA IN UN ATTRIBUTO, e i testi di TIT_CORTO_* non hanno virgolette OGGI.
     «Oggi» non è una garanzia: l'8 settembre una lista nuova può portarne una nel nome. */
  const grezzo = 'Lista "X" & <b>Y</b> · Knesset 2026';
  const velenoso = scriviMeta(HTML, grezzo);
  esito(!!velenoso && velenoso.indexOf(
      'content="Lista &quot;X&quot; &amp; &lt;b&gt;Y&lt;/b&gt; · Knesset 2026">') >= 0,
    'virgolette, & e angolari nel titolo vengono protetti prima di entrare nell\'attributo');
  if (velenoso){
    const e = new JSDOM(velenoso).window.document.querySelector('meta[property="og:title"]');
    esito(!!e && e.getAttribute('content') === grezzo,
      'e un browser rilegge esattamente il titolo di partenza');
  /* ── 4 · LE DUE META, e l'impronta che sta nell'indirizzo ──────────────────────────
     Dal 29 agosto 2026 la regione ne ammette due. og:image porta «?v=<hash>» perché un
     aggregatore può fallire in DUE modi e ne era stato guardato uno solo: se non rilegge la
     pagina l'impronta non serve, ma se rilegge la pagina e serve l'IMMAGINE dalla propria
     cache l'impronta è l'unica cosa che lo chiude. Su WhatsApp, che non ha nessuno
     strumento pubblico di rilettura, è la sola leva che esista.
     I DUE VALORI NASCONO IN DUE MOMENTI DIVERSI dello stesso job — il titolo al passo del
     parser, l'impronta al passo dell'anteprima, che gira dopo perché disegna l'archivio
     appena aggiornato — quindi ciascuno passa quello che sa e l'altro si conserva. Sono
     queste due conservazioni la proprietà da provare: senza, il secondo a scrivere
     cancellerebbe il lavoro del primo e il commit uscirebbe con una meta sola. */
  const conV = scriviMeta(HTML, TIT, 'abc123def456');
  esito(!!conV && conV.indexOf('dati/anteprima.png?v=abc123def456') > 0,
    'og:image porta l\'impronta passata, appesa all\'indirizzo');
  esito(!!conV && conV.indexOf('content="' + TIT + '"') > 0,
    'e nello stesso passaggio og:title resta quello passato');

  const soloTit = scriviMeta(HTML, TIT);
  const imgOra = (HTML.match(/<meta property="og:image" content="([^"]*)">/) || [])[1];
  esito(!!soloTit && !!imgOra && soloTit.indexOf(imgOra) > 0,
    'senza impronta og:image resta quella già in pagina: il parser non cancella il lavoro ' +
    'del generatore dell\'anteprima');

  const soloImg = scriviMeta(HTML, null, 'ffffff000000');
  const titOra = (HTML.match(/<meta property="og:title" content="([^"]*)">/) || [])[1];
  esito(!!soloImg && !!titOra && soloImg.indexOf('content="' + titOra + '"') > 0,
    'e senza titolo og:title resta quello già in pagina: il generatore dell\'anteprima non ' +
    'cancella il lavoro del parser');
  esito(!!soloImg && soloImg.indexOf('?v=ffffff000000') > 0,
    'e intanto l\'impronta nuova entra davvero');

  esito(!!conV && scriviMeta(conV, TIT, 'abc123def456') === conV,
    'riscrivere la stessa impronta non cambia un byte: una notte senza rilevazioni nuove ' +
    'non butta la cache di nessuno');

  const senzaTit = HTML.replace(/<meta property="og:title"[^>]*>/, '');
  esito(scriviMeta(senzaTit, null, 'abc123def456') === null,
    'e senza titolo né passato né in pagina rifiuta, invece di scrivere una regione monca');

  /* L'IMPRONTA È DEL CONTENUTO E NON DELLA DATA, e si prova sul sorgente perché il
     generatore non è esercitabile qui. È la differenza fra «una notte a vuoto non butta la
     cache di nessuno» e «ogni notte la butta per non dire niente di nuovo». */
  const srcAnt = fs.readFileSync(path.join(RADICE, '.github', 'scripts', 'anteprima.mjs'), 'utf8');
  /* L'ANCORA È LA RIGA CHE CALCOLA, NON IL NOME DELLA FUNZIONE. Era «function impronta(»,
     e il 31 agosto 2026 quella funzione è stata rinominata in scriviLeDue() perché adesso
     scrive tutte e due le meta: la prova è caduta senza che la proprietà fosse cambiata di
     un carattere. Un'ancora sul nome misura come si chiama il codice; questa misura che
     cosa fa. */
  const rigaImp = srcAnt.split('\n').find(l => l.indexOf('createHash(') >= 0) || '';
  const fnImp = rigaImp;
  esito(fnImp.indexOf('update(png)') > 0 && !/new Date|toISOString|Date\.now/.test(fnImp),
    'l\'impronta si calcola sui BYTE del png e non sulla data: una notte senza rilevazioni ' +
    'nuove lascia l\'indirizzo identico');

  }
})().then(function(){
  
/* ══ LO STUB DEL GENERATORE NON PUO MENTIRE SU QUALE FILE SERVE ══════════════════════
 * Il finto fetch di anteprima.mjs rispondeva l ARCHIVIO a qualunque indirizzo, quindi nel
 * job GIRO restava nullo e composizioneCambiata() era falsa PER COSTRUZIONE: og:title
 * avrebbe continuato ad affermare mentre la pagina taceva. Uno stub che mente su quale
 * file sta servendo rende vacua la prova che gli sta sopra — e la prova che gli sta sopra
 * e quella che lega og:title al titolo in pagina. */
{
  const g = fs.readFileSync(__dirname + '/../../.github/scripts/anteprima.mjs', 'utf8');
  const riga = g.split(String.fromCharCode(10)).filter(r => r.indexOf('global.fetch') >= 0).join(' ');
  esito(g.indexOf('da-fare.json') >= 0 && riga.indexOf('(u)') >= 0,
    'il finto fetch del generatore serve il file CHIESTO, non l archivio per ogni indirizzo',
    riga.trim().slice(0, 110));
}

console.log('\n' + ok + '/' + (ok + ko));
  if (ko) process.exit(1);
});
