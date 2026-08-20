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
 "quattro celle nella stessa griglia": D.querySelectorAll('.cmd > div').length===4,
 "colonne uguali (filetti allineati)": /#kn26 \.cmd\{[^}]*grid-template-columns:1fr 1fr/.test(css),
 "calendario a 6 colonne": /#kn26 \.cal\{[^}]*grid-template-columns:repeat\(6,1fr\)/.test(css),
 "calendario a 3 e 2 colonne sotto": /max-width:1000px\)\{#kn26 \.cal\{grid-template-columns:repeat\(3/.test(css)
   && /max-width:660px\)\{#kn26 \.cal\{grid-template-columns:repeat\(2/.test(css),
 "emiciclo con larghezza massima": /#kn26 #k-emi\{max-width:600px/.test(css),
 "variabili scure su classe": /#kn26\.scuro\{/.test(css),
 "auto segue il sistema": /@media \(prefers-color-scheme:dark\)\{\n #kn26\.auto\{/.test(css),
 "selettore a tre stati": D.querySelectorAll('[data-tema]').length===3,
 "totale 120": Object.values(A.S().SEG).reduce((a,b)=>a+b,0)===120,
};
Object.entries(ck).forEach(([k,v])=>console.log(" "+(v?"OK  ":"KO  ")+k));
