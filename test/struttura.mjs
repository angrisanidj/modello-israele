/* Controlli strutturali sul file pubblicato: HTML bilanciato, nessun id orfano,
   nessuna funzione duplicata, dimensione entro i limiti. */
import {readFileSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const qui=dirname(fileURLToPath(import.meta.url));
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
const htmlSenzaEsenti=html.replace(/<link\s+rel="canonical"[^>]*>/g,'<link>');
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
const ancoreJS=[...js.matchAll(/<a\s[^>]*href="(https?:\/\/[^"]+)"/g)].map(m=>m[1]);
const jsSenzaAncore=js.replace(/<a\s[^>]*href="https?:\/\/[^"]+"/g,'<a ');
const urlJS=[...jsSenzaAncore.matchAll(/https?:\/\/([^'"\s\\]+)/g)].map(m=>m[1]);
const estranei=urlJS.filter(u=>!/^([a-z]+\.)?wikipedia\.org\//.test(u));
p('ogni URL assoluto nel JS è Wikipedia'+(estranei.length?' ('+estranei.slice(0,3).join(', ')+')':''),
  !estranei.length);
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

   IL NUMERO NUOVO E' RICAVATO, non scelto perché sta comodo. Misurato oggi:
     131,7 KB   il file compresso adesso (livello predefinito: 132,1)
     + 6,1 KB   l'archivio da qui al voto — 91 byte di gzip per rilevazione, misurati a
                parità di formattazione, per le 61 rilevazioni che a 0,94 al giorno
                separano oggi dal 27 ottobre, più le 8 dell'allineamento pendente di BASE
     + 30 KB    quello che resta da scrivere: embed, esportazione PNG, meta Open Graph,
                i 44px dei bersagli, il campo esito. Cinque interventi alla mediana
                misurata di 2,9 KB di gzip per commit, arrotondata per eccesso a 6
     + 10,4 KB  un commit grosso di riserva: è il più pesante degli ultimi otto
     ─────────
     = 178,6 KB, arrotondato al KB superiore

   Se il tetto viene toccato, la strada da guardare per prima NON è alzarlo di nuovo: è
   potare da BASE le 60 rilevazioni pre-fusione, che valgono 16,3 KB di caratteri e si
   perdono solo in modalità di ripiego. Vedi CLAUDE.md. */
const TETTO_GZIP=179*1024;
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
    if(!/.ya?ml$/.test(f)) continue;
    const t=readFileSync(join(qui,'..','.github','workflows',f),'utf8');
    try{
      const d=load(t);
      if(!d||!d.jobs||!Object.keys(d.jobs).length) yamlKO.push(f+': nessun job');
    }catch(e){ yamlKO.push(f+': '+String(e.message).split(/\r?\n/)[0].slice(0,90)); }
  }
}catch(e){ yamlKO.push('js-yaml non installato: npm install'); }
p('i workflow di GitHub sono YAML valido'+(yamlKO.length?' ('+yamlKO.join(' | ')+')':''),
  !yamlKO.length);

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
const AMMESSE=['og:title'];
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
