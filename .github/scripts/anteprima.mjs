/* L'IMMAGINE OPEN GRAPH: l'emiciclo rasterizzato, per chi condivide il link.
 *
 * PERCHÉ ESISTE. Le meta testuali dicono che cos'è la pagina; l'immagine è quello che si
 * vede, ed è la prima cosa — spesso l'unica — che un lettore incontra quando qualcuno
 * condivide l'indirizzo. E non dipende dalle card social: i link di condivisione di X,
 * Facebook e Telegram NON allegano un file, passano testo e indirizzo, e l'immagine che
 * compare è quella che lo scraper trova qui.
 *
 * PERCHÉ L'EMICICLO E NON LA BANDIERA. La bandiera è l'immagine del paese, non del modello,
 * e in un'anteprima si legge come una presa di posizione. L'emiciclo dice «proiezione
 * parlamentare» e porta il numero che conta: dentro il suo viewBox ci sono già
 * «MAGGIORANZA 61» e i tre totali di blocco.
 *
 * ══ IL CARATTERE, E LA SCELTA CHE NON ERA QUELLA CHE SEMBRAVA ══
 * In CI il carattere non è la pila della pagina: non c'è un browser, non ci sono i font di
 * sistema, e il PNG che si pubblica è lo stesso per tutti — quindi la macchina non impone
 * niente, sceglie il codice. Misurato il 24 agosto 2026:
 *   · resvg IGNORA un @font-face con data URI dentro l'SVG. Provato con un controllo che sa
 *     fallire: la resa con e senza il font incorporato è identica byte per byte;
 *   · resvg ignora anche woff e woff2 passati come file;
 *   · resvg USA un TTF passato a `fontFiles`. Stesso controllo, esito opposto: la resa
 *     cambia.
 * Da cui una conseguenza che vale la pena dire: il carattere non entra mai nell'SVG, e non
 * entrerebbe comunque nel file servito, che riceve solo pixel. LA REGOLA DEL FILE UNICO NON
 * MORDE: index.html guadagna una riga di meta e basta. I due TTF stanno in .github/font/,
 * sono attrezzi di costruzione, e nessun lettore li scarica.
 *
 * E I NUMERI GRANDI VANNO NELLA SANS, non in un serif sostitutivo. In pagina sono
 * `Georgia,serif`, ma Georgia è un font Microsoft e non si può spedire in un repository
 * pubblico: la scelta non era fra Georgia e un altro serif — era fra UN SOSTITUTO E LA
 * COERENZA. Un serif «vicino a Georgia» somiglia senza esserlo, e la differenza si nota
 * solo nei casi in cui stona. Un'anteprima coerente con sé stessa e diversa in modo
 * dichiarato vale più di una quasi-uguale.
 *
 * ══ LA TAVOLOZZA, CHE VIENE PRIMA DEL RASTERIZZATORE ══
 * leggiTema() legge le variabili CSS con getComputedStyle, e qui non c'è un motore di
 * stile: cade su C_FALL_T. Fino al 24 agosto 2026 quella era una TERZA tavolozza — 14
 * valori su 16 divergenti, --oppo di un'altra tinta — e questa immagine sarebbe uscita in
 * colori che nessun lettore vede. Adesso i valori sono quelli veri e test/struttura.mjs li
 * lega alle variabili del foglio.
 * E IL FONDO DELLA TARGA È LO STESSO TEMA DELL'SVG, non una scelta a parte: con la targa
 * scura e la tavolozza chiara «MAGGIORANZA 61» usciva nero su nero. È la stessa lezione del
 * fillRect col fondo del tema nell'esportazione PNG — il fondo e i colori sono una
 * decisione sola.
 */
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {JSDOM} from 'jsdom';
import {Resvg} from '@resvg/resvg-js';
import {createHash} from 'node:crypto';
import {scriviMeta} from './aggiorna.mjs';

const QUI = dirname(fileURLToPath(import.meta.url));
const RADICE = join(QUI, '..', '..');
const FONT = [join(QUI, '..', 'font', 'Inter_400Regular.ttf'),
              join(QUI, '..', 'font', 'Inter_600SemiBold.ttf')];
export const USCITA = join(RADICE, 'dati', 'anteprima.png');

/* 1200×630 è lo standard delle anteprime. La testata e il piede sono margini della tela,
   non del disegno: il disegno si scala in quello che resta, e non paga la cornice coi dati.
   È la stessa scelta delle due fasce degli istogrammi. */
export const W = 1200, H = 630, TESTA = 96, PIEDE = 40, LATO = 40;

/* L'INCHIOSTRO, MISURATO E NON IL viewBox. L'emiciclo occupa 386,7 × 217 dentro un viewBox
   da 430 × 232: è GIÀ centrato in orizzontale (21,6 unità vuote a sinistra e 21,7 a destra)
   e NON lo è in verticale (0,4 sopra, 14,6 sotto). Incorniciare sulla scatola invece che
   sull'inchiostro lascerebbe il disegno alto di sette unità dentro la cornice.
   I numeri si LEGGONO dal disegno reso, come per l'esportazione: scriverli qui sarebbe la
   costante che invecchia al primo cambio di geometria. */
export function inchiostro(svg, W2, H2){
 /* jsdom non fa layout, quindi getBBox() non c'è: l'inchiostro si ricava dai cerchi e dai
    testi, che è quello che l'emiciclo contiene. Il margine dei testi si stima dal corpo,
    perché la larghezza di una stringa qui non è misurabile — ed è una stima PER ECCESSO,
    che al massimo lascia un filo di aria in più. */
 let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
 for (const c of svg.querySelectorAll('circle')) {
  const x = +c.getAttribute('cx'), y = +c.getAttribute('cy'), r = +c.getAttribute('r');
  x0 = Math.min(x0, x - r); x1 = Math.max(x1, x + r);
  y0 = Math.min(y0, y - r); y1 = Math.max(y1, y + r);
 }
 for (const t of svg.querySelectorAll('text')) {
  const fs = +(t.getAttribute('font-size') || 10);
  const x = +(t.getAttribute('x') || 0), y = +(t.getAttribute('y') || 0);
  const mezza = 0.62 * fs * (t.textContent || '').length / 2;
  x0 = Math.min(x0, x - mezza); x1 = Math.max(x1, x + mezza);
  y0 = Math.min(y0, y - fs); y1 = Math.max(y1, y + 0.25 * fs);
 }
 for (const l of svg.querySelectorAll('line')) {
  for (const [a, b] of [['x1','y1'], ['x2','y2']]) {
   const x = +l.getAttribute(a), y = +l.getAttribute(b);
   x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
 }
 x0 = Math.max(0, x0); y0 = Math.max(0, y0);
 x1 = Math.min(W2, x1); y1 = Math.min(H2, y1);
 return {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
}

/* Compone la targa attorno al disegno. Pura: entra l'SVG dell'emiciclo e i dati della
   testata, esce il testo dell'SVG da rasterizzare. Si prova senza rasterizzatore. */
/* LA TERZA RIGA È GRATIS, ED È MISURATA. La banda della testata vale 96 unità e ne usa 63
   — il titolo a corpo 30 con la linea di base a y=56 arriva a ~63 con la discendente. Una
   seconda riga a corpo 18 con la base a y=84 occupa da 71 a 88,5: ci sta con 7,5 unità di
   margine, e non tocca il disegno, perché la banda è un MARGINE della tela e non del
   disegno — è la stessa scelta delle due fasce degli istogrammi.
   NON VA NEL PIEDE: quello a corpo 18 regge 113 caratteri e ne usa già 82 con la firma,
   l'indirizzo e la data. La dichiarazione ne vale una sessantina, e 147 su 113 sforerebbe.
   Misurato, non dedotto.
   PERCHÉ C'È. Da quando la leva delle liste in bilico nasce accesa, il conteggio della
   pagina non è quello della fonte — e questa immagine è quello che vede chi riceve il link
   su Facebook o LinkedIn, dove il testo della condivisione non passa e la riga di esito
   della pagina non c'è. Senza questa riga l'anteprima direbbe un numero fuori dal suo
   contesto, che è la stessa famiglia del riquadro dell'evento isolato.
   L'ALTERNATIVA ERA CHE IL JOB SCRIVESSE I TOTALI SENZA LA LEVA, ed è stata scartata: la
   card direbbe numeri DIVERSI da quelli che si trovano cliccando, cioè una terza lettura
   degli stessi dati. L'anteprima deve dire quello che la pagina dice. */
export const Y_IP = 84, FS_IP = 18;
/* IL TAGLIO, PER ECCESSO E ALL'ULTIMO SPAZIO. Qui non c'è nessun modo di misurare una
   stringa — jsdom non fa layout e resvg si vede solo il risultato — quindi si stima con lo
   stesso 0,62 em per carattere che usa inchiostro(), che è una stima ALTA: al massimo si
   taglia un po' prima del necessario, mai troppo tardi. È l'argomento di ETIW.
   E si taglia in CODA, che è il verso giusto solo perché la frase mette l'essenziale
   davanti: «Ipotesi del modello: …» sopravvive al taglio, il dettaglio no. Se un giorno la
   frase cambiasse ordine, questo taglio diventerebbe una censura dell'avvertimento. */
export function taglia(t, fs, largo){
 const perChar = 0.62 * fs;
 const max = Math.floor(largo / perChar);
 if (t.length <= max) return t;
 const tagliato = t.slice(0, max - 1);
 const sp = tagliato.lastIndexOf(' ');
 return (sp > max / 2 ? tagliato.slice(0, sp) : tagliato) + '…';
}
export function targa(interno, ink, vb, testata, piede, col, ipotesi){
 const dispW = W - 2 * LATO, dispH = H - TESTA - PIEDE;
 const k = Math.min(dispW / ink.w, dispH / ink.h);
 const ox = (W - ink.w * k) / 2 - ink.x * k;
 const oy = TESTA + (dispH - ink.h * k) / 2 - ink.y * k;
 const E = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H +
  '" viewBox="0 0 ' + W + ' ' + H + '" font-family="Inter">' +
  '<rect width="' + W + '" height="' + H + '" fill="' + col.paper + '"/>' +
  '<text x="' + LATO + '" y="56" font-size="30" font-weight="600" fill="' + col.ink + '">' +
    E(testata) + '</text>' +
  (ipotesi ? '<text x="' + LATO + '" y="' + Y_IP + '" font-size="' + FS_IP + '" fill="' + col.mute + '">' +
    E(taglia(ipotesi, FS_IP, W - 2 * LATO)) + '</text>' : '') +
  '<text x="' + LATO + '" y="' + (H - 24) + '" font-size="18" fill="' + col.mute + '">' +
    E(piede) + '</text>' +
  '<g transform="translate(' + ox.toFixed(2) + ',' + oy.toFixed(2) + ') scale(' + k.toFixed(4) + ')">' +
  interno + '</g></svg>';
}

/* LE DUE GUARDIE, e la seconda è quella che conta.
   La prima coglie il rasterizzatore che restituisce un buffer vuoto. La seconda coglie il
   caso che la prima non vede: UN PNG GRANDE E TUTTO DI UN COLORE, che è esattamente quello
   che produce un rasterizzatore che non trova i font o sbaglia il viewBox. Si campionano i
   pixel e si contano i colori distinti — la stessa misura usata per l'esportazione, dove
   1.481 campioni davano 76 colori. */
export function guarda(png, pixel){
 if (!png || png.length < 8 * 1024) return 'il PNG è vuoto o troppo piccolo: ' + (png ? png.length : 0) + ' byte';
 const colori = new Set();
 for (let i = 0; i < pixel.length; i += 4 * 997) colori.add(pixel[i] + ',' + pixel[i+1] + ',' + pixel[i+2]);
 if (colori.size < 4) return 'la tela è uniforme: ' + colori.size + ' colori distinti, il disegno non c\'è';
 return null;
}

/* IL TITOLO DELLO STESSO RENDER. componi() lo posa qui, e da qui lo prende chi scrive le
   meta: così og:title e og:image non hanno modo di venire da due render diversi. */
export let TITOLO = null;

export async function componi(){
 const html = readFileSync(join(RADICE, 'index.html'), 'utf8');
 const app = html.match(/<script>([\s\S]*)<\/script>/)[1];
 const dom = new JSDOM('<!doctype html><html><body><div id="kn26"></div></body></html>',
   {pretendToBeVisual: true, url: 'https://angrisanidj.github.io/modello-israele/'});
 const W2 = dom.window, D = W2.document;
 global.DOMParser = W2.DOMParser;
 D.body.innerHTML = html.replace(/<script>[\s\S]*?<\/script>/g, '')
   .match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
 global.document = D; global.window = W2;
 W2.matchMedia = () => ({matches: false, addEventListener(){}, addListener(){}});
 W2.IntersectionObserver = class { observe(){} unobserve(){} };
 global.IntersectionObserver = W2.IntersectionObserver;
 W2.requestAnimationFrame = f => f();
 W2.Element.prototype.scrollIntoView = function(){};
 Object.defineProperty(W2, 'localStorage', {configurable: true,
   value: {getItem: () => null, setItem(){}, removeItem(){}}});
 global.getComputedStyle = () => ({getPropertyValue: () => '', opacity: '1'});
 global.Blob = function(){};
 global.URL = {createObjectURL(){ return ''; }, revokeObjectURL(){}};
 global.FileReader = function(){};
 /* l'archivio si legge dal disco, non dalla rete: il job lo ha appena aggiornato, ed è
    quello che l'immagine deve mostrare */
 const arch = JSON.parse(readFileSync(join(RADICE, 'dati', 'archivio.json'), 'utf8'));
 /* IL FINTO FETCH SERVE IL FILE CHIESTO, non l archivio per qualunque indirizzo. Prima
    rispondeva l archivio a tutti e tre, quindi GIRO restava nullo e nel job
    composizioneCambiata() era falsa PER COSTRUZIONE: og:title avrebbe continuato ad
    affermare mentre la pagina taceva, cioe esattamente il difetto che questo stato esiste
    per chiudere. Uno stub che mente su quale file sta servendo e una prova che non prova.
    Gli altri file si rifiutano, come quando la pagina si apre da disco. */
 const dafare = (function(){ try{ return JSON.parse(readFileSync(join(RADICE,'dati','da-fare.json'),'utf8')); }catch(e){ return null; } })();
 global.fetch = (u) => {
  const s = String(u||'');
  if (s.indexOf('archivio.json') >= 0) return Promise.resolve({ok: true, json: () => Promise.resolve(arch)});
  if (dafare && s.indexOf('da-fare.json') >= 0) return Promise.resolve({ok: true, json: () => Promise.resolve(dafare)});
  return Promise.reject(0);
 };

 const spia = {};
 /* titoloCortoOra ENTRA NELLA SPIA dal 31 agosto 2026, ed è la mossa che rende strutturale
    una promessa che prima era una coincidenza di ordine dei passi: le DUE meta dello stato —
    og:title e og:image — nascono adesso dallo stesso render, in questo script, dallo stesso
    archivio letto dal disco. Prima og:title lo scriveva aggiorna.mjs con un suo render e
    og:image questo con il proprio: due render, due momenti, e a tenerli d'accordo era solo
    il fatto che i due passi fossero adiacenti nello stesso job. Il giorno in cui uno dei due
    è girato senza l'altro — cioè ogni push che cambiava index.html senza toccare
    l'archivio — la card e la pagina hanno cominciato a dire due cose diverse. */
 eval(app.replace('carica().then(render,render)',
   'Object.assign(spia,{C:C,SEG:SEG,dl:dl,SOND:SOND,applicaTema:applicaTema,' +
   'titoloCortoOra:titoloCortoOra,ipotesiNeiNumeri:ipotesiNeiNumeri});carica().then(render,render)'));
 /* IL TEMA SI SCEGLIE, NON SI EREDITA. Senza questa riga l'anteprima usciva in chiaro lo
    stesso — ma per il default di matchMedia in jsdom, cioè per caso, e un giorno un banco
    diverso l'avrebbe fatta uscire scura senza che nessuno l'avesse deciso.
    CHIARO, e la ragione non è che sia il tema giusto: le anteprime compaiono dentro le
    interfacce dei social, che sono chiare o scure a seconda dell'app e dell'ora, quindi un
    tema giusto non esiste. Il chiaro regge meglio su fondo bianco, che è il caso più
    frequente — e soprattutto una scelta dichiarata vale più di un default di jsdom. */
 try{ spia.applicaTema('chiaro'); }catch(e){}
 await new Promise(r => setTimeout(r, 0));
 Object.assign(spia, {});

 const svg = D.querySelector('#k-emi svg');
 if (!svg) throw new Error('l\'emiciclo non è stato reso');
 const vb = String(svg.getAttribute('viewBox') || '').split(/\s+/).map(Number);
 const ink = inchiostro(svg, vb[2], vb[3]);
 const interno = svg.innerHTML;
 /* la data dell'ultimo sondaggio, presa dall'archivio: un'anteprima senza data invecchia in
    silenzio, ed è la stessa ragione per cui #k-upd esiste */
 const ultima = arch.map(s => s.data).filter(Boolean).sort().pop();
 const col = spia.C || {};
 /* il titolo si prende QUI, dallo stesso render che sta per diventare l'immagine */
 TITOLO = spia.titoloCortoOra ? spia.titoloCortoOra() : null;
 if (!TITOLO) throw new Error('titoloCortoOra() non ha risposto: il render non e arrivato in fondo');
 return targa(interno, ink, vb,
   'Knesset 2026 · proiezione dei 120 seggi',
   /* la data si formatta con dl(), la stessa funzione della pagina: scriverne il formato
      qui sarebbe la seconda strada che dice «2026-08-20» dove la pagina dice «20 agosto
      2026», e divergerebbe il giorno in cui una delle due cambia */
   'Daniele Angrisani · angrisanidj.github.io/modello-israele · dati al ' +
     (spia.dl ? spia.dl(ultima) : ultima),
   {paper: col.paper || '#F7F8FA', ink: col.ink || '#0A1730', mute: col.mute || '#626D7E'},
   /* LA FRASE LA CHIEDE ALLA PAGINA e non la ricompone: è la stessa che va nel testo di
      condivisione e nel prompt, e una seconda stesura qui direbbe la stessa cosa oggi e una
      cosa diversa al primo ritocco. È l'idioma con cui la data passa da dl(). */
   /* LA FORMA CORTA, e la scelta è misurata: la riga a corpo 18 regge 113 caratteri e la
      forma lunga ne vale 142. */
   (spia.ipotesiNeiNumeri ? spia.ipotesiNeiNumeri(true) : ''));
}

export async function genera(){
 const testo = await componi();
 const r = new Resvg(testo, {font: {loadSystemFonts: false, fontFiles: FONT, defaultFontFamily: 'Inter'}});
 const reso = r.render();
 const png = reso.asPng();
 const male = guarda(png, reso.pixels ? reso.pixels : new Uint8Array(0));
 if (male) throw new Error(male);
 return png;
}

/* IL PUNTO D'INGRESSO SI RICONOSCE CON pathToFileURL, NON CONCATENANDO «file:///».
   La forma di prima funzionava SOLO SU WINDOWS, e per questo non l'ha vista nessuno: là
   argv[1] è «C:\...», diventa «C:/...», e «file:///» + quello è esattamente
   import.meta.url. Su Linux il percorso comincia GIÀ con una barra, quindi il confronto
   costruiva «file:////home/runner/...» — quattro barre contro le tre di import.meta.url —
   e non coincideva mai. Il 28 agosto 2026 il passo «Anteprima Open Graph» del lavoro
   notturno è andato VERDE stampando zero righe: lo script usciva 0 senza scrivere niente,
   mentre i blocchi passavano da 53·55·12·0 a 48·55·12·5. Cioè il difetto che questo file
   esiste per chiudere — l'anteprima che dice numeri diversi dalla pagina — era ancora
   aperto, con sopra un passo verde. Le due sole generazioni della sua vita erano a mano,
   da Windows: la piattaforma su cui la guardia funziona.
   Né png.js né meta.js potevano coglierlo: provano componi() e genera(), cioè la
   COMPOSIZIONE, e struttura.mjs legge il sorgente del workflow. L'unica cosa rotta era il
   punto d'ingresso, che nessuna delle due esercita. */
/* L'IMPRONTA VA NELL'INDIRIZZO, E SI CALCOLA SUL CONTENUTO.
   Un aggregatore puo' fallire in due modi e ne avevamo guardato uno solo: se non rilegge
   la pagina, l'impronta non serve; ma se rilegge la pagina e serve l'IMMAGINE dalla
   propria cache, l'impronta e' l'unica cosa che lo chiude. Il 29 agosto 2026 i due modelli
   gemelli dello stesso account usavano tutti e due l'indirizzo versionato e le loro
   anteprime funzionavano; questo non lo usava e non funzionava. E su WhatsApp, che non ha
   nessuno strumento pubblico di rilettura, e' la SOLA leva che esista.
   DEL CONTENUTO E NON DELLA DATA: una notte senza rilevazioni nuove lascia il PNG identico,
   quindi l'impronta identica, quindi scriviMeta() non cambia un byte e non si committa
   niente. Con la data, ogni notte butterebbe la cache di tutti per non dire niente di nuovo.
   Si chiama anche quando il PNG NON e' stato riscritto, perche' la prima volta l'indirizzo
   in pagina e' quello nudo e l'impronta va aggiunta comunque. */
/* LE DUE META SI SCRIVONO INSIEME, DALLO STESSO RENDER, E IL VALORE DI RITORNO E' IL
   ROMPI-ANELLO — dal 31 agosto 2026.
   Restituisce true se index.html e' cambiato. Non e' una comodita': e' il FATTO su cui il
   job delle meta decide se committare. Un rompi-anello dedotto non e' un rompi-anello — se
   il job si affidasse all'idempotenza («tanto al secondo giro non scrive») starebbe
   scommettendo su una garanzia che nessuno dichiara, ed e' esattamente la forma che questo
   progetto ha gia' pagato con l'anello del push. Qui la domanda «c'e' qualcosa da
   pubblicare?» ha una risposta calcolata: l'impronta che esce dal PNG e il titolo che esce
   dal render coincidono, o non coincidono, con quelli scritti nel file. */
function scriviLeDue(png, titolo){
 const v = createHash('sha256').update(png).digest('hex').slice(0, 12);
 const p = join(RADICE, 'index.html');
 const prima = readFileSync(p, 'utf8');
 /* UNA CHIAMATA SOLA PER TUTTE E DUE. Scriverle in due passaggi vorrebbe dire due letture e
    due scritture dello stesso file, cioe' un istante in cui og:title e' di questo render e
    og:image di quello prima — la finestra che si sta chiudendo, larga microsecondi invece
    che dieci ore, ma della stessa natura. */
 const dopo = scriviMeta(prima, titolo, v);
 /* scriviMeta() restituisce null quando la regione non c'e' piu': il job si ferma invece di
    indovinare dove mettere la meta, ed e' il modo di fallire di tutto il resto. */
 if (dopo === null) { console.error('meta NON aggiornate: la regione delle meta non esiste'); process.exit(1); }
 if (dopo === prima) { console.log('meta: invariate — og:title «' + titolo + '», og:image ' + v); return false; }
 writeFileSync(p, dopo);
 console.log('meta: scritte — og:title «' + titolo + '», og:image ' + v);
 return true;
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
 genera().then(png => {
  /* SI CONFRONTANO I BYTE PRIMA DI SCRIVERE. Senza, il job committerebbe un'immagine anche
     quando gira a vuoto e non è cambiato niente — e un commit che non cambia niente rende
     invisibile quello che cambia qualcosa. È la stessa ragione per cui scriviMeta() è
     idempotente. */
  const pngNuovo = !(existsSync(USCITA) && Buffer.compare(readFileSync(USCITA), png) === 0);
  if (pngNuovo) { writeFileSync(USCITA, png);
   console.log('anteprima: scritta, ' + (png.length / 1024).toFixed(1) + ' KB'); }
  else console.log('anteprima: identica, non riscritta');
  const metaNuove = scriviLeDue(png, TITOLO);
  /* IL FATTO ESCE DAL PROCESSO, e il job lo legge da qui. Codice 0 «c'e' qualcosa da
     pubblicare», 3 «niente». Non e' un errore: e' una risposta, ed e' la ragione per cui il
     job delle meta puo' girare a ogni push senza committare a vuoto e senza mordersi la
     coda. Con l'idempotenza al posto suo il giro si chiuderebbe lo stesso — ma per una
     garanzia che nessuno dichiara, che e' precisamente quello che questo progetto chiama
     rompi-anello dedotto. */
  if (!pngNuovo && !metaNuove) { console.log('niente da pubblicare: il render coincide con quello gia scritto'); process.exit(3); }
  return;
 }).catch(e => {
  /* SE UNA GUARDIA SCATTA NON SI SCRIVE NIENTE. Un og:image vecchio è meglio di un
     og:image vuoto: il file resta quello di ieri e la pagina continua a dire una cosa vera. */
  console.error('anteprima NON generata: ' + e.message);
  process.exit(1);
 });
}
