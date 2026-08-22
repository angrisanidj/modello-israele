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
src=src.replace('carica().then(render,render)','global.A={render:render,emi:v=>{EMIMODE=v},S:()=>({SEG,serieModello,blocchi})};carica().then(render,render)');
eval(src);
const A=global.A;A.render();
const $=i=>D.getElementById(i);
const tx=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
console.log("── TITOLI ISTOGRAMMI ──");
console.log("  1: "+tx($('k-htit1').innerHTML));
console.log("  2: "+tx($('k-htit2').innerHTML));
console.log("\n── PROIEZIONE con affiliazione ──");
$('k-proj').innerHTML.split('</div></div>').slice(0,4).forEach(x=>{const c=tx(x);if(c)console.log("  "+c.slice(0,72));});
console.log("\n── LEGENDA DEL GRAFICO ──\n  "+tx($('k-trendleg').innerHTML));
const svg=$('k-trend').innerHTML;
console.log("\n── controlli ──");
const ck={
 "titoli istogrammi presenti": /Blocco Netanyahu/.test($('k-htit1').innerHTML)&&/Opposizione sionista/.test($('k-htit2').innerHTML),
 "affiliazione accanto alle liste": ($('k-proj').innerHTML.match(/class="blq"/g)||[]).length>=8,
 "affiliazione nei movers": ($('k-movers').innerHTML.match(/class="blq"/g)||[]).length>=8,
 "emiciclo senza righe sopra i pallini": !/stroke-width="3"/.test($('k-emi').innerHTML),
 "emiciclo 120 seggi": ($('k-emi').innerHTML.match(/r="5.4"/g)||[]).length===120,
 "grafico: tre linee del modello": (svg.match(/class="ln ln-/g)||[]).length>=3,
 "grafico: nuvola dei sondaggi": (svg.match(/class="pt pt-/g)||[]).length>100,
 "etichette finali in pastiglia": (svg.match(/<rect[^>]*rx="4"/g)||[]).length===3,
 "legenda con valori": ($('k-trendleg').innerHTML.match(/<s>/g)||[]).length===3,
 "legenda cliccabile": /data-ln=/.test($('k-trendleg').innerHTML),
 "serie parte da gennaio": A.S().serieModello()[0].d.startsWith('2026-01'),
 "totale 120": Object.values(A.S().SEG).reduce((a,b)=>a+b,0)===120,
};
require('../esito.js')(ck);
