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

/* La mappa lista → slot NON sta più qui, ed è la riparazione che conta di questa prova.
   Era una terza copia dell'ordinamento — dopo l'anagrafica della pagina e l'ORDINE della
   regola — e appena la regola ha cambiato l'ordine sono cadute quattordici asserzioni
   che dicevano «regola e pagina non sono d'accordo» mentre la pagina era giusta e la
   copia era vecchia. Una prova che si rompe quando la cosa provata è corretta non prova
   niente: dice solo che qualcuno ha dimenticato di aggiornarla.
   Adesso l'elenco delle liste viene da COLORE.ORDINE e il colore da COLORE.diLista(),
   che è la stessa porta che usa chi rigenera la tavolozza. */
const ATTESE = Object.keys(COLORE.ORDINE)
  .reduce((a, b) => a.concat(COLORE.ORDINE[b]), []);

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

esito(Object.keys(chiaro).length === ATTESE.length,
  'la pagina contiene le ' + ATTESE.length + ' liste che la regola conosce',
  'pagina ' + Object.keys(chiaro).length + ' · regola ' + ATTESE.length);
/* e sono le stesse: una lista in anagrafica che la regola non conosce non avrebbe
   colore l'8 settembre, e non se ne accorgerebbe nessuno finché non si guarda */
const soloPagina = Object.keys(chiaro).filter(i => ATTESE.indexOf(i) < 0);
const soloRegola = ATTESE.filter(i => !chiaro[i]);
esito(soloPagina.length === 0 && soloRegola.length === 0,
  'e sono le stesse liste, non solo lo stesso numero',
  'solo in pagina: ' + (soloPagina.join(', ') || '—') +
  ' · solo nella regola: ' + (soloRegola.join(', ') || '—'));

/* ── il confronto vero, lista per lista, nei due temi ── */
for (const id of ATTESE) {
  const attesoC = (COLORE.diLista(id, 'chiaro') || '').toUpperCase();
  const attesoS = (COLORE.diLista(id, 'scuro') || '').toUpperCase();
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
      /* IL TOKEN DI BLOCCO NON È PIÙ LO SLOT 0, e la differenza va capita prima di
         leggere questa riga come un allentamento. Fino alla consegna 4 il token era
         di(blocco, 0): il colore del capolista faceva anche da colore del blocco, e la
         prova legava le due strade proprio così. Dalla consegna 6 i quattro token sono
         una USCITA A SÉ della regola — COLORE.token() — perché devono rispettare fra
         loro distanze e contrasti che il capolista non può garantire: lo slot 0 è scelto
         per stare lontano dalle altre liste del suo blocco, non dagli altri tre token.
         Misurato sulla tavolozza applicata: con i token = slot 0 la distanza minima fra
         i quattro scenderebbe, mentre i token dedicati tengono 35,07 in chiaro e 39,45
         in scuro.
         Quel che NON cambia è la proprietà che questa prova esiste per tenere: una sola
         sorgente, e la pagina che non può divergerne. È cambiata la funzione, non il
         legame — e per questo l'asserzione resta, invece di sparire. */
      for (const tema of ['chiaro', 'scuro']) {
        const atteso = COLORE.token(b, tema).toUpperCase();
        esito(tok[tema][k] === atteso, 'il token --' + k + ' del tema ' + tema + ' segue la regola',
          'regola ' + atteso + ' / pagina ' + tok[tema][k]);
      }
      /* e non coincide col capolista: se un giorno tornasse a coincidere sarebbe un
         indizio che qualcuno ha rimesso di(blocco,0) al posto di token() */
      esito(COLORE.token(b, 'chiaro').toUpperCase() !== COLORE.di(b, 0, 'chiaro').toUpperCase(),
        'e il token --' + k + ' è un colore suo, non quello del capolista',
        'token ' + COLORE.token(b, 'chiaro') + ' · slot 0 ' + COLORE.di(b, 0, 'chiaro'));
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

/* ── nessun colore assegnato è il grigio di ripiego ──
 *
 * La regola non ha un pavimento di croma: il dominio è costruito dentro il settore e la
 * finestra, quindi un grigio non può nascerne. Ne esce da UNA sola strada, il ripiego di
 * di() quando lo slot supera la saturazione del blocco — e quel grigio è #626D7E, cioè
 * --mute, il colore del testo attenuato. Una lista dipinta come testo disabilitato è
 * esattamente il difetto che non si nota guardando la pagina di fretta. */
{
  const RIPIEGO = {chiaro:'#626D7E', scuro:'#7D8A9B'};
  const smorti = [];
  for (const id of ATTESE) for (const tema of ['chiaro', 'scuro']) {
    const h = (COLORE.diLista(id, tema) || '').toUpperCase();
    if (h === RIPIEGO[tema].toUpperCase()) smorti.push(id + '/' + tema);
    else if (COLORE.misuraColore(h).C < 0.04) smorti.push(id + '/' + tema + ' croma ' + COLORE.misuraColore(h).C.toFixed(3));
  }
  esito(smorti.length === 0,
    'nessuna delle venti liste riceve il grigio di ripiego, né un colore che si legga grigio',
    smorti.join(', '));
}

/* ── la capienza dice la saturazione vera, non il tetto che le si è chiesto ──
 *
 * La consegna 6 calcolava capienza() con palette(tema, 7) e riportava «liberi» come
 * riempiti − in_anagrafica: un blocco che riempiva sette slot su sette risultava pieno
 * anche quando ne reggeva dodici. Il §9 dichiarava «opposizione a zero slot liberi in
 * tutti e due i temi», e non era vero: l'opposizione satura a 12 e ne ha cinque liberi.
 * Il blocco davvero pieno è uno solo, l'ago della bilancia in tema chiaro.
 * È un difetto della forma peggiore — un numero giusto per la domanda sbagliata — e la
 * prova sta qui perché quel numero lo si legge una volta sola, la sera del deposito. */
{
  const cap = COLORE.capienza();
  esito(cap.chiaro.opposizione.saturazione > 7,
    'la capienza è la saturazione, non il tetto chiesto: l\'opposizione va oltre sette',
    'satura a ' + cap.chiaro.opposizione.saturazione + ' in chiaro');
  esito(cap.chiaro.incerto.liberi === 0,
    'e l\'ago della bilancia in chiaro è il blocco davvero pieno: zero slot liberi',
    'satura a ' + cap.chiaro.incerto.saturazione + ' con ' + cap.chiaro.incerto.in_anagrafica + ' liste');
  for (const tema of ['chiaro', 'scuro']) for (const b of COLORE.BLOCCHI)
    esito(cap[tema][b].liberi >= 0,
      'ogni lista in anagrafica ha uno slot: ' + b + ' / ' + tema,
      'satura a ' + cap[tema][b].saturazione + ', in anagrafica ' + cap[tema][b].in_anagrafica);
  /* il rimedio si trova dal punto in cui la regola fallisce, non cercandolo */
  esito(/§9/.test(cap.ripiego || ''),
    'e capienza() dice dove andare quando un blocco è pieno', cap.ripiego);
}

/* ── oltre la saturazione: colore distinto e avviso, poi errore esplicito ──
 *
 * La consegna 6 restituiva il grigio in silenzio. Il primo slot oltre la saturazione può
 * ancora dare qualcosa, ma deve dirlo; dal secondo in poi non c'è niente da dare, e
 * fallire è l'unica risposta onesta. */
{
  COLORE.azzeraAvvisi();
  const sat = COLORE.capienza().chiaro.incerto.saturazione;
  const supp = COLORE.di('incerto', sat, 'chiaro');
  esito(COLORE.avvisi().length > 0,
    'oltre la saturazione la regola avvisa invece di tacere',
    'slot supplementare ' + supp + ', avvisi ' + COLORE.avvisi().length);
  esito(/§9/.test(COLORE.avvisi()[0] || ''),
    'e l\'avviso dice dove sta la scala di ripiego', COLORE.avvisi()[0]);
  let esploso = false, messaggio = '';
  try { COLORE.di('incerto', sat + 1, 'chiaro'); } catch (e) { esploso = true; messaggio = e.message; }
  esito(esploso, 'oltre il primo supplementare la regola fallisce con un errore esplicito',
    'non ha sollevato niente: una lista in eccesso riceverebbe --mute e sembrerebbe spenta');
  esito(/saturo|§9/.test(messaggio),
    'e l\'errore dice quale blocco e dove guardare', messaggio.slice(0, 90));
  COLORE.azzeraAvvisi();
}

if (ko) process.exitCode = 1;
