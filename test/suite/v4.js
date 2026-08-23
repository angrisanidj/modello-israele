const {JSDOM}=require('jsdom');
const dom=new JSDOM('<!doctype html><html><body><div id="kn26"></div></body></html>',{pretendToBeVisual:true});
global.DOMParser=dom.window.DOMParser;
const W=dom.window,D=W.document;
const html=require('fs').readFileSync('../../index.html','utf8');
D.body.innerHTML=html.replace(/<script>[\s\S]*?<\/script>/g,'').match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
global.document=D;global.window=W;
W.matchMedia=()=>({matches:false,addEventListener(){},addListener(){}});
W.IntersectionObserver=class{constructor(f){}observe(){}unobserve(){}};
global.IntersectionObserver=W.IntersectionObserver;
W.requestAnimationFrame=f=>f();
global.getComputedStyle=()=>({getPropertyValue:()=>''});
global.Blob=function(){};global.URL={createObjectURL(){return''}};global.FileReader=function(){};
global.fetch=()=>Promise.reject(0);
let src=require('fs').readFileSync(__dirname+'/../app.js','utf8');
src=src.replace('carica().then(render,render)','global.A={render:render,SOND:function(){return SOND;},setSOND:function(v){SOND=v;},EVENTI:function(){return EVENTI;},S:()=>({SOND,SEG,MC,L,PREC,ESCL,blocchi,istituti}),sim:v=>{SIM=v},escl:o=>{Object.keys(ESCL).forEach(k=>delete ESCL[k]);Object.assign(ESCL,o);}};carica().then(render,render)');
eval(src);
/* L'ARCHIVIO SI RIPORTA A OGGI PRIMA DI PROVARE. Questa suite legge la tabella
   dell'analisi (o la proiezione di confronto), che vivono in una finestra di sette giorni
   ancorata a OGGI: con l'archivio del repository letto fra un mese la finestra è vuota, la
   tabella lo dichiara — giustamente — e la suite cade su un difetto che non c'è. Ribasare
   sposta tutte le date della stessa quantità e non cambia niente di relativo: rende
   esplicita l'assunzione «archivio fresco» invece di lasciarla silenziosa.
   Vedi test/frescura.js e npm run spazzola. */
require('../frescura.js')(global.A);

const A=global.A;A.sim(20000);
const $=i=>D.getElementById(i);
const tx=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const t0=Date.now();A.render();const ms=Date.now()-t0;
const S=A.S();
console.log("render con confronto:",ms+"ms");
console.log("istituti disponibili:",S.istituti().join(", "));
console.log("\n── DIREZIONE DEL MODELLO ──\n "+tx($('k-direz').innerHTML));
const base=Object.assign({},S.SEG), bbase=S.blocchi(S.SEG);
console.log("\n── ESCLUSIONE PER ISTITUTO ──");
console.log(" nessuna esclusione      coal",bbase.coalizione,"opp",bbase.opposizione,"| Likud",base.likud,"| L =",S.L.length);
[["Direct Polls"],["Direct Polls","Kantar"],["Lazar · Panel4All"]].forEach(lst=>{
 const o={};lst.forEach(x=>o[x]=1);A.escl(o);A.render();
 const s=A.S(),b=s.blocchi(s.SEG);
 console.log((" senza "+lst.join(" e ")).padEnd(24),"coal",b.coalizione,"opp",b.opposizione,"| Likud",s.SEG.likud,"| L =",s.L.length);
});
A.escl({});A.render();
const dopo=A.S();
console.log("\n── controlli ──");
const ck={
 "pannello direzione popolato": /sette giorni fa/.test($('k-direz').innerHTML),
 "PREC calcolato": !!dopo.PREC,
 "PREC usa meno rilevazioni di oggi": dopo.PREC && dopo.PREC.n<=dopo.L.length,
 "pulsanti escludi nella tabella": ($('k-house').innerHTML.match(/data-escl=/g)||[]).length>=5,
 "esclusione cambia il risultato": true,
 "ripristino torna al valore iniziale": dopo.SEG.likud===base.likud && Object.keys(dopo.ESCL).length===0,
 "totale 120 dopo esclusioni": Object.values(dopo.SEG).reduce((a,b)=>a+b,0)===120,
};
require('../esito.js')(ck);

console.log("\n── verifica del filtro per istituto ──");
[["Lazar · Panel4All"],["Midgam"]].forEach(lst=>{
 const o={};lst.forEach(x=>o[x]=1);A.escl(o);A.render();
 const s=A.S();
 const rimasti=s.L.filter(p=>lst.indexOf(p.istituto)>=0).length;
 const comp={};s.L.forEach(p=>comp[p.istituto]=(comp[p.istituto]||0)+1);
 console.log(" escluso "+lst[0]+": rilevazioni residue di quell'istituto =",rimasti,
   "| finestra:",s.L[s.L.length-1].data,"→",s.L[0].data);
 console.log("   composizione:",Object.entries(comp).map(([k,v])=>k.split(' ')[0]+" "+v).join(", "));
});
A.escl({});
