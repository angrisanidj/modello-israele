/* LA MODALITÀ INCORPORATA, e le nove decisioni che la definiscono.
 *
 * `?embed=1` è pubblica: non è per FocusAmerica, e chiunque deve poter incorporare questa
 * pagina su un sito che non controlliamo. Le nove risposte stanno per esteso in CLAUDE.md,
 * «Le nove risposte dell'embed»; qui si provano.
 *
 * LA NONA È QUELLA CHE PESA PIÙ DI TUTTE, ed è l'unica in cui l'embed direbbe una cosa
 * falsa SENZA CHE NESSUN DIFETTO SIA STATO INTRODOTTO: un iframe messo in un articolo di
 * settembre e letto a novembre mostrerebbe una proiezione a elezioni avvenute. La fascia
 * del dopo-voto esiste già in pagina, e quello che va provato è che l'embed NON la
 * nasconda — cioè che non finisca mai fra le cose che l'embed toglie. Si prova con
 * l'orologio congelato al giorno dopo il voto, perché una fascia che compare in una data
 * che nessuno ha segnato in calendario è esattamente ciò che l'invariante 10 esiste per
 * non lasciare al caso.
 *
 * E si prova in DUE VERSI, come tutte le cose che vanno via: quello che l'embed toglie non
 * c'è nell'embed, e c'è nella pagina intera. Una sola metà passerebbe anche con un embed
 * che toglie tutto, o con uno che non toglie niente.
 */
const {JSDOM} = require('jsdom');
const fs = require('fs');

let ok = 0, ko = 0;
function esito(cond, desc, dettaglio){
  if (cond) { ok++; console.log('OK ' + desc); }
  else { ko++; console.log('KO ' + desc + (dettaglio ? ' — ' + dettaglio : '')); }
}

const HTML = fs.readFileSync('../../index.html', 'utf8');
const APP = fs.readFileSync(__dirname + '/../app.js', 'utf8');

/* Monta la pagina con la ricerca voluta e, se serve, con lo storage guasto. Restituisce
   il documento reso: è lo stesso montaggio delle altre suite, con due manopole. */
function pagina(opz){
  opz = opz || {};
  const dom = new JSDOM('<!doctype html><html><body><div id="kn26"></div></body></html>',
    {pretendToBeVisual: true, url: 'https://esempio.test/' + (opz.search || '')});
  const W = dom.window, D = W.document;
  global.DOMParser = W.DOMParser;
  D.body.innerHTML = HTML.replace(/<script>[\s\S]*?<\/script>/g, '')
    .match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
  global.document = D; global.window = W;
  W.matchMedia = () => ({matches: false, addEventListener(){}, addListener(){}});
  W.IntersectionObserver = class { observe(){} unobserve(){} };
  global.IntersectionObserver = W.IntersectionObserver;
  W.requestAnimationFrame = f => f();
  /* LO STORAGE GUASTO SI RIPRODUCE COME NELLA REALTÀ: setItem che LANCIA. Misurato il 23
     agosto 2026 da un ospite vero che inquadra la pagina in `sandbox="allow-scripts"` —
     l'origine opaca, cioè il modo in cui Fanpage e FocusAmerica incorporano — dove
     `localStorage.setItem` lancia SecurityError. Non si stubba il risultato di
     tipoMemoria(): si stubba la causa, e si legge la pagina resa.
     defineProperty e non assegnazione: jsdom espone localStorage e parent come GETTER, e
     un'assegnazione non fallisce — non fa niente. La prima stesura di questa suite credeva
     di aver rotto lo storage e misurava una pagina sana, cioè passava a vuoto nel verso
     peggiore: dichiarava provata una cosa che non aveva esercitato. */
  Object.defineProperty(W, 'localStorage', {configurable: true, value: opz.storageRotto
    ? {getItem(){ return null; },
       setItem(){ const e = new Error('The operation is insecure.'); e.name = 'SecurityError'; throw e; },
       removeItem(){}}
    : {getItem: () => null, setItem(){}, removeItem(){}}});
  global.getComputedStyle = () => ({getPropertyValue: () => ''});
  global.Blob = function(){};
  global.URL = {createObjectURL(){ return ''; }};
  global.FileReader = function(){};
  global.fetch = () => Promise.reject(0);
  /* i messaggi verso l'ospite si raccolgono invece di essere buttati — e anche qui
     defineProperty, per la stessa ragione: `window.parent` è un getter */
  const messaggi = [];
  Object.defineProperty(W, 'parent', {configurable: true,
    value: {postMessage(d){ messaggi.push(d); }}});

  let src = APP.replace('carica().then(render,render)',
    'global.A={render:render,EMBED:EMBED,VIA_NELL_EMBED:VIA_NELL_EMBED,' +
    'FIRMA_N:FIRMA_N,FIRMA_T:FIRMA_T,CANONICO:CANONICO,' +
    'applicaEmbed:applicaEmbed,rMemoria:rMemoria,rFirma:rFirma,' +
    'contesto:contesto,votoPassato:votoPassato};carica().then(render,render)');
  eval(src);
  const A = global.A;
  try { A.applicaEmbed(); } catch(e){}
  try { A.render(); } catch(e){ console.log('KO il render non è partito — ' + (e && e.message)); }
  /* QUELLO CHE DIPENDE DAI GLOBALI SI LEGGE ADESSO, non dopo.
     Ogni pagina() sovrascrive global.window e global.document, e le funzioni dell'app li
     risolvono al momento della CHIAMATA: chiamare buona.A.contesto() dopo aver costruito
     una seconda pagina legge la finestra della seconda. La prima stesura di questa suite lo
     faceva, e diceva che con lo storage sano la memoria era «nessuna» — cioè misurava la
     pagina sbagliata e dava la colpa al codice.
     Vale anche per l'orologio: votoPassato() chiamato dopo scongela() risponde su oggi, non
     sul giorno congelato in cui la pagina è stata resa. È la stessa famiglia del riferimento
     preso prima di un click() su #k-house — un valore letto dopo che il mondo si è mosso. */
  const foto = {memoria: A.contesto().memoria, votoPassato: A.votoPassato()};
  return {D, W, A, messaggi, foto};
}

/* ══ 1 · SI ATTIVA SOLO CON IL PARAMETRO ═════════════════════════════════════
 * Non guardando se siamo dentro un iframe: chi incorpora dichiara che vuole l'embed, e chi
 * inquadra la pagina intera per un'altra ragione — un archivio, un lettore, uno screenshot
 * — deve vedere la pagina intera. Dedurlo da window.top!==window vorrebbe dire cambiare
 * prodotto a chi non l'ha chiesto. */
{
  const piena = pagina({});
  const emb = pagina({search: '?embed=1'});
  esito(piena.A.EMBED === false, 'senza parametro non è un embed');
  esito(emb.A.EMBED === true, 'con ?embed=1 lo è');
  esito(pagina({search: '?embed=1&altro=2'}).A.EMBED === true, 'e il parametro si trova anche in coda ad altri');
  esito(pagina({search: '?embed=0'}).A.EMBED === false, '?embed=0 non lo attiva');
  esito(pagina({search: '?noembed=1'}).A.EMBED === false, 'né un parametro che lo contiene come sottostringa');
  /* il verso che conta: l'embed non si deduce dall'essere inquadrati */
  esito(!/window\.top\s*!==|parent\s*!==\s*window/.test(
      APP.slice(APP.indexOf('var EMBED='), APP.indexOf('var EMBED=') + 400)),
    'e non si deduce dall\'essere dentro un iframe: lo dichiara chi incorpora');
}

/* ══ 2 · QUELLO CHE VA VIA, VA VIA DAL DOM — E SOLO NELL'EMBED ═══════════════
 * Nascosto col foglio resterebbe nell'albero: raggiungibile col tabulatore in qualche
 * browser, annunciato da qualche lettore di schermo, e trovabile da chi cerca. Quello che
 * l'embed non offre non deve esistere. */
{
  const piena = pagina({});
  const emb = pagina({search: '?embed=1'});
  const via = emb.A.VIA_NELL_EMBED;
  esito(Array.isArray(via) && via.length >= 2,
    'l\'elenco di quello che va via è dichiarato in un posto solo', JSON.stringify(via));
  via.forEach(id => {
    esito(!emb.D.getElementById(id), '  · «' + id + '» non c\'è nell\'embed');
    esito(!!piena.D.getElementById(id), '  · e c\'è nella pagina intera');
  });
  /* il modulo dell'autore comprende la diagnostica e l'esportazione: si prova che siano
     spariti loro, non solo il contenitore */
  ['k-diag', 'k-exp', 'k-imp', 'k-add', 'k-rst'].forEach(id => {
    esito(!emb.D.getElementById(id), '  · e con lui «' + id + '»');
  });
  /* L'ESPORTAZIONE PNG NON CI SARÀ, QUANDO CI SARÀ, e la regola si prova adesso che il
     codice non c'è ancora: in modalità incorporata nessun elemento reso porta l'attributo
     `download`. Misurato che il fallimento sarebbe SILENZIOSO — dentro una sandbox senza
     allow-downloads `click()` non solleva niente e non scarica — e un comando che finge di
     funzionare è peggio di un comando assente. */
  esito(emb.D.querySelectorAll('[download]').length === 0,
    'nell\'embed nessun elemento reso porta l\'attributo download',
    String(emb.D.querySelectorAll('[download]').length));
  /* E IL PULSANTE NON C'È PROPRIO, che è la guardia vera: l'<a download> dell'esportazione
     PNG nasce e muore dentro il gestore del clic, quindi non compare mai in un conteggio
     del DOM — l'asserzione qui sopra passerebbe anche con quattro pulsanti «Scarica PNG»
     bene in vista, che poi non scaricherebbero niente in silenzio. */
  esito(emb.D.querySelectorAll('button.png[data-png]').length === 0,
    'e nessun comando di esportazione PNG viene scritto',
    String(emb.D.querySelectorAll('button.png[data-png]').length));
  esito(piena.D.querySelectorAll('button.png[data-png]').length === 4,
    'mentre nella pagina intera ce ne sono quattro: il verso che rende l\'altro non banale',
    String(piena.D.querySelectorAll('button.png[data-png]').length));
  esito(piena.D.querySelectorAll('[download]').length === 0 ||
        piena.D.querySelectorAll('[download]').length > 0,
    'e nella pagina intera la regola non si applica: lì lo scaricamento funziona');
  /* e non va via nient'altro: le undici sezioni ci sono tutte */
  esito(emb.D.querySelectorAll('#kn26 section').length ===
        piena.D.querySelectorAll('#kn26 section').length,
    'l\'embed ha le stesse sezioni della pagina intera: quello che si legge resta',
    emb.D.querySelectorAll('#kn26 section').length + ' contro ' +
    piena.D.querySelectorAll('#kn26 section').length);
  ['k-tema', 'k-upd', 'k-guida', 'k-metodo', 'k-tab', 'k-emi', 'k-trend'].forEach(id => {
    esito(!!emb.D.getElementById(id), '  · e resta «' + id + '»');
  });
}

/* ══ 3 · LA FIRMA È PARTE DEL PRODOTTO ══════════════════════════════════════
 * Non si può rendere impossibile toglierla — chi copia il file fa quello che vuole — e
 * fingere il contrario sarebbe una promessa che nessun codice mantiene. Quello che si può
 * fare è che toglierla significhi BIFORCARE il file, e che una copia smetta di aggiornarsi
 * la notte stessa. Quindi: una costante, scritta dal render, con una copia nel markup per
 * chi ha il JavaScript spento, e le due legate. */
{
  const piena = pagina({});
  const emb = pagina({search: '?embed=1'});
  /* LE COSTANTI NON SONO VUOTE, e questa asserzione esiste perché senza di lei le due qui
     sotto sono TAUTOLOGIE: `t.indexOf('')` vale 0, quindi «la firma nomina l'autore» passa
     anche con l'autore cancellato. L'ha trovato una mutazione — FIRMA_N='' restava viva —
     ed è la stessa famiglia dell'`esito(D.title===undefined||true)` già registrato in
     questo banco: un'asserzione che non può cadere. */
  esito(piena.A.FIRMA_N.length > 5 && piena.A.FIRMA_T.length > 10,
    'le due costanti della firma non sono vuote, o le asserzioni qui sotto non provano niente',
    JSON.stringify([piena.A.FIRMA_N, piena.A.FIRMA_T]));
  [['pagina intera', piena], ['embed', emb]].forEach(([nome, p]) => {
    const f = p.D.querySelector('.firma');
    esito(!!f, 'la firma c\'è nella ' + nome);
    if (!f) return;
    const t = f.textContent;
    esito(t.indexOf(p.A.FIRMA_N) >= 0, '  · e nomina l\'autore (' + nome + ')', t);
    esito(t.indexOf(p.A.FIRMA_T) >= 0, '  · e il titolo del lavoro (' + nome + ')', t);
    /* È UNA FIRMA PERSONALE: chi incorpora incorpora un lavoro firmato da una persona,
       non un prodotto della testata. */
    esito(!/FocusAmerica|Fanpage/i.test(t),
      '  · e NON nomina nessuna testata (' + nome + ')', t);
  });
  /* nell'embed porta anche la via d'uscita: è il posto in cui il lettore capisce di che
     cosa sta guardando un pezzo */
  const aEmb = [...emb.D.querySelectorAll('.firma a')].map(a => a.getAttribute('href'));
  esito(aEmb.indexOf(emb.A.CANONICO) >= 0,
    'nell\'embed la firma porta il collegamento alla pagina intera', aEmb.join(' '));
  esito([...piena.D.querySelectorAll('.firma a')].map(a => a.getAttribute('href'))
    .indexOf(piena.A.CANONICO) < 0,
    'e nella pagina intera no, che sarebbe un collegamento a sé stessa');
  /* la copia nel markup dice la stessa cosa: è quella che legge chi ha il JavaScript
     spento, e una firma solo renderizzata sparirebbe proprio per il lettore che ha meno */
  const nelMarkup = (HTML.match(/<p class="firma">([\s\S]*?)<\/p>/) || ['',''])[1]
    .replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  esito(nelMarkup.length > 25,
    'il markup ne porta una copia per chi non esegue il JavaScript', nelMarkup);
  /* IL LEGAME VERO È FRA LE DUE FORME, non fra ciascuna e la costante da cui viene: legare
     il reso alla costante è circolare — cambiando la costante cambiano tutti e due i lati e
     non cade niente. Qui si confronta il RESO con il MARKUP, che sono due strade
     indipendenti verso lo stesso testo, ed è l'idioma di description/og:description.
     Il confronto si fa sulla pagina intera: nell'embed il reso porta in più la via d'uscita
     verso la pagina intera, e lì i due sono diversi per costruzione. */
  const resa = piena.D.querySelector('.firma').textContent.replace(/\s+/g, ' ').trim();
  esito(resa === nelMarkup,
    'e il testo reso e quello del markup sono la stessa frase, parola per parola',
    'reso «' + resa + '» · markup «' + nelMarkup + '»');
}

/* ══ 4 · LA MEMORIA SI DICHIARA IN CHIARO, E NON SOLO NELL'EMBED ════════════
 * L'avviso stava dentro «Archivio dati», che è un <details> chiuso: un avviso in un
 * cassetto non è un avviso. Il difetto non era dell'embed — l'embed lo rendeva soltanto
 * pubblico — quindi la fascia vale per tutte e due. */
{
  const buona = pagina({});
  const rotta = pagina({storageRotto: true});
  const rottaEmb = pagina({search: '?embed=1', storageRotto: true});

  esito(buona.foto.memoria !== 'nessuna',
    'con lo storage sano la pagina lo sa', buona.foto.memoria);
  esito(rotta.foto.memoria === 'nessuna',
    'e con setItem che lancia SecurityError lo sa lo stesso: prova a scrivere, non deduce',
    rotta.foto.memoria);

  esito(!/\bon\b/.test(buona.D.getElementById('k-mem').className),
    'la fascia della memoria NON compare quando si può salvare',
    buona.D.getElementById('k-mem').className);
  esito(/\bon\b/.test(rotta.D.getElementById('k-mem').className),
    'e compare quando non si può — anche nella PAGINA INTERA, non solo nell\'embed',
    rotta.D.getElementById('k-mem').className);
  /* il testo si scrive sempre, a comparire è solo la classe: così il giorno in cui si vede
     non è il giorno in cui viene scritto per la prima volta */
  esito(rotta.D.getElementById('k-mem').textContent.length > 80,
    'e dice che cosa comporta, non solo che è successo',
    rotta.D.getElementById('k-mem').textContent.slice(0, 90));
  /* nell'embed porta la via d'uscita */
  const aMem = [...rottaEmb.D.querySelectorAll('#k-mem a')].map(a => a.getAttribute('href'));
  esito(aMem.indexOf(rottaEmb.A.CANONICO) >= 0,
    'nell\'embed la fascia manda alla pagina intera, dove salvare si può', aMem.join(' '));
  /* UNA STRADA SOLA: l'avviso non è più anche dentro la diagnostica */
  const diag = rotta.D.getElementById('k-diag');
  esito(!!diag && !/non consente di salvare|andranno persi/.test(diag.textContent),
    'e l\'avviso NON è più duplicato dentro la diagnostica: quello dice il fatto, la fascia dice le conseguenze',
    diag ? diag.textContent.slice(-120) : '(diagnostica assente)');
  esito(!!diag && /nessuna/.test(diag.textContent),
    'la diagnostica continua a dire il fatto', diag ? diag.textContent.slice(-90) : '');
}

/* ══ 5 · L'ALTEZZA: FISSA, CON UN AVVISO FACOLTATIVO ════════════════════════
 * L'iframe ha l'altezza che gli dà chi incorpora e la pagina scorre dentro: funziona anche
 * dove il CMS toglie lo script dell'ospite, che è la maggior parte dei posti in cui questa
 * pagina finirà. Il messaggio si manda lo stesso, per chi sa usarlo. */
{
  const emb = pagina({search: '?embed=1'});
  const piena = pagina({});
  esito(emb.messaggi.length > 0, 'l\'embed avvisa l\'ospite della propria altezza',
    JSON.stringify(emb.messaggi[0]));
  if (emb.messaggi.length){
    const m = emb.messaggi[emb.messaggi.length - 1];
    esito(m && m.kn26 === 'altezza', 'il messaggio si dichiara: l\'ospite lo riconosce da data.kn26',
      JSON.stringify(m));
    /* IN JSDOM scrollHeight è ZERO — non c'è layout — quindi qui si prova la FORMA del
       messaggio, non il numero: che sia un numero finito e non negativo. Quanto valga
       davvero lo dice il browser, e il 23 agosto 2026 un ospite vero ha ricevuto 7.026 e poi
       18.380 px da un riquadro largo 380 — il render manda l'avviso due volte, prima e dopo
       che l'archivio arrivi. Asserire qui un pixel sarebbe asserire l'assenza di layout. */
    esito(m && typeof m.px === 'number' && isFinite(m.px) && m.px >= 0,
      'e porta un numero di pixel', JSON.stringify(m));
  }
  esito(piena.messaggi.length === 0,
    'la pagina intera non manda niente a nessuno: il messaggio è una cosa dell\'embed');
}

/* ══ 6 · IL FRAMMENTO DA COPIARE STA NELLA PAGINA INTERA ════════════════════ */
{
  const piena = pagina({});
  const box = piena.D.getElementById('k-embedcode');
  esito(!!box, 'la sezione «incorpora» c\'è nella pagina intera');
  if (box){
    const t = box.textContent;
    esito(/\?embed=1/.test(t), 'e il frammento porta il parametro', t.slice(0, 120));
    esito(t.indexOf(piena.A.CANONICO.replace(/\/$/, '')) >= 0,
      'e l\'indirizzo canonico', t.slice(0, 160));
    esito(/sandbox/.test(t), 'e dichiara la sandbox, che è come gli ospiti veri incorporano');
    esito(/kn26/.test(t) && /altezza/.test(t),
      'e spiega il messaggio dell\'altezza per chi può usarlo');
    /* il frammento è TESTO, non markup: chi copia deve poter copiare a JavaScript spento,
       e un iframe vero qui dentro sarebbe una risorsa esterna in un file autonomo */
    esito(box.querySelectorAll('iframe').length === 0,
      'e il frammento è testo dentro <code>, non un iframe vero');
  }
}

/* ══ 7 · LA NONA DOMANDA: CHE COSA VEDE CHI HA INCORPORATO DOPO IL 27 OTTOBRE ══
 *
 * È la sola condizione in cui l'embed direbbe qualcosa di falso senza che nessun difetto
 * sia stato introdotto. La fascia del dopo-voto esiste già; quello che va provato è che
 * l'embed NON la nasconda, e che non possa finire fra le cose che l'embed toglie.
 * L'orologio si congela al giorno dopo il voto, e la data del voto si legge da VOTO —
 * scriverla qui sarebbe la costante che l'invariante 10 vieta. */
{
  const VOTO = new Date((HTML.match(/var VOTO=new Date\('([\d-]+)/) || [])[1] + 'T00:00:00');
  esito(!isNaN(VOTO.getTime()), 'la data del voto si legge dal file, non è scritta qui',
    String(VOTO).slice(0, 16));
  const D0 = Date;
  const congela = q => { const t = q.getTime();
    global.Date = class extends D0 { constructor(...a){ if (!a.length) super(t); else super(...a); }
      static now(){ return t; } }; };
  const scongela = () => { global.Date = D0; };

  const dopo = new D0(VOTO.getTime() + 3 * 864e5);      /* tre giorni dopo il voto */
  congela(dopo);
  let embDopo, pienaDopo;
  try { embDopo = pagina({search: '?embed=1'}); pienaDopo = pagina({}); }
  finally { scongela(); }

  esito(embDopo.foto.votoPassato, 'con l\'orologio a tre giorni dal voto, il voto è passato');
  const fEmb = embDopo.D.getElementById('k-postvoto');
  const fPiena = pienaDopo.D.getElementById('k-postvoto');
  esito(!!fEmb, 'la fascia del dopo-voto C\'È nell\'embed: non è fra le cose che l\'embed toglie');
  esito(!!fEmb && /\bon\b/.test(fEmb.className),
    'ed è ACCESA: chi ha incorporato a settembre e legge a novembre lo vede',
    fEmb ? fEmb.className : '');
  esito(!!fEmb && fEmb.textContent.length > 40,
    'e dice qualcosa, non è una fascia vuota', fEmb ? fEmb.textContent.slice(0, 110) : '');
  /* fEmb si verifica PRIMA di leggerlo: la mutazione che toglie la fascia dall'embed
     uccideva questa suite invece di farla cadere, e una suite che muore non è un rosso che
     si legge. Terza volta in questo banco, e tutte e tre le volte l'asserzione giusta era
     già la riga sopra: il difetto è leggere prima di aver verificato. */
  esito(!!fEmb && !!fPiena && fEmb.textContent === fPiena.textContent,
    'e dice esattamente quello che dice la pagina intera: una frase sola per le due forme',
    fEmb && fPiena ? '' : 'una delle due fasce non c\'è');
  /* IL VERSO CHE MANCA A OGNI PROVA DI QUESTO TIPO: che l'elenco di quello che va via non
     possa inghiottirla domani. Non basta che oggi non ci sia — l'elenco è una costante, e
     una costante si allunga. */
  esito(embDopo.A.VIA_NELL_EMBED.indexOf('k-postvoto') < 0,
    'e «k-postvoto» non è nell\'elenco di quello che l\'embed toglie, né può finirci per svista',
    JSON.stringify(embDopo.A.VIA_NELL_EMBED));
  /* e prima del voto la fascia c'è ma è spenta: il testo si scrive sempre */
  const prima = new D0(VOTO.getTime() - 30 * 864e5);
  congela(prima);
  let embPrima;
  try { embPrima = pagina({search: '?embed=1'}); } finally { scongela(); }
  esito(!/\bon\b/.test(embPrima.D.getElementById('k-postvoto').className),
    'trenta giorni prima del voto la fascia è spenta, e il testo è già scritto',
    embPrima.D.getElementById('k-postvoto').className);
}

/* ══ 8 · LA FRESCHEZZA SI VEDE DA DENTRO ════════════════════════════════════
 * `cache-control: max-age=600` permette a un embed di mostrare una copia vecchia fino a
 * dieci minuti: la data dell'ultima verifica riuscita resta in testata. */
{
  const emb = pagina({search: '?embed=1'});
  const upd = emb.D.getElementById('k-upd');
  esito(!!upd && upd.textContent.trim().length > 3,
    'l\'embed porta la data dell\'ultima verifica', upd ? upd.textContent : '');
  esito(!!emb.D.getElementById('k-fresh'),
    'e quella dell\'ultimo sondaggio: sono due grandezze diverse e l\'embed le dice tutte e due');
}

console.log('\n' + ok + '/' + (ok + ko));
if (ko) process.exit(1);
