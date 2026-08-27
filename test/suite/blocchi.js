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
  'blocchi:blocchi,render:render,PRESET:PRESET,TOT_ORD:TOT_ORD,TOT_SIGLA:TOT_SIGLA,' +
  'testoCondivisione:testoCondivisione,promptAI:promptAI,serieModello:serieModello,' +
  'get SOND(){return SOND;},set SOND(v){SOND=v;},get SEG(){return SEG;},' +
  'get PAR(){return PAR;},PAR_DEF:PAR_DEF,statoLeve:statoLeve,' +
  'ipotesiNeiNumeri:ipotesiNeiNumeri,set SIM(v){SIM=v;}};})();';
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
function conAgo(seggi){
  A.SOND = SEME.map(s => {
    const o = JSON.parse(JSON.stringify(s));
    delete o._q; delete o._qk;
    if (seggi && o.seggi && o.seggi.likud >= 8) {
      o.seggi.likud -= seggi; o.seggi[ENTRA] = (o.seggi[ENTRA] || 0) + seggi;
    }
    return o;
  });
  /* al DIFETTO, non a zero: dal 27 agosto la leva nasce accesa, e una fixture che la
     spegnesse proverebbe uno stato che il lettore non incontra mai. */
  A.PAR.inbilico = A.PAR_DEF.inbilico;
  A.render();
}
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
  esito(t.map(z => z.g).join(',') === A.TOT_ORD.filter(k => CON[k]).join(','),
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

/* ══ 2 · NESSUNA VOCE IRRAGGIUNGIBILE ═══════════════════════════════════════════════
 * Il difetto di partenza, in una riga: la tabella delle sigle dichiarava «incerti» e la
 * riga dei totali era cablata a tre chiavi. Una sigla che nessuno stato può mostrare è
 * codice che dice una cosa mentre il disegno ne fa un'altra. */
esito(Object.keys(A.TOT_SIGLA).sort().join(',') === CHIAVI.slice().sort().join(','),
  'ogni blocco ha la sua sigla e nessuna sigla e di un blocco che non esiste',
  Object.keys(A.TOT_SIGLA).sort().join(','));
esito(A.TOT_ORD.slice().sort().join(',') === Object.keys(A.TOT_SIGLA).sort().join(','),
  'e l ordine dell arco copre esattamente le sigle dichiarate: nessuna irraggiungibile',
  A.TOT_ORD.join(','));

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
function conBilico(seggi){
  const id = A.IN_BILICO[0].id;
  A.SOND = SEME.map(s => {
    const o = JSON.parse(JSON.stringify(s));
    delete o._q; delete o._qk;
    if (seggi && o.seggi && o.seggi.likud >= 8) {
      o.seggi.likud -= seggi; o.seggi[id] = (o.seggi[id] || 0) + seggi;
    }
    return o;
  });
  A.PAR.inbilico = A.PAR_DEF.inbilico;
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
  conBilico(4);
  A.PAR.inbilico = 0; A.render();
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
 * Dal 27 agosto 2026 la leva nasce ACCESA: chi apre la pagina e non tocca niente sta
 * guardando un conteggio che la fonte non fa. Quindi qui non si prova solo il comando —
 * si prova che quello stato sia DICHIARATO, che e' la ragione per cui il difetto e
 * l'ipotesi non si possono confondere. */
{
  esito(A.PAR_DEF.inbilico === 1,
    'PAR_DEF porta la leva ACCESA: «Azzera» ripristina PAR_DEF, quindi non la spegne',
    String(A.PAR_DEF.inbilico));
  /* e il difetto arriva davvero in PAR: se azzera copiasse un oggetto diverso, o se una
     seconda copia di PAR_DEF fosse rimasta indietro, si vedrebbe qui */
  conBilico(4);
  esito(A.PAR.inbilico === A.PAR_DEF.inbilico,
    'e lo stato di partenza della pagina e quello di PAR_DEF, non uno stato suo');

  /* IL COMANDO COMPARE QUANDO COMINCIA A SPOSTARE QUALCOSA, E NON PRIMA.
     Oggi la lista non ha seggi in nessuna rilevazione, quindi la leva — benche' accesa —
     muove zero e il pulsante non c'e'. Dal primo sondaggio che le da' un seggio il
     conteggio cambia DA SOLO, perche' la leva e' gia' accesa: il pulsante deve comparire
     in quel momento, o il lettore si troverebbe davanti a un'ipotesi applicata senza il
     comando per toglierla. E' la transizione, non i due stati separati. */
  /* IL PUNTO NON SI INDOVINA, SI CERCA. «Al primo seggio» sarebbe falso: un seggio per
     rilevazione vale una quota dello 0,8% e la soglia e' 3,25, quindi la lista resta fuori
     dal riparto e la leva continua a muovere zero. La proprieta' e' che il comando compaia
     esattamente quando la lista ENTRA nella proiezione — e il valore di soglia dipende
     dall'archivio, quindi scriverne uno qui sarebbe la costante che scade. */
  const id = A.IN_BILICO[0].id;
  let entra = 0;
  for (let n = 0; n <= 8 && !entra; n++) { conBilico(n); if (A.SEG[id]) entra = n; }
  esito(entra > 0, 'esiste un numero di seggi che fa entrare la lista nella proiezione',
    'provati 0..8');
  conBilico(entra - 1);
  esito(!A.SEG[id] && $('k-bilico').hidden === true,
    'finche la lista resta sotto soglia il comando non c e: uno che non fa niente e ' +
    'peggio di uno assente', 'con ' + (entra - 1) + ' seggi per rilevazione');
  esito(testo('k-bilriga') === '', 'e la riga di esito tace');
  const b0 = A.blocchi(A.SEG);
  conBilico(entra);
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
    'e i seggi entrano gia nel blocco, perche la leva e accesa: non c e un render in cui ' +
    'l ipotesi e applicata e il comando per toglierla non c e ancora',
    JSON.stringify(b1) + ' contro la fonte ' + JSON.stringify(A.blocchi(A.SEG, true)));

  conBilico(4);
  const b = $('k-bilico');
  const acceso = b.textContent, eti = b.getAttribute('aria-label');
  esito(/^Togli /.test(acceso),
    'nello stato in cui il lettore arriva il verbo e «Togli», cioe l azione che riporta ' +
    'il conteggio a quello della fonte', acceso);
  esito(eti.indexOf(acceso) === 0,
    'il nome accessibile comincia col testo visibile, come chiede WCAG 2.5.3', eti);
  esito(b.getAttribute('aria-pressed') === null,
    'e non porta aria-pressed: il nome dice l azione, quindi il riscontro e il nome che cambia');
  const riga = testo('k-bilriga');
  esito(/^Il conteggio parte da un/.test(riga),
    'e la riga di esito dichiara l ipotesi nel PRIMO periodo, perche questo e lo stato ' +
    'in cui si arriva senza toccare niente', riga.slice(0, 160));
  esito(/→/.test(riga),
    'dicendo quanti seggi si spostano e fra quali blocchi', riga.slice(0, 240));
  esito(/pulsante/.test(riga),
    'e dove sta la via d uscita: «ipotesi» senza il comando per toglierla e una parola sola');

  A.PAR.inbilico = 0; A.render();
  const spento = $('k-bilico').textContent;
  esito(spento !== acceso, 'premendo, il nome cambia — ed e il riscontro', acceso + ' -> ' + spento);
  esito(spento.length === acceso.length,
    'e ha la STESSA lunghezza nei due stati: il pannello non si accorcia sotto il dito, ' +
    'che e il difetto costato al comando degli accordi 36px di salto',
    acceso + ' (' + acceso.length + ') · ' + spento + ' (' + spento.length + ')');
  esito(/La fonte non conta/.test(testo('k-bilriga')),
    'e a leva spenta la riga dichiara che cosa dice la fonte, che e la ragione per cui la ' +
    'lista sta li', testo('k-bilriga').slice(0, 140));
  /* la leva si dichiara nel prompt quando e SPENTA, perche accesa e il difetto */
  esito(/contate a parte/.test(A.promptAI()),
    'e il prompt che va al servizio terzo dichiara la leva SPENTA, perche accesa e il difetto');
  A.PAR.inbilico = A.PAR_DEF.inbilico; A.render();
  esito(!/contate a parte/.test(A.promptAI()),
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
  conBilico(0);
  esito(A.ipotesiNeiNumeri() === '',
    'senza seggi da spostare non si dichiara niente: un ipotesi che non muove un numero e ' +
    'rumore, e insegna a saltare la riga prima del giorno in cui conta');
  esito(A.testoCondivisione(false).indexOf('ipotesi') < 0,
    'e la frase di condivisione non ne parla');

  conBilico(4);
  const ip = A.ipotesiNeiNumeri();
  esito(ip.length > 0 && /ipotesi/.test(ip) && /non un fatto/.test(ip),
    'con la lista in Knesset la dichiarazione c e, e dice che e un ipotesi', ip);
  esito(/statoLeve/.test('') === false && A.statoLeve() === '',
    'mentre statoLeve TACE, perche il lettore non ha cambiato niente: e la ragione per cui ' +
    'le due funzioni sono due', '«' + A.statoLeve() + '»');
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

console.log('\nblocchi: ' + ok + '/' + (ok + ko));
if (ko) process.exit(1);
