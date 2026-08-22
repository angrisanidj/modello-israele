/* Controlli strutturali sul file pubblicato: HTML bilanciato, nessun id orfano,
   nessuna funzione duplicata, dimensione entro i limiti. */
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const qui=dirname(fileURLToPath(import.meta.url));
const html=readFileSync(join(qui,'..','index.html'),'utf8');
const js=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop()[1];
const prove=[];
const p=(n,v)=>prove.push([n,!!v]);

const nomi=[...js.matchAll(/^function (\w+)\(/gm)].map(m=>m[1]);
const dupl=nomi.filter((x,i)=>nomi.indexOf(x)!==i);
p('nessuna funzione duplicata'+(dupl.length?' ('+[...new Set(dupl)].join(', ')+')':''), !dupl.length);

const idJS=[...html.matchAll(/\$\('([\w-]+)'\)/g)].map(m=>m[1]);
const orfani=[...new Set(idJS)].filter(i=>!html.includes('id="'+i+'"'));
p('nessun id usato dal JS ma assente dal markup'+(orfani.length?' ('+orfani.join(', ')+')':''), !orfani.length);

p('file autonomo: nessuna risorsa esterna',
  !/(src|href)="https?:\/\//.test(html.replace(/<a [^>]*href="https?:[^"]*"/g,'')));

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
/* i collegamenti esterni non fanno cadere niente, ma vanno visti: sono l'unico posto
   della pagina da cui il lettore può uscire, e devono essere pochi e voluti */
p('i collegamenti esterni generati dal JS sono dichiarati'+
  (ancoreJS.length?' ('+[...new Set(ancoreJS)].join(', ')+')':' (nessuno)'),
  ancoreJS.every(u=>/^https:\/\//.test(u)));
const fetches=[...js.matchAll(/fetch\(\s*(['"])([^'"]*)\1/g)].map(m=>m[2]);
const fetchCattivi=fetches.filter(u=>/^https?:/.test(u)&&!/wikipedia\.org/.test(u));
p('ogni fetch con URL letterale è Wikipedia o un percorso relativo'+
  (fetchCattivi.length?' ('+fetchCattivi.join(', ')+')':''), !fetchCattivi.length);
p('dimensione sotto i 400 KB ('+(html.length/1024).toFixed(0)+' KB)', html.length<400*1024);
p('avviso di avvio presente nel markup', /id="k-boot"/.test(html));
p('viewport per mobile', /name="viewport"/.test(html));
p('lingua italiana dichiarata', /<html[^>]*lang="it"/.test(html));

console.log('\n══ STRUTTURA ══');
prove.forEach(([n,v])=>console.log(' '+(v?'OK  ':'KO  ')+n));
if(prove.some(([,v])=>!v)) process.exit(1);
