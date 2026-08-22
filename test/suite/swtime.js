/* Gli ancoraggi devono restringersi man mano che il voto si avvicina.
 *
 * E DAL 22 AGOSTO 2026 SEGUONO L'ORIZZONTE, NON IL CONTO ALLA ROVESCIA. Sono due
 * grandezze che coincidono finché l'archivio è fresco e divergono dal 28 ottobre: il
 * conto alla rovescia va a zero, l'orizzonte resta la distanza fra il voto e la
 * rilevazione più recente su cui la proiezione è costruita. Valutare gli ancoraggi a zero
 * giorni proporrebbe scarti quasi nulli su una proiezione che nessuno ha ricalcolato,
 * cioè una falsa precisione che cresce mentre il dato invecchia. */
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
src=src.replace('carica().then(render,render)','global.A={render:render,gg:v=>{GIORNI=v;ORIZZONTE=v},orizzonte:v=>{ORIZZONTE=v},conto:v=>{GIORNI=v},anc:rSwAnc,nota:rSwNota,S:()=>({GIORNI,ORIZZONTE,SEG,blocchi,MC,SW})};carica().then(render,render)');
eval(src);
const A=global.A;A.render();
const $=i=>D.getElementById(i);
const tx=s=>String(s||'').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
console.log("ANCORAGGI A DIVERSE DISTANZE DAL VOTO\n");
console.log("  giorni   pulsanti generati");
[68,60,45,30,15,7,2].forEach(g=>{
  A.gg(g); A.anc();
  const b=[...D.querySelectorAll('[data-sw]')].map(x=>x.textContent.trim());
  console.log("  "+String(g).padStart(5)+"    "+b.slice(1).join('  ·  '));
});
A.gg(68);A.anc();A.nota();
console.log("\n  nota a 68 giorni:\n   "+tx($('k-sw-nota').innerHTML));
A.gg(10);A.anc();A.nota();
console.log("\n  nota a 10 giorni:\n   "+tx($('k-sw-nota').innerHTML));
A.render();
console.log("\n── controlli ──");
A.gg(68);A.anc();const a68=[...D.querySelectorAll('[data-sw]')].map(x=>+x.dataset.sw);
A.gg(10);A.anc();const a10=[...D.querySelectorAll('[data-sw]')].map(x=>+x.dataset.sw);
A.render();
const ck={
 "cinque ancoraggi": a68.length===5,
 "gli ancoraggi si restringono avvicinandosi al voto": a10.every((v,i)=>v<=a68[i]+1e-9) && a10[4]<a68[4],
 "il primo resta zero": a68[0]===0 && a10[0]===0,
 "nessun valore negativo": a10.every(v=>v>=0),
 "estrapolazione limitata a 75 giorni": (()=>{A.gg(400);A.anc();
   const x=[...D.querySelectorAll('[data-sw]')].map(y=>+y.dataset.sw);A.gg(68);A.anc();
   return x[4]<6;})(),
 "nota cita i giorni correnti": /68 giorni/.test($('k-sw-nota').innerHTML)||(A.gg(68),A.nota(),/68 giorni/.test($('k-sw-nota').innerHTML)),
 /* IL 28 OTTOBRE LE DUE GRANDEZZE DIVERGONO, ed è l'unico momento in cui si vede quale
    delle due comanda. Conto alla rovescia a zero, orizzonte a quattro giorni: gli
    ancoraggi devono essere quelli di quattro giorni. Se leggessero GIORNI proporrebbero
    lo scarto di un voto che si tiene stanotte, su una proiezione vecchia di una
    settimana. */
 "a voto concluso gli ancoraggi seguono l'orizzonte, non lo zero del conto alla rovescia":
   (()=>{ A.gg(4); A.anc();
     const q=[...D.querySelectorAll('[data-sw]')].map(y=>+y.dataset.sw);
     A.conto(0); A.orizzonte(4); A.anc();
     const dopo=[...D.querySelectorAll('[data-sw]')].map(y=>+y.dataset.sw);
     A.conto(0); A.orizzonte(0); A.anc();
     const zero=[...D.querySelectorAll('[data-sw]')].map(y=>+y.dataset.sw);
     A.gg(68); A.anc();
     return dopo.every((v,i)=>Math.abs(v-q[i])<1e-9) && zero[4]<dopo[4]; })(),
 "totale 120": Object.values(A.S().SEG).reduce((a,b)=>a+b,0)===120,
};
require('../esito.js')(ck);
