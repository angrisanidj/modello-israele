const {JSDOM}=require('jsdom');
const dom=new JSDOM('<!doctype html><html><body><div id="kn26"></div></body></html>',{pretendToBeVisual:true});
global.DOMParser=dom.window.DOMParser;
const W=dom.window,D=W.document;
const html=require('fs').readFileSync('../../index.html','utf8');
D.body.innerHTML=html.replace(/<script>[\s\S]*?<\/script>/g,'').match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
global.document=D;global.window=W;
W.matchMedia=()=>({matches:false,addEventListener(){},addListener(){}});
W.IntersectionObserver=class{observe(){}unobserve(){}};global.IntersectionObserver=W.IntersectionObserver;
W.requestAnimationFrame=f=>f();global.getComputedStyle=()=>({getPropertyValue:()=>''});
global.Blob=function(){};global.URL={createObjectURL(){return''}};global.FileReader=function(){};
global.fetch=()=>Promise.reject(0);
let src=require('fs').readFileSync(__dirname+'/../app.js','utf8');
src=src.replace('carica().then(render,render)','global.A={render:render,S:()=>({SEG,QUO,MC,EVENTI,EMIMODE,PAR,blocchi}),sim:v=>{SIM=v},par:(k,v)=>{PAR[k]=v},emi:v=>{EMIMODE=v},addPoll:o=>{SOND.push(o);}};carica().then(render,render)');
eval(src);
const A=global.A;A.sim(12000);
const $=i=>D.getElementById(i);
const tx=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
A.render();
let S=A.S();
console.log("── LISTA UNITA ATTIVA (default) ──");
console.log(" blocchi:",JSON.stringify(S.blocchi(S.SEG)),"| tot",Object.values(S.SEG).reduce((a,b)=>a+b,0));
console.log(" arabi:",Object.keys(S.SEG).filter(k=>['lista_araba','hadash_taal','balad','raam'].includes(k))
  .map(k=>k+" "+S.SEG[k]).join(", "));
console.log(" quota Lista Unita:",(S.QUO.lista_araba||0).toFixed(2)+"%");
A.par('listaunita',0);A.render();S=A.S();
console.log("\n── LISTE SEPARATE (controfattuale) ──");
console.log(" blocchi:",JSON.stringify(S.blocchi(S.SEG)),"| tot",Object.values(S.SEG).reduce((a,b)=>a+b,0));
console.log(" arabi:",Object.keys(S.SEG).filter(k=>['lista_araba','hadash_taal','balad','raam'].includes(k))
  .map(k=>k+" "+S.SEG[k]).join(", "));
A.par('listaunita',1);
// sondaggio futuro che riporta già la lista unita
A.addPoll({data:"2026-08-25",istituto:"Midgam",testata:"Canale 12",campione:500,
 seggi:{likud:23,yashar:23,byachad:14,democratici:10,beitenu:10,otzma:8,shas:7,utj:8,sionismo_rel:5,lista_araba:8,raam:4}});
A.render();S=A.S();
console.log("\n── CON UN SONDAGGIO FUTURO CHE RIPORTA GIÀ LA LISTA UNITA ──");
console.log(" arabi:",Object.keys(S.SEG).filter(k=>['lista_araba','hadash_taal','balad','raam'].includes(k))
  .map(k=>k+" "+S.SEG[k]).join(", "),"| tot",Object.values(S.SEG).reduce((a,b)=>a+b,0));
console.log("\n── EMICICLO ──");
console.log(" modalità di default:",S.EMIMODE);
console.log(" legenda:",tx($('k-emileg').innerHTML));
A.emi('partiti');A.render();
console.log(" per lista:",tx($('k-emileg').innerHTML).slice(0,90)+"…");
A.emi('blocchi');A.render();
console.log("\n── controlli ──");
S=A.S();
const ck={
 "lista unita attiva di default": !!S.PAR.listaunita,
 "Balad e Hadash-Ta'al assorbiti": !S.SEG.hadash_taal && !S.SEG.balad && S.SEG.lista_araba>0,
 "Ra'am resta separata": S.SEG.raam>0,
 "totale 120 in entrambi i casi": Object.values(S.SEG).reduce((a,b)=>a+b,0)===120,
 "evento del 19 agosto in cronologia": S.EVENTI.some(e=>e.data==='2026-08-19'&&/Lista Unita/.test(e.testo)),
 "evento visibile nel grafico": /Lista Unita/.test($('k-crono').innerHTML),
 "emiciclo per blocco di default": S.EMIMODE==='blocchi',
 "legenda mostra la composizione": /Likud/.test($('k-emileg').innerHTML)&&/Yashar/.test($('k-emileg').innerHTML),
 "blocchi separati da distacco angolare, senza righe": !/stroke-width="3"/.test($('k-emi').innerHTML),
 "bottone lista unita evidenziato": D.querySelector('[data-par="listaunita"]').classList.contains('on'),
};
Object.entries(ck).forEach(([k,v])=>console.log(" "+(v?"OK  ":"KO  ")+k));
