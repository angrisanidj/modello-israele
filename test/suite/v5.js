const {JSDOM}=require('jsdom');
const dom=new JSDOM('<!doctype html><html><body><div id="kn26"></div></body></html>',{pretendToBeVisual:true});
global.DOMParser=dom.window.DOMParser;
const W=dom.window,D=W.document;
const html=require('fs').readFileSync('../../index.html','utf8');
D.body.innerHTML=html.replace(/<script>[\s\S]*?<\/script>/g,'').match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
global.document=D;global.window=W;
W.matchMedia=()=>({matches:false,addEventListener(){},addListener(){}});
W.IntersectionObserver=class{observe(){}unobserve(){}};global.IntersectionObserver=W.IntersectionObserver;
W.requestAnimationFrame=f=>f();
global.getComputedStyle=()=>({getPropertyValue:()=>''});
global.Blob=function(){};global.URL={createObjectURL(){return''}};global.FileReader=function(){};
global.fetch=()=>Promise.reject(0);
let src=require('fs').readFileSync(__dirname+'/../app.js','utf8');
src=src.replace('carica().then(render,render)','global.A={render:render,idx:costruisciIndice,S:()=>({SEG,L,ESCL}),sim:v=>{SIM=v}};carica().then(render,render)');
eval(src);
global.A.sim(8000);global.A.render();global.A.idx();
const $=i=>D.getElementById(i);
const CSS=require('../css.js').carica('../../index.html');
console.log("── STRUTTURA DELLA TESTATA ──");
console.log(" sezioni numerate:",D.querySelectorAll('#kn26 > section').length);
console.log(" voci d'indice:",$('k-idx').querySelectorAll('a').length);
console.log(" indice: primo →",$('k-idx').querySelector('a').textContent.trim(),
            "| ultimo →",[...$('k-idx').querySelectorAll('a')].pop().textContent.trim());
console.log(" blocchi barra comandi:",D.querySelectorAll('.cmd .cb').length,
            "| gruppi parametri:",D.querySelectorAll('.pan .pg').length);
/* Era D.getElementById('k-datapanel-t'), un id che nel markup non esiste più: la suite
   moriva alla prima riga e il conteggio la dava 0/0, cioè verde. Il titolo sta nel
   <summary> del <details>, che è l'elemento vero. */
const datapanel=()=>D.querySelector('#k-datapanel summary');
console.log(" archivio:",datapanel().textContent.trim());
/* Una riga di STAMPA non deve poter uccidere una suite: qui ne moriva una intera perché
   il secondo .hint non esiste più. Le asserzioni stanno sotto e parlano da sé. */
console.log(" hint archivio:",[...D.querySelectorAll('.cb .hint')].map(h=>h.textContent.trim().slice(0,60)).join(" | ")||"nessuno");
console.log(" cursori con scala:",D.querySelectorAll('.rng .sc').length);
[...D.querySelectorAll('.rng')].forEach(r=>{
 const l=r.querySelector('label'),sc=[...r.querySelectorAll('.sc span')].map(s=>s.textContent).join(' | ');
 console.log("   "+l.textContent.trim()+"  →  "+sc);});
console.log("\n── controlli ──");
const ck={
 "indice senza scorrimento (va a capo)": /#kn26 \.idx\{overflow:visible/.test(html) && /flex-wrap:wrap/.test(html),
 "le sezioni restano 11": D.querySelectorAll('#kn26 > section').length===11,
 "pannello parametri fuori dal conteggio": D.querySelectorAll('.pan section').length===0,
 "archivio dati esplicito": /salva ed esporta/.test(datapanel().textContent),
 /* Era «due blocchi azione con spiegazione», cioè un CONTEGGIO: quando l'archivio dati è
    diventato un <details> a sé i blocchi sono passati da due a uno, e l'attesa è rimasta
    ferma su un numero che non descriveva più niente. La proprietà che serviva è un'altra
    e non invecchia: OGNI blocco azione porta la sua spiegazione, quanti che siano. */
 "ogni blocco azione porta la sua spiegazione":
   D.querySelectorAll('.cmd .cb').length > 0 &&
   [...D.querySelectorAll('.cmd .cb')].every(cb => {
     const h = cb.querySelector('.hint');
     return h && h.textContent.trim().length > 40;
   }),
 "cursori etichettati con scala": D.querySelectorAll(".rng .sc").length===3,
 "azzera dentro i parametri": !!D.querySelector('.pgt #k-reset-par'),
 "guida richiudibile": !!D.querySelector('#k-guida summary'),
 "guida chiusa di default": !D.querySelector('#k-guida').hasAttribute('open'),
 /* ══ LA BARRA DEI COMANDI NON PUÒ LASCIARE POSTI SCOPERTI ══
  *
  * Il fondo --hair su .cmd disegna i filetti da 1px fra le celle: si vede attraverso i
  * gap, e solo attraverso quelli finché ogni posizione è coperta. Con
  * grid-template-columns:1fr 1fr le tracce erano due SEMPRE, anche a celle dispari — e il
  * 22 agosto 2026, spostando l'archivio dati in una linguetta, le celle sono passate da
  * due a una: la seconda traccia è rimasta scoperta e quel fondo è diventato un blocco di
  * 557,5 × 119,5px accanto ad «Aggiorna i sondaggi». Misurato su browser:
  * elementFromPoint al centro del vuoto restituiva DIV.cmd, colore rgb(226,231,239),
  * cioè --hair esatto.
  *
  * QUI NON SI CONTANO LE CELLE, e non è un dettaglio: una prova che chiedesse «le tracce
  * siano tante quante le celle» andrebbe riscritta alla prossima aggiunta, esattamente
  * come la regola che ha creato il buco. Si prova la proprietà che rende il buco
  * IMPOSSIBILE per qualunque numero: nessuna griglia a tracce fisse, e celle che crescono
  * per riempire la riga.
  *
  * Le geometrie le ha prese il banco su browser, perché jsdom non fa layout — a 1265, 760
  * e 380, con una, due, tre, quattro e cinque celle: zero punti scoperti su 61.957
  * campionati, e zero sforamento del documento. */
 "la barra dei comandi non è una griglia a tracce fisse":
   [1265, 760, 380].every(w => {
     const R = CSS.regole(w);
     return CSS.prop(R, '#kn26 .cmd', 'grid-template-columns') === null &&
            /flex/.test(CSS.prop(R, '#kn26 .cmd', 'display') || '') &&
            /wrap/.test(CSS.prop(R, '#kn26 .cmd', 'flex-wrap') || '');
   }),
 "e le sue celle crescono per riempire la riga, quante che siano":
   [1265, 760, 380].every(w => {
     const f = CSS.prop(CSS.regole(w), '#kn26 .cb', 'flex');
     return f !== null && +f.trim().split(/\s+/)[0] >= 1;
   }),
 "i due pannelli prendono la riga intera senza chiedere una colonna":
   [1265, 760, 380].every(w => {
     const R = CSS.regole(w);
     return /100%/.test(CSS.prop(R, '#kn26 .cmd .pg', 'flex') || '') &&
            CSS.prop(R, '#kn26 .cmd .pg', 'grid-column') === null;
   }),
 "sotto gli 820 le celle vanno in colonna, e vale per qualunque numero":
   /100%/.test(CSS.prop(CSS.regole(760), '#kn26 .cmd .cb', 'flex-basis') || '') &&
   CSS.prop(CSS.regole(1265), '#kn26 .cmd .cb', 'flex-basis') === null,
 /* la ragione per cui il buco si vedeva: il contenitore è dipinto. Se un giorno il fondo
    sparisse, questa riga cadrebbe e chi la ripara scoprirebbe perché c'era */
 "e il fondo che disegna i filetti è ancora sul contenitore":
   /var\(--hair\)/.test(CSS.prop(CSS.regole(1265), '#kn26 .cmd', 'background') || ''),
 "totale 120": Object.values(global.A.S().SEG).reduce((a,b)=>a+b,0)===120,
};
require('../esito.js')(ck);
