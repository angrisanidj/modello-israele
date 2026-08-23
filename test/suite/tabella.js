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
  'rTab:rTab,rHouse:rHouse,render:render};carica().then(render,render)');
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

console.log('\n' + ok + '/' + (ok + ko));
if (ko) process.exit(1);
