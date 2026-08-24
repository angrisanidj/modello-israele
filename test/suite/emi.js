/* La soglia deve separare esattamente 60 seggi. Gli angoli si ricostruiscono da
   coordinate arrotondate a 0,1 px: serve una tolleranza angolare. */
const {JSDOM}=require('jsdom');const dom=new JSDOM('');global.DOMParser=dom.window.DOMParser;
/* attributi veri e non finto silenzio: vedi il commento in aff.js e il punto 13 */
const store={};function El(i){return{id:i,innerHTML:'',textContent:'',style:{},className:'',dataset:{},attr:{},setAttribute(k,v){this.attr[k]=v;},getAttribute(k){return k in this.attr?this.attr[k]:null;},removeAttribute(k){delete this.attr[k];},hidden:false,value:'',
 classList:{toggle(){},contains(){return false},add(){},remove(){}},addEventListener(){},querySelectorAll(){return[]},querySelector(){return null;},insertAdjacentHTML(){},closest(){return null;}};}
global.document={getElementById:i=>store[i]||(store[i]=El(i)),createElement:()=>({click(){},style:{}}),
 addEventListener(){},documentElement:{scrollTop:0},querySelectorAll(){return[]}};
global.window={addEventListener(){},requestAnimationFrame(){},pageYOffset:0,location:{protocol:'https:'},
 matchMedia:()=>({matches:false,addEventListener(){},addListener(){}}),IntersectionObserver:class{observe(){}unobserve(){}}};
global.IntersectionObserver=window.IntersectionObserver;global.getComputedStyle=()=>({getPropertyValue:()=>''});
global.Blob=function(){};global.URL={createObjectURL(){return''}};global.FileReader=function(){};global.fetch=()=>Promise.reject(0);
let src=require('fs').readFileSync(__dirname+'/../app.js','utf8');
src=src.replace('carica().then(render,render)','global.A={render:render,sw:v=>{SW=v},emi:v=>{EMIMODE=v},S:()=>({SEG,blocchi})};carica().then(render,render)');
eval(src);
const TOL=1e-5;   // coordinate a due decimali: ricostruzione angolare esatta
let ok=0,tot=0;
console.log("LA SOGLIA SEPARA 60 SEGGI?\n");
console.log("  scenario          blocchi       a sinistra");
[[0,'blocchi'],[1.9,'blocchi'],[2.9,'blocchi'],[4.9,'blocchi'],[-4,'blocchi'],[-8,'blocchi'],
 [0,'partiti'],[3,'partiti'],[-6,'partiti']].forEach(([s,m])=>{
 global.A.sw(s);global.A.emi(m);global.A.render();
 const svg=store['k-emi'].innerHTML;
 const seggi=[...svg.matchAll(/cx="([\d.]+)" cy="([\d.]+)"[^>]*r="5.4"/g)]
  .map(x=>Math.atan2(212-+x[2], +x[1]-215));
 const L=svg.match(/<line x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"/);
 const aL=Math.atan2(212-+L[4], +L[3]-215);
 const sx=seggi.filter(a=>a>aL-TOL).length;
 const B=global.A.S().blocchi(global.A.S().SEG);
 tot++; if(sx===60) ok++;
 console.log("  "+(m+" swing "+s).padEnd(18)+[B.arabo,B.opposizione,B.coalizione].join('/').padEnd(12)+
  String(sx).padStart(8)+(sx===60?"  ✓":"  ✗"));
});
global.A.sw(0);global.A.emi('blocchi');global.A.render();
const svg=store['k-emi'].innerHTML;
console.log("\n── controlli ──");
const ck={
 "la soglia separa 60 seggi in ogni scenario": ok===tot,
 "120 seggi disegnati": (svg.match(/r="5.4"/g)||[]).length===120,
 "nessuna riga sopra i pallini": !/stroke-width="3"/.test(svg),
 "sigle dei blocchi sotto i numeri": /Netanyahu<\/text>/.test(svg)&&/opposizione<\/text>/.test(svg),
 "totale 120": Object.values(global.A.S().SEG).reduce((a,b)=>a+b,0)===120,
};
require('../esito.js')(ck);
