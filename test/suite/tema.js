/* verifica del contrasto: rende in tema chiaro e in tema scuro, poi controlla che
   nessun colore emesso nei grafici sia troppo vicino allo sfondo */
const {JSDOM}=require('jsdom');
const dom=new JSDOM('');global.DOMParser=dom.window.DOMParser;
let DARK=false;
const LIGHT={ink:'#0B1B33',ink2:'#3A4A63',mute:'#7C8AA0',hair:'#DCE4EF',hair2:'#EDF1F7',
 paper:'#FBFCFE',card:'#FFFFFF',wash:'#F2F6FB',coal:'#0038B8',oppo:'#0E8388',arab:'#3E7A4A',
 inc:'#94A3B8',pos:'#0F7A52',neg:'#B3261E',acc:'#0038B8'};
const DARKV={ink:'#E8EEF7',ink2:'#AFBDD1',mute:'#78889F',hair:'#22304A',hair2:'#18253A',
 paper:'#0A1220',card:'#101C2E',wash:'#152238',coal:'#6BA3F5',oppo:'#37B3B3',arab:'#69B078',
 inc:'#64748B',pos:'#4FBF8B',neg:'#F08A82',acc:'#6BA3F5'};
const store={};
function El(id){return{id,innerHTML:'',textContent:'',style:{},className:'',dataset:{},disabled:false,
 classList:{toggle(){},contains(){return false},add(){},remove(){}},
 addEventListener(){},querySelectorAll(){return[]},value:''};}
global.document={getElementById:id=>store[id]||(store[id]=El(id)),createElement:()=>({click(){},style:{}}),
 addEventListener(){},documentElement:{scrollTop:0},querySelectorAll(){return[]}};
global.window={addEventListener(){},requestAnimationFrame(){},pageYOffset:0,
 matchMedia:q=>({matches:DARK,addEventListener(){},addListener(){}}),IntersectionObserver:class{observe(){}unobserve(){}}};
global.IntersectionObserver=class{observe(){}unobserve(){}};
global.getComputedStyle=()=>({getPropertyValue:n=>(DARK?DARKV:LIGHT)[n.replace('--','')]||''});
global.Blob=function(){};global.URL={createObjectURL(){return''}};global.FileReader=function(){};
global.fetch=()=>Promise.reject(0);
let src=require('fs').readFileSync(__dirname+'/../app.js','utf8');
src=src.replace('carica().then(render,render)','global.A={render:render,sim:v=>{SIM=v}};carica().then(render,render)');
eval(src);
global.A.sim(3000);

function lum(c){
 let r,g,b;
 let m=/^#?([0-9a-f]{6})$/i.exec(c);
 if(m){const n=parseInt(m[1],16);r=(n>>16)&255;g=(n>>8)&255;b=n&255;}
 else{m=/rgb\((\d+),(\d+),(\d+)\)/.exec(c); if(!m) return null; r=+m[1];g=+m[2];b=+m[3];}
 const f=x=>{x/=255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4);};
 return .2126*f(r)+.7152*f(g)+.0722*f(b);
}
function contrasto(a,b){const A=lum(a),B=lum(b);if(A===null||B===null)return null;
 return (Math.max(A,B)+.05)/(Math.min(A,B)+.05);}

[["CHIARO",false],["SCURO",true]].forEach(([nome,d])=>{
 DARK=d; global.A.render();
 const svg=['k-trend','k-hist','k-hist2','k-emi','k-proj','k-power','k-movers']
   .map(i=>store[i].innerHTML).join('');
 const bg=(d?DARKV:LIGHT).paper;
 const colori=[...new Set([...svg.matchAll(/(?:fill|stroke)="((?:#|rgb)[^"]*)"/g)].map(m=>m[1]))]
   .filter(c=>c!=='none');
 const bassi=colori.map(c=>({c,k:contrasto(c,bg)})).filter(x=>x.k!==null&&x.k<1.6);
 console.log(`\n── TEMA ${nome} ── sfondo ${bg} · ${colori.length} colori distinti nei grafici`);
 if(bassi.length){console.log("  ⚠ contrasto insufficiente:");bassi.forEach(x=>console.log("   ",x.c,"rapporto",x.k.toFixed(2)));}
 else console.log("  nessun colore sotto la soglia di leggibilità (rapporto 1,6)");
 const peggiori=colori.map(c=>({c,k:contrasto(c,bg)})).filter(x=>x.k).sort((a,b)=>a.k-b.k).slice(0,3);
 console.log("  i tre più deboli:",peggiori.map(x=>x.c+" ("+x.k.toFixed(1)+")").join(", "));
});
