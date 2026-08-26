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
    'contesto:contesto,votoPassato:votoPassato,' +
    'copiaTesto:copiaTesto,montaCopia:montaCopia,rispostaCopia:rispostaCopia,' +
    'SINTESI:SINTESI,FORME_EMBED:FORME_EMBED,SINT_TIENI:SINT_TIENI,TIT_CODA:TIT_CODA,' +
    'finiSintesi:finiSintesi,potaSintesi:potaSintesi,titoloCortoOra:titoloCortoOra,' +
    'selezionaBlocco:selezionaBlocco,' +
    'RETI:RETI,GLIFO:GLIFO,glifo:glifo,AI_MOTORI:AI_MOTORI,testoCondivisione:testoCondivisione,' +
    'promptAI:promptAI,statoLeve:statoLeve,montaSocial:montaSocial,' +
    'blocchi:blocchi,SEG:function(){return SEG;},CANONICO:CANONICO,' +
    'escludi:function(k){if(ESCL[k])delete ESCL[k];else ESCL[k]=1;render();}};carica().then(render,render)');
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
  /* il taglio cerca la CLASSE, non l'attributo esatto: la prima stesura chiedeva
     `<p class="firma">` alla lettera, e il giorno in cui il paragrafo ha preso anche un id
     — perché la forma compatta dell'embed deve poterlo nominare — la firma nel markup è
     diventata la stringa vuota e due asserzioni sono cadute su un difetto che non c'era.
     Un'espressione che descrive il markup carattere per carattere prova la formattazione,
     non la proprietà. */
  const nelMarkup = (HTML.match(/<p [^>]*class="firma"[^>]*>([\s\S]*?)<\/p>/) || ['',''])[1]
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


/* ══ I PULSANTI DI COPIA DEI BLOCCHI DI CODICE ════════════════════════════
 * Nascono come REGOLA: un ciclo su `pre.cod`, non due pulsanti scritti nel markup. Questa
 * prova verifica la regola — che ogni blocco di codice della pagina ne abbia uno — invece
 * di verificare che ce ne siano due, che è il numero di oggi.
 *
 * E LA COSA CHE PUÒ ROMPERSI SENZA DIRLO è che cosa finisce negli appunti. Il blocco va a
 * capo per stare nella colonna — misurato a 380: quattro righe di sorgente rese in 193,8px,
 * cioè circa undici — quindi copiare «quello che si vede» darebbe un codice spezzato in
 * punti che dipendono dalla larghezza della finestra di chi copia. `textContent` per
 * specifica ignora il layout; `innerText` è definito in funzione della resa e oggi
 * risponde identico, il che è precisamente la condizione in cui la scelta sbagliata non
 * si vede.
 */
{
  const {D: Dc, A: Ac, W: Wc} = pagina({});
  const blocchi = [].slice.call(Dc.querySelectorAll('#kn26 pre.cod'));
  esito(blocchi.length >= 2, 'ci sono blocchi di codice da copiare', String(blocchi.length));
  /* LA REGOLA: ogni blocco ne ha uno. Non «ce ne sono due». */
  const senza = blocchi.filter(p => {
    const b = p.nextElementSibling;
    return !(b && b.classList && b.classList.contains('cpy'));
  });
  esito(senza.length === 0,
    'e OGNI blocco ha il suo pulsante: il comando è una regola, non due istanze',
    senza.length + ' senza');
  /* IL PULSANTE STA FUORI DAL `pre`: dentro, la sua etichetta finirebbe nel testo copiato */
  const dentro = [].slice.call(Dc.querySelectorAll('#kn26 pre.cod button')).length;
  esito(dentro === 0,
    'e nessuno sta dentro il blocco, o «Copia» verrebbe copiato insieme al codice',
    String(dentro));
  blocchi.forEach((p, k) => {
    esito(!/Copia/.test(p.textContent),
      '  · il blocco ' + (k + 1) + ' non contiene la parola del comando', p.textContent.slice(0, 40));
  });

  /* IL NOME ACCESSIBILE NOMINA QUALE DEI DUE, e comincia col testo visibile (WCAG 2.5.3):
     due pulsanti chiamati «Copia» sono indistinguibili in un elenco di comandi. */
  const bot = [].slice.call(Dc.querySelectorAll('#kn26 button.cpy'));
  const nomi = bot.map(b => b.getAttribute('aria-label'));
  esito(nomi.every(n => !!n && n.indexOf(bot[0].textContent) === 0),
    'il nome accessibile comincia col testo visibile: chi comanda a voce dice «Copia»',
    nomi.join(' · '));
  esito(new Set(nomi).size === nomi.length,
    'e ciascuno dice QUALE blocco copia', nomi.join(' · '));
  esito(bot.every(b => b.getAttribute('title') === b.getAttribute('aria-label')),
    'e title e aria-label sono la stessa stringa, nata una volta sola: idioma di ETI');
  /* il pezzo che cambia è dichiarato accanto al blocco che descrive, non in una seconda
     anagrafica dentro il JavaScript */
  esito(blocchi.every(p => !!p.getAttribute('data-copia')),
    'e ogni blocco dichiara nel markup che cosa contiene, accanto al codice');

  /* ══ CHE COSA FINISCE NEGLI APPUNTI ══ */
  {
    let scritto = null;
    /* in jsdom `navigator` è un GETTER: assegnarlo non fallisce, non fa niente — la stessa
       trappola di localStorage e parent già registrata. Si sovrascrive con defineProperty. */
    Object.defineProperty(Wc, 'navigator', {configurable: true,
      value: {clipboard: {writeText(t){ scritto = t; return Promise.resolve(); }}}});
    /* si chiama la funzione della pagina, non si riproduce qui che cosa dovrebbe copiare:
       riscriverlo sarebbe la seconda strada che diverge alla prima modifica */
    const pre = blocchi[0];
    Ac.copiaTesto(pre.textContent, () => {});
    esito(scritto === pre.textContent,
      'quello che finisce negli appunti è il testo del blocco, preso con textContent',
      JSON.stringify(String(scritto).slice(0, 46)));
    esito(scritto && scritto.split('\n').length === 4,
      'e ha le righe del SORGENTE, non quelle della resa: il blocco va a capo per stare nella colonna',
      String(scritto && scritto.split('\n').length));
    esito(!/^\s|\s$/.test(scritto || ' '),
      'e non porta spazi di impaginazione in testa o in coda');
    /* e il legame si prova dove sta: nel sorgente. innerText oggi risponde identico, quindi
       una prova sul VALORE non distingue le due strade — è la stessa forma della prova su
       colonneBlocco() e su og:title. */
    esito(/pre\.textContent/.test(HTML) && !/pre\.innerText/.test(HTML),
      'e il codice usa textContent, che ignora il layout, non innerText, che ne dipende');
  }
}

/* ══ LA PAROLA DEL RISCONTRO DICE QUELLO CHE SI È VERIFICATO ══════════════
 * Stessa grammatica dello scarico del PNG — il riscontro sta sul comando, non a migliaia
 * di pixel — ma EPISTEMOLOGIA DIVERSA, ed è la ragione per cui le parole non sono le
 * stesse. Là `a.click()` non restituisce niente e non esiste nessun evento, quindi
 * «Immagine pronta» dichiarava l'unica cosa verificata. Qui `writeText` restituisce una
 * promessa che si risolve SOLO se la copia è avvenuta, e `execCommand` un booleano:
 * l'esito è conoscibile, e allora «Copiato» non è una promessa ma un fatto riferito. */
{
  const {D: Dc, A: Ac, W: Wc} = pagina({});
  const bot = () => Dc.querySelector('#kn26 button.cpy');
  const partenza = bot().textContent;
  Ac.rispostaCopia('0', 'Copiato');
  esito(bot().textContent === 'Copiato',
    'il riscontro sta sul pulsante, come per il PNG', bot().textContent);
  esito(bot().classList.contains('detto'), 'e si dichiara con una classe');
  esito(bot().dataset.orig === partenza,
    'e conserva il testo di partenza leggendolo, invece di riscriverlo', bot().dataset.orig);
  /* il ritorno si fa scattare davvero, catturando la richiamata */
  const OT = global.setTimeout;
  let ritorno = null;
  global.setTimeout = (fn, ms) => { if (ms === 2600) { ritorno = fn; return 0; } return OT(fn, ms); };
  Ac.rispostaCopia('0', 'Copiato');
  global.setTimeout = OT;
  esito(typeof ritorno === 'function', 'e programma il proprio ritorno');
  /* la richiamata si chiama SOLO se c'è: senza questa guardia l'asserzione qui sotto non
     cade, ESPLODE — e una suite che muore a metà è il buco che il banco ha già pagato due
     volte. È la stessa lezione di `cmd().textContent` letto prima di verificare che ci sia. */
  if (typeof ritorno === 'function') {
    ritorno();
    esito(bot().textContent === partenza && !bot().classList.contains('detto'),
      'e quando scatta il pulsante torna a dire l\'azione', bot().textContent);
  } else {
    esito(false, 'e quando scatta il pulsante torna a dire l\'azione — nessun ritorno programmato');
  }
  /* IL BERSAGLIO È 44px, come quelli dell'esportazione e per la stessa ragione: è un
     comando che si preme su un telefono, dove selezionare del codice a mano è quasi
     impossibile. Cresce l'area, non la scritta. */
  {
    const cssC = HTML.match(/<style>([\s\S]*?)<\/style>/)[1];
    const r = (cssC.match(/#kn26 \.cpy\{[^}]*\}/) || [''])[0];
    esito(/min-height:44px/.test(r), 'e il bersaglio del comando di copia è 44px', r);
    esito(!/font-size/.test(r),
      'e il corpo resta quello di .lnk: cresce l\'area, non la scritta', r);
    /* E LA REGOLA STA DOPO .lnk NEL FOGLIO. .cpy porta anche .lnk, i due selettori hanno la
       stessa specificità, e a parità vince l'ordine di sorgente: scritta accanto a .cod —
       novecento righe più su — questa regola avrebbe perso margin-left e padding in
       silenzio. È la trappola 4 del banco vista dal lato del foglio. */
    esito(cssC.indexOf('#kn26 .cpy{') > cssC.indexOf('#kn26 .lnk{'),
      'e viene dopo .lnk nel foglio, o a parità di specificità perderebbe in silenzio',
      cssC.indexOf('#kn26 .cpy{') + ' contro ' + cssC.indexOf('#kn26 .lnk{'));
  }

  /* LE PAROLE SI LEGGONO DAL CODICE, non si riscrivono qui: è la correzione che una
     mutazione ha imposto alla prova gemella del PNG, dove l'elenco scritto a mano rendeva
     l'asserzione incapace di cadere. */
  const fonte = HTML.match(/copiaTesto\(pre\.textContent,function\(esito\)\{[\s\S]*?\n \}\);/)[0];
  const parole = [...fonte.matchAll(/rispostaCopia\(k,'([^']*)'/g)].map(m => m[1]);
  esito(parole.length === 2, 'il comando ha due esiti dichiarati', parole.join(' · '));
  esito(new Set(parole).size === 2, 'e dicono due cose diverse', parole.join(' · '));
  /* QUI «Copiato» È LEGITTIMO, e la prova dichiara perché: il ramo che lo usa è quello in
     cui il browser ha confermato. Il ramo che non sa dire niente non esiste — se
     esistesse, questa asserzione andrebbe rifatta come quella del PNG. */
  esito(/esito==='copiato'/.test(fonte),
    'e «Copiato» sta nel ramo in cui il browser ha confermato: non è una promessa',
    fonte.slice(0, 120));
  esito(/selezionaBlocco\(pre\)/.test(fonte),
    'e dove la copia non riesce il blocco viene SELEZIONATO: resta a un ⌘C di distanza',
    fonte.slice(-160));
}

/* ══ IL RIPIEGO SCATTA SUL FATTO, NON SULLO SCHEMA DELL'URL ═══════════════
 * `navigator.clipboard` non esiste fuori da un contesto sicuro, e chi apre index.html con
 * un doppio clic è esattamente lì. Non si guarda `location.protocol` — sarebbe la stessa
 * forma dello sniffing dello user agent — si prova a scrivere e si guarda la risposta, che
 * è quello che tipoMemoria() fa da sempre per la memoria. */
{
  const {D: Dc, A: Ac, W: Wc} = pagina({});
  /* A · l'API non c'è: si passa alla strada vecchia */
  let usoEC = 0, esitoA = null;
  Object.defineProperty(Wc, 'navigator', {configurable: true, value: {}});
  Dc.execCommand = () => { usoEC++; return true; };
  Ac.copiaTesto('x', e => { esitoA = e; });
  esito(usoEC === 1 && esitoA === 'copiato',
    'senza l\'API si usa la strada vecchia, e riesce', usoEC + ' · ' + esitoA);
  /* B · non riesce nemmeno quella: lo si sa, e lo si dice */
  let esitoB = null;
  Dc.execCommand = () => false;
  Ac.copiaTesto('x', e => { esitoB = e; });
  esito(esitoB === 'nonriuscita',
    'e se non riesce nemmeno quella l\'esito lo dichiara', String(esitoB));
  /* C · l'API c'è ma respinge — il caso del contesto non sicuro, che è il più frequente.
     Il ramo è ASINCRONO (una promessa respinta si risolve in una microtask) e questa suite
     è sincrona: si prova la FORMA nel sorgente, cioè che il gestore del rifiuto sia proprio
     ripiegoCopia, e il comportamento è stato misurato su browser vero il 24 agosto 2026 —
     API che respinge, ripiego usato una volta, riscontro «Copiato». */
  const mod = HTML.match(/function copiaTesto\([\s\S]*?\n\}/)[0];
  esito(/function\(\)\{ripiegoCopia\(t,poi\);\}/.test(mod),
    'e se la promessa viene respinta si ripiega invece di lasciar cadere la copia',
    mod.slice(-200));
  esito(/function\(\)\{poi\('copiato'\);\}/.test(mod),
    'e se si risolve la parola la riferisce: la promessa si risolve SOLO a copia avvenuta',
    mod.slice(-200));
  /* e in nessuno dei tre rami si guarda lo schema dell'URL né il nome del browser */
  const mod2 = mod + HTML.match(/function ripiegoCopia\([\s\S]*?\n\}/)[0];
  esito(!/protocol|isSecureContext|userAgent|file:/.test(mod2),
    'e il ripiego non guarda mai lo schema dell\'URL né il nome del browser: solo il fatto',
    mod2.slice(0, 120));
}


/* ══ LA FORMA COMPATTA: ?embed=sintesi ════════════════════════════════════
 * Chi incorpora in un articolo vuole una figura, non undici sezioni. Misurato il 24 agosto
 * 2026 sulla pagina vera: la forma compatta costa 419px a 380 — emiciclo 209, riga di
 * sintesi 18, probabilità corte 17, firma 36 — contro i 18.270 della pagina intera.
 *
 * LA FORMA LA SCEGLIE IL VALORE del parametro, non un secondo parametro: `?embed=1&
 * sintesi=1` permetterebbe di scrivere `?embed=0&sintesi=1`, che è uno stato che non vuol
 * dire niente e che qualcuno prima o poi scriverà. E `?embed=1` resta identico a prima.
 */
{
  /* le forme dichiarate, e nessun'altra */
  const {A: Ai} = pagina({});
  esito(Array.isArray(Ai.FORME_EMBED) && Ai.FORME_EMBED.join(',') === '1,sintesi',
    'le forme dell\'embed sono dichiarate in un elenco, non dedotte da un valore qualunque',
    String(Ai.FORME_EMBED));

  const piena = pagina({search: '?embed=1'});
  const ignota = pagina({search: '?embed=2'});
  /* LA SINTESI SI MONTA PER ULTIMA, e non è un dettaglio d'ordine: potaSintesi() cerca i
     pezzi da tenere con la scorciatoia dell'app, che risolve «document» AL MOMENTO DELLA
     CHIAMATA sul globale, mentre la catena degli
     antenati parte dall'R della sua chiusura. Montandola per prima e chiamando finiSintesi()
     dopo aver costruito altre due pagine, i pezzi da tenere si cercavano nel documento
     dell'ULTIMA pagina, non si trovavano, e la potatura svuotava tutto: otto asserzioni
     cadute su un difetto che non c'era. È la stessa trappola già registrata per contesto()
     e per votoPassato() — un valore letto dopo che il mondo si è mosso. */
  const sint = pagina({search: '?embed=sintesi'});
  try { sint.A.finiSintesi(); } catch(e){ console.log('KO finiSintesi è morta — ' + e.message); }
  esito(piena.A.EMBED === true && piena.A.SINTESI === false,
    '?embed=1 è un embed e NON è la sintesi: chi l\'ha già incollata vede quello che vedeva');
  esito(sint.A.EMBED === true && sint.A.SINTESI === true,
    '?embed=sintesi è un embed nella forma compatta');
  esito(ignota.A.EMBED === false,
    'e un valore che non è nell\'elenco non è un embed, esattamente come prima di oggi');

  /* ══ CHE COSA RESTA, E CHE COSA VA VIA ══
     La prova guarda tutti e due i versi, come per la forma intera: una metà sola passerebbe
     anche con una sintesi che toglie tutto o che non toglie niente. */
  const Ds = sint.D;
  const c = id => !!Ds.getElementById(id);
  ['k-sintriga', 'k-emi', 'k-sprobs', 'k-firma', 'k-upd', 'k-fresh'].forEach(id =>
    esito(c(id), '  · nella sintesi resta «' + id + '»'));
  ['k-trend', 'k-hist', 'k-tab', 'k-house', 'k-probs', 'k-calend', 'k-crono', 'k-coal']
    .forEach(id => esito(!c(id), '  · e va via «' + id + '»'));
  /* e nella forma INTERA quegli stessi pezzi ci sono: senza questo verso la prova passerebbe
     anche con una pagina che non ha mai avuto quei blocchi */
  ['k-trend', 'k-hist', 'k-tab', 'k-probs'].forEach(id =>
    esito(!!piena.D.getElementById(id), '  · e nella forma intera «' + id + '» c\'è'));

  /* NIENTE COMANDI: le leve cambiano numeri che il lettore di un articolo altrui non ha il
     contesto per interpretare, e un controfattuale senza la sua spiegazione è peggio di
     nessun controfattuale. */
  esito(Ds.querySelectorAll('#kn26 button').length === 0,
    'nella sintesi non resta nessun comando', String(Ds.querySelectorAll('#kn26 button').length));
  /* ma la via d'uscita verso la pagina intera resta, ed è nella firma */
  esito(Ds.querySelectorAll('.firma a').length > 0,
    'e la via d\'uscita verso la pagina intera resta nella firma');

  /* LA FASCIA DEL DOPO-VOTO NON PUÒ FINIRE FRA I POTATI: è la sola condizione in cui
     l'embed direbbe qualcosa di falso senza che nessun difetto sia stato introdotto. Non
     basta che oggi resti — l'elenco è una costante, e una costante si allunga. */
  esito(Ai.SINT_TIENI.indexOf('k-postvoto') >= 0,
    'k-postvoto è fra i pezzi che la sintesi tiene, e non può finirci per svista',
    Ai.SINT_TIENI.join(', '));
  esito(Ai.SINT_TIENI.indexOf('k-mem') >= 0,
    'e la fascia della memoria pure: dentro un iframe di terza parte è la condizione normale');

  /* LA RIGA DI SINTESI È LA FRASE DELL'h1, NON UNA FRASE NUOVA — quarto consumatore della
     stessa strada. E non porta la coda « · Knesset 2026», che serve alla linguetta del
     browser e alla scheda di condivisione: dentro il riquadro sarebbe la terza volta che si
     legge «Knesset 2026» in trecento pixel, perché la firma lo dice già. */
  const riga = (Ds.getElementById('k-sintriga') || {}).textContent || '';
  esito(riga.length > 10, 'la riga di sintesi è scritta', riga);
  esito(riga.indexOf(Ai.TIT_CODA) < 0,
    'e non porta la coda del titolo: quella serve fuori dalla pagina, non dentro il riquadro',
    riga);
  esito(sint.A.titoloCortoOra().indexOf(riga) === 0,
    'ma è la STESSA frase del titolo: cambia solo la coda',
    riga + ' ⊂ ' + sint.A.titoloCortoOra());
  /* e la si scrive anche nella pagina intera, dove il foglio la tiene invisibile: così il
     giorno in cui compare non è il giorno in cui viene scritta per la prima volta */
  esito(((piena.D.getElementById('k-sintriga') || {}).textContent || '').length > 10,
    'e si scrive sempre, anche dove non si vede: come la fascia del dopo-voto');

  /* LE PROBABILITÀ CORTE VENGONO DA rProbs(), non da una funzione nuova: #k-sprobs è
     scritto dallo stesso array `items` nello stesso passaggio della forma piena. Il legame
     si prova nel sorgente, perché è lì che una seconda strada nascerebbe. */
  /* l'asserzione è legata all'ISTRUZIONE, non a una finestra di caratteri intorno: la prima
     stesura prendeva i 200 caratteri dopo `$('k-sprobs').innerHTML` e cercava `items.map`
     lì dentro — ma dentro quei 200 caratteri ci finiva l'istruzione SUCCESSIVA, che è
     `$('k-probs').innerHTML=items.map(...)`. Il mutante che dava alle probabilità corte un
     array tutto suo restava vivo perché la prova leggeva la riga della forma piena e la
     trovava sana. Una finestra di caratteri non è un confine sintattico. */
  esito(/\$\('k-sprobs'\)\.innerHTML=items\.map/.test(HTML),
    'le probabilità corte escono dallo stesso array della forma piena',
    (HTML.match(/\$\('k-sprobs'\)\.innerHTML=[^;]{0,40}/) || [''])[0]);
  esito((HTML.match(/\$\('k-sprobs'\)\.innerHTML/g) || []).length === 1,
    'e sono scritte in un posto solo');

  /* LA POTATURA NON SPOSTA NIENTE: spostare un elemento gli fa ereditare i selettori
     discendenti del posto nuovo — è la trappola di #k-evsel. Si tiene la catena degli
     antenati e si toglie il resto. */
  const fonteT = HTML.match(/function potaSintesi\(\)\{[\s\S]*?\n\}/)[0];
  esito(!/appendChild|insertBefore|insertAdjacent/.test(fonteT),
    'la potatura toglie e basta: non sposta nessun elemento sotto selettori che non conosce',
    fonteT.slice(0, 120));

  /* LA RIDUZIONE NON HA UNA SOGLIA SCRITTA: si misura contro l'altezza che l'ospite ha dato
     al riquadro. Un numero scritto qui invecchierebbe come il 210 del punto 7 del PNG. */
  const fonteR = HTML.match(/function riduciSintesi\(\)\{[\s\S]*?\n\}/)[0];
  esito(/window\.innerHeight/.test(fonteR),
    'la riduzione guarda l\'altezza vera del riquadro, non una soglia scritta', fonteR.slice(0, 130));
  esito(!/\b(3[0-9][0-9]|4[0-9][0-9])\b/.test(fonteR),
    'e nel suo corpo non compare nessun numero di pixel', fonteR);
  /* e l'avviso dell'altezza va DOPO la riduzione, o dichiarerebbe l'altezza di prima */
  const fonteF = HTML.match(/function finiSintesi\(\)\{[\s\S]*?\n\}/)[0];
  esito(fonteF.indexOf('riduciSintesi') < fonteF.indexOf('avvisaAltezza'),
    'e si dice all\'ospite quanto siamo alti solo dopo aver ridotto', fonteF);
  esito(fonteF.indexOf('potaSintesi') < fonteF.indexOf('riduciSintesi'),
    'e si misura dopo aver potato, non prima');
}


/* ══ NESSUN COMANDO DELL'EMBED CHIAMA UN TERZO ═══════════════════════════
 * «Aggiorna i sondaggi» è uscito dall'embed il 24 agosto 2026, e la ragione che viene
 * prima è di chi OSPITA: quel comando fa partire una richiesta a Wikipedia dalla pagina di
 * qualcun altro, che non l'ha chiesta e non lo sa.
 * E c'è l'altra metà, che è di chi legge: misurato, il comando fa salva() e render(), e
 * memSet() cattura l'eccezione invece di lanciare — quindi dove lo storage è bloccato, che
 * dentro un iframe di terza parte è la condizione normale, il salvataggio fallisce in
 * silenzio e la vista si aggiorna lo stesso. Il lettore vede numeri che svaniscono al primo
 * ricaricamento, TRE RIGHE SOTTO una fascia che dichiara «qui non si salva niente».
 *
 * QUESTA PROVA GUARDA LA FORMA, non l'istanza: nell'embed non deve restare NESSUN comando
 * che chiami un'origine terza. Se domani ne nasce un altro, cade qui invece di finire in
 * produzione dentro l'articolo di qualcuno.
 */
{
  const piena = pagina({});
  const emb = pagina({search: '?embed=1'});

  /* il comando non c'è, e la sua CELLA nemmeno: togliendo il solo pulsante resterebbe la
     frase che lo spiega, cioè la didascalia di un comando che non c'è */
  esito(!emb.D.getElementById('k-refresh'), 'nell\'embed non c\'è il comando di aggiornamento');
  esito(!emb.D.getElementById('k-aggcell'), 'e nemmeno la sua cella, con la frase che lo spiega');
  esito(!!piena.D.getElementById('k-refresh') && !!piena.D.getElementById('k-aggcell'),
    'e nella pagina intera ci sono tutti e due');
  /* passa dalla costante unica, come k-postvoto: quell'elenco si allunga, e ogni voce nuova
     deve passare di lì invece di essere tolta a mano da qualche altra parte */
  esito(emb.A.VIA_NELL_EMBED.indexOf('k-aggcell') >= 0,
    'e ci passa dalla costante, non da una riga sparsa', emb.A.VIA_NELL_EMBED.join(', '));

  /* ══ LA FORMA ══
     L'unico URL assoluto che il JavaScript chiama è Wikipedia — lo prova struttura.mjs — e
     l'unico comando che lo chiama era questo. Qui si verifica che nell'embed non resti
     nessun elemento il cui gestore porti a WIKI_URL: si cerca nel sorgente quali id
     compaiono nello stesso gestore della chiamata, e si pretende che nessuno di quelli sia
     ancora in pagina. */
  const gestore = HTML.match(/fetch\(WIKI_URL[\s\S]{0,2400}/);
  esito(!!gestore, 'il gestore che chiama Wikipedia si trova nel sorgente');
  if (gestore) {
    const idNelGestore = [...gestore[0].matchAll(/\$\('([\w-]+)'\)/g)].map(m => m[1]);
    const rimasti = idNelGestore.filter(id => !!emb.D.getElementById(id));
    /* i soli id ammessi sono quelli che NON sono comandi: la riga dei messaggi, che è un
       riquadro di testo, non fa partire niente */
    const AMMESSI = ['k-msg'];
    const cattivi = rimasti.filter(id => AMMESSI.indexOf(id) < 0 &&
      emb.D.getElementById(id).tagName === 'BUTTON');
    esito(cattivi.length === 0,
      'e nell\'embed non resta nessun comando che porti a quella chiamata',
      cattivi.join(', ') || '(nessuno)');
  }

  /* IL TEMA RESTA, benché abbia la stessa forma — scrive in memoria e il salvataggio
     fallisce nello stesso modo. La differenza è CHE COSA fallisce: il tema si applica
     subito e a non sopravvivere è solo la memoria della scelta; l'aggiornamento prometteva
     di integrare l'archivio, e l'archivio tornava quello di prima.
     Uno fallisce sulla comodità, l'altro sulla cosa che promette. */
  esito(emb.D.querySelectorAll('#kn26 [data-tema]').length === 3,
    'il selettore del tema invece resta: fallisce sulla comodità, non su quello che promette',
    String(emb.D.querySelectorAll('#kn26 [data-tema]').length));
}


/* ══ IL FOGLIO SOPRAVVIVE ALLA POTATURA, E IL FONDO VIENE DAL TEMA ═══════
 * QUESTA È LA PROVA CHE MANCAVA, ed è la ragione per cui il difetto è arrivato in
 * produzione. Le mie asserzioni sulla forma compatta misuravano la GEOMETRIA — emiciclo
 * 209, riga 18, firma 36 — e la geometria reggeva, perché l'SVG porta i colori come
 * attributi e le altezze le detta il contenuto. Il foglio era stato rimosso e nessuna
 * asserzione lo guardava.
 *
 * Che cosa succedeva senza foglio, misurato il 24 agosto 2026: --paper stringa vuota,
 * fondo di #kn26 rgba(0,0,0,0), imbottitura 0, il beige del body visibile dovunque — e
 * soprattutto LA FASCIA DEL DOPO-VOTO COMPARSA, con «Le elezioni si sono tenute il 27
 * ottobre 2026» il 24 agosto. Non perché la condizione scattasse: perché
 * `#kn26 .postvoto{display:none}` non esisteva più. Il progetto usa in più punti «il testo
 * si scrive sempre, a comparire è solo la classe», quindi una potatura che tocca la
 * vestizione non rompe una cosa: ne rompe una famiglia.
 */
{
  const piena = pagina({search: '?embed=1'});
  const sint = pagina({search: '?embed=sintesi'});
  try { sint.A.finiSintesi(); } catch(e){}

  [['intera', piena], ['compatta', sint]].forEach(([nome, p]) => {
    const fogli = [].slice.call(p.D.querySelectorAll('style'))
      .filter(s => /--paper/.test(s.textContent));
    esito(fogli.length === 1,
      'nella forma ' + nome + ' il foglio del modello c\'è ancora dopo la potatura',
      fogli.length + ' fogli');
    /* e non è un guscio vuoto: porta le regole che contano */
    const css = fogli.length ? fogli[0].textContent : '';
    esito(/#kn26 \.postvoto\{display:none;?\}/.test(css),
      '  · e porta la regola che nasconde la fascia del dopo-voto');
    esito(/background:var\(--paper\)/.test(css),
      '  · e quella che dà un fondo al riquadro');
  });

  /* LA REGOLA È «NON SI POTA QUELLO CHE NON È CONTENUTO», non «si tiene lo style»: la
     seconda rimetterebbe il difetto al primo elemento non-contenuto che nasce domani. */
  const fonte = HTML.match(/function potaSintesi\(\)\{[\s\S]*?\n\}/)[0];
  esito(/NON_CONTENUTO\.indexOf\(c\.tagName\)/.test(fonte),
    'e la regola guarda la CATEGORIA dell\'elemento, non il nome di uno solo', fonte.slice(0, 140));
  const elenco = HTML.match(/var NON_CONTENUTO=\[[^\]]*\]/)[0];
  ['STYLE', 'SCRIPT', 'LINK', 'TEMPLATE', 'NOSCRIPT'].forEach(t =>
    esito(elenco.indexOf("'" + t + "'") >= 0,
      '  · e «' + t + '» è nell\'elenco di quello che non è contenuto', elenco));

  /* IL CASO GENERALE: un elemento non-contenuto montato oggi sopravvive alla potatura.
     Se la regola tornasse a essere un'esclusione per nome, il prossimo sparirebbe. */
  {
    const p2 = pagina({search: '?embed=sintesi'});
    const t = p2.D.createElement('template');
    t.id = 'k-prova-vestizione';
    const R2 = p2.D.getElementById('kn26');
    R2.appendChild(t);
    try { p2.A.finiSintesi(); } catch(e){}
    esito(!!p2.D.getElementById('k-prova-vestizione'),
      'e un elemento che non è contenuto, montato oggi, sopravvive: la regola è per categoria');
  }

  /* LA FASCIA DEL DOPO-VOTO NON COMPARE PRIMA DEL VOTO, e la prova guarda le DUE cose che
     devono valere insieme: la classe che la accende non c'è, e la regola che la nasconde
     c'è. Guardarne una sola lasciava passare il difetto: la classe era giusta da sempre. */
  const pv = sint.D.getElementById('k-postvoto');
  esito(!!pv, 'la fascia del dopo-voto esiste nel markup anche nella forma compatta');
  esito(pv && pv.className.indexOf('on') < 0,
    'e prima del voto NON porta la classe che la accende: la condizione non scatta',
    pv ? pv.className : '');
  esito(sint.foto.votoPassato === false,
    'e votoPassato() lo conferma', String(sint.foto.votoPassato));

  /* IL FONDO DELLA PAGINA VIENE DALLA TAVOLOZZA, non da una costante scritta a mano.
     Il beige #e8e6e0 non apparteneva a nessuno dei due temi. */
  /* si guarda il TAG del body, non tutto il file: il colore vecchio compare ancora nel
     commento che spiega perché non c'è più, ed è giusto che ci sia. Una prova che cerca una
     stringa in tutto il file prova la memoria del progetto, non il codice. */
  const tagBody = (HTML.match(/<body[^>]*>/) || [''])[0];
  esito(!/#e8e6e0/.test(tagBody),
    'il beige scritto a mano non è più il fondo del body', tagBody);
  esito(/document\.body\.style\.background=C\.paper/.test(HTML),
    'e il fondo del body si scrive dalla tavolozza');
  /* e sta in leggiTema(), che gira a ogni render — non in applicaTema(), che gira solo
     quando qualcuno preme un pulsante: là una pagina aperta in scuro restava col fondo
     chiaro finché non si toccava il selettore */
  const lt = HTML.match(/function leggiTema\(\)\{[\s\S]*?\n\}/)[0];
  esito(/document\.body\.style\.background/.test(lt),
    'e sta dove la tavolozza si risolve, cioè a ogni render', lt.slice(-120));
  /* il ripiego nel markup è un colore del tema, non un terzo colore */
  const rip = (HTML.match(/<body style="[^"]*background:(#[0-9A-Fa-f]{6})/) || [])[1];
  esito(/^#F7F8FA$/i.test(rip || ''),
    'e il ripiego nel markup è il --paper del tema chiaro, non un colore che non esiste',
    rip || '(nessuno)');
}


/* ══ CONDIVISIONE PER RETE E DOMANDE A UN MODELLO ═════════════════════════
 * Undici comandi nuovi, e la cosa che li rende utili o inutili è misurata: un fetcher che
 * apre l'indirizzo NON trova i numeri. Estratto il testo dal file servito il 24 agosto
 * 2026: 11.199 caratteri che cominciano con l'avviso di avvio, e nessun seggio proiettato.
 * Le sedici cifre a due zeri che ci sono sono percentuali di affluenza e soglie — cioè non
 * è «mancano i numeri», è «ci sono i numeri sbagliati», in prosa, dove un modello può
 * scambiarli per la proiezione. Da qui la scelta: il prompt PORTA i numeri.
 */
{
  /* LA PAGINA SE LA MONTA QUESTO BLOCCO, e non usa quella di prima: ogni pagina()
     sovrascrive i globali, e l ultima creata qui sopra è la forma compatta POTATA —
     chiamarci render() faceva morire rTitolo() su un h1 che non c è più. È la stessa
     trappola già registrata per contesto() e per potaSintesi(). */
  const {A: A2, D: D2} = pagina({});
  /* i due elenchi sono dichiarati, non quattro rami e sei rami */
  esito(Array.isArray(A2.RETI) && A2.RETI.length === 6,
    'le reti sono un elenco dichiarato', A2.RETI.map(r => r.n).join(', '));
  esito(Array.isArray(A2.AI_MOTORI) && A2.AI_MOTORI.length === 4,
    'e i motori pure', A2.AI_MOTORI.map(m => m.n).join(', '));

  /* ══ UNA COSTANTE, DUE FORME ══
     Dove l'indirizzo è un PARAMETRO la frase non lo porta, o comparirebbe due volte nel
     messaggio pubblicato; dove va dentro il testo si aggiunge in coda. Due stringhe scritte
     a parte divergerebbero alla prima riscrittura. */
  const senza = A2.testoCondivisione(false), con = A2.testoCondivisione(true);
  esito(con.indexOf(senza) === 0,
    'la forma con l\'indirizzo è la stessa frase più la coda: una costante, due forme',
    con.slice(senza.length));
  esito(senza.indexOf('angrisanidj') < 0,
    'e dove l\'indirizzo è un parametro la frase non lo porta', senza);
  esito(con.indexOf('angrisanidj') > 0,
    'e dove va dentro il testo, c\'è');
  /* e ogni rete usa la forma giusta per il suo contratto */
  A2.RETI.forEach(r => {
    const u = r.u(A2.testoCondivisione(r.porta === 'testo'), A2.CANONICO);
    if (r.porta === 'testo+url') {
      esito(/[?&]url=/.test(u) && /[?&]text=/.test(u),
        '  · ' + r.n + ' porta testo e indirizzo come due parametri');
      esito(u.indexOf(encodeURIComponent('— angrisanidj')) < 0,
        '  · e l\'indirizzo non è anche dentro il testo');
    } else if (r.porta === 'testo') {
      esito(!/[?&]url=/.test(u), '  · ' + r.n + ' non ha un parametro per l\'indirizzo');
      esito(u.indexOf(encodeURIComponent('angrisanidj')) > 0,
        '  · quindi l\'indirizzo va dentro il testo');
    } else {
      /* «solo l'indirizzo» vuol dire UN parametro e basta, non «nessun parametro chiamato
         text»: una mutazione che aggiungeva `&quote=` a Facebook restava viva, e quel
         parametro non passa dal 2017 — sarebbe codice che promette una cosa che non
         succede. Si CONTA, invece di elencare i nomi che non devono esserci. */
      const par = (u.split('?')[1] || '').split('&').filter(Boolean);
      esito(par.length === 1 && /^(u|url)=/.test(par[0]),
        '  · ' + r.n + ' prende SOLO l\'indirizzo, un parametro e basta: il testo non passa',
        par.join(' & '));
    }
  });

  /* ══ IL PROMPT PORTA I NUMERI VIVI, E DICHIARA LE LEVE ══
     I numeri sono quelli del momento del clic, cioè con le leve del lettore applicate. Ma
     l'indirizzo che il prompt cita mostra la proiezione DI BASE, e un modello che andasse a
     controllare troverebbe numeri diversi. Quindi il prompt lo dice — e lo dice SOLO quando
     una leva è fuori dal predefinito: a pagina intonsa la frase non c'è, perché non si
     spiega una cosa che non è successa. */
  const p0 = A2.promptAI();
  esito(p0.indexOf('Attenzione') < 0,
    'a pagina intonsa il prompt non dichiara nessuna leva', p0.slice(0, 80));
  esito(A2.statoLeve() === '', 'e lo stato delle leve è vuoto', A2.statoLeve());
  /* i numeri ci sono davvero, e sono quelli della pagina */
  const b = A2.blocchi(A2.SEG());
  [b.coalizione, b.opposizione, b.arabo].forEach(n =>
    esito(p0.indexOf(String(n)) >= 0, '  · e porta il numero ' + n));
  esito(p0.indexOf(A2.CANONICO.replace(/^https?:\/\//, '').replace(/\/$/, '')) > 0,
    'e cita l\'indirizzo, così il modello può andare a vedere');

  /* accendendo una leva, la clausola compare — e nomina la leva, non un generico «modificato» */
  A2.escludi('direct_polls');
  const p1 = A2.promptAI();
  esito(p1.indexOf('Attenzione') > 0,
    'con un istituto escluso il prompt lo dichiara', (p1.match(/Attenzione:[^.]*\./) || [''])[0]);
  esito(/differiscono dalla proiezione di base/.test(p1),
    'e dice PERCHÉ conta: l\'indirizzo mostra altri numeri');
  A2.escludi('direct_polls');
  /* NON si pretende che il prompt torni IDENTICO: il Monte Carlo rigira a ogni render e
     le probabilità cambiano di un punto, quindi l'uguaglianza byte per byte proverebbe che
     la simulazione è deterministica — che non è, e non deve essere. La proprietà è che la
     clausola SPARISCA, cioè che non si sedimenti. */
  esito(A2.promptAI().indexOf('Attenzione') < 0,
    'e tornando indietro la clausola sparisce: non si sedimenta', A2.statoLeve());

  /* ══ LA LUNGHEZZA, che è la ragione per cui questa forma è possibile ══
     Misurato: 939 caratteri coi valori di oggi e 952 nel caso peggiore — tutte le cifre al
     massimo — che codificati fanno 1.309 sull'URL più lunga, contro un tetto pratico di
     2000. La parte variabile è quasi tutta a una o due cifre, quindi il prompt è di fatto a
     lunghezza fissa. La prova non asserisce 939: asserisce che ci STIA, che è la proprietà. */
  A2.AI_MOTORI.forEach(m => {
    const u = m.u + encodeURIComponent(p0);
    esito(u.length < 2000,
      '  · l\'indirizzo per ' + m.n + ' sta sotto i 2000 caratteri', String(u.length));
  });

  /* ══ OGNI COMANDO, UN NOME DIVERSO ══
     Comandi chiamati tutti «Condividi» e «Discuti» sono indistinguibili in un elenco di
     comandi: è la lezione dei quattro «Scarica PNG», dei due «Copia» e dei bersagli dei
     marcatori. E il nome contiene il testo visibile, come chiede WCAG 2.5.3.
     IL CONTO NON È SCRITTO: è RETI + AI_MOTORI + le due copie. Scritto a mano, aggiungere
     una rete domani vorrebbe dire modificare questa riga, ed è la modifica che si fa senza
     pensarci. */
  A2.render(); A2.montaSocial();
  const box = D2.getElementById('k-social');
  const cmd = [].slice.call(box.querySelectorAll('a.soc,button.soc,a.aic,button.aic'));
  const atteso = A2.RETI.length + A2.AI_MOTORI.length + 2;
  esito(cmd.length === atteso,
    'i comandi montati sono le reti più i modelli più le due copie (' + atteso + ')',
    String(cmd.length));
  const nomi = cmd.map(x => x.getAttribute('aria-label'));
  esito(nomi.every(n => !!n), 'e ciascuno ha un nome accessibile', nomi.join(' | '));
  esito(new Set(nomi).size === nomi.length,
    'e sono tutti diversi fra loro', nomi.filter((n, i) => nomi.indexOf(n) !== i).join(', '));
  /* L'ETICHETTA VISIBILE DI UNA SCHEDA È IL SUO <b>, NON TUTTO IL SUO TESTO: sotto il nome
     c'è la riga che dice cosa fa quel modello, e il nome accessibile non deve contenerla.
     Preso tutto il textContent, l'asserzione cadrebbe su una cosa che non è un difetto. */
  const visibile = x => { const b = x.querySelector('b'); return (b ? b.textContent : x.textContent).trim(); };
  esito(cmd.every(x => nomi[cmd.indexOf(x)].indexOf(visibile(x)) >= 0),
    'e il nome contiene il testo visibile',
    cmd.filter(x => nomi[cmd.indexOf(x)].indexOf(visibile(x)) < 0).map(visibile).join(' | '));
  /* E DOVE NON C'È TESTO VISIBILE, CI DEV'ESSERE UN SEGNO. L'asserzione qui sopra è
     VACUAMENTE VERA per un comando vuoto — qualunque stringa contiene la stringa vuota —
     quindi da sola lascerebbe passare un cerchio senza niente dentro, che è precisamente il
     modo in cui questa riga di icone può rompersi: un glifo non dichiarato esce vuoto. */
  const muti = cmd.filter(x => !visibile(x));
  esito(muti.length === A2.RETI.length + 1,
    'i comandi senza testo visibile sono le reti più la copia del collegamento',
    String(muti.length));
  esito(muti.every(x => x.querySelector('svg')),
    'e ciascuno porta un segno: senza, sarebbe un cerchio vuoto e nessuno saprebbe cos\'è');
  /* ogni voce dichiara il proprio glifo, e il glifo esiste: dedurlo dalla chiave sarebbe
     corretto per coincidenza — «google» e «gemini» già non coincidono */
  esito(A2.RETI.concat(A2.AI_MOTORI).every(v => v.g && A2.GLIFO[v.g]),
    'ogni rete e ogni modello dichiara un glifo che esiste',
    A2.RETI.concat(A2.AI_MOTORI).filter(v => !v.g || !A2.GLIFO[v.g]).map(v => v.k).join(', '));
  esito(A2.glifo('non-esiste') === '',
    'e un glifo che non c\'è restituisce niente invece di un segno sbagliato');
  /* OGNI COMANDO PORTA UN SEGNO, non solo quelli senza testo. L'asserzione sui «muti» non
     copriva le schede, che il testo ce l'hanno: il mutante che deduce il glifo dalla chiave
     invece che dal campo lascia Gemini senza segno — «google» e «gemini» non coincidono — e
     passava. È la coincidenza che regge finché regge, di nuovo. */
  esito(cmd.every(x => x.querySelector('svg')),
    'ogni comando porta un segno, schede comprese',
    cmd.filter(x => !x.querySelector('svg')).map(visibile).join(' | '));
  /* e ogni scheda mostra la riga che dice cosa fa quel modello: è la cosa che la distingue
     da un pulsante, quindi è una proprietà e non una decorazione */
  const schede = [].slice.call(box.querySelectorAll('a.aic'));
  esito(schede.length === A2.AI_MOTORI.length, 'le schede dei modelli sono quattro più la copia',
    String(schede.length));
  esito(schede.every((x, i) => (x.querySelector('i') || {textContent: ''}).textContent.trim() === A2.AI_MOTORI[i].d),
    'e ciascuna mostra la propria riga, quella dichiarata nell\'anagrafica dei motori',
    schede.map(x => (x.querySelector('i') || {textContent: '—'}).textContent.trim()).join(' | '));

  /* ══ LA COLONNA È LA STESSA COSA MONTATA DUE VOLTE ══
     Sei reti raggiungono lo schermo per due strade. Le due non possono divergere perché
     nascono da cerchioRete(), e la prova lo verifica NEL SORGENTE — dove sta il legame —
     e poi sui valori resi. Provare solo i valori passerebbe anche con due funzioni che oggi
     dicono la stessa cosa, che è la condizione in cui la divergenza non si vede. */
  const sorgMs = HTML.match(/function montaSocial\(\)\{[\s\S]*?\n\}/)[0];
  esito((sorgMs.match(/cerchioRete\(/g) || []).length === 2,
    'le due strade verso i cerchi sono la stessa funzione, chiamata due volte',
    String((sorgMs.match(/cerchioRete\(/g) || []).length));
  const colonna = D2.getElementById('k-colsoc');
  esito(!!colonna, 'la colonna sta nel markup, non la crea il JavaScript');
  const cCol = [].slice.call(colonna.querySelectorAll('a'));
  esito(cCol.length === A2.RETI.length,
    'porta le sei reti e NON la copia del collegamento: quella è un\'azione con un esito, e ' +
    'un\'azione fuori dall\'ordine di tabulazione è irraggiungibile per chi non usa il mouse',
    String(cCol.length));
  esito(colonna.getAttribute('aria-hidden') === 'true',
    'ed è fuori dall\'albero: sette comandi duplicati porterebbero l\'elenco da sette a quattordici');
  esito(cCol.every(a => a.getAttribute('tabindex') === '-1'),
    'e fuori dall\'ordine di tabulazione, per la stessa ragione');
  esito(cCol.every((a, i) => a.getAttribute('href') ===
        box.querySelectorAll('a.soci')[i].getAttribute('href')),
    'e i sei indirizzi sono gli stessi della riga in fondo, nello stesso ordine');
  esito(colonna.querySelectorAll('svg').length === A2.RETI.length,
    'e ciascuno porta il suo segno');

  /* ══ IL RIQUADRO MOSTRA ESATTAMENTE QUELLO CHE PARTE ══
     È la ragione per cui la sezione è onesta, quindi è una proprietà e non una decorazione:
     il testo del riquadro è lo stesso che sta dentro l'indirizzo dei quattro comandi. */
  const riq = D2.getElementById('k-prompt');
  esito(!!riq, 'il riquadro del prompt esiste');
  const dentro = riq ? riq.textContent : '';
  esito(dentro.length > 200, 'e porta il prompt per intero, non un segnaposto',
    String(dentro.length));
  const primoAI = box.querySelector('a.aic');
  esito(primoAI && decodeURIComponent(primoAI.getAttribute('href').split('q=')[1]) === dentro,
    'ed è ESATTAMENTE il testo che finisce nell\'indirizzo: il riquadro non racconta un\'altra cosa');
  /* e la copia lo LEGGE dal riquadro invece di richiamare promptAI(): ricalcolarlo sarebbe
     una seconda strada verso la stessa stringa, con l'una letta e l'altra spedita */
  /* I COMMENTI SI TOLGONO PRIMA DI ANALIZZARE, ed è la lezione di css.js pagata una seconda
     volta: il commento di quel gestore NOMINA promptAI() e innerText per dire di non usarli,
     quindi le quattro asserzioni qui sotto leggevano la prosa e cadevano su un difetto che
     non c'era. Una prova che cerca una stringa nel sorgente deve guardare il CODICE, o
     trova quello che l'autore ha scritto per spiegare. */
  const fonteCp = HTML.match(/closest\('#k-copialink,#k-copiaprompt'\)[\s\S]{0,2400}/)[0]
    .replace(/\/\*[\s\S]*?\*\//g, '');
  esito(/\$\('k-prompt'\)/.test(fonteCp) && !/promptAI\(\)/.test(fonteCp),
    'e «copia prompt» legge il riquadro invece di ricalcolare il prompt');
  esito(/textContent/.test(fonteCp) && !/innerText/.test(fonteCp),
    'con textContent, che non dipende da come è andata la riga');
  /* IL RISCONTRO NON PUÒ CANCELLARE IL GLIFO. Il gestore di prima scambiava textContent, e
     su un comando il cui contenuto è un SVG quello lo svuota: il cerchio resterebbe vuoto
     per 2,6 secondi e poi tornerebbe. Il ramo senza etichetta visibile scambia il SEGNO. */
  esito(/b\.innerHTML=glifo\(/.test(fonteCp),
    'e il riscontro di un comando senza testo scambia il segno, non il testo — o lo svuoterebbe');
  esito(/setAttribute\('aria-label',\s*parola/.test(fonteCp),
    'e dice l\'ESITO nel nome accessibile: il ramo che ripristina contiene la stessa '+
      'chiamata, quindi cercarla in generale non distinguerebbe i due rami');
  /* i collegamenti escono dalla pagina: si aprono in una scheda nuova e non passano il
     referrer a nessuno */
  const link = [].slice.call(box.querySelectorAll('a.soc'));
  esito(link.every(a => a.getAttribute('target') === '_blank'),
    'e i collegamenti si aprono in una scheda nuova: la pagina non si perde');
  esito(link.every(a => /noopener/.test(a.getAttribute('rel') || '')),
    'con noopener, o la pagina aperta potrebbe riscrivere questa');

  /* ══ NON CI SONO NELL'EMBED ══
     Sono comandi che portano fuori dalla pagina di chi ospita, ed è la stessa ragione per
     cui «Aggiorna i sondaggi» è uscito: un riquadro incorporato non mette l'ospite in
     relazione con terzi che non ha scelto. */
  const emb = pagina({search: '?embed=1'});
  const boxE = emb.D.getElementById('k-social');
  esito(!boxE || boxE.children.length === 0,
    'nell\'embed il blocco non porta nessun comando',
    boxE ? String(boxE.children.length) : '(assente)');

  /* «Copia collegamento» usa la macchina della copia, non una seconda strada.
     SCRITTA COME .match(...)[0] QUESTA ASSERZIONE ESPLODEVA invece di cadere: il gestore è
     diventato «closest('#k-copialink,#k-copiaprompt')» e la vecchia espressione non ha più
     trovato niente, quindi la suite MORIVA dopo 219 OK — con uscita 1 e un ← accanto a un
     conteggio che sembrava pieno. È la quinta volta in questo progetto. Si prende il ramo
     con una guardia, e la stringa cercata è la parte che non dipende da quanti comandi il
     gestore serve. */
  const mFonte = HTML.match(/closest\('#k-copialink[^)]*\)[\s\S]{0,2400}/);
  esito(!!mFonte, 'il gestore della copia si trova nel sorgente');
  const fonte = mFonte ? mFonte[0].replace(/\/\*[\s\S]*?\*\//g, '') : '';
  /* la CHIAMATA del gestore, non la parola che capita entro 2400 caratteri: copiaTesto()
     è definita lì accanto, quindi cercarla in generale non distingue niente */
  esito(/copiaTesto\(testo\s*,/.test(fonte),
    'e «copia collegamento» usa copiaTesto(), col suo ripiego', fonte.slice(0, 120));
  esito(/CANONICO/.test(fonte),
    'e quello che copia è l\'indirizzo canonico, non una seconda costante');
}

console.log(String.fromCharCode(10) + ok + '/' + (ok + ko));
if (ko) process.exit(1);
