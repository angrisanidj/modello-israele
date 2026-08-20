const {JSDOM}=require('jsdom');const dom=new JSDOM('');global.DOMParser=dom.window.DOMParser;
const store={};function El(i){return{id:i,innerHTML:'',textContent:'',style:{},className:'',dataset:{},value:'',
 classList:{toggle(){},contains(){return false},add(){},remove(){}},addEventListener(){},querySelectorAll(){return[]}};}
global.document={getElementById:i=>store[i]||(store[i]=El(i)),createElement:()=>({click(){},style:{}}),
 addEventListener(){},documentElement:{scrollTop:0},querySelectorAll(){return[]}};
global.window={addEventListener(){},requestAnimationFrame(){},pageYOffset:0,location:{protocol:'https:'},
 matchMedia:()=>({matches:false,addEventListener(){},addListener(){}}),IntersectionObserver:class{observe(){}unobserve(){}}};
global.IntersectionObserver=window.IntersectionObserver;global.getComputedStyle=()=>({getPropertyValue:()=>''});
global.Blob=function(){};global.URL={createObjectURL(){return''}};global.FileReader=function(){};global.fetch=()=>Promise.reject(0);
let src=require('fs').readFileSync('app.js','utf8');
src=src.replace('carica().then(render,render)','global.A={render:render,S:function(){return{SOND:SOND,IDS:IDS,P:P,nm:nm,invD:invD,DISP:DISP,L:L};}};carica().then(render,render)');
eval(src);
global.A.render();
const {SOND,IDS,P,nm,invD,DISP,L}=global.A.S();
const pre=SOND.filter(s=>s.pre), post=SOND.filter(s=>!s.pre);
console.log("ARCHIVIO");
console.log("  pre-fusione :",pre.length,"rilevazioni ·",pre.map(s=>s.data).sort()[0],"→",pre.map(s=>s.data).sort().pop());
console.log("  era attuale :",post.length,"rilevazioni ·",post.map(s=>s.data).sort()[0],"→",post.map(s=>s.data).sort().pop());
console.log("  nel modello oggi:",L.length,"(finestra 60 giorni:",L[L.length-1].data,"→",L[0].data+")");
console.log("\n  → nessuna rilevazione pre-fusione entra nella finestra del modello.");

console.log("\n\nLISTE INVARIATE ATTRAVERSO LA FUSIONE");
const cambiate=["yesh_atid","bennett26","byachad"];
const stabili=IDS.filter(k=>cambiate.indexOf(k)<0 &&
  pre.filter(s=>s.seggi[k]).length>=15 && post.filter(s=>s.seggi[k]).length>=15);
console.log("  "+stabili.map(nm).join(", "));

console.log("\n\nDISCONTINUITÀ ALLA FUSIONE (26 aprile 2026)");
console.log("  confronto fra le 3 settimane prima e le 3 settimane dopo\n");
const T=new Date("2026-04-26");
const A=pre.filter(s=>Math.abs(new Date(s.data)-T)<=21*864e5);
const B=post.filter(s=>Math.abs(new Date(s.data)-T)<=21*864e5);
function med(l,f){const v=l.map(f).filter(x=>x!==undefined&&x!==null).sort((a,b)=>a-b);
 return v.length?(v.length%2?v[(v.length-1)/2]:(v[v.length/2-1]+v[v.length/2])/2):null;}
console.log("  lista               prima  dopo   scarto   (n="+A.length+" vs "+B.length+")");
const sommaPre=med(A,s=>(s.seggi.yesh_atid||0)+(s.seggi.bennett26||0));
const bya=med(B,s=>s.seggi.byachad||0);
console.log("  "+"Yesh Atid+Bennett → B'Yachad".padEnd(20)+String(sommaPre).padStart(5)+String(bya).padStart(7)+
  "  "+(bya-sommaPre>=0?"+":"")+(bya-sommaPre)+"   ← la lista che cambia");
stabili.forEach(k=>{
 const a=med(A,s=>s.seggi[k]||0), b=med(B,s=>s.seggi[k]||0);
 if(a===null||b===null) return;
 console.log("  "+nm(k).padEnd(20)+String(a).padStart(5)+String(b).padStart(7)+"  "+(b-a>=0?"+":"")+(b-a));
});
