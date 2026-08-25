/* Aggiornamento notturno dell'archivio da Wikipedia.
 *
 * Esegue il parser vero — quello estratto da index.html in test/app.js, non una copia —
 * sulla pagina scaricata, unisce le rilevazioni nuove a dati/archivio.json, deposita le
 * voci-evento non ancora viste in dati/eventi-grezzi.json con stato «nuovo», e aggiorna
 * dati/stato-job.json con i conteggi che faranno da riferimento alla notte successiva.
 *
 * Il modo di fallire è non fare niente: ogni guardia che scatta termina il processo con
 * uscita diversa da zero PRIMA di qualunque scrittura, la pagina pubblicata resta
 * com'era, e la notte dopo si riprova da capo. Se la guardia riguarda una decisione
 * umana — colonne di lista non riconosciute, configurazioni senza contenitore — viene
 * scritto guardia-issue.md nella radice del runner, e il workflow ne fa una issue.
 *
 * L'8 settembre 2026, al deposito delle liste, la guardia sulle colonne ignote scatterà
 * a ragione: l'archivio si congela all'ultimo giorno buono finché le liste nuove non
 * vengono mappate a mano in W_LISTA e P{} (con `dentro` per le fusioni). Fatto quello,
 * il job riprende da solo: nessun interruttore da ricordare.
 *
 * Uso:  node .github/scripts/aggiorna.mjs [--sorgente pagina.html] [--prova]
 *       --sorgente legge la pagina da file invece che dalla rete
 *       --prova esegue tutto ma non scrive niente (mostra cosa scriverebbe)
 */
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import {JSDOM} from 'jsdom';
import {componi} from './dafare.mjs';

const QUI = dirname(fileURLToPath(import.meta.url));
const RADICE = join(QUI, '..', '..');

/* ── Le guardie. Funzione pura: decide, non agisce. ──
 *
 * Le soglie, misurate il 21 agosto 2026:
 * · CORPO_MINIMO: la pagina reale pesa 3,1 MB; mezza pagina è una pagina troncata.
 * · CALO_VALIDE: Wikipedia ogni tanto riorganizza e qualche riga balla, ma un crollo
 *   delle righe valide è un parser che ha smesso di capire la struttura.
 * · MASSIMO_NUOVE: il ritmo vero è 1-3 rilevazioni al giorno; trenta nuove in una notte
 *   sono un parser che legge una tabella sbagliata.
 * · DELTA_BLOCCO: il movimento massimo della proiezione di blocco in 24 ore, misurato
 *   sul banco storico 2020-2022 (finali di campagna comprese) è 2 e sulla serie 2026 è
 *   3. La soglia è 6, il doppio del massimo mai osservato: un riassetto post-deposito
 *   muove le liste, non i blocchi, e se un movimento senza precedenti fosse vero, un
 *   giorno di ritardo per conferma umana è il comportamento giusto. */
export const SOGLIE = {CORPO_MINIMO: 1_000_000, CALO_VALIDE: 5, MASSIMO_NUOVE: 10, DELTA_BLOCCO: 6};

export function valuta(p){
  if (!p.httpOk) return {stop: 'Wikipedia non raggiungibile'};
  if (p.byte < SOGLIE.CORPO_MINIMO)
    return {stop: 'risposta troncata: ' + p.byte + ' byte, attesi almeno ' + SOGLIE.CORPO_MINIMO};
  if (p.ignote && p.ignote.length)
    return {stop: 'colonne di lista non riconosciute: ' + p.ignote.join(', '),
            issue: {titolo: 'Il parser ha trovato colonne di lista non riconosciute',
                    corpo: 'L\'aggiornamento notturno si è fermato: la tabella di Wikipedia ' +
                           'contiene colonne che l\'anagrafica non conosce.\n\n' +
                           p.ignote.map(c => '- `' + c + '`').join('\n') +
                           '\n\nProbabilmente liste nuove (deposito dell\'8 settembre?). Vanno mappate ' +
                           'a mano in `W_LISTA` e in `P{}` — con `dentro` per le fusioni — dentro ' +
                           'index.html. Fatto quello, il job riprende da solo la notte successiva.\n' +
                           'L\'archivio pubblicato resta fermo all\'ultimo giorno buono.'}};
  if (p.ambigue > p.ambigueIeri)
    return {stop: 'configurazioni ambigue in crescita: ' + p.ambigue + ' contro ' + p.ambigueIeri,
            issue: {titolo: 'Il parser ha trovato nuove celle su più liste senza contenitore',
                    corpo: 'Le righe con una cella che copre più liste senza un contenitore comune ' +
                           'in anagrafica sono passate da ' + p.ambigueIeri + ' a ' + p.ambigue + '. ' +
                           'Una configurazione nuova va dichiarata in `P{}` col campo `dentro`, oppure ' +
                           'lasciata fuori a ragion veduta aggiornando `dati/stato-job.json`.'}};
  if (p.valide < p.valideIeri - SOGLIE.CALO_VALIDE)
    return {stop: 'righe valide in crollo: ' + p.valide + ' contro le ' + p.valideIeri + ' di ieri'};
  if (p.nuove > SOGLIE.MASSIMO_NUOVE)
    return {stop: 'troppe rilevazioni nuove in una notte: ' + p.nuove};
  for (const b of Object.keys(p.blocchiIeri || {})){
    if (p.blocchi[b] === undefined) continue;
    const d = Math.abs(p.blocchi[b] - p.blocchiIeri[b]);
    if (d > SOGLIE.DELTA_BLOCCO)
      return {stop: 'il blocco «' + b + '» si muove di ' + d + ' seggi in un giorno: ' +
                    p.blocchiIeri[b] + ' → ' + p.blocchi[b]};
  }
  return {ok: true};
}

/* ── Il registro delle voci-evento: aggiunge le chiavi mai viste, non tocca le altre. ── */
export function aggiornaRegistro(registro, eventi, chiaveDi, oggi){
  const note = new Set((registro || []).map(r => r.chiave));
  const nuove = [];
  (eventi || []).forEach(e => {
    if (!e.data || !e.testo) return;
    const k = chiaveDi(e.data, e.testo);
    if (note.has(k)) return;
    note.add(k);
    nuove.push({chiave: k, data: e.data, testo: e.testo, visto: oggi, stato: 'nuovo'});
  });
  return {registro: (registro || []).concat(nuove), nuove: nuove.length};
}

/* ── LE META DELLO STATO: L'UNICA COSA CHE IL JOB SCRIVE IN index.html ──
 *
 * Fino al 23 agosto 2026 la regola era «il job tocca solo dati/», e la regola era anche il
 * segnale d'allarme: un commit notturno su index.html era per definizione un'anomalia. Non
 * è stata aggirata — è stata riscritta, con l'eccezione più stretta che si potesse dare:
 * una regione delimitata da due marcatori, dentro la quale può stare solo un elenco
 * dichiarato di meta. Il segnale si è spostato di conseguenza, e adesso è una prova:
 * test/struttura.mjs legge il diff e dichiara anomalo qualunque commit notturno che tocchi
 * una riga fuori dai marcatori.
 *
 * IL TESTO NON NASCE QUI. og:title è titoloCortoOra() della pagina vera, cioè la stessa
 * riga con cui render() scrive document.title: ricomporlo da formaTitolo() e blocchi()
 * sarebbe una seconda strada per la stessa frase, e per giunta in un altro processo, dove
 * nessuno la vedrebbe divergere.
 *
 * Funzione PURA: prende il file e il titolo, restituisce il file. Non legge e non scrive
 * niente, così le prove la esercitano senza montare un DOM e senza toccare il disco. */
export const MARCA_INIZIO = '<!-- ══ META DELLO STATO · INIZIO';
export const MARCA_FINE   = '<!-- ══ META DELLO STATO · FINE ══ -->';

export function scriviMeta(html, titolo){
  const i = html.indexOf(MARCA_INIZIO);
  const j = html.indexOf(MARCA_FINE);
  /* Un marcatore mancante o invertito NON è un caso da riparare indovinando: vuol dire che
     qualcuno ha riscritto il <head>, e allora il job non sa più dove sia la sua regione.
     Si ferma, e la pagina resta quella di ieri — è il modo di fallire di tutto il resto. */
  if (i < 0 || j < 0 || j <= i) return null;
  /* la coda del marcatore d'apertura è il commento che spiega la regola a chi legge il
     file: si conserva. Si riscrive solo quello che sta fra la fine del commento e la fine
     della regione. */
  const fineCommento = html.indexOf('-->', i);
  if (fineCommento < 0 || fineCommento > j) return null;
  const testa = html.slice(0, fineCommento + 3);
  const coda  = html.slice(j);
  /* Il titolo entra in un attributo HTML: virgolette, & e angolari vanno protetti, o una
     virgoletta dritta spezza l'attributo. I testi di TIT_CORTO_* non ne hanno oggi, e
     «oggi» non è una garanzia — l'8 settembre una lista nuova può portarne uno nel nome. */
  const esc = t => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
                            .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const meta = '\n<meta property="og:title" content="' + esc(titolo) + '">\n';
  return testa + meta + coda;
}

/* ── L'orchestrazione. Solo quando lo script è eseguito direttamente. ── */
async function main(){
  const argomenti = process.argv.slice(2);
  const prova = argomenti.includes('--prova');
  const iSorgente = argomenti.indexOf('--sorgente');

  /* la pagina */
  let testo, httpOk = true;
  if (iSorgente >= 0){
    testo = readFileSync(argomenti[iSorgente + 1], 'utf8');
  } else {
    try {
      const r = await fetch('https://en.wikipedia.org/api/rest_v1/page/html/Opinion_polling_for_the_2026_Israeli_legislative_election',
        {headers: {Accept: 'text/html'}});
      httpOk = r.ok;
      testo = httpOk ? await r.text() : '';
    } catch (e){ httpOk = false; testo = ''; }
  }

  /* il parser vero, dentro un DOM jsdom come nelle prove */
  const dom = new JSDOM('<!doctype html><html><body><div id="kn26"></div></body></html>', {pretendToBeVisual: true});
  const W = dom.window, D = W.document;
  global.DOMParser = W.DOMParser;
  const html = readFileSync(join(RADICE, 'index.html'), 'utf8');
  D.body.innerHTML = html.replace(/<script>[\s\S]*?<\/script>/g, '').match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
  global.document = D; global.window = W;
  W.matchMedia = () => ({matches: false, addEventListener(){}, addListener(){}});
  W.IntersectionObserver = class {observe(){} unobserve(){}};
  global.IntersectionObserver = W.IntersectionObserver;
  W.requestAnimationFrame = f => f();
  /* jsdom espone localStorage come getter: in un modulo ESM (strict) l'assegnazione
     lancerebbe. Quello vero di jsdom va benissimo: parte vuoto. */
  global.getComputedStyle = () => ({getPropertyValue: () => ''});
  global.Blob = function(){}; global.URL = {createObjectURL(){ return ''; }};
  global.FileReader = function(){}; global.fetch = () => Promise.reject(0);

  let src = readFileSync(join(RADICE, 'test', 'app.js'), 'utf8');
  src = src.replace('carica().then(render,render)',
    'global.A={parseWiki:parseWiki,unisci:unisci,calcola:calcola,blocchi:blocchi,' +
    'chiaveEvento:chiaveEvento,SEG:function(){return SEG;},SOND:function(){return SOND;},' +
    'validaApparentamenti:validaApparentamenti,GAP_SONDAGGI:function(){return GAP_SONDAGGI;},' +
    'titoloCortoOra:titoloCortoOra,' +
    'setSOND:function(v){SOND=v;},sim:function(v){SIM=v;}};carica().then(render,render)');
  eval(src);
  await new Promise(res => setTimeout(res, 2500));
  const A = global.A;
  A.sim(500);                                     /* il Monte Carlo qui non serve a niente */

  /* lo stato di ieri */
  const pStato = join(RADICE, 'dati', 'stato-job.json');
  const stato = existsSync(pStato) ? JSON.parse(readFileSync(pStato, 'utf8')) : null;
  if (!stato){ console.error('dati/stato-job.json assente: va seminato prima del primo giro'); process.exit(1); }

  /* il parse e l'unione */
  const out = httpOk && testo ? A.parseWiki(testo, ['2026']) : {sondaggi: [], scartate: [], eventi: [], ignote: []};
  const archivio = JSON.parse(readFileSync(join(RADICE, 'dati', 'archivio.json'), 'utf8'));
  A.setSOND(archivio.slice());
  const nuove = out.sondaggi.length ? A.unisci(out.sondaggi) : 0;
  A.calcola();
  const blocchi = A.blocchi(A.SEG());
  const ambigue = out.scartate.filter(x => x.tipo === 'ambigua').length;

  const esito = valuta({
    httpOk, byte: testo.length,
    valide: out.sondaggi.length, valideIeri: stato.valide,
    nuove, ignote: out.ignote || [],
    ambigue, ambigueIeri: stato.ambigue,
    blocchi, blocchiIeri: stato.blocchi
  });

  const oggi = new Date().toISOString().slice(0, 10);
  const archivioAl = A.SOND().map(s => s.data).sort().pop() || null;
  const registro = JSON.parse(readFileSync(join(RADICE, 'dati', 'eventi-grezzi.json'), 'utf8'));
  const reg = aggiornaRegistro(registro, out.eventi, A.chiaveEvento, oggi);

  /* ── IL RIEPILOGO, SCRITTO PRIMA DELLE GUARDIE ──
   *
   * Le guardie escono senza scrivere niente, ed è il loro contratto. Ma il riepilogo non
   * è un dato del modello: è il referto, e va scritto PROPRIO nelle notti in cui il job
   * si ferma — quelle in cui c'è qualcosa da fare. Scritto dopo, mancherebbe quando serve.
   *
   * Le voci-evento che il riepilogo elenca sono quelle che ENTREREBBERO: il registro su
   * disco non è ancora stato toccato, e non lo sarà se una guardia ferma tutto. È l'unica
   * differenza fra quello che il file annuncia e quello che il repository contiene, e va
   * saputa: il riepilogo dice «da tradurre», non «già nel registro».
   *
   * `esecuzioni` viene da fuori, dal workflow, che sa contare le esecuzioni fallite di fila:
   * una notte bloccata non committa niente, quindi da qui dentro non è ricavabile. */
  const daFare = componi({
    oggi,
    guardia: esito.stop || null,
    esecuzioni: +(process.env.ESECUZIONI_FERME || 0) || null,
    archivioAl,
    nuove,
    accordiInvalidi: A.validaApparentamenti(),
    ignote: out.ignote || [],
    ambigue, ambigueIeri: stato.ambigue,
    esempiAmbigui: out.scartate.filter(x => x.tipo === 'ambigua')
      .map(x => ({data: x.data, istituto: x.istituto, motivo: x.motivo})),
    eventiNuovi: reg.registro.filter(r => r.stato === 'nuovo' && r.visto === oggi),
    quiete: archivioAl
      ? Math.round((Date.parse(oggi) - Date.parse(archivioAl)) / 864e5) : 0,
    gapSondaggi: A.GAP_SONDAGGI()
  });
  if (!prova) writeFileSync(join(RADICE, 'dati', 'da-fare.json'), JSON.stringify(daFare, null, 1) + '\n');
  console.log('riepilogo: ' + daFare.riga);

  if (esito.stop){
    console.error('GUARDIA: ' + esito.stop);
    /* La issue della guardia non si scrive più qui: il canale è uno solo, ed è il
       riepilogo appena scritto — che porta la stessa cosa da fare, con dentro anche
       tutto il resto della nottata. `esito.issue` resta perché è la spiegazione che
       valuta() dà della sua decisione, e le prove la leggono da lì. */
    process.exit(1);
  }

  const statoNuovo = {data: oggi, valide: out.sondaggi.length, ambigue, blocchi};

  if (prova){
    console.log('[prova] +' + nuove + ' rilevazioni (' + archivio.length + ' → ' + A.SOND().length + '), ' +
      '+' + reg.nuove + ' voci-evento, blocchi ' + JSON.stringify(blocchi));
    console.log('[prova] og:title: ' + A.titoloCortoOra());
    console.log('[prova] da-fare.json:\n' + JSON.stringify(daFare, null, 1));
    process.exit(0);
  }

  /* LO STATO SI SCRIVE A OGNI NOTTE RIUSCITA, ANCHE A MANI VUOTE, e prima non era così.
     `k-upd` dichiara «ultima verifica riuscita» e leggeva un file che veniva riscritto
     solo quando arrivavano rilevazioni nuove: una notte in cui il job gira benissimo e
     Wikipedia non ha niente non lasciava traccia. Misurato sull'archivio: da giugno ci
     sono undici intervalli di tre o più giorni senza rilevazioni, il più lungo di sei,
     quindi la testata mostrava «verificato il … · N giorni fa» nello stile «vecchio» di
     routine, e non era vero. Il prezzo è un commit al giorno anche quando non c'è niente
     di nuovo: è accettato, perché un segnale che mente è peggio di un commit in più — e
     perché da domani questo file lo legge anche un agente. */
  /* LE META DELLO STATO, e stanno QUI e non più su perché valgono la stessa regola di
     tutto il resto: una guardia che scatta esce senza scrivere niente, e la pagina
     pubblicata resta quella di ieri. Un og:title aggiornato su un archivio respinto
     direbbe il contrario di quello che la pagina calcola.
     Il titolo esce dal modello appena ricalcolato da A.calcola(), quindi è esattamente lo
     stato che il lettore vedrà stamattina. */
  const pIndex = join(RADICE, 'index.html');
  const titolo = A.titoloCortoOra();
  const indexNuovo = scriviMeta(readFileSync(pIndex, 'utf8'), titolo);
  if (indexNuovo === null){
    console.error('GUARDIA: i marcatori delle meta dello stato non sono più in index.html');
    process.exit(1);
  }
  writeFileSync(pIndex, indexNuovo);
  console.log('og:title · ' + titolo);
  if (nuove) writeFileSync(join(RADICE, 'dati', 'archivio.json'), JSON.stringify(A.SOND(), null, 1) + '\n');
  writeFileSync(join(RADICE, 'dati', 'eventi-grezzi.json'), JSON.stringify(reg.registro, null, 1) + '\n');
  writeFileSync(pStato, JSON.stringify(statoNuovo, null, 1) + '\n');
  console.log((nuove ? '+' + nuove + ' rilevazioni (' + archivio.length + ' → ' + A.SOND().length + ')'
                     : 'nessuna rilevazione nuova') +
    ', +' + reg.nuove + ' voci-evento nel registro');
  process.exit(0);
}

/* main() parte solo quando lo script è il punto d'ingresso: importato dalle prove,
   che di valuta() e aggiornaRegistro() hanno bisogno pure, non fa nulla */
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('scripts/aggiorna.mjs')) main();
