const {JSDOM}=require('jsdom');
const dom=new JSDOM('<!doctype html><html><body><div id="kn26"></div></body></html>',{pretendToBeVisual:true});
global.DOMParser=dom.window.DOMParser;
const W=dom.window,D=W.document;
const html=require('fs').readFileSync('../../index.html','utf8');

const body=html.match(/<body[^>]*>([\s\S]*)<\/body>/)[1]
  .replace(/<script>[\s\S]*?<\/script>/g,'').replace(/<style>[\s\S]*?<\/style>/g,'');
D.body.innerHTML=body;
const R2=D.getElementById('kn26');
global.document=D;global.window=W;
let sysDark=false;
W.matchMedia=q=>({matches:/dark/.test(q)?sysDark:false,addEventListener(){},addListener(){}});
W.IntersectionObserver=class{observe(){}unobserve(){}};global.IntersectionObserver=W.IntersectionObserver;
W.requestAnimationFrame=f=>f();global.getComputedStyle=()=>({getPropertyValue:()=>''});
W.storage=null;
global.Blob=function(){};global.URL={createObjectURL(){return''}};global.FileReader=function(){};
global.fetch=()=>Promise.reject(0);
let src=require('fs').readFileSync(__dirname+'/../app.js','utf8');
src=src.replace('carica().then(render,render)','global.A={render:render,tema:applicaTema,S:()=>({SCURO,TEMA,SEG}),sim:v=>{SIM=v}};carica().then(render,render)');
eval(src);
const A=global.A;A.sim(6000);A.render();
const css=html.match(/<style>([\s\S]*?)<\/style>/)[1];
console.log("── SELETTORE DEL TEMA ──");
["auto","chiaro","scuro","auto"].forEach(t=>{
 A.tema(t);
 const S=A.S();
 console.log(`  ${t.padEnd(7)} → classe "${R2.className}" · SCURO=${S.SCURO} · bottone attivo: ${
   [...D.querySelectorAll('[data-tema]')].filter(b=>b.classList.contains('on')).map(b=>b.dataset.tema)}`);
});
sysDark=true; A.tema('auto');
console.log("  auto con sistema scuro → SCURO="+A.S().SCURO);
sysDark=false;
console.log("\n── controlli ──");
const ck={
 "una sola griglia per comandi e parametri": !/class="pan"/.test(html) && (html.match(/class="cmd"/g)||[]).length===1,
 /* Tre celle dal 22 agosto 2026, non più quattro: il blocco «Archivio dati» è uscito
    dalla barra dei comandi ed è diventato un <details> più in basso, attaccato al
    modulo che apre. Il comando e il suo contenuto stavano a 11.700px di distanza, e il
    pulsante non portava né aria-expanded né aria-controls né aria-pressed. */
 "tre celle nella stessa griglia": D.querySelectorAll('.cmd > div').length===3,
 "l'archivio è una linguetta, non un pulsante con un pannello altrove":
   /<details id="k-datapanel">/.test(html) && !/id="k-datapanel-t"/.test(html),
 /* Era «/#kn26 \.cmd\{[^}]*grid-template-columns:1fr 1fr/», cioè chiedeva ESATTAMENTE la
    regola che il 22 agosto 2026 si è rivelata la causa del buco: due tracce sempre, anche
    a celle dispari, e il fondo --hair del contenitore che diventa un blocco di
    557,5 × 119,5px dove nessuna cella copre. L'attesa è cambiata di proposito, e cambia
    anche di forma: quello che serve non è «due colonne uguali» ma «celle uguali fra
    loro», che è la proprietà da cui discendono i filetti allineati e che vale per
    qualunque numero di celle. Base e crescita identiche su tutte le .cb la garantiscono:
    sulla stessa riga il flex distribuisce lo spazio in parti uguali. */
 "celle uguali fra loro (filetti allineati), senza tracce fisse":
   /#kn26 \.cb\{[^}]*flex:1 1 260px/.test(css) &&
   !/#kn26 \.cmd\{[^}]*grid-template-columns/.test(css) &&
   (css.match(/#kn26 \.cb\{[^}]*flex:/g)||[]).length===1,
 /* IL CALENDARIO NON È PIÙ A GRIGLIA, dal 24 agosto 2026, e queste due attese sono state
    aggiornate nello stesso commit che l'ha cambiato. Non erano sbagliate: sono diventate
    obsolete di proposito. Sette tappe in sei tracce fisse lasciavano scoperte 5,03 colonne
    — 892,5 per 169,5 pixel di fondo --hair — e il rimedio è quello che la barra dei comandi
    aveva già trovato tre righe più sopra: flex con gap di 1px e fondo del contenitore, che
    non ha tracce e quindi non ha posizioni scoperte per nessun numero di celle.
    Quello che si prova resta lo stesso: che le celle siano uguali fra loro, che i filetti
    siano allineati e che non ci siano tracce fisse. */
 "calendario in flex, senza tracce fisse":
   /#kn26 \.cal\{[^}]*display:flex/.test(css) &&
   !/#kn26 \.cal\{[^}]*grid-template-columns/.test(css) &&
   /#kn26 \.cal>div\{flex:1 1 calc\(100%\/6 - 1px\)/.test(css),
 "calendario a 3, 2 e 1 per riga sotto, come prima":
   /max-width:1000px\)\{#kn26 \.cal>div\{flex-basis:calc\(100%\/3 - 1px\)/.test(css)
   && /max-width:660px\)\{#kn26 \.cal>div\{flex-basis:calc\(100%\/2 - 1px\)/.test(css)
   && /max-width:400px\)\{#kn26 \.cal>div\{flex-basis:100%/.test(css),
 /* e i filetti sono rimasti quello che erano: il fondo del contenitore visto attraverso
    un varco di 1px, non una proprietà della griglia */
 "i filetti del calendario sono gap e fondo, come nella barra dei comandi":
   /#kn26 \.cal\{[^}]*gap:1px[^}]*background:var\(--hair\)/.test(css) &&
   /#kn26 \.cal>div\{[^}]*background:var\(--card\)/.test(css),
 "emiciclo con larghezza massima": /#kn26 #k-emi\{max-width:600px/.test(css),
 "variabili scure su classe": /#kn26\.scuro\{/.test(css),
 "auto segue il sistema": /@media \(prefers-color-scheme:dark\)\{\n #kn26\.auto\{/.test(css),
 "selettore a tre stati": D.querySelectorAll('[data-tema]').length===3,
 "totale 120": Object.values(A.S().SEG).reduce((a,b)=>a+b,0)===120,
};
require('../esito.js')(ck);
