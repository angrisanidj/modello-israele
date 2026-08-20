/* La regola generativa e la pagina non devono divergere.
 *
 * dati/colore-liste.js è la fonte dei colori di lista; index.html ne porta una copia
 * cablata nell'anagrafica P{} e nella tabella PAL_SCURO. L'8 settembre, quando le liste
 * si chiudono, qualcuno toccherà l'una o l'altra: questa prova è ciò che impedisce che
 * la copia resti indietro senza che nessuno se ne accorga.
 *
 * Verifica che per ognuna delle venti liste, nei due temi, il colore prodotto dalla
 * regola sia ESATTAMENTE quello scritto in index.html.
 */
const fs = require('fs');
const COLORE = require('../../dati/colore-liste.js');
const html = fs.readFileSync('../../index.html', 'utf8');

let ok = 0, ko = 0;
function esito(cond, desc, dettaglio){
  if (cond) { ok++; console.log('OK ' + desc); }
  else { ko++; console.log('KO ' + desc + (dettaglio ? ' — ' + dettaglio : '')); }
}

/* slot di ciascuna lista: la mappa sta qui, gli angoli e le bande nella regola.
   Le liste alternative condividono lo slot per la regola di fusione. */
const SLOT = {
  likud:['coalizione',0], shas:['coalizione',1], utj:['coalizione',2],
  sionismo_rel:['coalizione',3], otzma:['coalizione',4],
  yesh_atid:['opposizione',0], byachad:['opposizione',0], democratici:['opposizione',1],
  blue_white:['opposizione',2], beitenu:['opposizione',3], yashar:['opposizione',4],
  bennett26:['opposizione',5],
  hadash_taal:['arabo',0], lista_araba:['arabo',0], raam:['arabo',1], balad:['arabo',2],
  casa_sionista:['incerto',0], unity_erdan:['incerto',1], israel_first:['incerto',2],
  economico:['incerto',3]
};

/* ── colori chiari: dall'anagrafica P{} ── */
const blocco = html.match(/var P=\{([\s\S]*?)\n\};/);
esito(!!blocco, 'l\'anagrafica P{} è leggibile in index.html');
const chiaro = {};
if (blocco) {
  for (const m of blocco[1].matchAll(/^\s*([a-z0-9_]+)\s*:\s*\{n:"([^"]*)"[\s\S]*?c:"(#[0-9a-fA-F]{6})"/gm))
    chiaro[m[1]] = {nome:m[2], c:m[3].toUpperCase()};
}

/* ── colori scuri: dalla tabella PAL_SCURO, che cp() consulta ── */
const tab = html.match(/var PAL_SCURO=\{([\s\S]*?)\n\};/);
esito(!!tab, 'la tabella PAL_SCURO è leggibile in index.html');
const scuroDa = {};
if (tab) {
  for (const m of tab[1].matchAll(/"(#[0-9A-Fa-f]{6})"\s*:\s*"(#[0-9A-Fa-f]{6})"/g))
    scuroDa[m[1].toUpperCase()] = m[2].toUpperCase();
}

esito(Object.keys(chiaro).length === Object.keys(SLOT).length,
  'la pagina contiene le ' + Object.keys(SLOT).length + ' liste attese',
  'ne ha ' + Object.keys(chiaro).length);

/* ── il confronto vero, lista per lista, nei due temi ── */
for (const id of Object.keys(SLOT)) {
  const [b, s] = SLOT[id];
  const attesoC = COLORE.di(b, s, 'chiaro').toUpperCase();
  const attesoS = COLORE.di(b, s, 'scuro').toUpperCase();
  const nella = chiaro[id];
  if (!nella) { esito(false, 'regola e pagina d\'accordo su ' + id, 'lista assente dall\'anagrafica'); continue; }
  const trovatoC = nella.c;
  const trovatoS = scuroDa[trovatoC];
  const bene = trovatoC === attesoC && trovatoS === attesoS;
  esito(bene, 'regola e pagina d\'accordo su ' + id,
    'chiaro: regola ' + attesoC + ' / pagina ' + trovatoC +
    ' · scuro: regola ' + attesoS + ' / pagina ' + (trovatoS || '(assente da PAL_SCURO)'));
}

/* ── i colori di blocco: BL{} e i token CSS devono dire la stessa cosa ──
 *
 * Il blocco ha due strade verso lo schermo. BL{} colora l'emiciclo e le legende;
 * i quattro token --coal/--oppo/--arab/--inc vengono letti da leggiTema() in C{} e
 * colorano le barre di probabilità, i due istogrammi con le loro pastiglie, due
 * colonne del backtest e il tratteggio dell'ago della bilancia. Le due strade sono
 * scritte in punti lontani del file e nessuno le confrontava: sono rimaste divergenti
 * per tre commit, e lo scambio di banda del 20 agosto ha portato lo scarto a dE 11 —
 * blu e verde diversi per lo stesso blocco, nella stessa pagina. */
{
  const BLOCCHI = {coal:'coalizione', oppo:'opposizione', arab:'arabo', inc:'incerto'};
  const NOMI = {coal:'Blocco Netanyahu', oppo:'Opposizione sionista',
                arab:'Partiti arabi', inc:'Ago della bilancia'};

  const bl = html.match(/var BL=\{([\s\S]*?)\};/);
  esito(!!bl, 'l\'anagrafica BL{} è leggibile in index.html');

  /* Le tre dichiarazioni dei token: una per il tema chiaro, due per lo scuro
     (.auto sotto prefers-color-scheme e .scuro esplicito). Se il numero cambia,
     la prova lo dice invece di leggerne una a caso. */
  const dich = html.match(/--coal:#[0-9A-Fa-f]{6}; --oppo:#[0-9A-Fa-f]{6}; --arab:#[0-9A-Fa-f]{6}; --inc:#[0-9A-Fa-f]{6};/g) || [];
  esito(dich.length === 3, 'i token di blocco sono dichiarati tre volte (chiaro, .auto, .scuro)',
    'trovate ' + dich.length + ' dichiarazioni');

  const leggi = r => Object.fromEntries(
    [...r.matchAll(/--(coal|oppo|arab|inc):(#[0-9A-Fa-f]{6})/g)].map(m => [m[1], m[2].toUpperCase()]));

  if (dich.length === 3) {
    esito(dich[1] === dich[2], 'le due dichiarazioni del tema scuro coincidono',
      dich[1] + ' / ' + dich[2]);
    const tok = {chiaro: leggi(dich[0]), scuro: leggi(dich[1])};

    for (const k of Object.keys(BLOCCHI)) {
      const b = BLOCCHI[k];
      for (const tema of ['chiaro', 'scuro']) {
        const atteso = COLORE.di(b, 0, tema).toUpperCase();
        esito(tok[tema][k] === atteso, 'il token --' + k + ' del tema ' + tema + ' segue la regola',
          'regola ' + atteso + ' / pagina ' + tok[tema][k]);
      }
      /* e BL{}, che è l'altra strada, deve puntare allo stesso colore chiaro */
      const m = bl ? new RegExp('n:"' + NOMI[k] + '",c:"(#[0-9A-Fa-f]{6})"').exec(bl[1]) : null;
      esito(!!m && m[1].toUpperCase() === tok.chiaro[k],
        'BL.' + BLOCCHI[k] + ' e il token --' + k + ' sono lo stesso colore',
        m ? 'BL ' + m[1].toUpperCase() + ' / token ' + tok.chiaro[k] : 'blocco assente da BL{}');
      /* nel tema scuro l'emiciclo passa da cp(): PAL_SCURO deve portare allo stesso token */
      if (m) esito(scuroDa[m[1].toUpperCase()] === tok.scuro[k],
        'nel tema scuro cp(BL.' + BLOCCHI[k] + ') e il token --' + k + ' coincidono',
        'PAL_SCURO ' + (scuroDa[m[1].toUpperCase()] || '(assente)') + ' / token ' + tok.scuro[k]);
    }
  }
}

/* ── nessun colore prodotto dalla regola può essere un grigio ── */
{
  const smorti = [];
  for (const id of Object.keys(SLOT)) {
    const [b, s] = SLOT[id];
    for (const tema of ['chiaro', 'scuro']) {
      const h = COLORE.di(b, s, tema);
      if (COLORE.croma(h) < COLORE.CROMA_PAVIMENTO - 1e-6) smorti.push(id + '/' + tema + ' ' + h);
    }
  }
  esito(smorti.length === 0, 'nessun colore della regola scende sotto il pavimento di croma',
    smorti.join(', '));
}

/* ── oltre la capienza: colore distinto e avviso, poi errore esplicito ── */
{
  COLORE.azzeraAvvisi();
  const n = COLORE.capienza('arabo');
  const supp = COLORE.di('arabo', n, 'chiaro');
  const gia = [];
  for (let k = 0; k < n; k++) gia.push(COLORE.di('arabo', k, 'chiaro'));
  esito(gia.indexOf(supp) < 0 && COLORE.avvisi().length > 0,
    'oltre la capienza la regola dà un colore distinto e avvisa',
    'slot supplementare ' + supp + ', avvisi ' + COLORE.avvisi().length);
  let esploso = false;
  try { COLORE.di('arabo', 2 * n, 'chiaro'); } catch (e) { esploso = true; }
  esito(esploso, 'oltre il primo supplementare la regola fallisce con un errore esplicito',
    'non ha sollevato niente: una lista in eccesso riceverebbe un colore illeggibile');
  COLORE.azzeraAvvisi();
}

if (ko) process.exitCode = 1;
