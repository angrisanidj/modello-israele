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
import {fileURLToPath, pathToFileURL} from 'node:url';
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
/* Il codice d'uscita che dice «fermato da una guardia», non «rotto». Lo legge il log, e le
   prove lo leggono da qui invece di ricopiarlo. */
export const USCITA_GUARDIA = 4;
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
  /* IL CROLLO DELLE RIGHE VALIDE PUO' ESSERE UNA LISTA NUOVA, e fino al 30 agosto 2026 il
     job lo diceva col nome sbagliato. Misurato nella prova di regia dell'8 settembre, sul
     markup vero di Wikipedia con una colonna di lista ribattezzata: le righe valide passano
     da 165 a ZERO, «ignote» resta VUOTO, e tutte e sei le tabelle finiscono in «ignorate»
     nominando la colonna nuova. Il perche' e' meccanico: una lista nuova ha dei seggi,
     quindi nessuna riga somma piu' 120, quindi meno della meta' passa la validazione,
     quindi parseWiki scarta la tabella INTERA — e le sue colonne ignote finiscono in
     «ignorate», che nessuna guardia leggeva.
     Il job si fermava lo stesso, quindi non si e' mai pubblicato niente di sbagliato: si
     fermava dicendo «righe valide in crollo» invece di «colonne non riconosciute», e SENZA
     aprire la issue che elenca che cosa mappare — cioe' esattamente il segnale che l'8
     settembre serve, e che docs/mappare-una-lista-nuova.md dice di andare a leggere in
     da-fare.json.
     LA CONGIUNZIONE E' LA GUARDIA, e non si puo' sbagliare: righe valide in crollo E
     tabelle scartate che nominano colonne sconosciute. Separate non valgono — le colonne
     ignote da sole ci sono anche stasera (la tabella degli scenari ne ha tre: Winter,
     Other, Don't know) e farebbero scattare la guardia ogni notte; il crollo da solo puo'
     essere Wikipedia che riorganizza, ed e' il caso che la riga qui sotto continua a
     coprire. Insieme sono la firma del deposito delle liste, e nient'altro le produce. */
  const crollo = p.valide < p.valideIeri - SOGLIE.CALO_VALIDE;
  const nomiScartati = [];
  (p.ignorate || []).forEach(t => (t.ignote || []).forEach(c => {
    if (nomiScartati.indexOf(c) < 0) nomiScartati.push(c);
  }));
  if (crollo && nomiScartati.length)
    return {stop: 'righe valide in crollo (' + p.valide + ' contro ' + p.valideIeri +
                  ') e colonne non riconosciute nelle tabelle scartate: ' + nomiScartati.join(', '),
            issue: {titolo: 'Il parser ha trovato colonne di lista non riconosciute',
                    corpo: "L'aggiornamento notturno si e' fermato: le tabelle di Wikipedia " +
                           "contengono colonne che l'anagrafica non conosce, e con quelle " +
                           "colonne nessuna riga somma 120 — quindi le tabelle sono state " +
                           "scartate INTERE e le righe valide sono crollate da " + p.valideIeri +
                           " a " + p.valide + ".\n\n" +
                           nomiScartati.map(c => "- `" + c + "`").join("\n") +
                           "\n\nProbabilmente liste nuove (deposito dell'8 settembre?). Vanno " +
                           "mappate a mano in `W_LISTA` e in `P{}` — con `dentro` per le fusioni " +
                           "— dentro index.html, seguendo docs/mappare-una-lista-nuova.md.\n" +
                           "L'archivio pubblicato resta fermo all'ultimo giorno buono."}};
  if (crollo)
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

/* L'INDIRIZZO DELL'IMMAGINE, senza impronta. E' anche il ripiego scritto in pagina: chi
   apre il file da disco o arriva prima della prima notte vede l'immagine che c'e', e
   nessuna impronta puo' essere vera per lui. */
export const IMMAGINE = 'https://angrisanidj.github.io/modello-israele/dati/anteprima.png';

/* SCRIVE LE DUE META DELLA REGIONE, e conserva quella che non le viene data.
 * I due valori nascono in due momenti diversi dello stesso job e non si possono scrivere
 * insieme: og:title lo sa il parser (passo 7), l'impronta dell'immagine la sa il
 * generatore dell'anteprima (passo 8), che gira DOPO perche' disegna l'archivio appena
 * aggiornato. Quindi ciascuno passa quello che sa e l'altro valore si rilegge dalla
 * regione — che e' l'unica strada che non richiede a nessuno dei due di conoscere il
 * lavoro dell'altro. Il commit avviene dopo tutti e due, quindi lo stato committato e'
 * sempre coerente.
 * Funzione PURA: prende il file e restituisce il file. */
export function scriviMeta(html, titolo, impronta){
  const i = html.indexOf(MARCA_INIZIO);
  const j = html.indexOf(MARCA_FINE);
  /* Un marcatore mancante o invertito NON e' un caso da riparare indovinando: vuol dire che
     qualcuno ha riscritto il <head>, e allora il job non sa piu' dove sia la sua regione.
     Si ferma, e la pagina resta quella di ieri — e' il modo di fallire di tutto il resto. */
  if (i < 0 || j < 0 || j <= i) return null;
  const fineCommento = html.indexOf('-->', i);
  if (fineCommento < 0 || fineCommento > j) return null;
  const testa = html.slice(0, fineCommento + 3);
  const dentro = html.slice(fineCommento + 3, j);
  const coda  = html.slice(j);
  const esc = t => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
                            .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const leggi = prop => {
    const m = dentro.match(new RegExp('<meta property="' + prop + '" content="([^"]*)">'));
    return m ? m[1] : null;
  };
  /* CIASCUN VALORE: quello passato, o quello che c'e' gia'. */
  const tit = titolo != null ? esc(titolo) : leggi('og:title');
  const img = impronta != null ? esc(IMMAGINE + '?v=' + impronta) : leggi('og:image');
  /* SENZA TITOLO NON SI SCRIVE. E' la meta per cui la regione esiste: se non c'e' ne'
     quello passato ne' quello in pagina, qualcuno ha svuotato la regione e il job non deve
     ricostruirla indovinando. */
  if (tit == null) return null;
  let meta = '\n<meta property="og:title" content="' + tit + '">\n';
  if (img != null) meta += '<meta property="og:image" content="' + img + '">\n';
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

  /* SI RIGENERA test/app.js PRIMA DI LEGGERLO, e la ragione e' che ci sono cascato io.
     Questo script legge il MARKUP da index.html e il CODICE da test/app.js, che e' un
     prodotto: se qualcuno tocca index.html e non riestrae, il job gira col parser di ieri
     sul markup di oggi. In CI non succede — il workflow fa «node test/estrai.mjs» prima —
     ma «--prova» lo lancia una persona a mano, ed e' il PRIMO comando del contratto di
     docs/mappare-una-lista-nuova.md, cioe' quello che si esegue subito dopo aver aggiunto
     una grafia a W_LISTA.
     Successo il 30 agosto 2026 durante la prova di regia dell'8 settembre: tolta una grafia
     nota, «--prova» ha risposto «Niente da fare» — perche' stava interrogando il parser di
     prima della modifica. Venti minuti a cercare un difetto nella guardia, che non c'era.
     E' il caso peggiore della famiglia: non fallisce, RISPONDE, e risponde la cosa che ci si
     aspetta di leggere quando si crede che qualcosa non funzioni.
     Si importa il vero estrai.mjs invece di ricopiarne le tre righe: una seconda strada per
     l'estrazione sarebbe la strada doppia di sempre. Costa un secondo, e in CI e' una
     riesecuzione a vuoto che riscrive lo stesso file.
     pathToFileURL e non 'file:///'+percorso: quella composizione a mano vale solo su
     Windows, ed e' la lezione gia' pagata dall'anteprima og:image. */
  await import(pathToFileURL(join(RADICE, 'test', 'estrai.mjs')).href);

  let src = readFileSync(join(RADICE, 'test', 'app.js'), 'utf8');
  src = src.replace('carica().then(render,render)',
    'global.A={parseWiki:parseWiki,unisci:unisci,calcola:calcola,blocchi:blocchi,' +
    'chiaveEvento:chiaveEvento,SEG:function(){return SEG;},SOND:function(){return SOND;},' +
    'validaApparentamenti:validaApparentamenti,GAP_SONDAGGI:function(){return GAP_SONDAGGI;},' +
    'titoloCortoOra:titoloCortoOra,ipotesiNeiNumeri:ipotesiNeiNumeri,' +
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
  /* ══ I BLOCCHI REGISTRATI SONO QUELLI DELLA FONTE, E L'IPOTESI VA ACCANTO ══════════
     Cambiato il 31 agosto 2026, e le due ragioni sono di natura diversa: una riguarda la
     guardia qui sotto, l'altra chi legge il file dall'esterno.

     1 · LA GUARDIA E' SUI DATI, E NON DEVE POTER SCATTARE PER UNA DECISIONE UMANA.
     DELTA_BLOCCO esiste per accorgersi che «la proiezione di blocco si e' mossa troppo in
     24 ore», ed e' tarata sul banco storico: massimo osservato 2-3 seggi, soglia 6. Con
     blocchi() che segue la leva, il rovesciamento di PAR.inbilico del 30 agosto ha fatto
     passare la coalizione da 49 a 54 — CINQUE seggi contro una soglia di sei, cioe' la
     guardia e' passata per uno. Con DELTA_BLOCCO a 4 la notte si sarebbe fermata per una
     ragione che non ha niente a che vedere con la qualita' del dato.
     E leggere il conteggio della fonte NON TOGLIE NIENTE alla guardia: la leva cambia in
     quale campo una lista e' contata, non quanti seggi prende, quindi un movimento vero
     dei sondaggi si vede identico nei due conteggi. E' una riparazione senza prezzo.
     E SI RIPRESENTERA' A OGNI CAMBIO DI LEVA FUTURO, e il prossimo puo' valere piu' di
     cinque seggi: e' la ragione per cui non basta alzare la soglia.

     2 · E CHI LEGGE IL FILE DALL'ESTERNO NON HA MODO DI SAPERLO. dati/stato-job.json e'
     servito da Pages con access-control-allow-origin: *, e finora diceva «coalizione: 54»
     senza dichiarare che cinque di quei seggi ci sono PER IPOTESI. E' la regola di
     ipotesiNeiNumeri() — quello che esce dalla pagina deve portare l'ipotesi con se' —
     applicata a un FILE invece che a una frase, e non l'avevamo mai fatto: la stessa
     stringa che va nel testo di condivisione, nel prompt e nella targa dell'anteprima
     adesso va anche qui. Sesto consumatore, non un secondo testo.

     SCARTATA L'ALTERNATIVA DEI DUE CONTEGGI — «blocchi» della fonte piu' «blocchiModello»
     con l'ipotesi — e la ragione e' quella di sempre: sono due serie che divergono, e il
     primo che legge quella sbagliata non se ne accorge. Una serie sola piu' una frase che
     dice che cosa c'e' dentro non ha un modo sbagliato di essere letta. */
  const blocchi = A.blocchi(A.SEG(), true);
  const ipotesi = A.ipotesiNeiNumeri() || '';
  const ambigue = out.scartate.filter(x => x.tipo === 'ambigua').length;

  const esito = valuta({
    httpOk, byte: testo.length,
    valide: out.sondaggi.length, valideIeri: stato.valide,
    nuove, ignote: out.ignote || [], ignorate: out.ignorate || [],
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
    /* ESCE CON UN CODICE SUO, e la distinzione e' fra «FERMATO DA UNA GUARDIA» e «ROTTO»,
       non fra «uscito zero» e tutto il resto. Un guasto vero — Wikipedia irraggiungibile,
       il parser che esplode, lo stato assente — resta 1, e continua a saltare il job delle
       meta come adesso: le meta di un archivio ROTTO direbbero il contrario di quello che
       la pagina calcola. Una guardia e' un'altra cosa: l'archivio non e' rotto, e' fermo
       APPOSTA, e in quello stato le meta devono dire la cosa nuova invece di restare
       congelate ad affermare un risultato.
       QUATTRO E NON TRE: il 3 e' gia' preso da anteprima.mjs per «niente da pubblicare»,
       che e' l'esito OPPOSTO — tutto a posto, nulla da scrivere. Due esiti diversi con lo
       stesso numero sarebbero i due significati sulla stessa variabile che la targa del
       PNG ha gia' pagato. */
    process.exit(USCITA_GUARDIA);
  }

  /* «ipotesi» sta accanto ai blocchi e non altrove, perche' e' di loro che parla: dice che
     cosa c'e' dentro quei numeri. Stringa vuota quando l'ipotesi non sposta niente, che e'
     la stessa regola di ipotesiNeiNumeri() in pagina — dichiarare un'ipotesi che non cambia
     un numero insegna a saltare la riga proprio prima del giorno in cui conta. */
  const statoNuovo = {data: oggi, valide: out.sondaggi.length, ambigue, blocchi, ipotesi};

  if (prova){
    console.log('[prova] +' + nuove + ' rilevazioni (' + archivio.length + ' → ' + A.SOND().length + '), ' +
      '+' + reg.nuove + ' voci-evento, blocchi ' + JSON.stringify(blocchi));
    console.log('[prova] og:title: ' + A.titoloCortoOra());
    /* l'ipotesi si stampa anche a secco, perche' e' il campo che dice che cosa c'e' dentro
       i blocchi qui sopra: vederli senza vederla e' esattamente il difetto che il campo
       esiste per chiudere */
    console.log('[prova] ipotesi: ' + (A.ipotesiNeiNumeri() || '(nessuna: la leva non sposta niente)'));
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
  /* LE META NON SI SCRIVONO PIÙ QUI — dal 31 agosto 2026, e la ragione è che erano DUE
     RENDER. Questo script ne faceva uno e scriveva og:title; anteprima.mjs, il passo dopo,
     ne faceva un altro e scriveva og:image. A tenerli d'accordo era solo l'adiacenza dei due
     passi dentro lo stesso job — cioè niente di dichiarato. Il 30 agosto la leva è cambiata
     alle 19:58 e le meta sono rimaste ferme dieci ore, perché la guardia salta il job che
     scrive appena stato-job.json porta la data di oggi: quella data risponde a «l'archivio è
     già andato», e la stavamo usando anche per «le meta sono aggiornate». Un flag, due
     domande — la stessa forma di statoLeve() contro ipotesiNeiNumeri().
     Adesso le due meta nascono dallo stesso render, in anteprima.mjs, che gira in un job suo
     a ogni push. Qui resta il titolo solo come RIGA DI LOG, perché il registro della notte
     deve poter dire che cosa il modello ha calcolato — ma non lo scrive in pagina. */
  console.log('og:title calcolato · ' + A.titoloCortoOra() + '  (lo scrive anteprima.mjs)');
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
