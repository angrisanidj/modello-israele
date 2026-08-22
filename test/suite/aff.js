const {JSDOM}=require('jsdom');const dom=new JSDOM('');global.DOMParser=dom.window.DOMParser;
const store={};function El(i){return{id:i,innerHTML:'',textContent:'',style:{},className:'',dataset:{},value:'',
 classList:{toggle(){},contains(){return false},add(){},remove(){}},addEventListener(){},querySelectorAll(){return[]}};}
global.document={getElementById:i=>store[i]||(store[i]=El(i)),createElement:()=>({click(){},style:{}}),
 addEventListener(){},documentElement:{scrollTop:0},querySelectorAll(){return[]}};
global.window={addEventListener(){},requestAnimationFrame(){},pageYOffset:0,location:{protocol:'https:'},
 matchMedia:()=>({matches:false,addEventListener(){},addListener(){}}),IntersectionObserver:class{observe(){}unobserve(){}}};
global.IntersectionObserver=window.IntersectionObserver;global.getComputedStyle=()=>({getPropertyValue:()=>''});
global.Blob=function(){};global.URL={createObjectURL(){return''}};global.FileReader=function(){};global.fetch=()=>Promise.reject(0);
let src=require('fs').readFileSync(__dirname+'/../app.js','utf8');
src=src.replace('carica().then(render,render)','global.A={render:render,S:function(){return{SEG:SEG,MC:MC,blocchi:blocchi};},sim:function(v){SIM=v;},aff:function(v){AFF=v;},par:function(k,v){PAR[k]=v;}};carica().then(render,render)');
eval(src);
const A=global.A;A.sim(12000);
const q=(a,p)=>a[Math.floor(p*a.length)];
console.log("SCENARI ANCORATI ALLE ELEZIONI REALI\n");
console.log("scenario                  affl.  arabi  coal  opp  P(coal)  P(opp)");
[["2021 · minimo storico",-26,44.6],["2022 · tre liste",-12,53.2],
 ["implicito nei sondaggi",0,60.0],["2020 · Lista Unita piena",7,64.8]].forEach(([lab,v,aff])=>{
 A.aff(v);A.render();const S=A.S(),b=S.blocchi(S.SEG);
 console.log("  "+lab.padEnd(24),(aff+"%").padStart(5),String(b.arabo).padStart(6),
  String(b.coalizione).padStart(6),String(b.opposizione).padStart(5),
  ((100*S.MC.vC/S.MC.n).toFixed(1)+"%").padStart(8),((100*S.MC.vO/S.MC.n).toFixed(1)+"%").padStart(8));
});
A.aff(0);
console.log("\n── controlli ──");
A.aff(-26);A.render();const s1=A.S();
A.aff(0);A.render();const s0=A.S();
/* LE DUE ASSERZIONI NON POTEVANO CADERE. Erano scritte come
     console.log(" OK  totale 120 in ogni scenario:", <condizione>)
   cioè stampavano «OK» SEMPRE, con il vero o falso appeso di fianco come secondo
   argomento. Il banco conta le righe che cominciano per OK, quindi questa suite dava
   2/2 qualunque cosa succedesse: due asserzioni che non erano asserzioni. È la stessa
   forma di v5.js, che era morta e contava 0/0 — non falliscono, rispondono. */
const ck={
 "totale 120 in ogni scenario":
   Object.values(s1.SEG).reduce((a,b)=>a+b,0)===120 && Object.values(s0.SEG).reduce((a,b)=>a+b,0)===120,
 "l'affluenza bassa premia la coalizione": s1.MC.vC/s1.MC.n > s0.MC.vC/s0.MC.n
};
require('../esito.js')(ck);
