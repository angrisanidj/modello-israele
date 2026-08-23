/* Verifica del contrasto e dei colori di lista: rende i grafici in tema chiaro e in
   tema scuro, poi asserisce che nessun testo negli SVG scenda sotto il rapporto 4,5
   contro il proprio fondo, e che due liste non condividano mai lo stesso colore.

   Il fondo di ogni testo non si dà per scontato: si risolve geometricamente, cercando
   l'ultima forma piena dipinta prima del testo che ne contiene il punto di ancoraggio.
   Un'etichetta dentro una pastiglia colorata ha per fondo la pastiglia, non il pannello. */
const {JSDOM}=require('jsdom');
const fs=require('fs');
const dom=new JSDOM('');global.DOMParser=dom.window.DOMParser;
let ok=0,ko=0;
function esito(cond,desc,dettaglio){
 if(cond){ ok++; console.log('OK '+desc); }
 else{ ko++; console.log('KO '+desc+(dettaglio?' — '+dettaglio:'')); }
}

/* ── la tavolozza si legge da index.html: se cambia lì, cambia anche qui ── */
const html=fs.readFileSync('../../index.html','utf8');
function vars(b){const o={};for(const m of b.matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{3,8})/g))o[m[1]]=m[2];return o;}
const LIGHT=vars(html.match(/#kn26\{([\s\S]*?)\n\}/)[1]);
const DARKV=Object.assign({},LIGHT,vars(html.match(/#kn26\.scuro\{([\s\S]*?)\}/)[1]));

let DARK=false;
const store={};
/* attributi veri e non finto silenzio: vedi il commento in aff.js e il punto 13 */
function El(id){return{id,innerHTML:'',textContent:'',style:{},className:'',dataset:{},attr:{},setAttribute(k,v){this.attr[k]=v;},getAttribute(k){return k in this.attr?this.attr[k]:null;},removeAttribute(k){delete this.attr[k];},hidden:false,disabled:false,
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
let src=fs.readFileSync(__dirname+'/../app.js','utf8');
src=src.replace('carica().then(render,render)','global.A={render:render,sim:v=>{SIM=v}};carica().then(render,render)');
eval(src);
global.A.sim(3000);

/* ── colore → contrasto ── */
function rgb(c){c=String(c).trim();
 let m=/^#?([0-9a-fA-F]{6})$/.exec(c);
 if(m){const n=parseInt(m[1],16);return[(n>>16)&255,(n>>8)&255,n&255];}
 m=/^#?([0-9a-fA-F]{3})$/.exec(c);
 if(m){return[0,1,2].map(i=>parseInt(m[1][i]+m[1][i],16));}
 m=/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/.exec(c); if(m)return[+m[1],+m[2],+m[3]];
 return null;}
function lum(t){const f=x=>{x/=255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4)};
 return .2126*f(t[0])+.7152*f(t[1])+.0722*f(t[2]);}
function contrasto(a,b){const A=rgb(a),B=rgb(b);if(!A||!B)return null;
 const x=lum(A),y=lum(B);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}

/* ── lettura degli SVG ── */
function att(t,n){const s=" "+t, i=s.indexOf(" "+n+"=\""); if(i<0) return null; const r=s.slice(i+n.length+3), j=r.indexOf("\""); return j<0?null:r.slice(0,j);}
function nu(t,n,d){const v=att(t,n);const x=parseFloat(v);return v===null||isNaN(x)?d:x;}
function forme(svg){
 /* solo forme piene e opache: una campitura semitrasparente non definisce il fondo */
 const out=[];
 for(const m of svg.matchAll(/<(rect|circle)\b[^>]*>/g)){
  const t=m[0],f=att(t,'fill');
  if(!f||f==='none'||/url\(/.test(f)) continue;
  if(nu(t,'opacity',1)*nu(t,'fill-opacity',1)<0.9) continue;
  if(m[1]==='rect') out.push({i:m.index,f,tipo:'r',x:nu(t,'x',0),y:nu(t,'y',0),w:nu(t,'width',0),h:nu(t,'height',0)});
  else out.push({i:m.index,f,tipo:'c',cx:nu(t,'cx',0),cy:nu(t,'cy',0),r:nu(t,'r',0)});
 }
 return out;
}
function fondoDi(F,x,y,prima){
 let res=null;
 for(const s of F){
  if(s.i>=prima) break;                       // dipinta dopo il testo: non gli sta sotto
  if(s.tipo==='r'){ if(x>=s.x&&x<=s.x+s.w&&y>=s.y&&y<=s.y+s.h) res=s.f; }
  else if(Math.hypot(x-s.cx,y-s.cy)<=s.r) res=s.f;
 }
 return res;
}
const GRAFICI=['k-trend','k-hist','k-hist2','k-emi','k-proj','k-power','k-movers'];

/* ══ 1 · contrasto del testo nei due temi ══ */
[['chiaro',false],['scuro',true]].forEach(([nome,d])=>{
 DARK=d; global.A.render();
 const pannello=(d?DARKV:LIGHT).card;          // i grafici stanno dentro .box, fondo --card
 let esaminati=0,saltati=0; const bassi=[];
 for(const id of GRAFICI){
  const svg=store[id].innerHTML, F=forme(svg);
  for(const m of svg.matchAll(/<text\b[^>]*>/g)){
   const t=m[0], fill=att(t,'fill');
   if(!fill||fill==='none'||/url\(/.test(fill)){ saltati++; continue; }
   const fondo=fondoDi(F,nu(t,'x',0),nu(t,'y',0),m.index)||pannello;
   const k=contrasto(fill,fondo);
   if(k===null){ saltati++; continue; }
   esaminati++;
   /* WCAG 2.1: 4,5 per il testo normale, 3 dal testo grande in su —
      24px, oppure 18,66px se in grassetto. Prima la prova usava 4,5 per tutto,
      cioè era piu severa dello standard sui numeri a corpo grande. */
   const px=parseFloat(att(t,'font-size'))||12;
   const pw=att(t,'font-weight'), bold=pw!==null&&(pw==='bold'||parseFloat(pw)>=700);
   const soglia=(px>=24||(bold&&px>=18.66))?3:4.5;
   if(k<soglia) bassi.push({id,fill,fondo,k,soglia,fs:att(t,'font-size')});
  }
 }
 esito(esaminati>0,'tema '+nome+': i grafici emettono testo da esaminare ('+esaminati+' elementi)',
       'nessun <text> trovato: la prova non starebbe verificando nulla');
 esito(saltati===0,'tema '+nome+': ogni testo ha un colore risolvibile',
       saltati+' testi saltati, il contrasto non è stato verificato su di loro');
 let dett='';
 if(bassi.length){
  const agg={};
  bassi.forEach(b=>{const c=b.id+' · '+b.fill+' su '+b.fondo+' · '+b.fs+'px · rapporto '+b.k.toFixed(2)+' (soglia '+b.soglia+')';
   agg[c]=(agg[c]||0)+1;});
  dett=bassi.length+' testi sotto 4,5: '+Object.entries(agg).sort((a,b)=>b[1]-a[1])
    .map(([c,n])=>n+'× '+c).join(' | ');
 }
 esito(bassi.length===0,'tema '+nome+': nessun testo sotto la soglia WCAG sul proprio fondo',dett);
});

/* ══ 2 · i colori di lista sono tutti distinti ══ */
const blocco=html.match(/var P=\{([\s\S]*?)\n\};/)[1];
const liste=[...blocco.matchAll(/^\s*([a-z0-9_]+)\s*:\{n:"([^"]*)"[\s\S]*?c:"(#[0-9a-fA-F]{6})"/gm)]
 .map(m=>({id:m[1],n:m[2],c:m[3].toLowerCase()}));
esito(liste.length>=15,'la tavolozza delle liste è stata letta ('+liste.length+' liste)',
      'lette solo '+liste.length+' liste: il parser di var P non aggancia più');

/* Le liste alternative condividono lo slot e quindi il colore, per costruzione:
   B'Yachad nasce dalla fusione di Yesh Atid e Bennett 2026, la Lista Unita da
   Hadash-Ta'al e Balad. È corretto finché non coesistono — e non coesistono mai —
   quindi la distinzione si verifica solo fra liste che possono comparire insieme.
   Che coesistano davvero è compito della guardia in index.html, non di questa prova. */
const ALTERNATIVE=[['byachad',['yesh_atid','bennett26']],['lista_araba',['hadash_taal','balad']]];
function coesistono(a,b){
 for(const [x,ys] of ALTERNATIVE){
  if(a===x&&ys.includes(b)) return false;
  if(b===x&&ys.includes(a)) return false;
 }
 return true;
}
const PAL_SCURO=(function(){const o={};const m=html.match(/var PAL_SCURO=\{([\s\S]*?)\n\};/);
 if(m) for(const r of m[1].matchAll(/"(#[0-9A-Fa-f]{6})"\s*:\s*"(#[0-9A-Fa-f]{6})"/g)) o[r[1].toUpperCase()]=r[2];
 return o;})();
function schiarisci(c,q){const t=rgb(c);return 'rgb('+t.map(x=>Math.round(x+(255-x)*q)).join(',')+')';}
function scuroDi(c){return PAL_SCURO[c.toUpperCase()]||schiarisci(c,0.40);}
[['chiaro',c=>c],['scuro',scuroDi]].forEach(([nome,tr])=>{
 const visti={},doppi=[];
 for(const L of liste){
  const chiave=String(rgb(tr(L.c)));
  if(visti[chiave]){ if(coesistono(visti[chiave],L.id)) doppi.push(visti[chiave]+' e '+L.id+' → '+tr(L.c)); }
  else visti[chiave]=L.id;
 }
 esito(doppi.length===0,'tema '+nome+': i colori delle liste sono tutti distinti fra loro',
       doppi.join(' | '));
});

if(ko) process.exitCode=1;
