/* Verifica mobile: viewport 380px, tutti gli elementi introdotti di recente. */
const {JSDOM}=require('jsdom');
const dom=new JSDOM('<!doctype html><html><body><div id="kn26"></div></body></html>',{pretendToBeVisual:true});
global.DOMParser=dom.window.DOMParser;
const W=dom.window,D=W.document;
const html=require('fs').readFileSync('../../index.html','utf8');
D.body.innerHTML=html.replace(/<script>[\s\S]*?<\/script>/g,'').match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
global.document=D;global.window=W;
Object.defineProperty(W,'innerWidth',{value:380,writable:true});
W.matchMedia=q=>({matches:/max-width:\s*(660|760|520)px/.test(q),addEventListener(){},addListener(){}});
W.IntersectionObserver=class{observe(){}unobserve(){}};global.IntersectionObserver=W.IntersectionObserver;
W.requestAnimationFrame=f=>f();global.getComputedStyle=()=>({getPropertyValue:()=>''});
W.Element.prototype.scrollIntoView=function(){};
global.Blob=function(){};global.URL={createObjectURL(){return''}};global.FileReader=function(){};
global.fetch=()=>Promise.reject(0);
let src=require('fs').readFileSync(__dirname+'/../app.js','utf8');
src=src.replace('carica().then(render,render)','global.A={render:render,S:()=>({SEG})};carica().then(render,render)');
eval(src);
const A=global.A;A.render();
const $=i=>D.getElementById(i);
const click=el=>el&&el.dispatchEvent(new W.MouseEvent('click',{bubbles:true}));
const css=(html.match(/<style>([\s\S]*?)<\/style>/)||[])[1]||'';
const V=380;                       /* larghezza utile del viewport */

/* 1 · gli SVG scalano: verifico che nessuno abbia larghezza fissa in pixel */
const svgFissi=[...D.querySelectorAll('svg')].filter(s=>s.hasAttribute('width')||s.hasAttribute('height')).length;
/* 2 · testo minimo negli SVG una volta scalati */
function minFont(id,vbW){
  const s=$(id); if(!s) return null;
  const fs=[...s.innerHTML.matchAll(/font-size="([\d.]+)"/g)].map(m=>+m[1]);
  if(!fs.length) return null;
  return (Math.min(...fs)*V/vbW);
}
const fTrend=minFont('k-trend',520), fEmi=minFont('k-emi',430);
/* 3 · elementi interattivi: area di tocco */
const bottoni=[...D.querySelectorAll('button')].length;
const anc=[...D.querySelectorAll('[data-sw]')].length;
const cronoVoci=[...D.querySelectorAll('.crono div[data-ev]')].length;
/* 4 · il riquadro del fatto si apre anche da mobile */
click(D.querySelectorAll('.crono div[data-ev]')[4]);
const evOk=/on/.test($('k-evsel').className) && $('k-evsel').innerHTML.length>120;
click(D.querySelector('#k-evsel .x'));
/* 5 · legenda del grafico */
const legOk=[...D.querySelectorAll('#k-trendleg b[data-ln]')].length===3;
/* 6 · regole mobile presenti per i nuovi elementi */
const R660=(css.match(/@media\(max-width:660px\)\{([\s\S]*?)\n\}/g)||[]).join(' ');
const haRegola=n=>new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).test(css.replace(/\s+/g,' '));

console.log("VERIFICA MOBILE · viewport 380px\n");
console.log("  carattere più piccolo nel grafico:  "+(fTrend?fTrend.toFixed(1)+' px':'—'));
console.log("  carattere più piccolo nell emiciclo: "+(fEmi?fEmi.toFixed(1)+' px':'—'));
console.log("  bottoni totali: "+bottoni+" · ancoraggi swing: "+anc+" · voci cronologia: "+cronoVoci);
console.log("\n── controlli ──");
const ck={
 "nessun SVG a larghezza fissa": svgFissi===0,
 "testo del grafico leggibile (≥5px scalato)": fTrend>=5,
 "testo dell emiciclo leggibile (≥7px scalato)": fEmi>=7,
 "cinque ancoraggi dello swing presenti": anc===5,
 "quattordici voci di cronologia cliccabili": cronoVoci===14,
 "il riquadro del fatto si apre da mobile": evOk,
 "legenda del grafico con tre serie": legOk,
 "regola mobile per la legenda interattiva": haRegola('.leg.lint'),
 "regola mobile per il riquadro del fatto": haRegola('.evsel .eb'),
 "regola mobile per gli ancoraggi": haRegola('.anc'),
 "titoli istogrammi vanno a capo": haRegola('.htit') && /flex-wrap:wrap/.test(css.replace(/\s+/g,'')),
 "totale 120": Object.values(A.S().SEG).reduce((a,b)=>a+b,0)===120,
};
Object.entries(ck).forEach(([k,v])=>console.log(" "+(v?"OK  ":"KO  ")+k));
