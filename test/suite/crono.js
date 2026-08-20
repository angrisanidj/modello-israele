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
W.Element.prototype.scrollIntoView=function(){};
global.Blob=function(){};global.URL={createObjectURL(){return''}};global.FileReader=function(){};
global.fetch=()=>Promise.reject(0);
let src=require('fs').readFileSync(__dirname+'/../app.js','utf8');
src=src.replace('carica().then(render,render)','global.A={render:render,S:()=>({serieModello,EVENTI})};carica().then(render,render)');
eval(src);
const A=global.A;A.render();
const $=i=>D.getElementById(i);
const tx=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const click=el=>el.dispatchEvent(new W.MouseEvent('click',{bubbles:true}));
const voci=()=>[...D.querySelectorAll('.crono div[data-ev]')];
const apri=i=>click(voci()[i]);
const chiudi=()=>{const x=D.querySelector('#k-evsel .x'); if(x) click(x);};
console.log("CRONOLOGIA CLICCABILE — "+voci().length+" fatti\n");
[0,3,7,voci().length-1].forEach(i=>{
  chiudi(); apri(i);
  console.log("  ["+(i+1)+"] "+tx($('k-evsel').innerHTML).replace('chiudi ','').slice(0,132));
});
chiudi(); apri(2);
const sel=[...D.querySelectorAll('.crono div.sel')].length;
const aperto=/on/.test($('k-evsel').className);
const testo=tx($('k-evsel').innerHTML);
chiudi();
const chiuso=!/on/.test($('k-evsel').className);
apri(1); const a1=/on/.test($('k-evsel').className);
apri(1); const a2=/on/.test($('k-evsel').className);
chiudi();
// date distinte per fatti diversi
const date=[0,5,11].map(i=>{chiudi();apri(i);return tx($('k-evsel').innerHTML).match(/\d\d\.\d\d/)[0];});
chiudi();
console.log("\n  date lette dai fatti 1, 6 e 12: "+date.join(" · "));
console.log("\n── controlli ──");
const ck={
 "tutti i fatti sono cliccabili": voci().length===A.S().EVENTI.length && voci().length>8,
 "fatti diversi mostrano date diverse": new Set(date).size===3,
 "il click apre il riquadro": aperto,
 "il fatto scelto si evidenzia": sel===1,
 "mostra i tre blocchi": /Blocco Netanyahu/.test(testo)&&/Opposizione sionista/.test(testo)&&/Partiti arabi/.test(testo),
 "mostra lo scostamento rispetto a oggi": /rispetto a oggi|invariato/.test(testo),
 "dice su quante rilevazioni": /rilevazioni disponibili quel giorno/.test(testo),
 "il pulsante chiudi lo richiude": chiuso,
 "riclickando lo stesso si richiude": a1 && !a2,
};
Object.entries(ck).forEach(([k,v])=>console.log(" "+(v?"OK  ":"KO  ")+k));
