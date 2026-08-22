/* Esegue tutte le prove in test/suite e riassume. Uscita diversa da zero se una fallisce. */
import {readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const qui=dirname(fileURLToPath(import.meta.url));
execFileSync('node',[join(qui,'estrai.mjs')],{stdio:'inherit'});
const file=readdirSync(join(qui,'suite')).filter(f=>f.endsWith('.js')).sort();
let ok=0,ko=0,rotti=[];
console.log('\n══ PROVE ══');
for(const f of file){
  let out='';
  try{ out=execFileSync('node',[join(qui,'suite',f)],{encoding:'utf8',cwd:join(qui,'suite')}); }
  catch(e){ out=(e.stdout||'')+(e.stderr||''); }
  const o=(out.match(/^\s*OK\s/gm)||[]).length + (out.match(/: OK/g)||[]).length;
  const k=(out.match(/^\s*KO\s/gm)||[]).length + (out.match(/: FALLITO/g)||[]).length;
  ok+=o; ko+=k;
  /* UNA SUITE CHE MUORE CONTAVA 0/0, cioè verde. È successo a v5.js: un id scomparso dal
     markup, la prima riga che solleva, e il riassunto che non diceva niente. È la forma
     di difetto peggiore perché non fallisce, risponde — zero asserzioni non è un
     risultato, è un'assenza. */
  if(!o&&!k) rotti.push(f+': non ha prodotto nessuna asserzione — '+
    ((out.trim().split('\n').filter(x=>/Error|error/.test(x))[0]||out.trim().split('\n').pop()||'nessuna uscita').slice(0,120)));
  if(k) rotti.push(f+': '+(out.match(/^\s*KO.*$/gm)||[]).join(' | '));
  console.log('  '+f.replace('.js','').padEnd(12)+String(o).padStart(3)+'/'+(o+k)+(k?'  ←':''));
}
console.log('\n  totale '+ok+'/'+(ok+ko));
if(ko||rotti.length){ console.log('\n══ FALLITE ══'); rotti.forEach(r=>console.log('  '+r)); process.exit(1); }
