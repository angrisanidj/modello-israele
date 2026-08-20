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
console.log("── STRUTTURA DELLA TESTATA ──");
console.log(" sezioni numerate:",D.querySelectorAll('#kn26 > section').length);
console.log(" voci d'indice:",$('k-idx').querySelectorAll('a').length);
console.log(" indice: primo →",$('k-idx').querySelector('a').textContent.trim(),
            "| ultimo →",[...$('k-idx').querySelectorAll('a')].pop().textContent.trim());
console.log(" blocchi barra comandi:",D.querySelectorAll('.cmd .cb').length,
            "| gruppi parametri:",D.querySelectorAll('.pan .pg').length);
console.log(" archivio:",D.getElementById('k-datapanel-t').textContent.trim());
console.log(" hint archivio:",D.querySelectorAll('.cb .hint')[1].textContent.trim().slice(0,80)+"…");
console.log(" cursori con scala:",D.querySelectorAll('.rng .sc').length);
[...D.querySelectorAll('.rng')].forEach(r=>{
 const l=r.querySelector('label'),sc=[...r.querySelectorAll('.sc span')].map(s=>s.textContent).join(' | ');
 console.log("   "+l.textContent.trim()+"  →  "+sc);});
console.log("\n── controlli ──");
const ck={
 "indice senza scorrimento (va a capo)": /#kn26 \.idx\{overflow:visible/.test(html) && /flex-wrap:wrap/.test(html),
 "le sezioni restano 11": D.querySelectorAll('#kn26 > section').length===11,
 "pannello parametri fuori dal conteggio": D.querySelectorAll('.pan section').length===0,
 "archivio dati esplicito": /salva ed esporta/.test($('k-datapanel-t').textContent),
 "due blocchi azione con spiegazione": D.querySelectorAll('.cmd .cb .hint').length===2,
 "cursori etichettati con scala": D.querySelectorAll(".rng .sc").length===3,
 "azzera dentro i parametri": !!D.querySelector('.pgt #k-reset-par'),
 "guida richiudibile": !!D.querySelector('#k-guida summary'),
 "guida chiusa di default": !D.querySelector('#k-guida').hasAttribute('open'),
 "totale 120": Object.values(global.A.S().SEG).reduce((a,b)=>a+b,0)===120,
};
Object.entries(ck).forEach(([k,v])=>console.log(" "+(v?"OK  ":"KO  ")+k));
