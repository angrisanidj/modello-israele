/* Il parser della tabella Wikipedia, quello che gira davvero.
 *
 * Fino a oggi questa suite valutava `dati/wikiparser.js`, che è una SECONDA COPIA del
 * parser: 197 righe di logica duplicata, rimaste indietro rispetto a index.html. La suite
 * era verde mentre il parser vero perdeva 90 rilevazioni su 116. È la trappola delle due
 * strade descritta in CLAUDE.md, con dentro un parser invece di un colore.
 * Ora si carica `test/app.js`, cioè il JavaScript estratto da index.html: c'è una strada
 * sola, e quello che si prova è quello che gira.
 *
 * La fixture è tarata sulle forme misurate sulla pagina reale il 21 agosto 2026:
 *   · cella «Joint List» con colspan=2, che vale una volta sola e sta al contenitore;
 *   · cella che copre Ra'am + Hadash–Ta'al + Balad, senza contenitore in anagrafica;
 *   · celle senza cifre nelle loro scritture vere: «—N/a», «N/A», «n/a», «—»;
 *   · «(<1%)», che è una percentuale con un segno di disuguaglianza davanti;
 *   · il CSS che Wikipedia inietta dentro la cella con un <style>;
 *   · una tabella dove il conteggio delle righe valide decide se accettarla.
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
  'global.A={parseWiki:parseWiki,wTesto:wTesto,wContenitore:wContenitore,' +
  'msgAggiorna:msgAggiorna,ed:ed,' +
  'P:function(){return P;}};carica().then(render,render)');
eval(src);

setTimeout(function(){
  const A = global.A;
  const out = A.parseWiki(require('../../dati/fixture.js'), ['2026']);
  const d = out.sondaggi;
  const somma = s => Object.keys(s.seggi).reduce((a,k) => a + s.seggi[k], 0);
  const per = k => d.filter(s => s.data === k);

  console.log('sondaggi accettati: ' + d.length + '   scartati: ' + out.scartate.length +
    '   eventi: ' + out.eventi.length + '   tabelle ignorate: ' + out.ignorate.length);
  d.forEach(s => console.log('   ' + s.data + '  ' + String(s.istituto).padEnd(16) +
    ' somma ' + somma(s) + '  ' + JSON.stringify(s.seggi)));
  out.scartate.forEach(s => console.log('   scartata ' + s.data + ' ' +
    String(s.istituto).padEnd(16) + ' [' + s.tipo + '] ' + s.motivo));
  console.log('');

  /* ══ le prove che c'erano già, ora sul parser vero ══ */
  esito(!d.some(s => s.seggi.byachad === 30), 'la riga di scenario, che eredita la data, resta esclusa');
  esito(!d.some(s => s.data.startsWith('2025')), 'la sezione 2025 resta esclusa');
  esito(!d.some(s => s.seggi.likud === 40), 'la tabella degli scenari ipotetici resta esclusa');
  esito(out.scartate.some(x => x.tipo === 'blocco'), 'la riga col totale di blocco sbagliato viene scartata');
  esito(out.eventi.some(e => /primary/.test(e.testo)), 'la riga-evento viene intercettata');
  esito(d[0] && d[0].testata === 'Kan 11', 'le note [21] sono ripulite dalla testata', d[0] && d[0].testata);
  esito(d.some(s => s.istituto === 'Direct Polls' && s.casa === 1), 'Filber è normalizzato in Direct Polls');
  esito(d.every(s => somma(s) === 120), 'ogni riga accettata somma 120',
    JSON.stringify(d.filter(s => somma(s) !== 120).map(s => s.data + ':' + somma(s))));

  /* ══ 1 · colspan nelle righe di dato ══ */
  const dueCol = per('2026-08-20')[0];
  esito(!!dueCol, 'la riga con la cella «Joint List» su due colonne viene accettata');
  esito(!!dueCol && somma(dueCol) === 120,
    'quella riga somma 120: la cella vale una volta sola, non due',
    dueCol && String(somma(dueCol)));
  esito(!!dueCol && dueCol.seggi.lista_araba === 7,
    'il valore va al CONTENITORE lista_araba', dueCol && JSON.stringify(dueCol.seggi));
  esito(!!dueCol && dueCol.seggi.hadash_taal === undefined && dueCol.seggi.balad === undefined,
    'e non alle componenti: il doppio conteggio chiuso ieri non si riapre',
    dueCol && JSON.stringify(dueCol.seggi));
  /* il verso opposto: dove le colonne sono due celle distinte restano due componenti */
  esito(d[0] && d[0].seggi.hadash_taal === 6 && d[0].seggi.lista_araba === undefined,
    'con due celle distinte restano invece le componenti', d[0] && JSON.stringify(d[0].seggi));
  esito(d.every(s => !(s.seggi.lista_araba !== undefined &&
      (s.seggi.hadash_taal !== undefined || s.seggi.balad !== undefined))),
    'nessuna riga porta insieme contenitore e componenti');
  /* una cella su tre liste senza contenitore comune non si indovina: si respinge */
  const amb = out.scartate.filter(x => x.tipo === 'ambigua');
  esito(amb.length === 1 && /raam/.test(amb[0].motivo),
    'la cella che copre Ra\'am con le altre due viene respinta, non attribuita a caso',
    JSON.stringify(amb.map(x => x.motivo)));

  /* ══ 2 · celle senza cifre e percentuali ══ */
  const sotto = per('2026-08-15')[0];
  esito(!!sotto, 'la riga con «(<1%)», «N/A» e «n/a» viene accettata');
  esito(!!sotto && somma(sotto) === 120, 'e somma 120', sotto && String(somma(sotto)));
  esito(!!sotto && sotto.sotto && sotto.sotto.blue_white === 1,
    '«(<1%)» è letta come percentuale sotto soglia', sotto && JSON.stringify(sotto.sotto));
  esito(!!sotto && sotto.seggi.casa_sionista === undefined && sotto.seggi.unity_erdan === undefined,
    '«N/A» e «n/a» non diventano seggi', sotto && JSON.stringify(sotto.seggi));
  /* il CSS iniettato da Wikipedia non deve arrivare fino al valore */
  const conCss = D.createElement('td');
  conCss.innerHTML = '—<style>.mw-parser-output .sr-only{border:0;height:1px;margin:-1px}</style>N/a';
  esito(A.wTesto(conCss) === '—N/a',
    'il <style> iniettato da Wikipedia non finisce nel valore della cella',
    '"' + A.wTesto(conCss) + '"');
  esito(!/\d/.test(A.wTesto(conCss)),
    'e quindi la cella resta senza cifre, com\'è giusto che sia');

  /* ══ 3 · il conteggio delle valide decide sulla tabella ══ */
  const soglia = ['2026-08-09','2026-08-08','2026-08-07','2026-08-05'].map(k => per(k)[0]).filter(Boolean);
  esito(soglia.length === 4,
    'la tabella di prova entra con le sue quattro righe valide: 4 su 6, il 67%',
    String(soglia.length) + ' su 4 attese');
  esito(soglia.every(s => somma(s) === 120 && s.seggi.blue_white === undefined),
    'quelle righe sommano 120 con la colonna «—N/a» semplicemente non rilevata');
  esito(out.scartate.filter(x => /2026-08-0[32]/.test(x.data)).length === 2,
    'e le due righe rotte davvero restano scartate',
    JSON.stringify(out.scartate.filter(x => /2026-08-0[32]/.test(x.data)).map(x => x.motivo)));
  /* il legame: se quelle quattro non fossero valide la tabella cadrebbe sotto il 50%
     e si porterebbe via anche loro. È il difetto misurato sulla pagina vera. */
  esito(soglia.length / 6 >= 0.5,
    'il conteggio che decide la sorte della tabella è quello delle righe davvero valide',
    (100 * soglia.length / 6).toFixed(0) + '%');

  /* ══ 4 · le tabelle che non sono di seggi restano fuori ══ */
  esito(out.ignorate.length === 2,
    'restano ignorate solo le due tabelle che non sono di seggi',
    JSON.stringify(out.ignorate));
  esito(!out.ignote.length, 'nessuna colonna di lista non riconosciuta',
    JSON.stringify(out.ignote));

  /* ══ 5 · IL MESSAGGIO CHE IL LETTORE LEGGE ═════════════════════════════════
   *
   * Stava dentro il gestore del pulsante, dietro una chiamata di rete: nessuna prova lo
   * guardava, e i suoi due difetti sono stati trovati a occhio. Adesso è msgAggiorna(),
   * una funzione pura, e questi sono i due difetti scritti come proprietà.
   *
   * IL CONTO CHE NON TORNAVA. Misurato sulla pagina vera il 23 agosto 2026: 33 righe
   * scartate, e il messaggio stampava 9, 6, 3 e 24. Nessuna riga contata due volte e
   * nessuna mancante — il 9 È il 6 più il 3 — ma la scomposizione proseguiva l'elenco con
   * le stesse virgole delle altre voci, e il grassetto era l'unico a dire che era una
   * scomposizione. La proprietà che si prova è quella del LETTORE, non quella del codice:
   * i numeri FUORI dalle parentesi sommano le righe dichiarate. */
  const nudo = s => String(s).replace(/<[^>]+>/g, '');
  const clausola = m => (nudo(m).match(/la validazione: ([^.]*)\./) || ['',''])[1];
  const fuoriParentesi = c => (c.replace(/\([^)]*\)/g, '').match(/\d+/g) || []).map(Number);
  const finto = (tipi, ign) => ({
    sondaggi: new Array(100).fill(0).map(() => ({})),
    scartate: Object.keys(tipi).reduce((a, t) =>
      a.concat(new Array(tipi[t]).fill(0).map(() => ({tipo: t}))), []),
    eventi: [], ignote: [],
    ignorate: new Array(ign || 0).fill(0).map(() => ({righe: 5, ignote: []}))
  });

  {
    /* i numeri della pagina vera del 23 agosto 2026, che è il caso da cui viene il difetto */
    const o = finto({somma: 6, blocco: 3, ambigua: 24}, 1);
    const m = A.msgAggiorna(o, 0, 0), c = clausola(m);
    const f = fuoriParentesi(c);
    esito(f.reduce((a, b) => a + b, 0) === o.scartate.length,
      'i numeri fuori dalle parentesi sommano le righe dichiarate: 9 + 24 = 33',
      f.join(' + ') + ' = ' + f.reduce((a, b) => a + b, 0) + ' contro ' + o.scartate.length);
    esito(/di cui 6 con i seggi che non sommano a 120 e 3 con il totale di blocco discordante/.test(c),
      'e la scomposizione delle incoerenze della fonte sta dietro un «di cui», dentro le parentesi', c);
    esito(!/, 6 con i seggi/.test(c),
      'non più in fila con le altre voci, dove chi somma quello che vede arrivava a 42');
  }

  {
    /* tutti i tipi insieme, compreso uno che il parser non produce ancora */
    const o = finto({somma: 2, blocco: 1, ambigua: 5, illeggibile: 3, altro: 4, boh: 7}, 0);
    const c = clausola(A.msgAggiorna(o, 0, 0));
    const f = fuoriParentesi(c);
    esito(f.reduce((a, b) => a + b, 0) === o.scartate.length,
      'il conto torna anche con tutti i tipi insieme',
      f.join(' + ') + ' = ' + f.reduce((a, b) => a + b, 0) + ' contro ' + o.scartate.length);
    esito(/7<\/b> per motivi che il messaggio non sa ancora nominare/.test(A.msgAggiorna(o, 0, 0)),
      'e un tipo che il messaggio non sa nominare diventa una voce sua invece di sparire dalla somma',
      c);
  }

  {
    /* un tipo solo: niente parentesi, e il numero è quello */
    const o = finto({ambigua: 4}, 0);
    const c = clausola(A.msgAggiorna(o, 0, 0));
    esito(!/\(/.test(c), 'con un tipo solo non c\'è nessuna scomposizione da nascondere', c);
    esito(fuoriParentesi(c).reduce((a, b) => a + b, 0) === 4, 'e il conto torna lo stesso');
    const o2 = finto({somma: 5}, 0);
    const c2 = clausola(A.msgAggiorna(o2, 0, 0));
    esito(fuoriParentesi(c2).reduce((a, b) => a + b, 0) === 5, 'e con la sola somma il totale è cinque', c2);
    esito(/5 per incoerenze della fonte \(con i seggi che non sommano a 120\)/.test(c2) && !/di cui/.test(c2),
      'con una causa sola la causa si dice senza numero: «5 (di cui 5)» farebbe rifare al lettore il conto che ha già fatto',
      c2);
    esito(fuoriParentesi(c2).length === 1,
      'e il 120 dei seggi resta dentro le parentesi: fuori ogni numero è un numero di righe', c2);
  }

  /* L'ELISIONE. Diceva «e è stata ignorata», che nessuno scrive in italiano, e succedeva
     perché la congiunzione era una costante e il seguito un ramo: chi ha scritto il ramo
     guardava il numero, non la lettera. Ora ed() prende la frase e sceglie. */
  {
    const uno = nudo(A.msgAggiorna(finto({}, 1), 0, 0));
    const due = nudo(A.msgAggiorna(finto({}, 2), 0, 0));
    esito(/— ed è stata ignorata\./.test(uno), 'una tabella sola: «ed è stata ignorata»',
      (uno.match(/—[^.]*\./g) || []).pop());
    esito(!/ e è /.test(uno), 'e la e senza elisione non c\'è più da nessuna parte');
    esito(/— e sono state ignorate\./.test(due), 'due o più: «e sono state ignorate», senza elisione',
      (due.match(/—[^.]*\./g) || []).pop());
    esito(A.ed('è stata ignorata') === 'ed è stata ignorata' &&
          A.ed('sono state ignorate') === 'e sono state ignorate' &&
          A.ed('escluse') === 'ed escluse' && A.ed('altre') === 'e altre',
      'ed() decide sulla lettera che segue, non sul ramo che l\'ha chiamata',
      A.ed('è x') + ' · ' + A.ed('sono x') + ' · ' + A.ed('escluse') + ' · ' + A.ed('altre'));
  }


/* ══ UN INTERO FRA PARENTESI, E TRE COLONNE CHE LO LEGGONO ═════════════════════════
 * Wikipedia usa DUE notazioni per una lista sotto soglia, nella stessa schermata: «(1,8%)»
 * e «(3)». La prima era già letta, la seconda no — l'espressione dei seggi voleva un intero
 * NUDO — e la riga finiva fra le scartate come «valore non interpretabile». Sulla fonte
 * vera era una riga sola, Maagar Mochot del 26 agosto 2026, con cinque celle di quella
 * forma; rilanciando il parser sulla pagina reale rientra e la proiezione si muove di un
 * seggio: opposizione 56 → 55, ago della bilancia 4 → 5.
 * MA LE ALTRE DUE COLONNE FALLIVANO IN SILENZIO, ed è peggio: «(46)» in Gov. dava gov=null
 * e la guardia del blocco non si eseguiva, «(552)» nel campione faceva decadere il peso per
 * numerosità al ripiego. La riga scartata lascia un motivo nel messaggio; queste due non
 * lasciano traccia da nessuna parte.
 * LA REGOLA È UNA — un intero fra parentesi si legge come l'intero — E A DECIDERE IL
 * SIGNIFICATO È LA COLONNA: nella colonna di una lista vuol dire «sotto soglia, zero
 * seggi», nelle altre due vuol dire soltanto quel numero. */
{
  const r = per('2026-08-16')[0];
  esito(!!r, 'la riga con gli interi fra parentesi rientra: prima era scartata come illeggibile',
    r ? r.istituto : out.scartate.filter(x => x.data === '2026-08-16').map(x => x.motivo).join(''));
  if (r) {
    esito(somma(r) === 120, 'e i suoi numeri nudi sommano 120', String(somma(r)));
    /* N NON SI USA: né come seggi, né come percentuale in `sotto` — quella mappa contiene
       percentuali, e 3 verrebbe letto come 3%, spostando ws e quindi q. */
    esito(!r.seggi.sionismo_rel && !r.seggi.balad && !r.seggi.casa_sionista,
      'la lista con «(3)» prende ZERO seggi: la parentesi dice sotto soglia, non tre',
      JSON.stringify(r.seggi));
    esito(!r.sotto || (!r.sotto.sionismo_rel && !r.sotto.balad),
      'e N non finisce nemmeno fra le percentuali: sarebbe un errore di unita, non un dato',
      JSON.stringify(r.sotto || {}));
    esito(r.campione === 552,
      'il campione fra parentesi si legge: prima era null e il peso per numerosita decadeva ' +
      'al ripiego, in silenzio', String(r.campione));
  }
  /* LA GUARDIA DEL BLOCCO SI ESEGUE, ed e la meta che non lasciava traccia: con gov=null
     la riga entrava senza il controllo che esiste per lei. Si prova al contrario — una riga
     con Gov fra parentesi e DISCORDANTE dev essere scartata — perche una guardia che non si
     esegue e una guardia che passa danno lo stesso risultato su una riga giusta. */
  const g = A.parseWiki(require('../../dati/fixture.js')
    .replace('<td>—N/a</td><td>(50)</td></tr>', '<td>—N/a</td><td>(46)</td></tr>'), ['2026']);
  const sc = g.scartate.filter(x => x.data === '2026-08-16')[0];
  esito(!!sc && sc.tipo === 'blocco',
    'e con «Gov.» fra parentesi la guardia del blocco SI ESEGUE: una riga discordante viene ' +
    'scartata invece di entrare senza controllo', sc ? sc.motivo : 'entrata lo stesso');
  /* UNA PARENTESI SOLA È UNA CELLA ROTTA, e va distinta da un intero: «(3» o «3)» non sono
     ne un intero ne una notazione di Wikipedia — sono una cella troncata, e leggerle come
     3 vorrebbe dire inventare un dato dove la fonte e rotta. Senza questa riga il mutante
     che toglie il controllo sulle parentesi appaiate resta vivo. */
  const rotta = A.parseWiki(require('../../dati/fixture.js')
    .replace('<td>(3)</td>', '<td>(3</td>'), ['2026']);
  const sr = rotta.scartate.filter(x => x.data === '2026-08-16')[0];
  esito(!!sr && sr.tipo === 'illeggibile',
    'e una parentesi SOLA resta illeggibile: una cella troncata non e un intero',
    sr ? sr.motivo : 'entrata lo stesso');
}

  console.log('\ntestwiki: ' + ok + '/' + (ok + ko));
  if (ko) process.exit(1);
}, 3000);
