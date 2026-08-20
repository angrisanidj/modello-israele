/* Correlazione fra liste: residui delle quote di voto rispetto alla tendenza,
   calcolati sondaggio per sondaggio sull'archivio dell'era attuale. */
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
src=src.replace('carica().then(render,render)','global.A={S:function(){return{SOND:SOND,P:P,IDS:IDS,invD:invD,DISP:DISP,nm:nm};}};carica().then(render,render)');
eval(src);
const {SOND,P,IDS,invD,DISP,nm}=global.A.S();
/* quote per sondaggio, era attuale */
const L=SOND.filter(s=>!s.pre).sort((a,b)=>a.data<b.data?-1:1);
const per=L.map(s=>{
  const sotto=s.sotto||{}; let ws=0; for(const k in sotto) ws+=sotto[k];
  const q=100-Math.max(ws,DISP);
  return {d:new Date(s.data), i:s.istituto, sh:Object.assign({},invD(s.seggi,sotto,q),sotto)};
});
const liste=IDS.filter(k=>per.filter(x=>x.sh[k]!==undefined).length>=40);
console.log("liste con almeno 40 rilevazioni:",liste.length,"·",liste.map(nm).join(", "));
/* residuo = quota − media mobile locale (finestra ±14 giorni, esclusa la rilevazione stessa) */
const res={}; liste.forEach(k=>res[k]=[]);
per.forEach((x,idx)=>{
  liste.forEach(k=>{
    if(x.sh[k]===undefined){res[k].push(null);return;}
    const vic=per.filter((y,j)=>j!==idx && y.sh[k]!==undefined && Math.abs(y.d-x.d)<=14*864e5).map(y=>y.sh[k]);
    if(vic.length<4){res[k].push(null);return;}
    res[k].push(x.sh[k]-vic.reduce((a,b)=>a+b,0)/vic.length);
  });
});
function corr(a,b){
  const A=[],B=[];
  for(let i=0;i<a.length;i++) if(a[i]!==null&&b[i]!==null){A.push(a[i]);B.push(b[i]);}
  if(A.length<30) return [null,A.length];
  const ma=A.reduce((x,y)=>x+y,0)/A.length, mb=B.reduce((x,y)=>x+y,0)/B.length;
  let sa=0,sb=0,sab=0;
  for(let i=0;i<A.length;i++){const u=A[i]-ma,v=B[i]-mb;sa+=u*u;sb+=v*v;sab+=u*v;}
  return [sab/Math.sqrt(sa*sb), A.length];
}
/* rimozione del fattore di blocco: ogni residuo viene depurato della sua
   proiezione sul residuo aggregato del proprio blocco, che il modello simula già */
const blocchiK={};
liste.forEach(k=>{ const b=P[k].b; (blocchiK[b]=blocchiK[b]||[]).push(k); });
const aggr={};
Object.keys(blocchiK).forEach(b=>{
  aggr[b]=per.map((_,i)=>{
    let s=0,n=0; blocchiK[b].forEach(k=>{ if(res[k][i]!==null){s+=res[k][i];n++;} });
    return n>=2?s:null;
  });
});
function regr(y,x){ // residuo di y depurato di x
  const I=[]; for(let i=0;i<y.length;i++) if(y[i]!==null&&x[i]!==null) I.push(i);
  if(I.length<30) return y.map(()=>null);
  const my=I.reduce((a,i)=>a+y[i],0)/I.length, mx=I.reduce((a,i)=>a+x[i],0)/I.length;
  let sxy=0,sxx=0; I.forEach(i=>{sxy+=(y[i]-my)*(x[i]-mx);sxx+=(x[i]-mx)*(x[i]-mx);});
  const b=sxx>0?sxy/sxx:0;
  return y.map((v,i)=>(v===null||x[i]===null)?null:v-my-b*(x[i]-mx));
}
const puro={};
liste.forEach(k=>{ puro[k]=regr(res[k], aggr[P[k].b]); });

console.log("\nCOPPIE DI INTERESSE — correlazione dei residui\n");
/* base meccanica: tolto l'aggregato di blocco, i membri di un blocco con m liste
   hanno correlazione media forzata di circa -1/(m-1) */
const NB={}; Object.keys(blocchiK).forEach(b=>NB[b]=blocchiK[b].length);
console.log("  numerosita dei blocchi:", Object.entries(NB).map(([b,m])=>b+" "+m+" liste (base "+(-1/(m-1)).toFixed(2)+")").join(" · "));
console.log();
console.log("  coppia                                grezza  netto  base   ECCESSO");
const coppie=[["shas","utj","haredi: stesso bacino di affluenza"],
 ["sionismo_rel","otzma","destra religiosa: stesso elettorato"],
 ["likud","otzma","Likud e Ben Gvir"],
 ["likud","sionismo_rel","Likud e Smotrich"],
 ["lista_araba","raam","liste arabe"],
 ["byachad","yashar","Bennett-Lapid ed Eisenkot"],
 ["byachad","democratici","centro e sinistra"],
 ["yashar","beitenu","Eisenkot e Lieberman"],
 ["likud","yashar","i due maggiori"]];
coppie.forEach(([a,b,lab])=>{
  if(!res[a]||!res[b]) return;
  const [r,n]=corr(res[a],res[b]);
  const [rp]=corr(puro[a],puro[b]);
  if(r===null){console.log("  "+lab.padEnd(38)+"dati insufficienti");return;}
  const barra = r>0 ? "+".repeat(Math.round(r*20)) : "−".repeat(Math.round(-r*20));
  const bp = rp===null?"   n.d.":((rp>=0?"+":"")+rp.toFixed(2));
  const stesso = P[a].b===P[b].b;
  const base = stesso ? -1/(NB[P[a].b]-1) : -0.08;
  const ecc = rp===null?null:rp-base;
  console.log("  "+lab.padEnd(38)+(r>=0?"+":"")+r.toFixed(2)+"  "+bp+"  "+base.toFixed(2)+
    "   "+(ecc===null?"n.d.":((ecc>=0?"+":"")+ecc.toFixed(2)))+"  "+
    (ecc!==null?(ecc>0?"+".repeat(Math.round(ecc*20)):"−".repeat(Math.round(-ecc*20))):""));
});
