/* LA TABELLA DEI SONDAGGI: le colonne raggruppate per blocco, e le due cose che il
 * riordino poteva rompere senza dirlo.
 *
 * Fino al 23 agosto 2026 le ventidue colonne seguivano l'ordine di Wikipedia — `P[i].o` —
 * e quell'ordine MESCOLA: misurato sull'anagrafica, i venti id danno CINQUE gruppi
 * contigui per QUATTRO blocchi, perché Yisrael Beitenu è «opposizione» e sta a o=13, dopo
 * le quattro liste dell'ago della bilancia. La domanda che un lettore fa a quella tabella
 * — «questo istituto dove vede il blocco» — si risponde leggendo una fascia, e una fascia
 * spezzata non si legge.
 *
 * QUESTA SUITE PROVA TRE COSE, E LE ULTIME DUE SONO QUELLE PER CUI ESISTE.
 *
 *   1 · IL RAGGRUPPAMENTO. Le colonne sono contigue per blocco, i filetti cadono dove il
 *       blocco cambia e in nessun altro punto, e i confini escono da P[i].b — quindi l'8
 *       settembre si spostano da soli. Nessuna posizione è scritta né qui né in pagina:
 *       le attese si ricavano dall'anagrafica, come fa house.js.
 *
 *   2 · CHE IL RIORDINO NON ABBIA SPOSTATO I VALORI. È il difetto vero di un riordino, ed
 *       è invisibile a occhio: una tabella con le colonne mescolate e i numeri sotto la
 *       colonna sbagliata si legge benissimo e dice il falso. Ogni cella si confronta con
 *       `s.seggi[id]` dell'archivio, riga per riga e colonna per colonna.
 *
 *   3 · CHE L'ORDINE DELLE COLONNE E QUELLO DEI DATI SIANO DUE COSE DIVERSE. Se oggi
 *       coincidevano era per caso, e il caso è finito: adesso divergono davvero, e il
 *       parser e l'esportazione non devono accorgersene. Il parser mappa le colonne di
 *       Wikipedia per NOME (W_LISTA) e l'esportazione serializza SOND, che è un elenco di
 *       oggetti indicizzati per id: né l'uno né l'altra guardano `cols`. Qui si prova che
 *       continuino a non guardarlo — sul comportamento, non sull'intenzione.
 *
 * E UNA STRADA SOLA PER LE DUE TABELLE. L'house effect era già in ordine di blocco, e lo
 * era PER FORTUNA: le liste dell'ago della bilancia non arrivano a tre rilevazioni, quindi
 * Beitenu non taglia niente. Il giorno in cui una ci arriva, quella tabella disegnerebbe
 * un filetto in mezzo all'opposizione. Da oggi le due chiamano colonneBlocco(), e qui si
 * prova che dispongano i blocchi nello stesso ordine.
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
  'global.A={colonneBlocco:colonneBlocco,P:P,IDS:IDS,SOND:function(){return SOND;},' +
  'rTab:rTab,rHouse:rHouse,render:render,TAB_LIMITE:TAB_LIMITE,' +
  'mostra:function(){return TAB_MOSTRA;},setMostra:function(v){TAB_MOSTRA=v;},' +
  'filtri:function(){return FILTRI;},cntTab:cntTab};carica().then(render,render)');
eval(src);
try{ A.render(); }catch(e){ console.log('KO il render non è partito — ' + (e && e.message)); }

const P = A.P, IDS = A.IDS;

/* ══ 0 · LA PREMESSA, MISURATA: l'ordine dell'anagrafica MESCOLA ═════════════════
 * Se un giorno `o` diventasse già raggruppato, questa suite girerebbe a vuoto senza dirlo:
 * proverebbe che le colonne sono in ordine di blocco quando lo sarebbero comunque. */
(function(){
  let gruppi = 0, prec = null;
  IDS.forEach(i => { if (P[i].b !== prec){ gruppi++; prec = P[i].b; } });
  const blocchi = [...new Set(IDS.map(i => P[i].b))].length;
  esito(gruppi > blocchi,
    'l\'ordine dell\'anagrafica mescola davvero (' + gruppi + ' gruppi contigui per ' +
    blocchi + ' blocchi): senza questo, il riordino non proverebbe niente',
    IDS.map(i => P[i].b).join(' '));
})();

/* ══ 1 · colonneBlocco(): la funzione, prima della tabella ═══════════════════════ */
(function(){
  const ord = A.colonneBlocco(IDS);
  esito(ord.length === IDS.length && IDS.every(i => ord.indexOf(i) >= 0),
    'colonneBlocco() è una permutazione: non perde e non inventa colonne',
    ord.length + ' contro ' + IDS.length);
  let gruppi = 0, prec = null;
  ord.forEach(i => { if (P[i].b !== prec){ gruppi++; prec = P[i].b; } });
  esito(gruppi === [...new Set(IDS.map(i => P[i].b))].length,
    'e le rende contigue: un gruppo per blocco, non uno di più',
    ord.map(i => P[i].b).join(' '));
  /* dentro il blocco l'ordine dell'anagrafica si conserva: il riordino è fra i blocchi,
     non dentro — o cambierebbe anche il modo in cui si leggono le liste affini */
  const dentroOk = [...new Set(IDS.map(i => P[i].b))].every(b => {
    const a = IDS.filter(i => P[i].b === b).join(',');
    const c = ord.filter(i => P[i].b === b).join(',');
    return a === c;
  });
  esito(dentroOk, 'dentro il blocco l\'ordine dell\'anagrafica resta quello di prima');
  /* l'ordine FRA i blocchi non è scritto: è quello in cui l'anagrafica li presenta */
  const primo = {};
  IDS.forEach(i => { if (primo[P[i].b] === undefined || P[i].o < primo[P[i].b]) primo[P[i].b] = P[i].o; });
  const atteso = Object.keys(primo).sort((a, b) => primo[a] - primo[b]);
  const reso = [];
  ord.forEach(i => { if (reso[reso.length-1] !== P[i].b) reso.push(P[i].b); });
  esito(reso.join('|') === atteso.join('|'),
    'l\'ordine fra i blocchi è quello dell\'anagrafica (il minimo «o» di ciascuno)',
    'atteso ' + atteso.join(', ') + ' · reso ' + reso.join(', '));
  /* e un sottoinsieme non riordina i blocchi: le due tabelle filtrano in modo diverso, e
     se l'ordine dipendesse dal filtro le due potrebbero disporli in modo diverso */
  const meta = IDS.filter((x, k) => k % 2 === 0);
  const rMeta = [];
  A.colonneBlocco(meta).forEach(i => { if (rMeta[rMeta.length-1] !== P[i].b) rMeta.push(P[i].b); });
  esito(atteso.filter(b => rMeta.indexOf(b) >= 0).join('|') === rMeta.join('|'),
    'su un sottoinsieme i blocchi restano nello stesso ordine: dipende dall\'anagrafica, non dai dati del giorno',
    rMeta.join(', '));
  /* IL SOTTOINSIEME CHE FA LA DIFFERENZA, e ci è voluta una mutazione per trovarlo.
     «Un id ogni due» qui sopra non distingue niente: calcolare il minimo sul filtro o su
     IDS dà lo stesso ordine, e la mutazione che scambia le due strade restava VIVA.
     Il caso che le separa è quello vero dell'8 settembre: un filtro che tenga di un blocco
     SOLO la lista che sta dopo un altro blocco nell'anagrafica. Oggi è Yisrael Beitenu, a
     o=13, dichiarato «opposizione» e piazzato dopo le quattro dell'ago della bilancia:
     col minimo calcolato sul filtro, l'opposizione scivolerebbe dopo l'ago della bilancia,
     e le due tabelle disporrebbero i blocchi in due ordini diversi — che è precisamente
     la cosa che colonneBlocco() esiste per impedire.
     La lista si SCEGLIE misurando: si cerca nell'anagrafica quella il cui `o` è maggiore
     del minimo di un blocco che la segue. Scriverne il nome qui sarebbe la costante che
     l'8 settembre resta indietro. */
  const tardiva = IDS.filter(i =>
    Object.keys(primo).some(b => b !== P[i].b && primo[b] < P[i].o && primo[P[i].b] < primo[b]));
  esito(tardiva.length > 0,
    'nell\'anagrafica c\'è almeno una lista che sta dopo un blocco che la segue: è il caso ' +
    'in cui il minimo va preso su IDS e non sul filtro', tardiva.map(i => P[i].n).join(', '));
  if (tardiva.length){
    const soloTardiva = IDS.filter(i => P[i].b !== P[tardiva[0]].b || i === tardiva[0]);
    const rT = [];
    A.colonneBlocco(soloTardiva).forEach(i => { if (rT[rT.length-1] !== P[i].b) rT.push(P[i].b); });
    esito(rT.join('|') === atteso.filter(b => rT.indexOf(b) >= 0).join('|'),
      'e tenendo di quel blocco la sola lista tardiva («' + P[tardiva[0]].n + '») l\'ordine ' +
      'dei blocchi NON cambia: il minimo esce da IDS, non dal filtro',
      'atteso ' + atteso.join(', ') + ' · reso ' + rT.join(', '));
  }
})();

/* ══ 2 · LA TABELLA RESA: raggruppamento e filetti ═══════════════════════════════ */
const tab = D.querySelector('#k-tab table');
esito(!!tab, 'la tabella dell\'archivio è resa');
esito(!!tab && tab.classList.contains('sondtab'),
  'e porta la classe che il foglio usa per il filetto: la stessa dichiarazione dell\'house effect');

const perNome = {};
IDS.forEach(k => { perNome[P[k].n] = k; });
const intest = tab ? [].slice.call(tab.querySelectorAll('thead th')) : [];
/* le colonne di lista sono quelle il cui title è un nome dell'anagrafica: così le tre di
   testa (Data, Istituto, N) e le due di coda (Coal., Opp.) non vanno contate a mano */
const colTh = intest.filter(th => perNome[th.getAttribute('title')]);
const colId = colTh.map(th => perNome[th.getAttribute('title')]);
esito(colId.length >= 8, 'le colonne di lista sono ' + colId.length, colId.join(' '));

(function(){
  const b = colId.map(i => P[i].b);
  let gruppi = 0, prec = null;
  b.forEach(x => { if (x !== prec){ gruppi++; prec = x; } });
  esito(gruppi === [...new Set(b)].length,
    'le colonne rese sono contigue per blocco: ' + gruppi + ' gruppi per ' +
    [...new Set(b)].length + ' blocchi presenti', b.join(' '));
  /* i confini attesi si ricavano dalla sequenza resa, non da posizioni scritte */
  const attesi = colId.filter((id, k) => k > 0 && P[id].b !== P[colId[k-1]].b).map(id => P[id].n);
  const resi = colTh.filter(th => th.classList.contains('sep')).map(th => th.getAttribute('title'));
  esito(resi.join('|') === attesi.join('|'),
    'i filetti cadono dove cambia il blocco, e in nessun altro punto',
    'attesi ' + (attesi.join(', ') || '(nessuno)') + ' · resi ' + (resi.join(', ') || '(nessuno)'));
  esito(attesi.length >= 2,
    'e i blocchi in tabella sono più di due, o la prova gira a vuoto',
    [...new Set(b)].join(', '));
  /* il filetto scende su tutta la colonna: sull'intestazione soltanto sarebbe spezzato */
  const righe = [].slice.call(tab.querySelectorAll('tbody tr'))
    .filter(tr => tr.children.length === intest.length);   /* la riga dell'era ha un colspan */
  esito(righe.length > 20, 'ci sono righe di dato da controllare', String(righe.length));
  attesi.forEach(nome => {
    const k = intest.findIndex(th => th.getAttribute('title') === nome);
    const scoperte = righe.filter(tr => !tr.children[k] || !tr.children[k].classList.contains('sep'));
    esito(!scoperte.length,
      'il filetto di «' + nome + '» scende su tutte le ' + righe.length + ' righe',
      scoperte.length + ' scoperte');
  });
  /* e NESSUNA cella porta sep fuori dai confini: un filetto in più dice un blocco che non
     c'è, ed è esattamente il difetto che l'ordine cablato avrebbe prodotto */
  const sepFuori = colTh.filter((th, k) => th.classList.contains('sep') &&
    attesi.indexOf(th.getAttribute('title')) < 0);
  esito(!sepFuori.length, 'nessun filetto in più',
    sepFuori.map(th => th.getAttribute('title')).join(', '));
})();

/* ══ 3 · I VALORI NON SI SONO SPOSTATI ══════════════════════════════════════════
 *
 * È il difetto vero di un riordino, e non si vede: una tabella con i numeri sotto la
 * colonna sbagliata si legge benissimo e dice il falso. Si confronta ogni cella con
 * l'archivio, per id e non per posizione. */
(function(){
  const righe = [].slice.call(tab.querySelectorAll('tbody tr'))
    .filter(tr => tr.children.length === intest.length);
  const SOND = A.SOND().slice().sort((a, b) => a.data < b.data ? 1 : -1);
  esito(righe.length === SOND.length,
    'la tabella mostra tutte le rilevazioni dell\'archivio, senza filtri attivi',
    righe.length + ' righe contro ' + SOND.length + ' rilevazioni');
  let sbagliate = 0, primo = '';
  const iPrima = intest.findIndex(th => perNome[th.getAttribute('title')]);
  righe.forEach((tr, r) => {
    const s = SOND[r]; if (!s) return;
    colId.forEach((id, c) => {
      const td = tr.children[iPrima + c];
      const atteso = s.seggi[id] ? String(s.seggi[id]) : '';
      const avuto = td ? td.textContent.trim() : '(assente)';
      if (avuto !== atteso){
        sbagliate++;
        if (!primo) primo = s.data + ' ' + s.istituto + ' · ' + P[id].n +
          ': in tabella «' + avuto + '», in archivio «' + atteso + '»';
      }
    });
  });
  esito(!sbagliate,
    'ognuna delle ' + (righe.length * colId.length) + ' celle porta il valore della SUA lista',
    sbagliate + ' celle sbagliate, la prima: ' + primo);
})();

/* ══ 4 · L'ORDINE DELLE COLONNE E QUELLO DEI DATI SONO DUE COSE DIVERSE ══════════
 *
 * Se coincidevano era per caso. Adesso divergono davvero, e le due cose che leggono
 * l'archivio — il parser di Wikipedia e l'esportazione — non devono accorgersene. */
(function(){
  esito(colId.join(',') !== IDS.filter(i => colId.indexOf(i) >= 0).join(','),
    'l\'ordine delle colonne DIVERGE dall\'ordine dell\'anagrafica: non coincidono più per caso',
    colId.join(' '));

  /* L'ESPORTAZIONE. Serializza SOND, e SOND è un elenco di oggetti per id: il render non
     lo tocca. Si fotografa prima, si ridisegna la tabella, si confronta byte per byte —
     un riordino che riscrivesse le chiavi degli oggetti si vedrebbe qui. */
  const prima = JSON.stringify({sondaggi: A.SOND()}, null, 2);
  A.rTab(); A.rHouse(); A.rTab();
  const dopo = JSON.stringify({sondaggi: A.SOND()}, null, 2);
  esito(prima === dopo,
    'ridisegnare le tabelle non cambia un byte di quello che l\'esportazione produce',
    'prima ' + prima.length + ' byte, dopo ' + dopo.length);
  /* e le chiavi dentro ogni rilevazione sono ancora quelle che il parser ha scritto, non
     l'ordine delle colonne: l'esportazione non è una vista della tabella */
  const primaRil = A.SOND()[0];
  esito(!!primaRil && Object.keys(primaRil.seggi).join(',') !== colId.filter(
      i => primaRil.seggi[i]).join(','),
    'e le chiavi di una rilevazione non seguono l\'ordine delle colonne',
    primaRil ? Object.keys(primaRil.seggi).join(' ') : '');

  /* IL PARSER. Mappa le colonne di Wikipedia per NOME, con W_LISTA, e non conosce
     colonneBlocco(): si legge il sorgente e si pretende che le due cose restino separate.
     I commenti si tolgono prima, o si troverebbe la parola dentro la spiegazione del
     perché non va usata — è la lezione di test/css.js. */
  const js = html.match(/<script>([\s\S]*)<\/script>/)[1];
  const parser = js.slice(js.indexOf('function parseWikiTabella'),
                          js.indexOf('function parseWiki('))
    .replace(/\/\*[\s\S]*?\*\//g, ' ');
  esito(parser.length > 500, 'il corpo del parser si isola nel sorgente', String(parser.length));
  esito(parser.indexOf('colonneBlocco') < 0 && parser.indexOf('IDS') < 0,
    'il parser non guarda né colonneBlocco() né IDS: legge le intestazioni di Wikipedia per nome');
  const esporta = js.slice(Math.max(0, js.indexOf("a.download='sondaggi-knesset") - 400),
                           js.indexOf("a.download='sondaggi-knesset") + 60)
    .replace(/\/\*[\s\S]*?\*\//g, ' ');
  esito(/JSON\.stringify\(\{sondaggi:SOND\}/.test(esporta) &&
        esporta.indexOf('cols') < 0 && esporta.indexOf('colonneBlocco') < 0,
    'l\'esportazione serializza SOND e non la tabella: nessuna colonna la raggiunge',
    esporta.replace(/\s+/g, ' ').slice(-90));
})();

/* ══ 5 · LE DUE TABELLE DISPONGONO I BLOCCHI NELLO STESSO ORDINE ═════════════════
 * Una funzione sola, e la prova che sia davvero una sola: se un giorno l'house effect
 * tornasse a filtrare per conto suo, qui si vedrebbe. */
(function(){
  const hs = D.querySelector('#k-house .hstab table');
  esito(!!hs, 'anche la tabella dell\'house effect è resa');
  if (!hs) return;
  const hCol = [].slice.call(hs.querySelectorAll('thead th'))
    .map(th => perNome[th.getAttribute('title')]).filter(Boolean);
  esito(hCol.length >= 6, 'e ha colonne di lista', String(hCol.length));
  const seq = a => { const r = []; a.forEach(i => { if (r[r.length-1] !== P[i].b) r.push(P[i].b); }); return r; };
  const sh = seq(hCol), st = seq(colId);
  esito(sh.length === [...new Set(hCol.map(i => P[i].b))].length,
    'l\'house effect è contiguo per blocco anche lui — e adesso per costruzione, non per fortuna',
    sh.join(', '));
  esito(st.filter(b => sh.indexOf(b) >= 0).join('|') === sh.join('|'),
    'e i blocchi che le due tabelle hanno in comune stanno nello stesso ordine',
    'archivio ' + st.join(', ') + ' · house ' + sh.join(', '));

  /* E CHE SIA DAVVERO LA STESSA FUNZIONE, non una coincidenza che tiene finché tiene.
     Le asserzioni qui sopra guardano il RISULTATO, e oggi il risultato è lo stesso anche
     se l'house effect torna a filtrare per conto suo: le quattro liste dell'ago della
     bilancia non arrivano a tre rilevazioni, quindi Beitenu non taglia niente e le colonne
     restano contigue comunque. La mutazione che toglie colonneBlocco() da rHouse restava
     VIVA — cioè la prova diceva «una strada sola» guardando un caso in cui le due strade
     coincidono, che è la forma di falso verde di questo progetto.
     Il legame si prova dove sta: nel sorgente, come per og:title e il lavoro notturno. I
     commenti si tolgono prima, o si trova la parola dentro la spiegazione. */
  const js2 = html.match(/<script>([\s\S]*)<\/script>/)[1];
  const corpo = f => {
    const i = js2.indexOf('function ' + f + '(');
    if (i < 0) return '';
    const j = js2.indexOf('\nfunction ', i + 1);
    return js2.slice(i, j < 0 ? js2.length : j).replace(/\/\*[\s\S]*?\*\//g, ' ');
  };
  ['rTab', 'rHouse'].forEach(f => {
    const c = corpo(f);
    esito(/var cols=colonneBlocco\(/.test(c),
      f + '() prende le colonne da colonneBlocco(): una strada sola, e scritta',
      (c.match(/var cols=[^;]*/) || ['(cols non trovato)'])[0].slice(0, 90));
  });
})();


/* ══ 6 · LE DUE VISTE DELL'ARCHIVIO ══════════════════════════════════════════
 *
 * Sopra i 660 la tabella, sotto un elenco di righe che si aprono. È la stessa mossa
 * dell'house effect — due forme, un dato — e vale la stessa regola: ciascuna forma è
 * corretta rispetto a sé stessa, quindi una divergenza non la coglie nessuna prova che ne
 * guardi una sola. Qui si legano, valore per valore, come house.js lega tabella e schede.
 *
 * LA PROPRIETÀ CHE DECIDE LA FORMA, e che le altre due proposte non avevano: il piede
 * della sezione promette che «ogni riga chiude a 120 seggi e riproduce il totale di blocco
 * pubblicato». Perché quella promessa resti verificabile, una rilevazione deve potersi
 * vedere INTERA: qui il sommario porta data, istituto e i due totali di blocco, il pannello
 * porta testata, campione e i seggi, e insieme fanno esattamente la riga della tabella.
 * La forma per lista — una colonna del tempo, una lista per volta — è stata scartata su
 * questo e non sulla forma: là una rilevazione compariva undici volte e mai tutta, il 120
 * non si poteva contare, e la promessa del piede sarebbe diventata inverificabile.
 */
(function(){
  const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
  const lista = D.querySelector('#k-tab .sondlist');
  esito(!!lista, 'l\'elenco c\'è, accanto alla tabella e nello stesso contenitore');
  const tabella = D.querySelector('#k-tab table.sondtab');
  esito(!!tabella, 'e la tabella pure: le due forme stanno tutte e due nel DOM');

  /* Il confine è nella CSS, non nel JavaScript. In jsdom non c'è layout, quindi la
     proprietà si legge dove è scritta — ed è anche il punto: la pagina non si ridisegna al
     ridimensionamento, quindi una forma scelta da matchMedia resterebbe quella sbagliata
     appena si gira il telefono. */
  esito(/#kn26 \.sondlist\{display:none;\}/.test(css),
    'sopra il confine l\'elenco è display:none: la forma predefinita è la tabella');
  const mq = (css.match(/@media\(max-width:660px\)\{[\s\S]*?\n\}/g) || [])
    .find(b => /\.sondlist/.test(b) && /\.sondtab/.test(b)) || '';
  esito(!!mq, 'e il confine è un blocco solo, a 660px come il resto del mobile');
  esito(/#kn26 \.sondtab\{display:none;\}/.test(mq),
    'sotto il confine sparisce la tabella', mq.slice(0, 120));
  esito(/#kn26 \.sondlist\{display:block;\}/.test(mq),
    'e compare l\'elenco', mq.slice(0, 120));
  /* NIENTE SCORRIMENTO ANNIDATO: è il difetto che la forma nuova esiste per togliere —
     un riquadro alto 480px dentro una pagina alta 10.536, e il confine non segnato da
     niente. Se `max-height` restasse, la forma sarebbe nuova e il difetto quello di prima. */
  esito(/#kn26 #k-tab\{[^}]*max-height:none[^}]*overflow:visible/.test(mq),
    'e lo scorrimento annidato sparisce con lei: max-height:none e overflow:visible',
    (mq.match(/#kn26 #k-tab\{[^}]*\}/) || [''])[0]);

  /* ══ le due forme dicono gli stessi valori ══
     L'elenco ne mostra al più TAB_LIMITE: quello che mostra è un PREFISSO di quello che
     mostra la tabella, con gli stessi valori nello stesso ordine. */
  const perNome2 = {};
  IDS.forEach(k => { perNome2[P[k].n] = k; });
  const intest2 = [].slice.call(tabella.querySelectorAll('thead th'));
  const idCol = intest2.map(th => perNome2[th.getAttribute('title')]);
  const righeTab = [].slice.call(tabella.querySelectorAll('tbody tr'))
    .filter(tr => tr.children.length === intest2.length);
  const righeEl = [].slice.call(lista.querySelectorAll('details.sondr'));
  esito(righeEl.length > 0, 'l\'elenco ha righe', String(righeEl.length));
  esito(righeEl.length <= righeTab.length,
    'e non ne ha più della tabella: è un prefisso, non un altro insieme',
    righeEl.length + ' contro ' + righeTab.length);

  const testo = el => el ? el.textContent.replace(/\s+/g, ' ').trim() : null;
  let divergenti = [], primo = '';
  righeEl.forEach((det, r) => {
    const tr = righeTab[r]; if (!tr) { divergenti.push('riga ' + r + ' assente in tabella'); return; }
    const cel = [].slice.call(tr.children);
    const sum = det.querySelector('summary'), pan = det.querySelector('.sondv');
    const dice = (etichetta) => {
      const s = [].slice.call(pan.querySelectorAll('span'))
        .filter(x => testo(x.querySelector('em')) === etichetta)[0];
      return s ? testo(s.querySelector('s')) : null;
    };
    const cfr = (che, a, b) => { if (a !== b){ divergenti.push(che);
      if (!primo) primo = 'riga ' + r + ' · ' + che + ': elenco «' + a + '», tabella «' + b + '»'; } };
    /* la data e i due totali stanno nel sommario */
    cfr('data', testo(sum.querySelector('b')), testo(cel[0]));
    cfr('istituto', testo(sum.querySelector('span')), testo(cel[1].firstChild));
    const tot = [].slice.call(sum.querySelectorAll('u em')).map(testo);
    cfr('coalizione', tot[0], testo(cel[cel.length - 2]));
    cfr('opposizione', tot[1], testo(cel[cel.length - 1]));
    /* testata e campione stanno nel pannello */
    const testata = testo(cel[1].querySelector('span'));
    if (testata) cfr('testata', dice('testata'), testata);
    const campione = testo(cel[2]);
    cfr('campione', dice('campione'), campione === '—' ? 'non dichiarato' : campione);
    /* e i seggi, lista per lista e per ID, non per posizione */
    idCol.forEach((id, c) => {
      if (!id) return;
      const inTab = testo(cel[c]);
      const inEl = dice(P[id].n);
      cfr(P[id].n, inEl === null ? '' : inEl, inTab);
    });
  });
  esito(!divergenti.length,
    'le due forme dicono gli stessi valori su tutte e ' + righeEl.length + ' le righe che condividono',
    divergenti.length + ' divergenze, la prima: ' + primo);

  /* E NELLO STESSO ORDINE, che è una proprietà a sé e l'ha trovata una mutazione.
     Le asserzioni qui sopra cercano ogni lista PER NOME dentro il pannello, quindi passano
     anche se il pannello elenca le liste in un ordine diverso dalle colonne: la mutazione
     che sostituisce `cols` con `IDS` nel pannello restava VIVA. Non è un dettaglio — è il
     raggruppamento per blocco, cioè la cosa che il desktop ha appena guadagnato: un
     pannello in ordine di anagrafica rimetterebbe Yisrael Beitenu fra l'ago della bilancia
     e la coalizione, e le due viste ordinerebbero le stesse liste in due modi.
     Si confronta l'ordine dei nomi nel pannello con l'ordine delle colonne ristretto alle
     liste che quella rilevazione riporta. */
  let ordineKO = [];
  righeEl.forEach((det, r) => {
    const tr = righeTab[r]; if (!tr) return;
    const cel = [].slice.call(tr.children);
    const attesa = idCol.map((id, c) => (id && testo(cel[c])) ? P[id].n : null).filter(Boolean);
    const resa = [].slice.call(det.querySelectorAll('.sondv span:not(.cmp) em')).map(testo);
    if (attesa.join('|') !== resa.join('|'))
      ordineKO.push('riga ' + r + ': ' + resa.join(',') + ' invece di ' + attesa.join(','));
  });
  esito(!ordineKO.length,
    'e nello stesso ORDINE: il pannello elenca le liste come le colonne, cioè per blocco',
    ordineKO[0] || '');
  /* e il filetto del blocco cade dove cade in tabella: terzo uso della stessa
     dichiarazione, e la prova che raggiunga anche qui */
  const primaRiga = righeEl[0];
  if (primaRiga){
    const past = [].slice.call(primaRiga.querySelectorAll('.sondv span:not(.cmp)'));
    const nomi = past.map(x => testo(x.querySelector('em')));
    const blocchiPast = nomi.map(n => (P[perNome2[n]] || {}).b);
    const attesiSep = nomi.filter((n, k) => k > 0 && blocchiPast[k] !== blocchiPast[k - 1]);
    const resiSep = past.filter(x => x.classList.contains('sep'))
      .map(x => testo(x.querySelector('em')));
    esito(attesiSep.length > 0,
      'nel pannello ci sono almeno due blocchi, o la prova sul filetto gira a vuoto',
      blocchiPast.join(' '));
    esito(resiSep.join('|') === attesiSep.join('|'),
      'e il filetto cade dove cambia il blocco, come in tabella',
      'attesi ' + attesiSep.join(', ') + ' · resi ' + resiSep.join(', '));
  }

  /* ══ E GLI STESSI FILTRI ══
     Le due forme sono viste dello stesso dato anche quando il dato si restringe: un filtro
     che agisse su una sola delle due sarebbe la divergenza peggiore, perché ciascuna forma
     resterebbe corretta rispetto a sé stessa e il lettore ne vedrebbe una sola.
     Si applicano i filtri uno per uno e si confronta l'insieme delle rilevazioni: non i
     conteggi — due insiemi diversi possono avere lo stesso numero di elementi — ma le date
     e gli istituti, riga per riga. */
  (function(){
    const chiaviTab = () => [].slice.call(
        D.querySelectorAll('#k-tab table.sondtab tbody tr'))
      .filter(tr => !tr.querySelector('td[colspan]'))
      .map(tr => testo(tr.children[0]) + '|' + testo(tr.children[1].firstChild));
    const chiaviEl = () => [].slice.call(D.querySelectorAll('#k-tab .sondlist details.sondr'))
      .map(d => testo(d.querySelector('summary b')) + '|' + testo(d.querySelector('summary span')));
    const salvaM = A.mostra();
    A.setMostra(A.SOND().length + 10);       /* senza limite, o il confronto è di prefissi */
    const casi = [
      ['nessun filtro', {}],
      ['istituto', {ist: D.getElementById('f-ist').options[1].value}],
      ['ultimi 30 giorni', {per: '30'}],
      ['solo era attuale', {per: 'era'}],
      ['ricerca libera', {txt: 'a'}],
      ['istituto e periodo insieme',
        {ist: D.getElementById('f-ist').options[1].value, per: '90'}]
    ];
    let filtroKO = [];
    casi.forEach(([nome, f]) => {
      A.filtri().ist = f.ist || ''; A.filtri().per = f.per || '0'; A.filtri().txt = f.txt || '';
      A.rTab();
      const t = chiaviTab(), e = chiaviEl();
      if (t.join('||') !== e.join('||'))
        filtroKO.push(nome + ' (' + t.length + ' in tabella, ' + e.length + ' nell\'elenco)');
    });
    A.filtri().ist = ''; A.filtri().per = '0'; A.filtri().txt = '';
    A.setMostra(salvaM); A.rTab();
    esito(!filtroKO.length,
      'e i filtri agiscono sulle due forme allo stesso modo, su tutti e ' + casi.length +
      ' i casi: stesse rilevazioni, stesso ordine', filtroKO.join(' · '));
  })();

  /* LA BANDA DELL'ERA PRE-FUSIONE, e la prima stesura di questa asserzione era sbagliata.
     Pretendeva la banda in tutte e due le forme sempre, e cadeva: le rilevazioni
     pre-fusione sono di gennaio-aprile, cioè in fondo all'archivio, e con il limite a
     cinquanta nell'elenco non ce n'è nemmeno una. Aveva ragione il codice — una banda che
     dichiara un'era senza nessuna riga di quell'era sarebbe una didascalia a vuoto.
     La proprietà giusta è condizionata: la banda c'è nell'elenco SE E SOLO SE fra le righe
     mostrate ce n'è una pre-fusione, e quando c'è dice la stessa frase della tabella —
     ERA_PRE, una stringa sola per le due forme. Si esercita il caso alzando il limite,
     perché una proprietà condizionata provata solo nel ramo falso non è provata. */
  const eraTab = tabella.querySelector('tbody td[colspan]');
  esito(!!eraTab, 'la tabella dichiara l\'era pre-fusione: l\'archivio ne contiene');
  const conPre = () => [].slice.call(lista.querySelectorAll('details.sondr'))
    .some(d => d.classList.contains('pre'));
  esito(!conPre() === !lista.querySelector('.sondera'),
    'nell\'elenco la banda c\'è se e solo se fra le righe mostrate ce n\'è una pre-fusione',
    'righe pre ' + conPre() + ' · banda ' + !!lista.querySelector('.sondera'));
  /* e adesso il ramo vero */
  const salvaM = A.mostra();
  A.setMostra(A.SOND().length + 10); A.rTab();
  const l2 = D.querySelector('#k-tab .sondlist'), t2 = D.querySelector('#k-tab table.sondtab');
  const e2 = l2.querySelector('.sondera'), t2e = t2.querySelector('tbody td[colspan]');
  esito(!!e2 && !!t2e && testo(e2) === testo(t2e),
    'e mostrandole tutte la banda compare, con la stessa frase della tabella',
    testo(e2) + ' / ' + testo(t2e));
  A.setMostra(salvaM); A.rTab();
})();

/* ══ 7 · IL LIMITE, E IL COMANDO CHE LO SPOSTA ═══════════════════════════════
 *
 * Cinquanta, e il numero non viene dai pixel: viene da quanto MORDE sui filtri. Misurato
 * il 23 agosto 2026, righe lasciate da ciascun filtro — otto istituti 3 · 8 · 11 · 25 ·
 * 29 · 29 · 33 · 42, cinque periodi 32 · 62 · 84 · 111 · 173 — il limite non morde in 3
 * stati su 13 a venti, 6 su 13 a trenta, 9 su 13 a cinquanta. Sotto i cinquanta il lettore
 * incontra DUE TRONCAMENTI IN FILA: filtra per avere meno righe e ne trova comunque meno
 * di quante ne ha chieste.
 * Qui non si asserisce il 50 come numero magico: si asserisce la PROPRIETÀ da cui è stato
 * scelto — che lasci intatta la maggioranza degli stati di filtro — così se un giorno
 * l'archivio cresce e la proprietà smette di valere, cade. */
(function(){
  const nEl = () => D.querySelectorAll('#k-tab .sondlist details.sondr').length;
  const nTab = () => [].slice.call(D.querySelectorAll('#k-tab table.sondtab tbody tr'))
    .filter(tr => !tr.querySelector('td[colspan]')).length;
  const cmd = () => D.getElementById('k-tabpiu');

  A.setMostra(A.TAB_LIMITE); A.rTab();
  esito(A.TAB_LIMITE === 50, 'il limite è 50', String(A.TAB_LIMITE));
  esito(nEl() === Math.min(A.TAB_LIMITE, nTab()),
    'l\'elenco ne mostra al più il limite, la tabella tutte',
    nEl() + ' su ' + nTab());

  /* LA PROPRIETÀ CHE HA SCELTO IL NUMERO: quanti stati di filtro il limite lascia intatti.
     Si contano davvero, applicando i filtri uno per uno, invece di ricopiare la misura. */
  const stati = [];
  const sel = D.getElementById('f-ist');
  [].slice.call(sel.options).map(o => o.value).filter(Boolean).forEach(v => {
    A.filtri().ist = v; A.setMostra(A.TAB_LIMITE); A.rTab(); stati.push(nTab());
  });
  A.filtri().ist = '';
  ['30','60','90','era'].forEach(v => {
    A.filtri().per = v; A.setMostra(A.TAB_LIMITE); A.rTab(); stati.push(nTab());
  });
  A.filtri().per = '0'; A.setMostra(A.TAB_LIMITE); A.rTab();
  const intatti = stati.filter(n => n <= A.TAB_LIMITE).length;
  esito(stati.length >= 10, 'ci sono abbastanza stati di filtro da misurare', String(stati.length));
  esito(intatti * 2 > stati.length,
    'il limite lascia intatta la MAGGIORANZA degli stati di filtro (' + intatti + ' su ' +
    stati.length + '): è la proprietà per cui è 50 e non 20',
    stati.sort((a, b) => a - b).join(' '));

  /* il comando c'è quando e solo quando il limite morde, e dice due numeri di righe */
  A.setMostra(A.TAB_LIMITE); A.rTab();
  const totale = nTab();
  if (totale > A.TAB_LIMITE){
    esito(!!cmd(), 'con più righe del limite il comando c\'è');
    /* E QUI SI ESCE SE NON C'È, invece di leggerne il testo: la mutazione che toglie il
       limite faceva MORIRE la suite alla riga dopo, e una suite che muore non è un rosso
       che si legge — è uno stack trace che il conteggio non sa dove mettere. Due volte in
       questa stessa suite, e tutte e due le volte l'asserzione giusta c'era già una riga
       sopra: il difetto era leggere prima di aver verificato. */
    if (!cmd()){ A.setMostra(A.TAB_LIMITE); A.rTab(); return; }
    const t = cmd().textContent;
    const restano = totale - A.TAB_LIMITE;
    esito(t.indexOf(String(Math.min(A.TAB_LIMITE, restano))) >= 0 && t.indexOf(String(restano)) >= 0,
      'e dice quante ne aggiunge e quante ne restano, che sono due numeri di righe', t);
    /* premendolo l'elenco cresce di un limite, e non di più */
    const prima = nEl();
    A.setMostra(A.TAB_LIMITE * 2); A.rTab();
    esito(nEl() === Math.min(A.TAB_LIMITE * 2, totale),
      'premendolo l\'elenco cresce di un limite per volta', prima + ' → ' + nEl());
    /* e alla fine il comando sparisce invece di restare a promettere altre righe */
    A.setMostra(totale + 10); A.rTab();
    esito(nEl() === totale && !cmd(),
      'arrivati in fondo il comando sparisce: non promette righe che non ci sono',
      nEl() + ' righe, comando ' + (cmd() ? 'presente' : 'assente'));
  }
  A.setMostra(A.TAB_LIMITE); A.rTab();
})();

/* ══ 8 · IL CONTATORE: OGNI NUMERO È UN NUMERO DI RIGHE ══════════════════════
 *
 * La regola è quella già pagata dal messaggio dell'aggiornamento, dove il conto non tornava
 * davanti al lettore: ogni numero della frase è un numero di RIGHE, e il lettore deve poter
 * rifare il conto. La prova è scritta sulla proprietà del LETTORE e non su quella del
 * codice: si prende la frase, si estraggono i numeri, e si pretende che siano esattamente
 * quelli che si vedono, quelli che corrispondono e quelli che ci sono — in quest'ordine e
 * non crescenti.
 *
 * Le due forme del contatore stanno tutte e due nel DOM e le sceglie il foglio, come il
 * sommario di testata: la pagina non si ridisegna al ridimensionamento, quindi un contatore
 * scelto dal JavaScript resterebbe a dire il numero dell'altra larghezza. */
(function(){
  const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
  const q = c => D.querySelector('#f-cnt .' + c);
  const nTab = () => [].slice.call(D.querySelectorAll('#k-tab table.sondtab tbody tr'))
    .filter(tr => !tr.querySelector('td[colspan]')).length;
  const tot = A.SOND().length;

  esito(/#kn26 \.filtri \.cnt \.c-lst\{display:none;\}/.test(css),
    'sopra il confine il contatore è quello della tabella');
  const mq = (css.match(/@media\(max-width:660px\)\{[\s\S]*?\n\}/g) || [])
    .find(b => /c-lst/.test(b)) || '';
  esito(/\.c-tab\{display:none;\}/.test(mq) && /\.c-lst\{display:inline;\}/.test(mq),
    'e sotto quello dell\'elenco: le due forme sono nel DOM, sceglie il foglio', mq.slice(0, 200));

  /* la proprietà del lettore, sui quattro casi */
  const numeri = s => (s.match(/\d+(?:[.  ]\d{3})*/g) || [])
    .map(x => +x.replace(/[.  ]/g, ''));
  const casi = [
    ['nessun filtro, limite che morde', () => { A.filtri().ist = ''; A.filtri().per = '0';
      A.filtri().txt = ''; A.setMostra(A.TAB_LIMITE); }],
    ['nessun filtro, nessun limite', () => { A.setMostra(tot + 10); }],
    ['un filtro che lascia più del limite', () => { A.filtri().per = '90';
      A.setMostra(A.TAB_LIMITE); }],
    ['un filtro che lascia meno del limite', () => { A.filtri().per = '0';
      A.filtri().ist = D.getElementById('f-ist').options[1].value; A.setMostra(A.TAB_LIMITE); }]
  ];
  casi.forEach(([nome, prepara]) => {
    prepara(); A.rTab();
    const filtrate = nTab(), mostrate = Math.min(A.mostra(), filtrate);
    /* LE DUE FORME SI CERCANO PRIMA DI LEGGERLE, e non è prudenza generica: la mutazione
       che ne lascia una sola faceva MORIRE questa suite invece di farla cadere, e una
       suite che muore è la forma di rosso che questo banco ha imparato a diffidare — il
       conteggio non ha niente da dire e il difetto arriva come stack trace. Un'asserzione
       che manca vale più di un'eccezione che passa. */
    if (!q('c-lst') || !q('c-tab')){
      esito(false, '  · ' + nome + ': il contatore ha tutte e due le forme nel DOM',
        'c-lst ' + !!q('c-lst') + ' · c-tab ' + !!q('c-tab'));
      return;
    }
    const t = q('c-lst').textContent, n = numeri(t);
    esito(n.length >= 1 && n.every(x => x === mostrate || x === filtrate || x === tot),
      '  · ' + nome + ': ogni numero della frase è un conto di righe', t + ' → ' + n.join(','));
    esito(n[0] === mostrate,
      '  · ' + nome + ': il primo numero è quello che si vede', t);
    esito(n[n.length - 1] === tot,
      '  · ' + nome + ': l\'ultimo è il totale dell\'archivio', t);
    /* e la forma della tabella dice le stesse cose senza il primo numero, perché lì si
       vedono tutte: le due frasi non possono contraddirsi */
    const nt = numeri(q('c-tab').textContent);
    esito(nt[nt.length - 1] === tot && nt[0] === filtrate,
      '  · ' + nome + ': la forma della tabella dice le filtrate e il totale',
      q('c-tab').textContent);
    /* nessun numero ripetuto a vuoto: «50 di 173 che corrispondono, su 173» è la frase che
       la prima stesura scriveva senza filtri, e «che corrispondono» non voleva dire niente */
    esito(!/che corrispondono/.test(t) || filtrate < tot,
      '  · ' + nome + ': «che corrispondono» compare solo se qualcosa è stato chiesto', t);
  });
  A.filtri().ist = ''; A.filtri().per = '0'; A.filtri().txt = '';
  A.setMostra(A.TAB_LIMITE); A.rTab();
})();

/* ══ 9 · ZERO RISULTATI: LA TABELLA DEVE DIRLO ═══════════════════════════════
 *
 * Misurato su browser il 23 agosto 2026: con una ricerca senza esiti restava un riquadro
 * alto 31,7px con la sola intestazione e nessuna parola. Il contatore accanto ai filtri
 * diceva «0 su 173», quindi non era muto — ma il posto in cui il lettore guarda è la
 * tabella, e la tabella taceva. È il caso «archivio degenere» della verifica a scenari,
 * prodotto da una ricerca invece che da un archivio vuoto. */
(function(){
  A.filtri().txt = 'zzznessuno'; A.rTab();
  const box = D.getElementById('k-tab');
  const msg = box.querySelector('.vuoto');
  esito(!!msg, 'con zero risultati compare un messaggio, al posto delle due forme');
  esito(!box.querySelector('table') && !box.querySelector('.sondlist'),
    'e nessuna delle due forme resta come guscio vuoto');
  if (msg){
    const t = msg.textContent;
    esito(/[Nn]essuna rilevazione/.test(t), 'il messaggio dice che non c\'è niente', t.slice(0, 80));
    esito(t.indexOf(String(A.SOND().length)) >= 0,
      'e dice quante ne contiene l\'archivio, così il lettore sa che il vuoto è del filtro '
      + 'e non dei dati', t);
  }
  /* e il contatore continua a dire il suo: zero è un numero di righe come gli altri */
  esito(/\b0\b/.test(D.querySelector('#f-cnt .c-lst').textContent),
    'il contatore dice zero', D.querySelector('#f-cnt .c-lst').textContent);
  A.filtri().txt = ''; A.rTab();
  esito(D.querySelectorAll('#k-tab .sondlist details.sondr').length > 0,
    'e togliendo la ricerca le due forme tornano');
})();

console.log('\n' + ok + '/' + (ok + ko));
if (ko) process.exit(1);
