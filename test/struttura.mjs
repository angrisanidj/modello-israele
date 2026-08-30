/* Controlli strutturali sul file pubblicato: HTML bilanciato, nessun id orfano,
   nessuna funzione duplicata, dimensione entro i limiti. */
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const qui=dirname(fileURLToPath(import.meta.url));
const NL=String.fromCharCode(10);
const html=readFileSync(join(qui,'..','index.html'),'utf8');
const js=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop()[1];
const prove=[];
const p=(n,v)=>prove.push([n,!!v]);
/* IL TERZO ESITO. Un controllo che non si applica in questo contesto — il diff del commit
   notturno, che fuori dal job non esiste — non è né passato né fallito: stamparlo OK
   sarebbe la forma di falso verde contro cui questo progetto ha già pagato tre volte, e
   ometterlo sarebbe peggio, perché sparirebbe l'unica traccia che il controllo esiste.
   Si stampa «··», e non conta in nessuna delle due colonne. */
const na=n=>prove.push([n,'na']);

const nomi=[...js.matchAll(/^function (\w+)\(/gm)].map(m=>m[1]);
const dupl=nomi.filter((x,i)=>nomi.indexOf(x)!==i);
p('nessuna funzione duplicata'+(dupl.length?' ('+[...new Set(dupl)].join(', ')+')':''), !dupl.length);

const idJS=[...html.matchAll(/\$\('([\w-]+)'\)/g)].map(m=>m[1]);
const orfani=[...new Set(idJS)].filter(i=>!html.includes('id="'+i+'"'));
p('nessun id usato dal JS ma assente dal markup'+(orfani.length?' ('+orfani.join(', ')+')':''), !orfani.length);

/* IL CANONICAL NON È UNA RISORSA, e questo controllo lo trattava come tale.
   La regola del file autonomo riguarda quello che il browser SCARICA: uno script, un
   foglio, un carattere, un'immagine. <link rel="canonical"> non scarica niente — dichiara
   qual è l'indirizzo buono di questa pagina, e lo legge un motore di ricerca leggendo il
   file, non facendo una richiesta. È la stessa distinzione già fatta qui sotto per l'href
   di un'ancora, e la correzione è la stessa: esce dal conto delle risorse ed entra in un
   inventario, perché una cosa che punta fuori deve restare una cosa che si vede.
   La lista bianca delle RISORSE non si allarga di un elemento: resta vuota. */
const htmlSenzaEsenti=html
  .replace(/<link\s+rel="canonical"[^>]*>/g,'<link>')
  /* E IL CODICE DENTRO <code> NON È MARKUP: È TESTO. Il frammento da copiare per
     incorporare la pagina contiene un iframe scritto con le entità, quindi il browser non
     carica niente — lo legge una persona e lo incolla altrove. Il primo giro di questo
     controllo lo dichiarava una risorsa esterna: è la stessa distinzione già fatta per
     l'href di un'ancora, cioè fra quello che il browser SCARICA e quello che sta scritto
     in pagina. Si toglie prima di cercare. */
  .replace(/<code>[\s\S]*?<\/code>/g,'<code></code>');
p('file autonomo: nessuna risorsa esterna',
  !/(src|href)="https?:\/\//.test(htmlSenzaEsenti.replace(/<a [^>]*href="https?:[^"]*"/g,'')));

/* Ogni chiamata di rete è o l'API di Wikipedia o un percorso relativo del progetto.
   Il controllo è più stretto del precedente, che i fetch non li guardava affatto:
   qui ogni URL assoluto dentro il JavaScript deve essere wikipedia.org, quindi un
   fetch verso un servizio terzo — traduzioni, CDN, analytics — fa fallire la
   verifica invece di passare inosservato.

   UN COLLEGAMENTO NON È UNA CHIAMATA DI RETE, e il controllo adesso lo distingue.
   Il primo controllo qui sopra già lo faceva per il markup — toglie gli <a href> prima
   di cercare risorse esterne — ma questo no: una firma generata dal JavaScript con un
   <a href="https://x.com/…"> lo faceva cadere, e sarebbe stato un falso positivo, perché
   l'href di un'ancora non carica niente: è navigazione, e la decide chi legge.
   La distinzione è più PRECISA, non più larga: la lista bianca delle chiamate di rete
   resta Wikipedia e basta. Quello che cambia è che gli href delle ancore escono dal conto
   delle chiamate — e vengono elencati a parte, così un collegamento esterno resta una
   cosa che si vede invece di una cosa che passa. */
/* E L'INDIRIZZO DI QUESTA PAGINA NON È UN TERZO. Dal 23 agosto 2026 il JavaScript conosce
   il proprio indirizzo — CANONICO — perché in modalità incorporata la firma porta la via
   d'uscita verso la pagina intera. È navigazione come l'href di un'ancora, e verso noi
   stessi: la lista bianca delle CHIAMATE DI RETE non si allarga di un elemento.
   Non è una whitelist scritta: si LEGGE dal <link rel="canonical"> del markup, così i due
   indirizzi non possono divergere — se un giorno il canonical cambia e la costante no,
   questo controllo torna rosso invece di lasciar passare due indirizzi diversi. */
const canonicoJS=(html.match(/<link\s+rel="canonical"\s+href="(https?:\/\/[^"]+)"/)||[])[1]||null;
const ancoreJS=[...js.matchAll(/<a\s[^>]*href="(https?:\/\/[^"]+)"/g)].map(m=>m[1]);
const jsSenzaAncore=js.replace(/<a\s[^>]*href="https?:\/\/[^"]+"/g,'<a ');
const urlJS=[...jsSenzaAncore.matchAll(/https?:\/\/([^'"\s\\]+)/g)].map(m=>m[1]);
/* UNO SPAZIO DEI NOMI XML NON È UN INDIRIZZO: è un NOME che sembra un indirizzo, e nessun
   browser lo ha mai richiesto. `http://www.w3.org/2000/svg` è quello che va scritto in
   `xmlns` perché `new Image()` accetti un SVG serializzato — senza, fallisce in silenzio —
   e non produce nessuna chiamata di rete. È la terza volta che questo controllo incontra la
   stessa distinzione: l'href di un'ancora, il canonical, e adesso il namespace. La lista
   bianca delle CHIAMATE DI RETE resta Wikipedia e basta; quello che cresce è l'elenco delle
   cose che non sono chiamate. */
const NAMESPACE=/^www\.w3\.org\/\d{4}\//;
/* LE DESTINAZIONI DI CONDIVISIONE NON SONO CHIAMATE DI RETE: sono indirizzi che la pagina
   COMPONE e mette in un href, e a raggiungerli è il lettore premendo. Nessuna richiesta
   parte da qui — è la quarta volta che questo controllo incontra la stessa distinzione,
   dopo l'href di un'ancora, il canonical e il namespace XML.
   Si ELENCANO invece di allargare la lista bianca con un'espressione larga: sono le sei
   reti e i quattro motori dichiarati in RETI e AI_MOTORI, e se ne compare una che non è
   qui il controllo torna rosso e chiede di guardarla. È l'inventario dell'opacità applicato
   alle destinazioni: non un permesso, un elenco con un perché.
   La lista bianca delle CHIAMATE DI RETE resta Wikipedia e basta. */
const DESTINAZIONI=[
  /^x\.com\/intent\//, /^www\.threads\.net\/intent\//,
  /^www\.facebook\.com\/sharer\//, /^www\.linkedin\.com\/sharing\//,
  /^t\.me\/share\//, /^wa\.me\//,
  /^www\.perplexity\.ai\//, /^chatgpt\.com\//, /^claude\.ai\//, /^www\.google\.com\/search/
];
const estranei=urlJS.filter(u=>!/^([a-z]+\.)?wikipedia\.org\//.test(u))
  .filter(u=>!(canonicoJS&&('https://'+u)===canonicoJS))
  .filter(u=>!NAMESPACE.test(u))
  .filter(u=>!DESTINAZIONI.some(re=>re.test(u)));
p('ogni URL assoluto nel JS è Wikipedia o una destinazione dichiarata'+
  (estranei.length?' ('+estranei.slice(0,3).join(', ')+')':''), !estranei.length);
/* e le destinazioni si CONTANO: dieci comandi, dieci indirizzi. Se un giorno ne sparisse
   uno o ne comparisse un undicesimo, questa riga lo dice invece di lasciarlo passare. */
const dest=[...new Set(urlJS.filter(u=>DESTINAZIONI.some(re=>re.test(u))))];
p('le destinazioni di condivisione sono le dieci dichiarate ('+dest.length+')',
  dest.length===10);
/* I COLLEGAMENTI ESTERNI SI ELENCANO TUTTI, non solo quelli generati dal JavaScript.
   Questo controllo guardava il solo JS, e la firma in fondo alla pagina è markup: il 23
   agosto 2026 la riga diceva «nessuno» mentre in pagina ce n'erano due, verso
   focusamerica.it. Non era un falso verde — nessuna asserzione era violata — ma era una
   riga che si legge come un inventario e non lo era: sono l'unico posto da cui il lettore
   può uscire, e devono essere pochi, voluti e VISTI.
   La lista bianca resta quella delle CHIAMATE DI RETE, e resta Wikipedia e basta: un href
   non carica niente, quindi non entra lì. Quello che si pretende da un collegamento è
   meno — https, e comparire nell'elenco. */
const ancoreHTML=[...html.matchAll(/<a\s[^>]*href="(https?:\/\/[^"]+)"/g)].map(m=>m[1]);
const ancore=[...new Set(ancoreJS.concat(ancoreHTML))];
p('i collegamenti esterni della pagina sono dichiarati'+
  (ancore.length?' ('+ancore.join(', ')+')':' (nessuno)'),
  ancore.every(u=>/^https:\/\//.test(u)));
const fetches=[...js.matchAll(/fetch\(\s*(['"])([^'"]*)\1/g)].map(m=>m[2]);
const fetchCattivi=fetches.filter(u=>/^https?:/.test(u)&&!/wikipedia\.org/.test(u));
p('ogni fetch con URL letterale è Wikipedia o un percorso relativo'+
  (fetchCattivi.length?' ('+fetchCattivi.join(', ')+')':''), !fetchCattivi.length);
/* NESSUNA COMPOSIZIONE DI COALIZIONE SCRITTA FUORI DA PRESET.
   È un controllo strutturale e non una prova di comportamento, perché la cosa da vietare
   non si vede a tempo d'esecuzione: fino al 22 agosto 2026 la selezione di apertura era
   scritta a mano, IDENTICA al preset del pulsante. Due strade che dicono lo stesso valore
   oggi non divergono oggi — divergono l'8 settembre, quando una lista entra nel blocco e
   se ne aggiorna una sola. simulatore.js confronta i due valori e coglie la divergenza
   quando c'è; questo coglie la FORMA che la produrrà.
   Due regole, e la seconda è arrivata dopo che la prima ha lasciato passare una
   mutazione: (1) un elenco di tre o più id di lista può stare solo dentro PRESET e
   dentro CAMBIO, che di PRESET è un pezzo; (2) un elenco che coincide ESATTAMENTE con
   un blocco dell'anagrafica è vietato ovunque, PRESET compreso — perché il blocco di
   ogni lista è già dichiarato in P{}, e riscriverlo è la copia che l'8 settembre resta
   indietro. Senza la seconda, riscrivere PRESET.netanyahu come elenco dentro PRESET
   passava: era lecito per la prima e nessuna prova di comportamento poteva vederlo,
   perché i cinque id sono gli stessi.

   Si cercano soltanto gli ELENCHI DI SOLI ID — ['likud','shas',…] — che è la forma in
   cui una composizione viene scritta. Gli oggetti con valori numerici sono un'altra
   cosa: sono le rilevazioni di BASE{}, che elencano le liste perché ne riportano i
   seggi, e non sono composizioni di niente. Il primo giro di questo controllo li
   pescava tutti, cioè segnalava duecento falsi positivi e un difetto vero: la forma
   larga rende il controllo inutilizzabile, e un controllo che urla sempre non lo legge
   nessuno.
   Il difetto vero che ha trovato: una TERZA copia del blocco Netanyahu dentro il parser
   di Wikipedia, che validava la colonna «Gov». */
const idListe=[...js.matchAll(/^ ([a-z_0-9]+)\s*:\{n:"/gm)].map(m=>m[1]);
const jsSenzaPreset=js.replace(/var (?:PRESET|CAMBIO)\s*=[\s\S]*?\n\};?/g,'');
const composizioni=[...jsSenzaPreset.matchAll(/\[\s*(?:'[a-z_0-9]+'\s*,\s*){2,}'[a-z_0-9]+'\s*\]/g)]
  .map(m=>m[0])
  .filter(t=>{
    const dentro=(t.match(/'[a-z_0-9]+'/g)||[]).map(x=>x.slice(1,-1));
    return dentro.length>=3 && dentro.every(x=>idListe.indexOf(x)>=0);
  });
p('nessuna composizione di liste scritta fuori da PRESET'+
  (composizioni.length?' ('+composizioni.map(t=>t.replace(/\s+/g,'')).join(' | ')+')':''),
  idListe.length>=15 && /var PRESET\s*=/.test(js) && !composizioni.length);

/* (2) e nessun elenco che rifaccia un blocco dell'anagrafica, nemmeno dentro PRESET */
const blocchiP={};
[...js.matchAll(/^ ([a-z_0-9]+)\s*:\{n:"[\s\S]*?b:"([a-z]+)"/gm)].forEach(m=>{
  (blocchiP[m[2]]=blocchiP[m[2]]||[]).push(m[1]);});
const rifatti=[...js.matchAll(/\[\s*(?:'[a-z_0-9]+'\s*,\s*){2,}'[a-z_0-9]+'\s*\]/g)]
  .map(m=>m[0])
  .filter(t=>{
    const d=[...new Set((t.match(/'[a-z_0-9]+'/g)||[]).map(x=>x.slice(1,-1)))].sort();
    return Object.keys(blocchiP).some(b=>
      JSON.stringify([...new Set(blocchiP[b])].sort())===JSON.stringify(d));
  });
/* (2-bis) NESSUNA PREPOSIZIONE SCRITTA A MANO SUBITO PRIMA DI UN NOME DI LISTA.
   È la classe, non l'istanza: il 23 agosto 2026 la pagina diceva «contro il 44% di il
   Likud», «In evidenza i seggi di I Democratici» e avrebbe detto «seguito da Likud».
   Tre punti diversi, un difetto solo, e stava nella FIRMA — nmA(i,prep) con prep
   facoltativa si può chiamare senza, e allora la preposizione la scrive il chiamante un
   carattere prima, dove la contrazione non ha nessun posto in cui avvenire.
   La firma adesso pretende la preposizione, anche vuota; questo controllo impedisce
   l'altra metà, cioè che qualcuno la scriva fuori lo stesso. Cerca un letterale che
   finisce con una preposizione attaccato a nm( o nmA(. */
const PREP=/(di|a|da|in|con|su|per|tra|fra|del|dello|della|dei|degli|delle|al|allo|alla|ai|agli|alle|dal|dallo|dalla|dai|dagli|dalle|nel|nella|nei|sul|sulla|sui)/;
/* il tag di apertura in coda non conta: il difetto vero era «… 44% di <b>'+nmA(», cioè
   con la preposizione separata dal nome da un pezzo di markup */
const ultimaParola=t=>t.replace(/(<[^>]*>\s*)+$/,'').trim().split(/\s+/).pop()||'';
const aMano=[...js.matchAll(/'([^']*?)'\s*\+\s*(nm|nmA)\s*\(/g)]
  .filter(m=>new RegExp('^'+PREP.source+'$').test(ultimaParola(m[1])))
  .map(m=>'…'+m[1].slice(-26)+"' + "+m[2]+'(');
p('nessuna preposizione scritta a mano prima di un nome di lista'+
  (aMano.length?' ('+aMano.join(' | ')+')':''),
  !aMano.length);

p('nessun blocco dell\'anagrafica riscritto come elenco'+
  (rifatti.length?' ('+rifatti.map(t=>t.replace(/\s+/g,'')).join(' | ')+')':''),
  Object.keys(blocchiP).length===4 && !rifatti.length);

/* IL TETTO STA SUL GZIP, e prima stava sui caratteri.
   Il vecchio controllo era `html.length < 400*1024`, cioè contava i CARATTERI del file.
   Contava la cosa sbagliata per due ragioni, e la seconda è quella che importa:
     · un carattere non è un byte — con gli accenti e i trattini tipografici di questo
       file 400 KB di caratteri sono 403 KB su disco, e i due numeri divergono di più man
       mano che la prosa cresce;
     · soprattutto, NESSUNO SCARICA I CARATTERI. GitHub Pages serve gzip, e il file che
       il lettore riceve pesa 132 KB contro i 400 del conteggio: il tetto aveva un margine
       del 200% rispetto alla grandezza che l'invariante voleva proteggere — «deve poter
       essere salvato, aperto con un doppio clic, incorporato altrove» — e nel frattempo
       fermava il lavoro notturno, perché npm run verifica è il suo cancello.
   Il 23 agosto 2026 il conteggio dei caratteri ha sfondato i 400 KB mentre il file
   compresso era a un terzo del tetto: il numero non misurava più niente di reale ma
   avrebbe smesso di far pubblicare l'archivio la notte stessa.

   IL NUMERO E' RICAVATO, non scelto perché sta comodo, E SI RIFÀ INVECE DI ALZARLO.
   Rifatto il 24 agosto 2026 col metodo di sempre — quattro addendi — perché il margine era
   sceso a ottocento byte e la prima cosa applicata l'avrebbe sfondato a metà lavoro.

     178,2 KB   il file compresso adesso
     + 0,8 KB   l'archivio da qui al voto: 64 giorni a 1,03 rilevazioni al giorno fanno 66,
                più le 8 dell'allineamento pendente di BASE, a 10 byte di gzip ciascuna
     + 35 KB    quello che resta da scrivere: embed compatto, card social, og:image, i 44px
                dei bersagli, il campo esito. Cinque interventi a 7 KB, cioè la mediana
                misurata di 3,49 KB per commit arrotondata al doppio, com'era stato fatto
                la volta scorsa (2,9 arrotondata a 6)
     + 8,4 KB   un commit grosso di riserva: il più pesante dei tredici misurati
     ─────────
     = 222,4 KB, arrotondato al KB superiore

   DUE MISURE SONO CAMBIATE, e vanno rimisurate invece che riportate.
   · IL COSTO DI UNA RILEVAZIONE È SCESO DA 91 BYTE A 10. Non è un errore di allora: BASE
     è passata a 165 elementi e il dizionario del gzip è ormai saturo della loro struttura,
     quindi ogni rilevazione in più costa quasi niente. L'addendo dell'archivio è passato da
     6,1 KB a 0,8, ed è il caso in cui riportare il numero di ieri avrebbe gonfiato il tetto
     per una ragione che non esiste più.
   · og:image, dei cinque interventi, vive quasi tutto in .github/scripts/ e non in questo
     file: 7 KB per lui sono abbondanti. Si tengono lo stesso, perché un tetto che
     sottostima ferma il lavoro a metà, che è precisamente la cosa da cui questo numero
     difende.

   E LA POTATURA DI BASE NON È LA STRADA, misurato lo stesso giorno: togliere le 69
   rilevazioni di gennaio-aprile vale 21,1 KB di CARATTERI ma solo 1,84 KB di GZIP — l'1%
   del file — perché sono proprio quelle che il dizionario comprime meglio. Costa quattro
   mesi di serie storica a chi apre il file da disco, e frutta meno di un commit medio.
   Il commento di prima la dava per la prima strada da guardare: era vero quando il numero
   che si aveva in mano erano i caratteri. Vedi CLAUDE.md.
   La terza strada — accorciare i commenti — vale il 52% del gzip, ed è la sola grande. Non
   si prende: sono la memoria delle trappole già pagate, e questo file ne ha pagate parecchie
   due volte. */
/* RIFATTO IL 27 AGOSTO 2026, e non alzato a occhio: il tetto era sfondato — 223,7 contro
   223 — dopo che i quattro segni dei modelli sono stati sostituiti con i file veri di
   Simple Icons, di cui claude.svg da solo vale 1823 caratteri di tracciato. I quattro
   addendi, rimisurati tutti:
     1 · il file compresso adesso                                223,2 KB
     2 · l archivio da qui al voto — 53 rilevazioni a 3,1 byte      0,2 KB
     3 · quello che resta da scrivere: cinque interventi in coda,
         alla mediana di crescita RADDOPPIATA come le due volte
         precedenti (5,0 → 10,0 KB l uno)                        50,0 KB
     4 · un commit grosso di riserva, il più pesante di quindici   13,1 KB
                                                              = 286,4 → 287
   E L ADDENDO 3 È QUASI TUTTO IL SALTO, che va detto perché è una misura su noi stessi:
   la mediana di crescita per commit è passata da 3,49 a 5,0 KB, e i due commit più grossi
   della storia del file — 12,4 e 13,1 KB — sono di questa sessione. Non è l archivio che
   cresce (3,1 byte a rilevazione: il dizionario è saturo della loro struttura): sono i
   commenti. Valgono già il 52% del gzip, ed è la sola strada grande se un giorno servisse
   davvero spazio. Non si prende: sono la memoria delle trappole già pagate. Ma il numero
   va saputo, perché il tetto lo rifà chi lo sfonda e questa volta l abbiamo sfondato noi. */
const TETTO_GZIP=287*1024;
/* ══ LA TAVOLOZZA DI RIPIEGO DICE QUELLO CHE DICONO LE VARIABILI CSS ══
   leggiTema() legge le variabili con getComputedStyle e cade su C_FALL_T quando non può —
   cioè in jsdom, cioè nelle prove e nel lavoro notturno. Fino al 24 agosto 2026 quella
   tabella era una TERZA tavolozza: 14 valori su 16 divergevano dal tema chiaro, e --oppo
   era di un'altra tinta (#0E8388 verde acqua contro #78002D). Rasterizzando l'emiciclo per
   l'immagine Open Graph il modello sarebbe uscito in colori che nessun lettore vede.
   Nessuna prova se ne accorgeva, e non perché fossero deboli: NESSUNA GUARDAVA la
   tavolozza in jsdom. Il legame andava aggiunto, non riparato.
   Qui si legge il foglio e si confronta valore per valore, nei due temi. È l'idioma di
   description/og:description applicato al colore, e chiude la terza delle tre strade —
   le variabili CSS, COLORE.token() e questa, di cui solo le prime due erano legate. */
(function(){
 var css=(html.match(/<style>([\s\S]*?)<\/style>/)||['',''])[1];
 /* i due blocchi di variabili: :root del componente e la variante scura su classe */
 function tokenDi(re){
  var m=re.exec(css); if(!m) return null;
  var o={},r=/--([a-z0-9-]+)\s*:\s*([^;]+);/gi,x;
  while((x=r.exec(m[1]))) o[x[1]]=x[2].trim().toUpperCase();
  return o;
 }
 var chiaro=tokenDi(/#kn26\{([^}]*)\}/);
 var scuro =tokenDi(/#kn26\.scuro\{([^}]*)\}/);
 var mT=/var C_FALL_T=\{([\s\S]*?)\n\};/.exec(js);
 if(!chiaro||!scuro||!mT){ p("tavolozza di ripiego: si trovano i blocchi da confrontare",false); return; }
 function tabella(nome){
  var m=new RegExp(nome+':\\{([\\s\\S]*?)\\}').exec(mT[1]); if(!m) return null;
  var o={},r=/'?([a-z0-9-]+)'?\s*:\s*'(#[0-9A-Fa-f]{6})'/g,x;
  while((x=r.exec(m[1]))) o[x[1]]=x[2].toUpperCase();
  return o;
 }
 var fc=tabella('chiaro'), fs=tabella('scuro');
 if(!fc||!fs){ p("tavolozza di ripiego: le due tabelle si leggono",false); return; }
 [['chiaro',fc,chiaro],['scuro',fs,scuro]].forEach(function(par){
  var nome=par[0],rip=par[1],vero=par[2],male=[];
  Object.keys(rip).forEach(function(k){
   if(vero[k]===undefined){ male.push(k+' non è una variabile del foglio'); return; }
   if(rip[k]!==vero[k]) male.push(k+': ripiego '+rip[k]+' contro foglio '+vero[k]);
  });
  p('ripiego della tavolozza, tema '+nome+': ogni valore è quello della variabile CSS'+
    (male.length?' — '+male.join(' · '):''), male.length===0);
 });
 /* e le due tabelle coprono gli stessi token: una che ne perde uno lo lascerebbe a
    undefined proprio dove il motore di stile non c'è */
 p('e le due tabelle dichiarano gli stessi token',
   Object.keys(fc).sort().join(',')===Object.keys(fs).sort().join(','));
 /* IL RIPIEGO SEGUE IL TEMA. Senza, una pagina scura senza motore di stile uscirebbe coi
    colori del chiaro: testo scurissimo su fondo scurissimo. */
 p('e leggiTema() sceglie la tabella in base al tema',
   /C_FALL_T\[SCURO\?'scuro':'chiaro'\]/.test(js));
})();

const gz=gzipSync(Buffer.from(html,'utf8')).length;
p('gzip sotto i '+(TETTO_GZIP/1024)+' KB ('+(gz/1024).toFixed(1)+' KB · '+
  (html.length/1024).toFixed(0)+' KB di caratteri)', gz<TETTO_GZIP);
/* I WORKFLOW DEVONO ESSERE YAML VALIDO, e non è un controllo di stile.
   Il 23 agosto 2026 due righe di JavaScript multiriga dentro un blocco «run: |» hanno reso
   .github/workflows/aggiorna.yml illeggibile: GitHub non è riuscito nemmeno a leggerne il
   nome, l'esecuzione è fallita in ZERO secondi e il lavoro notturno non è partito. Senza
   job non c'è nemmeno il riepilogo che avrebbe dovuto dirlo — il canale che avvisa muore
   insieme alla cosa di cui doveva avvisare.
   Il file lo scrive una persona a mano e nessuna prova lo leggeva. Adesso sì. */
let yamlKO=[];
try{
  const {load}=await import('js-yaml');
  for(const f of readdirSync(join(qui,'..','.github','workflows'))){
    if(!/\.ya?ml$/.test(f)) continue;
    const t=readFileSync(join(qui,'..','.github','workflows',f),'utf8');
    try{
      const d=load(t);
      if(!d||!d.jobs||!Object.keys(d.jobs).length) yamlKO.push(f+': nessun job');
    }catch(e){ yamlKO.push(f+': '+String(e.message).split(/\r?\n/)[0].slice(0,90)); }
  }
}catch(e){ yamlKO.push('js-yaml non installato: npm install'); }
p('i workflow di GitHub sono YAML valido'+(yamlKO.length?' ('+yamlKO.join(' | ')+')':''),
  !yamlKO.length);

/* ══ IL CRON A FINESTRA E LA GUARDIA CHE LO RENDE SOSTENIBILE ══
   Applicato il 28 agosto 2026, la mattina in cui il job NON E' PARTITO AFFATTO dopo che il
   giorno prima era slittato di undici ore. Le esecuzioni programmate di GitHub sono
   dichiaratamente best-effort e nessun parametro le rende puntuali: l'unica leva e'
   pianificare PIU' TENTATIVI, perche' ciascuno e' best-effort in modo indipendente.
   Le quattro proprieta' qui sotto vanno insieme e da sole non valgono:
   piu' di un tick senza guardia rifarebbe il lavoro sette notti su otto; la guardia senza
   i tick non serve a niente; la guardia estesa al dispatch renderebbe impossibile il gesto
   deliberato per cui il dispatch esiste; e la guardia dentro «aggiorna» invece che davanti
   lascerebbe scrivere il primo passo che qualcuno aggiunge dimenticandosi l'if. */
await (async function(){
 let load;
 try{ load=(await import('js-yaml')).load; }
 catch(e){ p('cron a finestra: js-yaml non installato',false); return; }
 const d=load(readFileSync(join(qui,'..','.github','workflows','aggiorna.yml'),'utf8'));
 const sched=((d&&d.on&&d.on.schedule)||[]).map(x=>x.cron);
 /* 1 · PIU' DI UN TENTATIVO. Non si conta a quanti: si conta che non sia UNO, che e' la
    proprieta' per cui la finestra esiste. Scrivere «otto» qui rimetterebbe in una prova la
    costante che il commento accanto al cron gia' spiega, e cadrebbe il giorno in cui la
    finestra si allarga per una ragione buona. */
 /* IL CAMPO DI UN CRON HA QUATTRO FORME e vanno gestite tutte, o il conteggio esce NaN su
    una scritta legittima. Successo il 29 agosto 2026 passando da 23,53 3-6 a 23 3-21/2: il
    rosso non era del cron, era di questo contatore, che conosceva solo le liste e gli
    intervalli. Le quattro forme sono l asterisco, un numero solo, una lista a virgole, un
    intervallo a-b, e l intervallo con passo, scritto con una barra e un numero in coda.
    L attesa non e' cambiata — i tentativi devono essere piu' di uno — e' cambiato cio' che
    la sa calcolare. */
 /* E DAL 30 AGOSTO 2026 SI ESPANDE INVECE DI CONTARE, perche' e' nata una seconda
    proprieta' da provare che non e' un conteggio: che i tick della VEDETTA non cadano dove
    cadono questi. Il numero e' la cardinalita' dell'insieme, quindi l'insieme li da' tutti
    e due — una strada sola invece di due che direbbero cose diverse il giorno in cui una
    delle due sbaglia una forma di campo. */
 function campo(g, tetto){
  const out=[];
  for(const pezzo of String(g).split(',')){
   const parti=pezzo.split('/');
   const gamma=parti[0], passo=parti[1]?Number(parti[1]):1;
   let da, a;
   if(gamma==='*'){ da=0; a=tetto; }
   else if(gamma.indexOf('-')>0){ da=Number(gamma.split('-')[0]); a=Number(gamma.split('-')[1]); }
   else { da=Number(gamma); a=da; }
   if(!isFinite(da)||!isFinite(a)||!isFinite(passo)||passo<1) return null;
   for(let v=da; v<=a; v+=passo) out.push(v);
  }
  return out;
 }
 function espandi(crons){
  const s=new Set();
  for(const c of [].concat(crons)){
   const campi=String(c).trim().split(/\s+/);
   const mm=campo(campi[0],59), hh=campo(campi[1],23);
   if(!mm||!hh) return null;
   for(const h of hh) for(const m of mm)
    s.add(String(h).padStart(2,'0')+':'+String(m).padStart(2,'0'));
  }
  return s;
 }
 const slot=espandi(sched);
 const tick=slot?slot.size:NaN;
 /* E L'ESPANSORE SI PROVA SU CASI COSTRUITI, perche' uno che SOTTOSTIMA fallisce rumoroso
    — un insieme vuoto non e' piu' grande di 1 — ma uno che SOVRASTIMA passerebbe in
    silenzio, dichiarando una finestra dove c'e' un istante. I casi coprono le quattro forme
    di un campo, piu' i due cron veri: quello del lavoro notturno e l'ora tonda, che e' la
    forma in cui l'asterisco deve espandersi e non collassare. */
 const casiCron=[['5 0 * * *',1],['5,35 0 * * *',2],['0-5 0 * * *',6],
   ['0-23/2 0 * * *',12],['23 3-21/2 * * *',10],['0 * * * *',24]];
 const contoKO=casiCron.filter(function(c){ const e=espandi(c[0]); return !e||e.size!==c[1]; })
   .map(function(c){ const e=espandi(c[0]); return c[0]+' -> '+(e?e.size:'illeggibile')+
     ' invece di '+c[1]; });
 p('e l espansore dei tick sa leggere tutte e quattro le forme di un campo cron'+
   (contoKO.length?' ('+contoKO.join(' · ')+')':''), contoKO.length===0);
 p('il cron del lavoro notturno e una FINESTRA e non un istante: '+tick+' tentativi ('+
   sched.join(' | ')+'), perche un tick solo e best-effort e puo saltare', tick>1);
 /* 1-bis · E UN INNESCO CHE NON E' UN OROLOGIO. Il cron a finestra e la vedetta alzano
    tutti e due la probabilita' che QUALCOSA parta, e restano tutti e due dentro il
    best-effort di GitHub: l'unico innesco che non ci sta dentro e' un fatto del mondo.
    Qui e' il push su main — chi scrive spinge piu' volte al giorno — e il giro si chiude
    perche' la guardia legge la data che il job stesso ha appena scritto.
    Si guarda che ce ne sia UNO, non che sia il push: il giorno in cui ne arriva un altro
    la proprieta' regge e la prova non va riscritta. */
 const inneschi=Object.keys((d&&d.on)||{}).filter(k=>k!=='schedule'&&k!=='workflow_dispatch');
 p('e accanto ai tick c e almeno un innesco che NON e un orologio'+
   (inneschi.length?' ('+inneschi.join(', ')+')':''), inneschi.length>0);
 /* 2 · LA GUARDIA STA DAVANTI, in un job suo, e il job che scrive DIPENDE da lei. */
 const g=(d&&d.jobs&&d.jobs.guardia)||null, a=(d&&d.jobs&&d.jobs.aggiorna)||null;
 const needs=a?[].concat(a.needs||[]):[];
 p('la guardia e un job a se e il job che scrive lo aspetta, cosi un tick a vuoto non '+
   'esegue NESSUN passo che scrive',
   !!g && !!a && needs.indexOf('guardia')>=0);
 /* 2-bis · E LEGGE LA PUNTA DEL RAMO, non il commit che l'ha innescata. Su un push il
    checkout predefinito prende il commit dell'evento, che puo' essere anteriore allo
    stato-job.json appena scritto da un'esecuzione in coda: la guardia risponde a una
    domanda su ADESSO, e leggerla nel passato le fa dire «si procede» quando la notte e'
    gia' andata. Per schedule e dispatch la riga non cambia niente — e' il caso in cui una
    proprieta' regge per coincidenza finche' non arriva l'innesco che la rompe. */
 const co=((g&&g.steps)||[]).filter(x=>x&&/actions.checkout/.test(String(x.uses||'')))[0];
 p('e legge la PUNTA di main invece del commit che l ha innescata, o su un push '+
   'risponderebbe sullo stato di ieri',
   !!co && String((co.with||{}).ref||'')==='main');
 /* 3 · E LEGGE stato-job.json, E SOLO QUELLO. Il file e' quello giusto perche' il job lo
    riscrive a OGNI notte riuscita, anche a mani vuote: «c'e' la data di oggi» vuol dire
    «stanotte e' gia' andata», non «stanotte ha trovato qualcosa».
    SI GUARDA L'INSIEME DEI FILE NOMINATI, non la presenza di uno. La prima stesura cercava
    la stringa «stato-job.json» dentro il job e restava VERDE con un mutante che faceva
    leggere da-fare.json: le righe di echo nominano il file per spiegarlo al lettore del log,
    quindi la stringa c'era comunque. E' la trappola gia' pagata con ARCO_ORD, dove il
    commento che nomina la costante teneva verdi due prove — qui a tenerla verde era il
    messaggio che la spiega. Un insieme non si lascia ingannare: se il job nomina un secondo
    file di dati, o non nomina questo, cade. */
 const OKNOME='abcdefghijklmnopqrstuvwxyz0123456789-_.';
 const testoG=JSON.stringify(g||''), fileG=[];
 for(let k=testoG.indexOf('dati/'); k>=0; ){
  let z=k+5, nome='';
  while(z<testoG.length && OKNOME.indexOf(testoG[z].toLowerCase())>=0){ nome+=testoG[z]; z++; }
  if(nome && fileG.indexOf('dati/'+nome)<0) fileG.push('dati/'+nome);
  k=testoG.indexOf('dati/', z);
 }
 p('e decide su dati/stato-job.json e su NESSUN altro file di dati'+
   (fileG.length?' ('+fileG.join(', ')+')':''),
   fileG.length===1 && fileG[0]==='dati/stato-job.json');

 /* 4 · MA NON PER IL DISPATCH — E LA PROPRIETA' SI RISOLVE, NON SI CERCA COME STRINGA.
    Fino al 30 agosto 2026 qui si guardava che la condizione contenesse «schedule» e
    «guardia». Reggeva finche' gli inneschi erano due, e sarebbe rimasta VERDE sul difetto
    per cui esiste: col push aggiunto, «!= 'schedule'» contiene tutte e due le parole e
    lascia passare un push senza guardia — cioe' l'anello che si richiude sul push che il
    job fa da se'. Una prova che cerca le parole di una condizione non sta provando la
    condizione: sta provando che qualcuno le ha scritte.
    Adesso la condizione si RISOLVE per ogni evento, e la tabella e' l'attesa. Con la
    guardia che dice «stanotte e' gia' andata» parte SOLO il dispatch; con la guardia che
    dice «si procede» partono tutti. Sei celle, e nessuna nomina una stringa del codice. */
 const cond=String((a&&a.if)||'');
 /* SI RIFIUTA DI INDOVINARE: se nella condizione resta un identificatore che non e' stato
    sostituito — un contains(), un altro contesto di GitHub — il risolutore risponde null e
    la prova CADE, invece di dare un verdetto su una grammatica che non sa leggere. */
 function risolvi(c, evento, gia){
  const js=c.split('github.event_name').join(JSON.stringify(evento))
            .split('needs.guardia.outputs.gia').join(JSON.stringify(gia));
  const nudo=js.replace(/"[^"]*"/g,'').replace(/'[^']*'/g,'');
  const parole=nudo.match(/[A-Za-z_][A-Za-z0-9_.]*/g)||[];
  if(parole.some(w=>['true','false','null'].indexOf(w)<0)) return null;
  try{ return !!(new Function('return ('+js+')'))(); }catch(e){ return null; }
 }
 /* E FRA GLI EVENTI CE N'E' UNO CHE NON ESISTE, ed e' quello che rende la tabella una
    prova della PROPRIETA' invece che dei tre casi di oggi. La proprieta' e' «tutto tranne
    il dispatch», non «questi tre»: una condizione scritta per esclusione — diverso da
    schedule E diverso da push — produce le stesse tre righe e lascia passare il quarto
    innesco, cioe' quello che qualcuno aggiunge domani senza guardare qui. Il mutante era
    VIVO finche' la tabella conosceva solo gli eventi gia' dichiarati. */
 const eventi=['schedule','push','workflow_dispatch','repository_dispatch','innesco_di_domani'];
 const con1=eventi.map(e=>risolvi(cond,e,'1'));   /* la guardia dice: gia' andata */
 const con0=eventi.map(e=>risolvi(cond,e,'0'));   /* la guardia dice: si procede */
 const atteso1=[false,false,true,false,false], atteso0=[true,true,true,true,true];
 const tabKO=eventi.map((e,i)=>[e,i]).filter(([e,i])=>con1[i]!==atteso1[i]||con0[i]!==atteso0[i])
   .map(([e,i])=>e+': parte '+con1[i]+' a notte fatta e '+con0[i]+' a notte da fare');
 p('con la notte gia fatta parte SOLO il workflow_dispatch — compreso un innesco che '+
   'oggi non esiste — e con la notte da fare partono tutti'+
   (tabKO.length?' ('+tabKO.join(' · ')+')':''), tabKO.length===0);
 /* 5 · E IL RIEPILOGO RESTA «always()». Un tick che esce subito non deve sembrare una notte
    fallita: il job saltato non lo esegue affatto, e quando il job gira l'always() deve
    esserci ancora, o una notte caduta a meta' tacerebbe. */
 const ri=((a&&a.steps)||[]).filter(x=>x&&x.name&&/riepilogo/i.test(x.name))[0];
 p('e il passo del riepilogo conserva il suo «if: always()»',
   !!ri && String(ri.if||'').indexOf('always()')>=0);

 /* ── 6-9 · LA VEDETTA, e perche' esiste una prova per una cosa che CLAUDE.md aveva
    scartato. La voce diceva: «un workflow SEPARATO con uno schedule suo avrebbe esattamente
    lo stesso difetto… il giorno in cui GitHub e' sotto carico i due tick saltano insieme».
    Il modo di fallire e' descritto giusto e la conclusione non segue: due estrazioni
    indipendenti mancano insieme MENO SPESSO di una. E' un ragionamento valido applicato a
    un caso solo — la terza volta in due giorni, dopo «da sola» e l'impronta dell'og:image.
    Le quattro proprieta' vanno insieme: un secondo innesco che stia dentro lo stesso file
    morirebbe con lui; uno che lanci senza constatare e' un secondo timer, cioe' la stessa
    classe di rischio spostata; uno che scriva e' la seconda strada sull'archivio; e uno che
    peschi nelle stesse fasce non e' una seconda estrazione, e' la stessa. */
 let ved=null, vedF='';
 for(const nf of readdirSync(join(qui,'..','.github','workflows'))){
  if(!/\.ya?ml$/.test(nf) || nf==='aggiorna.yml') continue;
  let doc; try{ doc=load(readFileSync(join(qui,'..','.github','workflows',nf),'utf8')); }
  catch(e){ continue; }
  if(JSON.stringify(doc||'').indexOf('gh workflow run aggiorna.yml')>=0){ ved=doc; vedF=nf; }
 }
 p('esiste un SECONDO innesco del lavoro notturno, e sta in un FILE SUO: dentro '+
   'aggiorna.yml morirebbe insieme a quello che deve rimediare'+(vedF?' ('+vedF+')':''),
   !!ved);

 /* CONSTATA, NON AFFERMA, e sono due asserzioni perche' sono due meta'. La prima e'
    l'idioma dell'insieme gia' pagato con ARCO_ORD: si guardano tutti i file di dati
    nominati, non la presenza di uno, o le righe di echo che spiegano il file al lettore del
    log terrebbero la prova verde mentre il codice ne legge un altro. */
 const testoV=JSON.stringify(ved||''), fileV=[];
 for(let k=testoV.indexOf('dati/'); k>=0; ){
  let z=k+5, nome='';
  while(z<testoV.length && OKNOME.indexOf(testoV[z].toLowerCase())>=0){ nome+=testoV[z]; z++; }
  if(nome && fileV.indexOf('dati/'+nome)<0) fileV.push('dati/'+nome);
  k=testoV.indexOf('dati/', z);
 }
 p('e constata su dati/stato-job.json e su NESSUN altro file di dati'+
   (fileV.length?' ('+fileV.join(', ')+')':''),
   fileV.length===1 && fileV[0]==='dati/stato-job.json');

 const passiV=[].concat(...Object.values((ved&&ved.jobs)||{}).map(j=>(j&&j.steps)||[]));
 const lancio=passiV.filter(s=>s&&typeof s.run==='string'&&s.run.indexOf('gh workflow run')>=0)[0];
 p('e il passo che LANCIA e condizionato alla constatazione: un lancio incondizionato '+
   'sarebbe un secondo scheduler, cioe la stessa classe di rischio spostata di un file',
   !!lancio && /steps[.][A-Za-z0-9_-]+[.]outputs/.test(String(lancio.if||'')));

 /* E NON SCRIVE. Due workflow che scrivono lo stesso archivio sono la strada doppia che
    questo progetto ha gia' pagato tre volte: la vedetta guarda una data e chiama. */
 const permV=(ved&&ved.permissions)||{};
 p('e non ha il permesso di scrivere nel repository, solo quello di lanciare '+
   '(contents: '+(permV.contents||'—')+', actions: '+(permV.actions||'—')+')',
   String(permV.contents||'read')!=='write' && String(permV.actions||'')==='write');

 /* E PESCA IN ALTRE FASCE. E' la proprieta' aritmetica per cui la vedetta vale la pena, ed
    e' la sola che si puo' sbagliare in silenzio: due cron scritti allo stesso minuto della
    stessa ora sono UNA estrazione ripetuta, non due. La lezione e' gia' pagata il 29 agosto
    2026, quando otto tick tutti fra le 03:23 e le 06:53 ne fecero partire zero. */
 const schedV=((ved&&ved.on&&ved.on.schedule)||[]).map(x=>x.cron);
 const slotV=espandi(schedV);
 const comuni=(slot&&slotV)?Array.from(slotV).filter(x=>slot.has(x)):null;
 p('e i suoi '+(slotV?slotV.size:'?')+' tick non cadono in NESSUNA delle '+tick+
   ' fasce del lavoro notturno ('+(schedV.join(' | ')||'nessun cron')+'): due tentativi '+
   'nella stessa buca sono un tentativo solo'+
   (comuni&&comuni.length?' — in comune: '+comuni.slice(0,3).join(', '):''),
   !!slot && !!slotV && slotV.size>1 && !!comuni && comuni.length===0);
})();

/* ══ I COMANDI DEI WORKFLOW, NON SOLO LA LORO SINTASSI ══
   Il controllo qui sopra carica lo YAML e coglie un file invalido — è nato il 23 agosto
   2026, quando due frammenti di JavaScript multiriga dentro «run: |» avevano reso
   aggiorna.yml illeggibile a GitHub. Non bastava.
   Il 24 e il 25 agosto il lavoro notturno è fallito due notti di fila in tredici secondi,
   con un file YAML PERFETTAMENTE VALIDO: dentro un «run: |» c'era una continuazione di riga
   scritta come \n LETTERALE — due caratteri, non un a-capo. La shell la legge come la
   lettera n, la passa a gh come argomento, gh esce con errore, e con «bash -e» il passo
   muore. Il caricatore YAML non aveva niente da obiettare: per lui era una stringa.
   Qui non si può eseguire gh, e non si deve: quello che si può fare è cogliere la CLASSE —
   una sequenza di escape che la shell non interpreterà, e una riga che non chiude le
   virgolette che apre. Sono le due forme in cui un comando scritto a mano si rompe
   restando sintatticamente un documento valido. */
await (async function(){
 const cattivi=[];
 let load;
 try{ load=(await import('js-yaml')).load; }
 catch(e){ p('nei comandi dei workflow: js-yaml non installato',false); return; }
 for(const f of readdirSync(join(qui,'..','.github','workflows'))){
  if(!/\.ya?ml$/.test(f)) continue;
  const doc=load(readFileSync(join(qui,'..','.github','workflows',f),'utf8'));
  const passi=[];
  for(const j of Object.values((doc&&doc.jobs)||{}))
   for(const s of (j&&j.steps)||[]) if(typeof s.run==='string') passi.push([s.name||'(senza nome)',s.run]);
  passi.forEach(function(par){
   const nome=par[0];
   par[1].split('\n').forEach(function(r,i){
    const nudo=r.replace(/^\s*#.*$/,'');       /* i commenti non sono comandi */
    if(!nudo.trim()) return;
    /* 1 · UNA SEQUENZA DI ESCAPE CHE LA SHELL NON INTERPRETA. In uno script bash una barra
       rovescia seguita da «n», fuori da un printf o da una stringa ANSI-C, non vuol dire
       niente: è una barra rovescia seguita da una lettera, e la shell la consegna al
       comando come carattere. Quasi sempre è una continuazione di riga scritta male. */
    if(/\\n/.test(nudo)&&!/printf/.test(nudo))
     cattivi.push(f+' · «'+nome+'» riga '+(i+1)+': barra rovescia più n — '+nudo.trim().slice(0,60));
    /* 2 · UNA CONTINUAZIONE CHE NON CONTINUA: una barra rovescia seguita da spazi e poi da
       altro testo sulla stessa riga. La continuazione vera è l'ULTIMO carattere della riga. */
    if(/\\[ \t]+\S/.test(nudo))
     cattivi.push(f+' · «'+nome+'» riga '+(i+1)+': continuazione seguita da testo — '+nudo.trim().slice(0,60));
    /* 3 · UNA RIGA CHE NON CHIUDE QUELLO CHE APRE. Si contano le virgolette non protette:
       un numero dispari su una riga che non termina con una continuazione è una riga
       troncata — l'altra forma in cui un comando scritto a mano si rompe restando un
       documento YAML perfettamente valido. */
    /* e si contano PERCORRENDO la riga, non con due espressioni separate: dentro le
       virgolette doppie un apostrofo è una lettera — «git commit -m "Aggiornare l'archivio"»
       è corretto — e contare i due segni a parte lo dichiarava rotto. Il primo giro di
       questo controllo produceva due falsi positivi esattamente così, e un controllo che
       grida al lupo su codice sano smette di essere letto prima di trovare il lupo vero. */
    const continua=/\\$/.test(nudo.replace(/\s+$/,''));
    let dentro=null;
    for(let k=0;k<nudo.length;k++){
     const c=nudo[k];
     if(c==='\\'&&dentro!=="'"){ k++; continue; }   /* dentro '…' la barra non protegge */
     if(dentro===null&&(c==='"'||c==="'")) dentro=c;
     else if(dentro===c) dentro=null;
    }
    if(!continua&&dentro)
     cattivi.push(f+' · «'+nome+'» riga '+(i+1)+': '+(dentro==='"'?'virgolette':'apici')+
       ' non chiusi — '+nudo.trim().slice(0,60));
   });
   /* 4 · UN «git commit» SENZA GUARDIA SUL VUOTO. Con nulla in scena git commit esce 1, e
      con «bash -e» il passo muore: una notte in cui il parser non cambia un byte
      risulterebbe FALLITA, e il riepilogo aprirebbe una issue per una notte andata bene.
      Trovato il 25 agosto 2026 al primo rilancio a mano dopo un commit umano che portava
      già le stesse righe — il passo 4 era l'unico che il banco locale non poteva provare,
      perché il push è cablato su main. E la guardia dev'essere «--cached», non un «git diff» qualunque: quella che c'era
      guardava dati/ e index.html mentre in scena andavano quattro file nominati, cioè due
      insiemi diversi — d'accordo finché coincidono. Dopo git add, --cached guarda per
      costruzione esattamente quello che verrà committato. */
   if(/\bgit commit\b/.test(par[1])&&!/git diff --cached --quiet/.test(par[1]))
    cattivi.push(f+' · «'+nome+'»: git commit senza guardia sul vuoto');
   /* 5 · UN COMMENTO CHE DICHIARA «STESSO IDIOMA DELL'ALTRO» E DUE COMANDI CHE DIVERGONO.
      Il 26 agosto 2026 la notte è morta qui: il commit dell'archivio usa
      «git pull --rebase --autostash» con dodici righe che spiegano perché l'autostash
      serve; quello del riepilogo diceva «STESSO IDIOMA DELL'ALTRO COMMIT» e chiamava
      «git pull --rebase» nudo. Il rebase si è rifiutato di partire con l'albero sporco e
      dati/da-fare.json è rimasto indietro di un giorno rispetto a stato-job.json — due
      file che la stessa notte scrive.
      È la stessa famiglia della sigla che dichiarava «incerti» mentre la riga dei totali
      era cablata a tre chiavi: UN TESTO CHE AFFERMA QUELLO CHE IL CODICE NON FA. Un
      commento non è provabile in generale; questo sì, perché nomina una corrispondenza.
      Il controllo è sulla FORMA di git pull --rebase: o tutte le occorrenze del file
      portano --autostash o nessuna, e in mezzo non c'è niente da discutere. */
  });
  /* si guardano i COMANDI, non i commenti che li nominano: il commento qui accanto parla
     di «git pull --rebase» per spiegare perché serve --autostash, e contarlo lo farebbe
     divergere da sé stesso. È lo stesso errore che il primo giro di questo controllo ha
     fatto davvero, ed è la ragione per cui la riga sta qui. */
  const pull=passi.flatMap(par=>par[1].split('\n')
    .filter(r=>!/^\s*#/.test(r))
    .flatMap(r=>(r.match(/git pull --rebase[^\n|&]*/g)||[]).map(x=>x.trim())));
  const conAuto=pull.filter(x=>/--autostash/.test(x)).length;
  if(pull.length>1&&conAuto!==0&&conAuto!==pull.length)
   cattivi.push(f+': «git pull --rebase» compare '+pull.length+' volte e solo '+conAuto+
     ' con --autostash — un commento dichiara «stesso idioma» e i due comandi divergono');
 }
 p('nei comandi dei workflow nessuna sequenza di escape non interpretata e nessuna riga aperta'+
   (cattivi.length?' — '+cattivi.slice(0,2).join(' · '):''), cattivi.length===0);
})();

/* ══ LE META CHE LEGGE CHI NON ESEGUE IL JAVASCRIPT ══
   Un aggregatore legge il file SERVITO. Senza description ripiega sul corpo, e il corpo di
   questa pagina comincia col foglio di stile — che sta dentro il <body> — oppure, per chi
   toglie <style>, col selettore del tema e poi con L'AVVISO DI AVVIO. Misurato il 23
   agosto 2026 con jsdom senza eseguire gli script, ed è il motivo per cui queste meta
   esistono.
   Il controllo è sulla PRESENZA e sull'IDENTITÀ, non sul testo: che cosa dica la
   descrizione è una decisione dell'autore, che due copie della stessa stringa restino
   uguali non lo è. */
/* Le meta si leggono UNA VOLTA in una mappa, invece di costruire un'espressione per
   ciascuna: una regexp montata da una stringa raddoppia i backslash a ogni riscrittura,
   e la prima stesura di questo controllo cercava «metas+» — zero meta trovate, e quattro
   righe che dichiaravano mancante tutto. Falliva dicendo la cosa sbagliata, che è il
   modo peggiore di fallire perché manda a cercare il difetto dove non è. */
const META={};
for(const m of html.matchAll(/<meta\s+(name|property)="([^"]+)"\s+content="([^"]*)"\s*>/g)) META[m[2]]=m[3];
const contenuto=n=>(n in META?META[n]:null);
const DESCR=contenuto('description'), OGD=contenuto('og:description');
const CANON=(html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/)||[])[1]||null;
const OGU=contenuto('og:url');
p('la descrizione per gli aggregatori c\'è ed è lunga a sufficienza ('+
  (DESCR?DESCR.length:0)+' caratteri)', !!DESCR && DESCR.length>=70);
/* DUE STRADE PER LA STESSA STRINGA, e nel markup non c'è modo di scriverla una volta
   sola: quindi le lega una prova, come per i token di blocco e per l'etichetta dei
   marcatori degli eventi. */
p('description e og:description sono la stessa stringa', !!DESCR && DESCR===OGD);
p('il canonical e og:url sono lo stesso indirizzo'+(CANON?' ('+CANON+')':''),
  !!CANON && CANON===OGU && /^https:\/\//.test(CANON));
p('og:type e twitter:card dichiarati', contenuto('og:type')==='website' &&
  /summary/.test(contenuto('twitter:card')||''));

/* ══ L'IMMAGINE DICHIARATA DEVE ESSERE QUELLA CHE IL JOB PRODUCE ══
   Scritto il 27 agosto 2026, dopo il difetto peggiore che questa pagina abbia avuto: la card
   scaricata diceva 12 · 55 · 53 e l'anteprima del link 12 · 57 · 51, con la data di tre giorni
   prima. DUE IMMAGINI DELLA STESSA PAGINA CON NUMERI DIVERSI, nella stessa conversazione.
   LA CAUSA NON ERA UNA CACHE, ed è la prima cosa che il controllo dei dieci secondi ha detto:
   rigenerando, anteprima.mjs ha risposto «scritta» e non «identica, non riscritta».
   L'immagine sul server era vecchia perché NESSUNO LA GENERAVA. .github/scripts/anteprima.mjs
   esisteva, era provato, aveva le sue due guardie — e non era invocato da nessuna parte: né dal
   workflow né da uno script di npm. È stato eseguito a mano due volte in tutta la sua vita,
   mentre l'archivio andava avanti ogni notte e og:title con lui.
   NESSUNA PROVA POTEVA ACCORGERSENE, ed è la forma di sempre: png.js e meta.js provavano che
   l'immagine fosse giusta, e lo era — provata sulla sua COMPOSIZIONE, mai sulla sua CONSEGNA.
   Un file corretto che nessuno scrive è indistinguibile da un file corretto, finché non lo si
   guarda dal lato di chi lo riceve.
   Quindi il controllo non guarda l'immagine: guarda il LEGAME. Il file che index.html dichiara
   come og:image dev'essere (1) rigenerato da un passo del lavoro notturno e (2) messo in scena
   nello STESSO «git add» dell'archivio che racconta. La seconda metà è quella che conta: in un
   commit a parte i due divergerebbero di una notte, che è precisamente il difetto.
   E vale per l'og:image di domani e non per anteprima.png: il percorso si ricava dalla meta. */
await (async function(){
 const ogimg=contenuto('og:image');
 if(!ogimg){ na('og:image non è dichiarata: non c\'è nessuna immagine da tenere allineata'); return; }
 /* il percorso nel repository si ricava dall'indirizzo, non si riscrive qui */
 /* L'IMPRONTA VA TOLTA PRIMA DI CERCARE IL FILE. Dal 29 agosto 2026 og:image porta
    «?v=<hash>», che e' una chiave di cache e non fa parte del percorso: il file su disco si
    chiama sempre dati/anteprima.png. Senza questa riga i tre controlli qui sotto cadevano
    tutti e tre — e cadevano dicendo «il file non esiste», che e' vero della stringa e falso
    del repository. L'attesa non e' cambiata, e' cambiato l'indirizzo da cui si ricava. */
 const senzaV = ogimg.split('?')[0];
 const rel=CANON&&senzaV.indexOf(CANON)===0?senzaV.slice(CANON.length).replace(/^\//,''):null;
 if(!rel){ p('og:image sta sotto il canonical, quindi è un file di questo repository ('+ogimg+')',false); return; }
 p('il file dichiarato in og:image esiste nel repository ('+rel+')', existsSync(join(qui,'..',rel)));
 let load; try{ load=(await import('js-yaml')).load; }
 catch(e){ p('og:image: js-yaml non installato',false); return; }
 let generato=false, inScena=false, conArchivio=false, dove='';
 let srcGen='';
 for(const f of readdirSync(join(qui,'..','.github','workflows'))){
  if(!/\.ya?ml$/.test(f)) continue;
  const doc=load(readFileSync(join(qui,'..','.github','workflows',f),'utf8'));
  for(const j of Object.values((doc&&doc.jobs)||{})){
   const run=((j&&j.steps)||[]).filter(x=>typeof x.run==='string').map(x=>x.run);
   /* 1 · QUALCUNO LO GENERA. Si risale allo script dai comandi del job e si guarda che quello
      script scriva davvero quel percorso: un passo che invocasse il file sbagliato passerebbe
      un controllo fatto sul solo nome del comando. */
   for(const r of run) for(const m of r.matchAll(/node\s+(\.github\/scripts\/[\w.-]+\.mjs)/g)){
    const src=join(qui,'..',m[1]);
    if(existsSync(src)&&readFileSync(src,'utf8').indexOf(rel.split('/').pop())>=0){
     generato=true; dove=f+' · '+m[1];
     srcGen=src;
    }
   }
   /* 2 · E STA NELLO STESSO «git add» DELL'ARCHIVIO. È la metà che chiude il difetto:
      generarlo e committarlo a parte li farebbe divergere di una notte. */
   for(const r of run) for(const riga of r.split('\n')){
    if(!/^\s*git add\b/.test(riga)) continue;
    if(riga.indexOf(rel)>=0){ inScena=true; if(/dati\/archivio\.json/.test(riga)) conArchivio=true; }
   }
  }
 }
 p('l\'immagine di og:image la RIGENERA il lavoro notturno'+(dove?' ('+dove+')':''), generato);
 p('e finisce nello stesso «git add» di dati/archivio.json, così l\'immagine e i numeri che '+
   'racconta non possono divergere di una notte', inScena&&conArchivio);
 /* 3 · E IL SUO PUNTO D'INGRESSO FUNZIONA SUL RUNNER, NON SOLO SU CHI LO SCRIVE.
    Il 28 agosto 2026 il passo e' andato VERDE stampando ZERO righe. La guardia «sono il
    modulo principale» componeva l'indirizzo a mano concatenando «file:///» con argv[1]:
    su Windows argv[1] e' «C:...» e il risultato e' esattamente import.meta.url, su Linux
    il percorso comincia GIA' con una barra e ne veniva una di troppo. Quindi sul runner il
    confronto era falso, il blocco non partiva, e lo script usciva 0 SENZA SCRIVERE NIENTE —
    ogni notte, mentre i blocchi passavano da 53·55·12·0 a 48·55·12·5.
    I punti 1 e 2 erano verdi tutti e due, ed e' questa la lezione: uno guarda che il job LO
    INVOCHI, l'altro che il file sia messo in scena, e nessuno dei due guarda se
    l'invocazione FACCIA qualcosa. Le due generazioni della sua vita erano a mano, da
    Windows: la sola piattaforma su cui quella guardia funziona.
    Si legge LA RIGA, non il sorgente intero: il commento qui sopra nomina «file:///», e una
    prova che contasse le occorrenze nel sorgente crudo resterebbe verde per colpa del
    commento che la spiega — trappola gia' pagata da questo progetto con ARCO_ORD. */
 const rigaIng=(srcGen?readFileSync(srcGen,'utf8'):'').split(NL)
   .find(function(l){return l.indexOf('if (import.meta.url')===0;})||'';
 p('e riconosce il proprio punto d' + String.fromCharCode(39) + 'ingresso con pathToFileURL, '+
   'invece di comporre «file:///» a mano, che vale solo su Windows',
   !!srcGen && rigaIng.indexOf('pathToFileURL(process.argv[1])')>=0);
})();

/* ══ I QUALIFICATORI DI og:image VENGONO DOPO L'IMMAGINE CHE DESCRIVONO ══
   Nel protocollo Open Graph una proprietà strutturata — og:image:width, :height, :alt — si
   lega all'og:image che la PRECEDE. Il 29 agosto 2026, spostando og:image dentro la regione
   del lavoro notturno, i tre qualificatori sono rimasti sopra e sono diventati orfani:
   dichiaravano larghezza, altezza e testo alternativo di nessuna immagine.
   NESSUNA PROVA CADEVA e la pagina si leggeva benissimo — e i due che si perdevano sono
   proprio quelli con cui WhatsApp decide la scheda grande, cioè il difetto stava DENTRO la
   riparazione del difetto che si era lì a chiudere. Trovato guardando l'ordine delle meta
   nella pagina servita, non dal banco.
   Si prova l'ordine e non la posizione: qualunque qualificatore, anche uno aggiunto domani,
   deve stare dopo la sua immagine. */
{
  const iImg = html.indexOf('<meta property="og:image" ');
  const orfani = [...html.matchAll(/<meta property="(og:image:[\w-]+)"/g)]
    .filter(m => iImg < 0 || m.index < iImg).map(m => m[1]);
  p('i qualificatori di og:image vengono DOPO og:image, o si legano a nessuna immagine' +
    (orfani.length ? ' (orfani: ' + orfani.join(', ') + ')' : ''),
    iImg >= 0 && orfani.length === 0);
}

/* ══ LA REGIONE CHE IL LAVORO NOTTURNO PUÒ RISCRIVERE ══
   Prima la regola era «il job tocca solo dati/», ed era anche il segnale d'allarme: un
   commit notturno su index.html era per definizione un'anomalia. og:title deve dire lo
   stato del modello a chi non esegue niente, quindi la regola è stata RISCRITTA invece che
   aggirata — una regione delimitata, e dentro solo le meta dichiarate.
   Due metà. La prima gira sempre: i marcatori ci sono, una volta sola, nell'ordine giusto,
   e dentro non c'è nient'altro che l'elenco ammesso. La seconda gira solo dentro il job,
   perché solo lì esiste un commit notturno da giudicare — e il fatto che si sia svolta o
   no viene STAMPATO, perché una prova che si salta in silenzio è una prova che non c'è. */
const M_INI='<!-- ══ META DELLO STATO · INIZIO';
const M_FIN='<!-- ══ META DELLO STATO · FINE ══ -->';
const iIni=html.indexOf(M_INI), iFin=html.indexOf(M_FIN);
p('i marcatori delle meta dello stato ci sono, una volta sola e nell\'ordine giusto',
  iIni>=0 && iFin>iIni && html.split(M_INI).length===2 && html.split(M_FIN).length===2);
/* Dentro la regione può stare SOLO l'elenco dichiarato: se un giorno ci finisse dell'altro,
   l'eccezione smetterebbe di essere stretta senza che nessuno l'abbia riaperta. */
/* DUE, dal 29 agosto 2026, e il numero e' il punto: l'eccezione e' passata da una meta a
   due perche' og:image deve poter portare l'impronta del contenuto, e senza quella su
   WhatsApp non esiste NESSUNA leva — non ha nessuno strumento pubblico di rilettura, e
   l'anteprima e' il punto in cui piu' persone incontrano il modello. Resta la piu' stretta
   che si possa dare, e questo controllo continua a pretendere che dentro non finisca altro:
   e' l'elenco a essere cresciuto di una riga, non il permesso a essere diventato vago. */
const AMMESSE=['og:title','og:image'];
if(iIni>=0&&iFin>iIni){
  const dentro=html.slice(html.indexOf('-->',iIni)+3,iFin);
  const tag=[...dentro.matchAll(/<(\w+)[^>]*?(?:name|property)="([^"]+)"/g)];
  const fuoriElenco=tag.filter(m=>m[1]!=='meta'||AMMESSE.indexOf(m[2])<0).map(m=>m[2]);
  const resto=dentro.replace(/<meta[^>]*>/g,'').trim();
  p('nella regione delle meta dello stato c\'è solo l\'elenco dichiarato'+
    (fuoriElenco.length?' ('+fuoriElenco.join(', ')+')':'')+(resto?' [testo estraneo: '+resto.slice(0,40)+']':''),
    !fuoriElenco.length && !resto && tag.length===AMMESSE.length);
}
/* LA SECONDA METÀ. Le righe cambiate si prendono dal diff unificato a zero righe di
   contesto e si confrontano con la regione nel file di ADESSO, che è quello che verrà
   committato. Una riga toccata fuori è l'anomalia che prima era soltanto dichiarata. */
if(process.env.LAVORO_NOTTURNO){
  let verdetto=true, dett='';
  try{
    const diff=execFileSync('git',['diff','--unified=0','--','index.html'],
      {cwd:join(qui,'..'),encoding:'utf8'});
    const righe=html.split('\n');
    const nIni=righe.findIndex(r=>r.indexOf(M_INI)>=0)+1;
    const nFin=righe.findIndex(r=>r.indexOf(M_FIN)>=0)+1;
    const fuori=[];
    for(const m of diff.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)){
      const da=+m[1], quante=m[2]===undefined?1:+m[2];
      /* una cancellazione pura ha quante=0, e lì «da» è la riga PRIMA del buco: il
         confine da guardare è quella e la successiva */
      const lo=da, hi=quante?da+quante-1:da+1;
      if(lo<nIni||hi>nFin) fuori.push(lo+(hi>lo?'–'+hi:''));
    }
    verdetto=!fuori.length;
    dett=fuori.length?' — righe '+fuori.join(', ')+' fuori dalla regione '+nIni+'–'+nFin
                     :' (diff confinato nelle righe '+nIni+'–'+nFin+')';
  }catch(e){ verdetto=false; dett=' — git diff non leggibile: '+String(e.message).slice(0,60); }
  p('commit notturno: index.html cambia solo dentro i marcatori'+dett, verdetto);
} else {
  na('commit notturno: il controllo sul diff non si applica qui — LAVORO_NOTTURNO non è impostato, e fuori dal job non esiste nessun commit notturno da giudicare');
}

p('avviso di avvio presente nel markup', /id="k-boot"/.test(html));
p('viewport per mobile', /name="viewport"/.test(html));
p('lingua italiana dichiarata', /<html[^>]*lang="it"/.test(html));

console.log('\n══ STRUTTURA ══');
prove.forEach(([n,v])=>console.log(' '+(v==='na'?'··  ':v?'OK  ':'KO  ')+n));
if(prove.some(([,v])=>v!==true&&v!=='na')) process.exit(1);
