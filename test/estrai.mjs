/* Estrae il JavaScript da index.html in test/app.js, che le prove caricano.
   Va rieseguito dopo ogni modifica a index.html. */
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const qui=dirname(fileURLToPath(import.meta.url));
const html=readFileSync(join(qui,'..','index.html'),'utf8');
const blocchi=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
if(!blocchi.length){console.error('Nessun blocco <script> in index.html');process.exit(1);}
writeFileSync(join(qui,'app.js'),blocchi[blocchi.length-1]);
console.log('app.js estratto ·',(blocchi[blocchi.length-1].length/1024).toFixed(0),'KB');
